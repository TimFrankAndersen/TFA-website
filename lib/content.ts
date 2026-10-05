import fallbackNews from "@/data/news-days.json";
import fallbackPosts from "@/data/linkedin-posts.json";

/** h = headline, p = summary, u = source link (when the page has one). */
export type Story = { h: string; p: string; u?: string };
export type NewsDay = { date: string; isToday: boolean; stories: Story[] };
export type LinkedInPost = {
  tag: "LinkedIn" | "Article";
  date: string;
  text: string;
  url: string;
};

const DAYS_SHOWN = 4; // today + up to 3 days back in the stepper
const NOTION_VERSION = "2022-06-28";
const REVALIDATE_SECONDS = 600; // refresh from Notion at most every 10 minutes

/* ------------------------------------------------------------------ */
/* Notion plumbing                                                     */
/* ------------------------------------------------------------------ */

function notionHeaders(): HeadersInit {
  return {
    Authorization: `Bearer ${process.env.NOTION_API_KEY}`,
    "Notion-Version": NOTION_VERSION,
    "Content-Type": "application/json",
  };
}

/**
 * Cache policy for a Notion read. The public site is happy with data up to
 * REVALIDATE_SECONDS old, but the daily newsletter send must never act on a
 * stale "no stories yet" answer: on days the retry pipeline rescues the
 * morning run, today's page can be only minutes old, and a cached read makes
 * the send skip the day silently. That is exactly what happened on
 * 2026-08-10. See getNewsDays({ fresh: true }).
 */
function notionCache(fresh: boolean) {
  return fresh
    ? { cache: "no-store" as const }
    : { next: { revalidate: REVALIDATE_SECONDS } };
}

async function notionQueryDatabase(
  databaseId: string,
  body: Record<string, unknown>,
  fresh = false
): Promise<{ results: NotionPage[] }> {
  const res = await fetch(
    `https://api.notion.com/v1/databases/${databaseId}/query`,
    {
      method: "POST",
      headers: notionHeaders(),
      body: JSON.stringify(body),
      ...notionCache(fresh),
    }
  );
  if (!res.ok) {
    throw new Error(`Notion query ${databaseId} failed: ${res.status}`);
  }
  return res.json();
}

async function notionPageBlocks(
  pageId: string,
  fresh = false
): Promise<NotionBlock[]> {
  const res = await fetch(
    `https://api.notion.com/v1/blocks/${pageId}/children?page_size=100`,
    { headers: notionHeaders(), ...notionCache(fresh) }
  );
  if (!res.ok) {
    throw new Error(`Notion blocks ${pageId} failed: ${res.status}`);
  }
  const json = await res.json();
  return json.results ?? [];
}

/* Minimal Notion API shapes (only what we read). */
type RichText = {
  plain_text: string;
  annotations?: { bold?: boolean };
  href?: string | null;
};
type NotionBlock = {
  type: string;
  paragraph?: { rich_text: RichText[] };
  heading_3?: { rich_text: RichText[] };
};
type NotionPage = {
  id: string;
  properties: Record<
    string,
    {
      type: string;
      date?: { start: string } | null;
      title?: RichText[];
      select?: { name: string } | null;
      url?: string | null;
    }
  >;
};

/* ------------------------------------------------------------------ */
/* Dates                                                               */
/* ------------------------------------------------------------------ */

function copenhagenTodayISO(): string {
  // Vercel runs in UTC; Tim's audience is on Copenhagen time.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Copenhagen",
  }).format(new Date());
}

function formatISODate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function formatMonthYear(iso: string): string {
  const [y, m] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-GB", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

/* ------------------------------------------------------------------ */
/* Daily 5 AI stories                                                  */
/* ------------------------------------------------------------------ */

/**
 * Parses a day-page's blocks into stories. The pipeline's page format has
 * varied over time, so BOTH known shapes are supported:
 *  - legacy: a paragraph starting with a BOLD headline (optionally followed
 *    by a plain marker like "(top)"), then a plain summary paragraph, then
 *    a link-only source paragraph.
 *  - current: a heading_3 block per headline (grouped under heading_2
 *    sections like "Top stories" / "Also today"), then a summary paragraph,
 *    then a link paragraph.
 * Section headings (heading_1/heading_2) are skipped. A link-only paragraph
 * right after a story's summary is kept as that story's source link.
 */
function parseStories(blocks: NotionBlock[]): Story[] {
  const stories: Story[] = [];
  let current: Story | null = null;
  // A source link counts only when it directly follows the summary, so a
  // stray link in the metadata below the stories is never picked up.
  let afterSummary = false;

  for (const block of blocks) {
    const t = block.type;
    const container =
      t === "paragraph"
        ? block.paragraph
        : t === "heading_3"
          ? block.heading_3
          : null;
    if (!container) continue; // skips heading_1/heading_2 section titles etc.
    const rt = container.rich_text;
    if (!rt || rt.length === 0) continue;

    const startsBold = rt[0].annotations?.bold === true;
    const allLinks = rt.every(
      (x) => x.href || x.plain_text.trim().startsWith("http")
    );

    // Stop once we have 5 COMPLETE stories (headline + summary), letting
    // through only the 5th story's own source link. Counting raw length
    // would include the bold intro line ("Today in AI - <date>"), which
    // parses as a headline-only phantom and would cut off the real 5th
    // story one block too early.
    if (stories.filter((s) => s.p).length >= 5 && !(afterSummary && allLinks)) {
      break;
    }

    if (t === "heading_3") {
      afterSummary = false;
      // current format: heading = story headline
      current = { h: rt.map((x) => x.plain_text).join("").trim(), p: "" };
      stories.push(current);
    } else if (startsBold) {
      afterSummary = false;
      // legacy format: bold-paragraph headline
      const headline = rt
        .filter((x) => x.annotations?.bold)
        .map((x) => x.plain_text)
        .join("")
        .trim();
      current = { h: headline, p: "" };
      stories.push(current);
      // Any non-bold remainder in the same paragraph is a marker like
      // "(top)" - intentionally dropped.
    } else if (allLinks) {
      // source-link paragraph: kept only as the source of the story above
      if (current && afterSummary && !current.u) {
        const href = (rt.find((x) => x.href)?.href ?? rt[0].plain_text).trim();
        if (/^https?:\/\//.test(href)) current.u = href;
      }
      afterSummary = false;
    } else if (current && !current.p) {
      current.p = rt.map((x) => x.plain_text).join("").trim();
      afterSummary = true;
    } else {
      afterSummary = false;
    }
  }
  return stories
    .filter((s) => s.h && s.p)
    .map((s) => ({
      // Pipeline quirks the site must never render (Tim's rule: nothing in
      // parentheses in headlines): strip leading self-numbering ("1. ...")
      // and trailing parenthetical markers like "(top)" / "(also today)".
      h: s.h
        .replace(/^\d+[.)]\s*/, "")
        .replace(/(\s*\([^)]*\))+\s*$/, "")
        .trim(),
      p: s.p,
      ...(s.u ? { u: s.u } : {}),
    }))
    .slice(0, 5);
}

