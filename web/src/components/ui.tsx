import type { ButtonHTMLAttributes, AnchorHTMLAttributes, ReactNode } from "react";
import { Link } from "react-router";

const base =
  "flex items-center justify-center gap-2 h-13 rounded-[10px] font-bold text-base select-none transition-colors";

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "outline" | "text";
}) {
  const variants = {
    primary: "bg-brand text-white active:bg-brand-strong",
    outline: "bg-transparent text-brand border-[1.5px] border-brand",
    text: "bg-transparent text-brand h-10 font-bold",
  } as const;
  return (
    <button
      className={`${variant === "text" ? "" : base} ${variants[variant]} w-full ${className}`}
      {...props}
    />
  );
}

export function LinkButton({
  to,
  variant = "primary",
  className = "",
  children,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & {
  to: string;
  variant?: "primary" | "outline" | "text";
  children: ReactNode;
}) {
  const variants = {
    primary: "bg-brand text-white",
    outline: "bg-transparent text-brand border-[1.5px] border-brand",
    text: "bg-transparent text-brand h-10 font-bold",
  } as const;
  return (
    <Link
      to={to}
      className={`${variant === "text" ? "" : base} ${variants[variant]} w-full ${className}`}
      {...props}
    >
      {children}
    </Link>
  );
}

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-surface border border-line rounded-[10px] ${className}`}>{children}</div>
  );
}

export function Chip({
  tone = "muted",
  children,
}: {
  tone?: "owes" | "paid" | "muted" | "ok";
  children: ReactNode;
}) {
  const tones = {
    owes: "bg-owed-wash text-owed",
    paid: "bg-brand-wash text-brand-strong",
    muted: "bg-left-bg text-muted",
    ok: "bg-brand-wash text-brand-strong",
  } as const;
  return (
    <span
      className={`inline-flex items-center h-6 px-2.5 rounded-full text-[11px] font-bold whitespace-nowrap ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function LedgerRow({
  left,
  right,
  sub,
}: {
  left: ReactNode;
  right: ReactNode;
  sub?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-line last:border-b-0">
      <div className="flex flex-col gap-0.5">{left}</div>
      <div className="text-right flex flex-col items-end gap-0.5">
        {right}
        {sub}
      </div>
    </div>
  );
}
