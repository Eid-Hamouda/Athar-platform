import * as React from "react";
import { MapPin, Tag, Sparkle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Photo } from "./Photo";
import { Badge } from "./Badge";

export interface ItemCardProps {
  title: string;
  description?: string;
  category?: string;
  subCategory?: string;
  condition?: string;
  location?: string;
  imageUrl?: string | null;
  /** Ribbon shown over the photo — availability, urgency, etc. */
  status?: React.ReactNode;
  /** Extra chips rendered under the title. */
  meta?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

/**
 * The catalogue unit. Photography leads; the chips carry the structured data
 * the AI classifier produces.
 */
export function ItemCard({
  title,
  description,
  category,
  subCategory,
  condition,
  location,
  imageUrl,
  status,
  meta,
  footer,
  className,
}: ItemCardProps) {
  return (
    <article
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-sand-200/80 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:ring-sand-300",
        className
      )}
    >
      <div className="relative">
        <Photo
          src={imageUrl || "/placeholder-item.svg"}
          alt={title}
          ratio="4/3"
          shape="soft"
          zoom
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="rounded-none"
        />

        {status && <div className="absolute top-3 end-3 z-10">{status}</div>}

        {category && (
          <div className="absolute bottom-3 start-3 z-10">
            <span className="glass inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-micro font-bold text-ink-900 shadow-sm">
              <Tag size={12} className="text-brand-600" />
              {category}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-h4 font-bold text-ink-900">{title}</h3>

        {(subCategory || condition || meta) && (
          <div className="mt-3 flex flex-wrap gap-2">
            {subCategory && <Badge variant="neutral">{subCategory}</Badge>}
            {condition && (
              <Badge variant="gold">
                <Sparkle size={11} />
                {condition}
              </Badge>
            )}
            {meta}
          </div>
        )}

        {description && (
          <p className="mt-4 line-clamp-2 text-small leading-relaxed text-ink-700/80">
            {description}
          </p>
        )}

        <div className="mt-auto pt-5">
          {location && (
            <p className="mb-4 flex items-center gap-2 text-small text-ink-700/75">
              <MapPin size={14} className="shrink-0 text-sand-500" />
              <span className="truncate">{location}</span>
            </p>
          )}
          {footer}
        </div>
      </div>
    </article>
  );
}
