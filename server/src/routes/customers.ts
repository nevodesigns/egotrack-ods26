import { Hono } from "hono";
import { randomUUID } from "node:crypto";
import { sql } from "../db.js";
import { getAuthedShop } from "../lib/auth.js";
import { reminderMessage, whatsAppLink, type ReminderLanguage } from "../lib/reminders.js";
import { randomCode } from "../lib/qr.js";
import { env } from "../env.js";

export const customers = new Hono();

async function customerBalance(shopId: string, customerId: string): Promise<number> {
  const rows = await sql()`
    select
      coalesce(sum(case when kind = 'credit' and status != 'left_out' then amount else 0 end), 0) as credit,
      coalesce((select sum(amount) from payments where customer_id = ${customerId} and shop_id = ${shopId}), 0) as paid
    from records
    where shop_id = ${shopId} and customer_id = ${customerId}
  `;
  const row = rows[0]!;
  return Number(row.credit) - Number(row.paid);
}

customers.get("/", async (c) => {
  const shop = await getAuthedShop(c);
  if (!shop) return c.json({ error: "Not signed in." }, 401);

  const rows = await sql()`
    select
      c.id, c.name, c.phone,
      coalesce(sum(case when r.kind = 'credit' and r.status != 'left_out' then r.amount else 0 end), 0) as credit,
      coalesce((select sum(amount) from payments p where p.customer_id = c.id and p.shop_id = ${shop.id}), 0) as paid,
      min(r.created_at) filter (where r.kind = 'credit') as oldest_credit_at
    from customers c
    left join records r on r.customer_id = c.id and r.shop_id = ${shop.id}
    where c.shop_id = ${shop.id}
    group by c.id, c.name, c.phone
  `;
  const withBalance = rows
    .map((r) => ({
      id: r.id,
      name: r.name,
      phone: r.phone,
      balance: Number(r.credit) - Number(r.paid),
      oldestUnpaidAt: r.oldest_credit_at,
    }))
    .filter((r) => r.balance > 0)
    .sort((a, b) => b.balance - a.balance);

  return c.json({ customers: withBalance });
});

customers.get("/:id", async (c) => {
  const shop = await getAuthedShop(c);
  if (!shop) return c.json({ error: "Not signed in." }, 401);
  const id = c.req.param("id");

  const customerRows = await sql()`select * from customers where id = ${id} and shop_id = ${shop.id}`;
  const customer = customerRows[0];
  if (!customer) return c.json({ error: "Customer not found." }, 404);

  const records = await sql()`
    select id, item, quantity, unit_price, amount, kind, status, created_at
    from records where shop_id = ${shop.id} and customer_id = ${id}
    order by created_at desc
  `;
  const payments = await sql()`
    select id, amount, created_at from payments
    where shop_id = ${shop.id} and customer_id = ${id}
    order by created_at desc
  `;
  const balance = await customerBalance(shop.id, id);

  return c.json({ customer, records, payments, balance });
});

customers.patch("/:id", async (c) => {
  const shop = await getAuthedShop(c);
  if (!shop) return c.json({ error: "Not signed in." }, 401);
  const id = c.req.param("id");
  const { phone } = await c.req.json();
  await sql()`update customers set phone = ${phone} where id = ${id} and shop_id = ${shop.id}`;
  return c.json({ ok: true });
});

customers.post("/:id/payments", async (c) => {
  const shop = await getAuthedShop(c);
  if (!shop) return c.json({ error: "Not signed in." }, 401);
  const id = c.req.param("id");
  const { amount, clientId } = await c.req.json();
  const amt = Math.round(Number(amount));
  if (!amt || amt <= 0) return c.json({ error: "Enter an amount above zero." }, 400);

  const existing = clientId
    ? await sql()`select id from payments where shop_id = ${shop.id} and client_id = ${clientId}`
    : [];
  if (existing.length > 0) {
    const balance = await customerBalance(shop.id, id);
    return c.json({ ok: true, balance });
  }

  await sql().begin(async (tx) => {
    const [payment] = await tx`
      insert into payments (shop_id, customer_id, amount, client_id)
      values (${shop.id}, ${id}, ${amt}, ${clientId ?? randomUUID()})
      returning id
    `;

    // oldest unpaid credit records first
    const openRecords = await tx`
      select r.id, r.amount, coalesce((select sum(a.amount_applied) from allocations a where a.record_id = r.id), 0) as already_paid
      from records r
      where r.shop_id = ${shop.id} and r.customer_id = ${id} and r.kind = 'credit' and r.status != 'left_out'
      order by r.created_at asc
    `;
    let remaining = amt;
    for (const rec of openRecords) {
      if (remaining <= 0) break;
      const owedOnThis = Number(rec.amount) - Number(rec.already_paid);
      if (owedOnThis <= 0) continue;
      const applied = Math.min(owedOnThis, remaining);
      await tx`insert into allocations (payment_id, record_id, amount_applied) values (${payment!.id}, ${rec.id}, ${applied})`;
      remaining -= applied;
    }
  });

  const balance = await customerBalance(shop.id, id);
  return c.json({ ok: true, balance });
});

customers.post("/:id/remind", async (c) => {
  const shop = await getAuthedShop(c);
  if (!shop) return c.json({ error: "Not signed in." }, 401);
  const id = c.req.param("id");
  const { language } = (await c.req.json().catch(() => ({}))) ?? {};

  const rows = await sql()`select * from customers where id = ${id} and shop_id = ${shop.id}`;
  const customer = rows[0];
  if (!customer) return c.json({ error: "Customer not found." }, 404);
  if (!customer.phone) return c.json({ error: "Add a phone number for this customer first." }, 400);

  const balance = await customerBalance(shop.id, id);

  let link = await sql()`select code from debt_links where shop_id = ${shop.id} and customer_id = ${id} and active`;
  let code: string;
  if (link.length > 0) {
    code = link[0]!.code;
  } else {
    code = randomCode();
    await sql()`insert into debt_links (code, shop_id, customer_id) values (${code}, ${shop.id}, ${id})`;
  }

  const publicLink = `${env.appUrl}/d/${code}`;
  const message = reminderMessage((language ?? "en") as ReminderLanguage, {
    name: customer.name,
    shop: shop.name,
    market: shop.market,
    amount: balance,
    link: publicLink,
  });

  return c.json({ whatsappLink: whatsAppLink(customer.phone, message), message, publicLink });
});
