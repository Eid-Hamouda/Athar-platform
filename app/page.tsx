import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Camera,
  Sparkles,
  HeartHandshake,
  Truck,
  Check,
  Building2,
  Users,
  PackageOpen,
  Recycle,
} from "lucide-react";

import { Container, Section } from "@/components/ui/Section";
import { ButtonLink } from "@/components/ui/Button";
import { Photo } from "@/components/ui/Photo";
import { Reveal } from "@/components/ui/Reveal";
import { Marquee } from "@/components/ui/Marquee";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { StatBand } from "@/components/ui/Stats";
import { Steps } from "@/components/ui/Steps";
import { Testimonial } from "@/components/ui/Testimonial";
import { CtaPanel } from "@/components/ui/CtaPanel";
import { Accordion } from "@/components/ui/Accordion";
import { IconTile } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/* Content                                                                    */
/* -------------------------------------------------------------------------- */

const heroAvatars = [
  "/images/avatar-3.jpg",
  "/images/avatar-1.jpg",
  "/images/avatar-5.jpg",
  "/images/avatar-6.jpg",
];

const ticker = [
  "تصنيف ذكي للصور",
  "تدقيق يدوي لكل مستفيد",
  "تتبّع لحظي لكل قطعة",
  "شبكة متطوعين معتمدة",
  "بيانات مشفّرة بالكامل",
  "بلا أي عمولة أو رسوم",
];

const stats = [
  { value: "5,240", label: "قطعة أُعيد تدويرها", hint: "بدل أن تُرمى" },
  { value: "1,180", label: "عائلة استلمت طلبها", hint: "خلال آخر سنة" },
  { value: "36 ساعة", label: "متوسط زمن الوصول", hint: "من الرفع للتسليم" },
  { value: "98%", label: "رضا المستفيدين", hint: "استبيان ما بعد التسليم" },
];

// Illustrative only — the classifier assigns categories dynamically, so this
// is "what people donate most", not a taxonomy the product enforces.
const commonCategories = [
  {
    title: "ملابس وأحذية",
    note: "شتوية وصيفية، لكل الأعمار",
    image: "/images/clothing-rack.jpg",
    span: "md:col-span-2 md:row-span-2",
  },
  {
    title: "أثاث ومفروشات",
    note: "غرف نوم، مجالس، طاولات دراسة",
    image: "/images/furniture-sofa.jpg",
    span: "md:col-span-2",
  },
  {
    title: "كتب وقرطاسية",
    note: "مناهج ومكتبات مدرسية",
    image: "/images/books-library.jpg",
    span: "",
  },
  {
    title: "مستلزمات أطفال",
    note: "ألعاب وعربات وأسرّة",
    image: "/images/kids-play.jpg",
    span: "",
  },
  {
    title: "أجهزة وإلكترونيات",
    note: "منزلية صغيرة وحواسيب",
    image: "/images/devices.jpg",
    span: "md:col-span-2",
  },
  {
    title: "أدوات منزلية",
    note: "أوانٍ ومستلزمات مطبخ",
    image: "/images/homeware.jpg",
    span: "md:col-span-2",
  },
];

const steps = [
  {
    title: "صوّر القطعة",
    body: "افتح الكاميرا والتقط صورة واحدة. لا استمارات طويلة ولا وصف تكتبه بنفسك.",
    icon: Camera,
    image: "/images/boxes.jpg",
    imageAlt: "صناديق معدّة للتبرع",
  },
  {
    title: "تصنيف تلقائي",
    body: "يقرأ النظام نوع القطعة وحالتها، يكتب وصفها، ويضعها في التصنيف الصحيح.",
    icon: Sparkles,
    image: "/images/clothing-neutral.jpg",
    imageAlt: "ملابس مرتّبة على شمّاعات",
  },
  {
    title: "مطابقة موثّقة",
    body: "نربط القطعة بأقرب احتياج مسجّل من مستفيد أو جمعية اعتمدها فريقنا.",
    icon: HeartHandshake,
    image: "/images/children-classroom.jpg",
    imageAlt: "أطفال في صف دراسي",
  },
  {
    title: "توصيل وتوثيق",
    body: "متطوّع قريب يستلمها ويسلّمها، ويصلك إشعار بإتمام الدورة بالصورة والوقت.",
    icon: Truck,
    image: "/images/logistics-truck.jpg",
    imageAlt: "متطوعون ينزّلون صناديق من شاحنة",
  },
];

