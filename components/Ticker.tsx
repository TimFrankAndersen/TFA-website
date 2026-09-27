import Link from "next/link";

/**
 * News-wire band under the hero: today's headlines run right to left and
 * pause on hover or keyboard focus. The row is rendered twice so the loop
 * is seamless; the copy is hidden from screen readers.
 */
export default function Ticker({ headlines }: { headlines: string[] }) {
  if (!headlines.length) return null;
  const row = (copy: boolean) => (
    <ul className="ticker-row" aria-hidden={copy || undefined}>
      {headlines.map((h) => (
        <li key={h}>{h}</li>
      ))}
    </ul>
  );
  return (
    <Link className="ticker" href="/news" aria-label="Today in AI - read today's stories">
      <span className="label live ticker-tag">Today in AI</span>
      <div className="ticker-track">
        <div className="ticker-move">
          {row(false)}
          {row(true)}
        </div>
      </div>
    </Link>
  );
}
