"use client";

import { useEffect, useState } from "react";
import { scramble } from "@/lib/scramble";

/**
 * Text that decodes from random glyphs when `animate` is true. Screen
 * readers only ever get the final text (the scrambled copy is hidden).
 * Remount with a new key to replay.
 */
export default function Decode({
  text,
  animate = true,
}: {
  text: string;
  animate?: boolean;
}) {
  const [out, setOut] = useState(text);
  useEffect(() => {
    if (!animate || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    return scramble(text, setOut);
  }, [text, animate]);
  return (
    <>
      <span aria-hidden="true">{out}</span>
      <span className="sr-only">{text}</span>
    </>
  );
}
