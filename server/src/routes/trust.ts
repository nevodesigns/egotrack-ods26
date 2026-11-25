import { Hono } from "hono";
import { sql } from "../db.js";
import { getAuthedShop } from "../lib/auth.js";
import { randomCode } from "../lib/qr.js";

export const trust = new Hono();

async function computeTotals(shopId: string) {
  const rows = await sql()`
    select
      count(distinct p.id) filter (where p.status = 'confirmed') as pages_confirmed,
      coalesce(sum(r.amount) filter (where r.kind in ('credit', 'paid')), 0) as total_sales,
      coalesce(sum(r.amount) filter (where r.kind = 'credit'), 0) as credit_given,
      count(distinct r.customer_id) as customers,
      min(r.created_at) as period_start,
      max(r.created_at) as period_end
    from records r
    left join pages p on p.id = r.page_id
    where r.shop_id = ${shopId}
  `;
  const collectedRows = await sql()`select coalesce(sum(amount), 0) as collected from payments where shop_id = ${shopId}`;
  const row = rows[0]!;
  const creditGiven = Number(row.credit_given);
  const collected = Number(collectedRows[0]!.collected);
  return {
    pagesConfirmed: Number(row.pages_confirmed),
    totalSales: Number(row.total_sales),
    creditGiven,
    collected,
    collectionRate: creditGiven > 0 ? Math.round((collected / creditGiven) * 100) : 0,
    customers: Number(row.customers),
    periodStart: row.period_start,
    periodEnd: row.period_end,
  };
}

trust.post("/", async (c) => {
  const shop = await getAuthedShop(c);
  if (!shop) return c.json({ error: "Not signed in." }, 401);

  const totals = await computeTotals(shop.id);
  const code = `TR-${randomCode(8)}`;
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await sql()`
    insert into trust_records (code, shop_id, totals_snapshot, expires_at)
    values (${code}, ${shop.id}, ${sql().json(totals as any)}, ${expiresAt})
  `;
  return c.json({ code, totals, expiresAt });
});

trust.get("/", async (c) => {
  const shop = await getAuthedShop(c);
  if (!shop) return c.json({ error: "Not signed in." }, 401);
  const rows = await sql()`
    select code, totals_snapshot, created_at, expires_at, active
    from trust_records where shop_id = ${shop.id}
    order by created_at desc
  `;
  return c.json({ trustRecords: rows });
});

trust.post("/:code/off", async (c) => {
  const shop = await getAuthedShop(c);
  if (!shop) return c.json({ error: "Not signed in." }, 401);
  const code = c.req.param("code");
  await sql()`update trust_records set active = false where code = ${code} and shop_id = ${shop.id}`;
  return c.json({ ok: true });
});

// public, no sign-in required
export const publicTrust = new Hono();

publicTrust.get("/trust/:code", async (c) => {
  const code = c.req.param("code");
  const rows = await sql()`
    select tr.*, s.name as shop_name, s.market
    from trust_records tr
    join shops s on s.id = tr.shop_id
    where tr.code = ${code}
  `;
  const record = rows[0];
  if (!record) return c.json({ error: "Code not found." }, 404);
  return c.json({
    shopName: record.shop_name,
    market: record.market,
    totals: record.totals_snapshot,
    createdAt: record.created_at,
    expiresAt: record.expires_at,
    active: record.active && new Date(record.expires_at) > new Date(),
  });
});

publicTrust.get("/debt/:code", async (c) => {
  const code = c.req.param("code");
  const rows = await sql()`
    select dl.*, s.name as shop_name, s.market, c.name as customer_name
    from debt_links dl
    join shops s on s.id = dl.shop_id
    join customers c on c.id = dl.customer_id
    where dl.code = ${code} and dl.active
  `;
  const link = rows[0];
  if (!link) return c.json({ error: "Code not found." }, 404);

  const balanceRows = await sql()`
    select
      coalesce(sum(case when kind = 'credit' and status != 'left_out' then amount else 0 end), 0) as credit,
      coalesce((select sum(amount) from payments where customer_id = ${link.customer_id} and shop_id = ${link.shop_id}), 0) as paid
    from records where shop_id = ${link.shop_id} and customer_id = ${link.customer_id}
  `;
  const records = await sql()`
    select item, quantity, amount, kind, created_at from records
    where shop_id = ${link.shop_id} and customer_id = ${link.customer_id} and kind = 'credit' and status != 'left_out'
    order by created_at asc
  `;
  const b = balanceRows[0]!;

  return c.json({
    shopName: link.shop_name,
    market: link.market,
    customerFirstName: String(link.customer_name).split(" ")[0],
    balance: Number(b.credit) - Number(b.paid),
    records,
  });
});
