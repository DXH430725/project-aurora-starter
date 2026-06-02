"use client";

import * as React from "react";
import { getDefaultWSUrl, WSClient } from "@/lib/ws-client";
import { useWSStore } from "@/stores/ws-store";
import type { WSMessage } from "@/types/ws";

const METRICS_POLL_MS = 1000;

const WSContext = React.createContext<WSClient | null>(null);

export function useWSClient(): WSClient {
  const client = React.useContext(WSContext);
  if (!client) throw new Error("useWSClient must be used inside <WSProvider>");
  return client;
}

export function WSProvider({ children }: { children: React.ReactNode }) {
  const [client] = React.useState(() => WSClient.getInstance(getDefaultWSUrl()));
  const setState = useWSStore((s) => s.setState);
  const setError = useWSStore((s) => s.setError);
  const setMetrics = useWSStore((s) => s.setMetrics);
  const ingestMessage = useWSStore((s) => s.ingestMessage);

  React.useEffect(() => {
    const offState = client.on("state", (...args: unknown[]) => {
      const s = args[0] as ReturnType<WSClient["getState"]>;
      setState(s);
      if (s === "OPEN") setError(null);
    });
    const offErr = client.on("error", (...args: unknown[]) => {
      const e = args[0];
      const msg =
        e instanceof Error
          ? e.message
          : typeof e === "string"
            ? e
            : "ws error";
      setError(msg);
    });
    const offMsg = client.on("message", (...args: unknown[]) => {
      ingestMessage(args[0] as WSMessage);
    });

    // initial state snapshot
    setState(client.getState());

    // metrics poll — cheap and avoids wiring a custom event for every bump
    const metricsInterval = setInterval(() => {
      setMetrics(client.getMetrics());
    }, METRICS_POLL_MS);

    client.connect();

    return () => {
      offState();
      offErr();
      offMsg();
      clearInterval(metricsInterval);
      // intentionally do NOT disconnect here — HMR keeps the singleton alive.
    };
  }, [client, setState, setError, setMetrics, ingestMessage]);

  return <WSContext.Provider value={client}>{children}</WSContext.Provider>;
}
