/** Reminder message templates. English, Pidgin and Yoruba, checked wording
 * from ~/odS_hack/plan/19_BRAND_AND_UX.md section 6. Written by us, never
 * machine translated. */

export type ReminderLanguage = "en" | "pcm" | "yo";

export function reminderMessage(
  lang: ReminderLanguage,
  vars: { name: string; shop: string; market: string; amount: number; link: string },
): string {
  const amount = vars.amount.toLocaleString("en-NG");
  switch (lang) {
    case "pcm":
      return `Good day ${vars.name}. Na ${vars.shop} for ${vars.market} dey talk. Your balance na ₦${amount}. Check am here: ${vars.link}. Thank you well well.`;
    case "yo":
      return `Ẹ kú àsì̀kọ̀ yìì ${vars.name}. ${vars.shop} ní ${vars.market} ló ń bá yín sọ̀rọ̀. Owó tí ẹ jẹ wá jẹ́ ₦${amount}. Ẹ wo àlàyẹ́ níbí: ${vars.link}. A dúpẹ́.`;
    default:
      return `Good day ${vars.name}. This is ${vars.shop} at ${vars.market}. You have a balance of ₦${amount} with us. See the details here: ${vars.link}. Thank you.`;
  }
}

export function whatsAppLink(phone: string, message: string): string {
  const digits = phone.replace(/[^\d]/g, "");
  // Nigerian numbers: 0803... -> 234803...
  const withCountryCode = digits.startsWith("0") ? "234" + digits.slice(1) : digits;
  return `https://wa.me/${withCountryCode}?text=${encodeURIComponent(message)}`;
}
