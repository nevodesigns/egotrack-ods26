import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Share2, ChevronRight, Power } from "lucide-react";
import { Shell, Screen } from "../components/Shell";
import { Button, Panel } from "../components/ui";
import { strings } from "../lib/strings";
import { formatNaira } from "../lib/money";
import { api } from "../lib/api";

interface Totals {
  pagesConfirmed: number;
  totalSales: number;
  creditGiven: number;
  collected: number;
  collectionRate: number;
  customers: number;
  periodStart?: string;
  periodEnd?: string;
}
interface TrustRecord {
  code: string;
  totals_snapshot: Totals;
  created_at: string;
  expires_at: string;
  active: boolean;
}

export function Trust() {
  const navigate = useNavigate();
  const s = strings.trust;
  const [record, setRecord] = useState<TrustRecord | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    const { trustRecords } = await api.get<{ trustRecords: TrustRecord[] }>("/trust");
    setRecord(trustRecords.find((r) => r.active) ?? trustRecords[0] ?? null);
  }

  useEffect(() => {
    load();
  }, []);

  async function onCreate() {
    setBusy(true);
    try {
      await api.post("/trust");
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function onSwitchOff() {
    if (!record) return;
    await api.post(`/trust/${record.code}/off`);
    await load();
  }

  const qrUrl = record ? `${window.location.origin}/t/${record.code}` : "";

  return (
    <Shell>
      <Screen className="pt-4 gap-3.5">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            aria-label="Back"
            onClick={() => navigate("/more")}
            className="flex h-8 w-8 items-center justify-center rounded-[8px] text-ink"
          >
            <ArrowLeft size={18} strokeWidth={2.2} aria-hidden="true" />
          </button>
          <h1 className="text-[20px] font-extrabold m-0">{s.title}</h1>
        </div>

        {!record && (
          <>
            <p className="text-[14px] text-muted">
              Create a trust record to show a cooperative, lender or association what you've recorded. Totals only, never customer names.
            </p>
            <Button onClick={onCreate} disabled={busy}>
              {busy ? "Creating..." : s.create}
            </Button>
          </>
        )}

        {record && (
          <>
            <span
              className={`inline-flex self-start items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full ${
                record.active ? "bg-brand-wash text-brand-strong" : "bg-left-bg text-muted"
              }`}
            >
              {record.active ? s.active : "Switched off"}
            </span>

            <div className="bg-ink text-white rounded-xl p-4.5 flex flex-col items-center gap-2.5">
              <span className="tnum text-[21px] font-extrabold tracking-[2px]">{record.code}</span>
              <div className="h-[140px] w-[140px] bg-white rounded-lg flex items-center justify-center p-2">
                <img
                  src={`/api/qr?text=${encodeURIComponent(`/t/${record.code}`)}`}
                  alt="QR code to the public trust page"
                  width={130}
                  height={130}
                />
              </div>
            </div>

            <Panel className="p-4">
              <div className="grid grid-cols-2 gap-2.5">
                <Stat n={String(record.totals_snapshot.pagesConfirmed)} label="Pages confirmed" />
                <Stat n={formatNaira(record.totals_snapshot.totalSales)} label="Total sales" />
                <Stat n={formatNaira(record.totals_snapshot.creditGiven)} label="Credit given" />
                <Stat n={`${record.totals_snapshot.collectionRate}%`} label="Collection rate" />
              </div>
            </Panel>

            <p className="text-[13px] text-muted m-0">
              {s.recordedLine} Created {new Date(record.created_at).toLocaleDateString("en-NG")}, expires{" "}
              {new Date(record.expires_at).toLocaleDateString("en-NG")}.
            </p>

            <Button variant="outline" onClick={() => navigator.share?.({ url: qrUrl })}>
              <Share2 size={15} strokeWidth={2} aria-hidden="true" />
              {s.share}
            </Button>
            <button
              type="button"
              onClick={() => navigate(`/t/${record.code}`)}
              className="flex items-center justify-center gap-1.5 text-brand-strong font-bold text-[13px]"
            >
              {s.previewPublic}
              <ChevronRight size={14} strokeWidth={2.2} aria-hidden="true" />
            </button>
            {record.active && (
              <button
                type="button"
                onClick={onSwitchOff}
                className="flex items-center justify-center gap-1.5 h-8.5 text-owed font-bold text-[13px]"
              >
                <Power size={14} strokeWidth={2.2} aria-hidden="true" />
                {s.switchOff}
              </button>
            )}
          </>
        )}
      </Screen>
    </Shell>
  );
}

function Stat({ n, label }: { n: string; label: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="tnum text-[17px] font-extrabold">{n}</span>
      <span className="text-[12px] text-muted">{label}</span>
    </div>
  );
}
