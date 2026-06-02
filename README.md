# Project Aurora Multi-Zone

Aurora is now a local-first Next.js multi-zone monorepo:

- `apps/main` - root portal for `430123.xyz`
- `apps/status` - monitor and status zone for `status.430123.xyz`
- `apps/amp` - AMP placeholder zone for `amp.430123.xyz`
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
```

Then open `http://localhost:3001`. The main app rewrites `/monitor`, `/status`,
and `/amp` to the status and AMP zones.

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
    src/app/(main)/amp/page.tsx          - AMP placeholder
    src/app/api/summary/route.ts         - placeholder task summary
packages/
  ui/src/components/                     - shared UI and layout
  ui/src/hooks/                          - shared hooks
  ui/src/lib/                            - auth, monitor mock/types, Prometheus helpers
  ui/src/styles/tokens.css               - theme tokens
```

## Multi-Zone Notes

Main zone rewrites:

- `/monitor/:path*` -> `STATUS_ZONE_URL` or `https://status.430123.xyz`
- `/status/:path*` -> `STATUS_ZONE_URL` or `https://status.430123.xyz`
- `/amp/:path*` -> `AMP_ZONE_URL` or `https://amp.430123.xyz`
- `/status-assets/:path*` -> status zone `_next` assets
- `/amp-assets/:path*` -> AMP zone `_next` assets

In production, `apps/status` uses `assetPrefix=/status-assets` and `apps/amp`
uses `assetPrefix=/amp-assets`, so rewritten pages can hydrate from the main
domain.

## Deployment Handoff

The frontend phase stops after code, local validation, commit, and push.
Operations bot should deploy:

- main on `127.0.0.1:3001`
- status on `127.0.0.1:3002`
- amp on `127.0.0.1:3003`

Do not touch `api.430123.xyz` or sub2api. See `ROLLBACK.md` for the deployment
rollback plan and invariants.