/**
 * Daily 5 curated AI stories, newest day first, read from the
 * "AI News English Posts" Notion database that the AI Curriculum pipeline
 * fills every morning. Falls back to bundled sample data (stamped with
 * real dates) when Notion is not configured or unreachable - that keeps the
 * site rendering, but the newsletter sender must never broadcast samples as
 * today's news, so it passes `fallback: false` and gets `[]` instead.
 */
export async function getNewsDays(
  opts: { fresh?: boolean; fallback?: boolean } = {}
): Promise<NewsDay[]> {
  const fresh = opts.fresh ?? false;
  const fallback = opts.fallback ?? true;
  const dbId = process.env.NOTION_NEWS_DB_ID;
  if (process.env.NOTION_API_KEY && dbId) {
    try {
      const query = await notionQueryDatabase(
        dbId,
        {
          sorts: [{ property: "Dato", direction: "descending" }],
          page_size: DAYS_SHOWN,
        },
        fresh
      );
      const today = copenhagenTodayISO();
      const days = await Promise.all(
        query.results.map(async (page): Promise<NewsDay | null> => {
          const iso = page.properties["Dato"]?.date?.start;
          if (!iso) return null;
          const stories = parseStories(await notionPageBlocks(page.id, fresh));
          if (stories.length === 0) return null;
          return { date: formatISODate(iso), isToday: iso === today, stories };
        })
      );
      const clean = days.filter((d): d is NewsDay => d !== null);
      if (clean.length > 0) return clean;
      console.error("[content] Notion news query returned no usable days");
    } catch (err) {
      console.error("[content] Notion news fetch failed:", err);
    }
  }

  if (!fallback) return [];

  // Fallback: bundled sample days, stamped with real dates.
  const sample = fallbackNews as { stories: Story[] }[];
  const now = new Date();
  return sample.slice(0, DAYS_SHOWN).map((d, i) => {
    const date = new Date(now);
    date.setDate(now.getDate() - i);
    return {
      date: date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      isToday: i === 0,
      stories: d.stories,
    };
  });
}

/* ------------------------------------------------------------------ */
/* LinkedIn posts                                                      */
/* ------------------------------------------------------------------ */

/**
 * Tim's three latest LinkedIn posts, from the "TFA Website - LinkedIn
 * Posts" Notion database. A daily LinkedIn->RSS sync writes new posts;
 * the manual fallback is adding a row by hand (Text + Tag + Date + URL).
 */
export async function getLinkedInPosts(): Promise<LinkedInPost[]> {
  const dbId = process.env.NOTION_LINKEDIN_DB_ID;
  if (process.env.NOTION_API_KEY && dbId) {
    try {
      const query = await notionQueryDatabase(dbId, {
        sorts: [{ property: "Date", direction: "descending" }],
        page_size: 3,
      });
      const posts = query.results
        .map((page): LinkedInPost | null => {
          const text = (page.properties["Text"]?.title ?? [])
            .map((t) => t.plain_text)
            .join("")
            .trim();
          const url = page.properties["URL"]?.url ?? "";
          const iso = page.properties["Date"]?.date?.start ?? "";
          const tag =
            page.properties["Tag"]?.select?.name === "Article"
              ? ("Article" as const)
              : ("LinkedIn" as const);
          if (!text || !url) return null;
          return { tag, date: iso ? formatMonthYear(iso) : "", text, url };
        })
        .filter((p): p is LinkedInPost => p !== null);
      if (posts.length > 0) return posts;
      console.error("[content] Notion LinkedIn query returned no posts");
    } catch (err) {
      console.error("[content] Notion LinkedIn fetch failed:", err);
    }
  }
  return fallbackPosts as LinkedInPost[];
}
