import Image from "next/image";
import { cn } from "@/lib/utils";

export interface LogoProps {
  tone?: "ink" | "light";
  /** Hide the wordmark and tagline, keeping only the ripple mark. */
  compact?: boolean;
  className?: string;
}

/**
 * The mark is three rising ripples — an "أثر" (trace) spreading outward from
 * a single act of giving.
 */
export function Logo({ tone = "ink", compact = false, className }: LogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <Image
        src="/mark.svg"
        alt=""
        width={40}
        height={40}
        className="h-10 w-10 shrink-0 rounded-xl shadow-sm"
      />
      {!compact && (
        <span className="flex flex-col leading-none">
          <span
            className={cn(
              "font-display text-2xl font-extrabold",
              tone === "light" ? "text-sand-50" : "text-ink-900"
            )}
          >
            أثر
          </span>
          <span
            className={cn(
              "mt-1 text-micro font-semibold",
              tone === "light" ? "text-sand-300/70" : "text-ink-700/60"
            )}
          >
            منصة العطاء العيني
          </span>
        </span>
      )}
    </span>
  );
}
