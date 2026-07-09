"use client";

import { useEffect, useRef, useState } from "react";
import type { NewsDay } from "@/lib/content";

/**
 * Date-stepped daily feed. Convention (Tim's call): the RIGHT arrow goes
 * BACK in time (older), the LEFT arrow goes forward toward today.
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
  const day = days[idx];

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
          aria-label="Newer day"
          disabled={idx === 0}
          onClick={() => setIdx((i) => Math.max(0, i - 1))}
        >
          &lsaquo;
        </button>
        <span className="news-date" aria-live="polite">
          {day.isToday ? `Today · ${day.date}` : day.date}
        </span>
        <button
          className="news-arrow"
          type="button"
          aria-label="Earlier day"
          disabled={idx === days.length - 1}
          onClick={() => setIdx((i) => Math.min(days.length - 1, i + 1))}
        >
          &rsaquo;
        </button>
      </div>

      {variant === "numbered" ? (
        // key={idx} remounts on day change so the crossfade replays
        <ol className="newslist day-swap" key={idx} ref={listRef}>
          {day.stories.map((s, i) => (
            <li key={s.h}>
              <span className="num">{String(i + 1).padStart(2, "0")}</span>
              <div>
                <h3 className="display-s">{s.h}</h3>
                <p className="dek">{s.p}</p>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <div className="day-swap" key={idx}>
          {day.stories.map((s) => (
            <article className="story" key={s.h}>
              <div className="feedmeta">
                <span className="tag">AI News</span>
                <span className="date">{day.date}</span>
              </div>
              <h3 className="display-s">{s.h}</h3>
              <p>{s.p}</p>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
