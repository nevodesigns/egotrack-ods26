import { Hono } from "hono";
import { sql } from "../db.js";
import { env } from "../env.js";
import { hashPin, verifyPin, createSession, setSessionCookie, clearSession, getAuthedShop } from "../lib/auth.js";
import { seedDemoShop } from "../seed.js";

export const auth = new Hono();

auth.post("/register", async (c) => {
  const body = await c.req.json();
  const { phone, pin, name, market, state, goods, language } = body ?? {};
  if (!phone || !pin || !name || !market) {
    return c.json({ error: "Phone, PIN, shop name and market are required." }, 400);
  }
  if (!/^\d{4}$/.test(String(pin))) {
    return c.json({ error: "PIN must be 4 digits." }, 400);
  }

  const existing = await sql()`select id from shops where phone = ${phone}`;
  if (existing.length > 0) {
    return c.json({ error: "A shop with this phone number already exists. Try signing in." }, 409);
  }

  const pinHash = await hashPin(String(pin));
  const [shop] = await sql()`
    insert into shops (name, market, state, goods, phone, pin_hash, language)
    values (${name}, ${market}, ${state ?? "Ogun"}, ${goods ?? ""}, ${phone}, ${pinHash}, ${language ?? "en"})
    returning id
  `;
  await sql()`insert into branches (shop_id, name, market) values (${shop!.id}, 'Main shop', ${market})`;

  const { token, expiresAt } = await createSession(shop!.id);
  setSessionCookie(c, token, expiresAt);
  return c.json({ ok: true });
});

auth.post("/login", async (c) => {
  const { phone, pin } = (await c.req.json()) ?? {};
  if (!phone || !pin) return c.json({ error: "Phone and PIN are required." }, 400);

  const rows = await sql()`select id, pin_hash from shops where phone = ${phone}`;
  const shop = rows[0];
  if (!shop || !(await verifyPin(String(pin), shop.pin_hash))) {
    return c.json({ error: "Phone number or PIN is not right." }, 401);
  }

  const { token, expiresAt } = await createSession(shop.id);
  setSessionCookie(c, token, expiresAt);
  return c.json({ ok: true });
});

auth.post("/demo", async (c) => {
  if (!env.demoEnabled) return c.json({ error: "The demo shop is switched off." }, 403);
  const shopId = await seedDemoShop();
  const { token, expiresAt } = await createSession(shopId);
  setSessionCookie(c, token, expiresAt);
  return c.json({ ok: true });
});

auth.post("/logout", async (c) => {
  await clearSession(c);
  return c.json({ ok: true });
});

auth.get("/me", async (c) => {
  const shop = await getAuthedShop(c);
  if (!shop) return c.json({ error: "Not signed in." }, 401);
  return c.json({ shop });
});
