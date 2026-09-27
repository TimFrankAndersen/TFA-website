"use client";

import { useEffect, useRef } from "react";

/**
 * Scroll parallax for the full-bleed hero: the photo drifts down at a
 * third of the scroll speed and the copy lifts and fades. Writes two CSS
 * variables on the hero (--hy in px, --hp 0..1); globals.css applies them.
 * Render it inside the .hero-b element.
 */
export default function HeroParallax() {
  const probe = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const hero = probe.current?.parentElement;
    if (!hero || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      // the hero opens the page, so page scroll is how far past it we are
      const scrolled = Math.min(window.scrollY, hero.offsetHeight);
      hero.style.setProperty("--hy", `${(scrolled * 0.35).toFixed(1)}px`);
      hero.style.setProperty("--hp", (scrolled / hero.offsetHeight).toFixed(3));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return <span ref={probe} hidden />;
}
