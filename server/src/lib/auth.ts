import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import type { Context } from "hono";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import { sql } from "../db.js";

const SESSION_COOKIE = "egotrack_session";
const SESSION_DAYS = 2; // comfortably covers one hackathon day

export async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, 10);
}

export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pin, hash);
}

export async function createSession(shopId: string): Promise<{ token: string; expiresAt: Date }> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await sql()`
    insert into sessions (token, shop_id, expires_at)
    values (${token}, ${shopId}, ${expiresAt})
  `;
  return { token, expiresAt };
}

export function setSessionCookie(c: Context, token: string, expiresAt: Date) {
  setCookie(c, SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function clearSession(c: Context) {
  const token = getCookie(c, SESSION_COOKIE);
  if (token) {
    await sql()`delete from sessions where token = ${token}`;
  }
  deleteCookie(c, SESSION_COOKIE, { path: "/" });
}

export interface AuthedShop {
  id: string;
  name: string;
  market: string;
  state: string;
  goods: string;
  phone: string;
  language: string;
}

/** returns the signed-in shop, or null. Every private route checks this. */
export async function getAuthedShop(c: Context): Promise<AuthedShop | null> {
  const token = getCookie(c, SESSION_COOKIE);
  if (!token) return null;
  const rows = await sql()<AuthedShop[]>`
    select shops.id, shops.name, shops.market, shops.state, shops.goods, shops.phone, shops.language
    from sessions
    join shops on shops.id = sessions.shop_id
    where sessions.token = ${token} and sessions.expires_at > now()
  `;
  return rows[0] ?? null;
}
