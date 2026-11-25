# EgoTrack

Turns a trader's paper notebook into records she can check, keep safe and share. Built live at the Ogun Innovate Hackathon, 25 Nov 2026. Plans live outside this repo in `~/odS_hack/plan/` (read `20_HANDOFF.md` first).

## Stack
TypeScript. `server/` Node + Hono, plain SQL with `postgres`, bcryptjs, sessions in Postgres. `web/` React + Vite, plain CSS tokens, Lucide icons, hand-written service worker, idb-keyval outbox. `db/` one migration. `deploy/` Docker Compose (app, db, caddy) and deploy script. Tests: Vitest.

## Rules
- No AI attribution in commits, PRs, README, package.json or comments. No Co-Authored-By or "Generated with" lines.
- No em dashes anywhere.
- Never commit `.env*`, photos, uploads or keys. Never print secrets.
- AI only copies text from photos. All arithmetic is done by code in `server/src/checks/` and covered by tests.
- Money is whole naira integers. Every private query filters by the signed-in shop id.
- UI copy comes from the strings dictionary; follow `~/odS_hack/plan/19_BRAND_AND_UX.md`.
- Commit after every task with a plain message.
