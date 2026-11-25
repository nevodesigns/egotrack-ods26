/** Every call to the server goes through here: same-origin, cookies
 * included, one place to turn a non-ok response into a thrown error with
 * the server's own plain-words message. */

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    credentials: "same-origin",
    headers:
      init?.body && !(init.body instanceof FormData)
        ? { "Content-Type": "application/json" }
        : undefined,
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "We could not reach EgoTrack. Your work is saved on this phone.");
  }
  return res.json();
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: "POST", body: data ? JSON.stringify(data) : undefined }),
  patch: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: "PATCH", body: data ? JSON.stringify(data) : undefined }),
  postForm: <T>(path: string, form: FormData) => request<T>(path, { method: "POST", body: form }),
};

// ---- types shared with the server's shapes ----

export interface Shop {
  id: string;
  name: string;
  market: string;
  state: string;
  goods: string;
  phone: string;
  language: string;
}

export interface Summary {
  owedTotal: number;
  customersOwing: number;
  salesThisWeek: number;
  collectedThisWeek: number;
  pagesReading: number;
  pagesReady: number;
}

export interface Insights {
  salesThisWeek: number;
  salesTrendPct: number | null;
  cash: number;
  credit: number;
  bestSellers: Array<{ rank: number; item: string; amount: number }>;
}

export interface CustomerListItem {
  id: string;
  name: string;
  phone: string | null;
  balance: number;
  oldestUnpaidAt: string | null;
}

export interface CheckedRow {
  line: {
    type: string;
    text: string;
    item: string | null;
    quantity: string | null;
    unitPriceAsWritten: string | null;
    amountAsWritten: string | null;
    crossedOut: boolean;
    unclear: string | null;
  };
  amount: number | null;
  amountFlag?: string;
  quantityTimesPriceAmount?: number;
  status: "ok" | "check" | "left_out";
  reason?: string;
  suggestedAmount?: number;
}

export interface PageResult {
  id: string;
  status: "reading" | "ready" | "confirmed" | "failed";
  pageCustomer?: string | null;
  rows?: CheckedRow[];
  ourTotal?: number;
  writtenTotal?: number | null;
  totalsMatch?: boolean | null;
  errorMessage?: string;
}
