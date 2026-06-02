# Multi-Zone Deployment Rollback

This document is for the operations bot. Frontend agents must not execute these
commands during the development phase.

## Invariants

- Do not modify or restart sub2api.
- Do not modify `api.430123.xyz` Nginx config, DNS, process, or port.
- Keep the old `/opt/aurora` service on `127.0.0.1:3000` until the ticket is
  closed and a separate cleanup is approved.
- Before any Nginx reload, run `nginx -t`.

## New Services To Roll Back

If deployment creates these units:

- `aurora-main.service` on `127.0.0.1:3001`
- `aurora-status.service` on `127.0.0.1:3002`
- `aurora-amp.service` on `127.0.0.1:3003`

Rollback commands:

```bash
sudo systemctl stop aurora-main.service aurora-status.service aurora-amp.service
sudo systemctl disable aurora-main.service aurora-status.service aurora-amp.service
```

Do not remove deployment directories until the user confirms cleanup.

## Nginx Rollback

If `main.conf` and `amp.conf` were added:

```bash
sudo rm -f /etc/nginx/conf.d/main.conf /etc/nginx/conf.d/amp.conf
sudo nginx -t
sudo systemctl reload nginx
```

If `status.conf` upstream was changed from `127.0.0.1:3000` to
`127.0.0.1:3002`, revert only that upstream:

```bash
sudo cp /etc/nginx/conf.d/status.conf /etc/nginx/conf.d/status.conf.rollback.$(date +%Y%m%d%H%M%S)
sudo sed -i 's#proxy_pass http://127.0.0.1:3002;#proxy_pass http://127.0.0.1:3000;#' /etc/nginx/conf.d/status.conf
sudo nginx -t
sudo systemctl reload nginx
```

After reload, verify `https://status.430123.xyz/monitor` and
`https://api.430123.xyz/` still behave as expected.

## DNS Rollback

The user performs DNS changes manually. If root-domain rollout fails:

- Remove or revert the `430123.xyz` A record according to the DNS provider UI.
- Remove the `amp.430123.xyz` A record if AMP is being rolled back.
- Do not change `api.430123.xyz`.
- Do not change `status.430123.xyz` unless explicitly directed.

## Certificate Rollback

Certificates issued for `430123.xyz` and `amp.430123.xyz` can remain installed;
they are harmless if Nginx configs are removed. Do not delete certbot material
unless the user asks for cleanup.

## Post-Rollback Checks

```bash
curl -sSI https://api.430123.xyz/
curl -sSI https://status.430123.xyz/monitor
sudo systemctl status nginx --no-pager
```

Seven days after successful rollout, the user may approve a separate cleanup
ticket for old `/opt/aurora` and port `3000`.

## Batch 11 - Aurora Auth/Nav/AMP Overview Patch

This batch changes frontend code and app env only:

- shared auth cookie options now support `AUTH_COOKIE_DOMAIN`
- status/amp sidebars use absolute cross-zone links for routes they do not own
- AMP zone reads the colocated AMP API through `AMP_API_INTERNAL_URL`

Rollback:

```bash
cd /opt/aurora-multizone
git checkout 454945af53c1107127f1f9f838d8c22881b4fcf0 -- .
pnpm install --frozen-lockfile
pnpm --filter @aurora/main build
sudo systemctl restart aurora-main
pnpm --filter @aurora/status build
sudo systemctl restart aurora-status
pnpm --filter @aurora/amp build
sudo systemctl restart aurora-amp
```

If cross-zone auth must be disabled without rolling back code, remove
`AUTH_COOKIE_DOMAIN` from all three `.env.production.local` files and restart
the three Aurora services. Do not print or rotate `AUTH_SECRET` unless the user
explicitly approves secret rotation.
