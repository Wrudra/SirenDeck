"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";

/** Strong ease-out — starts fast so entrances feel responsive, never sluggish. */
const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1];

/**
 * Entrance reveal for landing sections: opacity + small translate + a whisper
 * of blur (blur masks the crossfade so the element reads as one motion).
 * Stagger siblings via `delay`; transforms/opacity only.
 */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduced = useReducedMotion();
  if (reduced) {
    return <div className={className}>{children}</div>;
  }
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 8, filter: "blur(2px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.28, ease: EASE_OUT, delay }}
    >
      {children}
    </motion.div>
  );
}
