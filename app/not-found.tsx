import type { Metadata } from "next";
import { ArrowLeft, Search } from "lucide-react";

import { Container, Section } from "@/components/ui/Section";
import { ButtonLink } from "@/components/ui/Button";
import { Photo } from "@/components/ui/Photo";

export const metadata: Metadata = {
  title: "الصفحة غير موجودة",
};

const shortcuts = [
  { href: "/catalog", label: "المعروضات والطلبات" },
  { href: "/how-it-works", label: "كيف تعمل المنصة" },
  { href: "/donate", label: "تبرّع بقطعة" },
  { href: "/faq", label: "الأسئلة الشائعة" },
];

export default function NotFound() {
  return (
    <Section>
      <Container width="wide">
        <div className="relative isolate overflow-hidden rounded-2xl bg-ink-900 md:rounded-3xl">
          <span
            aria-hidden
            className="grain-layer pointer-events-none absolute inset-0 -z-10"
          />
          <span
            aria-hidden
            className="glow-gold animate-sheen pointer-events-none absolute -top-52 start-1/3 -z-10 h-[36rem] w-[36rem] -translate-x-1/2"
          />

          <div className="grid items-center gap-10 p-8 py-14 md:p-14 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="animate-rise">
              <h1 className="font-display text-display font-extrabold text-balance text-sand-50">
                هذه الصفحة غير موجودة
              </h1>

              <p className="mt-5 max-w-xl text-lead text-pretty text-sand-200/80">
                خطأ 404 — قد يكون الرابط قديماً، أو أن الصفحة نُقلت. لا شيء ضاع
                من تبرعاتك، فكل السجلات محفوظة في لوحتك.
              </p>

              <div className="mt-9 flex flex-wrap items-center gap-4">
                <ButtonLink href="/" variant="gold" size="lg">
                  الرئيسية
                  <ArrowLeft
                    size={19}
                    className="transition-transform duration-300 group-hover/btn:-translate-x-1"
                  />
                </ButtonLink>
                <ButtonLink href="/catalog" variant="on-ink" size="lg">
                  <Search size={17} />
                  تصفّح المعروضات
                </ButtonLink>
              </div>

              <div className="mt-10 border-t border-white/10 pt-7">
                <p className="text-small font-semibold text-gold-300">
                  ربما تبحث عن
                </p>
                <div className="mt-4 flex flex-wrap gap-2.5">
                  {shortcuts.map((shortcut) => (
                    <ButtonLink
                      key={shortcut.href}
                      href={shortcut.href}
                      variant="on-ink"
                      size="sm"
                    >
                      {shortcut.label}
                    </ButtonLink>
                  ))}
                </div>
              </div>
            </div>

            <Photo
              src="/images/boxes.jpg"
              alt="صناديق كرتونية على خلفية دافئة"
              ratio="4/3"
              shape="rounded"
              sizes="(max-width: 1024px) 100vw, 40vw"
              className="shadow-xl ring-1 ring-white/10"
            />
          </div>
        </div>
      </Container>
    </Section>
  );
}
