import Link from "next/link";
import NewsFeed from "@/components/NewsFeed";
import SubscribeForm from "@/components/SubscribeForm";
import { getNewsDays, getLinkedInPosts } from "@/lib/content";

// Refresh the news + LinkedIn sections from Notion at most hourly.
export const revalidate = 600;

export default async function Home() {
  const [days, posts] = await Promise.all([getNewsDays(), getLinkedInPosts()]);

  return (
    <>
      {/* HERO - full-bleed on-stage */}
      <div className="band hero-b">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="hero-b-img"
          src="/images/stage-impact-crop.jpg"
          alt="Tim Frank Andersen on stage in front of a large conference audience"
        />
        <div className="hero-b-scrim" aria-hidden="true" />
        <div className="hero-b-inner">
          <div className="wrap">
            <span className="tick" aria-hidden="true" />
            <p className="label">
              Keynote speaker &amp; moderator on AI and technology
            </p>
            <h1 className="display-xl">
              <span className="hl">
                <span>Tim Frank</span>
              </span>
              <span className="hl">
                <span>Andersen</span>
              </span>
            </h1>
            <p className="lede">
              I&rsquo;ve worked in tech for 30 years. Right now the big shift
              is AI -<br className="br-desktop" /> I help organisations
              understand what&rsquo;s real, what&rsquo;s next, and
              what&rsquo;s in it for them.
            </p>
            <div className="hero-actions">
              <Link className="btn" href="/speaking#book">
                Book Tim
              </Link>
              <Link className="arrow" href="/news">
                See today&rsquo;s AI news <span className="ar">&rarr;</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ABOUT TEASER (light) */}
      <div className="band light">
        <div className="wrap" data-reveal>
          <p className="label" style={{ marginBottom: 24 }}>
            About
          </p>
          <div className="split">
            <div>
              <figure className="about-portrait" style={{ marginTop: 0 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/portrait-2026-bw.jpg"
                  alt="Tim Frank Andersen"
                />
              </figure>
            </div>
            <div>
              <h2 className="display-m" style={{ marginBottom: 26 }}>
                Thirty years in digital - from founding one of Denmark&rsquo;s
                first digital agencies to co-founding Institute of AI. Author,
                TV
                tech expert, and advisor to some of the world&rsquo;s biggest
                brands.
              </h2>
              <Link className="arrow" href="/about">
                More about Tim <span className="ar">&rarr;</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* SPEAKING TEASER (dark) */}
      <div className="band dark">
        <div className="wrap" data-reveal>
          <div className="sec-head">
            <div>
              <p className="label">Speaking</p>
              <h2 className="display-l">Two ways to book Tim</h2>
            </div>
            <Link className="arrow" href="/speaking">
              See speaking <span className="ar">&rarr;</span>
            </Link>
          </div>
          <div className="formats">
            <div>
              <p className="mono" style={{ color: "var(--green)" }}>
                Format 01
              </p>
              <h3 className="display-s">Keynote - The AI Explosion</h3>
              <p>
                What&rsquo;s real, what&rsquo;s next, and what&rsquo;s in it
                for you. Live demos, honest answers, and a look at the next
                12-24 months, which will change our world.
              </p>
            </div>
            <div>
              <p className="mono" style={{ color: "var(--green)" }}>
                Format 02
              </p>
              <h3 className="display-s">Moderator</h3>
              <p>
                The person tying it all together - sharp questions and a clear
                thread through your conference.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CLIENT QUOTES (light) */}
      <div className="band light">
        <div className="wrap" data-reveal>
          <p className="label">What organisers say</p>
          <p
            className="mono"
            style={{ marginTop: 20, color: "rgba(20,20,20,.62)" }}
          >
            Rated 5.0 from 11 reviews.
          </p>
          <div className="quotes trio">
            <blockquote>
              <p>
                &ldquo;I&rsquo;ve heard plenty of talks about AI, and never
                found it more captivating or relevant than yours.&rdquo;
              </p>
              <cite>Rikke Ekelund</cite>
            </blockquote>
            <blockquote>
              <p>
                &ldquo;He inspired us all. Not a generic set of examples, but
                real, recent insight - told with genuine care for the work we
                do.&rdquo;
              </p>
              <cite>Marc Amin</cite>
            </blockquote>
            <blockquote>
              <p>
                &ldquo;Thank you for an extremely exciting talk - on a topic
                every company will relate to. Exciting to think about where
                we&rsquo;ll be in 5 years: we must see opportunities, not
                limitations.&rdquo;
              </p>
              <cite>
                Gitte Taulov Rude, Senior Business Advisor, Danske Bank
              </cite>
            </blockquote>
          </div>
        </div>
      </div>

      {/* FEATURED AI NEWS (dark) */}
      <div className="band dark">
        <div className="wrap" data-reveal>
          <div className="sec-head">
            <div>
              <p className="label">Updated every day</p>
              <h2 className="display-l">
                Today in AI - 5 curated news stories that matter
              </h2>
              <p className="note" style={{ marginTop: 16 }}>
                Curated by Tim, every morning.
              </p>
            </div>
          </div>
          <NewsFeed days={days} variant="numbered" />
          <SubscribeForm />
        </div>
      </div>

      {/* LATEST FROM LINKEDIN (light) */}
      <div className="band light">
        <div className="wrap" data-reveal>
          <div className="sec-head">
            <div>
              <p className="label">From LinkedIn</p>
              <h2 className="display-l">Latest posts</h2>
            </div>
            <Link className="arrow" href="/news">
              See all <span className="ar">&rarr;</span>
            </Link>
          </div>
          <div className="li-grid">
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

      {/* BOOKING CTA (dark) */}
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
