/**
 * Turns what the AI reader copied from a photo into whole naira.
 *
 * The AI only ever copies text. This is the one place that turns that text
 * into a number, and it never guesses silently: anything it is not sure
 * about comes back with a flag instead of a number, so the row goes amber
 * and the trader checks it. See ~/odS_hack/plan/18_NOTEBOOK_SAMPLES.md
 * section 2 and ~/odS_hack/plan/20_HANDOFF.md section 4.1 for the rules
 * and the real strings this was built from.
 */

export type MoneyFlag = "maybeThousands" | "unclear" | "expression";

export interface ParsedMoney {
  value: number | null;
  flag?: MoneyFlag;
}

const K_SUFFIX = /^(\d+(?:\.\d+)?)k$/i;
const DASH_GROUP = /^(\d{1,3})-(\d{2,3})$/;
const GROUPED_THOUSANDS = /^\d+(?:[.,]\d{3})+$/;
const PURE_DIGITS = /^\d+$/;
const EXPRESSION = /^\d[\d.,]*\s+[-+]\s+\d[\d.,]*$/;

export function parseNaira(raw: string | null | undefined): ParsedMoney {
  if (raw == null) return { value: null };

  let s = raw.trim();
  if (s === "") return { value: null };

  // strip currency marks but keep spaces for a moment, so an expression
  // like "26700 - 6000" is still recognisable as two numbers and an operator
  s = s.replace(/[₦#]/g, "").replace(/^[Nn](?=\d)/, "").trim();
  if (s === "") return { value: null };

  if (EXPRESSION.test(s)) {
    // the trader wrote working, not a single amount. Show it as written
    // and let her decide, never guess at arithmetic ourselves.
    return { value: null, flag: "expression" };
  }

  s = s.replace(/\s+/g, "");
  if (s === "") return { value: null };

  const k = s.match(K_SUFFIX);
  if (k) {
    return { value: Math.round(parseFloat(k[1]!) * 1000) };
  }

  const dash = s.match(DASH_GROUP);
  if (dash) {
    // a dash used in place of a thousands separator ("40-00" for 40,000).
    // The trailing group is noise we cannot trust, so the row is always
    // marked unclear even though we take a best guess at the value.
    return { value: parseInt(dash[1]!, 10) * 1000, flag: "unclear" };
  }

  if (/[.,]/.test(s)) {
    if (GROUPED_THOUSANDS.test(s)) {
      return { value: parseInt(s.replace(/[.,]/g, ""), 10) };
    }
    // a separator is there but the grouping does not make sense
    // ("20,0") - never guess at the magnitude
    return { value: null, flag: "unclear" };
  }

  if (!PURE_DIGITS.test(s)) {
    return { value: null, flag: "unclear" };
  }

  const value = parseInt(s, 10);
  // a bare small number on a page where other amounts are in the
  // thousands is often shorthand ("#30" meaning 30,000). The page level
  // check (see checks.ts) decides whether to actually suggest it; this
  // just marks the candidate.
  if (value > 0 && value < 1000) {
    return { value, flag: "maybeThousands" };
  }

  return { value };
}
