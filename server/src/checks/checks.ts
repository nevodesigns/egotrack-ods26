/**
 * The arithmetic the AI is never trusted to do. Every function here is
 * plain code: given numbers, it gives back exact answers. The AI reader
 * only ever supplies the raw text; parseNaira (money.ts) turns that text
 * into numbers; this file checks them against each other.
 *
 * See ~/odS_hack/plan/20_HANDOFF.md section 4.2 and
 * ~/odS_hack/plan/18_NOTEBOOK_SAMPLES.md section 2.
 */

import { parseNaira, type MoneyFlag } from "./money.js";

export type LineType =
  | "item"
  | "payment"
  | "total"
  | "balance"
  | "old_balance"
  | "expense"
  | "other";

export interface ReaderLine {
  type: LineType;
  text: string;
  item?: string | null;
  quantity?: string | null;
  unitPriceAsWritten?: string | null;
  amountAsWritten?: string | null;
  /** only when a name is written on this row itself, not the page header */
  customerName?: string | null;
  crossedOut?: boolean;
  ditto?: boolean;
  unclear?: string | null;
}

export type RowStatus = "ok" | "check" | "left_out";

export interface CheckedRow {
  line: ReaderLine;
  amount: number | null;
  amountFlag?: MoneyFlag;
  quantityTimesPriceAmount?: number;
  status: RowStatus;
  reason?: string;
  /** shown as "Use ₦X" when a x1000 reading would make the page add up */
  suggestedAmount?: number;
}

export interface PageCheckResult {
  rows: CheckedRow[];
  /** sum of every item/old_balance row that will actually be counted */
  ourTotal: number;
  writtenTotal: number | null;
  totalsMatch: boolean | null;
}

/** quantity written as "2" or "2.5"; returns null if it will not parse as a plain number */
export function parseQuantity(raw: string | null | undefined): number | null {
  if (raw == null || raw.trim() === "") return null;
  const n = Number(raw.trim());
  return Number.isFinite(n) ? n : null;
}

/** amount = quantity times unit price, when both are present and clear */
export function quantityTimesPrice(
  quantity: number | null,
  unitPrice: number | null,
): number | null {
  if (quantity == null || unitPrice == null) return null;
  return Math.round(quantity * unitPrice);
}

/** the plain sum of a list of amounts, ignoring anything we could not parse */
export function sumAmounts(amounts: Array<number | null>): number {
  return amounts.reduce((total: number, a) => total + (a ?? 0), 0);
}

/**
 * Does replacing one flagged small amount with amount * 1000 make the
 * page's own sum equal the written total exactly? Only ever offered as a
 * one tap fix when it resolves the mismatch precisely, never as a guess.
 */
export function thousandsFixMatches(
  amounts: Array<number | null>,
  flaggedIndex: number,
  writtenTotal: number,
): boolean {
  const target = amounts[flaggedIndex];
  if (target == null) return false;
  const fixed = amounts.map((a, i) => (i === flaggedIndex ? a! * 1000 : a));
  return sumAmounts(fixed) === writtenTotal;
}

function rowReason(flag: MoneyFlag | undefined, amountAsWritten: string | null | undefined): string | undefined {
  switch (flag) {
    case "unclear":
      return `Unclear amount: "${amountAsWritten}". Check it.`;
    case "expression":
      return `Written as a sum: "${amountAsWritten}". Check it.`;
    case "maybeThousands":
      return undefined; // handled by the thousands-suggestion path instead
    default:
      return undefined;
  }
}

/**
 * Checks one confirmed page. pageCustomer is the name written at the top
 * of the page, if any; a row with no page customer and no name of its own
 * is left out, per the rule that an "owes" with no name cannot become a debt.
 */
export function checkPage(lines: ReaderLine[], pageCustomer: string | null): PageCheckResult {
  const parsed = lines.map((line) => parseNaira(line.amountAsWritten));

  const rows: CheckedRow[] = lines.map((line, i) => {
    const { value: amount, flag } = parsed[i]!;
    const hasCustomer = Boolean(pageCustomer) || Boolean(line.customerName);

    const quantity = parseQuantity(line.quantity);
    const unitPrice = parseNaira(line.unitPriceAsWritten).value;
    const qtyPrice = quantityTimesPrice(quantity, unitPrice);

    let status: RowStatus = "ok";
    let reason: string | undefined;

    if (line.type === "item" && !hasCustomer) {
      status = "left_out";
      reason = "No name, so it will be left out.";
    } else if (amount == null) {
      status = "check";
      reason = rowReason(flag, line.amountAsWritten) ?? "Could not read this amount.";
    } else if (flag === "unclear") {
      status = "check";
      reason = rowReason(flag, line.amountAsWritten);
    } else if (qtyPrice != null && qtyPrice !== amount) {
      status = "check";
      reason = `Written ₦${amount.toLocaleString("en-NG")}. ${quantity} × ₦${unitPrice!.toLocaleString("en-NG")} = ₦${qtyPrice.toLocaleString("en-NG")}.`;
    } else if (line.unclear) {
      status = "check";
      reason = line.unclear;
    }

    return {
      line,
      amount,
      amountFlag: flag,
      quantityTimesPriceAmount: qtyPrice ?? undefined,
      status,
      reason,
    };
  });

  // find a written page total, if any (the last "total" line read on the page)
  const totalLine = [...lines].reverse().find((l) => l.type === "total");
  const writtenTotal = totalLine ? parseNaira(totalLine.amountAsWritten).value : null;

  const countable = rows.filter(
    (r) => r.status !== "left_out" && (r.line.type === "item" || r.line.type === "old_balance"),
  );

  // offer the x1000 fix only when it would make the page's own sum
  // (the countable rows only, never the total line itself) add up exactly
  if (writtenTotal != null) {
    const countableAmounts = countable.map((r) => r.amount);
    countable.forEach((row, i) => {
      if (row.amountFlag === "maybeThousands") {
        if (thousandsFixMatches(countableAmounts, i, writtenTotal)) {
          row.status = "check";
          row.suggestedAmount = row.amount! * 1000;
          row.reason = `We read ₦${row.amount}. Did you mean ₦${row.amount},000?`;
        }
      }
    });
  }

  const ourTotal = sumAmounts(countable.map((r) => r.amount));

  return {
    rows,
    ourTotal,
    writtenTotal,
    totalsMatch: writtenTotal == null ? null : ourTotal === writtenTotal,
  };
}
