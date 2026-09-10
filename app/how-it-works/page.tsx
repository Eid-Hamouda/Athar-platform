import type { Metadata } from "next";
import {
  ArrowLeft,
  Camera,
  ShieldCheck,
  Lock,
  UserCheck,
  PackageOpen,
  HeartHandshake,
  Truck,
  BadgeCheck,
  Building2,
  Users,
  Check,
} from "lucide-react";

import { Container, Section } from "@/components/ui/Section";
import { PageHero } from "@/components/ui/PageHero";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ButtonLink } from "@/components/ui/Button";
import { Photo } from "@/components/ui/Photo";
import { Reveal } from "@/components/ui/Reveal";
import { Card, IconTile } from "@/components/ui/Card";
import { Accordion } from "@/components/ui/Accordion";
import { CtaPanel } from "@/components/ui/CtaPanel";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "كيف تعمل المنصة",
  description:
    "الدورة الكاملة في أثر: التسجيل والاعتماد، رفع القطعة بصورة واحدة، المطابقة الذكية، التوصيل عبر المتطوعين، ثم التوثيق وإغلاق الدورة.",
};

const stages = [
  {
    icon: UserCheck,
    title: "التسجيل واعتماد الحساب",
    body: "تختار دورك عند التسجيل: متبرّع، مستفيد، متطوّع، أو جمعية. حسابات المتبرعين والمتطوعين تُفعّل فوراً، أما المستفيدون والجمعيات فيمرّون بتدقيق يدوي من فريق الإدارة قبل السماح لهم بتقديم الطلبات.",
    note: "التدقيق يستغرق عادةً أقل من 48 ساعة عمل.",
    image: "/images/community-hands.jpg",
    imageAlt: "أيادٍ متشابكة تعبّر عن العمل المجتمعي",
  },
  {
    icon: Camera,
    title: "رفع القطعة بصورة واحدة",
    body: "تفتح صفحة التبرع وترفع صورة القطعة. تتولّى خدمة الرؤية الحاسوبية تحليل الصورة: نوع القطعة، لونها، حالتها التقديرية، ثم تكتب وصفاً عربياً وتختار التصنيف والتصنيف الفرعي. يبقى لك تعديل أي حقل قبل النشر.",
    note: "تحدّد موقع الاستلام على الخريطة أو تكتبه نصياً.",
    image: "/images/boxes.jpg",
    imageAlt: "صناديق كرتونية معدّة للتبرع",
  },
  {
    icon: HeartHandshake,
    title: "المطابقة مع احتياج موثّق",
    body: "إن كان هناك طلب احتياج مفتوح يطابق فئة قطعتك، يرشّحه النظام لك مباشرة مرتّباً بالأولوية والقرب الجغرافي. وإن لم يوجد، تُنشر القطعة في الكاتالوج ليحجزها مستفيد معتمد بنفسه.",
    note: "الأولوية دائماً للطلبات المصنّفة «حرج طارئ».",
    image: "/images/children-classroom.jpg",
    imageAlt: "أطفال في صف دراسي",
  },
  {
    icon: Truck,
    title: "الاستلام والتوصيل الميداني",
    body: "بمجرد الحجز، تظهر المهمة لشبكة المتطوعين القريبين. يستلم المتطوّع القطعة من عندك بموعد يناسبك، وتصل إليه نقطة التسليم على الخريطة مع رقم تواصل المستفيد — ولا يرى أي بيانات أخرى.",
    note: "أزرار الاتصال والواتساب مدمجة في لوحة المتطوّع.",
    image: "/images/logistics-truck.jpg",
    imageAlt: "متطوعون ينزّلون صناديق من شاحنة",
  },
  {
    icon: BadgeCheck,
    title: "التوثيق وإغلاق الدورة",
    body: "يؤكّد المتطوّع التسليم من لوحته، فتتحوّل حالة القطعة إلى «تم التسليم» ويُغلق طلب الاحتياج المرتبط بها. يصلك إشعار بوقت التسليم والجهة المستلمة، ويظهر السجل كاملاً في لوحتك.",
    note: "السجل يبقى متاحاً لك دائماً للمراجعة.",
    image: "/images/children-smiling.jpg",
    imageAlt: "أطفال مبتسمون",
  },
];

const behindTheScenes = [
  {
    icon: Camera,
    title: "رؤية حاسوبية",
    body: "نموذج تحليل صور يستخرج النوع والحالة والتصنيف من الصورة، فيختصر دقائق من التعبئة اليدوية إلى ثوانٍ.",
  },
  {
    icon: ShieldCheck,
    title: "تدقيق بشري",
    body: "لا خوارزمية تعتمد مستفيداً. كل حساب مستفيد أو جمعية يراجعه فريق الإدارة يدوياً قبل تفعيل الطلبات.",
  },
  {
    icon: Lock,
    title: "أقل قدر من البيانات",
    body: "المتطوّع يرى العنوان ورقم التواصل فقط ولحظة المهمة فقط. لا اسم كامل، ولا تفاصيل حالة، ولا تاريخ سابق.",
  },
];

