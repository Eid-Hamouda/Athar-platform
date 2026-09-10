"use client";

import * as React from "react";
import { ImagePlus, Sparkles, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FileDropProps {
  file: File | null;
  onFile: (file: File | null) => void;
  label?: string;
  hint?: string;
  /** Shows the AI-analysis state that the vision service triggers. */
  busy?: boolean;
  busyLabel?: string;
  accept?: string;
  required?: boolean;
  className?: string;
}

/**
 * Image picker with a live thumbnail. Drag-and-drop is handled natively by the
 * overlaid file input; the dashed frame is purely the affordance for it.
 */
export function FileDrop({
  file,
  onFile,
  label = "صورة العنصر",
  hint = "PNG أو JPG أو WEBP — حتى ٥ ميغابايت",
  busy = false,
  busyLabel = "الذكاء الاصطناعي يقرأ الصورة…",
  accept = "image/*",
  required = false,
  className,
}: FileDropProps) {
  // Derive the blob URL during render, and revoke it once it is replaced.
  const preview = React.useMemo(
    () => (file ? URL.createObjectURL(file) : null),
    [file]
  );

  React.useEffect(() => {
    if (!preview) return;
    return () => URL.revokeObjectURL(preview);
  }, [preview]);

  return (
    <div className={className}>
      <p className="mb-2 flex items-center gap-1.5 text-small font-semibold text-ink-800">
        {label}
        {required && <span className="text-brand-600">*</span>}
      </p>

      <div
        className={cn(
          "group relative flex items-center gap-4 rounded-2xl border border-dashed p-4 transition-colors",
          busy
            ? "border-gold-300 bg-gold-50"
            : file
              ? "border-brand-300 bg-brand-50/50"
              : "border-sand-300 bg-sand-100/70 hover:border-brand-400 hover:bg-brand-50/40"
        )}
      >
        <input
          type="file"
          accept={accept}
          required={required && !file}
          onChange={(e) => onFile(e.target.files?.[0] ?? null)}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          aria-label={label}
        />

        <span
          className={cn(
            "relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl",
            preview ? "bg-sand-200" : "bg-white ring-1 ring-sand-200"
          )}
        >
          {preview ? (
            // Local blob preview — next/image cannot optimise object URLs.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <ImagePlus size={22} className="text-brand-600" strokeWidth={1.75} />
          )}
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink-900">
            {file ? file.name : "اضغط لاختيار صورة أو اسحبها إلى هنا"}
          </p>
          {busy ? (
            <p className="mt-1 flex items-center gap-1.5 text-small font-semibold text-gold-800">
              <Sparkles size={13} className="animate-pulse" />
              {busyLabel}
            </p>
          ) : (
            <p className="mt-1 truncate text-small text-ink-700/70">{hint}</p>
          )}
        </div>

        {file && !busy && (
          <RefreshCw
            size={16}
            className="shrink-0 text-ink-700/60 transition-transform duration-500 group-hover:rotate-90"
          />
        )}
      </div>
    </div>
  );
}
