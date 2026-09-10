import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { Logo } from "./Logo";
import { Photo } from "./Photo";

export interface AuthShellProps {
  /** Headline shown on the photographic panel. */
  pitch: string;
  pitchBody: string;
  image: { src: string; alt: string };
  proof?: { quote: string; name: string; role: string; avatar: string };
  switchPrompt: string;
  switchHref: string;
  switchLabel: string;
  title: string;
  description: string;
  children: React.ReactNode;
}

/**
 * Sign-in and sign-up share this frame: a photographic ink panel that carries
 * the promise, next to a quiet form column.
 */
export function AuthShell({
  pitch,
  pitchBody,
  image,
  proof,
  switchPrompt,
  switchHref,
  switchLabel,
  title,
  description,
  children,
}: AuthShellProps) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      {/* ---------------- Photographic promise panel ---------------- */}
      <aside className="relative isolate hidden flex-col justify-between overflow-hidden bg-ink-900 p-12 lg:flex">
        <Photo
          src={image.src}
          alt={image.alt}
          ratio="fill"
          shape="rounded"
          overlay="strong"
          sizes="50vw"
          className="absolute inset-0 -z-10 rounded-none"
        />
        <span
          aria-hidden
          className="grain-layer pointer-events-none absolute inset-0 -z-10"
        />

        <Link href="/" className="w-fit">
          <Logo tone="light" />
        </Link>

        <div className="max-w-md">
          <h2 className="font-display text-h1 font-extrabold text-balance text-sand-50">
            {pitch}
          </h2>
          <p className="mt-5 text-pretty leading-relaxed text-sand-200/80">
            {pitchBody}
          </p>
        </div>

        {proof ? (
          <figure className="glass-dark max-w-md rounded-2xl p-6">
            <blockquote className="text-small leading-relaxed text-sand-100/90">
              {proof.quote}
            </blockquote>
            <figcaption className="mt-4 flex items-center gap-3">
              <Image
                src={proof.avatar}
                alt=""
                width={40}
                height={40}
                className="h-10 w-10 rounded-full object-cover ring-2 ring-white/25"
              />
              <div>
                <p className="text-small font-semibold text-sand-50">
                  {proof.name}
                </p>
                <p className="text-micro text-sand-300/70">{proof.role}</p>
              </div>
            </figcaption>
          </figure>
        ) : (
          <p className="flex items-center gap-2 text-small text-sand-300/70">
            <ShieldCheck size={16} className="text-gold-300" />
            بياناتك مشفّرة ولا تُشارك مع أي جهة تسويقية
          </p>
        )}
      </aside>

      {/* ---------------- Form column ---------------- */}
      <div className="flex flex-col justify-center px-5 py-12 sm:px-10 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          <Link href="/" className="mb-10 inline-flex lg:hidden">
            <Logo />
          </Link>

          <h1 className="font-display text-h1 font-extrabold text-ink-900">
            {title}
          </h1>
          <p className="mt-3 text-pretty text-ink-700/80">{description}</p>

          <div className="mt-9">{children}</div>

          <p className="mt-8 flex flex-wrap items-center gap-2 text-sm text-ink-700/80">
            {switchPrompt}
            <Link
              href={switchHref}
              className="group/link inline-flex items-center gap-1.5 font-semibold text-brand-700 hover:text-brand-800"
            >
              {switchLabel}
              <ArrowLeft
                size={15}
                className="transition-transform duration-300 group-hover/link:-translate-x-1"
              />
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
