import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/* Shared field chrome                                                        */
/* -------------------------------------------------------------------------- */

/**
 * `default` suits marketing forms and modals; `compact` is for controls that
 * sit inline in dense dashboard rows and toolbars.
 */
export type FieldDensity = "default" | "compact";

const fieldBase =
  "w-full bg-sand-50 text-ink-900 ring-1 ring-inset ring-sand-200 outline-none transition-all duration-200 placeholder:text-sand-500 hover:ring-sand-300 focus:bg-white focus:ring-2 focus:ring-brand-500 disabled:cursor-not-allowed disabled:bg-sand-100 disabled:text-ink-700/50";

const densities: Record<FieldDensity, string> = {
  default: "rounded-xl px-4 py-3.5 text-sm",
  compact: "rounded-lg px-3 py-2 text-sm",
};

const leadingPad: Record<FieldDensity, string> = {
  default: "ps-11",
  compact: "ps-9",
};

const trailingPad: Record<FieldDensity, string> = {
  default: "pe-11",
  compact: "pe-9",
};

const affixPos: Record<FieldDensity, { start: string; end: string }> = {
  default: { start: "start-4", end: "end-3.5" },
  compact: { start: "start-3", end: "end-2.5" },
};

function fieldClass(density: FieldDensity) {
  return cn(fieldBase, densities[density]);
}

/* -------------------------------------------------------------------------- */
/* Field — label / hint / error wrapper                                       */
/* -------------------------------------------------------------------------- */

export interface FieldProps {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: string;
  /** Marks the label with a required asterisk. */
  required?: boolean;
  htmlFor?: string;
  density?: FieldDensity;
  children: React.ReactNode;
  className?: string;
}

export function Field({
  label,
  hint,
  error,
  required,
  htmlFor,
  density = "default",
  children,
  className,
}: FieldProps) {
  const compact = density === "compact";

  return (
    <div className={cn("min-w-0", className)}>
      {label && (
        <label
          htmlFor={htmlFor}
          className={cn(
            "flex items-center gap-1.5 font-semibold text-ink-800",
            compact ? "mb-1.5 text-xs" : "mb-2 text-small"
          )}
        >
          {label}
          {required && <span className="text-brand-600">*</span>}
        </label>
      )}
      {hint && (
        <p className={cn("text-ink-700/65", compact ? "mb-1.5 text-xs" : "mb-2 text-small")}>
          {hint}
        </p>
      )}
      {children}
      {error && (
        <p className="mt-2 text-small font-medium text-rose-600">{error}</p>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Input                                                                      */
/* -------------------------------------------------------------------------- */

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: string;
  /** Icon rendered inside the leading edge of the field. */
  icon?: React.ReactNode;
  /** Interactive element pinned to the trailing edge, e.g. a reveal toggle. */
  trailing?: React.ReactNode;
  density?: FieldDensity;
  wrapperClassName?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      hint,
      error,
      icon,
      trailing,
      id,
      dir,
      density = "default",
      wrapperClassName,
      ...props
    },
    ref
  ) => {
    const control = (
      // The affixes are positioned with logical `start`/`end` utilities, so the
      // wrapper must share the input's direction — otherwise an LTR field on an
      // RTL page pins the icon opposite the padding and the text runs under it.
      <div className="relative" dir={dir}>
        {icon && (
          <span
            className={cn(
              "pointer-events-none absolute inset-y-0 flex items-center text-sand-500",
              affixPos[density].start
            )}
          >
            {icon}
          </span>
        )}
        <input
          ref={ref}
          id={id}
          dir={dir}
          className={cn(
            fieldClass(density),
            icon && leadingPad[density],
            trailing && trailingPad[density],
            error && "ring-rose-300",
            className
          )}
          {...props}
        />
        {trailing && (
          <span
            className={cn(
              "absolute inset-y-0 flex items-center",
              affixPos[density].end
            )}
          >
            {trailing}
          </span>
        )}
      </div>
    );

    if (!label && !hint && !error) return control;

    return (
      <Field
        label={label}
        hint={hint}
        error={error}
        htmlFor={id}
        required={props.required}
        density={density}
        className={wrapperClassName}
      >
        {control}
      </Field>
    );
  }
);
Input.displayName = "Input";

/* -------------------------------------------------------------------------- */
/* Select                                                                     */
/* -------------------------------------------------------------------------- */

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: string;
  density?: FieldDensity;
  wrapperClassName?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      label,
      hint,
      error,
      id,
      children,
      density = "default",
      wrapperClassName,
      ...props
    },
    ref
  ) => {
    const control = (
      <div className="relative">
        <select
          ref={ref}
          id={id}
          className={cn(
            fieldClass(density),
            "cursor-pointer appearance-none",
            trailingPad[density],
            error && "ring-rose-300",
            className
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          size={density === "compact" ? 15 : 17}
          className={cn(
            "pointer-events-none absolute inset-y-0 my-auto text-sand-500",
            affixPos[density].end
          )}
        />
      </div>
    );

    if (!label && !hint && !error) return control;

    return (
      <Field
        label={label}
        hint={hint}
        error={error}
        htmlFor={id}
        required={props.required}
        density={density}
        className={wrapperClassName}
      >
        {control}
      </Field>
    );
  }
);
Select.displayName = "Select";

/* -------------------------------------------------------------------------- */
/* Textarea                                                                   */
/* -------------------------------------------------------------------------- */

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: string;
  density?: FieldDensity;
  wrapperClassName?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      label,
      hint,
      error,
      id,
      density = "default",
      wrapperClassName,
      ...props
    },
    ref
  ) => {
    const control = (
      <textarea
        ref={ref}
        id={id}
        className={cn(
          fieldClass(density),
          "resize-y leading-relaxed",
          error && "ring-rose-300",
          className
        )}
        {...props}
      />
    );

    if (!label && !hint && !error) return control;

    return (
      <Field
        label={label}
        hint={hint}
        error={error}
        htmlFor={id}
        required={props.required}
        density={density}
        className={wrapperClassName}
      >
        {control}
      </Field>
    );
  }
);
Textarea.displayName = "Textarea";
