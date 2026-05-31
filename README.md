# Project Aurora Starter

Personal frontend template — Next.js 15 + Tailwind + shadcn/ui + a realtime
WebSocket layer. Dark, quiet, Linear-inspired. Designed to be copied, not
forked.

## Quick start

```bash
gh repo create my-new-project --template <your-username>/project-aurora-starter
cd my-new-project
pnpm install
cp .env.example .env.local
pnpm dev:ws        # Next + mock WS server on :3000 and :8787
```

Open http://localhost:3000 and enter the gate password (set via `AUTH_SECRET`
/ `AUTH_PASSWORD` in `.env.local`).

`pnpm dev` and `pnpm dev:ws` run Next with Turbopack enabled. Use
`pnpm build && pnpm start` when judging production startup or first-screen
performance; Next dev still compiles routes on first visit.

For local monitor/status page work without Prometheus:

```bash
MONITOR_MOCK=1 pnpm dev
```

Set `PROMETHEUS_URL` and leave `MONITOR_MOCK` empty or `0` to exercise the real
BFF path. Browser code must not connect to Prometheus directly.

## Change the theme

Edit `src/styles/tokens.css`. Every color is a CSS variable, so re-skinning the
entire template takes a few numbers. No component hardcodes color.

## Wire to a real backend

1. Point `NEXT_PUBLIC_WS_URL` at your WebSocket endpoint.
2. Conform to `src/types/ws.ts` (`WSMessage`, `WSClientMessage`), or add an
   adapter layer that normalizes your server's shape.
3. Use dot-separated channels: `metrics.cpu.node-01`, `alerts.critical`,
   `node.health.*`. `useChannel()` supports `*` wildcards.

## Directory structure

```
src/
  app/
    (auth)/gate        - password gate
    api/
      monitor/         - Prometheus BFF for node metrics
      status/          - Prometheus BFF for service status
    (main)/            - authenticated routes
      page.tsx         - portal navigation from destinations.ts
      amp/             - AMP placeholder route
      monitor/         - realtime metrics
      intel/           - content feed
      status/          - health, alerts, logs
      inspector/       - WS debug panel (dev-only, gated by middleware)
  components/
    ui/                - shadcn primitives
    data/              - metric cards, charts, tables
    content/           - bento grid, timeline, intel card, markdown
    status/            - pulse, node grid, uptime, alerts, logs
    effects/           - glare card, glowing effect, aurora bg
    inspector/         - channel list, message stream, metrics bar
    layout/            - app shell, sidebar, topbar
    providers/         - app + WS providers
  hooks/               - useChannel, useAnimatedNumber
  lib/                 - destinations, monitor mock/types, ws-client, format, utils, auth
  stores/              - zustand (ui, ws)
  styles/tokens.css    - single-source-of-truth theme
  types/               - shared WS contracts
scripts/mock-ws-server.ts
```

`src/lib/destinations.ts` is the single source of truth for pages shown in the
portal and sidebar. To add an internal page, add one destination record and
create the matching route under `src/app/(main)/`. External deployments can be
registered there with `external: true`; the portal opens them in a new tab and
they stay out of the sidebar.

## Example routes

| Route          | Purpose                                   |
| -------------- | ----------------------------------------- |
| `/gate`        | Password gate                             |
| `/`            | Portal navigation                         |
| `/amp`         | AMP task placeholder, pending backend integration |
| `/monitor`     | Realtime metrics, charts, node table      |
| `/intel`       | Bento grid feed + Timeline of events      |
| `/status`      | Pulse, node grid, uptime bars, alerts, logs |
| `/inspector`   | WS message inspector (dev / gated)        |

## Scripts

- `pnpm dev` — Next dev server with Turbopack
- `pnpm dev:ws` — Next with Turbopack + mock WS server
- `pnpm build` — production build (standalone)
- `pnpm typecheck` — `tsc --noEmit`

See `MOCK.md` for monitor/status mock data cases and the mock-to-real switch.

## Docker

```bash
docker build -t aurora-starter .
docker run -p 3000:3000 --env-file .env.local aurora-starter
```

`docker-compose.yml` and `docker/nginx.conf` are provided as a reference
deployment with WebSocket upgrade headers.
