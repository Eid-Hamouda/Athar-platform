import type { Metadata } from "next";
import {
  ArrowLeft,
  Eye,
  HeartHandshake,
  Recycle,
  Cpu,
  Target,
  Compass,
} from "lucide-react";

import { Container, Section } from "@/components/ui/Section";
import { PageHero } from "@/components/ui/PageHero";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ButtonLink } from "@/components/ui/Button";
import { Photo } from "@/components/ui/Photo";
import { Reveal } from "@/components/ui/Reveal";
import { Card, IconTile } from "@/components/ui/Card";
import { StatBand } from "@/components/ui/Stats";
import { Marquee } from "@/components/ui/Marquee";
import { CtaPanel } from "@/components/ui/CtaPanel";

export const metadata: Metadata = {
  title: "من نحن",
  description:
    "أثر مبادرة غير ربحية تحوّل الفائض في البيوت إلى موارد تصل لمن يحتاجها، بشفافية كاملة وبتقنية تختصر الجهد على الجميع.",
};

const values = [
  {
    icon: Eye,
    title: "الشفافية قبل كل شيء",
    body: "كل قطعة لها سجل: من رفعها، من استلمها، ومتى. المتبرع يرى مسار تبرّعه، والإدارة ترى الصورة كاملة.",
  },
  {
    icon: HeartHandshake,
    title: "الكرامة ليست تفصيلاً",
    body: "نرفض أي قطعة لا نقبلها لأنفسنا، ولا نعرض بيانات المستفيدين ولا صور حالاتهم. الطلب يُقدَّم بخصوصية تامة.",
  },
  {
    icon: Recycle,
    title: "أقل هدر، أطول عمر",
    body: "كل قطعة تُعاد إلى الخدمة هي قطعة لم تذهب إلى المكب. البُعد البيئي عندنا نتيجة مقصودة لا صدفة.",
  },
  {
    icon: Cpu,
    title: "التقنية في خدمة الناس",
    body: "لا نستخدم الذكاء الاصطناعي للتزيين، بل لحذف الخطوات المملّة التي تجعل الناس تتردّد قبل التبرع.",
  },
];

const stats = [
  { value: "2024", label: "سنة الانطلاق", hint: "من دمشق" },
  { value: "5,240", label: "قطعة أُعيد تدويرها" },
  { value: "50", label: "جمعية شريكة معتمدة" },
  { value: "0", label: "ليرة عمولة", hint: "على أي تبرّع" },
];