const aiPoints = [
  "يتعرّف على نوع القطعة ولونها وحالتها من الصورة وحدها",
  "يكتب وصفاً عربياً واضحاً ويختار التصنيف والتصنيف الفرعي",
  "يرشّح الاحتياج الأقرب جغرافياً والأعلى أولوية",
  "ينبّهك إذا كانت القطعة غير صالحة للتبرع قبل نشرها",
];

const roles = [
  {
    title: "متبرّع",
    image: "/images/boxes.jpg",
    icon: PackageOpen,
    points: ["تبرّع بصورة واحدة", "تابع قطعتك حتى التسليم", "تبرّع باسمك أو مجهولاً"],
  },
  {
    title: "مستفيد",
    image: "/images/children-smiling.jpg",
    icon: HeartHandshake,
    points: ["اطلب ما تحتاجه بكرامة", "بيانات محفوظة وخاصة", "الاستلام حتى باب البيت"],
  },
  {
    title: "متطوّع",
    image: "/images/volunteer.jpg",
    icon: Truck,
    points: ["اختر المهام القريبة منك", "مسارات جاهزة على الخريطة", "سجّل ساعاتك التطوعية"],
  },
  {
    title: "جمعية شريكة",
    image: "/images/community-hands.jpg",
    icon: Building2,
    points: ["استلم التبرعات بكفاءة", "لوحة إحصاءات شاملة", "وثّق حالات المستفيدين"],
  },
];

const testimonials = [
  {
    tag: "متبرّع",
    quote:
      "كان عندي خزانة مليانة ملابس شتوية ما عدنا نلبسها. صوّرتها بالجوال، وبعد يومين وصلني إشعار إنها صارت عند عائلة في حرستا. ما اضطررت أطلع من البيت.",
    name: "أحمد محمود",
    role: "متبرّع — دمشق",
    avatar: "/images/avatar-3.jpg",
  },
  {
    tag: "جمعية شريكة",
    quote:
      "كنا نصرف ساعات على فرز التبرعات وتوزيعها. أثر صنّفت وربطت كل شي مكاننا، وصرنا نركّز على الحالات نفسها مو على الورق.",
    name: "سارة الحلبي",
    role: "منسّقة — جمعية الإحسان",
    avatar: "/images/avatar-1.jpg",
  },
  {
    tag: "متطوّعة",
    quote:
      "أختار المهمة يلي جانب بيتي، الخريطة تعطيني نقطة الاستلام والتسليم، ورقم التواصل جاهز. أوصّل أمانتين بالطريق لعملي وخلصت.",
    name: "ليان خالد",
    role: "متطوّعة توصيل — حلب",
    avatar: "/images/avatar-5.jpg",
  },
];

