import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Welcome",
  robots: { index: false },
};

export default async function WelcomePage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string }>;
}) {
  const { ok } = await searchParams;
  const failed = ok === "0";

  return (
    <div className="band light">
      <div className="wrap" data-reveal>
        <p className="label">Daily AI news</p>
        <h1 className="display-xl" style={{ margin: "24px 0 26px" }}>
          {failed ? "That link didn't work" : "You're in."}
        </h1>
        <p className="lede">
          {failed
            ? "The confirmation link is invalid or expired. Sign up again below and you'll get a fresh one."
            : "From tomorrow morning you'll get the five AI news stories that matter, picked and written every day. See you in the inbox."}
        </p>
        <div className="hero-actions" style={{ marginTop: 38 }}>
          <Link className="btn" href="/news">
            {failed ? "Back to AI news" : "Read today's 5 now"}{" "}
            <span className="ar">&rarr;</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
