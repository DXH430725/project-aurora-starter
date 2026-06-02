/**
 * WSClient — single connection multiplexer.
 * - Singleton per URL
 * - Reconnect with exponential backoff (1s → 30s)
 * - Heartbeat (ping every 30s, timeout 60s)
 * - Outgoing queue when not OPEN
 * - Local dedup on subscribe/unsubscribe; resubscribe on reconnect
 *
 * Rationale: business components MUST go through useChannel/useChannelValue →
 * WSStore → this client. Never `new WebSocket` outside this file.
 */

import type { WSClientMessage, WSMessage, WSMetrics, WSState } from "@/types/ws";

type EventKind = "message" | "state" | "error";
type Handler = (...args: unknown[]) => void;

export interface WSClientOptions {
  heartbeatMs?: number;
  heartbeatTimeoutMs?: number;
  maxBackoffMs?: number;
  maxReconnectAttempts?: number | null; // null = infinite
}

const DEFAULTS: Required<Omit<WSClientOptions, "maxReconnectAttempts">> & {
  maxReconnectAttempts: number | null;
} = {
  heartbeatMs: 30_000,
  heartbeatTimeoutMs: 60_000,
  maxBackoffMs: 30_000,
  maxReconnectAttempts: null,
};

const INSTANCES = new Map<string, WSClient>();

export class WSClient {
  private url: string;
  private opts: typeof DEFAULTS;
  private ws: WebSocket | null = null;
  private state: WSState = "CLOSED";

  private listeners = new Map<EventKind, Set<Handler>>();

  private outgoing: WSClientMessage[] = [];
  private subscribedChannels = new Set<string>(); // channels we've told server about

  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private pongDeadline: ReturnType<typeof setTimeout> | null = null;
  private lastPingAt: number | null = null;
  private manualClose = false;

  private metrics: WSMetrics = {
    messagesReceived: 0,
    messagesSent: 0,
    bytesReceived: 0,
    bytesSent: 0,
    connectedAt: null,
    reconnectCount: 0,
    latency: null,
  };

  private constructor(url: string, options?: WSClientOptions) {
    this.url = url;
    this.opts = { ...DEFAULTS, ...options };
  }

  static getInstance(url: string, options?: WSClientOptions): WSClient {
    let inst = INSTANCES.get(url);
    if (!inst) {
      inst = new WSClient(url, options);
      INSTANCES.set(url, inst);
    }
    return inst;
  }

  // -----------------------------------------------------------------
  // Public API
  // -----------------------------------------------------------------

  connect(): void {
    if (this.state === "OPEN" || this.state === "CONNECTING") return;
    this.manualClose = false;
    this.openSocket();
  }

  disconnect(_reason?: string): void {
    this.manualClose = true;
    this.clearReconnect();
    this.stopHeartbeat();
    if (this.ws) {
      try {
        this.ws.close(1000, _reason ?? "client disconnect");
      } catch {
        /* noop */
      }
      this.ws = null;
    }
    this.setState("CLOSED");
  }

  /** Subscribe to a channel. Idempotent per channel. */
  subscribe(channel: string): void {
    if (this.subscribedChannels.has(channel)) return;
    this.subscribedChannels.add(channel);
    this.send({ type: "subscribe", channel });
  }

  /** Unsubscribe from a channel. Idempotent per channel. */
  unsubscribe(channel: string): void {
    if (!this.subscribedChannels.has(channel)) return;
    this.subscribedChannels.delete(channel);
    this.send({ type: "unsubscribe", channel });
  }

  send(msg: WSClientMessage): void {
    if (this.state !== "OPEN" || !this.ws) {
      this.outgoing.push(msg);
      // nudge a connection attempt
      if (this.state === "CLOSED") this.connect();
      return;
    }
    this.rawSend(msg);
  }

  on(event: EventKind, handler: Handler): () => void {
    let bucket = this.listeners.get(event);
    if (!bucket) {
      bucket = new Set();
      this.listeners.set(event, bucket);
    }
    bucket.add(handler);
    return () => bucket?.delete(handler);
  }

