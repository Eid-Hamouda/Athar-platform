import * as React from "react";
import { cn } from "@/lib/utils";
import { Reveal } from "./Reveal";

export interface StatItem {
  value: string;
  label: string;
  hint?: string;
}

export interface StatBandProps {
  items: StatItem[];
  tone?: "ink" | "sand" | "white";
  className?: string;
}

/**
 * Impact numbers. Gold numerals on ink is the loudest moment in the palette,
 * so this appears at most once per page.
 */
export function StatBand({ items, tone = "ink", className }: StatBandProps) {
  const light = tone === "ink";

  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-px overflow-hidden rounded-2xl md:rounded-3xl lg:grid-cols-4",
        light ? "bg-white/10" : "bg-sand-200",
        className
      )}
    >
      {items.map((item, i) => (
        <Reveal
          key={item.label}
          delay={i * 90}
          className={cn(
            "p-6 md:p-8",
            light ? "bg-ink-900" : tone === "sand" ? "bg-sand-100" : "bg-white"
          )}
        >
          <p
            className={cn(
              "font-display text-display font-extrabold tabular-nums",
              light ? "text-gold-300" : "text-brand-700"
            )}
          >
            {item.value}
          </p>
          <p
            className={cn(
              "mt-2 text-sm font-semibold",
              light ? "text-sand-50" : "text-ink-900"
            )}
          >
            {item.label}
          </p>
          {item.hint && (
            <p
              className={cn(
                "mt-1 text-small",
                light ? "text-sand-300/60" : "text-ink-700/60"
              )}
            >
              {item.hint}
            </p>
          )}
        </Reveal>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */

/**
 * Small floating stat used over hero photography.
 */
export function StatChip({
  value,
  label,
  className,
}: {
  value: string;
  label: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "glass rounded-2xl px-5 py-4 shadow-lg",
        className
      )}
    >
      <p className="font-display text-2xl font-extrabold tabular-nums text-ink-900">
        {value}
      </p>
      <p className="mt-0.5 text-micro font-semibold text-ink-700">{label}</p>
    </div>
  );
}
