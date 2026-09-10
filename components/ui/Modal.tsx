"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  /** Leading visual in the header, usually an IconTile. */
  icon?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  children: React.ReactNode;
  className?: string;
}

const sizes = {
  sm: "max-w-md",
  md: "max-w-xl",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
} as const;

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  icon,
  size = "md",
  children,
  className,
}: ModalProps) {
  // Escape to dismiss, and freeze the page behind the sheet.
  React.useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[1000] flex animate-fade items-end justify-center bg-ink-950/60 p-0 backdrop-blur-md sm:items-center sm:p-6"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "flex max-h-[92dvh] w-full animate-pop flex-col overflow-hidden rounded-t-3xl bg-sand-50 shadow-xl ring-1 ring-white/20 sm:rounded-3xl",
          sizes[size],
          className
        )}
      >
        {(title || description) && (
          <header className="flex items-start gap-4 border-b border-sand-200 bg-white/70 px-6 py-5 backdrop-blur-sm">
            {icon}
            <div className="min-w-0 flex-1">
              {title && (
                <h2 className="font-display text-h3 font-bold text-ink-900">
                  {title}
                </h2>
              )}
              {description && (
                <p className="mt-1 text-small text-ink-700/75">{description}</p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="إغلاق"
              className="-me-1 -mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-700/60 transition-colors hover:bg-sand-200 hover:text-ink-900"
            >
              <X size={19} />
            </button>
          </header>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">{children}</div>
      </div>
    </div>
  );
}
