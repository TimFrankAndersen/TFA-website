import type { Metadata } from "next";
import YearArchive from "@/components/YearArchive";
import { PREDICTIONS_2026, ARCHIVE } from "@/data/predictions";

export const metadata: Metadata = {
  title: "Ten AI Predictions for 2026",
  description:
    "Tim Frank Andersen's ten AI predictions for 2026, plus the full archive of his tech predictions since 2020.",
};

export default function PredictionsPage() {
  return (
    <>
      {/* HEADER (light) */}
      <div className="band light">
        <div className="wrap" data-reveal>
          <p className="label">Predictions</p>
          <h1 className="display-xl" style={{ margin: "24px 0 26px" }}>
            Ten AI Predictions for 2026
          </h1>
          <p className="lede">
            Every December I put ten predictions on the record. Here&rsquo;s
            my bet on where AI takes us in 2026.
          </p>
        </div>
      </div>

      {/* THE TEN (dark) */}
      <div className="band dark">
        <div className="wrap">
          <ol className="pred-list">
            {PREDICTIONS_2026.map((p, i) => (
              <li key={p.title} data-reveal>
                <span className="num">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <h3 className="display-s">{p.title}</h3>
                  <p>{p.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* ARCHIVE INTRO (light, tight) */}
      <div
        className="band light"
        style={{ paddingBottom: "clamp(24px,3vw,36px)" }}
      >
        <div className="wrap" data-reveal>
          <p className="label">Archive</p>
          <h2 className="display-l" style={{ margin: "16px 0 12px" }}>
            Earlier predictions
          </h2>
          <p className="lede">
            Every December since 2020 I&rsquo;ve published ten tech
            predictions. Browse the back catalogue - each links to the full
            article on Medium.
          </p>
        </div>
      </div>

      {/* YEAR ARCHIVE (dark, switcher on top) */}
      <div className="band dark" style={{ paddingTop: "clamp(40px,5vw,64px)" }}>
        <div className="wrap">
          <YearArchive years={ARCHIVE} />
        </div>
      </div>
    </>
  );
}