const roles = [
  {
    icon: PackageOpen,
    title: "المتبرّع",
    points: [
      "ارفع بصورة، دون تعبئة وصف",
      "تابع القطعة في ثلاث مراحل واضحة",
      "تبرّع باسمك أو مجهولاً",
      "لا رسوم ولا عمولة",
    ],
  },
  {
    icon: HeartHandshake,
    title: "المستفيد",
    points: [
      "قدّم طلب احتياج بالكمية والأولوية",
      "احجز من الكاتالوج مباشرة",
      "استلم حتى باب المنزل",
      "بياناتك لا تُنشر أبداً",
    ],
  },
  {
    icon: Truck,
    title: "المتطوّع",
    points: [
      "اختر المهام القريبة منك",
      "نقطتا الاستلام والتسليم على الخريطة",
      "اتصال وواتساب بضغطة",
      "أكّد التسليم من هاتفك",
    ],
  },
  {
    icon: Building2,
    title: "الجمعية الشريكة",
    points: [
      "أضف حالات مستفيديك",
      "استلم التبرعات الموجّهة لك",
      "لوحة إحصاءات وتوزيع",
      "تقارير جاهزة للمراجعة",
    ],
  },
];

const quality = [
  {
    question: "ما القطع التي تُرفض؟",
    answer:
      "كل ما لا يمكن استخدامه بأمان: الملابس الممزّقة أو غير النظيفة، الأجهزة المعطّلة، الأثاث المكسور، الأدوية، الأغذية سريعة التلف، وأي قطعة قد تسبّب ضرراً. يحق لفريق الإدارة حجب أي عنصر لا يستوفي هذه المعايير.",
  },
  {
    question: "من يتحمّل تكلفة النقل؟",
    answer:
      "لا أحد يدفع للمنصة. التوصيل يعتمد على شبكة متطوعين يختارون المهام القريبة من مساراتهم اليومية، ولهذا نحرص على المطابقة الجغرافية أولاً — فهي ما يجعل النموذج مستداماً بلا تكاليف.",
  },
  {
    question: "كم تستغرق الدورة كاملة؟",
    answer:
      "متوسط الزمن من رفع القطعة إلى تسليمها 36 ساعة. الطلبات المصنّفة «حرج طارئ» تُرشّح للمتطوعين بأولوية أعلى وتُنجز عادةً في اليوم نفسه إن توفّر متطوّع قريب.",
  },
  {
    question: "هل يمكن للجمعيات رفع تبرعات بالجملة؟",
    answer:
      "نعم. الحسابات المعتمدة كجمعية أو منظمة تستطيع إضافة عناصر متعدّدة وإدارة توزيعها من لوحة التحكم، مع إمكانية توجيه دفعة كاملة إلى مجموعة حالات موثّقة.",
  },
];

