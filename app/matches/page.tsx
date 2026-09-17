"use client";

import * as React from "react";
import Link from "next/link";
import {
  Sparkles,
  MapPin,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Package,
  ArrowLeft,
  Navigation,
  BellRing,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import { cn, stripCoordinatesPrefix } from "@/lib/utils";
import { formatDistanceAr } from "@/lib/geo";
import {
  findMatchesForNeedsAction,
  type DonationMatch,
  type NeedMatchGroup,
} from "@/app/actions/matchingActions";
import { Container, Section } from "@/components/ui/Section";
import { Card, IconTile } from "@/components/ui/Card";
import { Badge, UrgencyBadge } from "@/components/ui/Badge";
import { buttonClass, ButtonLink } from "@/components/ui/Button";
import { LoadingState, EmptyState, Alert } from "@/components/ui/Feedback";
import { Photo } from "@/components/ui/Photo";
import { Reveal } from "@/components/ui/Reveal";

export default function SmartMatchingPage() {
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [groups, setGroups] = React.useState<NeedMatchGroup[]>([]);

  React.useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          throw new Error("سجّل الدخول أولاً لعرض المطابقات الذكية.");
        }

        // Ranking happens server-side: the model key stays off the client, and
        // the catalogue is scored where it already lives instead of being
        // shipped to the browser first.
        const result = await findMatchesForNeedsAction(session.access_token);
        if (!active) return;

        if (result.error) throw new Error(result.error);
        setGroups(result.groups);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "تعذّر جلب المطابقات.");
      } finally {
        if (active) setIsLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, []);

  const totalMatches = groups.reduce(
    (sum, group) => sum + group.matches.length,
    0
  );
  const degraded = groups.some(
    (group) => group.matches.length > 0 && !group.aiReranked
  );

  /* ---------------- States ---------------- */

  if (isLoading) {
    return (
      <Section>
        <Container width="wide">
          <LoadingState label="نحلّل طلباتك ونبحث عن أفضل المطابقات…" />
        </Container>
      </Section>
    );
  }

  if (error) {
    return (
      <Section>
        <Container width="narrow">
          <Alert tone="danger" icon={AlertCircle} title="تعذّر إكمال العملية">
            {error}
          </Alert>
          <ButtonLink href="/auth/login" variant="primary" className="mt-6">
            تسجيل الدخول
          </ButtonLink>
        </Container>
      </Section>
    );
  }

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
            className="glow-gold pointer-events-none absolute -top-52 end-1/4 -z-10 h-[36rem] w-[36rem]"
          />

          <div className="max-w-2xl animate-rise">
            <h1 className="font-display text-display font-extrabold text-balance text-sand-50">
              اقتراحات مبنية على طلباتك المفتوحة
            </h1>
            <p className="mt-5 text-lead text-pretty text-sand-200/80">
              نقرأ تفاصيل كل طلب ووصف كل قطعة معروضة، ونرتّبها بحسب ما يلبّي
              احتياجك فعلاً وقربه من موقع التسليم — لا بحسب تطابق الأسماء.
            </p>

            {groups.length > 0 && (
              <p className="mt-6 text-small font-semibold text-sand-200/70">
                {groups.length === 1
                  ? "طلب واحد مفتوح"
                  : `${groups.length} طلبات مفتوحة`}
                {totalMatches > 0 && ` · ${totalMatches} قطعة مقترحة`}
              </p>
            )}
          </div>
        </div>
      </Container>

      <Section>
        <Container width="wide">
          {groups.length === 0 ? (
            <EmptyState
              icon={Sparkles}
              title="لا توجد طلبات مفتوحة"
              body="أضف طلب احتياج من لوحة التحكم، وسنبحث لك عن أقرب المعروضات المطابقة له تلقائياً."
              action={
                <Link
                  href="/dashboard"
                  className={buttonClass({ variant: "primary" })}
                >
                  أضف طلب احتياج
                </Link>
              }
            />
          ) : (
            <>
              {/* The ranking is honest about which engine produced it rather
                  than presenting a fallback ordering as a full analysis. */}
              {degraded && (
                <Alert
                  tone="warning"
                  icon={AlertTriangle}
                  title="ترتيب مبدئي"
                  className="mb-10"
                >
                  خدمة التحليل المفصّل غير متاحة حالياً لبعض الطلبات، والترتيب
                  المعروض لها مبني على التشابه والموقع فقط. حدّث الصفحة بعد قليل
                  للحصول على تقييم كامل.
                </Alert>
              )}

              <div className="flex flex-col gap-14">
                {groups.map((group) => (
                  <NeedSection key={group.need.id} group={group} />
                ))}
              </div>
            </>
          )}
        </Container>
      </Section>
    </>
  );
}

/* -------------------------------------------------------------------------- */

