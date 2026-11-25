import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { Mark } from "../components/Logo";
import { Shell, Screen } from "../components/Shell";
import { Panel } from "../components/ui";
import { formatNaira } from "../lib/money";
import { api } from "../lib/api";

interface PublicTrustData {
  shopName: string;
  market: string;
  totals: {
    pagesConfirmed: number;
    totalSales: number;
    creditGiven: number;
    collectionRate: number;
    customers: number;
  };
  createdAt: string;
  expiresAt: string;
  active: boolean;
}

/**
 * No sign-in. Opened from a WhatsApp link, a printed card or a QR scan.
 */
export function PublicTrust() {
  const { code } = useParams();
  const [data, setData] = useState<PublicTrustData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [verifyCode, setVerifyCode] = useState("");

  async function load(c: string) {
    setError(null);
    setData(null);
    try {
      const result = await api.get<PublicTrustData>(`/public/trust/${c}`);
      setData(result);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  useEffect(() => {
    if (code) load(code);
  }, [code]);

  return (
    <Shell paper>
      <Screen className="items-center text-center pt-8 gap-4">
        <Mark size={30} />
        <p className="text-[18px] font-bold m-0">Trust record</p>

        {error && <p className="text-[14px] text-owed">{error}</p>}

        {data && (
          <>
            <span
              className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full ${
                data.active ? "bg-brand-wash text-brand-strong" : "bg-left-bg text-muted"
              }`}
            >
              {data.active ? "Active" : "Switched off"} &middot; expires{" "}
              {new Date(data.expiresAt).toLocaleDateString("en-NG")}
            </span>

            <Panel className="w-full p-5 text-left">
              <p className="text-[18px] font-bold m-0">{data.shopName}</p>
              <p className="text-[12px] text-muted m-0">{data.market}</p>
              <div className="grid grid-cols-2 gap-3 mt-3 text-left">
                <Stat n={formatNaira(data.totals.totalSales)} label="Total sales" />
                <Stat n={formatNaira(data.totals.creditGiven)} label="Credit given" />
                <Stat n={`${data.totals.collectionRate}%`} label="Collection rate" />
                <Stat n={String(data.totals.customers)} label="Customers" />
              </div>
            </Panel>

            <p className="text-[13px] text-muted m-0">
              Recorded by the trader from her notebook; sums checked by EgoTrack.
            </p>
          </>
        )}

        <form
          className="flex gap-2 w-full"
          onSubmit={(e) => {
            e.preventDefault();
            if (verifyCode.trim()) load(verifyCode.trim());
          }}
        >
          <label className="flex-1">
            <span className="sr-only">Verify another code</span>
            <input
              type="text"
              value={verifyCode}
              onChange={(e) => setVerifyCode(e.target.value)}
              placeholder="Enter a code to verify"
              className="w-full h-10 border border-line rounded-lg px-3 text-[13px]"
            />
          </label>
          <button type="submit" className="h-10 px-3.5 rounded-lg text-[13px] font-bold border-[1.5px] border-brand text-brand">
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
