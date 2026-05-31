# Project Aurora — Agent Instructions

You are working inside a copy of the **Project Aurora Starter** — a dark,
realtime-oriented Next.js 15 + Tailwind + shadcn/ui template. Read this file
before making changes. The template is opinionated on purpose; do not invent
new patterns when an existing one fits.

## Non-negotiable rules

1. **Colors go through CSS tokens only.** Every color comes from
   `src/styles/tokens.css` via Tailwind semantic classes (`bg-card`,
   `text-primary`, `border-border`, `bg-positive-muted`, …). **No hex, no
   `text-red-500`, no hardcoded `hsl(...)` in component files.** To re-theme,
   change tokens.css — nothing else.

2. **Never `new WebSocket` in a component or hook.** All WS traffic goes
   through `WSClient` (singleton) → `WSStore` → `useChannel` /
   `useChannelValue`. If you need realtime data, call `useChannel(channel,
   handler)`. Channels use dot-separated names (`metrics.cpu.node-01`) and
   support `*` wildcards (`node.health.*`).

3. **Never call `fetch()` directly from components.** Put server calls behind
   a React Query hook or a route handler. Auth is the only exception
   (`/gate` → `/api/auth`).

4. **No `: any`.** If a type is hard, carve out an `interface` next to where
   it's used. WS payloads get generics: `useChannel<MyShape>(...)`.

5. **Visual restraint (Plan §2.5).** No drop shadows (except the gate card).
   Hover transforms ≤ 2px. One hover style per page. Data is the focus —
   decoration is not. `GlowingEffect` is **event-triggered only** (critical
   alerts, etc.), never ambient. Do not mix `GlareCard` and
   `CardSpotlight` on the same page.

6. **Numbers in the UI use `font-mono tabular-nums`.** Transitions default
   to `200ms ease-out` (see Tailwind `duration-normal`).

7. **Three states for every data component**: loading / empty / error. Copy
   the pattern from `MetricCard`.

8. **Register pages in `src/lib/destinations.ts` first.** Do not hardcode
   navigation links inside the sidebar or portal page.

9. **Never connect frontend code directly to Prometheus.** All monitor/status
   reads must go through the `/api/monitor` and `/api/status` BFF routes.

## Directory map

```
src/
  app/(auth)/gate/        password gate (Suspense-wrapped)
  app/(main)/             authenticated routes
    page.tsx              portal navigation from src/lib/destinations.ts
    amp/                  AMP task placeholder
    monitor/              realtime metrics
    intel/                content feed
    status/               health, uptime, logs, alerts
    inspector/            WS debug (dev-gated by middleware)
  components/
    ui/                   shadcn primitives (button, input, select, popover, …)
    data/                 MetricCard, RealtimeChart, DataTable, …
    content/              BentoGrid, Timeline, IntelCard, TagList, Markdown
    status/               PulseIndicator, NodeHealthGrid, UptimeBar,
                          AlertList, LogViewer
    effects/              GlareCard, GlowingEffect, AuroraBackground
    inspector/            MetricsBar, ChannelList, MessageStream
    layout/               AppShell, Sidebar, TopBar
    providers/            Providers, WSProvider
  hooks/                  useChannel, useChannelValue, useAnimatedNumber
  lib/                    destinations, ws-client, format, mock-data, auth, utils
  stores/                 zustand (ui, ws)
  styles/tokens.css       **single source of truth for theme**
  types/ws.ts             WSMessage / WSClientMessage contracts
scripts/mock-ws-server.ts mock WS broadcaster on :8787
```

## Common tasks — where to touch

- **Re-skin the whole app**: edit `src/styles/tokens.css` only.
- **Change the browser title / favicon**: `src/app/layout.tsx` → `metadata`.
- **Change the internal logo**: `src/components/layout/sidebar.tsx`
  (currently renders `/public/dxh.png`).
- **Change the gate password**: set `AUTH_PASSWORD` in `.env.local`.
  `AUTH_SECRET` signs the session JWT — rotate if leaked.
- **Add a new route**: add an entry to `src/lib/destinations.ts`, then drop a
  `page.tsx` under `src/app/(main)/<name>/`. `AppShell` + auth middleware wrap
  it automatically; the portal and sidebar read the destination registry.
- **Add a new chart / card**: follow `RealtimeMetricCard` — thin component
  that reads a channel via `useChannelValue` and hands data to a pure
  presentational component.

## Wiring to a real backend

1. Point `NEXT_PUBLIC_WS_URL` at your WS endpoint.
2. Conform to `src/types/ws.ts`:
   ```ts
   { channel: string, type: "data" | "ack" | "error" | "ping" | "pong",
     timestamp: number, data?: T, error?: { code, message } }
   ```
3. Client→server: `{ type: "subscribe" | "unsubscribe" | "ping", channel }`.
4. If your server's shape differs, add an **adapter** in `src/lib/` — do
   not widen the shared types.
5. Drop `scripts/mock-ws-server.ts` from `pnpm dev:ws` once you're live
   against the real backend.

## Deployment: sub-path under another site (reverse proxy)

This template is designed to be mounted as a sub-path of a main site (e.g.
`https://main.example.com/aurora/…`) while running on a separate host.

**Build-time toggle:**

```bash
BASE_PATH=/aurora BUILD_STANDALONE=1 pnpm build
```

- `BASE_PATH` sets Next's `basePath` + `assetPrefix` and scopes the auth
  cookie to that path (`src/app/api/auth/route.ts`). All internal links
  (`Link href="/intel"`) automatically become `/aurora/intel`.
- `BUILD_STANDALONE=1` produces `.next/standalone` for Docker.

**Main site nginx** (separate host from Aurora):

```nginx
location /aurora/ {
    proxy_pass http://aurora-host:3000/aurora/;   # keep the prefix
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    # WebSocket upgrade
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_read_timeout 3600s;
}
```

The trailing `/aurora/` on both sides keeps the prefix intact — Next was
built expecting to see it. If you `proxy_pass http://backend/;` (no
trailing prefix), Next will 404 on its own assets.

**WebSocket through the same proxy:** set
`NEXT_PUBLIC_WS_URL=wss://main.example.com/aurora/ws` and add a matching
nginx location that proxies to your WS service with the same upgrade
headers.

**Auth sits on the main domain** — same origin, same cookie, no CORS, no
`SameSite=None` gymnastics.

## Pre-flight checklist before marking work done

```bash
pnpm tsc --noEmit                                     # 0 errors
pnpm build                                            # 0 errors
grep -rn '#[0-9a-fA-F]\{3,6\}' src/components src/app # empty
grep -rn 'new WebSocket' src/components src/hooks     # empty
grep -rn ': any' src --include='*.ts' --include='*.tsx' \
   | grep -v node_modules | grep -v '.d.ts'           # empty
grep -rn 'fetch(' src/components                      # empty
```

If any of these come back non-empty, fix before handing off.
