import * as React from "react";
import { Loader2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { IconTile } from "./Card";

/* -------------------------------------------------------------------------- */

export function Spinner({
  size = 20,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <Loader2
      size={size}
      className={cn("animate-spin text-brand-600", className)}
      aria-hidden
    />
  );
}

/* -------------------------------------------------------------------------- */

export function LoadingState({
  label = "جاري التحميل…",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-h-64 flex-col items-center justify-center gap-4 py-16",
        className
      )}
      role="status"
    >
      <span className="relative flex h-14 w-14 items-center justify-center">
        <span className="absolute inset-0 rounded-full bg-brand-100" />
        <Spinner size={26} className="relative" />
      </span>
      <p className="text-sm font-semibold text-ink-700">{label}</p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  body?: string;
  action?: React.ReactNode;
  tone?: "sand" | "white";
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  body,
  action,
  tone = "sand",
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-sand-300 px-6 py-16 text-center",
        tone === "sand" ? "bg-sand-100/60" : "bg-white",
        className
      )}
    >
      <IconTile tone="sand" size="lg">
        <Icon size={26} strokeWidth={1.75} />
      </IconTile>
      <h3 className="mt-5 font-display text-h3 font-bold text-ink-900">
        {title}
      </h3>
      {body && (
        <p className="mt-2 max-w-sm text-pretty text-sm text-ink-700/80">
          {body}
        </p>
      )}
      {action && <div className="mt-7">{action}</div>}
    </div>
  );
}

/* -------------------------------------------------------------------------- */

export function Alert({
  tone = "danger",
  title,
  children,
  icon: Icon,
  className,
}: {
  tone?: "danger" | "warning" | "info";
  title?: string;
  children: React.ReactNode;
  icon?: LucideIcon;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-3.5 rounded-2xl p-5 ring-1 ring-inset",
        {
          "bg-rose-50 text-rose-800 ring-rose-200": tone === "danger",
          "bg-gold-50 text-gold-900 ring-gold-200": tone === "warning",
          "bg-brand-50 text-brand-900 ring-brand-200": tone === "info",
        },
        className
      )}
      role={tone === "danger" ? "alert" : undefined}
    >
      {Icon && <Icon size={20} className="mt-0.5 shrink-0" />}
      <div className="min-w-0 text-sm">
        {title && <p className="font-bold">{title}</p>}
        <div className={cn(title && "mt-1", "opacity-90")}>{children}</div>
      </div>
    </div>
  );
}
