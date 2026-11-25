import { describe, it, expect } from "vitest";
import { parseNaira } from "./money.js";

// Every row here is a string actually seen on a real notebook page
// (~/odS_hack/plan/18_NOTEBOOK_SAMPLES.md, ~/odS_hack/plan/20_HANDOFF.md
// section 4.1), not an invented example.
describe("parseNaira", () => {
  it.each([
    ["#25.000", 25000],
    ["# 25.000", 25000],
    ["42.000", 42000],
    ["#212.000", 212000],
    ["3957.000", 3957000],
    ["1250.500", 1250500],
    ["#17,000", 17000],
    ["₦ 23500", 23500],
    ["2k", 2000],
    ["2K", 2000],
    ["1.5k", 1500],
  ])("parses %s as %i with no flag", (input, expected) => {
    const result = parseNaira(input);
    expect(result.value).toBe(expected);
    expect(result.flag).toBeUndefined();
  });

  it("flags a bare small number as maybeThousands", () => {
    const result = parseNaira("#30");
    expect(result.value).toBe(30);
    expect(result.flag).toBe("maybeThousands");
  });

  it("does not flag a bare number already in the thousands", () => {
    const result = parseNaira("2000");
    expect(result.value).toBe(2000);
    expect(result.flag).toBeUndefined();
  });

  it("returns null with unclear for a malformed group", () => {
    const result = parseNaira("20,0");
    expect(result.value).toBeNull();
    expect(result.flag).toBe("unclear");
  });

  it("takes a best guess at a dash used as a thousands separator, flagged unclear", () => {
    const result = parseNaira("#40-00");
    expect(result.value).toBe(40000);
    expect(result.flag).toBe("unclear");
  });

  it("never does the trader's arithmetic for her", () => {
    const result = parseNaira("26700 - 6000");
    expect(result.value).toBeNull();
    expect(result.flag).toBe("expression");
  });

  it.each([null, undefined, "", "   "])("returns null for %s", (input) => {
    const result = parseNaira(input);
    expect(result.value).toBeNull();
    expect(result.flag).toBeUndefined();
  });

  it("never returns kobo, only whole naira", () => {
    const result = parseNaira("1250.500");
    expect(Number.isInteger(result.value)).toBe(true);
  });
});
