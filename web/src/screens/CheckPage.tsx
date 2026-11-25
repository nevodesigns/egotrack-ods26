import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, CircleCheckBig, TriangleAlert, Clock } from "lucide-react";
import { Shell, Screen } from "../components/Shell";
import { Chip, Button } from "../components/ui";
import { strings } from "../lib/strings";
import { formatNaira } from "../lib/money";
import { api, type PageResult } from "../lib/api";

export function CheckPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const s = strings.check;
  const [page, setPage] = useState<PageResult | null>(null);
  const [customer, setCustomer] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    async function poll() {
      try {
        const result = await api.get<PageResult>(`/pages/${id}`);
        if (cancelled) return;
        setPage(result);
        if (result.pageCustomer) setCustomer(result.pageCustomer);
        if (result.status !== "reading" && pollRef.current) {
          clearInterval(pollRef.current);
        }
        if (result.status === "failed") {
          setError(result.errorMessage ?? strings.errors.reader);
        }
      } catch (err) {
        if (!cancelled) setError((err as Error).message);
      }
    }

    poll();
    pollRef.current = setInterval(poll, 3000);
    return () => {
      cancelled = true;
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [id]);

  async function onCustomerBlur() {
    if (!id || !customer.trim()) return;
    try {
      await api.post(`/pages/${id}/customer`, { pageCustomer: customer.trim() });
      const result = await api.get<PageResult>(`/pages/${id}`);
      setPage(result);
    } catch {
      // the confirm button re-validates anyway; no need to block typing
    }
  }

  async function applyRowSuggestion(rowIndex: number, amount: number) {
    if (!id) return;
    await api.patch(`/pages/${id}/rows/${rowIndex}`, { amountAsWritten: String(amount) });
    const result = await api.get<PageResult>(`/pages/${id}`);
    setPage(result);
  }

  async function onConfirm() {
    if (!id) return;
    setConfirming(true);
    setError(null);
    try {
      const result = await api.post<{ customersUpdated: number }>(`/pages/${id}/confirm`);
      void result;
      navigate("/home");
    } catch (err) {
      setError((err as Error).message);
      setConfirming(false);
    }
  }

  if (!page || page.status === "reading") {
    return (
      <Shell paper>
        <Screen className="pt-3.5 items-center justify-center gap-3">
          <Clock size={28} strokeWidth={1.8} className="text-brand" aria-hidden="true" />
          <p className="text-[15px] text-center">Reading your page. You can carry on selling.</p>
        </Screen>
      </Shell>
    );
  }

  if (page.status === "failed") {
    return (
      <Shell paper>
        <Screen className="pt-3.5 items-center justify-center gap-3">
          <TriangleAlert size={28} strokeWidth={1.8} className="text-warn" aria-hidden="true" />
          <p className="text-[15px] text-center">{error ?? strings.errors.reader}</p>
          <Button variant="outline" onClick={() => navigate("/scan")}>
            {strings.scan.retake}
          </Button>
        </Screen>
      </Shell>
    );
  }

  const rows = page.rows ?? [];
  const toCheck = rows.filter((r) => r.status === "check").length;
  const canConfirm = customer.trim().length > 0 || rows.every((r) => r.line.type !== "item");

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
          <span className="text-[18px] font-extrabold">{s.title}</span>
        </div>

        <label className="relative z-[1] flex flex-col gap-1">
          <span className="text-[12px] font-semibold text-muted">{s.whosePage}</span>
          <input
            type="text"
            value={customer}
            onChange={(e) => setCustomer(e.target.value)}
            onBlur={onCustomerBlur}
            placeholder="Type her name"
            className="h-[34px] border-0 border-b-[1.5px] border-line bg-transparent text-[15px] font-bold focus:outline-none focus:border-brand"
          />
        </label>

        <span className="relative z-[1] text-[12px] font-semibold text-muted">
          {rows.length} lines &middot; {toCheck} to check
        </span>

        {rows.map((row, i) => (
          <div
            key={i}
            className={`relative z-[1] rounded-[10px] p-3 flex flex-col gap-1.5 border ${
              row.status === "check"
                ? "bg-warn-bg border-[#EADFB9]"
                : row.status === "left_out"
                  ? "bg-left-bg border-line"
                  : "bg-surface border-line"
            }`}
          >
            <div className="flex justify-between items-start gap-2">
              <span className="text-[15px] font-bold">{row.line.item ?? row.line.text}</span>
              {row.line.type === "item" && <Chip tone="owes">Owes</Chip>}
            </div>

            {row.amount != null && (
              <div className="flex justify-between items-center">
                {row.status === "ok" ? (
                  <span className="inline-flex items-center gap-[5px] text-[12px] font-bold text-brand-strong">
                    <CircleCheckBig size={13} strokeWidth={2.6} aria-hidden="true" />
                    {s.addsUp}
                  </span>
                ) : (
                  <span />
                )}
                <span className="text-[15px] font-bold tnum">{formatNaira(row.amount)}</span>
              </div>
            )}

            {row.status === "check" && row.reason && (
              <span className="inline-flex items-start gap-[5px] text-[12px] font-bold text-warn">
                <TriangleAlert size={13} strokeWidth={2.4} className="mt-px flex-shrink-0" aria-hidden="true" />
                {row.reason}
              </span>
            )}
            {row.status === "check" && row.suggestedAmount && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => applyRowSuggestion(i, row.suggestedAmount!)}
                  className="h-8 px-2.5 rounded-[7px] text-[12.5px] font-bold border-[1.5px] border-warn text-warn bg-white"
                >
                  Use {formatNaira(row.suggestedAmount)}
                </button>
              </div>
            )}
            {row.status === "left_out" && (
              <span className="text-[12px] font-bold text-muted">{s.noName}</span>
            )}
          </div>
        ))}

        <div className="relative z-[1] bg-surface border border-line rounded-[10px] px-3">
          <div className="flex justify-between items-center py-2">
            <span className="text-[14px] text-muted">{s.pageTotalOurs}</span>
            <span className="text-[15px] font-bold tnum">{formatNaira(page.ourTotal ?? 0)}</span>
          </div>
          {page.writtenTotal != null && (
            <div className="flex justify-between items-center py-2 border-t border-dashed border-line">
              <span className="text-[14px] text-muted">{s.pageTotalWritten}</span>
              <span
                className={`text-[15px] font-bold tnum ${page.totalsMatch ? "" : "text-warn"}`}
              >
                {formatNaira(page.writtenTotal)}
              </span>
            </div>
          )}
        </div>

        {error && <p className="relative z-[1] text-[13px] text-owed m-0">{error}</p>}

        <Button onClick={onConfirm} disabled={!canConfirm || confirming}>
          {confirming ? "Saving..." : s.confirm}
        </Button>
      </Screen>
    </Shell>
  );
}
