"use client";

import { useEffect, useRef } from "react";

type Part = string | { keep: string } | { br: true };

/**
 * Heading whose words go from dim to full strength as it scrolls through
 * the viewport. Writes one CSS variable (--k = how many words are lit);
 * the per-word opacity is computed in CSS. Without JS or with reduced
 * motion every word stays fully lit. { keep } parts never wrap mid-phrase;
 * { br: true } is a hard line break.
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
    (n, p) =>
      n + (typeof p === "string" ? p.split(" ").length : "keep" in p ? p.keep.split(" ").length : 0),
    0
  );

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const top = el.getBoundingClientRect().top;
      const vh = window.innerHeight;
      // the sentence lights up while its top travels from 85% to 35% of the
      // screen height - independent of heading size, so it always completes
      const p = (0.85 * vh - top) / (0.5 * vh);
      const k = Math.min(1, Math.max(0, p)) * total;
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
      {parts.map((p, n) => {
        if (typeof p === "object" && "br" in p) return <br key={n} />;
        const next = parts[n + 1];
        const gap = next !== undefined && !(typeof next === "object" && "br" in next);
        return (
          <span key={n}>
            {typeof p === "string" ? words(p) : <span className="keep">{words(p.keep)}</span>}
            {gap ? " " : ""}
          </span>
        );
      })}
    </h2>
  );
}
