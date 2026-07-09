import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "AI Curriculum",
  description:
    "AI Curriculum - the AI knowledge platform Tim Frank Andersen built for executive leaders. Curated daily, filtered by role and industry.",
};

const FEATURES = [
  {
    title: "Curated by role",
    body: "A CEO sees different content than a CFO. Every resource is filtered by your executive profile, so you only read what is relevant to your job.",
  },
  {
    title: "Specific to your industry",
    body: "Banking, retail, healthcare, energy: the AI developments that matter in your sector, not everyone else's.",
  },
  {
    title: "200+ sources, every day",
    body: "An AI scanner processes the flood and surfaces the few reports, articles and studies actually worth your time.",
  },
  {
    title: "Executive summaries on tap",
    body: "Click any source and get an instant summary, key takeaways and a relevance score - even an AI-generated podcast version for the commute.",
  },
  {
    title: "Built for teams",
    body: "Progress tracking, engagement analytics for org admins, and a branded experience with your logo and colours.",
  },
];

const STEPS = [
  {
    title: "Sign up",
    body: "Individually or as a leadership team. Free for 7 days, no credit card.",
  },
  {
    title: "Get your curriculum",
    body: "A personal learning path based on your role and your industry.",
  },
  {
    title: "Stay ahead",
    body: "Fresh, relevant content every day. Rate it, track your progress, invite your team.",
  },
];

export default function CurriculumPage() {
  return (
    <>
      {/* HEADER (light) */}
      <div className="band light">
        <div className="wrap" data-reveal>
          <p className="label">AI Curriculum</p>
          <h1 className="display-xl" style={{ margin: "24px 0 26px" }}>
            How do I keep up to speed with AI?
          </h1>
          <p className="lede" style={{ maxWidth: "60ch" }}>
            AI Curriculum keeps executive leaders updated on AI.
            <br />
            Curated daily, filtered by role and industry.
            <br />
            Built by Institute of AI.
          </p>
        </div>
      </div>

      {/* THE STORY (dark) */}
      <div className="band dark">
        <div className="wrap" data-reveal>
          <div className="split">
            <div>
              <p className="label">Why I built it</p>
            </div>
            <div>
              <h2 className="display-m" style={{ marginBottom: 26 }}>
                Every keynote ends with the same question
              </h2>
              <p className="body-max" style={{ color: "var(--dim)" }}>
                &ldquo;How do I keep up?&rdquo; I have heard it from CEOs,
                boards and leadership teams after every single talk. There is
                more good AI thinking published every day than any leader has
                time to read - and most of it is not relevant to their role
                anyway.
              </p>
              <p className="body-max" style={{ color: "var(--dim)" }}>
                So at Institute of AI we built the answer: a platform that
                reads 200+ sources every day and hands each leader only what
                matters to them. And yes - we built it with AI. I would not
                stand on stage telling you what these tools can do if I had
                not used them to build a product myself.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* PRODUCT + FEATURES (light) */}
      <div className="band light">
        <div className="wrap">
          <div data-reveal>
            <p className="label" style={{ marginBottom: 24 }}>
              The platform
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/curriculum-dashboard.jpg"
              alt="AI Curriculum dashboard: The CEO's Guide to AI - a curated, role-specific learning path with daily AI news"
              style={{ display: "block", width: "100%", height: "auto" }}
            />
            <p
              className="note"
              style={{ marginTop: 14, color: "rgba(20,20,20,.62)" }}
            >
              Every leader gets their own guide - this one is the CEO&rsquo;s.
            </p>
          </div>

          <hr className="rule" style={{ margin: "clamp(48px,7vw,88px) 0" }} />

          <ol className="pred-list" data-reveal>
            {FEATURES.map((f, i) => (
              <li key={f.title}>
                <span className="num">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <h3 className="display-s">{f.title}</h3>
                  <p>{f.body}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="split" style={{ marginTop: "clamp(48px,7vw,80px)" }} data-reveal>
            <div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/curriculum-detail.jpg"
                alt="AI Curriculum source view: executive summary and key takeaways of a McKinsey report"
                style={{ display: "block", width: "100%", height: "auto" }}
              />
              <p
                className="note"
                style={{ marginTop: 14, color: "rgba(20,20,20,.62)" }}
              >
                Instant executive summary and key takeaways.
              </p>
            </div>
            <div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/curriculum-scores.jpg"
                alt="AI Curriculum relevance scoring and AI-generated podcast summary"
                style={{ display: "block", width: "100%", height: "auto" }}
              />
              <p
                className="note"
                style={{ marginTop: 14, color: "rgba(20,20,20,.62)" }}
              >
                Every source scored - and turned into a podcast.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* HOW IT WORKS (dark) */}
      <div className="band dark">
        <div className="wrap" data-reveal>
          <p className="label">How it works</p>
          <ol className="pred-list" style={{ marginTop: 36 }}>
            {STEPS.map((s, i) => (
              <li key={s.title}>
                <span className="num">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <h3 className="display-s">{s.title}</h3>
                  <p>{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* CTA (light) */}
      <div className="band light">
        <div className="wrap" data-reveal>
          <h2 className="display-l" style={{ marginBottom: 18 }}>
            See it for yourself
          </h2>
          <p className="lede" style={{ marginBottom: 34 }}>
            Free for 7 days. No credit card.
          </p>
          <div className="hero-actions" style={{ marginTop: 0 }}>
            <a
              className="btn"
              href="https://www.aicurriculum.dk"
              target="_blank"
              rel="noopener"
            >
              Try AI Curriculum &rarr;
            </a>
            <Link className="arrow" href="/speaking#book">
              Rolling it out to a leadership team? It pairs well with a
              keynote &rarr;
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
