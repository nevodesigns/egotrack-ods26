// UI copy, English only (19_BRAND_AND_UX.md section 1: traders write the notebook
// in simple English, so the screens stay simple English). Reminder messages to
// customers are separate and come in English, Pidgin or Yoruba (see T10).
//
// Keep every user facing string here. No string goes straight into markup.

export const strings = {
  welcome: {
    title: "Your notebook, checked and kept safe.",
    phone: "Phone number",
    pin: "4-digit PIN",
    continue: "Continue",
    newHere: "New here? Create my shop",
    or: "or",
    demo: "Try the demo shop",
    demoShop: "Mama Bisi Provisions · Kuto Market, Abeokuta",
  },
  home: {
    owed: "Money people owe you",
    scan: "Scan a page",
    reading: (n: number) =>
      n === 1
        ? "1 page being read. We will show it here when it is ready."
        : `${n} pages being read. We will show them here when ready.`,
    salesThisWeek: "Sales this week",
    collectedThisWeek: "Collected this week",
    cashCredit: "Cash · Credit",
    bestSellers: "Best sellers this month",
    bestCustomers: "Best customers",
  },
  scan: {
    title: "Scan a page",
    hint: "One page. Fill the screen. Good light.",
    use: "Use this photo",
    retake: "Retake",
    rotate: "Rotate photo",
    gallery: "Choose from gallery",
    sent: "Page saved. Reading takes about 30 seconds. You can carry on selling.",
    offline: "No data. Page saved on this phone. It will send when data returns.",
  },
  check: {
    title: "Check this page",
    whosePage: "Whose page is this?",
    addsUp: "Adds up",
    checkThis: "Check this",
    written: (written: string, ours: string) => `Written ₦${written}. We read ₦${ours}.`,
    thousand: (x: string) => `We read ${x}. Did you mean ₦${x},000?`,
    noName: "No name, so it will be left out.",
    addName: "Add a name",
    pageTotalOurs: "Page total (our sum)",
    pageTotalWritten: "You wrote",
    confirm: "Confirm page",
    confirmed: (n: number) => `Saved. ${n} customers updated.`,
  },
  owed: {
    title: "Who owes me",
    balance: "Balance",
    oldestUnpaid: (date: string) => `Oldest unpaid: since ${date}`,
    reminderLanguage: "Reminder language",
    recordPayment: "Record payment",
    remindWhatsapp: "Remind on WhatsApp",
    history: "History",
  },
  trust: {
    title: "Trust record",
    active: "Active",
    create: "Create trust record",
    share: "Share",
    previewPublic: "Preview the public page",
    switchOff: "Switch off this record",
    recordedLine:
      "Recorded by the trader from her notebook and checked by EgoTrack's sums.",
  },
  more: {
    trustRecord: "Trust record",
    branches: "My branches",
    backup: "Backup and download",
    backedUp: (time: string) => `Backed up today at ${time}. Download my records`,
    language: "Language",
    signOut: "Sign out",
  },
  nav: {
    home: "Home",
    scan: "Scan",
    owed: "Owed",
    more: "More",
  },
  errors: {
    reader: "We could not read this page. Try a clearer photo, or type it in.",
    server: "We could not reach EgoTrack. Your work is saved on this phone.",
  },
} as const;
