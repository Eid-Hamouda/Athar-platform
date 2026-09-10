import * as React from "react";
import { cn } from "@/lib/utils";
import { Reveal } from "./Reveal";

export interface SectionHeadingProps {
  title: React.ReactNode;
  lead?: React.ReactNode;
  /** Right-hand slot for a link or button, aligned to the baseline. */
  action?: React.ReactNode;
  tone?: "ink" | "light";
  align?: "start" | "center";
  size?: "md" | "lg";
  className?: string;
}

export function SectionHeading({
  title,
  lead,
  action,
  tone = "ink",
  align = "start",
  size = "md",
  className,
}: SectionHeadingProps) {
  const light = tone === "light";

  return (
    <Reveal
      className={cn(
        "flex flex-col gap-6 md:flex-row md:items-end md:justify-between",
        align === "center" && "md:flex-col md:items-center",
        className
      )}
    >
      <div className={cn("max-w-2xl", align === "center" && "text-center")}>
        <h2
          className={cn(
            "font-display font-extrabold text-balance",
            size === "lg" ? "text-display" : "text-h1",
            light ? "text-sand-50" : "text-ink-900"
          )}
        >
          {title}
        </h2>

        {lead && (
          <p
            className={cn(
              "mt-5 text-lead text-pretty",
              light ? "text-sand-200/80" : "text-ink-700/85"
            )}
          >
            {lead}
          </p>
        )}
      </div>

      {action && <div className="shrink-0">{action}</div>}
    </Reveal>
  );
}
