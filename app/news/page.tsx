import type { Metadata } from "next";
import Link from "next/link";
import NewsFeed from "@/components/NewsFeed";
import SubscribeForm from "@/components/SubscribeForm";
import { getNewsDays, getLinkedInPosts } from "@/lib/content";

export const metadata: Metadata = {
  title: "AI News",
  description:
    "Refreshed daily. Curated by Tim Frank Andersen - today's five biggest AI stories, plus his latest posts from LinkedIn.",
};

// Re-render at most once an hour so "today" stays fresh.
export const revalidate = 600;

export default async function NewsPage() {
  const [days, posts] = await Promise.all([getNewsDays(), getLinkedInPosts()]);

  return (
    <>
      {/* HEADER (light) */}
      <div className="band light">
        <div className="wrap" data-reveal>
          <p className="label live">Live feed - updated every day</p>
          <h1 className="display-xl" style={{ margin: "24px 0 26px" }}>
            AI News
          </h1>
          <p className="lede">
            Refreshed daily. Curated by me. Today&rsquo;s five biggest AI
            stories, plus my latest posts from LinkedIn.
          </p>
          <SubscribeForm />
        </div>
      </div>

      {/* TODAY'S 5 (dark) */}
      <div className="band dark">
        <div className="wrap">
          <div className="sec-head" data-reveal>
            <div>
              <p className="label">Today&rsquo;s 5 curated stories</p>
              <h2 className="display-l">
                The five AI news stories that matter today
              </h2>
              <p className="note" style={{ marginTop: 16 }}>
                Browse back through the last few days.
              </p>
            </div>
          </div>
          <NewsFeed days={days} />
        </div>
      </div>

      {/* FROM LINKEDIN (light) */}
      <div className="band light">
        <div className="wrap">
          <div className="sec-head" data-reveal>
            <div>
              <p className="label">From LinkedIn</p>
              <h2 className="display-l">Latest posts</h2>
            </div>
            <p className="note">
              Posts sync automatically from Tim&rsquo;s LinkedIn.
            </p>
          </div>
          <div className="li-grid" data-reveal>
            {posts.map((p) => (
              <a
                key={p.url}
                className="li-card"
                href={p.url}
                target="_blank"
                rel="noopener"
              >
                <div className="feedmeta" style={{ margin: 0 }}>
                  <span className="tag">{p.tag}</span>
                  <span className="date">{p.date}</span>
                </div>
                <p>{p.text}</p>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* CTA (dark) */}
      <div
        className="band dark thin"
        style={{ paddingBlock: "clamp(48px,6vw,72px)" }}
      >
        <div className="wrap cta-band" data-reveal>
          <h2 className="display-m">Book Tim to speak</h2>
          <Link className="btn" href="/speaking#book">
            Book Tim <span className="ar">&rarr;</span>
          </Link>
        </div>
      </div>
    </>
  );
}
