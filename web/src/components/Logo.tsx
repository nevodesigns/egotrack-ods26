export function Mark({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none" aria-hidden="true">
      <rect x="2" y="2" width="32" height="32" rx="8" fill="#0B7A43" />
      <path
        d="M12 10h8l4 4v12a1 1 0 0 1-1 1H12a1 1 0 0 1-1-1V11a1 1 0 0 1 1-1Z"
        stroke="#FFFFFF"
        strokeWidth="1.6"
        fill="none"
      />
      <path d="M14 16h6M14 20h6" stroke="#FFFFFF" strokeWidth="1.6" strokeLinecap="round" />
      <path
        d="M14.5 23.5l2 2 4-4.5"
        stroke="#FFFFFF"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Wordmark() {
  return (
    <span className="text-[21px] font-extrabold tracking-[-0.3px]">
      Ego<span className="text-brand-strong">Track</span>
    </span>
  );
}
