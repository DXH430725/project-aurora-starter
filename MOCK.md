# Monitor Mock Data

Use mock mode for local frontend work without Prometheus:

```bash
MONITOR_MOCK=1 pnpm dev
```

To exercise the real BFF path, unset mock mode and provide Prometheus:

```bash
MONITOR_MOCK=0
PROMETHEUS_URL=http://127.0.0.1:9090
pnpm dev
```

If `MONITOR_MOCK` is unset or not `1`, `/api/monitor`, `/api/monitor/range`, and
`/api/status` query `PROMETHEUS_URL`. With no reachable Prometheus, the BFF
returns `502` with `{ "error": "监控数据源不可达" }`, and the pages render the
whole-page error state.

## Performance Nodes

Mock `/monitor` includes five nodes:

| Node | Region | Mock case |
| --- | --- | --- |
| `racknerd-dublin` | Dublin | Online baseline |
| `racknerd-us` | US | Online, higher CPU/memory |
| `byvirt-jp` | Japan | Online, lower CPU |
| `Massivegird-Longdong` | London | Online, highest disk usage |
| `LengendVPS-SG` | Singapore | Offline, metrics are `null` |

The range endpoint returns 60 minutes of 30-second samples. Offline nodes do not
emit chart series, while the node table shows them as offline with `—` values.

## Service Status

Mock `/status` includes five service rows:

| Service | 7-day shape | Visual branch |
| --- | --- | --- |
| AMP 平台 API | 7 green days | Fully operational |
| NORMA /health | Day 3 and day 5 red | Intermittent outage |
| Pulse Monitor | 7 green days | High-availability baseline |
| 博客监控任务 | First 4 days gray, last 3 green | New service; gray days excluded from uptime |
| 实验中的新服务 | 7 gray days | No data; uptime displays `—` |

The status bar is intentionally three-state: green means sampled and healthy,
red means sampled and below the availability threshold, gray means no sample.
Gray days never count in the uptime denominator.
