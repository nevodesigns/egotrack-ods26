import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, CircleCheckBig, TriangleAlert } from "lucide-react";
import { Shell, Screen } from "../components/Shell";
import { Chip, Button } from "../components/ui";
import { strings } from "../lib/strings";
import { formatNaira } from "../lib/money";

// Placeholder rows matching the real notebook pattern in
// ~/odS_hack/plan/18_NOTEBOOK_SAMPLES.md. T6 replaces this with the
// AI reader's output, already run through the check rules in code.
const demoRows = [
  {
    kind: "ok" as const,
    customer: "Chief Ade",
    item: "Rice",
    qty: 2,
    unitPrice: 4000,
    amount: 8000,
    status: "owes" as const,
  },
  {
    kind: "check" as const,
    customer: "Iya Tolu",
    item: "Oil",
    qty: 3,
    unitPrice: 1200,
    written: 4500,
    ours: 3600,
    status: "owes" as const,
  },
  {
    kind: "left" as const,
    customer: null,
    item: "Sugar",
    amount: 2000,
  },
];

export function CheckPage() {
  const navigate = useNavigate();
  const s = strings.check;
  const [customer, setCustomer] = useState("Iya Tolu");
  const toCheck = demoRows.filter((r) => r.kind === "check").length;

  const ourTotal = 8000 + 3600; // left-out row excluded
  const writtenTotal = 8000 + 4500;

  function onConfirm() {
    // T7 wires this to POST /api/pages/:id/confirm
    navigate("/home");
  }

  return (
    <Shell paper>
      <Screen className="pt-3.5 gap-3">
        <div className="relative z-[1] flex items-center gap-2.5">
          <button
            type="button"
            aria-label="Back to Scan"
            onClick={() => navigate("/scan")}
            className="flex h-8 w-8 items-center justify-center rounded-[8px] text-ink"
          >
            <ArrowLeft size={18} strokeWidth={2.2} aria-hidden="true" />
          </button>
          <div className="h-8 w-8 rounded-[6px] bg-[#262B28]" aria-hidden="true" />
          <span className="text-[18px] font-extrabold">{s.title}</span>
        </div>

        <label className="relative z-[1] flex flex-col gap-1">
          <span className="text-[12px] font-semibold text-muted">{s.whosePage}</span>
          <input
            type="text"
            value={customer}
            onChange={(e) => setCustomer(e.target.value)}
            className="h-[34px] border-0 border-b-[1.5px] border-line bg-transparent text-[15px] font-bold focus:outline-none focus:border-brand"
          />
        </label>

        <span className="relative z-[1] text-[12px] font-semibold text-muted">
          {demoRows.length} lines &middot; {toCheck} to check
        </span>

        {demoRows.map((row, i) => (
          <div
            key={i}
            className={`relative z-[1] rounded-[10px] p-3 flex flex-col gap-1.5 border ${
              row.kind === "check"
                ? "bg-warn-bg border-[#EADFB9]"
                : row.kind === "left"
                  ? "bg-left-bg border-line"
                  : "bg-surface border-line"
            }`}
          >
            <div className="flex justify-between items-start gap-2">
              <span className="text-[15px] font-bold">{row.customer ?? "(no name)"}</span>
              {row.status === "owes" && <Chip tone="owes">Owes</Chip>}
            </div>

            {row.kind === "ok" && (
              <>
                <span className="text-[14px] text-muted">
                  {row.item} &middot; {row.qty} &times; {formatNaira(row.unitPrice)}
                </span>
                <div className="flex justify-between items-center">
                  <span className="inline-flex items-center gap-[5px] text-[12px] font-bold text-brand-strong">
                    <CircleCheckBig size={13} strokeWidth={2.6} aria-hidden="true" />
                    {s.addsUp}
                  </span>
                  <span className="text-[15px] font-bold tnum">{formatNaira(row.amount)}</span>
                </div>
              </>
            )}

            {row.kind === "check" && (
              <>
                <span className="text-[14px] text-muted">
                  {row.item} &middot; {row.qty} &times; {formatNaira(row.unitPrice)}
                </span>
                <span className="inline-flex items-start gap-[5px] text-[12px] font-bold text-warn">
                  <TriangleAlert size={13} strokeWidth={2.4} className="mt-px flex-shrink-0" aria-hidden="true" />
                  {s.written(row.written.toLocaleString("en-NG"), row.ours.toLocaleString("en-NG"))}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="h-8 px-2.5 rounded-[7px] text-[12.5px] font-bold border-[1.5px] border-warn text-warn bg-white"
                  >
                    Use {formatNaira(row.ours)}
                  </button>
                  <button
                    type="button"
                    className="h-8 px-2.5 rounded-[7px] text-[12.5px] font-bold border-[1.5px] border-line text-muted bg-white"
                  >
                    Edit
                  </button>
                </div>
              </>
            )}

            {row.kind === "left" && (
              <>
                <span className="text-[14px] text-muted">{row.item} &middot; {formatNaira(row.amount)}</span>
                <span className="text-[12px] font-bold text-muted">{s.noName}</span>
                <button
                  type="button"
                  className="h-8 px-2.5 rounded-[7px] text-[12.5px] font-bold border-[1.5px] border-line text-muted bg-white self-start"
                >
                  {s.addName}
                </button>
              </>
            )}
          </div>
        ))}

        <div className="relative z-[1] bg-surface border border-line rounded-[10px] px-3">
          <div className="flex justify-between items-center py-2">
            <span className="text-[14px] text-muted">{s.pageTotalOurs}</span>
            <span className="text-[15px] font-bold tnum">{formatNaira(ourTotal)}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-t border-dashed border-line">
            <span className="text-[14px] text-muted">{s.pageTotalWritten}</span>
            <span className="text-[15px] font-bold tnum text-warn">{formatNaira(writtenTotal)}</span>
          </div>
        </div>

        <Button onClick={onConfirm}>{s.confirm}</Button>
      </Screen>
    </Shell>
  );
}
