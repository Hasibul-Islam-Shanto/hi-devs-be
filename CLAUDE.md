# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start development server with hot reload (tsx watch)
npm run build        # Lint + compile + minify (SWC) for production
npm run lint         # ESLint on src/
npm run format       # Prettier formatting
npm test             # Run all Vitest tests
npm test -- src/test/app.test.ts   # Run a single test file
npm run cli          # Scaffold a new module (controller/route/validation)
```

## Architecture

This is an Express.js v5 + TypeScript REST API for a developer community platform (blogs, Q&A, jobs, notifications).

**Request flow**: `server.ts` → `app.ts` (middleware stack) → `routes/` → `module/{feature}/` (controller → model)

**Module structure** — each feature under `src/module/{feature}/` follows:

- `{feature}.controller.ts` — HTTP handlers (always wrapped in `catchAsync`)
- `{feature}.route.ts` — Express router + middleware attachment
- `{feature}.validation.ts` — Zod schemas for request body validation
- `{feature}.model.ts` — Mongoose schema + TypeScript interface

**Key cross-cutting pieces:**

- `src/config/envs.ts` — All environment variables, Zod-validated at startup. Add new env vars here.
- `src/middlewares/auth.middleware.ts` — JWT Bearer token verification; attaches `req.user` (userId, username) to protected routes.
- `src/utils/catch-async.ts` — Wraps async controllers so errors propagate to the global error handler automatically. All controllers must use this.
- `src/utils/z-parse.ts` — Parses and validates request bodies against Zod schemas.
- `src/socket/` — Socket.io real-time layer for notifications (has its own auth middleware).
- `src/config/swaggerConfig.ts` — Swagger UI served at `/api-docs`.

## Environment Variables

Required in `.env`:

```
NODE_ENV=development
PORT=8080
MONGO_URI=<mongodb connection string>
JWT_SECRET=<secret>
ACCESS_TOKEN_EXPIRES_IN=30       # minutes
REFRESH_TOKEN_EXPIRES_IN=30      # minutes
CLIENT_URL=http://localhost:3000
REDIS_URL=redis://localhost:6379
```

Optional (with defaults):

- `API_RATE_LIMIT_MAX` (default: 5000)
- `API_RATE_LIMIT_WINDOW_MS` (default: 900000 = 15 min)
- `REDIS_URL` (default: `redis://localhost:6379`)

## Redis

Redis (`ioredis`) is used for two things:

1. **Rate limiting** — `RedisStore` backs `express-rate-limit` in non-test environments; falls back to in-memory during tests.
2. **Notification unread count cache** — cache-aside pattern with a 5-minute TTL (`unread_count:{userId}` key). Invalidated on any read/delete mutation.

Redis client is exported from `src/config/redis.ts`. In tests, `ioredis` is mocked globally in `src/test/setup.ts`.

## Background Jobs

`src/module/job/job.cron.ts` — `node-cron` task that runs every 5 minutes to close expired job listings (sets `status: 'Closed'` where `expiresAt <= now`).

## Conventions

- Use `catchAsync` for all async controller functions — no manual try/catch.
- Use `zParse(schema, req)` to validate request bodies with Zod.
- Import alias `@` maps to `src/` (configured in tsconfig and vitest).
- Tests use `supertest` for HTTP assertions against the Express app.
- Test setup (`src/test/setup.ts`) globally mocks `ioredis` and the DB connection — no real Redis or MongoDB needed in tests.
- Notification side-effects (creating + sending notifications) live in `src/module/notification/helper/` notifiers, called from controllers after the primary DB write.
