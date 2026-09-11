"use client";

import * as React from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  Search,
  SlidersHorizontal,
  MapPin,
  Package,
  HeartHandshake,
  ArrowLeft,
  Boxes,
  Hash,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import { cn, stripCoordinatesPrefix } from "@/lib/utils";
import { donationService } from "@/services/donation.service";
import type { ExpressDonation } from "@/types/api";
import { Container, Section } from "@/components/ui/Section";
import { Badge, StatusBadge, UrgencyBadge } from "@/components/ui/Badge";
import { ItemCard } from "@/components/ui/ItemCard";
import { Card, IconTile } from "@/components/ui/Card";
import { buttonClass } from "@/components/ui/Button";
import { LoadingState, EmptyState } from "@/components/ui/Feedback";
import { Rail } from "@/components/ui/Rail";
import { Reveal } from "@/components/ui/Reveal";

type Tab = "donation" | "need";

interface CatalogDonation {
  id: string;
  title: string;
  category: string;
  subCategory?: string;
  condition?: string;
  description: string;
  location: string;
  imageUrl?: string;
  status: string;
}

interface CatalogNeed {
  id: string;
  title: string;
  category: string;
  subCategory?: string;
  urgency?: string;
  quantity: number;
  description: string;
  location: string;
}

const ALL = "الكل";

function expressLocationLabel(location: ExpressDonation["location"]) {
  if (typeof location === "string" || !location) return "الموقع غير محدد";
  return [location.city, location.area].filter(Boolean).join(" - ") || "الموقع غير محدد";
}

function expressCategoryLabel(category: ExpressDonation["category"]) {
  if (typeof category === "string" || !category) return "غير مصنّف";
  return category.nameAr || category.name;
}

function toCatalogDonation(donation: ExpressDonation): CatalogDonation {
  return {
    id: donation._id,
    title: donation.title,
    category: expressCategoryLabel(donation.category),
    condition: donation.condition === "new" ? "جديدة" : "مستعملة",
    description: donation.description || "لا يوجد وصف إضافي لهذه القطعة.",
    location: expressLocationLabel(donation.location),
    imageUrl: donation.images[0]?.url,
    status: donation.status,
  };
}

/** Categories come from free text and the classifier, so match loosely. */
function matchesCategory(value: string | undefined, filter: string) {
  if (filter === ALL) return true;
  if (!value) return false;
  return value.includes(filter) || filter.includes(value);
}

