import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export type ButtonVariant =
  | "primary"
  | "gold"
  | "dark"
  | "outline"
  | "ghost"
  | "on-ink"
  | "danger";

export type ButtonSize = "sm" | "md" | "lg" | "icon";

export interface ButtonStyleOptions {
  variant?: ButtonVariant;
  size?: ButtonSize;
  full?: boolean;
}

const base =
  "group/btn relative inline-flex shrink-0 items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap transition-all duration-300 ease-out select-none disabled:pointer-events-none disabled:opacity-45 active:translate-y-px";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-brand-600 text-white shadow-sm hover:bg-brand-700 hover:shadow-glow hover:-translate-y-0.5",
  gold: "bg-gold-300 text-ink-900 shadow-sm hover:bg-gold-200 hover:shadow-gold hover:-translate-y-0.5",
  dark: "bg-ink-900 text-sand-50 shadow-sm hover:bg-ink-800 hover:shadow-lg hover:-translate-y-0.5",
  outline:
    "bg-transparent text-ink-800 ring-1 ring-inset ring-sand-300 hover:bg-white hover:ring-ink-900/20 hover:shadow-sm",
  ghost: "bg-transparent text-ink-700 hover:bg-sand-100 hover:text-ink-900",
  "on-ink":
    "bg-white/10 text-white ring-1 ring-inset ring-white/25 backdrop-blur-sm hover:bg-white/20 hover:ring-white/40",
  danger:
    "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200 hover:bg-rose-100 hover:ring-rose-300",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-small",
  md: "h-11 px-6 text-sm",
  lg: "h-14 px-8 text-base",
  icon: "h-10 w-10 p-0",
};

export function buttonClass({
  variant = "primary",
  size = "md",
  full = false,
}: ButtonStyleOptions = {}) {
  return cn(base, variants[variant], sizes[size], full && "w-full");
}

/* -------------------------------------------------------------------------- */

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    ButtonStyleOptions {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, full, type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(buttonClass({ variant, size, full }), className)}
      {...props}
    />
  )
);
Button.displayName = "Button";

/* -------------------------------------------------------------------------- */

export interface ButtonLinkProps
  extends React.ComponentPropsWithoutRef<typeof Link>,
    ButtonStyleOptions {}

export function ButtonLink({
  className,
  variant,
  size,
  full,
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      className={cn(buttonClass({ variant, size, full }), className)}
      {...props}
    />
  );
}

/* -------------------------------------------------------------------------- */

/**
 * Text link that reads as an action: gold underline that grows on hover.
 * Used wherever a full button would be too heavy.
 */
export function TextLink({
  className,
  tone = "ink",
  ...props
}: React.ComponentPropsWithoutRef<typeof Link> & { tone?: "ink" | "light" }) {
  return (
    <Link
      className={cn(
        "group/link inline-flex items-center gap-2 font-semibold transition-colors",
        tone === "light"
          ? "text-sand-50 hover:text-gold-300"
          : "text-ink-900 hover:text-brand-700",
        className
      )}
      {...props}
    />
  );
}
