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
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const skipMotion = reduced.matches || !("IntersectionObserver" in window);

    const io = skipMotion
      ? null
      : new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                entry.target.classList.add("in");
                io?.unobserve(entry.target);
              }
            });
          },
          { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
        );

    const observeAll = () => {
      document
        .querySelectorAll<HTMLElement>("[data-reveal]:not(.in)")
        .forEach((el) => (io ? io.observe(el) : el.classList.add("in")));
    };
    observeAll();

    // Catch [data-reveal] nodes mounted after this effect ran (Fast
    // Refresh swaps, late-rendered sections) - unobserved nodes would
    // otherwise stay invisible. Re-observing a node twice is harmless.
    const mo = new MutationObserver(observeAll);
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      mo.disconnect();
      io?.disconnect();
    };
  }, [pathname]);

  return null;
}
