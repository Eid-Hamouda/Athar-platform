import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/* ==========================================================================
   Table primitives.

   Tabular data gets a real table — headers, aligned columns, one row per
   record — instead of a stack of cards. Narrow viewports scroll the table
   horizontally rather than reflowing it, so columns stay comparable.
   ========================================================================== */

export function DataTable({
  minWidth = "44rem",
  className,
  children,
}: {
  /** Below this width the table scrolls instead of squashing. */
  minWidth?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("w-full overflow-x-auto", className)}>
      <table
        className="w-full border-collapse text-start"
        style={{ minWidth }}
      >
        {children}
      </table>
    </div>
  );
}

export function THead({ children }: { children: React.ReactNode }) {
  return (
    <thead className="border-b border-sand-200 bg-sand-50/80">{children}</thead>
  );
}

export function TBody({ children }: { children: React.ReactNode }) {
  return <tbody className="divide-y divide-sand-200">{children}</tbody>;
}

export function TR({
  className,
  interactive = false,
  ...props
}: React.HTMLAttributes<HTMLTableRowElement> & { interactive?: boolean }) {
  return (
    <tr
      className={cn(
        "transition-colors",
        interactive && "cursor-pointer hover:bg-sand-50",
        className
      )}
      {...props}
    />
  );
}

/**
 * `justify`, not `align` — the native `align` attribute on th/td is typed
 * "left" | "center" | "right" | ..., so reusing the name narrows it to
 * "center" and every other value becomes a type error.
 */
type CellJustify = "start" | "end" | "center";

const justifyClass: Record<CellJustify, string> = {
  start: "text-start",
  end: "text-end",
  center: "text-center",
};

export function TH({
  className,
  justify = "start",
  ...props
}: Omit<React.ThHTMLAttributes<HTMLTableCellElement>, "align"> & {
  justify?: CellJustify;
}) {
  return (
    <th
      scope="col"
      className={cn(
        "px-4 py-3 text-xs font-semibold whitespace-nowrap text-ink-700/70",
        justifyClass[justify],
        className
      )}
      {...props}
    />
  );
}

export function TD({
  className,
  justify = "start",
  ...props
}: Omit<React.TdHTMLAttributes<HTMLTableCellElement>, "align"> & {
  justify?: CellJustify;
}) {
  return (
    <td
      className={cn(
        "px-4 py-3.5 align-middle text-sm text-ink-800",
        justifyClass[justify],
        className
      )}
      {...props}
    />
  );
}

/** Full-width empty message that keeps the table's column structure intact. */
export function TableEmpty({
  colSpan,
  icon: Icon,
  title,
  body,
  action,
}: {
  colSpan: number;
  icon: LucideIcon;
  title: string;
  body?: string;
  action?: React.ReactNode;
}) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-16">
        <div className="flex flex-col items-center text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-sand-100 text-ink-700/60 ring-1 ring-sand-200">
            <Icon size={20} strokeWidth={1.75} />
          </span>
          <p className="mt-4 text-sm font-bold text-ink-900">{title}</p>
          {body && (
            <p className="mt-1.5 max-w-sm text-xs text-ink-700/70">{body}</p>
          )}
          {action && <div className="mt-5">{action}</div>}
        </div>
      </td>
    </tr>
  );
}

/* -------------------------------------------------------------------------- */
/* Cell helpers                                                               */
/* -------------------------------------------------------------------------- */

/** Thumbnail + primary/secondary text — the first column of most tables. */
export function CellStack({
  media,
  primary,
  secondary,
  className,
}: {
  media?: React.ReactNode;
  primary: React.ReactNode;
  secondary?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex min-w-0 items-center gap-3", className)}>
      {media}
      <div className="min-w-0">
        <p className="truncate font-semibold text-ink-900">{primary}</p>
        {secondary && (
          <p className="mt-0.5 truncate text-xs text-ink-700/70">{secondary}</p>
        )}
      </div>
    </div>
  );
}

/** Row-level icon buttons, aligned to the trailing edge. */
export function RowActions({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-end gap-1.5", className)}>
      {children}
    </div>
  );
}

export function IconButton({
  tone = "default",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: "default" | "danger";
}) {
  return (
    <button
      type="button"
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-colors",
        tone === "danger"
          ? "text-ink-700/60 hover:bg-rose-50 hover:text-rose-600"
          : "text-ink-700/60 hover:bg-sand-100 hover:text-ink-900",
        className
      )}
      {...props}
    />
  );
}
