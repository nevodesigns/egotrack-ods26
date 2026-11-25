import { useNavigate, useParams } from "react-router";
import { ArrowLeft, Clock, Plus, MessageCircle } from "lucide-react";
import { Shell, Screen } from "../components/Shell";
import { Button, Panel } from "../components/ui";
import { strings } from "../lib/strings";
import { formatNaira } from "../lib/money";

const languages = ["English", "Pidgin", "Yorùbá"] as const;

// T8/T9/T10 replace this with GET /api/customers/:id
const history = [
  { label: "Oil · 3 × ₦1,200", date: "25 Nov 2026 · credit", amount: 3600, tone: "owed" as const },
  { label: "Payment received", date: "18 Nov 2026", amount: 2000, tone: "paid" as const },
  { label: "Rice", date: "18 Nov 2026 · paid", amount: 2000, tone: "plain" as const },
];

export function CustomerDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const s = strings.owed;
  const name = id === "chief-ade" ? "Chief Ade" : id === "mama-rose" ? "Mama Rose" : "Iya Tolu";

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

        <div>
          <h1 className="text-[22px] font-extrabold m-0">{name}</h1>
          <p className="text-[12px] text-muted m-0">Oil, provisions</p>
        </div>

        <Panel className="p-4">
          <p className="text-[12px] text-muted m-0">{s.balance}</p>
          <p className="tnum text-[30px] leading-[34px] font-extrabold m-0 text-owed">
            {formatNaira(3600)}
          </p>
          <p className="flex items-center gap-[5px] text-[12px] text-muted mt-0.5">
            <Clock size={13} strokeWidth={2.2} aria-hidden="true" />
            {s.oldestUnpaid("25 Nov 2026")}
          </p>
        </Panel>

        <div>
          <p className="text-[12px] text-muted mb-2">{s.reminderLanguage}</p>
          <div className="flex gap-2">
            {languages.map((lang, i) => (
              <span
                key={lang}
                className={`h-[30px] px-3.5 rounded-full text-[12.5px] font-semibold border-[1.5px] flex items-center ${
                  i === 2
                    ? "border-brand bg-brand-wash text-brand-strong"
                    : "border-line text-muted"
                }`}
              >
                {lang}
              </span>
            ))}
          </div>
        </div>

        <Button>
          <Plus size={17} strokeWidth={2.2} aria-hidden="true" />
          {s.recordPayment}
        </Button>
        <Button variant="outline">
          <MessageCircle size={17} strokeWidth={2} aria-hidden="true" />
          {s.remindWhatsapp}
        </Button>

        <div>
          <p className="text-[15px] font-bold mb-0.5">{s.history}</p>
          {history.map((h, i) => (
            <div key={i} className="flex justify-between items-start gap-2 py-2.5 border-b border-line last:border-b-0">
              <div>
                <p className="text-[14px] m-0">{h.label}</p>
                <p className="text-[12px] text-muted m-0">{h.date}</p>
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
