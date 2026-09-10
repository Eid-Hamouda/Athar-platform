import type { Metadata } from "next";
import { ArrowLeft, Info, PackageOpen, Users, LifeBuoy } from "lucide-react";

import { Container, Section } from "@/components/ui/Section";
import { PageHero } from "@/components/ui/PageHero";
import { ButtonLink } from "@/components/ui/Button";
import { Accordion } from "@/components/ui/Accordion";
import { Reveal } from "@/components/ui/Reveal";
import { IconTile } from "@/components/ui/Card";
import { CtaPanel } from "@/components/ui/CtaPanel";

export const metadata: Metadata = {
  title: "الأسئلة الشائعة",
  description:
    "إجابات مباشرة عن التسجيل، القطع المقبولة، خصوصية البيانات، التوصيل، وكيفية عمل التصنيف الذكي في منصة أثر.",
};

const groups = [
  {
    icon: Info,
    title: "عن المنصة",
    items: [
      {
        question: "ما هي أثر بالضبط؟",
        answer:
          "منصة رقمية غير ربحية للتبرع العيني. تربط بين من لديه فائض صالح للاستخدام (ملابس، أثاث، أجهزة، كتب) وبين أسر وجمعيات موثّقة تحتاجه، وتتولّى تصنيف القطع بالذكاء الاصطناعي وترتيب توصيلها عبر شبكة متطوعين.",
      },
      {
        question: "هل الاستخدام مجاني فعلاً؟",
        answer:
          "نعم، مجاني 100% لكل الأطراف. لا عمولة على أي قطعة، ولا رسوم اشتراك، ولا مقابل على التوصيل. النموذج مبني على تطوّع الأفراد والشراكة مع الجمعيات، لا على الربح.",
      },
      {
        question: "هل تستقبلون تبرعات مالية؟",
        answer:
          "لا. أثر مخصّصة للتبرع العيني فقط، ولا نستقبل أموالاً عبر المنصة إطلاقاً. إن راسلك أحد باسم أثر طالباً مبلغاً مالياً فهذا احتيال، ونرجو إبلاغنا فوراً.",
      },
      {
        question: "لماذا الذكاء الاصطناعي؟ لماذا لا تكفي استمارة؟",
        answer:
          "لأن الاستمارة هي العائق نفسه. تجربتنا أن كثيرين يتراجعون عند خانة «الوصف» و«التصنيف». برفع صورة واحدة يقوم النظام بالمهمة، ويبقى لك التعديل إن أردت — فيهبط زمن التبرع من دقائق إلى ثوانٍ.",
      },
    ],
  },
  {
    icon: PackageOpen,
    title: "للمتبرعين",
    items: [
      {
        question: "ما القطع المقبولة وما المرفوضة؟",
        answer:
          "المعيار هو حالة القطعة، لا نوعها: نقبل كل ما هو نظيف وسليم وصالح للاستخدام الآمن. ملابس وأحذية، أثاث، أجهزة عاملة، كتب، مستلزمات أطفال، أدوات منزلية — وهذه أمثلة لا قائمة حصرية، فالمنصة لا تعمل بفئات ثابتة. ونرفض الملابس الممزّقة أو غير النظيفة، الأجهزة المعطّلة، الأثاث المكسور، الأدوية، والأغذية سريعة التلف.",
      },
      {
        question: "هل أستطيع التبرع دون ذكر اسمي؟",
        answer:
          "نعم. يمكنك التبرع كمجهول فلا يظهر اسمك للمستفيد ولا في الكاتالوج. يبقى الاسم مرئياً لفريق الإدارة فقط لأغراض التوثيق واللوجستيات.",
      },
      {
        question: "من يأتي لاستلام القطعة؟",
        answer:
          "متطوّع معتمد من شبكتنا يختار المهمة بحسب قربه من موقعك. تحدّد موقع الاستلام على الخريطة، ويتواصل معك المتطوّع لتحديد وقت مناسب قبل الحضور.",
      },
      {
        question: "كيف أعرف أن تبرّعي وصل؟",
        answer:
          "تتابع قطعتك في لوحتك عبر ثلاث مراحل: «متاح بالمنصة»، «قيد التوصيل»، «تم التسليم». عند إتمام التسليم يؤكّده المتطوّع ويصلك إشعار بالوقت والجهة المستلمة.",
      },
    ],
  },
  {
    icon: Users,
    title: "للمستفيدين والمتطوعين",
    items: [
      {
        question: "كيف يُعتمد حساب المستفيد؟",
        answer:
          "بعد التسجيل يمرّ الحساب بمراجعة يدوية من فريق الإدارة، تستغرق عادةً أقل من 48 ساعة عمل. قبل الاعتماد يمكنك تصفّح المنصة، ولا يمكنك تقديم طلبات احتياج أو حجز قطع.",
      },
      {
        question: "هل تُنشر بيانات المستفيد أو حالته؟",
        answer:
          "أبداً. لا يُنشر اسم المستفيد ولا عنوانه ولا تفاصيل حالته في الكاتالوج. المتطوّع المكلّف بالتوصيل يرى العنوان ورقم التواصل فقط، ولحظة تنفيذ المهمة فقط.",
      },
      {
        question: "ماذا لو لم أجد ما أحتاجه في الكاتالوج؟",
        answer:
          "قدّم «طلب احتياج» يحدّد الفئة والكمية ودرجة الأولوية. يظهر الطلب للمتبرعين والجمعيات، ويرشّحه النظام لمن يرفع قطعة مطابقة لاحقاً — فتصل إليك دون أن تبحث مرة أخرى.",
      },
      {
        question: "ما الذي أحتاجه للتطوّع؟",
        answer:
          "وسيلة نقل ووقت مرن. تسجّل كمتطوّع، فتظهر لك المهام القريبة مع نقطتي الاستلام والتسليم على الخريطة وأزرار اتصال وواتساب جاهزة. تختار ما يناسب مسارك، وتؤكّد التسليم من هاتفك.",
      },
    ],
  },
];

