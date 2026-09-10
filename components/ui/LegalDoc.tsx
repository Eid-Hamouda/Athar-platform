import * as React from "react";
import { FileText, ListTree } from "lucide-react";
import { Container, Section } from "./Section";
import { Reveal } from "./Reveal";
import { cn } from "@/lib/utils";

export interface LegalSection {
  id: string;
  title: string;
  paragraphs?: string[];
  bullets?: string[];
}

export interface LegalDocProps {
  sections: LegalSection[];
  updated: string;
  /** Short framing note shown above the table of contents. */
  note?: string;
}

/**
 * Shared frame for the policy, privacy and terms pages: a sticky numbered
 * index beside the clauses, each clause on its own card.
 */
export function LegalDoc({ sections, updated, note }: LegalDocProps) {
  return (
    <Section>
      <Container width="wide">
        <div className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:gap-14">
          {/* ---------------- Index ---------------- */}
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <p className="flex items-center gap-2 text-small font-semibold text-ink-700/75">
              <FileText size={14} className="shrink-0 text-brand-600" />
              آخر تحديث: {updated}
            </p>

            {note && (
              <p className="mt-5 text-pretty text-small text-ink-700/80">
                {note}
              </p>
            )}

            <h2 className="mt-8 flex items-center gap-2 text-small font-bold text-ink-900">
              <ListTree size={15} className="text-brand-600" />
              محتويات الوثيقة
            </h2>

            <ol className="mt-4 flex flex-col gap-1">
              {sections.map((section, i) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="flex items-start gap-3 rounded-xl px-3 py-2.5 text-small text-ink-700/85 transition-colors hover:bg-sand-100 hover:text-brand-700"
                  >
                    <span className="font-bold tabular-nums text-brand-600">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {section.title}
                  </a>
                </li>
              ))}
            </ol>
          </aside>

          {/* ---------------- Clauses ---------------- */}
          <div className="flex flex-col gap-4">
            {sections.map((section, i) => (
              <Reveal key={section.id} delay={Math.min(i, 6) * 60}>
                <article
                  id={section.id}
                  className="scroll-mt-28 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-sand-200/80 md:p-9"
                >
                  <div className="flex items-start gap-4">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-ink-900 font-display text-sm font-extrabold tabular-nums text-gold-300">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <h2 className="mt-1.5 font-display text-h3 font-bold text-balance text-ink-900">
                      {section.title}
                    </h2>
                  </div>

                  {section.paragraphs?.map((paragraph, index) => (
                    <p
                      key={paragraph.slice(0, 24)}
                      className={cn(
                        "text-pretty leading-relaxed text-ink-700/85",
                        index === 0 ? "mt-5" : "mt-4"
                      )}
                    >
                      {paragraph}
                    </p>
                  ))}

                  {section.bullets && section.bullets.length > 0 && (
                    <ul className="mt-5 flex flex-col gap-3">
                      {section.bullets.map((bullet) => (
                        <li
                          key={bullet.slice(0, 24)}
                          className="flex items-start gap-3 text-pretty text-ink-700/85"
                        >
                          <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-400" />
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  )}
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </Container>
    </Section>
  );
}
