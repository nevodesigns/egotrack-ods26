import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { Mark } from "../components/Logo";
import { Shell, Screen } from "../components/Shell";
import { Panel } from "../components/ui";
import { formatNaira } from "../lib/money";
import { api } from "../lib/api";

interface PublicDebtData {
  shopName: string;
  market: string;
  customerFirstName: string;
  balance: number;
  records: Array<{ item: string; quantity: number | null; amount: number; created_at: string }>;
}

/** No sign-in. This is the page the "Remind on WhatsApp" link opens for a customer. */
export function PublicDebt() {
  const { code } = useParams();
  const [data, setData] = useState<PublicDebtData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!code) return;
    api
      .get<PublicDebtData>(`/public/debt/${code}`)
      .then(setData)
      .catch((err) => setError((err as Error).message));
  }, [code]);

  return (
    <Shell paper>
      <Screen className="items-center text-center pt-8 gap-4">
        <Mark size={30} />
        <p className="text-[18px] font-bold m-0">What you owe</p>

        {error && <p className="text-[14px] text-owed">{error}</p>}

        {data && (
          <>
            <Panel className="w-full p-5 text-left">
              <p className="text-[16px] font-bold m-0">{data.shopName}</p>
              <p className="text-[12px] text-muted m-0">{data.market}</p>
              <p className="text-[14px] mt-2 mb-0">Hello {data.customerFirstName},</p>
              <div className="mt-2 flex flex-col gap-1">
                {data.records.map((r, i) => (
                  <div key={i} className="flex justify-between text-[13px]">
                    <span>
                      {r.item}
                      {r.quantity ? ` × ${r.quantity}` : ""}
                    </span>
                    <span className="tnum font-semibold">{formatNaira(r.amount)}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-3 pt-3 border-t border-line">
                <span className="text-[14px] font-bold">Balance</span>
                <span className="tnum text-[16px] font-extrabold text-owed">{formatNaira(data.balance)}</span>
              </div>
            </Panel>
            <p className="text-[13px] text-muted m-0">Checked with EgoTrack.</p>
          </>
        )}
      </Screen>
    </Shell>
  );
}
