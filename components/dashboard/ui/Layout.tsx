import * as React from "react";
import { cn } from "@/lib/utils";

/* ==========================================================================
   Application-layer surfaces.

   Deliberately quieter than the marketing kit in components/ui: smaller radii,
   hairline rings instead of shadows, tighter padding, no display type and no
   decorative colour. Colour in here carries meaning (status, attention) only.
   ========================================================================== */

/* -------------------------------------------------------------------------- */
/* PageHeader                                                                 */
/* -------------------------------------------------------------------------- */

export interface PageHeaderProps {
  title: string;
  description?: string;
  /** Trailing slot for primary/secondary actions. */
  actions?: React.ReactNode;
  /** Rendered under the title — filter tabs, counts, etc. */
  children?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  actions,
  children,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("mb-6", className)}>
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-ink-900">{title}</h2>
          {description && (
            <p className="mt-1 max-w-2xl text-sm text-ink-700/75">
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {actions}
          </div>
        )}
      </div>
      {children && <div className="mt-5">{children}</div>}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Surface — the standard content container                                   */
/* -------------------------------------------------------------------------- */

// `title` is omitted from the native attributes for the same reason `align`
// is on the table cells: the HTML attribute is typed `string`, so reusing the
// name without omitting it collapses this to `string | undefined`.
export interface SurfaceProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  /** Panel title row. */
  title?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  /** Removes body padding — required when the body is a table. */
  flush?: boolean;
  footer?: React.ReactNode;
  tone?: "default" | "muted";
}

export function Surface({
  title,
  description,
  actions,
  flush = false,
  footer,
  tone = "default",
  className,
  children,
  ...props
}: SurfaceProps) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-xl ring-1 ring-sand-200",
        tone === "muted" ? "bg-sand-100/60" : "bg-white",
        className
      )}
      {...props}
    >
      {(title || actions) && (
        <header className="flex flex-wrap items-center justify-between gap-x-5 gap-y-3 border-b border-sand-200 px-5 py-4">
          <div className="min-w-0">
            {title && (
              <h3 className="text-sm font-bold text-ink-900">{title}</h3>
            )}
            {description && (
              <p className="mt-0.5 text-xs text-ink-700/70">{description}</p>
            )}
          </div>
          {actions && (
            <div className="flex shrink-0 items-center gap-2">{actions}</div>
          )}
        </header>
      )}

      <div className={flush ? undefined : "p-5"}>{children}</div>

      {footer && (
        <footer className="border-t border-sand-200 bg-sand-50/70 px-5 py-3.5">
          {footer}
        </footer>
      )}
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Toolbar — search + filters + actions above a table or grid                 */
/* -------------------------------------------------------------------------- */

export function Toolbar({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 border-b border-sand-200 bg-sand-50/70 px-4 py-3",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Small labelled key/value pairs — used inside detail disclosures            */
/* -------------------------------------------------------------------------- */

export function DetailItem({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <dt className="text-xs font-semibold text-ink-700/60">{label}</dt>
      <dd className="mt-1.5 text-sm text-ink-800">{children}</dd>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Inline action chip — call / WhatsApp / maps links inside dense rows        */
/* -------------------------------------------------------------------------- */

export function ActionChip({
  tone = "default",
  className,
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  tone?: "default" | "dark" | "whatsapp";
}) {
  return (
    <a
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors",
        {
          "bg-white text-ink-800 ring-1 ring-sand-300 hover:bg-sand-100":
            tone === "default",
          "bg-ink-900 text-sand-50 hover:bg-ink-800": tone === "dark",
          "bg-[#25D366] text-white hover:bg-[#128C7E]": tone === "whatsapp",
        },
        className
      )}
      {...props}
    />
  );
}
