import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, Clock, Plus, MessageCircle } from "lucide-react";
import { Shell, Screen } from "../components/Shell";
import { Button, Panel } from "../components/ui";
import { strings } from "../lib/strings";
import { formatNaira } from "../lib/money";
import { api } from "../lib/api";

const languages: Array<{ code: "en" | "pcm" | "yo"; label: string }> = [
  { code: "en", label: "English" },
  { code: "pcm", label: "Pidgin" },
  { code: "yo", label: "Yorùbá" },
];

interface Customer {
  id: string;
  name: string;
  phone: string | null;
}
interface RecordRow {
  id: string;
  item: string;
  amount: number;
  kind: string;
  created_at: string;
}
interface PaymentRow {
  id: string;
  amount: number;
  created_at: string;
}

export function CustomerDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const s = strings.owed;
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [balance, setBalance] = useState(0);
  const [records, setRecords] = useState<RecordRow[]>([]);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [lang, setLang] = useState<"en" | "pcm" | "yo">("en");
  const [phoneInput, setPhoneInput] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  async function load() {
    if (!id) return;
    const data = await api.get<{ customer: Customer; balance: number; records: RecordRow[]; payments: PaymentRow[] }>(
      `/customers/${id}`,
    );
    setCustomer(data.customer);
    setBalance(data.balance);
    setRecords(data.records);
    setPayments(data.payments);
    setPhoneInput(data.customer.phone ?? "");
  }

  useEffect(() => {
    load();
  }, [id]);

  async function onRecordPayment() {
    const amount = Math.round(Number(paymentAmount));
    if (!amount || amount <= 0 || !id) return;
    setBusy(true);
    try {
      await api.post(`/customers/${id}/payments`, { amount, clientId: crypto.randomUUID() });
      setPaymentAmount("");
      setNotice(`${formatNaira(amount)} recorded. Oldest debt cleared first.`);
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function onSavePhone() {
    if (!id) return;
    await api.patch(`/customers/${id}`, { phone: phoneInput });
    await load();
  }

  async function onRemind() {
    if (!id) return;
    if (!customer?.phone) {
      setNotice("Add a phone number first.");
      return;
    }
    const { whatsappLink } = await api.post<{ whatsappLink: string }>(`/customers/${id}/remind`, { language: lang });
    window.open(whatsappLink, "_blank");
  }

  if (!customer) {
    return (
      <Shell>
        <Screen className="pt-4 items-center justify-center">
          <p className="text-muted">Loading...</p>
        </Screen>
      </Shell>
    );
  }

  const history = [
    ...records.map((r) => ({ label: r.item, date: r.created_at, amount: r.amount, tone: r.kind === "credit" ? "owed" : "plain" as const })),
    ...payments.map((p) => ({ label: "Payment received", date: p.created_at, amount: p.amount, tone: "paid" as const })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <Shell>
      <Screen className="pt-4">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            aria-label="Back to who owes me"
            onClick={() => navigate("/owed")}
            className="flex h-8 w-8 items-center justify-center rounded-[8px] text-ink"
          >
            <ArrowLeft size={18} strokeWidth={2.2} aria-hidden="true" />
          </button>
          <span className="text-[13px] text-muted">{s.title}</span>
        </div>

        <h1 className="text-[22px] font-extrabold m-0">{customer.name}</h1>

        <Panel className="p-4">
          <p className="text-[12px] text-muted m-0">{s.balance}</p>
          <p className="tnum text-[30px] leading-[34px] font-extrabold m-0 text-owed">{formatNaira(balance)}</p>
          {records[0] && (
            <p className="flex items-center gap-[5px] text-[12px] text-muted mt-0.5">
              <Clock size={13} strokeWidth={2.2} aria-hidden="true" />
              {s.oldestUnpaid(new Date(records[records.length - 1]!.created_at).toLocaleDateString("en-NG"))}
            </p>
          )}
        </Panel>

        {!customer.phone && (
          <label className="flex flex-col gap-1">
            <span className="text-[12px] text-muted">Customer's phone number</span>
            <div className="flex gap-2">
              <input
                type="tel"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                placeholder="080 000 0000"
                className="flex-1 h-10 border border-line rounded-lg px-3 text-[14px]"
              />
              <button type="button" onClick={onSavePhone} className="h-10 px-3 rounded-lg border-[1.5px] border-brand text-brand text-[13px] font-bold">
                Save
              </button>
            </div>
          </label>
        )}

        <div>
          <p className="text-[12px] text-muted mb-2">{s.reminderLanguage}</p>
          <div className="flex gap-2">
            {languages.map((l) => (
              <button
                key={l.code}
                type="button"
                onClick={() => setLang(l.code)}
                className={`h-[30px] px-3.5 rounded-full text-[12.5px] font-semibold border-[1.5px] ${
                  lang === l.code ? "border-brand bg-brand-wash text-brand-strong" : "border-line text-muted"
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <input
            type="number"
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(e.target.value)}
            placeholder="Amount paid"
            className="flex-1 h-13 border border-line rounded-[10px] px-3 text-[15px]"
          />
          <Button onClick={onRecordPayment} disabled={busy} className="flex-1">
            <Plus size={17} strokeWidth={2.2} aria-hidden="true" />
            {s.recordPayment}
          </Button>
        </div>
        <Button variant="outline" onClick={onRemind}>
          <MessageCircle size={17} strokeWidth={2} aria-hidden="true" />
          {s.remindWhatsapp}
        </Button>

        {notice && <p className="text-[13px] text-brand-strong m-0">{notice}</p>}

        <div>
          <p className="text-[15px] font-bold mb-0.5">{s.history}</p>
          {history.map((h, i) => (
            <div key={i} className="flex justify-between items-start gap-2 py-2.5 border-b border-line last:border-b-0">
              <div>
                <p className="text-[14px] m-0">{h.label}</p>
                <p className="text-[12px] text-muted m-0">{new Date(h.date).toLocaleDateString("en-NG")}</p>
              </div>
              <p
                className={`text-[14px] font-bold m-0 tnum ${
                  h.tone === "owed" ? "text-owed" : h.tone === "paid" ? "text-brand-strong" : ""
                }`}
              >
                {formatNaira(h.amount)}
              </p>
            </div>
          ))}
        </div>
      </Screen>
    </Shell>
  );
}
