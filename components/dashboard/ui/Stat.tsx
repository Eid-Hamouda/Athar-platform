import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/* ==========================================================================
   Metrics and progress.

   KPI values are sized for scanning a row of them, not for a hero headline —
   `text-2xl tabular-nums`, label above, context below.
   ========================================================================== */

export interface StatCardProps {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon?: LucideIcon;
  /** Draws attention when the number represents outstanding work. */
  attention?: boolean;
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  attention = false,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl bg-white px-5 py-4 ring-1",
        attention ? "ring-gold-300" : "ring-sand-200"
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold text-ink-700/70">{label}</p>
        {Icon && (
          <Icon
            size={15}
            strokeWidth={1.75}
            className={attention ? "text-gold-600" : "text-ink-700/55"}
          />
        )}
      </div>
      <p
        className={cn(
          "mt-2 text-2xl font-bold tabular-nums",
          attention ? "text-gold-700" : "text-ink-900"
        )}
      >
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-ink-700/60">{hint}</p>}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* StageBar — compact three-step progress that fits inside a table cell       */
/* -------------------------------------------------------------------------- */

export interface StageBarProps {
  labels: readonly string[];
  /** Index of the stage currently in progress. */
  current: number;
  className?: string;
}

export function StageBar({ labels, current, className }: StageBarProps) {
  return (
    <div className={cn("min-w-36", className)}>
      <div className="flex gap-1">
        {labels.map((label, i) => (
          <span
            key={label}
            className={cn(
              "h-1 flex-1 rounded-full",
              i < current
                ? "bg-brand-500"
                : i === current
                  ? "bg-gold-400"
                  : "bg-sand-200"
            )}
          />
        ))}
      </div>
      <p className="mt-1.5 text-xs font-semibold text-ink-700/75">
        {labels[current] ?? labels.at(-1)}
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* FilterTabs — segmented control for status filters                          */
/* -------------------------------------------------------------------------- */

export interface FilterOption<T extends string> {
  id: T;
  label: string;
  count?: number;
}

export function FilterTabs<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: readonly FilterOption<T>[];
  value: T;
  onChange: (next: T) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex rounded-lg bg-sand-100 p-0.5 ring-1 ring-sand-200",
        className
      )}
    >
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => onChange(option.id)}
          aria-pressed={value === option.id}
          className={cn(
            "rounded-md px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors",
            value === option.id
              ? "bg-white text-ink-900 shadow-xs ring-1 ring-sand-200"
              : "text-ink-700/70 hover:text-ink-900"
          )}
        >
          {option.label}
          {option.count !== undefined && (
            <span className="ms-1.5 tabular-nums opacity-55">
              {option.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
