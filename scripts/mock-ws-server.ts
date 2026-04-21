/**
 * Aurora mock WebSocket server.
 * - Listens on ws://localhost:8787 (override with MOCK_WS_PORT)
 * - Pushes metrics.cpu.* / metrics.memory.* / metrics.network.* every 1s
 * - node.health.* every 5s
 * - alerts.* at random intervals
 * - intel.feed every 30s
 * - Disconnects every 30s (tests reconnect logic)
 * - 5% chance of emitting an `error` message
 */

import { WebSocketServer, WebSocket } from "ws";

type ClientMsg =
  | { type: "subscribe"; channel: string }
  | { type: "unsubscribe"; channel: string }
  | { type: "ping" };

const PORT = Number(process.env.MOCK_WS_PORT ?? 8787);
const NODES = ["node-01", "node-02", "node-03", "node-04", "node-05", "node-06", "node-07", "node-08"];

const wss = new WebSocketServer({ port: PORT });

interface ClientState {
  socket: WebSocket;
  subs: Set<string>;
}

const clients = new Set<ClientState>();

function channelMatches(sub: string, concrete: string): boolean {
  if (sub === concrete) return true;
  if (!sub.endsWith("*")) return false;
  return concrete.startsWith(sub.slice(0, -1));
}

function send(state: ClientState, msg: unknown) {
  if (state.socket.readyState !== WebSocket.OPEN) return;
  try {
    state.socket.send(JSON.stringify(msg));
  } catch {
    /* ignore */
  }
}

function broadcast(channel: string, data: unknown, type: "data" | "error" = "data") {
  const msg = {
    channel,
    type,
    timestamp: Date.now(),
    ...(type === "error"
      ? { error: { code: "MOCK_ERR", message: "Simulated transient error" } }
      : { data }),
  };
  for (const c of clients) {
    const match = Array.from(c.subs).some((s) => channelMatches(s, channel));
    if (match) send(c, msg);
  }
}

// ------------------- generators -------------------

let prevCpu: Record<string, number> = {};
function jitter(prev: number, min: number, max: number, step = 6): number {
  const next = prev + (Math.random() - 0.5) * step;
  return Math.max(min, Math.min(max, next));
}

setInterval(() => {
  const maybeError = Math.random() < 0.05;
  for (const node of NODES) {
    const p = prevCpu[node] ?? 20 + Math.random() * 30;
    const cpu = jitter(p, 0, 100, 10);
    prevCpu[node] = cpu;
    const mem = jitter((p + 20) % 90, 10, 95, 4);
    const net = Math.round(Math.random() * 1200);
    broadcast(`metrics.cpu.${node}`, { cpu: Number(cpu.toFixed(1)) });
    broadcast(`metrics.memory.${node}`, {
      used: Math.round(mem * 163.84),
      total: 16384,
      percent: Number(mem.toFixed(1)),
    });
    broadcast(`metrics.network.${node}`, { rxKbps: net, txKbps: Math.round(net * 0.7) });
  }
  if (maybeError) {
    broadcast("metrics.cpu.node-03", null, "error");
  }

  // aggregate metrics
  const allCpu = Object.values(prevCpu);
  const avgCpu = allCpu.reduce((a, b) => a + b, 0) / Math.max(1, allCpu.length);
  broadcast("metrics.summary", {
    activeNodes: NODES.length - (Math.random() < 0.1 ? 1 : 0),
    reqPerSec: Math.round(1000 + Math.random() * 400),
    p99Latency: Math.round(20 + Math.random() * 20),
    uptimePercent: Number((99.5 + Math.random() * 0.5).toFixed(2)),
    avgCpu: Number(avgCpu.toFixed(1)),
  });
}, 1000);

setInterval(() => {
  for (const node of NODES) {
    const r = Math.random();
    const status =
      r > 0.95 ? "down" : r > 0.85 ? "degraded" : r > 0.02 ? "healthy" : "unknown";
    broadcast(`node.health.${node}`, {
      id: node,
      name: node,
      status,
      cpu: Math.round(prevCpu[node] ?? 20),
      memory: Math.round(40 + Math.random() * 40),
      latency: Math.round(10 + Math.random() * 300),
    });
  }
}, 5000);

setInterval(() => {
  if (Math.random() < 0.4) {
    const severity = Math.random() < 0.15 ? "critical" : Math.random() < 0.5 ? "warning" : "info";
    broadcast(`alerts.${severity}`, {
      id: `a-${Date.now()}`,
      severity,
      title: severity === "critical" ? "Node connection refused" : "Threshold exceeded",
      description: "Auto-generated mock alert",
      triggeredAt: new Date().toISOString(),
    });
  }
}, 8000);

setInterval(() => {
  broadcast("intel.feed", {
    id: `i-${Date.now()}`,
    title: "New intel item",
    summary: "Mock intel delivered via WS.",
    tags: ["mock", "intel"],
    publishedAt: new Date().toISOString(),
  });
}, 30_000);

// Periodically drop clients to exercise reconnect
setInterval(() => {
  for (const c of clients) {
    try {
      c.socket.close(1012, "scheduled reset");
    } catch {
      /* noop */
    }
  }
}, 60_000);

wss.on("connection", (socket) => {
  const state: ClientState = { socket, subs: new Set() };
  clients.add(state);

  socket.on("message", (raw) => {
    let msg: ClientMsg;
    try {
      msg = JSON.parse(raw.toString()) as ClientMsg;
    } catch {
      return;
    }
    if (msg.type === "subscribe" && msg.channel) {
      state.subs.add(msg.channel);
      send(state, { channel: msg.channel, type: "ack", timestamp: Date.now() });
    } else if (msg.type === "unsubscribe" && msg.channel) {
      state.subs.delete(msg.channel);
    } else if (msg.type === "ping") {
      send(state, { channel: "_system", type: "pong", timestamp: Date.now() });
    }
  });

  socket.on("close", () => {
    clients.delete(state);
  });
  socket.on("error", () => {
    clients.delete(state);
  });
});

console.log(`[mock-ws] listening on ws://localhost:${PORT}`);
