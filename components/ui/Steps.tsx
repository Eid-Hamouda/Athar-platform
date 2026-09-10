import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Reveal } from "./Reveal";
import { Photo } from "./Photo";

export interface StepItem {
  title: string;
  body: string;
  icon: LucideIcon;
  image?: string;
  imageAlt?: string;
}

export interface StepsProps {
  items: StepItem[];
  tone?: "ink" | "light";
  className?: string;
}

/**
 * The process, as a connected track of numbered cards. The connector line is
 * drawn behind the row on large screens and disappears when the cards stack.
 */
export function Steps({ items, tone = "ink", className }: StepsProps) {
  const light = tone === "light";

  return (
    <div className={cn("relative", className)}>
      {/* Connector — sits behind the number badges. */}
      <span
        aria-hidden
        className={cn(
          "absolute inset-x-0 top-7 hidden h-px lg:block",
          light
            ? "bg-gradient-to-l from-transparent via-white/25 to-transparent"
            : "bg-gradient-to-l from-transparent via-sand-300 to-transparent"
        )}
      />

      <ol className="relative grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
        {items.map((step, i) => (
          <li key={step.title} className="list-none">
            <Reveal delay={i * 110}>
              <div className="flex items-center gap-4">
                <span
                  className={cn(
                    "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl font-display text-lg font-extrabold tabular-nums shadow-sm",
                    light
                      ? "bg-gold-300 text-ink-900"
                      : "bg-ink-900 text-gold-300"
                  )}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <step.icon
                  size={22}
                  className={light ? "text-gold-300/70" : "text-brand-600"}
                  strokeWidth={1.75}
                />
              </div>

              {step.image && (
                <Photo
                  src={step.image}
                  alt={step.imageAlt ?? ""}
                  ratio="3/2"
                  shape="soft"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="mt-6"
                />
              )}

              <h3
                className={cn(
                  "mt-6 font-display text-h3 font-bold",
                  light ? "text-sand-50" : "text-ink-900"
                )}
              >
                {step.title}
              </h3>
              <p
                className={cn(
                  "mt-3 text-pretty",
                  light ? "text-sand-200/75" : "text-ink-700/85"
                )}
              >
                {step.body}
              </p>
            </Reveal>
          </li>
        ))}
      </ol>
    </div>
  );
}