export default function HowItWorksPage() {
  return (
    <>
      <PageHero
        width="wide"
        title="من صورة على هاتفك، إلى قطعة في بيت يحتاجها"
        lead="خمس مراحل، كل واحدة منها موثّقة وقابلة للتتبّع. هذه الصفحة تشرح ما يحدث في كل مرحلة، ومن يرى ماذا، ومتى."
        actions={
          <>
            <ButtonLink href="/auth/register" variant="gold" size="lg">
              ابدأ الآن
              <ArrowLeft
                size={19}
                className="transition-transform duration-300 group-hover/btn:-translate-x-1"
              />
            </ButtonLink>
            <ButtonLink href="/catalog" variant="on-ink" size="lg">
              شاهد المعروضات
            </ButtonLink>
          </>
        }
        image={{
          src: "/images/logistics-truck.jpg",
          alt: "متطوعون ينزّلون صناديق تبرعات من شاحنة",
        }}
      />

      {/* ==================== STAGES TIMELINE ==================== */}
      <Section>
        <Container width="wide">
          <SectionHeading
            title="ما يحدث فعلاً بين نقطتين"
            lead="لا نختصر الشرح في أيقونات. هذه هي التفاصيل التشغيلية التي تحكم كل تبرّع على المنصة."
            className="mb-16"
          />

          <ol className="flex flex-col gap-16 md:gap-24">
            {stages.map((stage, i) => (
              <li key={stage.title} className="list-none">
                <Reveal
                  className={cn(
                    "grid items-center gap-8 md:gap-14 lg:grid-cols-2",
                    i % 2 === 1 && "lg:[&>*:first-child]:order-2"
                  )}
                >
                  {/* Copy */}
                  <div>
                    <div className="flex items-center gap-4">
                      <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-ink-900 font-display text-xl font-extrabold tabular-nums text-gold-300 shadow-md">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <IconTile tone="brand" size="lg">
                        <stage.icon size={24} strokeWidth={1.75} />
                      </IconTile>
                    </div>

                    <h3 className="mt-7 font-display text-h1 font-extrabold text-balance text-ink-900">
                      {stage.title}
                    </h3>
                    <p className="mt-5 text-lead text-pretty text-ink-700/85">
                      {stage.body}
                    </p>
                    <p className="mt-6 flex items-start gap-2.5 rounded-2xl bg-brand-50 p-4 text-small font-semibold text-brand-800 ring-1 ring-brand-100">
                      <Check size={15} strokeWidth={3} className="mt-0.5 shrink-0" />
                      {stage.note}
                    </p>
                  </div>

                  {/* Photo */}
                  <Photo
                    src={stage.image}
                    alt={stage.imageAlt}
                    ratio="4/3"
                    shape="rounded"
                    sizes="(max-width: 1024px) 100vw, 46vw"
                    className="shadow-lg ring-1 ring-sand-200"
                  />
                </Reveal>
              </li>
            ))}
          </ol>
        </Container>
      </Section>

      {/* ==================== BEHIND THE SCENES ==================== */}
      <Section pad="bottom">
        <Container width="wide">
          <div className="relative isolate overflow-hidden rounded-2xl bg-ink-900 px-6 py-14 md:rounded-3xl md:px-12 md:py-20">
            <span
              aria-hidden
              className="grain-layer pointer-events-none absolute inset-0 -z-10"
            />
            <span
              aria-hidden
              className="glow-brand pointer-events-none absolute -top-52 start-1/4 -z-10 h-[40rem] w-[40rem]"
            />

            <SectionHeading
              tone="light"
              title="ثلاث طبقات تحمي الدورة من الخلل"
              className="mb-12"
            />

            <div className="grid gap-5 md:grid-cols-3">
              {behindTheScenes.map((item, i) => (
                <Reveal key={item.title} delay={i * 100}>
                  <Card tone="ink" padding="lg" className="h-full">
                    <IconTile tone="ink" size="lg" className="bg-white/10">
                      <item.icon size={24} strokeWidth={1.75} />
                    </IconTile>
                    <h3 className="mt-6 font-display text-h3 font-bold text-sand-50">
                      {item.title}
                    </h3>
                    <p className="mt-3 text-pretty text-sand-200/75">
                      {item.body}
                    </p>
                  </Card>
                </Reveal>
              ))}
            </div>
          </div>
        </Container>
      </Section>

      {/* ==================== ROLES ==================== */}
      <Section pad="bottom">
        <Container width="wide">
          <SectionHeading
            title="ماذا يمكنك فعله بحسب دورك"
            lead="الصلاحيات مفصولة بدقة، فلا يرى أحد أكثر مما يحتاجه لإتمام مهمته."
            action={
              <ButtonLink href="/auth/register" variant="outline" size="lg">
                <Users size={17} />
                اختر دورك
              </ButtonLink>
            }
            className="mb-12"
          />

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {roles.map((role, i) => (
              <Reveal key={role.title} delay={i * 90}>
                <Card padding="lg" className="h-full">
                  <IconTile tone="gold" size="lg">
                    <role.icon size={23} strokeWidth={1.75} />
                  </IconTile>
                  <h3 className="mt-6 font-display text-h3 font-bold text-ink-900">
                    {role.title}
                  </h3>
                  <ul className="mt-5 flex flex-col gap-3">
                    {role.points.map((point) => (
                      <li
                        key={point}
                        className="flex items-start gap-2.5 text-small text-ink-700/85"
                      >
                        <Check
                          size={14}
                          strokeWidth={3}
                          className="mt-1 shrink-0 text-brand-500"
                        />
                        {point}
                      </li>
                    ))}
                  </ul>
                </Card>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      {/* ==================== QUALITY RULES ==================== */}
      <Section pad="bottom">
        <Container width="wide">
          <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
            <div className="lg:sticky lg:top-28 lg:self-start">
              <h2 className="font-display text-h1 font-extrabold text-balance text-ink-900">
                القاعدة الأولى: لا نُهدي ما لا نقبله لأنفسنا
              </h2>
              <p className="mt-5 text-pretty text-ink-700/85">
                كرامة المستفيد ليست تفصيلاً ثانوياً، بل هي المعيار الذي نرفض أو
                نقبل على أساسه كل قطعة.
              </p>
            </div>

            <Reveal>
              <Accordion items={quality} defaultOpenIndex={0} />
            </Reveal>
          </div>
        </Container>
      </Section>

      {/* ==================== CTA ==================== */}
      <Section pad="bottom">
        <Container width="wide">
          <CtaPanel
            title="ابدأ بقطعة واحدة، اليوم"
            body="التسجيل يستغرق دقيقتين، والتبرع الأول قد يستغرق أقل من ذلك: صورة واحدة، وتحديد موقع الاستلام."
            primary={{ label: "أنشئ حسابك", href: "/auth/register" }}
            secondary={{ label: "لدي سؤال أولاً", href: "/contact" }}
            image={{
              src: "/images/clothing-rack.jpg",
              alt: "رفّ ملابس مرتّبة",
            }}
          />
        </Container>
      </Section>
    </>
  );
}
