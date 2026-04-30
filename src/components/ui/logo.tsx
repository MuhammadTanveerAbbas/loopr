import { Link } from "@tanstack/react-router";

/** Loopr brand mark — flat neobrutal infinity loop. */
export function LoopMark({ size = 40, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} aria-hidden="true">
      {/* Yellow square plate */}
      <rect
        x="3"
        y="3"
        width="58"
        height="58"
        rx="14"
        fill="#FFE14D"
        stroke="#0A0A0A"
        strokeWidth="3.5"
      />
      {/* Infinity loop */}
      <path
        d="M20 32c0-5.5 4.5-10 10-10s10 4.5 10 10-4.5 10-10 10c5.5 0 10 4.5 10 10s-4.5 10-10 10-10-4.5-10-10"
        transform="translate(0 -10) scale(1 0.6) translate(0 12)"
        fill="none"
        stroke="#0A0A0A"
        strokeWidth="4"
        strokeLinecap="round"
      />
      {/* Orange dot accent */}
      <circle cx="44" cy="32" r="5" fill="#FF6B35" stroke="#0A0A0A" strokeWidth="2.5" />
    </svg>
  );
}

export function BrandLockup({
  size = 40,
  to = "/",
  showTag = true,
  className = "",
}: {
  size?: number;
  to?: string;
  showTag?: boolean;
  className?: string;
}) {
  return (
    <Link to={to} className={`flex items-center gap-3 group ${className}`}>
      <LoopMark size={size} className="transition-transform group-hover:rotate-[-6deg]" />
      <div className="flex flex-col leading-none">
        <span className="font-extrabold text-[22px] text-foreground tracking-tight">Loopr</span>
        {showTag && (
          <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/70 mt-0.5">
            by The MVP Guy
          </span>
        )}
      </div>
    </Link>
  );
}
