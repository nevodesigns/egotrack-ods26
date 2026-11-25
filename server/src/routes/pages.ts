import { Hono } from "hono";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { sql } from "../db.js";
import { getAuthedShop } from "../lib/auth.js";
import { readPage } from "../lib/ai-reader.js";
import { checkPage, parseQuantity, type ReaderLine } from "../checks/checks.js";
import { parseNaira } from "../checks/money.js";

const here = dirname(fileURLToPath(import.meta.url));
const uploadsDir = join(here, "..", "..", "uploads");

export const pages = new Hono();

interface RawReaderOutput {
  pageCustomer: string | null;
  lines: ReaderLine[];
  notes: string | null;
}

pages.post("/", async (c) => {
  const shop = await getAuthedShop(c);
  if (!shop) return c.json({ error: "Not signed in." }, 401);

  const body = await c.req.parseBody();
  const file = body.photo;
  const clientId = String(body.clientId ?? randomUUID());
  const branchId = body.branchId ? String(body.branchId) : null;

  if (!(file instanceof File)) {
    return c.json({ error: "No photo was sent." }, 400);
  }
  if (file.size > 8 * 1024 * 1024) {
    return c.json({ error: "Photo is too large. Please retake it." }, 400);
  }

  const existing = await sql()`select id from pages where shop_id = ${shop.id} and client_id = ${clientId}`;
  if (existing.length > 0) {
    return c.json({ id: existing[0]!.id });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const ext = file.type === "image/png" ? "png" : "jpg";
  const shopDir = join(uploadsDir, shop.id);
  await mkdir(shopDir, { recursive: true });

  const [page] = await sql()`
    insert into pages (shop_id, branch_id, client_id, photo_filename, status)
    values (${shop.id}, ${branchId}, ${clientId}, '', 'reading')
    returning id
  `;
  const filename = `${page!.id}.${ext}`;
  await writeFile(join(shopDir, filename), bytes);
  await sql()`update pages set photo_filename = ${filename} where id = ${page!.id}`;

  // read in the background; the phone polls GET /api/pages/:id
  readPage(bytes.toString("base64"), file.type || "image/jpeg")
    .then(async (result) => {
      await sql()`
        update pages
        set status = 'ready', raw_reader_output = ${sql().json(result as any)}
        where id = ${page!.id}
      `;
    })
    .catch(async (err) => {
      await sql()`
        update pages
        set status = 'failed', error_message = ${String(err?.message ?? err)}
        where id = ${page!.id}
      `;
    });

  return c.json({ id: page!.id });
});

pages.get("/", async (c) => {
  const shop = await getAuthedShop(c);
  if (!shop) return c.json({ error: "Not signed in." }, 401);
  const rows = await sql()`
    select id, status, created_at, confirmed_at
    from pages where shop_id = ${shop.id}
    order by created_at desc limit 20
  `;
  return c.json({ pages: rows });
});

pages.get("/:id", async (c) => {
  const shop = await getAuthedShop(c);
  if (!shop) return c.json({ error: "Not signed in." }, 401);
  const id = c.req.param("id");

  const rows = await sql()`select * from pages where id = ${id} and shop_id = ${shop.id}`;
  const page = rows[0];
  if (!page) return c.json({ error: "Page not found." }, 404);

  if (page.status === "reading" || page.status === "failed") {
    return c.json({ id: page.id, status: page.status, errorMessage: page.error_message });
  }

  const raw = page.raw_reader_output as RawReaderOutput;
  const result = checkPage(raw.lines, raw.pageCustomer);
  return c.json({
    id: page.id,
    status: page.status,
    pageCustomer: raw.pageCustomer,
    rows: result.rows,
    ourTotal: result.ourTotal,
    writtenTotal: result.writtenTotal,
    totalsMatch: result.totalsMatch,
    confirmedAt: page.confirmed_at,
  });
});

pages.patch("/:id/rows/:rowIndex", async (c) => {
  const shop = await getAuthedShop(c);
  if (!shop) return c.json({ error: "Not signed in." }, 401);
  const id = c.req.param("id");
  const rowIndex = Number(c.req.param("rowIndex"));
  const edits = await c.req.json();

  const rows = await sql()`select raw_reader_output from pages where id = ${id} and shop_id = ${shop.id}`;
  const page = rows[0];
  if (!page) return c.json({ error: "Page not found." }, 404);
  const raw = page.raw_reader_output as RawReaderOutput;
  if (!raw.lines[rowIndex]) return c.json({ error: "No such row." }, 404);

  raw.lines[rowIndex] = { ...raw.lines[rowIndex], ...edits };
  await sql()`update pages set raw_reader_output = ${sql().json(raw as any)} where id = ${id}`;

  const result = checkPage(raw.lines, raw.pageCustomer);
  return c.json({ rows: result.rows, ourTotal: result.ourTotal, writtenTotal: result.writtenTotal });
});

pages.post("/:id/customer", async (c) => {
  const shop = await getAuthedShop(c);
  if (!shop) return c.json({ error: "Not signed in." }, 401);
  const id = c.req.param("id");
  const { pageCustomer } = await c.req.json();

  const rows = await sql()`select raw_reader_output from pages where id = ${id} and shop_id = ${shop.id}`;
  const page = rows[0];
  if (!page) return c.json({ error: "Page not found." }, 404);
  const raw = page.raw_reader_output as RawReaderOutput;
  raw.pageCustomer = pageCustomer;
  await sql()`update pages set raw_reader_output = ${sql().json(raw as any)} where id = ${id}`;
  return c.json({ ok: true });
});

pages.post("/:id/confirm", async (c) => {
  const shop = await getAuthedShop(c);
  if (!shop) return c.json({ error: "Not signed in." }, 401);
  const id = c.req.param("id");

  const rows = await sql()`select * from pages where id = ${id} and shop_id = ${shop.id}`;
  const page = rows[0];
  if (!page) return c.json({ error: "Page not found." }, 404);
  if (page.confirmed_at) return c.json({ error: "This page was already confirmed." }, 409);

  const raw = page.raw_reader_output as RawReaderOutput;
  const result = checkPage(raw.lines, raw.pageCustomer);

  let customersUpdated = 0;

  await sql().begin(async (tx) => {
    for (const row of result.rows) {
      if (row.status === "left_out") continue;
      if (row.line.type !== "item" && row.line.type !== "old_balance") continue;
      if (row.amount == null) continue;

      const name = (raw.pageCustomer ?? row.line.customerName ?? "").trim();
      if (!name) continue;

      const existingCustomer = await tx`
        select id from customers where shop_id = ${shop.id} and lower(name) = ${name.toLowerCase()}
      `;
      let customerId: string;
      if (existingCustomer.length > 0) {
        customerId = existingCustomer[0]!.id;
      } else {
        const [c2] = await tx`
          insert into customers (shop_id, name) values (${shop.id}, ${name}) returning id
        `;
        customerId = c2!.id;
      }

      const kind = row.line.crossedOut ? "paid" : "credit";
      const unitPrice = parseNaira(row.line.unitPriceAsWritten).value;
      await tx`
        insert into records (shop_id, branch_id, page_id, customer_id, item, quantity, unit_price, amount, kind, status, reason, confirmed)
        values (
          ${shop.id}, ${page.branch_id}, ${page.id}, ${customerId},
          ${row.line.item ?? row.line.text}, ${parseQuantity(row.line.quantity)},
          ${unitPrice},
          ${row.amount}, ${kind}, ${row.status}, ${row.reason ?? null}, true
        )
      `;
      customersUpdated++;
    }
    await tx`update pages set status = 'confirmed', confirmed_at = now() where id = ${page.id}`;
  });

  return c.json({ ok: true, customersUpdated });
});

pages.get("/:id/photo", async (c) => {
  const shop = await getAuthedShop(c);
  if (!shop) return c.json({ error: "Not signed in." }, 401);
  const id = c.req.param("id");
  const rows = await sql()`select photo_filename from pages where id = ${id} and shop_id = ${shop.id}`;
  const page = rows[0];
  if (!page || !page.photo_filename) return c.json({ error: "Not found." }, 404);
  const path = join(uploadsDir, shop.id, page.photo_filename);
  const bytes = await readFile(path);
  const type = page.photo_filename.endsWith(".png") ? "image/png" : "image/jpeg";
  return new Response(bytes, { headers: { "Content-Type": type } });
});
