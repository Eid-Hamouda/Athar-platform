import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export type PhotoRatio =
  | "square"
  | "4/3"
  | "3/2"
  | "16/9"
  | "2/1"
  | "4/5"
  | "3/4"
  | "9/16"
  | "fill";

export type PhotoShape = "rounded" | "soft" | "arch" | "arch-sm" | "circle";

export interface PhotoProps {
  src: string;
  alt: string;
  ratio?: PhotoRatio;
  shape?: PhotoShape;
  /** Dark gradient from the bottom, so overlaid text stays readable. */
  overlay?: false | "soft" | "strong" | "full";
  /** Slow zoom when a parent with `group` is hovered. */
  zoom?: boolean;
  sizes?: string;
  /** Loads the image in the document head — hero images only. */
  preload?: boolean;
  className?: string;
  imgClassName?: string;
  children?: React.ReactNode;
}

const ratios: Record<PhotoRatio, string> = {
  square: "aspect-square",
  "4/3": "aspect-[4/3]",
  "3/2": "aspect-[3/2]",
  "16/9": "aspect-[16/9]",
  "2/1": "aspect-[2/1]",
  "4/5": "aspect-[4/5]",
  "3/4": "aspect-[3/4]",
  "9/16": "aspect-[9/16]",
  fill: "h-full",
};

const shapes: Record<PhotoShape, string> = {
  rounded: "rounded-2xl",
  soft: "rounded-xl",
  arch: "arch",
  "arch-sm": "arch-sm",
  circle: "rounded-full",
};

const overlays = {
  soft: "bg-gradient-to-t from-ink-950/55 via-ink-950/5 to-transparent",
  strong: "bg-gradient-to-t from-ink-950/85 via-ink-950/35 to-ink-950/5",
  full: "bg-ink-950/55",
} as const;

/**
 * Every photograph in the product goes through here, so cropping, radius and
 * overlay treatment stay consistent.
 */
export function Photo({
  src,
  alt,
  ratio = "4/3",
  shape = "rounded",
  overlay = false,
  zoom = false,
  sizes = "(max-width: 768px) 100vw, 50vw",
  preload = false,
  className,
  imgClassName,
  children,
}: PhotoProps) {
  return (
    <div
      className={cn(
        "relative isolate overflow-hidden bg-sand-200",
        ratios[ratio],
        shapes[shape],
        className
      )}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        preload={preload || undefined}
        className={cn(
          "object-cover",
          zoom &&
            "transition-transform duration-[900ms] ease-out group-hover:scale-[1.06]",
          imgClassName
        )}
      />

      {overlay && (
        <span
          aria-hidden
          className={cn("absolute inset-0", overlays[overlay])}
        />
      )}

      {children}
    </div>
  );
}
