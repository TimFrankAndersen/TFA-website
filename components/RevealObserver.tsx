"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { scrambleElement } from "@/lib/scramble";

/**
 * Adds the subtle scroll-reveal to every [data-reveal] element.
 * Re-runs on route change so newly mounted sections get observed.
 * prefers-reduced-motion is handled in CSS (elements stay visible).
 *
 * Also decodes the mono .label text of each section as it is revealed,
 * plus any [data-decode] element straight away (the hero label).
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
                decodeLabels(entry.target);
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

    const cancels: (() => void)[] = [];
    function decodeLabels(root: Element) {
      const labels = root.matches(".label")
        ? [root]
        : Array.from(root.querySelectorAll(".label"));
      labels.forEach((el, i) => {
        const cancel = scrambleElement(el, 150 + i * 120);
        if (cancel) cancels.push(cancel);
      });
    }
    if (!skipMotion) {
      document.querySelectorAll("[data-decode]").forEach((el) => {
        const cancel = scrambleElement(el, 300);
        if (cancel) cancels.push(cancel);
      });
    }

    // Catch [data-reveal] nodes mounted after this effect ran (Fast
    // Refresh swaps, late-rendered sections) - unobserved nodes would
    // otherwise stay invisible. Re-observing a node twice is harmless.
    const mo = new MutationObserver(observeAll);
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      mo.disconnect();
      io?.disconnect();
      cancels.forEach((c) => c());
    };
  }, [pathname]);

  return null;
}
