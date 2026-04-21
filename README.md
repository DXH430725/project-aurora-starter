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
    (main)/            - authenticated routes
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
  lib/                 - ws-client, format, mock-data, utils, auth
  stores/              - zustand (ui, ws)
  styles/tokens.css    - single-source-of-truth theme
  types/               - shared WS contracts
scripts/mock-ws-server.ts
```

## Example routes

| Route          | Purpose                                   |
| -------------- | ----------------------------------------- |
| `/gate`        | Password gate                             |
| `/`            | Landing / scenario picker                 |
| `/monitor`     | Realtime metrics, charts, node table      |
| `/intel`       | Bento grid feed + Timeline of events      |
| `/status`      | Pulse, node grid, uptime bars, alerts, logs |
| `/inspector`   | WS message inspector (dev / gated)        |

## Scripts

- `pnpm dev` — Next dev server only
- `pnpm dev:ws` — Next + mock WS server
- `pnpm build` — production build (standalone)
- `pnpm typecheck` — `tsc --noEmit`

## Docker

```bash
docker build -t aurora-starter .
docker run -p 3000:3000 --env-file .env.local aurora-starter
```

`docker-compose.yml` and `docker/nginx.conf` are provided as a reference
deployment with WebSocket upgrade headers.
