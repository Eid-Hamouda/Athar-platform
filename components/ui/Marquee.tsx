import * as React from "react";
import { cn } from "@/lib/utils";

export interface MarqueeProps {
  children: React.ReactNode;
  speed?: "normal" | "slow";
  /** Fade the leading and trailing edges into the background. */
  fade?: boolean;
  className?: string;
  trackClassName?: string;
}

/**
 * Continuous horizontal ticker. The track is rendered twice and shifted by
 * exactly -50%, which loops seamlessly.
 *
 * `dir="ltr"` is deliberate: under `rtl` the oversized track is laid out from
 * the right edge and overflows leftward, so shifting it -50% scrolls the
 * content clean out of view and leaves a blank gap instead of looping. Forcing
 * LTR makes the overflow direction predictable. Only the order of the repeated
 * chips changes, and each chip's own Arabic text still shapes right-to-left.
 */
export function Marquee({
  children,
  speed = "normal",
  fade = true,
  className,
  trackClassName,
}: MarqueeProps) {
  return (
    <div
      dir="ltr"
      className={cn(
        "group/marquee relative flex overflow-hidden",
        fade && "fade-x",
        className
      )}
    >
      <div
        className={cn(
          "flex w-max shrink-0 items-center group-hover/marquee:[animation-play-state:paused]",
          speed === "slow" ? "animate-marquee-slow" : "animate-marquee",
          trackClassName
        )}
      >
        <div className="flex shrink-0 items-center">{children}</div>
        <div aria-hidden className="flex shrink-0 items-center">
          {children}
        </div>
      </div>
    </div>
  );
}
