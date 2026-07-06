"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Adds the subtle scroll-reveal to every [data-reveal] element.
 * Re-runs on route change so newly mounted sections get observed.
 * prefers-reduced-motion is handled in CSS (elements stay visible).
 */
export default function RevealObserver() {
  const pathname = usePathname();

  useEffect(() => {
    const els = Array.from(
      document.querySelectorAll<HTMLElement>("[data-reveal]:not(.in)")
    );
    if (els.length === 0) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduced.matches || !("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("in"));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [pathname]);

  return null;
}
