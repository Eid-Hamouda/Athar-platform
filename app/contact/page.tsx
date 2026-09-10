"use client";

import * as React from "react";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  CheckCircle2,
  MessageSquare,
  Building2,
  Truck,
} from "lucide-react";

import { Container, Section } from "@/components/ui/Section";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card, IconTile } from "@/components/ui/Card";
import { Photo } from "@/components/ui/Photo";
import { Reveal } from "@/components/ui/Reveal";

const channels = [
  {
    icon: Mail,
    label: "البريد الإلكتروني",
    value: "support@athar-platform.com",
    href: "mailto:support@athar-platform.com",
    note: "الرد عادةً خلال يوم عمل",
  },
  {
    icon: Phone,
    label: "الهاتف",
    value: "+963 123 456 789",
    href: "tel:+963123456789",
    note: "الأحد — الخميس",
    ltr: true,
  },
  {
    icon: MapPin,
    label: "المكتب",
    value: "دمشق، سوريا",
    note: "بموعد مسبق فقط",
  },
  {
    icon: Clock,
    label: "ساعات العمل",
    value: "9 صباحاً — 5 مساءً",
    note: "بتوقيت دمشق",
  },
];

const shortcuts = [
  { icon: Building2, label: "شراكة جمعية", subject: "partnership" },
  { icon: Truck, label: "التطوّع بالتوصيل", subject: "volunteer" },
  { icon: MessageSquare, label: "مشكلة تقنية", subject: "support" },
];

