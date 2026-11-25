import { NavLink } from "react-router";
import { House, Camera, Users, Ellipsis } from "lucide-react";
import { strings } from "../lib/strings";

const itemClass = ({ isActive }: { isActive: boolean }) =>
  `flex-1 flex flex-col items-center gap-[3px] pt-2.5 pb-2 text-[11px] font-semibold ${
    isActive ? "text-brand-strong" : "text-muted"
  }`;

function Dot({ active }: { active: boolean }) {
  return (
    <span
      className={`mt-px h-[3px] w-[18px] rounded-full ${
        active ? "bg-brand-strong" : "bg-transparent"
      }`}
    />
  );
}

export function BottomNav() {
  return (
    <nav
      className="relative z-[2] flex border-t border-line bg-surface pb-1 flex-shrink-0"
      aria-label="Main"
    >
      <NavLink to="/home" className={itemClass} end>
        {({ isActive }) => (
          <>
            <House size={21} strokeWidth={2} aria-hidden="true" />
            {strings.nav.home}
            <Dot active={isActive} />
          </>
        )}
      </NavLink>

      <div className="flex flex-col items-center">
        <NavLink
          to="/scan"
          aria-label={strings.home.scan}
          className="mt-[-22px] flex h-[50px] w-[50px] items-center justify-center rounded-full bg-brand text-white shadow-[0_2px_6px_rgba(11,122,67,0.3)]"
        >
          <Camera size={20} strokeWidth={2} aria-hidden="true" />
        </NavLink>
        <span className="pt-0.5 text-[11px] font-semibold text-muted">
          {strings.nav.scan}
        </span>
      </div>

      <NavLink to="/owed" className={itemClass}>
        {({ isActive }) => (
          <>
            <Users size={21} strokeWidth={2} aria-hidden="true" />
            {strings.nav.owed}
            <Dot active={isActive} />
          </>
        )}
      </NavLink>

      <NavLink to="/more" className={itemClass}>
        {({ isActive }) => (
          <>
            <Ellipsis size={21} strokeWidth={2} aria-hidden="true" />
            {strings.nav.more}
            <Dot active={isActive} />
          </>
        )}
      </NavLink>
    </nav>
  );
}
