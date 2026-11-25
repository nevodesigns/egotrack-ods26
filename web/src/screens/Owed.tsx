import { Link } from "react-router";
import { ChevronRight } from "lucide-react";
import { Shell, Screen } from "../components/Shell";
import { BottomNav } from "../components/BottomNav";
import { strings } from "../lib/strings";
import { formatNaira } from "../lib/money";

// T8 replaces this with GET /api/customers
const demoCustomers = [
  { id: "iya-tolu", name: "Iya Tolu", balance: 3600, since: "25 Nov 2026" },
  { id: "chief-ade", name: "Chief Ade", balance: 8000, since: "24 Nov 2026" },
  { id: "mama-rose", name: "Mama Rose", balance: 1500, since: "20 Nov 2026" },
];

export function Owed() {
  return (
    <Shell>
      <Screen className="pt-4">
        <h1 className="text-[22px] font-extrabold m-0">{strings.owed.title}</h1>

        <div className="flex flex-col">
          {demoCustomers.map((c) => (
            <Link
              key={c.id}
              to={`/owed/${c.id}`}
              className="flex items-center justify-between py-3.5 border-b border-line"
            >
              <div className="flex flex-col gap-0.5">
                <span className="text-[15px] font-bold">{c.name}</span>
                <span className="text-[12px] text-muted">since {c.since}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="tnum text-[16px] font-extrabold text-owed">
                  {formatNaira(c.balance)}
                </span>
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
