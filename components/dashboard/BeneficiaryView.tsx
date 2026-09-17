"use client";

import * as React from "react";
import Image from "next/image";
import {
  Plus,
  ShoppingBag,
  MapPin,
  Trash2,
  Package,
  HeartHandshake,
  ExternalLink,
  Phone,
  CheckCircle2,
  Hash,
  Sparkles,
  Search,
  Store,
  BellRing,
  Clock,
} from "lucide-react";

import type {
  UserProfile,
  DonationItem,
  NeedRequest,
  NewNeedForm,
  MatchNotification,
} from "@/types";
import { cn, stripCoordinatesPrefix } from "@/lib/utils";
import MapPicker from "@/components/MapPicker";
import { Modal } from "@/components/ui/Modal";
import { IconTile } from "@/components/ui/Card";
import { Badge, StatusBadge, UrgencyBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea, Field } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/Feedback";
import {
  PageHeader,
  Surface,
  Toolbar,
  ActionChip,
} from "@/components/dashboard/ui/Layout";
import {
  DataTable,
  THead,
  TBody,
  TR,
  TH,
  TD,
  TableEmpty,
  CellStack,
  IconButton,
} from "@/components/dashboard/ui/Table";

interface BeneficiaryViewProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  profile: UserProfile | null;
  notifications: MatchNotification[];
  donations: DonationItem[];
  needs: NeedRequest[];
  cart: DonationItem[];
  newNeed: NewNeedForm;
  setNewNeed: React.Dispatch<React.SetStateAction<NewNeedForm>>;
  deliveryAddress: string;
  setDeliveryAddress: (address: string) => void;
  deliveryLocation: string;
  setDeliveryLocation: (loc: string) => void;
  contactPhone: string;
  setContactPhone: (phone: string) => void;
  handleCreateNeed: (e: React.FormEvent) => void;
  handleAddToCart: (item: DonationItem) => void;
  handleRemoveFromCart: (id: string) => void;
  handleBulkSubmit: (e: React.FormEvent) => void;
  isAddNeedModalOpen: boolean;
  setIsAddNeedModalOpen: (v: boolean) => void;
  isSubmitting: boolean;
}

const ALL = "الكل";

