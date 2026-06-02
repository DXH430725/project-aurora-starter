"use client";

import { create } from "zustand";
import type { WSMessage, WSMetrics, WSState } from "@/types/ws";

const LOG_CAP = 1000;

export interface WSStoreState {
  state: WSState;
  lastError: string | null;
  metrics: WSMetrics;

  /** channel → list of componentIds (ref counting) */
  subscriptions: Record<string, string[]>;
  /** channel → latest message seen */
  latestMessages: Record<string, WSMessage | undefined>;
  /** ring-buffered inspector log */
  messageLog: WSMessage[];

  // -- lifecycle
  setState: (s: WSState) => void;
  setError: (msg: string | null) => void;
  setMetrics: (m: WSMetrics) => void;

  // -- subscriptions
  /** Returns true if this is the FIRST subscriber for that channel. */
  addSubscriber: (componentId: string, channel: string) => boolean;
  /** Returns true if this was the LAST subscriber for that channel. */
  removeSubscriber: (componentId: string, channel: string) => boolean;

  // -- data
  ingestMessage: (msg: WSMessage) => void;
  clearLog: () => void;
}

export const useWSStore = create<WSStoreState>((set, get) => ({
  state: "CLOSED",
  lastError: null,
  metrics: {
    messagesReceived: 0,
    messagesSent: 0,
    bytesReceived: 0,
    bytesSent: 0,
    connectedAt: null,
    reconnectCount: 0,
    latency: null,
  },
  subscriptions: {},
  latestMessages: {},
  messageLog: [],

  setState: (s) => set({ state: s }),
  setError: (msg) => set({ lastError: msg }),
  setMetrics: (m) => set({ metrics: m }),

  addSubscriber: (componentId, channel) => {
    const subs = get().subscriptions;
    const existing = subs[channel] ?? [];
    if (existing.includes(componentId)) {
      // idempotent — no change, no "first subscriber" claim
      return false;
    }
    const next = [...existing, componentId];
    set({ subscriptions: { ...subs, [channel]: next } });
    return existing.length === 0;
  },

  removeSubscriber: (componentId, channel) => {
    const subs = get().subscriptions;
    const existing = subs[channel];
    if (!existing || !existing.includes(componentId)) return false;
    const next = existing.filter((id) => id !== componentId);
    if (next.length === 0) {
      const { [channel]: _gone, ...rest } = subs;
      void _gone;
      set({ subscriptions: rest });
      return true;
    }
    set({ subscriptions: { ...subs, [channel]: next } });
    return false;
  },

  ingestMessage: (msg) => {
    const s = get();
    // latest cache for data messages
    if (msg.type === "data") {
      set({
        latestMessages: { ...s.latestMessages, [msg.channel]: msg },
      });
    }
    // ring buffer (skip ping/pong noise from inspector)
    if (msg.type !== "ping" && msg.type !== "pong") {
      const nextLog =
        s.messageLog.length >= LOG_CAP
          ? [...s.messageLog.slice(s.messageLog.length - LOG_CAP + 1), msg]
          : [...s.messageLog, msg];
      set({ messageLog: nextLog });
    }
  },

  clearLog: () => set({ messageLog: [] }),
}));

/** Utility: does a concrete channel match a wildcard subscription like "metrics.*"? */
export function channelMatches(subscription: string, concrete: string): boolean {
  if (subscription === concrete) return true;
  if (!subscription.endsWith("*")) return false;
  const prefix = subscription.slice(0, -1); // keep trailing dot if any
  return concrete.startsWith(prefix);
}
