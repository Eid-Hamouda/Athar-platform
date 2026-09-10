import * as React from "react";
import { cn } from "@/lib/utils";

export interface RailProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Bleeds the rail past the container edge so cards run off-screen. */
  bleed?: boolean;
}

/**
 * Snap-scrolling horizontal row. Used where a grid would either wrap awkwardly
 * or hide the fact that there is more to see.
 */
export function Rail({ className, bleed = true, children, ...props }: RailProps) {
  return (
    <div
      className={cn(
        "no-bar flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 md:gap-6",
        bleed && "-mx-5 px-5 sm:-mx-8 sm:px-8",
        className
      )}
      {...props}
    >
      {children}
      {/* Trailing spacer so the last card can snap clear of the edge. */}
      <span aria-hidden className="w-px shrink-0" />
    </div>
  );
}
