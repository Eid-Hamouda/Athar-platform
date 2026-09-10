"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AccordionItem {
  question: string;
  answer: string;
}

export interface AccordionProps {
  items: AccordionItem[];
  defaultOpenIndex?: number | null;
  className?: string;
}

/**
 * Each row is its own rounded card that tints and lifts when open, rather than
 * hairline dividers on a flat list.
 */
export function Accordion({
  items,
  defaultOpenIndex = 0,
  className,
}: AccordionProps) {
  const [openIndex, setOpenIndex] = React.useState<number | null>(
    defaultOpenIndex
  );

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {items.map((item, index) => {
        const isOpen = openIndex === index;

        return (
          <div
            key={item.question}
            className={cn(
              "overflow-hidden rounded-2xl transition-all duration-300",
              isOpen
                ? "bg-white shadow-md ring-1 ring-sand-200"
                : "bg-sand-100/70 ring-1 ring-sand-200/70 hover:bg-white hover:shadow-sm"
            )}
          >
            <h3>
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : index)}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between gap-5 px-5 py-5 text-start md:px-7"
              >
                <span
                  className={cn(
                    "font-display text-h4 font-bold transition-colors md:text-h3",
                    isOpen ? "text-brand-700" : "text-ink-900"
                  )}
                >
                  {item.question}
                </span>
                <span
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all duration-300",
                    isOpen
                      ? "rotate-45 bg-brand-600 text-white"
                      : "bg-white text-ink-700 ring-1 ring-sand-200"
                  )}
                >
                  <Plus size={18} />
                </span>
              </button>
            </h3>

            <div
              className={cn(
                "grid transition-[grid-template-rows,opacity] duration-300 ease-out",
                isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              )}
            >
              <div className="overflow-hidden">
                <p className="px-5 pb-6 text-pretty leading-relaxed text-ink-700/85 md:px-7">
                  {item.answer}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
