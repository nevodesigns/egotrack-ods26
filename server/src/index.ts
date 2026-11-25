import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { env } from "./env.js";
import { pingDatabase, runMigration } from "./db.js";
import { auth } from "./routes/auth.js";
import { pages } from "./routes/pages.js";
import { customers } from "./routes/customers.js";
import { trust, publicTrust } from "./routes/trust.js";
import { summary } from "./routes/summary.js";
import { qrSvg } from "./lib/qr.js";

const here = dirname(fileURLToPath(import.meta.url));
// server/dist/index.js -> ../../web/dist ; server/src/index.ts -> ../../web/dist
const webDist = join(here, "..", "..", "web", "dist");

const app = new Hono();

app.get("/health", async (c) => {
  const database = env.databaseUrl ? await pingDatabase() : false;
  return c.json({
    ok: true,
    database,
    demo: env.demoEnabled,
  });
});

app.route("/api/auth", auth);
app.route("/api/pages", pages);
app.route("/api/customers", customers);
app.route("/api/trust", trust);
app.route("/api/summary", summary);
app.route("/api/public", publicTrust);

// a QR for a link into our own app only, never an arbitrary URL
app.get("/api/qr", async (c) => {
  const text = c.req.query("text") ?? "";
  const url = new URL(text, env.appUrl);
  if (url.origin !== new URL(env.appUrl).origin) {
    return c.json({ error: "Only links into this app can be turned into a QR code." }, 400);
  }
  const svg = await qrSvg(text);
  return c.body(svg, 200, { "Content-Type": "image/svg+xml" });
});

if (existsSync(webDist)) {
  app.use("/*", serveStatic({ root: webDist }));
  // a client side route the server does not know about still gets the
  // built index.html, so the browser router (react-router) can take over
  app.get("*", serveStatic({ root: webDist, path: "index.html" }));
} else {
  app.get("/", (c) =>
    c.text(
      "EgoTrack server is running. The web app is not built yet: run `npm run build` in web/.",
    ),
  );
}

async function start() {
  if (env.databaseUrl) {
    try {
      await runMigration();
      console.log("Migration ran.");
    } catch (err) {
      console.error("Migration did not run (continuing so /health still answers):", err);
    }
  } else {
    console.warn("DATABASE_URL not set. Only /health will work until it is.");
  }

  serve({ fetch: app.fetch, port: env.port }, (info) => {
    console.log(`EgoTrack server listening on http://localhost:${info.port}`);
  });
}

start();
