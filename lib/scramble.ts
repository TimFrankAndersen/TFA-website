const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#/<>_";

/**
 * Decode effect: letters and digits start as random glyphs and lock into
 * place left to right. Spaces and punctuation stay put. Calls onFrame with
 * each intermediate string and ends on the original text. Returns a cancel
 * function that also restores the original text.
 */
export function scramble(
  text: string,
  onFrame: (s: string) => void,
  delay = 0
): () => void {
  const duration = 600 + text.length * 16;
  const t0 = performance.now() + delay;
  let raf = 0;
  const tick = (now: number) => {
    const p = Math.min(1, Math.max(0, (now - t0) / duration));
    const fixed = Math.floor(p * text.length);
    onFrame(
      Array.from(text, (c, i) =>
        i < fixed || !/[A-Za-z0-9]/.test(c)
          ? c
          : GLYPHS[(Math.random() * GLYPHS.length) | 0]
      ).join("")
    );
    if (p < 1) raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  return () => {
    cancelAnimationFrame(raf);
    onFrame(text);
  };
}

/** Decode a plain-text element in place (skips elements with child markup). */
export function scrambleElement(el: Element, delay = 0): (() => void) | null {
  const node = el.childNodes.length === 1 ? el.firstChild : null;
  if (!node || node.nodeType !== Node.TEXT_NODE) return null;
  const text = node.textContent ?? "";
  if (!text.trim()) return null;
  return scramble(text, (s) => (node.textContent = s), delay);
}