const faqs = [
  {
    question: "هل استخدام أثر مجاني فعلاً؟",
    answer:
      "نعم، مجاني 100% لكل الأطراف: المتبرع، المستفيد، المتطوع، والجمعية. لا عمولة على أي قطعة ولا رسوم اشتراك. المنصة مبادرة غير ربحية هدفها تقليل الهدر وسدّ الاحتياج.",
  },
  {
    question: "كيف تضمنون أن التبرع يصل لمستحقه؟",
    answer:
      "كل حساب مستفيد أو جمعية يمرّ بتدقيق يدوي من فريق الإدارة قبل اعتماده. وبعد التسليم يوثّق المتطوع العملية، ويصل المتبرع إشعار بوقت التسليم واسم الجهة المستلمة.",
  },
  {
    question: "ما هي القطع المقبولة؟",
    answer:
      "لا توجد قائمة فئات مغلقة. نستقبل أي قطعة عينية نظيفة وسليمة وصالحة للاستخدام الآمن — ملابس، أثاث، أجهزة، كتب، مستلزمات أطفال، أدوات منزلية، وغيرها. ولا تحتاج لاختيار فئة بنفسك: يقرأ النظام صورة القطعة ويحدّد تصنيفها. المستثنى هو ما لا يمكن استخدامه بأمان، والأدوية، والأغذية سريعة التلف.",
  },
  {
    question: "هل يمكنني التبرع بدون الإفصاح عن هويتي؟",
    answer:
      "نعم. يمكنك التبرع كمجهول، فلا يظهر اسمك للمستفيد ولا في الكاتالوج. يبقى الاسم مرئياً لفريق الإدارة فقط لأغراض التوثيق واللوجستيات.",
  },
];

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function HomePage() {
  return (
    <>
      {/* ==================== HERO ==================== */}
      <Container width="wide" className="pt-4">
        <div className="relative isolate rounded-2xl bg-ink-900 px-6 py-14 md:rounded-3xl md:px-14 md:py-20">
          {/* Clipped decorative layer, so the glow never escapes the panel. */}
          <div
            aria-hidden
            className="absolute inset-0 -z-10 overflow-hidden rounded-2xl md:rounded-3xl"
          >
            <span className="grain-layer absolute inset-0" />
            <span className="glow-brand animate-sheen absolute -top-64 start-1/3 h-[46rem] w-[46rem] -translate-x-1/2" />
            <span className="glow-gold absolute -bottom-60 end-0 h-[34rem] w-[34rem]" />
          </div>

          <div className="grid gap-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-12">
            {/* ---------- Copy ---------- */}
            <div className="animate-rise">
              <h1 className="font-display text-hero font-extrabold text-balance text-sand-50">
                ما يفيض عن بيتك،
                <br />
                يبدأ <span className="mark-gold">حياةً ثانية</span> في بيت آخر.
              </h1>

              <p className="mt-7 max-w-xl text-lead text-pretty text-sand-200/80">
                صوّر القطعة، ويتولّى «أثر» الباقي: تصنيف ذكي، مطابقة مع احتياج
                موثّق، ومتطوّع يوصلها إلى بابها. بلا وسطاء، وبلا قرش واحد.
              </p>

              <div className="mt-10 flex flex-wrap items-center gap-4">
                <ButtonLink href="/auth/register" variant="gold" size="lg">
                  ابدأ التبرع
                  <ArrowLeft
                    size={19}
                    className="transition-transform duration-300 group-hover/btn:-translate-x-1"
                  />
                </ButtonLink>
                <ButtonLink href="/catalog" variant="on-ink" size="lg">
                  تصفّح الاحتياجات
                </ButtonLink>
              </div>

              {/* Social proof */}
              <div className="mt-11 flex flex-wrap items-center gap-x-5 gap-y-4">
                <div className="flex">
                  {heroAvatars.map((src, i) => (
                    <Image
                      key={src}
                      src={src}
                      alt=""
                      width={40}
                      height={40}
                      className={cn(
                        "h-10 w-10 rounded-full object-cover ring-2 ring-ink-900",
                        i > 0 && "-ms-3.5"
                      )}
                    />
                  ))}
                </div>
                <p className="text-small text-sand-200/70">
                  <span className="font-bold text-sand-50">+350 متبرّع</span> نشط
                  هذا الشهر، و
                  <span className="font-bold text-sand-50">50 جمعية</span> شريكة
                  معتمدة.
                </p>
              </div>
            </div>

            {/* ---------- Visual ---------- */}
            <div className="relative animate-fade lg:pb-6">
              <Photo
                src="/images/hero-hands.jpg"
                alt="أيادٍ متشابكة من متبرعين ومتطوعين"
                ratio="4/5"
                shape="arch"
                overlay="soft"
                preload
                sizes="(max-width: 1024px) 100vw, 42vw"
                className="shadow-xl ring-1 ring-white/10"
              >
                <div className="glass absolute inset-x-4 bottom-4 flex items-center justify-between gap-4 rounded-2xl px-5 py-4 shadow-lg">
                  <div>
                    <p className="font-display text-xl font-extrabold tabular-nums text-ink-900">
                      36 ساعة
                    </p>
                    <p className="mt-0.5 text-micro font-semibold text-ink-700">
                      متوسط زمن الوصول
                    </p>
                  </div>
                  <span className="h-9 w-px bg-ink-900/15" />
                  <div>
                    <p className="font-display text-xl font-extrabold tabular-nums text-ink-900">
                      98%
                    </p>
                    <p className="mt-0.5 text-micro font-semibold text-ink-700">
                      رضا المستفيدين
                    </p>
                  </div>
                </div>
              </Photo>

              {/* Peeking secondary photo — deliberately breaks the panel edge. */}
              <Photo
                src="/images/clothing-tees.jpg"
                alt="ملابس معلّقة جاهزة للتبرع"
                ratio="square"
                shape="circle"
                sizes="120px"
                className="animate-float absolute -end-4 bottom-24 hidden w-28 shadow-xl ring-4 ring-ink-900 sm:block lg:-end-10 lg:w-32"
              />

              <span className="absolute -end-3 top-8 hidden rounded-full bg-gold-300 px-4 py-2 text-small font-bold text-ink-900 shadow-gold md:block">
                <Recycle size={14} className="me-1.5 inline" />
                صفر هدر
              </span>
            </div>
          </div>
        </div>
      </Container>

      {/* ==================== FEATURE TICKER ==================== */}
      <div className="border-y border-sand-200 bg-sand-100/60 py-5">
        <Marquee speed="slow">
          {ticker.map((item) => (
            <span
              key={item}
              className="flex items-center gap-4 whitespace-nowrap px-6 text-sm font-semibold text-ink-700"
            >
              {item}
              <span className="h-1.5 w-1.5 rounded-full bg-gold-400" />
            </span>
          ))}
        </Marquee>
      </div>

      {/* ============ MOST COMMON DONATIONS (BENTO) ============ */}
      <Section>
        <Container width="wide">
          <SectionHeading
            title="أي شيء صالح للاستخدام، لا ما تسمح به قائمة"
            lead="لا توجد فئات ثابتة في أثر؛ يقرأ النظام صورة قطعتك ويحدّد تصنيفها بنفسه. ما تراه هنا هو ببساطة أكثر ما يتبرّع به الناس."
            action={
              <ButtonLink href="/catalog" variant="outline" size="lg">
                شاهد المعروض الآن
                <ArrowLeft
                  size={17}
                  className="transition-transform duration-300 group-hover/btn:-translate-x-1"
                />
              </ButtonLink>
            }
            className="mb-12"
          />

          <div className="grid auto-rows-[13rem] grid-cols-1 gap-4 sm:grid-cols-2 md:auto-rows-[15rem] md:grid-cols-4">
            {commonCategories.map((category, i) => (
              <Reveal
                key={category.title}
                delay={i * 70}
                className={cn("group relative", category.span)}
              >
                <Link
                  href="/catalog"
                  className="block h-full rounded-2xl focus-visible:outline-offset-4"
                >
                  <Photo
                    src={category.image}
                    alt={category.title}
                    ratio="fill"
                    shape="rounded"
                    overlay="strong"
                    zoom
                    sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                    className="h-full transition-shadow duration-300 group-hover:shadow-lg"
                  >
                    <div className="absolute inset-x-0 bottom-0 p-5 md:p-6">
                      <h3 className="font-display text-h3 font-bold text-white">
                        {category.title}
                      </h3>
                      <p className="mt-1 text-small text-white/75">
                        {category.note}
                      </p>
                      <span className="mt-4 inline-flex items-center gap-1.5 text-small font-bold text-gold-300 opacity-0 transition-all duration-300 group-hover:opacity-100">
                        شاهد المعروض
                        <ArrowLeft size={14} />
                      </span>
                    </div>
                  </Photo>
                </Link>
              </Reveal>
            ))}
          </div>

          <Reveal>
            <p className="mt-8 max-w-3xl text-pretty text-ink-700/80">
              وغير ذلك كثير. لا تبحث عن قطعتك في قائمة: إن كانت نظيفة وسليمة
              وصالحة للاستخدام الآمن، فلها مكان هنا — حتى لو لم تشبه أي مما
              سبق.
            </p>
          </Reveal>
        </Container>
      </Section>

      {/* ==================== HOW IT WORKS ==================== */}
      <Section pad="bottom">
        <Container width="wide">
          <div className="rounded-2xl bg-sand-100 px-6 py-14 ring-1 ring-sand-200 md:rounded-3xl md:px-12 md:py-20">
            <SectionHeading
              title="من خزانتك إلى بيت محتاج، بلا لفّ ودوران"
              lead="لا مكاتب تزورها ولا استمارات تعبّئها. الدورة كاملة تُدار من هاتفك، ويقوم النظام والمتطوعون بالباقي."
              className="mb-14"
            />
            <Steps items={steps} />
          </div>
        </Container>
      </Section>

      {/* ==================== AI FEATURE ==================== */}
      <Section pad="bottom">
        <Container width="wide">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
            <Reveal className="relative order-2 lg:order-1">
              <Photo
                src="/images/clothing-neutral.jpg"
                alt="ملابس مرتّبة بعد فرزها"
                ratio="4/5"
                shape="arch"
                sizes="(max-width: 1024px) 100vw, 45vw"
                className="shadow-lg"
              />

              {/* Mock classifier output floating over the photo. */}
              <div className="glass absolute inset-x-4 bottom-5 rounded-2xl p-5 shadow-xl sm:inset-x-8">
                <div className="flex items-center gap-2 text-micro font-bold text-brand-700">
                  <Sparkles size={13} />
                  قرأها النظام تلقائياً
                </div>
                <p className="mt-2.5 font-display text-h4 font-bold text-ink-900">
                  معطف صوفي بحالة ممتازة
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {["ملابس", "شتوي", "مقاس كبير", "حالة: ممتازة"].map((chip) => (
                    <span
                      key={chip}
                      className="rounded-full bg-white/80 px-2.5 py-1 text-micro font-semibold text-ink-800 ring-1 ring-ink-900/10"
                    >
                      {chip}
                    </span>
                  ))}
                </div>
              </div>
            </Reveal>

            <Reveal className="order-1 lg:order-2" delay={120}>
              <h2 className="font-display text-display font-extrabold text-balance text-ink-900">
                صورة واحدة تكفي. الباقي علينا.
              </h2>
              <p className="mt-6 text-lead text-pretty text-ink-700/85">
                أكبر عائق أمام التبرع العيني ليس الرغبة، بل الجهد: التصنيف،
                الوصف، البحث عن جهة تستلم. نقلنا هذا العبء كله إلى النظام.
              </p>

              <ul className="mt-9 flex flex-col gap-4">
                {aiPoints.map((point) => (
                  <li key={point} className="flex items-start gap-3.5">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                      <Check size={13} strokeWidth={3} />
                    </span>
                    <span className="text-pretty text-ink-800">{point}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-10 flex flex-wrap items-center gap-4">
                <ButtonLink href="/donate" variant="primary" size="lg">
                  جرّبها على قطعة واحدة
                </ButtonLink>
                <ButtonLink href="/how-it-works" variant="ghost" size="lg">
                  تفاصيل أعمق
                </ButtonLink>
              </div>
            </Reveal>
          </div>
        </Container>
      </Section>

      {/* ==================== IMPACT ==================== */}
      <Section pad="bottom">
        <Container width="wide">
          <Reveal>
            <div className="relative isolate overflow-hidden rounded-2xl bg-ink-900 px-6 py-14 md:rounded-3xl md:px-12 md:py-20">
              <span
                aria-hidden
                className="grain-layer pointer-events-none absolute inset-0 -z-10"
              />
              <span
                aria-hidden
                className="glow-gold pointer-events-none absolute -top-40 end-0 -z-10 h-[32rem] w-[32rem]"
              />

              <SectionHeading
                tone="light"
                title="كل رقم هنا كان قطعة كادت أن تُرمى"
                lead="نحدّث هذه الأرقام شهرياً من قاعدة بيانات المنصة، لا من تقديرات."
                className="mb-12"
              />
              <StatBand items={stats} tone="ink" />
            </div>
          </Reveal>
        </Container>
      </Section>

      {/* ==================== ROLES ==================== */}
      <Section pad="bottom">
        <Container width="wide">
          <SectionHeading
            title="أربعة أدوار تصنع الدورة الكاملة"
            lead="اختر دورك عند التسجيل، وستجد لوحة تحكم مبنية لاحتياجك تحديداً — لا واجهة واحدة تصلح للجميع."
            className="mb-12"
          />

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {roles.map((role, i) => (
              <Reveal key={role.title} delay={i * 90}>
                <article className="group flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-sand-200/80 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                  <Photo
                    src={role.image}
                    alt={role.title}
                    ratio="3/2"
                    shape="soft"
                    zoom
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="rounded-none"
                  />
                  <div className="flex flex-1 flex-col p-6">
                    <IconTile tone="brand">
                      <role.icon size={19} strokeWidth={1.75} />
                    </IconTile>
                    <h3 className="mt-4 font-display text-h3 font-bold text-ink-900">
                      {role.title}
                    </h3>
                    <ul className="mt-4 flex flex-1 flex-col gap-2.5">
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
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      {/* ==================== TESTIMONIALS ==================== */}
      <Section pad="bottom">
        <Container width="wide">
          <SectionHeading
            title="ثلاث شهادات، ثلاث زوايا مختلفة"
            className="mb-12"
          />
          <div className="grid gap-5 md:grid-cols-3">
            {testimonials.map((item, i) => (
              <Reveal key={item.name} delay={i * 110} className="h-full">
                <Testimonial
                  {...item}
                  tone={i === 1 ? "ink" : "white"}
                  className="h-full"
                />
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      {/* ==================== FAQ TEASER ==================== */}
      <Section pad="bottom">
        <Container width="wide">
          <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
            <div className="lg:sticky lg:top-28 lg:self-start">
              <h2 className="font-display text-h1 font-extrabold text-balance text-ink-900">
                قبل أن تسجّل، هذه أربع إجابات مباشرة
              </h2>
              <p className="mt-5 text-pretty text-ink-700/85">
                إن بقي سؤال، فريقنا يجيب عليه فعلاً — لا روبوت محادثة.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <ButtonLink href="/faq" variant="outline">
                  كل الأسئلة
                </ButtonLink>
                <ButtonLink href="/contact" variant="ghost">
                  <Users size={16} />
                  اسألنا مباشرة
                </ButtonLink>
              </div>
            </div>

            <Reveal>
              <Accordion items={faqs} defaultOpenIndex={0} />
            </Reveal>
          </div>
        </Container>
      </Section>

      {/* ==================== CLOSING CTA ==================== */}
      <Section pad="bottom">
        <Container width="wide">
          <CtaPanel
            title="عندك قطعة واحدة زائدة؟ ابدأ بها."
            body="لا تنتظر حتى تجمع صندوقاً كاملاً. قطعة واحدة صالحة تعني طفلاً يدفأ، أو طالباً يدرس على طاولة. سجّل مجاناً واختر دورك في دقيقتين."
            primary={{ label: "أنشئ حسابك مجاناً", href: "/auth/register" }}
            secondary={{ label: "كيف تعمل المنصة", href: "/how-it-works" }}
            image={{
              src: "/images/furniture-chair.jpg",
              alt: "كرسي بحالة جيدة جاهز للتبرع",
            }}
          />
        </Container>
      </Section>
    </>
  );
}
