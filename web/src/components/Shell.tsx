import type { ReactNode } from "react";

/**
 * The one-column phone width shell every screen sits inside.
 * 19_BRAND_AND_UX.md section 7, rule 9: phone first, max width 440px
 * centred on a laptop.
 */
export function Shell({
  children,
  paper = false,
  className = "",
}: {
  children: ReactNode;
  /** a faint ruled-paper texture, only for screens tied to the notebook story */
  paper?: boolean;
  className?: string;
}) {
  return (
    <div className="min-h-dvh bg-bg flex justify-center">
      <div
        className={`relative w-full max-w-[440px] min-h-dvh flex flex-col bg-bg ${
          paper ? "ruled-paper" : ""
        } ${className}`}
      >
        {paper && <div className="margin-rule" aria-hidden="true" />}
        {children}
      </div>
    </div>
  );
}

export function Screen({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`relative z-[1] flex-1 overflow-y-auto flex flex-col gap-4 px-5 pt-4 pb-3 ${className}`}
    >
      {children}
    </div>
  );
}
