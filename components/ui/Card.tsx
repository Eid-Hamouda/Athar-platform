import * as React from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: "none" | "sm" | "md" | "lg";
  tone?: "white" | "sand" | "ink" | "outline";
  /** Lifts on hover — only for cards that are themselves a link or button. */
  interactive?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    { className, padding = "md", tone = "white", interactive = false, ...props },
    ref
  ) => (
    <div
      ref={ref}
      className={cn(
        "relative rounded-xl md:rounded-2xl",
        {
          "bg-white shadow-sm ring-1 ring-sand-200/80": tone === "white",
          "bg-sand-100 ring-1 ring-sand-200": tone === "sand",
          "bg-ink-900 text-sand-50 ring-1 ring-white/10": tone === "ink",
          "bg-transparent ring-1 ring-sand-200": tone === "outline",
        },
        {
          "p-4": padding === "sm",
          "p-5 md:p-6": padding === "md",
          "p-6 md:p-9": padding === "lg",
        },
        interactive &&
          "transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg hover:ring-sand-300",
        className
      )}
      {...props}
    />
  )
);
Card.displayName = "Card";

/* -------------------------------------------------------------------------- */

/**
 * A soft-tinted square that holds an icon. Used at the top of feature cards
 * and beside dashboard section titles.
 */
export function IconTile({
  children,
  tone = "brand",
  size = "md",
  className,
}: {
  children: React.ReactNode;
  tone?: "brand" | "gold" | "sand" | "ink" | "danger";
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-xl",
        {
          "bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-100":
            tone === "brand",
          "bg-gold-100 text-gold-800 ring-1 ring-inset ring-gold-200":
            tone === "gold",
          "bg-sand-100 text-ink-700 ring-1 ring-inset ring-sand-200":
            tone === "sand",
          "bg-ink-900 text-gold-300": tone === "ink",
          "bg-rose-50 text-rose-600 ring-1 ring-inset ring-rose-100":
            tone === "danger",
        },
        {
          "h-9 w-9": size === "sm",
          "h-11 w-11": size === "md",
          "h-14 w-14 rounded-2xl": size === "lg",
        },
        className
      )}
    >
      {children}
    </span>
  );
}
