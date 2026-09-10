import * as React from "react";
import { cn } from "@/lib/utils";
import { Container, Panel } from "./Section";
import { Photo } from "./Photo";

export interface PageHeroProps {
  title: React.ReactNode;
  lead?: React.ReactNode;
  /** Small line under the copy — dates, counts, last-updated notices. */
  meta?: React.ReactNode;
  actions?: React.ReactNode;
  image?: { src: string; alt: string };
  width?: "default" | "wide";
  className?: string;
}

/**
 * Interior-page header: an ink panel that floats on the sand background,
 * matching the home hero without competing with it.
 */
export function PageHero({
  title,
  lead,
  meta,
  actions,
  image,
  width = "default",
  className,
}: PageHeroProps) {
  return (
    <Container width={width} className="pt-4">
      <Panel
        textured
        className={cn(
          "grid animate-rise items-center gap-10 p-8 py-14 md:p-14 md:py-20",
          image && "lg:grid-cols-[1.1fr_0.9fr] lg:gap-14",
          className
        )}
      >
        <div className={cn(!image && "max-w-3xl")}>
          <h1 className="font-display text-display font-extrabold text-balance text-sand-50">
            {title}
          </h1>

          {lead && (
            <p className="mt-6 max-w-2xl text-lead text-pretty text-sand-200/80">
              {lead}
            </p>
          )}

          {actions && (
            <div className="mt-9 flex flex-wrap items-center gap-4">
              {actions}
            </div>
          )}

          {meta && (
            <div className="mt-8 text-small text-sand-300/60">{meta}</div>
          )}
        </div>

        {image && (
          <Photo
            src={image.src}
            alt={image.alt}
            ratio="4/3"
            shape="rounded"
            sizes="(max-width: 1024px) 100vw, 44vw"
            className="shadow-xl ring-1 ring-white/10"
          />
        )}
      </Panel>
    </Container>
  );
}
