"use client";

import { useState } from "react";
import type { NewsDay } from "@/lib/content";

/**
 * Date-stepped daily feed. Convention (Tim's call): the RIGHT arrow goes
 * BACK in time (older), the LEFT arrow goes forward toward today.
 */
export default function NewsFeed({ days }: { days: NewsDay[] }) {
  const [idx, setIdx] = useState(0);
  const day = days[idx];

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
          {idx === 0 ? `Today · ${day.date}` : day.date}
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

      <div>
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
    </>
  );
}
