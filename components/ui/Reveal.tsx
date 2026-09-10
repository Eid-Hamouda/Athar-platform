"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface RevealProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Stagger in milliseconds, applied as a CSS transition delay. */
  delay?: number;
  /** How much of the element must be visible before it animates in. */
  amount?: number;
}

/**
 * Fades and lifts its children into place the first time they scroll into
 * view. Falls back to visible content when IntersectionObserver is missing,
 * and the `prefers-reduced-motion` rule in globals.css disables the movement.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  amount = 0.15,
  style,
  ...props
}: RevealProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [shown, setShown] = React.useState(false);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Without IntersectionObserver, show the content immediately. Done on the
    // node rather than through state so no render is queued from the effect.
    if (typeof IntersectionObserver === "undefined") {
      el.classList.add("is-in");
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setShown(true);
            observer.disconnect();
          }
        }
      },
      { threshold: amount, rootMargin: "0px 0px -8% 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [amount]);

  return (
    <div
      ref={ref}
      className={cn("reveal", shown && "is-in", className)}
      style={{ ...style, ["--reveal-delay" as string]: `${delay}ms` }}
      {...props}
    >
      {children}
    </div>
  );
}
