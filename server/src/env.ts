/**
 * Settings loading. Names only come from here; values are never hard coded
 * and never committed. See .env.example and
 * ~/odS_hack/plan/16_BUILD_BLUEPRINT.md section L.
 */

function required(name: string): string {
  const v = process.env[name];
  if (!v) {
    // fail loudly at start, not partway through a request
    throw new Error(`Missing setting: ${name}. Check the server's .env file.`);
  }
  return v;
}

function optional(name: string, fallback: string): string {
  return process.env[name] ?? fallback;
}

export const env = {
  port: Number(optional("PORT", "8787")),
  appUrl: optional("APP_URL", "http://localhost:8787"),
  databaseUrl: optional("DATABASE_URL", ""),
  sessionSecret: optional("SESSION_SECRET", "dev-only-secret-change-me"),
  aiProvider: optional("AI_PROVIDER", "gemini"),
  geminiApiKey: optional("GEMINI_API_KEY", ""),
  backupAiKey: optional("BACKUP_AI_KEY", ""),
  demoEnabled: optional("DEMO_ENABLED", "true") === "true",
};

/** called once at startup when the server is about to talk to Postgres */
export function requireDatabaseUrl(): string {
  return required("DATABASE_URL");
}