export default function CatalogPage() {
  const [donations, setDonations] = React.useState<CatalogDonation[]>([]);
  const [needs, setNeeds] = React.useState<CatalogNeed[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [tab, setTab] = React.useState<Tab>("donation");
  const [query, setQuery] = React.useState("");
  const [category, setCategory] = React.useState(ALL);

  React.useEffect(() => {
    let active = true;

    const load = async () => {
      const [donationsResult, needsResult] = await Promise.all([
        donationService
          .list({ status: "available", limit: 60 })
          .catch(() => null),
        supabase
          .from("needs")
          .select("*")
          .eq("status", "pending")
          .order("created_at", { ascending: false }),
      ]);

      if (!active) return;

      if (!donationsResult || needsResult.error) {
        toast.error("تعذّر جلب البيانات من الخادم. حاول تحديث الصفحة.");
      }

      setDonations((donationsResult?.donations ?? []).map(toCatalogDonation));

      setNeeds(
        (needsResult.data ?? []).map((n) => ({
          id: n.id,
          title: n.title,
          category: n.category,
          subCategory: n.sub_category ?? undefined,
          urgency: n.urgency ?? undefined,
          quantity: n.quantity ?? 1,
          description: n.description || "لا توجد تفاصيل إضافية لهذا الطلب.",
          location:
            stripCoordinatesPrefix(n.delivery_location) || "الموقع غير محدد",
        }))
      );

      setIsLoading(false);
    };

    load();
    return () => {
      active = false;
    };
  }, []);

  // The classifier invents categories, so the chips are built from whatever
  // is actually in the data. A hardcoded list would hide any item whose
  // category the model worded differently.
  const categoryOptions = React.useMemo(() => {
    const present = new Set<string>();
    for (const row of [...donations, ...needs]) {
      const value = row.category?.trim();
      if (value) present.add(value);
    }
    return [ALL, ...[...present].sort((a, b) => a.localeCompare(b, "ar"))];
  }, [donations, needs]);

  const term = query.trim().toLowerCase();

  const visibleDonations = donations.filter(
    (d) =>
      matchesCategory(d.category, category) &&
      (!term ||
        d.title.toLowerCase().includes(term) ||
        d.description.toLowerCase().includes(term))
  );

  const visibleNeeds = needs.filter(
    (n) =>
      matchesCategory(n.category, category) &&
      (!term ||
        n.title.toLowerCase().includes(term) ||
        n.description.toLowerCase().includes(term))
  );

  const count =
    tab === "donation" ? visibleDonations.length : visibleNeeds.length;

  return (
    <>
      {/* ==================== HERO + SEARCH ==================== */}
      <Container width="wide" className="pt-4">
        <div className="relative isolate overflow-hidden rounded-2xl bg-ink-900 px-6 py-14 md:rounded-3xl md:px-14 md:py-16">
          <span
            aria-hidden
            className="grain-layer pointer-events-none absolute inset-0 -z-10"
          />
          <span
            aria-hidden
            className="glow-brand animate-sheen pointer-events-none absolute -top-56 start-1/3 -z-10 h-[42rem] w-[42rem] -translate-x-1/2"
          />

          <div className="max-w-2xl animate-rise">
            <h1 className="font-display text-display font-extrabold text-balance text-sand-50">
              معروضات جاهزة، واحتياجات تنتظر
            </h1>
            <p className="mt-5 text-lead text-pretty text-sand-200/80">
              تصفّح ما تبرّع به الناس فعلاً، أو انظر في الطلبات المفتوحة واختر
              واحداً تغطّيه اليوم. القائمة تُحدَّث لحظياً.
            </p>
          </div>

          {/* Search sits on the panel, half-overlapping the content below. */}
          <div className="glass mt-10 flex flex-col gap-3 rounded-2xl p-3 shadow-xl sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search
                size={18}
                className="pointer-events-none absolute inset-y-0 start-4 my-auto text-sand-500"
              />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ابحث عن معطف، طاولة، كتب مدرسية…"
                className="h-12 w-full rounded-xl bg-white/70 ps-12 pe-4 text-sm text-ink-900 outline-none ring-1 ring-inset ring-white/60 transition-all placeholder:text-sand-500 focus:bg-white focus:ring-2 focus:ring-brand-500"
                aria-label="ابحث في المعروضات والطلبات"
              />
            </div>

            <div className="flex rounded-xl bg-white/60 p-1 ring-1 ring-inset ring-white/60">
              {(
                [
                  { id: "donation", label: "المعروضات", n: donations.length },
                  { id: "need", label: "الطلبات", n: needs.length },
                ] as const
              ).map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setTab(option.id)}
                  className={cn(
                    "flex-1 rounded-lg px-5 py-2.5 text-sm font-semibold whitespace-nowrap transition-all",
                    tab === option.id
                      ? "bg-ink-900 text-sand-50 shadow-sm"
                      : "text-ink-700 hover:text-ink-900",
                  )}
                >
                  {option.label}
                  <span className="ms-1.5 tabular-nums opacity-60">
                    {option.n}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </Container>

      {/* ==================== FILTER CHIPS ==================== */}
      {/* Only ALL is present until data loads, and a lone chip is just noise. */}
      {categoryOptions.length > 1 && (
        <Section space="sm" pad="top">
          <Container width="wide">
            <div className="flex items-center gap-3">
              <span className="hidden items-center gap-2 text-small font-semibold text-ink-700 sm:flex">
                <SlidersHorizontal size={15} />
                الفئات
              </span>
              <Rail bleed={false} className="snap-none pb-0">
                {categoryOptions.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setCategory(item)}
                    className={cn(
                      "shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-all",
                      category === item
                        ? "bg-brand-600 text-white shadow-sm"
                        : "bg-sand-100 text-ink-700 ring-1 ring-sand-200 hover:bg-white hover:ring-sand-300",
                    )}
                  >
                    {item}
                  </button>
                ))}
              </Rail>
            </div>
          </Container>
        </Section>
      )}

      {/* ==================== RESULTS ==================== */}
      <Section pad="bottom" className="pt-8">
        <Container width="wide">
          {isLoading ? (
            <LoadingState label="جاري جلب المعروضات والطلبات…" />
          ) : (
            <>
              <p className="mb-7 text-small text-ink-700/75">
                <span className="font-bold text-ink-900 tabular-nums">
                  {count}
                </span>{" "}
                {tab === "donation" ? "قطعة متاحة" : "طلب مفتوح"}
                {category !== ALL && ` في فئة «${category}»`}
                {term && ` تطابق «${query.trim()}»`}
              </p>

              {tab === "donation" ? (
                visibleDonations.length > 0 ? (
                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {visibleDonations.map((item, i) => (
                      <Reveal key={item.id} delay={Math.min(i, 8) * 60}>
                        <ItemCard
                          title={item.title}
                          description={item.description}
                          category={item.category}
                          subCategory={item.subCategory}
                          condition={item.condition}
                          location={item.location}
                          imageUrl={item.imageUrl}
                          status={<StatusBadge status={item.status} />}
                          footer={
                            <Link
                              href="/dashboard"
                              className={buttonClass({
                                variant: "primary",
                                full: true,
                              })}
                            >
                              اطلب هذه القطعة
                              <ArrowLeft
                                size={16}
                                className="transition-transform duration-300 group-hover/btn:-translate-x-1"
                              />
                            </Link>
                          }
                        />
                      </Reveal>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={Package}
                    title="لا توجد قطع مطابقة"
                    body="جرّب فئة أخرى أو أزل كلمة البحث. المعروضات تتغيّر يومياً، فعد لاحقاً."
                    action={
                      <Link
                        href="/donate"
                        className={buttonClass({ variant: "primary" })}
                      >
                        كن أول من يتبرّع
                      </Link>
                    }
                  />
                )
              ) : visibleNeeds.length > 0 ? (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {visibleNeeds.map((need, i) => (
                    <Reveal key={need.id} delay={Math.min(i, 8) * 60}>
                      <Card padding="lg" className="flex h-full flex-col">
                        <div className="flex items-start justify-between gap-3">
                          <IconTile tone="gold">
                            <HeartHandshake size={19} strokeWidth={1.75} />
                          </IconTile>
                          <UrgencyBadge urgency={need.urgency} />
                        </div>

                        <h3 className="mt-5 font-display text-h3 font-bold text-ink-900">
                          {need.title}
                        </h3>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <Badge variant="neutral">{need.category}</Badge>
                          {need.subCategory && (
                            <Badge variant="neutral">{need.subCategory}</Badge>
                          )}
                          <Badge variant="brand">
                            <Hash size={11} />
                            الكمية {need.quantity}
                          </Badge>
                        </div>

                        <p className="mt-4 line-clamp-3 grow text-small leading-relaxed text-ink-700/80">
                          {need.description}
                        </p>

                        <p className="mt-5 flex items-center gap-2 text-small text-ink-700/75">
                          <MapPin
                            size={14}
                            className="shrink-0 text-sand-500"
                          />
                          <span className="truncate">{need.location}</span>
                        </p>

                        <Link
                          href="/dashboard"
                          className={cn(
                            buttonClass({ variant: "dark", full: true }),
                            "mt-5",
                          )}
                        >
                          غطِّ هذا الطلب
                          <ArrowLeft
                            size={16}
                            className="transition-transform duration-300 group-hover/btn:-translate-x-1"
                          />
                        </Link>
                      </Card>
                    </Reveal>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Boxes}
                  title="لا طلبات مفتوحة الآن"
                  body="كل الطلبات المسجّلة تمّت تغطيتها. يمكنك التبرع للكاتالوج ليجدها المستفيدون جاهزة."
                  action={
                    <Link
                      href="/donate"
                      className={buttonClass({ variant: "primary" })}
                    >
                      تبرّع للكاتالوج
                    </Link>
                  }
                />
              )}
            </>
          )}
        </Container>
      </Section>
    </>
  );
}
