/**
 * Shared WebSocket message contracts.
 * Server ⇄ client. Adapter layer is responsible for normalizing any deviation.
 */

export type WSState =
  | "CONNECTING"
  | "OPEN"
  | "CLOSING"
  | "CLOSED"
  | "RECONNECTING";

export interface WSMessage<T = unknown> {
  /** Dot-separated channel, e.g. "metrics.cpu.node-01" */
  channel: string;
  /** Message kind */
  type: "data" | "ping" | "pong" | "error" | "ack" | "unsubscribe";
  /** Server-side timestamp (ms since epoch) */
  timestamp: number;
  /** Payload for type=data / ack */
  data?: T;
  /** Present on type=error */
  error?: { code: string; message: string };
  /** Correlation id for request/response */
  correlationId?: string;
}

export interface WSClientMessage {
  type: "subscribe" | "unsubscribe" | "ping" | "request";
  channel?: string;
  channels?: string[];
  correlationId?: string;
  payload?: unknown;
}

export interface WSMetrics {
  messagesReceived: number;
  messagesSent: number;
  bytesReceived: number;
  bytesSent: number;
  connectedAt: number | null;
  reconnectCount: number;
  latency: number | null;
}
