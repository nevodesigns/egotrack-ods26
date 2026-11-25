import { Hono } from "hono";
import { sql } from "../db.js";
import { getAuthedShop } from "../lib/auth.js";

export const summary = new Hono();

summary.get("/", async (c) => {
  const shop = await getAuthedShop(c);
  if (!shop) return c.json({ error: "Not signed in." }, 401);

  const owedRows = await sql()`
    select
      c.id,
      coalesce(sum(case when r.kind = 'credit' and r.status != 'left_out' then r.amount else 0 end), 0)
        - coalesce((select sum(amount) from payments p where p.customer_id = c.id and p.shop_id = ${shop.id}), 0) as balance
    from customers c
    left join records r on r.customer_id = c.id and r.shop_id = ${shop.id}
    where c.shop_id = ${shop.id}
    group by c.id
  `;
  const owing = owedRows.filter((r) => Number(r.balance) > 0);
  const owedTotal = owing.reduce((sum, r) => sum + Number(r.balance), 0);

  const weekRows = await sql()`
    select coalesce(sum(amount), 0) as sales
    from records
    where shop_id = ${shop.id} and created_at > now() - interval '7 days' and kind in ('credit', 'paid')
  `;
  const collectedRows = await sql()`
    select coalesce(sum(amount), 0) as collected
    from payments
    where shop_id = ${shop.id} and created_at > now() - interval '7 days'
  `;
  const readingRows = await sql()`select count(*) as n from pages where shop_id = ${shop.id} and status = 'reading'`;
  const readyRows = await sql()`select count(*) as n from pages where shop_id = ${shop.id} and status = 'ready'`;

  return c.json({
    owedTotal,
    customersOwing: owing.length,
    salesThisWeek: Number(weekRows[0]!.sales),
    collectedThisWeek: Number(collectedRows[0]!.collected),
    pagesReading: Number(readingRows[0]!.n),
    pagesReady: Number(readyRows[0]!.n),
  });
});

summary.get("/insights", async (c) => {
  const shop = await getAuthedShop(c);
  if (!shop) return c.json({ error: "Not signed in." }, 401);

  const thisWeek = await sql()`
    select coalesce(sum(amount), 0) as n from records
    where shop_id = ${shop.id} and created_at > now() - interval '7 days' and kind in ('credit', 'paid')
  `;
  const lastWeek = await sql()`
    select coalesce(sum(amount), 0) as n from records
    where shop_id = ${shop.id} and created_at between now() - interval '14 days' and now() - interval '7 days' and kind in ('credit', 'paid')
  `;
  const cashCredit = await sql()`
    select kind, coalesce(sum(amount), 0) as n from records
    where shop_id = ${shop.id} group by kind
  `;
  const bestSellers = await sql()`
    select lower(trim(item)) as item, sum(amount) as total
    from records where shop_id = ${shop.id} and created_at > now() - interval '30 days'
    group by lower(trim(item))
    order by total desc limit 5
  `;

  const thisWeekSales = Number(thisWeek[0]!.n);
  const lastWeekSales = Number(lastWeek[0]!.n);
  const trendPct = lastWeekSales > 0 ? Math.round(((thisWeekSales - lastWeekSales) / lastWeekSales) * 100) : null;

  return c.json({
    salesThisWeek: thisWeekSales,
    salesTrendPct: trendPct,
    cash: Number(cashCredit.find((r) => r.kind === "paid")?.n ?? 0),
    credit: Number(cashCredit.find((r) => r.kind === "credit")?.n ?? 0),
    bestSellers: bestSellers.map((r, i) => ({ rank: i + 1, item: r.item, amount: Number(r.total) })),
  });
});
