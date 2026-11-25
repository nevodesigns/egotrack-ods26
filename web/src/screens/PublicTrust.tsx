import { useParams } from "react-router";
import { Mark } from "../components/Logo";
import { Shell, Screen } from "../components/Shell";
import { Panel } from "../components/ui";
import { formatNaira } from "../lib/money";

/**
 * No sign-in. Opened from a WhatsApp link, a printed card or a QR scan.
 * T11 replaces this with GET /api/public/trust/:code.
 */
export function PublicTrust() {
  const { code } = useParams();

  return (
    <Shell paper>
      <Screen className="items-center text-center pt-8 gap-4">
        <Mark size={30} />
        <p className="text-[18px] font-bold m-0">Trust record</p>
        <span className="inline-flex items-center gap-1.5 bg-brand-wash text-brand-strong text-[11px] font-bold px-2.5 py-1 rounded-full">
          Active &middot; expires 25 Dec 2026
        </span>

        <Panel className="w-full p-5 text-left">
          <p className="text-[18px] font-bold m-0">Mama Bisi Provisions</p>
          <p className="text-[12px] text-muted m-0">Kuto Market, Abeokuta</p>
          <p className="text-[12px] text-muted m-0">1 Oct &ndash; 25 Nov 2026</p>
          <div className="grid grid-cols-2 gap-3 mt-3 text-left">
            <Stat n={formatNaira(612000)} label="Total sales" />
            <Stat n={formatNaira(210000)} label="Credit given" />
            <Stat n="79%" label="Collection rate" />
            <Stat n="9" label="Customers" />
          </div>
        </Panel>

        <p className="text-[13px] text-muted m-0">
          Recorded by the trader from her notebook; sums checked by EgoTrack.
        </p>

        <form className="flex gap-2 w-full" onSubmit={(e) => e.preventDefault()}>
          <label className="flex-1">
            <span className="sr-only">Verify another code</span>
            <input
              type="text"
              placeholder="Enter a code to verify"
              className="w-full h-10 border border-line rounded-lg px-3 text-[13px]"
              defaultValue={code === "TR-7F2KQ9AL" ? "" : code}
            />
          </label>
          <button
            type="submit"
            className="h-10 px-3.5 rounded-lg text-[13px] font-bold border-[1.5px] border-brand text-brand"
          >
            Check
          </button>
        </form>

        <p className="text-[12px] text-muted mt-auto">Checked with EgoTrack</p>
      </Screen>
    </Shell>
  );
}

function Stat({ n, label }: { n: string; label: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="tnum text-[16px] font-extrabold">{n}</span>
      <span className="text-[12px] text-muted">{label}</span>
    </div>
  );
}
