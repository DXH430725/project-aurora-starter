"use client";

import * as React from "react";
import { useWSClient } from "@/components/providers/ws-provider";
import { useWSStore, channelMatches } from "@/stores/ws-store";
import type { WSMessage, WSState } from "@/types/ws";

export interface UseChannelOptions {
  enabled?: boolean;
  /** if true, replay the last cached message for this channel on subscribe */
  replay?: boolean;
}

/**
 * Subscribe to one or more channels.
 * - componentId is stable across renders (based on React.useId)
 * - subscribe/unsubscribe is idempotent (see WSStore.addSubscriber)
 * - handler is held in a ref so callers don't have to memoize
 */
export function useChannel<T = unknown>(
  channel: string | string[],
  handler: (msg: WSMessage<T>) => void,
  options: UseChannelOptions = {},
): { state: WSState; lastMessage: WSMessage<T> | null } {
  const { enabled = true, replay = true } = options;
  const client = useWSClient();
  const componentId = React.useId();

  const handlerRef = React.useRef(handler);
  handlerRef.current = handler;

  const [lastMessage, setLastMessage] = React.useState<WSMessage<T> | null>(null);

  const state = useWSStore((s) => s.state);
  const addSubscriber = useWSStore((s) => s.addSubscriber);
  const removeSubscriber = useWSStore((s) => s.removeSubscriber);

  // stringify to keep dep array stable-ish
  const channels = React.useMemo(
    () => (Array.isArray(channel) ? channel : [channel]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [Array.isArray(channel) ? channel.join("|") : channel],
  );

  React.useEffect(() => {
    if (!enabled) return;

    // subscribe via store (ref-counted) → client (locally dedup'd)
    for (const ch of channels) {
      const firstSubscriber = addSubscriber(componentId, ch);
      // always call client.subscribe; WSClient itself dedups.
      if (!ch.endsWith("*")) {
        client.subscribe(ch);
      }
      void firstSubscriber;
    }

    // replay cached latest messages
    if (replay) {
      const latest = useWSStore.getState().latestMessages;
      for (const ch of channels) {
        if (ch.endsWith("*")) {
          for (const key of Object.keys(latest)) {
            if (channelMatches(ch, key)) {
              const msg = latest[key];
              if (msg) {
                handlerRef.current(msg as WSMessage<T>);
                setLastMessage(msg as WSMessage<T>);
              }
            }
          }
        } else if (latest[ch]) {
          const msg = latest[ch] as WSMessage<T>;
          handlerRef.current(msg);
          setLastMessage(msg);
        }
      }
    }

    const off = client.on("message", (...args: unknown[]) => {
      const msg = args[0] as WSMessage<T>;
      const matches = channels.some((c) => channelMatches(c, msg.channel));
      if (!matches) return;
      handlerRef.current(msg);
      setLastMessage(msg);
    });

    return () => {
      off();
      for (const ch of channels) {
        const last = removeSubscriber(componentId, ch);
        if (last && !ch.endsWith("*")) client.unsubscribe(ch);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channels, enabled, replay, componentId, client]);

  return { state, lastMessage };
}
