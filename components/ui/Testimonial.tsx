import * as React from "react";
import Image from "next/image";
import { Quote } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "./Badge";

export interface TestimonialProps {
  quote: string;
  name: string;
  role: string;
  avatar: string;
  tag?: string;
  tone?: "white" | "ink" | "gold";
  className?: string;
}

export function Testimonial({
  quote,
  name,
  role,
  avatar,
  tag,
  tone = "white",
  className,
}: TestimonialProps) {
  const light = tone === "ink";

  return (
    <figure
      className={cn(
        "flex h-full flex-col rounded-2xl p-6 md:p-8",
        {
          "bg-white shadow-sm ring-1 ring-sand-200/80": tone === "white",
          "bg-ink-900 text-sand-50 ring-1 ring-white/10": tone === "ink",
          "bg-gold-100 text-ink-900 ring-1 ring-gold-200": tone === "gold",
        },
        className
      )}
    >
      <Quote
        size={30}
        strokeWidth={1.5}
        className={cn(
          "-scale-x-100",
          light ? "text-gold-300/70" : "text-brand-300"
        )}
      />

      {tag && (
        <Badge variant={light ? "ink" : "brand"} className="mt-5 w-fit">
          {tag}
        </Badge>
      )}

      <blockquote
        className={cn(
          "mt-5 grow text-pretty leading-relaxed",
          light ? "text-sand-100/90" : "text-ink-800"
        )}
      >
        {quote}
      </blockquote>

      <figcaption
        className={cn(
          "mt-7 flex items-center gap-3.5 border-t pt-6",
          light ? "border-white/15" : "border-sand-200"
        )}
      >
        <Image
          src={avatar}
          alt=""
          width={48}
          height={48}
          className="h-12 w-12 shrink-0 rounded-full object-cover ring-2 ring-white/60"
        />
        <div className="min-w-0">
          <p
            className={cn(
              "truncate font-semibold",
              light ? "text-sand-50" : "text-ink-900"
            )}
          >
            {name}
          </p>
          <p
            className={cn(
              "truncate text-small",
              light ? "text-sand-300/70" : "text-ink-700/70"
            )}
          >
            {role}
          </p>
        </div>
      </figcaption>
    </figure>
  );
}
