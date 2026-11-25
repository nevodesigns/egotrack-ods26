import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { CircleCheckBig, TrendingUp, TrendingDown, ChevronRight } from "lucide-react";
import { Shell, Screen } from "../components/Shell";
import { BottomNav } from "../components/BottomNav";
import { Panel, LedgerRow, LinkButton } from "../components/ui";
import { strings } from "../lib/strings";
import { formatNaira } from "../lib/money";
import { api, type Summary, type Insights, type Shop } from "../lib/api";

export function Home() {
  const navigate = useNavigate();
  const s = strings.home;
  const [shop, setShop] = useState<Shop | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [insights, setInsights] = useState<Insights | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [me, sum, ins] = await Promise.all([
          api.get<{ shop: Shop }>("/me"),
          api.get<Summary>("/summary"),
          api.get<Insights>("/summary/insights"),
        ]);
        if (cancelled) return;
        setShop(me.shop);
        setSummary(sum);
        setInsights(ins);
      } catch {
        if (!cancelled) navigate("/");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    const poll = setInterval(load, 4000);
    return () => {
      cancelled = true;
      clearInterval(poll);
    };
  }, [navigate]);

  if (loading || !shop || !summary) {
    return (
      <Shell paper>
        <Screen className="pt-4.5 items-center justify-center">
          <p className="text-muted">Loading...</p>
        </Screen>
        <BottomNav />
      </Shell>
    );
  }

  return (
    <Shell paper>
      <Screen className="pt-4.5">
        <div className="flex items-center justify-between gap-2.5">
          <div className="flex flex-col">
            <span className="text-[16px] font-bold">{shop.name}</span>
            <span className="text-[13px] text-muted">{shop.market}</span>
          </div>
          <span className="inline-flex items-center gap-[5px] h-[26px] px-2.5 rounded-full text-[12px] font-bold bg-brand-wash text-brand-strong">
            <CircleCheckBig size={13} strokeWidth={2.4} aria-hidden="true" />
            All saved
          </span>
        </div>

        <div>
          <p className="text-[13px] font-semibold text-muted m-0">{s.owed}</p>
          <p className="tnum text-[34px] leading-[38px] font-extrabold m-0 text-owed">
            {formatNaira(summary.owedTotal)}
          </p>
          <p className="text-[13px] text-muted m-0">from {summary.customersOwing} customers</p>
          {summary.pagesReading > 0 && (
            <p className="text-[13px] text-brand-strong font-semibold mt-1">{s.reading(summary.pagesReading)}</p>
          )}
        </div>

        <LinkButton to="/scan">{s.scan}</LinkButton>

        {insights && (
          <>
            <Panel className="px-4">
              <LedgerRow
                left={<span className="text-[15px]">{s.salesThisWeek}</span>}
                right={<span className="text-[16px] font-bold tnum">{formatNaira(insights.salesThisWeek)}</span>}
                sub={
                  insights.salesTrendPct != null ? (
                    <span
                      className={`inline-flex items-center gap-[3px] text-[12px] font-bold ${
                        insights.salesTrendPct >= 0 ? "text-brand-strong" : "text-owed"
                      }`}
                    >
                      {insights.salesTrendPct >= 0 ? (
                        <TrendingUp size={12} strokeWidth={2.4} aria-hidden="true" />
                      ) : (
                        <TrendingDown size={12} strokeWidth={2.4} aria-hidden="true" />
                      )}
                      {insights.salesTrendPct >= 0 ? "up" : "down"} {Math.abs(insights.salesTrendPct)}%
                    </span>
                  ) : undefined
                }
              />
              <LedgerRow
                left={<span className="text-[15px]">{s.collectedThisWeek}</span>}
                right={
                  <span className="text-[16px] font-bold tnum">{formatNaira(summary.collectedThisWeek)}</span>
                }
              />
              <LedgerRow
                left={<span className="text-[15px]">{s.cashCredit}</span>}
                right={
                  <span className="text-[15px] tnum">
                    {formatNaira(insights.cash)} &middot; {formatNaira(insights.credit)}
                  </span>
                }
              />
            </Panel>

            {insights.bestSellers.length > 0 && (
              <Panel className="px-4">
                {insights.bestSellers.map((row) => (
                  <LedgerRow
                    key={row.item}
                    left={
                      <span className="flex items-center gap-2.5">
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-brand-wash text-brand-strong text-[11px] font-extrabold">
                          {row.rank}
                        </span>
                        <span className="text-[15px] capitalize">{row.item}</span>
                      </span>
                    }
                    right={<span className="text-[15px] tnum">{formatNaira(row.amount)}</span>}
                  />
                ))}
              </Panel>
            )}
          </>
        )}

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
