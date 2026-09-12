"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  Sparkles,
  MapPin,
  ShieldCheck,
  Check,
  ArrowLeft,
  LayoutDashboard,
  Truck,
  HeartHandshake,
  BadgeCheck,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import { compressImage } from "@/lib/compressImage";
import { analyzeItemAction } from "@/app/actions/aiActions";
import MapPicker from "@/components/MapPicker";
import { Container, Section } from "@/components/ui/Section";
import { Input, Select, Textarea, Field } from "@/components/ui/Input";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card, IconTile } from "@/components/ui/Card";
import { Photo } from "@/components/ui/Photo";
import { FileDrop } from "@/components/ui/FileDrop";
import { Reveal } from "@/components/ui/Reveal";

const CATEGORY_SUGGESTIONS = [
  "ملابس",
  "أحذية",
  "أثاث",
  "أجهزة",
  "إلكترونيات",
  "كتب",
  "مستلزمات أطفال",
  "أدوات منزلية",
  "أخرى",
];

const timeline = [
  {
    icon: Sparkles,
    title: "تصنيف تلقائي",
    body: "يقرأ النظام الصورة ويقترح العنوان والفئة والحالة، وتبقى لك الكلمة الأخيرة.",
  },
  {
    icon: HeartHandshake,
    title: "مطابقة مع احتياج",
    body: "إن وُجد طلب مفتوح مطابق تُوجَّه القطعة إليه، وإلّا تُنشر في الكاتالوج.",
  },
  {
    icon: Truck,
    title: "متطوّع يستلمها",
    body: "يتواصل معك متطوّع قريب لتحديد موعد مناسب للاستلام من موقعك.",
  },
  {
    icon: BadgeCheck,
    title: "إشعار بالتسليم",
    body: "عند وصولها يصلك إشعار بالوقت والجهة المستلمة، ويظهر السجل في لوحتك.",
  },
];

const acceptRules = [
  "نظيفة ومغسولة",
  "سليمة وغير مكسورة",
  "الأجهزة تعمل فعلاً",
  "لا أدوية ولا أغذية",
];