export default function FAQPage() {
  return (
    <>
      <PageHero
        width="wide"
        title="أسئلة يطرحها الناس قبل أن يتبرّعوا لأول مرة"
        lead="جمعنا هنا الأسئلة التي تتكرّر في رسائل الدعم، مرتّبة بحسب دورك. الإجابات مباشرة وبلا تعميم."
        actions={
          <ButtonLink href="/contact" variant="gold" size="lg">
            <LifeBuoy size={18} />
            لم أجد سؤالي
          </ButtonLink>
        }
      />

      <Section>
        <Container width="wide">
          <div className="flex flex-col gap-16">
            {groups.map((group, groupIndex) => (
              <div
                key={group.title}
                className="grid gap-8 lg:grid-cols-[0.65fr_1.35fr] lg:gap-14"
              >
                <div className="lg:sticky lg:top-28 lg:self-start">
                  <IconTile tone={groupIndex === 1 ? "gold" : "brand"} size="lg">
                    <group.icon size={23} strokeWidth={1.75} />
                  </IconTile>
                  <h2 className="mt-5 font-display text-h1 font-extrabold text-ink-900">
                    {group.title}
                  </h2>
                  <p className="mt-3 text-small text-ink-700/70">
                    {group.items.length} أسئلة
                  </p>
                </div>

                <Reveal>
                  <Accordion
                    items={group.items}
                    defaultOpenIndex={groupIndex === 0 ? 0 : null}
                  />
                </Reveal>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      <Section pad="bottom">
        <Container width="wide">
          <CtaPanel
            title="سؤالك ليس هنا؟ اكتب لنا."
            body="يجيب على رسائل الدعم أشخاص من الفريق، لا روبوت محادثة. متوسط زمن الرد أقل من يوم عمل."
            primary={{ label: "راسل فريق الدعم", href: "/contact" }}
            secondary={{ label: "اقرأ سياسة المنصة", href: "/policy" }}
            image={{
              src: "/images/books-stack.jpg",
              alt: "كتب مرتّبة بعناية",
            }}
          />
        </Container>
      </Section>

      <Section pad="bottom">
        <Container width="wide">
          <div className="flex flex-wrap items-center justify-between gap-6 rounded-2xl bg-sand-100 p-8 ring-1 ring-sand-200 md:p-10">
            <div>
              <h3 className="font-display text-h3 font-bold text-ink-900">
                مستعد للبدء؟
              </h3>
              <p className="mt-2 text-small text-ink-700/80">
                التسجيل مجاني ويستغرق دقيقتين.
              </p>
            </div>
            <ButtonLink href="/auth/register" variant="primary" size="lg">
              أنشئ حسابك
              <ArrowLeft
                size={18}
                className="transition-transform duration-300 group-hover/btn:-translate-x-1"
              />
            </ButtonLink>
          </div>
        </Container>
      </Section>
    </>
  );
}
