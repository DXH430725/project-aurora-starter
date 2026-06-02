"use client";

import * as React from "react";
import { animate, useMotionValue } from "framer-motion";

/**
 * Tween a numeric value smoothly. Returns the currently-displayed number.
 * Guarantees no instant jumps when `value` changes.
 */
export function useAnimatedNumber(
  value: number | null | undefined,
  opts: { duration?: number; ease?: "easeOut" | "easeInOut" } = {},
): number | null {
  const { duration = 0.5, ease = "easeInOut" } = opts;
  const motion = useMotionValue(value ?? 0);
  const [display, setDisplay] = React.useState<number | null>(value ?? null);

  React.useEffect(() => {
    const unsub = motion.on("change", (v) => setDisplay(v));
    return () => unsub();
  }, [motion]);

  React.useEffect(() => {
    if (value == null || Number.isNaN(value)) {
      setDisplay(null);
      return;
    }
    const from = motion.get();
    const controls = animate(from, value, {
      duration,
      ease,
      onUpdate: (v) => motion.set(v),
    });
    return () => controls.stop();
  }, [value, duration, ease, motion]);

  return display;
}
