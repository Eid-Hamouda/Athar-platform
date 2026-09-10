import * as React from "react";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/* Container — one measure for the whole product.                             */
/* -------------------------------------------------------------------------- */

export type ContainerWidth = "narrow" | "text" | "default" | "wide";

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: ContainerWidth;
}

const widths: Record<ContainerWidth, string> = {
  narrow: "max-w-3xl",
  text: "max-w-4xl",
  default: "max-w-6xl",
  wide: "max-w-7xl",
};

export function Container({
  className,
  width = "default",
  ...props
}: ContainerProps) {
  return (
    <div
      className={cn("mx-auto w-full px-5 sm:px-8", widths[width], className)}
      {...props}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* Section — vertical rhythm.                                                 */
/* -------------------------------------------------------------------------- */

export interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  space?: "sm" | "md" | "lg";
  /**
   * Which edges get the spacing. Stacked sections use `bottom` so they don't
   * double up — passing `pt-0` via className cannot work, since the responsive
   * `md:py-*` here would win back the top padding at desktop widths.
   */
  pad?: "both" | "top" | "bottom" | "none";
}

const spacing = {
  sm: { both: "py-12 md:py-16", top: "pt-12 md:pt-16", bottom: "pb-12 md:pb-16" },
  md: { both: "py-16 md:py-24", top: "pt-16 md:pt-24", bottom: "pb-16 md:pb-24" },
  lg: { both: "py-24 md:py-36", top: "pt-24 md:pt-36", bottom: "pb-24 md:pb-36" },
} as const;

export function Section({
  className,
  space = "md",
  pad = "both",
  ...props
}: SectionProps) {
  return (
    <section
      className={cn(pad !== "none" && spacing[space][pad], className)}
      {...props}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* Panel — the signature surface: a large rounded block that floats on sand.  */
/* -------------------------------------------------------------------------- */

export interface PanelProps extends React.HTMLAttributes<HTMLDivElement> {
  tone?: "ink" | "sand" | "white" | "brand" | "gold";
  /** Adds the film-grain + radial glow treatment used on dark panels. */
  textured?: boolean;
}

export function Panel({
  className,
  tone = "ink",
  textured = false,
  children,
  ...props
}: PanelProps) {
  return (
    <div
      className={cn(
        "relative isolate overflow-hidden rounded-2xl md:rounded-3xl",
        {
          "bg-ink-900 text-sand-50": tone === "ink",
          "bg-sand-100 text-ink-800": tone === "sand",
          "bg-white text-ink-800 shadow-md ring-1 ring-sand-200/70":
            tone === "white",
          "bg-brand-700 text-white": tone === "brand",
          "bg-gold-300 text-ink-900": tone === "gold",
        },
        className
      )}
      {...props}
    >
      {textured && (
        <>
          <span
            aria-hidden
            className="grain-layer pointer-events-none absolute inset-0 -z-10"
          />
          <span
            aria-hidden
            className="glow-brand animate-sheen pointer-events-none absolute -top-1/3 start-1/4 -z-10 h-[46rem] w-[46rem] -translate-x-1/2"
          />
        </>
      )}
      {children}
    </div>
  );
}
