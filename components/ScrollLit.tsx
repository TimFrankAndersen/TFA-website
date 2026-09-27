"use client";

import { useEffect, useRef } from "react";

type Part = string | { keep: string };

/**
 * Heading whose words go from dim to full strength as it scrolls through
 * the viewport. Writes one CSS variable (--k = how many words are lit);
 * the per-word opacity is computed in CSS. Without JS or with reduced
 * motion every word stays fully lit. { keep } parts never wrap mid-phrase.
 */
export default function ScrollLit({
  parts,
  className,
  style,
}: {
  parts: Part[];
  className?: string;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLHeadingElement>(null);
  const total = parts.reduce(
    (n, p) => n + (typeof p === "string" ? p : p.keep).split(" ").length,
    0
  );

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      // 0 as the top enters the bottom of the screen, 1 as the bottom leaves the top;
      // the whole sentence lights up between 15% and 55% of that pass
      const p = (vh - r.top) / (vh + r.height);
      const k = Math.min(1, Math.max(0, (p - 0.15) / 0.4)) * total;
      el.style.setProperty("--k", k.toFixed(2));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [total]);

  let i = 0;
  const words = (text: string) =>
    text.split(" ").map((w, j, all) => {
      const idx = i++;
      return (
        <span key={idx} className="lit-w" style={{ ["--i" as string]: idx }}>
          {w}
          {j < all.length - 1 ? " " : ""}
        </span>
      );
    });

  return (
    <h2 ref={ref} className={className} style={style}>
      {parts.map((p, n) => (
        <span key={n}>
          {typeof p === "string" ? words(p) : <span className="keep">{words(p.keep)}</span>}
          {n < parts.length - 1 ? " " : ""}
        </span>
      ))}
    </h2>
  );
}
