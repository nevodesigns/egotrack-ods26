import { describe, it, expect } from "vitest";
import {
  checkPage,
  quantityTimesPrice,
  sumAmounts,
  thousandsFixMatches,
  type ReaderLine,
} from "./checks.js";

describe("quantityTimesPrice", () => {
  it("multiplies quantity by unit price", () => {
    expect(quantityTimesPrice(2, 4000)).toBe(8000);
  });
  it("returns null when either side is missing", () => {
    expect(quantityTimesPrice(null, 4000)).toBeNull();
    expect(quantityTimesPrice(2, null)).toBeNull();
  });
});

describe("sumAmounts", () => {
  it("ignores unparsed amounts rather than treating them as zero debt", () => {
    expect(sumAmounts([1000, null, 2000])).toBe(3000);
  });
});

describe("thousandsFixMatches", () => {
  it("only offers the fix when it makes the total exact", () => {
    expect(thousandsFixMatches([30, 7000, 5000], 0, 42000)).toBe(true);
    expect(thousandsFixMatches([30, 7000, 5000], 0, 99999)).toBe(false);
  });
});

describe("checkPage: the demo scan (Chief Ade / Iya Tolu / no name)", () => {
  const lines: ReaderLine[] = [
    { type: "item", text: "Chief Ade Rice 2x4000", item: "Rice", quantity: "2", unitPriceAsWritten: "4000", amountAsWritten: "8000", customerName: "Chief Ade" },
    { type: "item", text: "Iya Tolu Oil 3x1200 written 4500", item: "Oil", quantity: "3", unitPriceAsWritten: "1200", amountAsWritten: "4500", customerName: "Iya Tolu" },
    { type: "item", text: "Sugar 2000, no name", item: "Sugar", amountAsWritten: "2000" },
  ];

  it("marks the row that adds up as ok", () => {
    const result = checkPage(lines, null);
    expect(result.rows[0]!.status).toBe("ok");
    expect(result.rows[0]!.amount).toBe(8000);
  });

  it("catches the written total that does not match quantity times price", () => {
    const result = checkPage(lines, null);
    const row = result.rows[1]!;
    expect(row.status).toBe("check");
    expect(row.amount).toBe(4500);
    expect(row.quantityTimesPriceAmount).toBe(3600);
    expect(row.reason).toContain("3,600");
  });

  it("leaves out a row with no name anywhere on the page", () => {
    const result = checkPage(lines, null);
    expect(result.rows[2]!.status).toBe("left_out");
  });

  it("does not leave out an item when the page itself has a customer", () => {
    const result = checkPage(lines, "Mama Bisi");
    expect(result.rows[2]!.status).not.toBe("left_out");
  });
});

describe("checkPage: a real clean page (18_NOTEBOOK_SAMPLES.md, WA0158)", () => {
  const lines: ReaderLine[] = [
    { type: "item", text: "TD flywhee #30", item: "TD flywheel", amountAsWritten: "#30" },
    { type: "item", text: "con Rod TD #7000", item: "con Rod TD", amountAsWritten: "#7000" },
    { type: "item", text: "Auttolator hang #5000", item: "Auttolator hang", amountAsWritten: "#5000" },
    { type: "total", text: "42.000", amountAsWritten: "42.000" },
  ];

  it("offers the x1000 fix on the one small amount, because it makes the page add up exactly", () => {
    const result = checkPage(lines, "Alloy");
    const flywheel = result.rows[0]!;
    expect(flywheel.suggestedAmount).toBe(30000);
    expect(result.writtenTotal).toBe(42000);
  });

  it("the other two rows need no fix", () => {
    const result = checkPage(lines, "Alloy");
    expect(result.rows[1]!.status).toBe("ok");
    expect(result.rows[2]!.status).toBe("ok");
  });
});

describe("checkPage: totals match flag", () => {
  it("is null when the page has no written total to compare against", () => {
    const result = checkPage(
      [{ type: "item", text: "x", item: "x", amountAsWritten: "1000", customerName: "A" }],
      null,
    );
    expect(result.totalsMatch).toBeNull();
  });
});