function mapsHref(query: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

/* -------------------------------------------------------------------------- */
/* Compact catalogue tile — a grid is right here, since the choice is visual  */
/* -------------------------------------------------------------------------- */

function ItemTile({
  item,
  inCart,
  onAdd,
}: {
  item: DonationItem;
  inCart: boolean;
  onAdd: () => void;
}) {
  const clean = stripCoordinatesPrefix(item.location);

  return (
    <article className="flex flex-col overflow-hidden rounded-xl bg-white ring-1 ring-sand-200 transition-shadow hover:shadow-md">
      <div className="relative aspect-[4/3] bg-sand-100">
        <Image
          src={item.image_url || "/placeholder-item.svg"}
          alt={item.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
          className="object-cover"
        />
        {item.category && (
          <span className="absolute top-2 start-2 rounded-md bg-white/90 px-2 py-1 text-micro font-bold text-ink-900 backdrop-blur-sm">
            {item.category}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="truncate text-sm font-bold text-ink-900" title={item.title}>
          {item.title}
        </h3>

        <div className="mt-2 flex flex-wrap gap-1.5">
          {item.sub_category && (
            <Badge variant="neutral">{item.sub_category}</Badge>
          )}
          {item.condition && <Badge variant="gold">{item.condition}</Badge>}
        </div>

        {item.description && (
          <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-ink-700/75">
            {item.description}
          </p>
        )}

        <div className="mt-auto pt-4">
          <p className="mb-3 flex items-center gap-1.5 text-xs text-ink-700/70">
            <MapPin size={12} className="shrink-0 text-sand-500" />
            <span className="truncate">{clean || "الموقع غير محدد"}</span>
            {clean && (
              <ActionChip
                href={mapsHref(clean)}
                target="_blank"
                rel="noopener noreferrer"
                className="ms-auto shrink-0 px-1.5 py-1"
                aria-label="افتح الموقع في الخرائط"
              >
                <ExternalLink size={11} />
              </ActionChip>
            )}
          </p>

          <Button
            variant={inCart ? "outline" : "dark"}
            size="sm"
            full
            disabled={inCart}
            onClick={onAdd}
          >
            {inCart ? (
              <>
                <CheckCircle2 size={14} />
                في السلة
              </>
            ) : (
              <>
                <ShoppingBag size={14} />
                أضف للسلة
              </>
            )}
          </Button>
        </div>
      </div>
    </article>
  );
}

/* -------------------------------------------------------------------------- */

export default function BeneficiaryView({
  activeTab,
  setActiveTab,
  profile,
  notifications,
  donations,
  needs,
  cart,
  newNeed,
  setNewNeed,
  deliveryAddress,
  setDeliveryAddress,
  setDeliveryLocation,
  contactPhone,
  setContactPhone,
  handleCreateNeed,
  handleAddToCart,
  handleRemoveFromCart,
  handleBulkSubmit,
  isAddNeedModalOpen,
  setIsAddNeedModalOpen,
  isSubmitting,
}: BeneficiaryViewProps) {
  const [query, setQuery] = React.useState("");
  const [category, setCategory] = React.useState(ALL);

  const available = donations.filter((d) => d.status === "available");
  const myNeeds = needs.filter((n) => n.beneficiary_id === profile?.id);

  // Built from the data, not a fixed list: the classifier words categories
  // freely, so anything hardcoded would hide items it named differently.
  // Depends on `donations` (stable state) rather than the derived `available`.
  const categoryOptions = React.useMemo(() => {
    const present = new Set<string>();
    for (const row of donations) {
      if (row.status !== "available") continue;
      const value = row.category?.trim();
      if (value) present.add(value);
    }
    return [ALL, ...[...present].sort((a, b) => a.localeCompare(b, "ar"))];
  }, [donations]);

  const visible = available.filter((item) => {
    const term = query.trim().toLowerCase();
    const matchesCategory =
      category === ALL ||
      (item.category ?? "").includes(category) ||
      category.includes(item.category ?? "");
    const matchesTerm =
      !term ||
      (item.title ?? "").toLowerCase().includes(term) ||
      (item.description ?? "").toLowerCase().includes(term);
    return matchesCategory && matchesTerm;
  });

  // Live suggestions while the beneficiary types a category. Not memoised:
  // `available` is rebuilt every render, so a useMemo over it never actually
  // caches anything — it only adds a dependency the compiler can't preserve.
  const wantedCategory = (newNeed.category ?? "").trim();
  const suggestions =
    wantedCategory.length < 2
      ? []
      : available
          .filter(
            (d) =>
              (d.category ?? "").includes(wantedCategory) ||
              (d.sub_category ?? "").includes(wantedCategory) ||
              wantedCategory.includes(d.category ?? "")
          )
          .slice(0, 3);

  const setNeedField = <K extends keyof NewNeedForm>(
    key: K,
    value: NewNeedForm[K]
  ) => setNewNeed({ ...newNeed, [key]: value });

  return (
    <>
      {/* ==================== New need modal ==================== */}
      <Modal
        isOpen={isAddNeedModalOpen}
        onClose={() => setIsAddNeedModalOpen(false)}
        size="lg"
        icon={
          <IconTile tone="brand" size="lg">
            <Plus size={23} strokeWidth={1.75} />
          </IconTile>
        }
        title="طلب احتياج جديد"
        description="كل ما تكتبه هنا يبقى خاصاً ولا يُنشر باسمك"
      >
        <form onSubmit={handleCreateNeed} className="flex flex-col gap-6">
          <Input
            label="عنوان الاحتياج"
            required
            value={newNeed.title}
            onChange={(e) => setNeedField("title", e.target.value)}
            placeholder="مثال: طاولة دراسة لطفلين"
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="الفئة"
              required
              value={newNeed.category}
              onChange={(e) => setNeedField("category", e.target.value)}
              placeholder="أثاث، ملابس…"
            />
            <Input
              label="التصنيف الفرعي"
              required
              value={newNeed.sub_category}
              onChange={(e) => setNeedField("sub_category", e.target.value)}
              placeholder="طاولات دراسة…"
            />
          </div>

          {/* Matching items already on the platform */}
          {suggestions.length > 0 && (
            <div className="rounded-xl bg-brand-50 p-4 ring-1 ring-brand-100">
              <p className="flex items-center gap-2 text-xs font-bold text-brand-800">
                <Sparkles size={13} />
                وجدنا قطعاً متاحة قد تناسب طلبك الآن
              </p>
              <div className="mt-3 flex flex-col gap-2">
                {suggestions.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-white p-2.5 ring-1 ring-brand-100"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <Image
                        src={item.image_url || "/placeholder-item.svg"}
                        alt=""
                        width={36}
                        height={36}
                        className="h-9 w-9 shrink-0 rounded-md object-cover ring-1 ring-sand-200"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-ink-900">
                          {item.title}
                        </p>
                        <p className="mt-0.5 text-micro text-ink-700/70">
                          {item.category} · {item.condition}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        handleAddToCart(item);
                        setIsAddNeedModalOpen(false);
                        setActiveTab("cart");
                      }}
                    >
                      احجزها الآن
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              type="number"
              min={1}
              label="الكمية المطلوبة"
              required
              value={newNeed.quantity || 1}
              onChange={(e) =>
                setNeedField("quantity", parseInt(e.target.value) || 1)
              }
            />
            <Select
              label="درجة الأولوية"
              value={newNeed.urgency}
              onChange={(e) => setNeedField("urgency", e.target.value)}
            >
              <option value="عادي">عادي</option>
              <option value="عاجل">عاجل</option>
              <option value="حرج طارئ">حرج طارئ</option>
            </Select>
          </div>

          <Textarea
            label="تفاصيل الطلب"
            required
            rows={3}
            value={newNeed.description}
            onChange={(e) => setNeedField("description", e.target.value)}
            placeholder="اشرح الاحتياج ومبرّراته بإيجاز…"
          />

          <div className="rounded-xl bg-sand-100 p-4 ring-1 ring-sand-200">
            <h3 className="text-sm font-bold text-ink-900">
              التواصل والتوصيل
            </h3>
            <p className="mt-1 text-xs text-ink-700/70">
              يراها المتطوّع المكلّف فقط، ولحظة تنفيذ المهمة فقط.
            </p>

            <div className="mt-4 flex flex-col gap-4">
              <Input
                type="tel"
                dir="ltr"
                icon={<Phone size={16} />}
                label="رقم التواصل"
                required
                value={newNeed.contact_phone || ""}
                onChange={(e) => setNeedField("contact_phone", e.target.value)}
                placeholder="0933123456"
              />

              <Field label="موقع التوصيل على الخريطة">
                <div className="overflow-hidden rounded-xl ring-1 ring-sand-200">
                  <MapPicker
                    onLocationSelect={(lat, lng) =>
                      setNeedField(
                        "delivery_location",
                        `إحداثيات: ${lat.toFixed(4)}, ${lng.toFixed(4)}`
                      )
                    }
                  />
                </div>
              </Field>

              <Textarea
                label="العنوان بالتفصيل"
                required
                rows={2}
                value={newNeed.delivery_address || ""}
                onChange={(e) =>
                  setNeedField("delivery_address", e.target.value)
                }
                placeholder="المدينة، الحي، الشارع، رقم البناء…"
              />
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            full
            disabled={isSubmitting}
          >
            {isSubmitting ? "جاري الإرسال…" : "أرسل الطلب"}
          </Button>
        </form>
      </Modal>

      {/* ==================== Catalogue ==================== */}
      {activeTab === "catalog" && (
        <>
          <PageHeader
            title="الكاتالوج المتاح"
            description="أضف ما تحتاجه إلى السلة، ثم أكّد الحجز مرة واحدة مع عنوان التوصيل."
            actions={
              <>
                <Button
                  variant={cart.length > 0 ? "gold" : "outline"}
                  size="sm"
                  onClick={() => setActiveTab("cart")}
                >
                  <ShoppingBag size={15} />
                  السلة ({cart.length})
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsAddNeedModalOpen(true)}
                >
                  <Plus size={15} />
                  طلب احتياج
                </Button>
              </>
            }
          />

          <Surface flush>
            <Toolbar>
              <Input
                density="compact"
                icon={<Search size={15} />}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ابحث في الكاتالوج…"
                className="sm:w-64"
                aria-label="ابحث في الكاتالوج"
              />
              <div className="flex items-center gap-2">
                <span className="text-xs text-ink-700/60">
                  {visible.length} من {available.length}
                </span>
                <Select
                  density="compact"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-40"
                  aria-label="تصفية بالفئة"
                >
                  {categoryOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </Select>
              </div>
            </Toolbar>

            <div className="p-4">
              {visible.length === 0 ? (
                <EmptyState
                  tone="white"
                  icon={available.length === 0 ? Package : Store}
                  title={
                    available.length === 0
                      ? "لا قطع متاحة الآن"
                      : "لا نتائج مطابقة"
                  }
                  body={
                    available.length === 0
                      ? "قدّم طلب احتياج وسنشعرك فور توفّر قطعة تطابقه، دون أن تتابع الكاتالوج بنفسك."
                      : "جرّب فئة أخرى أو أزل كلمة البحث."
                  }
                  action={
                    available.length === 0 ? (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setIsAddNeedModalOpen(true)}
                      >
                        <Plus size={15} />
                        قدّم طلب احتياج
                      </Button>
                    ) : undefined
                  }
                />
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                  {visible.map((item) => (
                    <ItemTile
                      key={item.id}
                      item={item}
                      inCart={cart.some((c) => c.id === item.id)}
                      onAdd={() => handleAddToCart(item)}
                    />
                  ))}
                </div>
              )}
            </div>
          </Surface>
        </>
      )}

      {/* ==================== Cart / checkout ==================== */}
      {activeTab === "cart" && (
        <>
          <PageHeader
            title="سلة الحجز"
            description="راجع القطع، أضف عنوان التوصيل، ثم أكّد الحجز في خطوة واحدة."
            actions={
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveTab("catalog")}
              >
                <Store size={15} />
                متابعة التصفّح
              </Button>
            }
          />

          {cart.length === 0 ? (
            <EmptyState
              icon={ShoppingBag}
              title="سلتك فارغة"
              body="تصفّح الكاتالوج وأضف القطع التي تحتاجها، ثم أكّد الحجز مرة واحدة."
              action={
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setActiveTab("catalog")}
                >
                  تصفّح الكاتالوج
                </Button>
              }
            />
          ) : (
            <form
              onSubmit={handleBulkSubmit}
              className="grid gap-4 lg:grid-cols-[1.5fr_1fr] lg:items-start"
            >
              <div className="flex flex-col gap-4">
                <Surface flush title={`${cart.length} قطعة في السلة`}>
                  <DataTable minWidth="26rem">
                    <THead>
                      <TR>
                        <TH>القطعة</TH>
                        <TH>الحالة</TH>
                        <TH justify="end">إزالة</TH>
                      </TR>
                    </THead>
                    <TBody>
                      {cart.map((item) => (
                        <TR key={item.id}>
                          <TD>
                            <CellStack
                              media={
                                <Image
                                  src={
                                    item.image_url || "/placeholder-item.svg"
                                  }
                                  alt=""
                                  width={36}
                                  height={36}
                                  className="h-9 w-9 shrink-0 rounded-md object-cover ring-1 ring-sand-200"
                                />
                              }
                              primary={item.title}
                              secondary={item.category}
                            />
                          </TD>
                          <TD>
                            {item.condition ? (
                              <Badge variant="gold">{item.condition}</Badge>
                            ) : (
                              <span className="text-ink-700/60">—</span>
                            )}
                          </TD>
                          <TD justify="end">
                            <IconButton
                              tone="danger"
                              aria-label={`أزل ${item.title}`}
                              onClick={() => handleRemoveFromCart(item.id)}
                            >
                              <Trash2 size={15} />
                            </IconButton>
                          </TD>
                        </TR>
                      ))}
                    </TBody>
                  </DataTable>
                </Surface>

                <Surface
                  title="عنوان التوصيل"
                  description="يظهر للمتطوّع المكلّف فقط، ولحظة تنفيذ المهمة فقط."
                >
                  <div className="flex flex-col gap-4">
                    <Input
                      type="tel"
                      dir="ltr"
                      icon={<Phone size={16} />}
                      label="رقم التواصل"
                      required
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="0933123456"
                    />

                    <Field label="موقع التوصيل على الخريطة">
                      <div className="overflow-hidden rounded-xl ring-1 ring-sand-200">
                        <MapPicker
                          onLocationSelect={(lat, lng) =>
                            setDeliveryLocation(
                              `إحداثيات: ${lat.toFixed(4)}, ${lng.toFixed(4)}`
                            )
                          }
                        />
                      </div>
                    </Field>

                    <Textarea
                      label="العنوان بالتفصيل"
                      required
                      rows={2}
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      placeholder="المدينة، الحي، الشارع، رقم البناء…"
                    />
                  </div>
                </Surface>
              </div>

              {/* Summary */}
              <Surface title="ملخّص الحجز" className="lg:sticky lg:top-20">
                <dl className="flex flex-col gap-3 text-sm">
                  <div className="flex items-center justify-between">
                    <dt className="text-ink-700/75">عدد القطع</dt>
                    <dd className="font-bold tabular-nums text-ink-900">
                      {cart.length}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-ink-700/75">التكلفة</dt>
                    <dd className="font-bold text-brand-700">مجاناً</dd>
                  </div>
                  <div className="flex items-center justify-between border-t border-sand-200 pt-3">
                    <dt className="text-ink-700/75">الخطوة التالية</dt>
                    <dd className="text-xs font-semibold text-ink-900">
                      تعيين متطوّع
                    </dd>
                  </div>
                </dl>

                <Button
                  type="submit"
                  variant="primary"
                  full
                  className="mt-5"
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? "جاري التأكيد…"
                    : `أكّد حجز ${cart.length} قطعة`}
                </Button>

                <p className="mt-3 text-xs text-ink-700/60">
                  بعد التأكيد تنتقل القطع إلى «قيد التوصيل» ويعيّن الفريق
                  متطوّعاً قريباً منك.
                </p>
              </Surface>
            </form>
          )}
        </>
      )}

      {/* ==================== Match alerts ==================== */}
      {activeTab === "alerts" && (
        <>
          <PageHeader
            title="تنبيهات المطابقة"
            description="نُعلمك هنا كلما نُشر تبرّع جديد يطابق أحد طلباتك المفتوحة، دون أن تحتاج لمتابعة الكاتالوج بنفسك."
          />

          {notifications.length === 0 ? (
            <EmptyState
              icon={BellRing}
              title="لا تنبيهات بعد"
              body="طلباتك المفتوحة قيد المتابعة. عند وصول تبرّع يطابق أحدها سيظهر التنبيه هنا مباشرة."
            />
          ) : (
            <div className="flex flex-col gap-3">
              {notifications.map((alert) => {
                // Resolved against live state rather than the joined snapshot,
                // so an item claimed by someone else since the alert was
                // raised is offered accurately.
                const item = donations.find((d) => d.id === alert.donation_id);
                return (
                  <AlertCard
                    key={alert.id}
                    alert={alert}
                    item={item}
                    inCart={cart.some((c) => c.id === alert.donation_id)}
                    onAdd={() => item && handleAddToCart(item)}
                  />
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ==================== My needs ==================== */}
      {activeTab === "my-needs" && (
        <>
          <PageHeader
            title="سجل الطلبات"
            description="الطلبات التي قدّمتها ومرحلة كل منها."
            actions={
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsAddNeedModalOpen(true)}
              >
                <Plus size={15} />
                طلب جديد
              </Button>
            }
          />

          <Surface flush>
            <Toolbar>
              <span className="text-xs text-ink-700/60">
                {myNeeds.length} طلب مسجّل باسمك
              </span>
            </Toolbar>

            <DataTable minWidth="50rem">
              <THead>
                <TR>
                  <TH>الطلب</TH>
                  <TH>الفئة</TH>
                  <TH>الأولوية</TH>
                  <TH>المتبقّي</TH>
                  <TH justify="end">المرحلة</TH>
                </TR>
              </THead>
              <TBody>
                {myNeeds.length === 0 ? (
                  <TableEmpty
                    colSpan={5}
                    icon={HeartHandshake}
                    title="لم تقدّم طلبات بعد"
                    body="قدّم طلب احتياج يحدّد الفئة والكمية والأولوية، وسنطابقه تلقائياً مع أقرب تبرّع مناسب."
                    action={
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setIsAddNeedModalOpen(true)}
                      >
                        قدّم طلبك الأول
                      </Button>
                    }
                  />
                ) : (
                  myNeeds.map((need) => (
                    <TR key={need.id}>
                      <TD>
                        <CellStack
                          primary={need.title}
                          secondary={need.description}
                        />
                      </TD>
                      <TD className="text-ink-700/80">
                        {need.category}
                        {need.sub_category ? ` — ${need.sub_category}` : ""}
                      </TD>
                      <TD>
                        <UrgencyBadge urgency={need.urgency} />
                      </TD>
                      <TD className="font-semibold tabular-nums">
                        <span className="flex items-center gap-1">
                          <Hash size={11} className="text-ink-700/55" />
                          {need.quantity ?? 0}
                        </span>
                      </TD>
                      <TD justify="end">
                        <StatusBadge status={need.status} />
                      </TD>
                    </TR>
                  ))
                )}
              </TBody>
            </DataTable>
          </Surface>
        </>
      )}
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Match alert                                                                */
/* -------------------------------------------------------------------------- */

const RELATIVE = new Intl.RelativeTimeFormat("ar", { numeric: "auto" });

/** "قبل ٣ أيام" — coarse on purpose; the exact minute is never the point. */
function relativeTimeAr(iso: string) {
  const elapsedMs = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(elapsedMs)) return "";

  const minutes = Math.round(elapsedMs / 60000);
  if (minutes < 60) return RELATIVE.format(-minutes, "minute");

  const hours = Math.round(minutes / 60);
  if (hours < 24) return RELATIVE.format(-hours, "hour");

  return RELATIVE.format(-Math.round(hours / 24), "day");
}

function AlertCard({
  alert,
  item,
  inCart,
  onAdd,
}: {
  alert: MatchNotification;
  item?: DonationItem;
  inCart: boolean;
  onAdd: () => void;
}) {
  const title = item?.title ?? alert.donation?.title ?? "قطعة متبرَّع بها";
  const status = item?.status ?? alert.donation?.status;
  const available = status === "available";
  const unread = !alert.read_at;

  return (
    <article
      className={cn(
        "flex flex-wrap items-center gap-4 rounded-xl bg-white p-4 ring-1 transition-shadow hover:shadow-sm",
        unread ? "ring-brand-200" : "ring-sand-200"
      )}
    >
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-sand-100">
        <Image
          src={item?.image_url || alert.donation?.image_url || "/placeholder-item.svg"}
          alt={title}
          fill
          sizes="64px"
          className="object-cover"
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          {unread && (
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
          )}
          <p className="truncate text-sm font-bold text-ink-900">{title}</p>
          <Badge variant="brand">تطابق {alert.score}%</Badge>
        </div>

        <p className="mt-1 text-xs text-ink-700/75">
          يطابق طلبك:{" "}
          <span className="font-semibold text-ink-900">
            {alert.need?.title ?? "طلب مفتوح"}
          </span>
        </p>

        <p className="mt-1.5 flex items-center gap-1.5 text-micro text-ink-700/60">
          <Clock size={11} className="shrink-0" />
          {relativeTimeAr(alert.created_at)}
          {!available && (
            <>
              <span aria-hidden>·</span>
              {/* Honest about a race the beneficiary did not lose through
                  any fault of their own. */}
              <span className="font-semibold text-gold-800">
                لم تعد متاحة — حجزها مستفيد آخر
              </span>
            </>
          )}
        </p>
      </div>

      <Button
        variant={inCart ? "outline" : "dark"}
        size="sm"
        disabled={!available || inCart || !item}
        onClick={onAdd}
      >
        {inCart ? (
          <>
            <CheckCircle2 size={14} />
            في السلة
          </>
        ) : (
          <>
            <ShoppingBag size={14} />
            أضف للسلة
          </>
        )}
      </Button>
    </article>
  );
}
