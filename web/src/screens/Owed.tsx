import { useEffect, useState } from "react";
import { Link } from "react-router";
import { ChevronRight } from "lucide-react";
import { Shell, Screen } from "../components/Shell";
import { BottomNav } from "../components/BottomNav";
import { strings } from "../lib/strings";
import { formatNaira } from "../lib/money";
import { api, type CustomerListItem } from "../lib/api";

export function Owed() {
  const [customers, setCustomers] = useState<CustomerListItem[] | null>(null);

  useEffect(() => {
    api.get<{ customers: CustomerListItem[] }>("/customers").then((r) => setCustomers(r.customers));
  }, []);

  return (
    <Shell>
      <Screen className="pt-4">
        <h1 className="text-[22px] font-extrabold m-0">{strings.owed.title}</h1>

        {customers === null && <p className="text-muted">Loading...</p>}
        {customers?.length === 0 && (
          <p className="text-muted text-[14px]">No one owes you right now.</p>
        )}

        <div className="flex flex-col">
          {customers?.map((c) => (
            <Link
              key={c.id}
              to={`/owed/${c.id}`}
              className="flex items-center justify-between py-3.5 border-b border-line"
            >
              <div className="flex flex-col gap-0.5">
                <span className="text-[15px] font-bold">{c.name}</span>
                {c.oldestUnpaidAt && (
                  <span className="text-[12px] text-muted">
                    since {new Date(c.oldestUnpaidAt).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="tnum text-[16px] font-extrabold text-owed">{formatNaira(c.balance)}</span>
                <ChevronRight size={18} strokeWidth={2.2} className="text-muted" aria-hidden="true" />
              </div>
            </Link>
          ))}
        </div>
      </Screen>
      <BottomNav />
    </Shell>
  );
}
