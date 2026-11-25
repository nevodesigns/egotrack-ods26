import { Link } from "react-router";
import { ChevronRight, ShieldCheck, Store, Download, Globe, Power } from "lucide-react";
import { Shell, Screen } from "../components/Shell";
import { BottomNav } from "../components/BottomNav";
import { strings } from "../lib/strings";

const rows = [
  { to: "/trust", label: strings.more.trustRecord, icon: ShieldCheck },
  { to: "/more", label: strings.more.branches, icon: Store },
  { to: "/more", label: strings.more.backedUp("02:00"), icon: Download },
  { to: "/more", label: strings.more.language, icon: Globe },
];

export function More() {
  return (
    <Shell>
      <Screen className="pt-4">
        <h1 className="text-[22px] font-extrabold m-0">{strings.nav.more}</h1>
        <div className="flex flex-col">
          {rows.map((r) => (
            <Link
              key={r.label}
              to={r.to}
              className="flex items-center gap-3 py-4 border-b border-line text-[15px]"
            >
              <r.icon size={19} strokeWidth={2} className="text-muted" aria-hidden="true" />
              <span className="flex-1">{r.label}</span>
              <ChevronRight size={18} strokeWidth={2.2} className="text-muted" aria-hidden="true" />
            </Link>
          ))}
          <button type="button" className="flex items-center gap-3 py-4 text-[15px] text-owed">
            <Power size={19} strokeWidth={2} aria-hidden="true" />
            {strings.more.signOut}
          </button>
        </div>
      </Screen>
      <BottomNav />
    </Shell>
  );
}
