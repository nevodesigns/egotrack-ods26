import { Link } from "react-router";
import { CircleCheckBig, TrendingUp, ChevronRight } from "lucide-react";
import { Shell, Screen } from "../components/Shell";
import { BottomNav } from "../components/BottomNav";
import { Panel, LedgerRow, LinkButton } from "../components/ui";
import { strings } from "../lib/strings";
import { formatNaira } from "../lib/money";

// Placeholder demo numbers. T4/T9/T13 replace this with GET /api/summary
// and GET /api/insights.
const demo = {
  shopName: "Mama Bisi Provisions",
  market: "Kuto Market, Abeokuta",
  owed: 184500,
  customers: 6,
  salesThisWeek: 92000,
  salesTrendPct: 12,
  collectedThisWeek: 41000,
  cash: 300000,
  credit: 150000,
  bestSellers: [
    { rank: 1, item: "Rice", amount: 210000 },
    { rank: 2, item: "Oil", amount: 96000 },
    { rank: 3, item: "Sugar", amount: 44500 },
  ],
};

export function Home() {
  const s = strings.home;
  return (
    <Shell paper>
      <Screen className="pt-4.5">
        <div className="flex items-center justify-between gap-2.5">
          <div className="flex flex-col">
            <span className="text-[16px] font-bold">{demo.shopName}</span>
            <span className="text-[13px] text-muted">{demo.market}</span>
          </div>
          <span className="inline-flex items-center gap-[5px] h-[26px] px-2.5 rounded-full text-[12px] font-bold bg-brand-wash text-brand-strong">
            <CircleCheckBig size={13} strokeWidth={2.4} aria-hidden="true" />
            All saved
          </span>
        </div>

        <div>
          <p className="text-[13px] font-semibold text-muted m-0">{s.owed}</p>
          <p className="tnum text-[34px] leading-[38px] font-extrabold m-0 text-owed">
            {formatNaira(demo.owed)}
          </p>
          <p className="text-[13px] text-muted m-0">from {demo.customers} customers</p>
        </div>

        <LinkButton to="/scan">
          {s.scan}
        </LinkButton>

        <Panel className="px-4">
          <LedgerRow
            left={<span className="text-[15px]">{s.salesThisWeek}</span>}
            right={<span className="text-[16px] font-bold tnum">{formatNaira(demo.salesThisWeek)}</span>}
            sub={
              <span className="inline-flex items-center gap-[3px] text-[12px] font-bold text-brand-strong">
                <TrendingUp size={12} strokeWidth={2.4} aria-hidden="true" />
                up {demo.salesTrendPct}%
              </span>
            }
          />
          <LedgerRow
            left={<span className="text-[15px]">{s.collectedThisWeek}</span>}
            right={<span className="text-[16px] font-bold tnum">{formatNaira(demo.collectedThisWeek)}</span>}
          />
          <LedgerRow
            left={<span className="text-[15px]">{s.cashCredit}</span>}
            right={
              <span className="text-[15px] tnum">
                {formatNaira(demo.cash)} &middot; {formatNaira(demo.credit)}
              </span>
            }
          />
        </Panel>

        <Panel className="px-4">
          {demo.bestSellers.map((row) => (
            <LedgerRow
              key={row.item}
              left={
                <span className="flex items-center gap-2.5">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-brand-wash text-brand-strong text-[11px] font-extrabold">
                    {row.rank}
                  </span>
                  <span className="text-[15px]">{row.item}</span>
                </span>
              }
              right={<span className="text-[15px] tnum">{formatNaira(row.amount)}</span>}
            />
          ))}
        </Panel>

        <Link
          to="/owed"
          className="flex items-center justify-between text-[14px] font-bold text-brand-strong"
        >
          {s.bestCustomers}
          <ChevronRight size={16} strokeWidth={2.2} aria-hidden="true" />
        </Link>
      </Screen>
      <BottomNav />
    </Shell>
  );
}
