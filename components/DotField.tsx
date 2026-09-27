"use client";

import { useEffect, useRef } from "react";

const GAP = 26;

/**
 * Quiet dot grid for a dark band: a slow diagonal swell, and the dots
 * around the pointer light up green. Fills its parent (give the parent the
 * .has-dots class). Only animates while on screen; with reduced motion it
 * draws the still grid once.
 */
export default function DotField() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const box = canvas?.parentElement;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !box || !ctx) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0;
    let h = 0;
    let raf = 0;
    let visible = false;
    const mouse = { x: -9999, y: -9999 };

    const size = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      w = box.clientWidth;
      h = box.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h);
      for (let y = GAP / 2; y < h; y += GAP) {
        for (let x = GAP / 2; x < w; x += GAP) {
          const wave = reduced ? 0 : (Math.sin(x * 0.012 + y * 0.018 - t * 0.0009) + 1) / 2;
          const near = Math.max(0, 1 - Math.hypot(x - mouse.x, y - mouse.y) / 170);
          const a = 0.08 + wave * 0.12 + near * 0.85;
          const r = 1.2 + near * 2.2;
          ctx.fillStyle = near > 0.05 ? `rgba(118,196,160,${a})` : `rgba(251,247,239,${a})`;
          ctx.fillRect(x - r / 2, y - r / 2, r, r);
        }
      }
      if (visible && !reduced) raf = requestAnimationFrame(draw);
    };

    size();
    draw(0);
    const ro = new ResizeObserver(() => {
      size();
      draw(performance.now());
    });
    ro.observe(box);
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      cancelAnimationFrame(raf);
      if (visible && !reduced) raf = requestAnimationFrame(draw);
    });
    io.observe(box);

    const move = (e: PointerEvent) => {
      const r = box.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
    };
    const leave = () => {
      mouse.x = mouse.y = -9999;
    };
    if (!reduced) {
      box.addEventListener("pointermove", move);
      box.addEventListener("pointerleave", leave);
    }
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      box.removeEventListener("pointermove", move);
      box.removeEventListener("pointerleave", leave);
    };
  }, []);

  return <canvas ref={ref} className="dot-field" aria-hidden="true" />;
}
