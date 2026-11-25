import { useNavigate } from "react-router";
import { ArrowLeft, Share2, ChevronRight, Power } from "lucide-react";
import { Shell, Screen } from "../components/Shell";
import { Button, Panel } from "../components/ui";
import { strings } from "../lib/strings";
import { formatNaira } from "../lib/money";

export function Trust() {
  const navigate = useNavigate();
  const s = strings.trust;

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

        <span className="inline-flex self-start items-center gap-1.5 bg-brand-wash text-brand-strong text-[11px] font-bold px-2.5 py-1 rounded-full">
          <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <circle cx="12" cy="12" r="12" />
          </svg>
          {s.active}
        </span>

        <div className="bg-ink text-white rounded-xl p-4.5 flex flex-col items-center gap-2.5">
          <span className="tnum text-[21px] font-extrabold tracking-[2px]">TR-7F2KQ9AL</span>
          <div className="h-[112px] w-[112px] bg-white rounded-lg flex items-center justify-center" aria-label="QR code">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#17201B" strokeWidth="2" aria-hidden="true">
              <rect width="5" height="5" x="3" y="3" rx="1" />
              <rect width="5" height="5" x="16" y="3" rx="1" />
              <rect width="5" height="5" x="3" y="16" rx="1" />
              <path d="M21 16h-3a2 2 0 0 0-2 2v3" />
              <path d="M21 21v.01" />
              <path d="M12 7v3a2 2 0 0 1-2 2H7" />
              <path d="M3 12h.01" />
              <path d="M12 3h.01" />
              <path d="M12 16v.01" />
              <path d="M16 12h1" />
              <path d="M21 12v.01" />
              <path d="M12 21v-1" />
            </svg>
          </div>
        </div>

        <Panel className="p-4">
          <p className="text-[15px] font-bold mb-1.5">Mama Bisi Provisions</p>
          <p className="text-[12px] text-muted m-0">Kuto Market, Abeokuta &middot; 1 Oct &ndash; 25 Nov 2026</p>
          <div className="grid grid-cols-2 gap-2.5 mt-2.5">
            <Stat n="34" label="Pages confirmed" />
            <Stat n={formatNaira(612000)} label="Total sales" />
            <Stat n={formatNaira(210000)} label="Credit given" />
            <Stat n="79%" label="Collection rate" />
          </div>
        </Panel>

        <p className="text-[13px] text-muted m-0">
          {s.recordedLine} Created 25 Nov 2026, expires 25 Dec 2026.
        </p>

        <Button variant="outline">
          <Share2 size={15} strokeWidth={2} aria-hidden="true" />
          {s.share}
        </Button>
        <button
          type="button"
          onClick={() => navigate("/t/TR-7F2KQ9AL")}
          className="flex items-center justify-center gap-1.5 text-brand-strong font-bold text-[13px]"
        >
          {s.previewPublic}
          <ChevronRight size={14} strokeWidth={2.2} aria-hidden="true" />
        </button>
        <button type="button" className="flex items-center justify-center gap-1.5 h-8.5 text-owed font-bold text-[13px]">
          <Power size={14} strokeWidth={2.2} aria-hidden="true" />
          {s.switchOff}
        </button>
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