/** One open request and everything ranked against it. */
function NeedSection({ group }: { group: NeedMatchGroup }) {
  const { need, matches } = group;

  return (
    <section>
      <Card padding="lg" className="mb-6">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            <IconTile tone="gold" size="lg">
              <Package size={23} strokeWidth={1.75} />
            </IconTile>
            <div>
              <p className="text-small font-semibold text-ink-700/70">
                طلب مفتوح
              </p>
              <h2 className="mt-1 font-display text-h2 font-extrabold text-ink-900">
                {need.title}
              </h2>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge variant="neutral">{need.category}</Badge>
                {need.sub_category && (
                  <Badge variant="neutral">{need.sub_category}</Badge>
                )}
                <UrgencyBadge urgency={need.urgency} />
              </div>
            </div>
          </div>

          {matches.length > 0 && (
            <div className="rounded-2xl bg-brand-50 px-5 py-4 ring-1 ring-brand-100">
              <p className="font-display text-h2 font-extrabold tabular-nums text-brand-700">
                {matches.length}
              </p>
              <p className="mt-0.5 text-small font-semibold text-brand-800">
                قطعة قد تناسب طلبك
              </p>
            </div>
          )}
        </div>
      </Card>

      {matches.length === 0 ? (
        // Deliberately not a dead end: nothing suitable exists *yet*, and the
        // platform now says what happens next rather than leaving them to keep
        // checking back.
        <div className="rounded-2xl bg-sand-100 p-6 ring-1 ring-sand-200">
          <p className="flex items-center gap-2 font-semibold text-ink-900">
            <BellRing size={16} className="shrink-0 text-gold-600" />
            لا مطابقات مناسبة بعد — وسنُعلمك فور وصولها
          </p>
          <p className="mt-2 text-small leading-relaxed text-ink-700/80">
            راجعنا كل القطع المتاحة ولم نجد ما يلبّي هذا الطلب فعلاً، ونفضّل ألا
            نقترح قطعة غير مناسبة. يبقى طلبك مفتوحاً، وكلما نُشر تبرّع جديد
            يطابقه سيصلك تنبيه في لوحة التحكم.
          </p>
          <Link
            href="/catalog"
            className={cn(buttonClass({ variant: "outline" }), "mt-5")}
          >
            تصفّح الكاتالوج كاملاً
          </Link>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {matches.map((match, i) => (
            <Reveal key={match.donation.id} delay={Math.min(i, 8) * 70}>
              <MatchCard match={match} />
            </Reveal>
          ))}
        </div>
      )}
    </section>
  );
}

function MatchCard({ match }: { match: DonationMatch }) {
  const { donation } = match;
  const location =
    stripCoordinatesPrefix(donation.location) || "الموقع غير محدد";

  return (
    <Card padding="none" className="flex h-full flex-col overflow-hidden">
      <div className="relative">
        <Photo
          src={donation.image_url || "/placeholder-item.svg"}
          alt={donation.title}
          ratio="4/3"
          shape="soft"
          sizes="(max-width: 640px) 100vw, 33vw"
          className="rounded-none"
        />
        <div className="absolute top-3 end-3">
          <ScoreRing score={match.score} />
        </div>
        <div className="absolute bottom-3 start-3">
          <Badge variant={match.verdict === "مطابق تماماً" ? "brand" : "ink"}>
            {match.verdict}
          </Badge>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-h4 font-bold text-ink-900">
          {donation.title}
        </h3>

        <div className="mt-3 flex flex-col gap-2 text-small text-ink-700/80">
          {donation.condition && (
            <p className="flex items-center gap-2">
              <CheckCircle2 size={14} className="shrink-0 text-brand-500" />
              الحالة: {donation.condition}
            </p>
          )}
          <p className="flex items-center gap-2">
            <MapPin size={14} className="shrink-0 text-sand-500" />
            <span className="truncate">{location}</span>
          </p>
          {/* Only shown when both sides actually carry coordinates. */}
          {match.distanceKm !== null && (
            <p className="flex items-center gap-2 font-semibold text-brand-700">
              <Navigation size={14} className="shrink-0" />
              يبعد {formatDistanceAr(match.distanceKm)} عن موقع التسليم
            </p>
          )}
        </div>

        {match.reasons.length > 0 && (
          <div className="mt-5">
            <p className="text-micro font-bold text-ink-700/60">
              لماذا نقترحها؟
            </p>
            <ul className="mt-2 flex flex-col gap-1.5">
              {match.reasons.map((reason) => (
                <li
                  key={reason}
                  className="flex items-start gap-1.5 text-micro leading-relaxed text-ink-700"
                >
                  <CheckCircle2
                    size={12}
                    className="mt-0.5 shrink-0 text-brand-500"
                  />
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Reservations are shown as prominently as the reasons — a suggestion
            that hides its own caveats costs the beneficiary a wasted delivery. */}
        {match.concerns.length > 0 && (
          <div className="mt-4 rounded-xl bg-gold-50 p-3 ring-1 ring-gold-200">
            <p className="text-micro font-bold text-gold-900">
              انتبه قبل الطلب
            </p>
            <ul className="mt-1.5 flex flex-col gap-1">
              {match.concerns.map((concern) => (
                <li
                  key={concern}
                  className="flex items-start gap-1.5 text-micro leading-relaxed text-gold-900/90"
                >
                  <AlertTriangle size={12} className="mt-0.5 shrink-0" />
                  <span>{concern}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <Link
          href="/dashboard"
          className={cn(
            buttonClass({ variant: "primary", full: true }),
            "mt-6"
          )}
        >
          اطلب هذه القطعة
          <ArrowLeft
            size={16}
            className="transition-transform duration-300 group-hover/btn:-translate-x-1"
          />
        </Link>
      </div>
    </Card>
  );
}

/** Match confidence as a conic-gradient ring. */
function ScoreRing({ score }: { score: number }) {
  const strong = score >= 80;
  return (
    <div
      className="flex h-14 w-14 items-center justify-center rounded-full shadow-md"
      style={{
        background: `conic-gradient(${
          strong ? "var(--color-brand-500)" : "var(--color-gold-400)"
        } ${score}%, rgba(253,251,247,0.55) 0)`,
      }}
      role="img"
      aria-label={`نسبة التطابق ${score} بالمئة`}
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white">
        <span className="font-display text-small font-extrabold tabular-nums text-ink-900">
          {score}%
        </span>
      </span>
    </div>
  );
}
