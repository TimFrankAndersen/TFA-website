import fallbackNews from "@/data/news-days.json";
import fallbackPosts from "@/data/linkedin-posts.json";

export type Story = { h: string; p: string };
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

async function notionQueryDatabase(
  databaseId: string,
  body: Record<string, unknown>
): Promise<{ results: NotionPage[] }> {
  const res = await fetch(
    `https://api.notion.com/v1/databases/${databaseId}/query`,
    {
      method: "POST",
      headers: notionHeaders(),
      body: JSON.stringify(body),
      next: { revalidate: REVALIDATE_SECONDS },
    }
  );
  if (!res.ok) {
    throw new Error(`Notion query ${databaseId} failed: ${res.status}`);
  }
  return res.json();
}

async function notionPageBlocks(pageId: string): Promise<NotionBlock[]> {
  const res = await fetch(
    `https://api.notion.com/v1/blocks/${pageId}/children?page_size=100`,
    { headers: notionHeaders(), next: { revalidate: REVALIDATE_SECONDS } }
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
 * Section headings (heading_1/heading_2) and link paragraphs are skipped.
 */
function parseStories(blocks: NotionBlock[]): Story[] {
  const stories: Story[] = [];
  let current: Story | null = null;

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

    if (t === "heading_3") {
      // current format: heading = story headline
      current = { h: rt.map((x) => x.plain_text).join("").trim(), p: "" };
      stories.push(current);
    } else if (startsBold) {
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
      continue; // source-link paragraph
    } else if (current && !current.p) {
      current.p = rt.map((x) => x.plain_text).join("").trim();
    }
    if (stories.length >= 5 && stories[4].p) break;
  }
  return stories
    .filter((s) => s.h && s.p)
    .map((s) => ({
      // Some pipeline runs number the headlines themselves ("1. ...");
      // the site renders its own numerals, so strip any leading number.
      h: s.h.replace(/^\d+[.)]\s*/, ""),
      p: s.p,
    }))
    .slice(0, 5);
}

/**
 * Daily 5 curated AI stories, newest day first, read from the
 * "AI News English Posts" Notion database that the AI Curriculum pipeline
 * fills every morning. Falls back to bundled sample data (stamped with
 * real dates) when Notion is not configured or unreachable.
 */
export async function getNewsDays(): Promise<NewsDay[]> {
  const dbId = process.env.NOTION_NEWS_DB_ID;
  if (process.env.NOTION_API_KEY && dbId) {
    try {
      const query = await notionQueryDatabase(dbId, {
        sorts: [{ property: "Dato", direction: "descending" }],
        page_size: DAYS_SHOWN,
      });
      const today = copenhagenTodayISO();
      const days = await Promise.all(
        query.results.map(async (page): Promise<NewsDay | null> => {
          const iso = page.properties["Dato"]?.date?.start;
          if (!iso) return null;
          const stories = parseStories(await notionPageBlocks(page.id));
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
