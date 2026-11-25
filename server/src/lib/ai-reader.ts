/**
 * The AI reader. It only ever copies text from a photo; it never does
 * arithmetic. See ~/odS_hack/plan/18_NOTEBOOK_SAMPLES.md section 5 for
 * where this instruction and schema came from, and section 8 for the
 * live test that proved it against real notebook pages.
 */
import { env } from "../env.js";
import type { ReaderLine } from "../checks/checks.js";

const INSTRUCTION =
  "You are reading a photo of a handwritten page from a Nigerian trader's notebook. " +
  "Copy exactly what is written; never calculate, correct or invent numbers. " +
  "The page may be sideways; read it in its natural orientation. Ignore camera watermarks and timestamps. " +
  "If two pages are visible, read only the one the photo is centred on and say so in notes. " +
  "Naira may be written as ₦, N or #. '.' and ',' are both used as thousands separators. " +
  "Keep names, nicknames and spellings exactly as written. " +
  "For each line give its type: item (goods sold or owed), payment (money paid), total, balance, old_balance, expense, or other.";

const LINE_SCHEMA = {
  type: "OBJECT",
  properties: {
    type: {
      type: "STRING",
      enum: ["item", "payment", "total", "balance", "old_balance", "expense", "other"],
    },
    text: { type: "STRING" },
    item: { type: "STRING", nullable: true },
    quantity: { type: "STRING", nullable: true },
    unit_price_as_written: { type: "STRING", nullable: true },
    amount_as_written: { type: "STRING", nullable: true },
    payment_method: { type: "STRING", nullable: true },
    crossed_out: { type: "BOOLEAN" },
    ditto: { type: "BOOLEAN" },
    unclear: { type: "STRING", nullable: true },
  },
  required: ["type", "text", "amount_as_written", "crossed_out", "ditto"],
};

const PAGE_SCHEMA = {
  type: "OBJECT",
  properties: {
    page_customer: { type: "STRING", nullable: true },
    dates: { type: "ARRAY", items: { type: "STRING" } },
    rotation_seen: { type: "STRING", nullable: true },
    lines: { type: "ARRAY", items: LINE_SCHEMA },
    notes: { type: "STRING", nullable: true },
  },
  required: ["page_customer", "dates", "lines"],
};

export interface ReaderResult {
  pageCustomer: string | null;
  lines: ReaderLine[];
  notes: string | null;
}

async function callModel(model: string, apiKey: string, imageBase64: string, mimeType: string): Promise<ReaderResult> {
  const body = {
    contents: [
      {
        parts: [{ text: INSTRUCTION }, { inline_data: { mime_type: mimeType, data: imageBase64 } }],
      },
    ],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: PAGE_SCHEMA,
      temperature: 0,
    },
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60_000);
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      },
    );
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Gemini ${model} responded ${res.status}: ${text.slice(0, 300)}`);
    }
    const data = (await res.json()) as any;
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!raw) throw new Error(`Gemini ${model} returned no content`);
    const parsed = JSON.parse(raw);
    const lines: ReaderLine[] = (parsed.lines ?? []).map((l: Record<string, unknown>) => ({
      type: l.type,
      text: l.text,
      item: l.item ?? null,
      quantity: l.quantity ?? null,
      unitPriceAsWritten: l.unit_price_as_written ?? null,
      amountAsWritten: l.amount_as_written ?? null,
      crossedOut: Boolean(l.crossed_out),
      ditto: Boolean(l.ditto),
      unclear: l.unclear ?? null,
    }));
    return {
      pageCustomer: parsed.page_customer ?? null,
      lines,
      notes: parsed.notes ?? null,
    };
  } finally {
    clearTimeout(timeout);
  }
}

/** retries once on the primary model, then falls back to the lighter model,
 * then (if configured) the backup provider, before giving up. */
export async function readPage(imageBase64: string, mimeType: string): Promise<ReaderResult> {
  const primary = "gemini-3.5-flash";
  const fallback = "gemini-3.5-flash-lite";

  if (!env.geminiApiKey) {
    throw new Error("No GEMINI_API_KEY configured");
  }

  try {
    return await callModel(primary, env.geminiApiKey, imageBase64, mimeType);
  } catch (e1) {
    await new Promise((r) => setTimeout(r, 2000));
    try {
      return await callModel(primary, env.geminiApiKey, imageBase64, mimeType);
    } catch (e2) {
      try {
        return await callModel(fallback, env.geminiApiKey, imageBase64, mimeType);
      } catch (e3) {
        throw new Error(
          `Could not read this page after retries: ${(e3 as Error).message}`,
        );
      }
    }
  }
}