export default function ContactPage() {
  const [sent, setSent] = React.useState(false);
  const [subject, setSubject] = React.useState("general");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // No messaging backend is wired up yet; this confirms receipt locally.
    setSent(true);
  };

  return (
    <>
      {/* ==================== HERO ==================== */}
      <Container width="wide" className="pt-4">
        <div className="relative isolate overflow-hidden rounded-2xl bg-ink-900 px-6 py-14 md:rounded-3xl md:px-14 md:py-16">
          <span
            aria-hidden
            className="grain-layer pointer-events-none absolute inset-0 -z-10"
          />
          <span
            aria-hidden
            className="glow-gold pointer-events-none absolute -top-52 end-1/4 -z-10 h-[38rem] w-[38rem]"
          />

          <div className="max-w-2xl animate-rise">
            <h1 className="font-display text-display font-extrabold text-balance text-sand-50">
              تواصل معنا
            </h1>
            <p className="mt-5 text-lead text-pretty text-sand-200/80">
              استفسار، اقتراح، طلب شراكة، أو مشكلة تقنية — يجيب عليها أشخاص من
              الفريق، لا نظام آلي.
            </p>
          </div>
        </div>
      </Container>

      {/* ==================== CHANNELS + FORM ==================== */}
      <Section>
        <Container width="wide">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
            {/* ---------- Channels ---------- */}
            <div>
              <div className="grid gap-4 sm:grid-cols-2">
                {channels.map((channel, i) => {
                  const inner = (
                    <>
                      <IconTile tone={i % 2 === 0 ? "brand" : "gold"}>
                        <channel.icon size={19} strokeWidth={1.75} />
                      </IconTile>
                      <p className="mt-4 text-small font-semibold text-ink-700/70">
                        {channel.label}
                      </p>
                      <p
                        className="mt-1 font-semibold break-words text-ink-900"
                        dir={channel.ltr ? "ltr" : undefined}
                      >
                        {channel.value}
                      </p>
                      <p className="mt-2 text-small text-ink-700/65">
                        {channel.note}
                      </p>
                    </>
                  );

                  return (
                    <Reveal key={channel.label} delay={i * 80}>
                      {channel.href ? (
                        <a
                          href={channel.href}
                          className="block h-full rounded-2xl bg-white p-6 shadow-sm ring-1 ring-sand-200/80 transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
                        >
                          {inner}
                        </a>
                      ) : (
                        <Card padding="md" className="h-full p-6">
                          {inner}
                        </Card>
                      )}
                    </Reveal>
                  );
                })}
              </div>

              <Reveal delay={200} className="mt-10">
                <p className="mb-4 text-small font-semibold text-ink-700">
                  اختصارات سريعة
                </p>
                <div className="flex flex-wrap gap-2.5">
                  {shortcuts.map((shortcut) => (
                    <button
                      key={shortcut.subject}
                      type="button"
                      onClick={() => {
                        setSubject(shortcut.subject);
                        setSent(false);
                      }}
                      className="inline-flex items-center gap-2 rounded-full bg-sand-100 px-4 py-2.5 text-small font-semibold text-ink-800 ring-1 ring-sand-200 transition-all hover:bg-white hover:ring-brand-300"
                    >
                      <shortcut.icon size={15} className="text-brand-600" />
                      {shortcut.label}
                    </button>
                  ))}
                </div>
              </Reveal>

              <Reveal delay={260} className="mt-10">
                <Photo
                  src="/images/volunteer.jpg"
                  alt="متطوّع في الميدان"
                  ratio="3/2"
                  shape="rounded"
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  overlay="soft"
                  className="shadow-lg"
                >
                  <p className="absolute inset-x-0 bottom-0 p-6 text-sm font-semibold text-white">
                    تريد التطوّع؟ سجّل كمتطوّع ولن تحتاج مراسلتنا أصلاً.
                  </p>
                </Photo>
              </Reveal>
            </div>

            {/* ---------- Form ---------- */}
            <Reveal delay={120}>
              <Card padding="lg" className="lg:sticky lg:top-28">
                {sent ? (
                  <div className="flex flex-col items-center py-10 text-center">
                    <IconTile tone="brand" size="lg">
                      <CheckCircle2 size={26} strokeWidth={1.75} />
                    </IconTile>
                    <h2 className="mt-6 font-display text-h2 font-extrabold text-ink-900">
                      وصلت رسالتك
                    </h2>
                    <p className="mt-3 max-w-sm text-pretty text-ink-700/85">
                      شكراً لتواصلك. سيردّ عليك أحد أعضاء الفريق على بريدك خلال
                      يوم عمل واحد.
                    </p>
                    <div className="mt-8 flex flex-wrap justify-center gap-3">
                      <Button
                        variant="outline"
                        onClick={() => setSent(false)}
                      >
                        أرسل رسالة أخرى
                      </Button>
                      <ButtonLink href="/faq" variant="ghost">
                        تصفّح الأسئلة الشائعة
                      </ButtonLink>
                    </div>
                  </div>
                ) : (
                  <>
                    <h2 className="font-display text-h2 font-extrabold text-ink-900">
                      أرسل رسالة
                    </h2>
                    <p className="mt-2 text-small text-ink-700/75">
                      الحقول المعلّمة بنجمة مطلوبة.
                    </p>

                    <form
                      onSubmit={handleSubmit}
                      className="mt-8 flex flex-col gap-5"
                    >
                      <Input
                        id="contact-name"
                        label="الاسم الكامل"
                        required
                        placeholder="مثال: ريم العبد"
                        autoComplete="name"
                      />

                      <Input
                        id="contact-email"
                        type="email"
                        label="البريد الإلكتروني"
                        required
                        placeholder="name@example.com"
                        dir="ltr"
                        autoComplete="email"
                      />

                      <Select
                        id="contact-subject"
                        label="الموضوع"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                      >
                        <option value="general">استفسار عام</option>
                        <option value="support">مشكلة تقنية أو دعم</option>
                        <option value="partnership">شراكة جمعية خيرية</option>
                        <option value="volunteer">التطوّع بالتوصيل</option>
                        <option value="report">إبلاغ عن إساءة استخدام</option>
                        <option value="other">أخرى</option>
                      </Select>

                      <Textarea
                        id="contact-message"
                        label="الرسالة"
                        required
                        rows={5}
                        placeholder="اكتب استفسارك بوضوح، وأضف أي تفاصيل تساعدنا على الرد بدقة…"
                      />

                      <Button type="submit" variant="primary" size="lg" full>
                        إرسال الرسالة
                        <Send size={17} className="rotate-180" />
                      </Button>

                      <p className="text-small text-ink-700/60">
                        لن نستخدم بريدك لأي غرض تسويقي، ولن نشاركه مع أي جهة.
                      </p>
                    </form>
                  </>
                )}
              </Card>
            </Reveal>
          </div>
        </Container>
      </Section>
    </>
  );
}
