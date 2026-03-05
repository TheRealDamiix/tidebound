# Tidebound - Claude Code Guide

## Project Overview

**Tidebound** is a Caribbean pirate trading MMO web game. Core gameplay: trading goods, building faction reputation, managing ships/crew, and naval combat. Full-stack, real-time multiplayer.

## Monorepo Structure

```
tidebound/
├── apps/
│   ├── web/          # React + Vite frontend (port 3000)
│   └── server/       # Fastify + Node.js backend (port 4000)
├── packages/
│   └── shared/       # TypeScript types, constants, utilities (no deps)
├── docker/           # Docker Compose (Redis) + Dockerfile.server
└── supabase/         # DB migrations
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite 5, Tailwind CSS 3, React Router 6, Zustand |
| Backend | Node.js 20, Fastify 4, Socket.io 4 |
| Auth/DB | Supabase (PostgreSQL + Auth) |
| Cache | Redis via ioredis |
| Real-time | Socket.io (client + server) |
| Language | TypeScript 5.5 (strict) throughout |
| Package Manager | **pnpm** (required — do not use npm or yarn) |

## Commands

```bash
# Development
pnpm dev                  # Run web + server in parallel

# Individual apps
pnpm --filter web dev
pnpm --filter server dev

# Build
pnpm build                # Build shared first, then all apps

# Code quality
pnpm lint                 # ESLint across all packages
pnpm typecheck            # tsc --noEmit across all packages
pnpm test                 # Tests across all packages

# Docker (Redis)
docker compose -f docker/docker-compose.yml up -d

# Clean
pnpm clean                # Remove dist, node_modules, .turbo
```

## Key Conventions

### TypeScript
- Strict mode enabled everywhere (`tsconfig.base.json`)
- No unused variables (ESLint enforced)
- Path alias `@/` maps to `src/` in both apps

### Code Style (Prettier)
- 2-space indentation
- Single quotes
- 100-character line width
- Tailwind class sorting (prettier-plugin-tailwindcss)

### Shared Package
- **Always build shared before apps**: `pnpm --filter shared build`
- Exports ESM with type declarations
- Zero dependencies — only TypeScript types and pure utilities
- Add all cross-app types and constants here, not in individual apps

### API & Routing
- REST API: `apps/server/src/routes/` — player, market, health endpoints
- WebSocket events: defined in `packages/shared` schemas
- Vite dev proxy: `/api` and `/socket.io` → `localhost:4000`

### Database
- Supabase URL: `https://wnhnumlsnekzlsfhqeii.supabase.co`
- Server uses **service role key** (full access, never expose to client)
- Web uses **anon key** for auth
- Migrations: `supabase/migrations/` — push with `supabase db push`

### State Management
- Frontend global state: Zustand stores in `apps/web/src/`
- Real-time/battle state: Redis on the server side

## Game Domain Reference

- **Ports**: 8 Caribbean ports
- **Cargo types**: 10 trade goods
- **Factions**: 4 factions
- **Theme colors**: ocean blues, sand, gold (`apps/web/tailwind.config.cjs`)
- **Heading font**: Cinzel (pirate aesthetic)

## Infrastructure

### Docker
- `docker/docker-compose.yml`: Redis 7-alpine on port 6379 with persistence
- `docker/Dockerfile.server`: Multi-stage build → production image on port 4000

### CI/CD (GitHub Actions)
- **Triggers**: push/PR to `main` and `develop`
- **Jobs**: lint+typecheck → test → build Docker image (main only)
- Docker image tagged: `tidebound-server:<git-sha>`

## Development Notes

- Tests are defined but not yet implemented — framework TBD
- DB schema migrations are in early stage
- Game logic is being built out incrementally
- Server entry point: `apps/server/src/index.ts`
- Web entry point: `apps/web/src/main.tsx`
