# Project Aurora Multi-Zone

Aurora is now a local-first Next.js multi-zone monorepo:

- `apps/main` - root portal for `430123.xyz`
- `apps/status` - monitor and status zone for `status.430123.xyz`
- `apps/amp` - AMP read-only task overview zone for `amp.430123.xyz`
- `packages/ui` - shared components, hooks, stores, monitor BFF helpers, and design tokens

This repository contains the frontend and deployment-ready app structure only.
Do not run VPS, DNS, Nginx, certbot, or systemd operations from frontend work.

## Quick Start

```bash
pnpm install
cp .env.local.example .env.local
pnpm dev:zones
```

Local ports:

| App | URL |
| --- | --- |
| Main | `http://localhost:3001` |
| Status | `http://localhost:3002` |
| AMP | `http://localhost:3003` |

Use `AUTH_PASSWORD` from `.env.local` for the gate. In local mock mode, set:

```bash
MONITOR_MOCK=1
INTERNAL_STATUS_URL=http://localhost:3002
INTERNAL_AMP_URL=http://localhost:3003
STATUS_ZONE_URL=http://localhost:3002
AMP_ZONE_URL=http://localhost:3003
AMP_API_INTERNAL_URL=http://127.0.0.1:8000
```

Then open `http://localhost:3001`. The main app links to the status and AMP
zones as separate subdomain pages.

## Commands

- `pnpm dev:zones` - run main/status/amp dev servers on 3001/3002/3003
- `pnpm dev:main` - run only the main zone
- `pnpm dev:status` - run only the status zone
- `pnpm dev:amp` - run only the AMP zone
- `pnpm typecheck` - typecheck all apps
- `pnpm lint` - lint all apps
- `pnpm build` - build all apps

## Directory Map

```text
apps/
  main/
    src/app/(main)/page.tsx              - root portal
    src/app/api/sidebar-summary/route.ts - status/amp summary aggregator
    next.config.ts                       - multi-zone rewrites
  status/
    src/app/(main)/monitor/page.tsx      - node metrics page
    src/app/(main)/status/page.tsx       - service status page
    src/app/api/monitor/                 - Prometheus BFF
    src/app/api/status/                  - blackbox status BFF
    src/app/api/summary/route.ts         - public low-sensitive summary
  amp/
    src/app/(main)/amp/page.tsx          - AMP read-only task overview
    src/app/api/tasks/route.ts           - AMP task/metrics/recent-runs BFF
    src/app/api/summary/route.ts         - AMP task summary
packages/
  ui/src/components/                     - shared UI and layout
  ui/src/hooks/                          - shared hooks
  ui/src/lib/                            - auth, monitor mock/types, Prometheus helpers
  ui/src/styles/tokens.css               - theme tokens
```

## Zone Routing Notes

Main zone redirects old root-domain child paths to their owning subdomains:

- `/monitor/:path*` -> `STATUS_ZONE_URL` or `https://status.430123.xyz`
- `/status/:path*` -> `STATUS_ZONE_URL` or `https://status.430123.xyz`
- `/amp/:path*` -> `AMP_ZONE_URL` or `https://amp.430123.xyz`

The root domain is a portal and summary surface only. It does not render child
zone pages through rewrites because mixed-domain Next.js assets and middleware
are too brittle for the current deployment.

For cross-zone auth in production, set the same `AUTH_SECRET` in all three
apps and set `AUTH_COOKIE_DOMAIN=.430123.xyz`. The AMP zone also needs
`AMP_API_INTERNAL_URL=http://127.0.0.1:8000` to read the colocated AMP API.

## Deployment Handoff

The frontend phase stops after code, local validation, commit, and push.
Operations bot should deploy:

- main on `127.0.0.1:3001`
- status on `127.0.0.1:3002`
- amp on `127.0.0.1:3003`

Do not touch `api.430123.xyz` or sub2api. See `ROLLBACK.md` for the deployment
rollback plan and invariants.
