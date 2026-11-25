/**
 * The demo shop. "Try the demo shop" on the welcome screen calls this.
 * Seeds once; after that, re-tapping just signs back into the same shop
 * (so anything recorded during rehearsal stays, rather than vanishing).
 * See ~/odS_hack/plan/16_BUILD_BLUEPRINT.md section J.
 */
import { sql } from "./db.js";
import { hashPin } from "./lib/auth.js";

const DEMO_PHONE = "0000000000";

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

export async function seedDemoShop(): Promise<string> {
  const existing = await sql()`select id from shops where phone = ${DEMO_PHONE}`;
  if (existing.length > 0) return existing[0]!.id;

  const pinHash = await hashPin("0000");
  const [shop] = await sql()`
    insert into shops (name, market, state, goods, phone, pin_hash, language)
    values ('Mama Bisi Provisions', 'Kuto Market', 'Ogun', 'Rice, oil, sugar, provisions', ${DEMO_PHONE}, ${pinHash}, 'en')
    returning id
  `;
  const shopId = shop!.id;

  const [kuto] = await sql()`insert into branches (shop_id, name, market) values (${shopId}, 'Kuto branch', 'Kuto Market') returning id`;
  const [itoku] = await sql()`insert into branches (shop_id, name, market) values (${shopId}, 'Itoku branch', 'Itoku Market') returning id`;

  const customerNames = [
    "Chief Ade",
    "Iya Tolu",
    "Mama Rose",
    "Baba Wale",
    "Sister Ngozi",
    "Alhaji Musa",
    "Iya Kafayat",
    "Brother Emeka",
    "Mama Nkechi",
  ];
  const customerIds: Record<string, string> = {};
  for (const name of customerNames) {
    const [c] = await sql()`insert into customers (shop_id, name) values (${shopId}, ${name}) returning id`;
    customerIds[name] = c!.id;
  }

  const items: Array<{ item: string; qty: number; price: number }> = [
    { item: "Rice", qty: 2, price: 4000 },
    { item: "Oil", qty: 3, price: 1200 },
    { item: "Sugar", qty: 1, price: 2000 },
    { item: "Beans", qty: 4, price: 1500 },
    { item: "Garri", qty: 2, price: 1000 },
    { item: "Milk", qty: 5, price: 600 },
  ];

  let recordCount = 0;
  async function addRecord(name: string, branchId: string, createdAt: Date, kind: "credit" | "paid") {
    const it = items[recordCount % items.length]!;
    const amount = it.qty * it.price;
    const customerId = customerIds[name]!;
    await sql()`
      insert into records (shop_id, branch_id, customer_id, item, quantity, unit_price, amount, kind, status, confirmed, created_at)
      values (${shopId}, ${branchId}, ${customerId}, ${it.item}, ${it.qty}, ${it.price}, ${amount}, ${kind}, 'ok', true, ${createdAt})
    `;
    recordCount++;
    return amount;
  }

  // 4 customers who still owe, spread across both branches and several weeks
  await addRecord("Chief Ade", kuto!.id, daysAgo(1), "credit");
  await addRecord("Chief Ade", kuto!.id, daysAgo(10), "credit");

  const tolu1 = await addRecord("Iya Tolu", kuto!.id, daysAgo(2), "credit");
  await addRecord("Iya Tolu", itoku!.id, daysAgo(15), "credit");
  // a part payment: clears the oldest debt first, leaves a balance
  await sql()`
    insert into payments (shop_id, branch_id, customer_id, amount, client_id, created_at)
    values (${shopId}, ${itoku!.id}, ${customerIds["Iya Tolu"]!}, ${Math.round(tolu1 * 0.5)}, 'seed-tolu-payment', ${daysAgo(1)})
  `;

  await addRecord("Mama Rose", itoku!.id, daysAgo(3), "credit");
  await addRecord("Baba Wale", kuto!.id, daysAgo(5), "credit");

  // 5 customers who have settled: credit then a payment that fully clears
  for (const name of ["Sister Ngozi", "Alhaji Musa", "Iya Kafayat", "Brother Emeka", "Mama Nkechi"]) {
    const branch = recordCount % 2 === 0 ? kuto!.id : itoku!.id;
    const amount = await addRecord(name, branch, daysAgo(7 + recordCount), "credit");
    const customerId = customerIds[name]!;
    await sql()`
      insert into payments (shop_id, branch_id, customer_id, amount, client_id, created_at)
      values (${shopId}, ${branch}, ${customerId}, ${amount}, ${"seed-" + name.replace(/\s+/g, "-").toLowerCase()}, ${daysAgo(6 + recordCount)})
    `;
  }

  // a run of plain cash sales over the last few weeks, for the sales
  // and best sellers numbers to look like a real six weeks of trading
  for (let i = 0; i < 18; i++) {
    const name = customerNames[i % customerNames.length]!;
    const branch = i % 2 === 0 ? kuto!.id : itoku!.id;
    await addRecord(name, branch, daysAgo(1 + i * 2), "paid");
  }

  // link the allocations table for the part payment and the full ones, so
  // the customer screen's "oldest cleared first" story is correct, not just
  // the balance maths
  const payments = await sql()`select id, customer_id, amount from payments where shop_id = ${shopId}`;
  for (const payment of payments) {
    const openRecords = await sql()`
      select id, amount from records
      where shop_id = ${shopId} and customer_id = ${payment.customer_id} and kind = 'credit'
      order by created_at asc
    `;
    let remaining = Number(payment.amount);
    for (const rec of openRecords) {
      if (remaining <= 0) break;
      const applied = Math.min(Number(rec.amount), remaining);
      await sql()`insert into allocations (payment_id, record_id, amount_applied) values (${payment.id}, ${rec.id}, ${applied})`;
      remaining -= applied;
    }
  }

  // one trust record already created, as the pitch's demo assumes
  const totalsRows = await sql()`
    select coalesce(sum(amount) filter (where kind in ('credit','paid')), 0) as total_sales,
           coalesce(sum(amount) filter (where kind = 'credit'), 0) as credit_given
    from records where shop_id = ${shopId}
  `;
  const collectedRows = await sql()`select coalesce(sum(amount), 0) as collected from payments where shop_id = ${shopId}`;
  const totalSales = Number(totalsRows[0]!.total_sales);
  const creditGiven = Number(totalsRows[0]!.credit_given);
  const collected = Number(collectedRows[0]!.collected);
  await sql()`
    insert into trust_records (code, shop_id, totals_snapshot, expires_at)
    values ('TR-DEMOSHOP1', ${shopId}, ${sql().json({
      pagesConfirmed: 0,
      totalSales,
      creditGiven,
      collected,
      collectionRate: creditGiven > 0 ? Math.round((collected / creditGiven) * 100) : 0,
      customers: customerNames.length,
    } as any)}, ${daysAgo(-30)})
  `;

  return shopId;
}