export default function DonatePage() {
  const router = useRouter();
  const [file, setFile] = React.useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [form, setForm] = React.useState({
    title: "",
    category: "",
    sub_category: "",
    condition: "ممتازة",
    description: "",
    location: "",
  });

  const set = <K extends keyof typeof form>(key: K, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  /* ---------------- AI classification on upload ---------------- */
  const handleFile = async (next: File | null) => {
    setFile(next);
    if (!next) return;

    setIsAnalyzing(true);
    const toastId = toast.loading("الذكاء الاصطناعي يقرأ الصورة…");

    try {
      const payload = new FormData();
      payload.append("image", next);
      const analysis = await analyzeItemAction(payload);

      if (!analysis) throw new Error("no-analysis");

      setForm((prev) => ({
        ...prev,
        title: prev.title || analysis.suggested_title,
        category: analysis.category || prev.category,
        sub_category: analysis.sub_category || prev.sub_category,
        condition: analysis.condition || prev.condition,
      }));

      toast.success(`تم التصنيف: ${analysis.category} — ${analysis.sub_category}`, {
        id: toastId,
      });
    } catch {
      toast.error("تعذّر التصنيف التلقائي. يمكنك تعبئة الحقول يدوياً.", {
        id: toastId,
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  /* ---------------- Submit ---------------- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return toast.error("أضف صورة للقطعة أولاً.");
    if (!form.location.trim())
      return toast.error("حدّد موقع الاستلام على الخريطة أو اكتبه نصياً.");

    setIsSubmitting(true);
    const toastId = toast.loading("جاري نشر التبرع…");

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        toast.error("سجّل الدخول أولاً لتسجيل التبرع.", { id: toastId });
        router.push("/auth/login");
        return;
      }

      // Shrunk client-side so next/image can refetch it inside its 7s budget.
      const upload = await compressImage(file);
      const extension = upload.name.split(".").pop() ?? "jpg";
      const fileName = `donation_${Date.now()}_${Math.random()
        .toString(36)
        .slice(2)}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from("donations-images")
        .upload(fileName, upload, { contentType: upload.type });
      if (uploadError) throw uploadError;

      const { data: publicUrl } = supabase.storage
        .from("donations-images")
        .getPublicUrl(fileName);

      const { error: insertError } = await supabase.from("donations").insert({
        ...form,
        image_url: publicUrl.publicUrl,
        donor_id: session.user.id,
        status: "available",
      });
      if (insertError) throw insertError;

      toast.success("نُشر تبرّعك. شكراً لعطائك.", { id: toastId });
      router.push("/dashboard");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "خطأ غير متوقع";
      toast.error(`تعذّر نشر التبرع: ${message}`, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* ==================== HERO ==================== */}
      <Container width="wide" className="pt-4">
        <div className="relative isolate overflow-hidden rounded-2xl bg-ink-900 px-6 py-12 md:rounded-3xl md:px-14 md:py-14">
          <span
            aria-hidden
            className="grain-layer pointer-events-none absolute inset-0 -z-10"
          />
          <span
            aria-hidden
            className="glow-brand animate-sheen pointer-events-none absolute -top-56 start-1/3 -z-10 h-[40rem] w-[40rem] -translate-x-1/2"
          />

          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-2xl animate-rise">
              <h1 className="font-display text-display font-extrabold text-balance text-sand-50">
                تبرّع بقطعة
              </h1>
              <p className="mt-5 text-lead text-pretty text-sand-200/80">
                ارفع صورة القطعة وحدّد موقع الاستلام — لا يستغرق الأمر أكثر من
                دقيقة. سيتولّى النظام التصنيف، وسيتولّى متطوّع قريب الباقي.
              </p>
            </div>

            <ButtonLink href="/dashboard" variant="on-ink">
              <LayoutDashboard size={16} />
              لوحة التحكم
            </ButtonLink>
          </div>
        </div>
      </Container>

      {/* ==================== FORM ==================== */}
      <Section>
        <Container width="wide">
          <div className="grid gap-8 lg:grid-cols-[1.35fr_0.65fr] lg:gap-10">
            {/* ---------- Main form ---------- */}
            <Card padding="lg" className="order-2 lg:order-1">
              <form onSubmit={handleSubmit} className="flex flex-col gap-7">
                {/* Step 1 — photo */}
                <div>
                  <StepLabel index="01" title="صورة القطعة" />
                  <FileDrop
                    file={file}
                    onFile={handleFile}
                    busy={isAnalyzing}
                    required
                    label="ارفع صورة واضحة بإضاءة جيدة"
                    hint="سيقرأ النظام النوع والحالة تلقائياً — PNG أو JPG"
                    className="mt-4"
                  />
                </div>

                {/* Step 2 — details */}
                <div className="border-t border-sand-200 pt-7">
                  <StepLabel
                    index="02"
                    title="التفاصيل"
                    note="مُعبّأة تلقائياً بعد رفع الصورة. لا فئات ثابتة — اكتب ما يصف القطعة فعلاً، والاقتراحات أمثلة فقط."
                  />

                  <div className="mt-5 flex flex-col gap-5">
                    <Input
                      id="donate-title"
                      label="عنوان القطعة"
                      required
                      value={form.title}
                      onChange={(e) => set("title", e.target.value)}
                      placeholder="مثال: معطف شتوي بحالة ممتازة"
                    />

                    <div className="grid gap-5 sm:grid-cols-2">
                      <Input
                        id="donate-category"
                        label="الفئة"
                        required
                        list="category-suggestions"
                        value={form.category}
                        onChange={(e) => set("category", e.target.value)}
                        placeholder="ملابس، أثاث، كتب…"
                      />
                      <datalist id="category-suggestions">
                        {CATEGORY_SUGGESTIONS.map((option) => (
                          <option key={option} value={option} />
                        ))}
                      </datalist>

                      <Input
                        id="donate-subcategory"
                        label="التصنيف الفرعي"
                        required
                        value={form.sub_category}
                        onChange={(e) => set("sub_category", e.target.value)}
                        placeholder="معاطف شتوية، طاولات دراسة…"
                      />
                    </div>

                    <Select
                      id="donate-condition"
                      label="حالة القطعة"
                      value={form.condition}
                      onChange={(e) => set("condition", e.target.value)}
                    >
                      <option value="ممتازة">ممتازة — شبه جديدة</option>
                      <option value="جيدة جداً">
                        جيدة جداً — نظيفة وجاهزة للاستخدام
                      </option>
                      <option value="مقبولة">
                        مقبولة — تحتاج صيانة بسيطة
                      </option>
                    </Select>

                    <Textarea
                      id="donate-description"
                      label="تفاصيل إضافية"
                      rows={3}
                      value={form.description}
                      onChange={(e) => set("description", e.target.value)}
                      placeholder="المقاس، اللون، أي ملاحظة تساعد المستفيد أو المتطوّع…"
                    />
                  </div>
                </div>

                {/* Step 3 — location */}
                <div className="border-t border-sand-200 pt-7">
                  <StepLabel
                    index="03"
                    title="موقع الاستلام"
                    note="لن يظهر عنوانك إلا للمتطوّع المكلّف بالمهمة"
                  />

                  <Field
                    label="حدّد الموقع على الخريطة"
                    hint="ابحث عن مدينتك أو انقر على الخريطة لتثبيت النقطة"
                    className="mt-5"
                  >
                    <div className="overflow-hidden rounded-xl ring-1 ring-sand-200">
                      <MapPicker
                        onLocationSelect={(lat, lng) =>
                          set(
                            "location",
                            `إحداثيات الخريطة: ${lat.toFixed(4)}, ${lng.toFixed(4)}`
                          )
                        }
                      />
                    </div>
                  </Field>

                  <Input
                    id="donate-location"
                    icon={<MapPin size={16} />}
                    required
                    value={form.location}
                    onChange={(e) => set("location", e.target.value)}
                    placeholder="أو اكتب الموقع نصياً: دمشق، حي المزة…"
                    wrapperClassName="mt-4"
                    label="الموقع نصياً"
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  full
                  disabled={isSubmitting || isAnalyzing}
                >
                  {isSubmitting ? "جاري النشر…" : "انشر التبرع"}
                  {!isSubmitting && (
                    <ArrowLeft
                      size={18}
                      className="transition-transform duration-300 group-hover/btn:-translate-x-1"
                    />
                  )}
                </Button>

                <p className="flex items-start gap-2.5 text-small text-ink-700/70">
                  <ShieldCheck size={15} className="mt-0.5 shrink-0 text-brand-600" />
                  بنشرك القطعة تقرّ بأنها مملوكة لك وصالحة للاستخدام الآمن، وفق
                  معايير المنصة.
                </p>
              </form>
            </Card>

            {/* ---------- Sidebar ---------- */}
            <div className="order-1 flex flex-col gap-5 lg:order-2">
              <Reveal>
                <Card tone="sand" padding="lg">
                  <h2 className="font-display text-h3 font-bold text-ink-900">
                    ما يحدث بعد الإرسال
                  </h2>
                  <ol className="mt-6 flex flex-col gap-5">
                    {timeline.map((item, i) => (
                      <li key={item.title} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <IconTile tone="brand" size="sm">
                            <item.icon size={16} strokeWidth={1.75} />
                          </IconTile>
                          {i < timeline.length - 1 && (
                            <span className="mt-1 w-px flex-1 bg-sand-300" />
                          )}
                        </div>
                        <div className="pb-1">
                          <p className="font-semibold text-ink-900">
                            {item.title}
                          </p>
                          <p className="mt-1 text-small text-pretty text-ink-700/80">
                            {item.body}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </Card>
              </Reveal>

              <Reveal delay={110}>
                <Card padding="lg">
                  <h3 className="font-display text-h4 font-bold text-ink-900">
                    قبل أن ترفع القطعة
                  </h3>
                  <ul className="mt-4 flex flex-col gap-3">
                    {acceptRules.map((rule) => (
                      <li
                        key={rule}
                        className="flex items-center gap-2.5 text-small text-ink-700/85"
                      >
                        <Check
                          size={14}
                          strokeWidth={3}
                          className="shrink-0 text-brand-500"
                        />
                        {rule}
                      </li>
                    ))}
                  </ul>
                  <ButtonLink
                    href="/policy#quality"
                    variant="ghost"
                    size="sm"
                    className="mt-5"
                  >
                    كل معايير الجودة
                  </ButtonLink>
                </Card>
              </Reveal>

              <Reveal delay={180}>
                <Photo
                  src="/images/clothing-neutral.jpg"
                  alt="ملابس مرتّبة جاهزة للتبرع"
                  ratio="4/3"
                  shape="rounded"
                  sizes="(max-width: 1024px) 100vw, 30vw"
                  overlay="soft"
                  className="shadow-md"
                >
                  <p className="absolute inset-x-0 bottom-0 p-5 text-small font-semibold text-white">
                    قطعة واحدة صالحة أفضل من صندوق لا يُستخدم.
                  </p>
                </Photo>
              </Reveal>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}

/* -------------------------------------------------------------------------- */

function StepLabel({
  index,
  title,
  note,
}: {
  index: string;
  title: string;
  note?: string;
}) {
  return (
    <div className="flex items-start gap-3.5">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ink-900 font-display text-small font-extrabold tabular-nums text-gold-300">
        {index}
      </span>
      <div>
        <h2 className="font-display text-h3 font-bold text-ink-900">{title}</h2>
        {note && <p className="mt-1 text-small text-ink-700/70">{note}</p>}
      </div>
    </div>
  );
}