const cities = [
  "دمشق",
  "ريف دمشق",
  "حلب",
  "حمص",
  "حماة",
  "اللاذقية",
  "طرطوس",
  "السويداء",
  "درعا",
  "دير الزور",
  "الحسكة",
  "إدلب",
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        width="wide"
        title="بدأنا من سؤال واحد: لماذا يُرمى ما يحتاجه غيرنا؟"
        lead="أثر مبادرة غير ربحية تسدّ الفجوة بين فائض البيوت والمؤسسات، واحتياج أسر حقيقية موثّقة — بأقل جهد ممكن على الطرفين."
        actions={
          <>
            <ButtonLink href="/auth/register" variant="gold" size="lg">
              انضم إلينا
              <ArrowLeft
                size={19}
                className="transition-transform duration-300 group-hover/btn:-translate-x-1"
              />
            </ButtonLink>
            <ButtonLink href="/contact" variant="on-ink" size="lg">
              تواصل مع الإدارة
            </ButtonLink>
          </>
        }
        image={{
          src: "/images/community-hands.jpg",
          alt: "أيادٍ متشابكة تعبّر عن التكافل المجتمعي",
        }}
      />

      {/* ==================== STORY ==================== */}
      <Section>
        <Container width="wide">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
            <Reveal>
              <h2 className="font-display text-display font-extrabold text-balance text-ink-900">
                المشكلة لم تكن نقص الكرم، بل غياب حلقة الوصل
              </h2>

              <div className="mt-7 flex flex-col gap-5 text-lead text-pretty text-ink-700/85">
                <p>
                  في كل بيت خزانة فيها ما لم يُلبس منذ سنتين، وغرفة فيها أثاث
                  زائد، ورفّ كتب انتهى دوره. وفي المقابل، أسر تبحث عن أبسط هذه
                  الأشياء ولا تعرف من تسأل.
                </p>
                <p>
                  حين حاولنا التبرع بالطريقة التقليدية اكتشفنا العائق الحقيقي:
                  الفرز، والوصف، والبحث عن جهة تستلم، ثم النقل. أربع خطوات كافية
                  لأن يتراجع أي شخص لديه نيّة صادقة.
                </p>
                <p>
                  فبنينا «أثر» لتحذف هذه الخطوات: صورة واحدة تكفي، والنظام يصنّف،
                  والمنصة تطابق، والمتطوّع يوصل. هدفنا أن يكون التبرع العيني أسهل
                  من التخلّص من القطعة.
                </p>
              </div>

              <div className="mt-10 rounded-2xl bg-sand-100 p-6 ring-1 ring-sand-200">
                <p className="font-display text-h1 font-extrabold text-brand-700">
                  36 ساعة
                </p>
                <p className="mt-1 text-small font-semibold text-ink-800">
                  متوسط الزمن بين رفع القطعة ووصولها إلى مستفيدها
                </p>
              </div>
            </Reveal>

            <Reveal delay={120} className="relative">
              <Photo
                src="/images/giving-coins.jpg"
                alt="يدان تحملان تبرعاً مع ورقة مكتوب عليها اصنع تغييراً"
                ratio="4/5"
                shape="arch"
                sizes="(max-width: 1024px) 100vw, 45vw"
                className="shadow-lg"
              />
              <Photo
                src="/images/school-supplies.jpg"
                alt="كتب وأدوات مدرسية"
                ratio="square"
                shape="rounded"
                sizes="180px"
                className="absolute -end-4 bottom-8 hidden w-36 shadow-xl ring-4 ring-sand-50 sm:block lg:-end-10 lg:w-44"
              />
            </Reveal>
          </div>
        </Container>
      </Section>

      {/* ==================== MISSION / VISION ==================== */}
      <Section pad="bottom">
        <Container width="wide">
          <div className="grid gap-5 lg:grid-cols-2">
            <Reveal>
              <div className="relative isolate flex h-full flex-col overflow-hidden rounded-2xl bg-ink-900 p-8 md:rounded-3xl md:p-12">
                <span
                  aria-hidden
                  className="grain-layer pointer-events-none absolute inset-0 -z-10"
                />
                <span
                  aria-hidden
                  className="glow-brand pointer-events-none absolute -top-40 start-0 -z-10 h-[28rem] w-[28rem]"
                />
                <IconTile tone="ink" size="lg" className="bg-white/10">
                  <Target size={24} strokeWidth={1.75} />
                </IconTile>
                <h3 className="mt-7 font-display text-h1 font-extrabold text-sand-50">
                  رسالتنا
                </h3>
                <p className="mt-5 text-lead text-pretty text-sand-200/80">
                  أن نبني شبكة أمان مجتمعي شفافة يثق بها الجميع: يتبرّع المتبرّع
                  دون عبء، ويطلب المستفيد دون حرج، ويعرف كلٌّ منهما بالضبط ما جرى
                  لقطعته.
                </p>
              </div>
            </Reveal>

            <Reveal delay={110}>
              <div className="flex h-full flex-col rounded-2xl bg-gold-300 p-8 md:rounded-3xl md:p-12">
                <IconTile tone="ink" size="lg">
                  <Compass size={24} strokeWidth={1.75} />
                </IconTile>
                <h3 className="mt-7 font-display text-h1 font-extrabold text-ink-900">
                  رؤيتنا
                </h3>
                <p className="mt-5 text-lead text-pretty text-ink-900/75">
                  أن يصبح إعادة تدوير الموارد بين الناس سلوكاً يومياً لا استثناءً
                  موسمياً، وأن تكون أثر المرجع الأول للتبرع العيني في المنطقة.
                </p>
              </div>
            </Reveal>
          </div>
        </Container>
      </Section>

      {/* ==================== VALUES ==================== */}
      <Section pad="bottom">
        <Container width="wide">
          <SectionHeading
            title="أربع قيم تحكم كل قرار تقني وتشغيلي"
            className="mb-12"
          />

          <div className="grid gap-5 sm:grid-cols-2">
            {values.map((value, i) => (
              <Reveal key={value.title} delay={i * 90}>
                <Card padding="lg" className="h-full">
                  <div className="flex items-start gap-5">
                    <IconTile tone="brand" size="lg">
                      <value.icon size={23} strokeWidth={1.75} />
                    </IconTile>
                    <div>
                      <h3 className="font-display text-h3 font-bold text-ink-900">
                        {value.title}
                      </h3>
                      <p className="mt-3 text-pretty text-ink-700/85">
                        {value.body}
                      </p>
                    </div>
                  </div>
                </Card>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      {/* ==================== NUMBERS ==================== */}
      <Section pad="bottom">
        <Container width="wide">
          <Reveal>
            <StatBand items={stats} tone="white" />
          </Reveal>
        </Container>
      </Section>

      {/* ==================== COVERAGE ==================== */}
      <Section pad="bottom">
        <Container width="wide">
          <div className="overflow-hidden rounded-2xl bg-sand-100 py-12 ring-1 ring-sand-200 md:rounded-3xl">
            <div className="px-6 text-center md:px-12">
              <h2 className="font-display text-h1 font-extrabold text-balance text-ink-900">
                نعمل حيث يوجد متطوّع قريب
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-pretty text-ink-700/85">
                تغطيتنا تتوسّع بانضمام المتطوعين، لا بفتح مكاتب. كل متطوّع جديد
                يفتح حياً كاملاً.
              </p>
            </div>

            <Marquee className="mt-10">
              {cities.map((city) => (
                <span
                  key={city}
                  className="mx-2 flex items-center gap-3 whitespace-nowrap rounded-full bg-white px-6 py-3 font-display text-lg font-bold text-ink-900 shadow-sm ring-1 ring-sand-200"
                >
                  <span className="h-2 w-2 rounded-full bg-brand-500" />
                  {city}
                </span>
              ))}
            </Marquee>
          </div>
        </Container>
      </Section>

      {/* ==================== CTA ==================== */}
      <Section pad="bottom">
        <Container width="wide">
          <CtaPanel
            title="نحتاج متبرعين، ومتطوعين، وجمعيات"
            body="إن كان لديك فائض فتبرّع به. وإن كان لديك وقت وسيارة فكن متطوّعاً. وإن كنت تدير جمعية فلنعمل معاً على الحالات نفسها."
            primary={{ label: "انضم إلى أثر", href: "/auth/register" }}
            secondary={{ label: "شراكة مؤسسية", href: "/contact" }}
            image={{
              src: "/images/children-smiling.jpg",
              alt: "أطفال مبتسمون",
            }}
          />
        </Container>
      </Section>
    </>
  );
}
