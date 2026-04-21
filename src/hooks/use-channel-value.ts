"use client";

import * as React from "react";
import { useChannel } from "@/hooks/use-channel";
import type { WSMessage, WSState } from "@/types/ws";

/**
 * Convenience: subscribe to a single channel and expose the latest selected value.
 * Returns the initialValue until the first matching message arrives.
 */
export function useChannelValue<T, V>(
  channel: string,
  selector: (msg: WSMessage<T>) => V,
  initialValue: V,
): { value: V; state: WSState; lastUpdatedAt: number | null } {
  const [value, setValue] = React.useState<V>(initialValue);
  const [lastUpdatedAt, setLastUpdatedAt] = React.useState<number | null>(null);

  const selectorRef = React.useRef(selector);
  selectorRef.current = selector;

  const { state } = useChannel<T>(channel, (msg) => {
    if (msg.type !== "data") return;
    const next = selectorRef.current(msg);
    setValue(next);
    setLastUpdatedAt(msg.timestamp);
  });

  return { value, state, lastUpdatedAt };
}
