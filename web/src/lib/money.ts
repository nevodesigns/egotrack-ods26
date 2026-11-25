/** Money is always whole naira. Format for display only; never store a formatted string. */
export function formatNaira(amount: number): string {
  return `₦${Math.round(amount).toLocaleString("en-NG")}`;
}
