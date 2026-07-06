import fallbackNews from "@/data/news-days.json";
import fallbackPosts from "@/data/linkedin-posts.json";

export type Story = { h: string; p: string };
export type NewsDay = { date: string; stories: Story[] };
export type LinkedInPost = {
  tag: "LinkedIn" | "Article";
  date: string;
  text: string;
  url: string;
};

const DAYS_BACK = 3; // how far the date stepper can browse

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/**
 * Daily 5 curated AI stories, newest day first.
 *
 * PRODUCTION (Notion): when NOTION_API_KEY + NOTION_NEWS_DB_ID are set,
 * query the AI Curriculum news database for the last DAYS_BACK+1 days,
 * grouped by date, 5 stories per day. The daily pipeline that feeds
 * aicurriculum.dk already writes these records - this site only reads.
 *
 * Until the keys are configured we serve the bundled sample days, stamped
 * with real dates so the page always looks current.
 */
export async function getNewsDays(): Promise<NewsDay[]> {
  if (process.env.NOTION_API_KEY && process.env.NOTION_NEWS_DB_ID) {
    // TODO(notion): implement once the integration is connected.
    //   const notion = new Client({ auth: process.env.NOTION_API_KEY });
    //   const res = await notion.dataSources.query({
    //     data_source_id: process.env.NOTION_NEWS_DB_ID,
    //     filter: { property: "Date", date: { on_or_after: <today - DAYS_BACK> } },
    //     sorts: [{ property: "Date", direction: "descending" }],
    //   });
    //   ...map rows to NewsDay[]
  }

  const days = fallbackNews as { stories: Story[] }[];
  const now = new Date();
  return days.slice(0, DAYS_BACK + 1).map((d, i) => {
    const date = new Date(now);
    date.setDate(now.getDate() - i);
    return { date: formatDate(date), stories: d.stories };
  });
}

/**
 * Tim's three latest LinkedIn posts.
 *
 * PRODUCTION: a daily job watches a LinkedIn->RSS feed for new posts,
 * fetches the post text and writes it to the content store (Notion DB,
 * NOTION_LINKEDIN_DB_ID). Manual fallback: paste a post URL + text into
 * the same database. This function only reads.
 */
export async function getLinkedInPosts(): Promise<LinkedInPost[]> {
  if (process.env.NOTION_API_KEY && process.env.NOTION_LINKEDIN_DB_ID) {
    // TODO(notion): query the LinkedIn posts database, newest 3.
  }
  return fallbackPosts as LinkedInPost[];
}
