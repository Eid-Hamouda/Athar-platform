"use client";

import * as React from "react";
import Link from "next/link";
import {
  Sparkles,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Package,
  ArrowLeft,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import { cn, stripCoordinatesPrefix } from "@/lib/utils";
import { Container, Section } from "@/components/ui/Section";
import { Card, IconTile } from "@/components/ui/Card";
import { Badge, UrgencyBadge } from "@/components/ui/Badge";
import { buttonClass, ButtonLink } from "@/components/ui/Button";
import { LoadingState, EmptyState, Alert } from "@/components/ui/Feedback";
import { Photo } from "@/components/ui/Photo";
import { Reveal } from "@/components/ui/Reveal";
import type { NeedRequest } from "@/types";

interface Match {
  id: string;
  title: string;
  condition?: string;
  location: string;
  imageUrl?: string;
  score: number;
  reasons: string[];
}

export default function SmartMatchingPage() {
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [need, setNeed] = React.useState<NeedRequest | null>(null);
  const [matches, setMatches] = React.useState<Match[]>([]);

  React.useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          throw new Error("سجّل الدخول أولاً لعرض المطابقات الذكية.");
        }

        // Needs are created with status "pending" and stay so until covered.
        const { data: needData, error: needError } = await supabase
          .from("needs")
          .select("*")
          .eq("beneficiary_id", user.id)
          .eq("status", "pending")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (needError) throw needError;
        if (!active) return;

        if (!needData) {
          setIsLoading(false);
          return;
        }

        setNeed(needData);

        const { data: donationsData, error: donationsError } = await supabase
          .from("donations")
          .select("*")
          .eq("status", "available");

        if (donationsError) throw donationsError;
        if (!active) return;

        const scored = (donationsData ?? [])
          .filter((donation) => {
            const category = donation.category ?? "";
            const sub = donation.sub_category ?? "";
            const wanted = needData.category ?? "";
            return (
              category.includes(wanted) ||
              wanted.includes(category) ||
              sub.includes(wanted)
            );
          })
          .map((donation) => {
            const reasons: string[] = ["تطابق الفئة"];
            let score = 70;

            if (donation.condition === "ممتازة") {
              score += 25;
              reasons.push("حالة ممتازة");
            } else if (donation.condition === "جيدة جداً") {
              score += 15;
              reasons.push("حالة جيدة جداً");
            }

            if (
              needData.sub_category &&
              donation.sub_category &&
              donation.sub_category.includes(needData.sub_category)
            ) {
              score += 5;
              reasons.push("تطابق التصنيف الفرعي");
            }

            return {
              id: donation.id,
              title: donation.title,
              condition: donation.condition ?? undefined,
              location:
                stripCoordinatesPrefix(donation.location) || "الموقع غير محدد",
              imageUrl: donation.image_url ?? undefined,
              score: Math.min(score, 100),
              reasons,
            };
          })
          .sort((a, b) => b.score - a.score);

        setMatches(scored);
      } catch (err) {
        if (!active) return;
        setError(
          err instanceof Error ? err.message : "تعذّر جلب المطابقات."
        );
      } finally {
        if (active) setIsLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, []);

  /* ---------------- States ---------------- */

  if (isLoading) {
    return (
      <Section>
        <Container width="wide">
          <LoadingState label="نحلّل طلبك ونبحث عن أفضل المطابقات…" />
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
              اقتراحات مبنية على طلبك النشط
            </h1>
            <p className="mt-5 text-lead text-pretty text-sand-200/80">
              نرتّب المعروضات المتاحة بحسب مطابقتها لفئة طلبك وحالة القطعة، فتصل
              إلى الأنسب دون أن تتصفّح الكاتالوج كاملاً.
            </p>
          </div>
        </div>
      </Container>

      <Section>
        <Container width="wide">
          {!need ? (
            <EmptyState
              icon={Sparkles}
              title="لا يوجد طلب نشط"
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
              {/* ---------- Active need ---------- */}
              <Card padding="lg" className="mb-10">
                <div className="flex flex-wrap items-start justify-between gap-6">
                  <div className="flex items-start gap-4">
                    <IconTile tone="gold" size="lg">
                      <Package size={23} strokeWidth={1.75} />
                    </IconTile>
                    <div>
                      <p className="text-small font-semibold text-ink-700/70">
                        طلبك النشط الحالي
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

              {/* ---------- Matches ---------- */}
              {matches.length === 0 ? (
                <EmptyState
                  icon={Sparkles}
                  title="لا مطابقات دقيقة بعد"
                  body="لم نجد قطعة تطابق فئة طلبك حتى الآن. سنبقي الطلب مفتوحاً ونشعرك فور توفّر قطعة مناسبة."
                  action={
                    <Link
                      href="/catalog"
                      className={buttonClass({ variant: "outline" })}
                    >
                      تصفّح الكاتالوج كاملاً
                    </Link>
                  }
                />
              ) : (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {matches.map((match, i) => (
                    <Reveal key={match.id} delay={Math.min(i, 8) * 70}>
                      <Card padding="none" className="flex h-full flex-col overflow-hidden">
                        <div className="relative">
                          <Photo
                            src={match.imageUrl || "/placeholder-item.svg"}
                            alt={match.title}
                            ratio="4/3"
                            shape="soft"
                            sizes="(max-width: 640px) 100vw, 33vw"
                            className="rounded-none"
                          />
                          <div className="absolute top-3 end-3">
                            <ScoreRing score={match.score} />
                          </div>
                        </div>

                        <div className="flex flex-1 flex-col p-5">
                          <h3 className="font-display text-h4 font-bold text-ink-900">
                            {match.title}
                          </h3>

                          <div className="mt-3 flex flex-col gap-2 text-small text-ink-700/80">
                            {match.condition && (
                              <p className="flex items-center gap-2">
                                <CheckCircle2
                                  size={14}
                                  className="shrink-0 text-brand-500"
                                />
                                الحالة: {match.condition}
                              </p>
                            )}
                            <p className="flex items-center gap-2">
                              <MapPin
                                size={14}
                                className="shrink-0 text-sand-500"
                              />
                              <span className="truncate">{match.location}</span>
                            </p>
                          </div>

                          <div className="mt-5">
                            <p className="text-micro font-bold text-ink-700/60">
                              لماذا نقترحها؟
                            </p>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {match.reasons.map((reason) => (
                                <span
                                  key={reason}
                                  className="rounded-full bg-sand-100 px-2.5 py-1 text-micro font-semibold text-ink-700 ring-1 ring-sand-200"
                                >
                                  {reason}
                                </span>
                              ))}
                            </div>
                          </div>

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
                    </Reveal>
                  ))}
                </div>
              )}
            </>
          )}
        </Container>
      </Section>
    </>
  );
}

/* -------------------------------------------------------------------------- */

/** Match confidence as a conic-gradient ring. */
function ScoreRing({ score }: { score: number }) {
  const strong = score >= 90;
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
