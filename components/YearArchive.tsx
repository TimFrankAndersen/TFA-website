"use client";

import { useState } from "react";
import type { ArchiveYear } from "@/data/predictions";

/** Year switcher + panels for the prediction archive (2020-2023). */
export default function YearArchive({ years }: { years: ArchiveYear[] }) {
  const [active, setActive] = useState(years[0].year);

  return (
    <>
      <div
        className="year-switch"
        style={{ marginBottom: "clamp(40px,6vw,64px)", marginTop: 0 }}
      >
        {years.map((y) => (
          <button
            key={y.year}
            type="button"
            className={`yr${active === y.year ? " active" : ""}`}
            onClick={() => setActive(y.year)}
          >
            {y.year}
          </button>
        ))}
      </div>

      {years.map((y) => (
        <div key={y.year} hidden={active !== y.year}>
          <p className="label" style={{ color: "var(--green)" }}>
            Ten Tech Predictions
          </p>
          <h2 className="display-l" style={{ margin: "16px 0 10px" }}>
            {y.year}
          </h2>
          <p className="lede" style={{ color: "var(--dim)" }}>
            {y.intro}
          </p>
          {y.topLink && (
            <p style={{ marginTop: 18 }}>
              <a
                className="arrow"
                href={y.topLink.href}
                target="_blank"
                rel="noopener"
              >
                {y.topLink.label} <span className="ar">&rarr;</span>
              </a>
            </p>
          )}
          <ol className="pred-list" style={{ marginTop: 40 }}>
            {y.predictions.map((p, i) => (
              <li key={p.title}>
                <span className="num">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <h3 className="display-s">{p.title}</h3>
                  <p>{p.summary}</p>
                  {p.url && (
                    <a
                      className="arrow"
                      href={p.url}
                      target="_blank"
                      rel="noopener"
                    >
                      Read on Medium <span className="ar">&rarr;</span>
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </div>
      ))}
    </>
  );
}
