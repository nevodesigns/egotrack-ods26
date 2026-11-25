import postgres from "postgres";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { env, requireDatabaseUrl } from "./env.js";

let _sql: ReturnType<typeof postgres> | null = null;

/** the single database connection. Lazy, so the server can start and answer
 * /health even before a database is reachable. */
export function sql() {
  if (!_sql) {
    _sql = postgres(requireDatabaseUrl(), { max: 10 });
  }
  return _sql;
}

export async function pingDatabase(): Promise<boolean> {
  if (!env.databaseUrl) return false;
  try {
    await sql()`select 1`;
    return true;
  } catch {
    return false;
  }
}

/** runs db/001_init.sql. Safe to call on every start: every statement in
 * that file is written with IF NOT EXISTS. */
export async function runMigration() {
  const here = dirname(fileURLToPath(import.meta.url));
  // server/dist/db.js -> ../../db/001_init.sql, server/src/db.ts -> ../../db/001_init.sql
  const migrationPath = join(here, "..", "..", "db", "001_init.sql");
  const script = readFileSync(migrationPath, "utf8");
  await sql().unsafe(script);
}
