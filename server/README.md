# server

The web server: API routes, the AI reader, the check rules, database queries, the demo shop seed script. Serves the built `web/` app too, so the whole product is one process on one Nobus server.

## Stack

Node, TypeScript, Hono, `postgres` for plain SQL, bcryptjs for PINs, cookie sessions. Tests: Vitest.

## Running it

```
npm install
cp .env.example .env   # fill in values locally; never commit this file
npm run build
npm start
```

Without `DATABASE_URL` set, the server still starts and `/health` answers `{ ok: true, database: false }`, so the static web app and the health check can be verified before Postgres exists.

## The check rules

`src/checks/money.ts` turns what the AI reader copied into whole naira, flagging anything it is not sure of instead of guessing. `src/checks/checks.ts` does the arithmetic: quantity times price, the page's own sum against what the trader wrote, and the one-tap "did you mean &#8358;X,000" fix, offered only when it makes the page add up exactly. Both are pure functions with full tests (`npm test`), built from real notebook pages in `~/odS_hack/plan/18_NOTEBOOK_SAMPLES.md`.
