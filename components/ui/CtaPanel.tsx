import * as React from "react";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Panel } from "./Section";
import { ButtonLink } from "./Button";
import { Photo } from "./Photo";
import { Reveal } from "./Reveal";

export interface CtaAction {
  label: string;
  href: string;
}

export interface CtaPanelProps {
  title: React.ReactNode;
  body?: string;
  primary: CtaAction;
  secondary?: CtaAction;
  /** Photograph shown on the trailing half of the panel. */
  image?: { src: string; alt: string };
  className?: string;
}

/**
 * Closing call to action. One per page, always the last block before the
 * footer, so the whole site ends on the same note.
 */
export function CtaPanel({
  title,
  body,
  primary,
  secondary,
  image,
  className,
}: CtaPanelProps) {
  return (
    <Reveal>
      <Panel
        textured
        className={cn(
          "grid items-center gap-10 p-8 md:p-14 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16",
          className
        )}
      >
        <div>
          <h2 className="font-display text-display font-extrabold text-balance text-sand-50">
            {title}
          </h2>

          {body && (
            <p className="mt-6 max-w-xl text-lead text-pretty text-sand-200/80">
              {body}
            </p>
          )}

          <div className="mt-9 flex flex-wrap items-center gap-4">
            <ButtonLink href={primary.href} variant="gold" size="lg">
              {primary.label}
              <ArrowLeft
                size={19}
                className="transition-transform duration-300 group-hover/btn:-translate-x-1"
              />
            </ButtonLink>
            {secondary && (
              <ButtonLink href={secondary.href} variant="on-ink" size="lg">
                {secondary.label}
              </ButtonLink>
            )}
          </div>
        </div>

        {image && (
          <Photo
            src={image.src}
            alt={image.alt}
            ratio="4/3"
            shape="rounded"
            sizes="(max-width: 1024px) 100vw, 40vw"
            className="shadow-xl ring-1 ring-white/10"
          />
        )}
      </Panel>
    </Reveal>
  );
}
