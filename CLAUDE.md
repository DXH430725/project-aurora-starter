# Project Aurora — Agent Instructions

Aurora is a Next.js multi-zone monorepo. The current zones are:

- `apps/main` - root portal and sidebar summary aggregator
- `apps/status` - monitor/status pages and Prometheus BFF
- `apps/amp` - AMP placeholder shell
- `packages/ui` - shared UI, hooks, stores, auth, monitor helpers, and tokens

## Non-Negotiable Rules

1. **Do not touch deployment from frontend tickets.** No SSH, DNS, Nginx,
   certbot, systemd, VPS commands, or production service changes unless the
   user explicitly starts the operations phase.

2. **Never touch sub2api or `api.430123.xyz`.** This repository may link to it
   from the portal, but code changes must not modify its process, ports,
   reverse proxy, config, DNS, or runtime assumptions.

3. **Colors go through tokens only.** Theme variables live in
   `packages/ui/src/styles/tokens.css`. Component files must use semantic
   Tailwind classes or existing CSS variables, not raw hex colors.

4. **Frontend must not connect directly to Prometheus.** Monitor/status reads
   go through `apps/status/src/app/api/monitor` and
   `apps/status/src/app/api/status`.

5. **Register navigation in the app-local destination registry.** Main app
   destinations live in `apps/main/src/lib/destinations.ts`; child zones keep
   their own minimal sidebar destinations under their app `src/lib`.

6. **No new WebSocket realtime behavior.** Sidebar summary uses BFF polling.
   Existing WS helpers remain in `packages/ui` only for legacy components.

7. **No `: any`.** Use explicit interfaces and `unknown` with narrowing.

8. **Three states for monitor/status data components:** loading, empty, error.
   BFF 502 must show the whole-page “监控数据源不可达” error state.

## Where To Touch

- Main portal cards/sidebar: `apps/main/src/lib/destinations.ts` and
  `apps/main/src/app/(main)/page.tsx`
- Main summary aggregation: `apps/main/src/app/api/sidebar-summary/route.ts`
- Monitor/status UI: `apps/status/src/app/(main)/monitor/page.tsx` and
  `apps/status/src/app/(main)/status/page.tsx`
- Prometheus BFF: `apps/status/src/app/api/monitor`,
  `apps/status/src/app/api/status`, and shared helpers in `packages/ui/src/lib`
- AMP placeholder: `apps/amp/src/app/(main)/amp/page.tsx`
- Shared layout/components/tokens: `packages/ui/src`

## Verification

Run before marking frontend work complete:

```bash
pnpm typecheck
pnpm lint
pnpm build
```

For local multi-zone verification:

```bash
MONITOR_MOCK=1 pnpm dev:zones
```

Use local URLs:

- Main: `http://localhost:3001`
- Status: `http://localhost:3002`
- AMP: `http://localhost:3003`

The main app should rewrite `/monitor`, `/status`, and `/amp` to child zones.