  getState(): WSState {
    return this.state;
  }

  getMetrics(): WSMetrics {
    return { ...this.metrics };
  }

  // -----------------------------------------------------------------
  // Internals
  // -----------------------------------------------------------------

  private openSocket() {
    this.setState(this.reconnectAttempts > 0 ? "RECONNECTING" : "CONNECTING");
    let ws: WebSocket;
    try {
      ws = new WebSocket(this.url);
    } catch (err) {
      this.handleFailure(err);
      return;
    }
    this.ws = ws;

    ws.onopen = () => {
      this.metrics.connectedAt = Date.now();
      this.reconnectAttempts = 0;
      this.setState("OPEN");

      // resubscribe — locally dedup'd set
      for (const ch of this.subscribedChannels) {
        this.rawSend({ type: "subscribe", channel: ch });
      }
      // flush queue
      while (this.outgoing.length > 0) {
        const m = this.outgoing.shift()!;
        this.rawSend(m);
      }
      this.startHeartbeat();
    };

    ws.onmessage = (ev) => {
      const raw = typeof ev.data === "string" ? ev.data : "";
      this.metrics.bytesReceived += raw.length;
      this.metrics.messagesReceived += 1;
      let msg: WSMessage;
      try {
        msg = JSON.parse(raw) as WSMessage;
      } catch {
        this.emit("error", new Error("ws: invalid JSON"));
        return;
      }
      if (msg.type === "pong") {
        if (this.lastPingAt !== null) {
          this.metrics.latency = Date.now() - this.lastPingAt;
        }
        if (this.pongDeadline) clearTimeout(this.pongDeadline);
        return;
      }
      this.emit("message", msg);
    };

    ws.onerror = (ev) => {
      this.emit("error", ev);
    };

    ws.onclose = () => {
      this.stopHeartbeat();
      this.ws = null;
      if (this.manualClose) {
        this.setState("CLOSED");
        return;
      }
      this.scheduleReconnect();
    };
  }

  private rawSend(msg: WSClientMessage) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    const payload = JSON.stringify(msg);
    this.ws.send(payload);
    this.metrics.bytesSent += payload.length;
    this.metrics.messagesSent += 1;
  }

  private emit(kind: EventKind, ...args: unknown[]) {
    const bucket = this.listeners.get(kind);
    if (!bucket) return;
    for (const h of bucket) {
      try {
        h(...args);
      } catch (e) {
        // handler threw; surface to console but keep going
        console.error("ws-client handler error", e);
      }
    }
  }

  private setState(next: WSState) {
    if (this.state === next) return;
    this.state = next;
    this.emit("state", next);
  }

  private scheduleReconnect() {
    if (this.opts.maxReconnectAttempts !== null && this.reconnectAttempts >= this.opts.maxReconnectAttempts) {
      this.setState("CLOSED");
      return;
    }
    this.setState("RECONNECTING");
    this.metrics.reconnectCount += 1;
    const delay = Math.min(this.opts.maxBackoffMs, 1000 * Math.pow(2, this.reconnectAttempts));
    this.reconnectAttempts += 1;
    this.clearReconnect();
    this.reconnectTimer = setTimeout(() => this.openSocket(), delay);
  }

  private clearReconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.state !== "OPEN" || !this.ws) return;
      this.lastPingAt = Date.now();
      this.rawSend({ type: "ping" });
      // pong timeout
      if (this.pongDeadline) clearTimeout(this.pongDeadline);
      this.pongDeadline = setTimeout(() => {
        // no pong — force reconnect
        try {
          this.ws?.close(4000, "heartbeat timeout");
        } catch {
          /* noop */
        }
      }, this.opts.heartbeatTimeoutMs);
    }, this.opts.heartbeatMs);
  }

  private stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    if (this.pongDeadline) {
      clearTimeout(this.pongDeadline);
      this.pongDeadline = null;
    }
  }

  private handleFailure(err: unknown) {
    this.emit("error", err);
    this.scheduleReconnect();
  }
}

export function getDefaultWSUrl(): string {
  return process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8787";
}
