import * as React from "react";
import { cn } from "@/lib/utils";

export type BadgeVariant =
  | "brand"
  | "gold"
  | "neutral"
  | "success"
  | "warning"
  | "danger"
  | "ink";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variants: Record<BadgeVariant, string> = {
  brand: "bg-brand-50 text-brand-800 ring-brand-200",
  gold: "bg-gold-50 text-gold-800 ring-gold-200",
  neutral: "bg-sand-100 text-ink-700 ring-sand-200",
  success: "bg-brand-50 text-brand-700 ring-brand-200",
  warning: "bg-gold-50 text-gold-800 ring-gold-300",
  danger: "bg-rose-50 text-rose-700 ring-rose-200",
  ink: "bg-ink-900 text-sand-50 ring-white/15",
};

export function Badge({ className, variant = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-micro font-bold ring-1 ring-inset",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

/* -------------------------------------------------------------------------- */

const STATUS: Record<string, { label: string; variant: BadgeVariant }> = {
  available: { label: "متاح الآن", variant: "success" },
  reserved: { label: "قيد التوصيل", variant: "warning" },
  pending: { label: "بانتظار متبرع", variant: "gold" },
  pending_delivery: { label: "بانتظار التوصيل", variant: "brand" },
  completed: { label: "تم التسليم", variant: "success" },
  cancelled: { label: "ملغى", variant: "danger" },
};

export function StatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const entry = STATUS[status] ?? { label: status, variant: "neutral" as const };
  return (
    <Badge variant={entry.variant} className={className}>
      {entry.label}
    </Badge>
  );
}

/* -------------------------------------------------------------------------- */

const URGENCY: Record<string, BadgeVariant> = {
  "حرج طارئ": "danger",
  عاجل: "warning",
  عادي: "neutral",
  high: "danger",
};

export function UrgencyBadge({
  urgency,
  className,
}: {
  urgency?: string;
  className?: string;
}) {
  if (!urgency) return null;
  return (
    <Badge variant={URGENCY[urgency] ?? "neutral"} className={className}>
      {urgency}
    </Badge>
  );
}
