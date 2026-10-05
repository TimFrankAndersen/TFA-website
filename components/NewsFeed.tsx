"use client";

import { useEffect, useRef, useState } from "react";
import type { NewsDay } from "@/lib/content";
import Decode from "@/components/Decode";

/** Outlets the pipeline links to most often, by domain. */
const OUTLETS: Record<string, string> = {
  "apnews.com": "AP",
  "axios.com": "Axios",
  "bbc.com": "BBC",
  "bbc.co.uk": "BBC",
  "bloomberg.com": "Bloomberg",
  "cnbc.com": "CNBC",
  "ft.com": "Financial Times",
  "nytimes.com": "The New York Times",
  "reuters.com": "Reuters",
  "scmp.com": "South China Morning Post",
  "techcrunch.com": "TechCrunch",
  "theguardian.com": "The Guardian",
  "theinformation.com": "The Information",
  "theregister.com": "The Register",
  "theverge.com": "The Verge",
  "version2.dk": "Version2",
  "washingtonpost.com": "The Washington Post",
  "wired.com": "Wired",
  "wsj.com": "The Wall Street Journal",
};

/** "https://www.theregister.com/..." -> "The Register"; unknown -> domain. */
function sourceName(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    const known = Object.keys(OUTLETS).find(
      (d) => host === d || host.endsWith(`.${d}`)
    );
    return known ? OUTLETS[known] : host;
  } catch {
    return "source";
  }
}

/** Counts a click through to a source on the dashboard (see /api/hit). */
function logSourceClick(url: string) {
  try {
    navigator.sendBeacon(
      "/api/hit",
      new Blob(
        [JSON.stringify({ path: window.location.pathname, kind: "click", ref: url })],
        { type: "application/json" }
      )
    );
  } catch {
    /* tracking must never break the link */
  }
}

/**
 * Date-stepped daily feed. Convention (Tim's call): the LEFT arrow goes
 * BACK in time (older), the RIGHT arrow goes forward toward today.
 *
 * Two visual variants:
 *  - "stories" (default): the /news page's article list with tag + date
 *  - "numbered": the homepage's big-number editorial list
 */
export default function NewsFeed({
  days,
  variant = "stories",
}: {
  days: NewsDay[];
  variant?: "stories" | "numbered";
}) {
  const [idx, setIdx] = useState(0);
  // which way the reader last stepped - the stories slide in from that side
  const [dir, setDir] = useState<"older" | "newer" | null>(null);
  const day = days[idx];
  const date = day.isToday ? `Today · ${day.date}` : day.date;

  // Motion candidate 6: the big numerals tick up 00 -> 01..05 the first
  // time the numbered list scrolls into view. Runs once; skipped when the
  // user prefers reduced motion.
  const listRef = useRef<HTMLOListElement>(null);
  const counted = useRef(false);
  useEffect(() => {
    if (variant !== "numbered" || counted.current) return;
    const ol = listRef.current;
    if (!ol) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting) || counted.current) return;
        counted.current = true;
        io.disconnect();
        ol.querySelectorAll<HTMLElement>(".num").forEach((el, i) => {
          const target = i + 1;
          const start = performance.now() + i * 110;
          const duration = 500;
          const tick = (now: number) => {
            const p = Math.min(1, Math.max(0, (now - start) / duration));
            el.textContent = String(Math.round(p * target)).padStart(2, "0");
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        });
      },
      { threshold: 0.3 }
    );
    io.observe(ol);
    return () => io.disconnect();
  }, [variant, idx]);

  return (
    <>
      <div className="news-nav">
        <button
          className="news-arrow"
          type="button"
          aria-label="Earlier day"
          disabled={idx === days.length - 1}
          onClick={() => {
            setDir("older");
            setIdx((i) => Math.min(days.length - 1, i + 1));
          }}
        >
          &lsaquo;
        </button>
        <span className="news-date" aria-live="polite">
          <Decode key={date} text={date} animate={dir !== null} />
        </span>
        <button
          className="news-arrow"
          type="button"
          aria-label="Newer day"
          disabled={idx === 0}
          onClick={() => {
            setDir("newer");
            setIdx((i) => Math.max(0, i - 1));
          }}
        >
          &rsaquo;
        </button>
      </div>

      {variant === "numbered" ? (
        // key={idx} remounts on day change so the slide-in replays
        <ol className={`newslist day-slide ${dir ?? ""}`} key={idx} ref={listRef}>
          {day.stories.map((s, i) => (
            // rows after a day change arrive already drawn - the slide is the motion
            <li key={s.h} className={dir ? "drawn" : undefined} style={{ ["--i" as string]: i }}>
              <span className="num">{String(i + 1).padStart(2, "0")}</span>
              <div>
                <h3 className="display-s">{s.h}</h3>
                <p className="dek">{s.p}</p>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <div className={`day-slide ${dir ?? ""}`} key={idx}>
          {day.stories.map((s, i) => (
            <article className={`story${dir ? " drawn" : ""}`} key={s.h} style={{ ["--i" as string]: i }}>
              <div className="feedmeta">
                <span className="tag">AI News</span>
                <span className="date">{day.date}</span>
              </div>
              <h3 className="display-s">{s.h}</h3>
              <p>{s.p}</p>
              {s.u && (
                <a
                  className="arrow source-link"
                  href={s.u}
                  target="_blank"
                  rel="noopener"
                  onClick={() => logSourceClick(s.u!)}
                >
                  Read more: {sourceName(s.u)} <span className="ar">&rarr;</span>
                </a>
              )}
            </article>
          ))}
        </div>
      )}
    </>
  );
}
