# PixConvert

PixConvert is a free, privacy-focused, and open-source file conversion tool.
It's built with React, Vite, and Express.

## Docker

The repo includes a portable production container setup:

- `Dockerfile`: multi-stage build for the frontend and Express server
- `docker-compose.yml`: app + Nginx edge setup
- `nginx.scaling.conf`: reverse proxy for multiple app replicas
- `scripts/docker-autoscale.mjs`: CPU/RAM-based autoscaler for the `app` service

### Run locally in Docker

1. Copy `.env.example` to `.env` and fill in production values.
2. Start the stack:

```bash
docker compose up --build -d
```

### Manual scaling

```bash
docker compose up --build --scale app=3 -d
```

### CPU/RAM autoscaling

Plain Docker Compose does not natively autoscale on CPU or RAM. This repo includes a host-side autoscaler script that does that for the `app` service.

Min/max bounds:

- minimum replicas: `1`
- maximum replicas: `10`

Start the stack, then run:

```bash
npm run autoscale:docker
```

The autoscaler polls Docker stats and scales `app` up or down between `1` and `10` using these env values:

```bash
APP_MIN_REPLICAS=1
APP_MAX_REPLICAS=10
AUTOSCALE_CPU_SCALE_UP=75
AUTOSCALE_CPU_SCALE_DOWN=25
AUTOSCALE_MEM_SCALE_UP=80
AUTOSCALE_MEM_SCALE_DOWN=35
AUTOSCALE_POLL_MS=30000
AUTOSCALE_COOLDOWN_MS=120000
```

Note: uploaded files are stored in the shared `uploads-data` Docker volume. If you later scale across multiple hosts, move uploads to shared object storage or a shared filesystem.
