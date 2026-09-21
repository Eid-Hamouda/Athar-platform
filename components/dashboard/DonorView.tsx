"use client";

import * as React from "react";
import Image from "next/image";
import toast from "react-hot-toast";
import {
  Package,
  Plus,
  MapPin,
  Sparkles,
  HeartHandshake,
  Target,
  Heart,
  Truck,
  CheckCircle2,
  Hash,
  Inbox,
} from "lucide-react";

import type {
  UserProfile,
  DonationItem,
  NeedRequest,
  DonorItemForm,
} from "@/types";
import { analyzeItemAction } from "@/app/actions/aiActions";
import {
  findNeedsForDonationAction,
  type NeedSuggestion,
} from "@/app/actions/matchingActions";
import { supabase } from "@/lib/supabase";
import { stripCoordinatesPrefix } from "@/lib/utils";
import { distanceBetween, formatDistanceAr } from "@/lib/geo";
import MapPicker from "@/components/MapPicker";
import { Modal } from "@/components/ui/Modal";
import { IconTile } from "@/components/ui/Card";
import { Badge, StatusBadge, UrgencyBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea, Field } from "@/components/ui/Input";
import { FileDrop } from "@/components/ui/FileDrop";
import { ANALYSIS_MAX_EDGE, compressImage } from "@/lib/compressImage";
import { PageHeader, Surface, Toolbar } from "@/components/dashboard/ui/Layout";
import {
  DataTable,
  THead,
  TBody,
  TR,
  TH,
  TD,
  TableEmpty,
  CellStack,
} from "@/components/dashboard/ui/Table";
import { StatCard, StageBar, FilterTabs } from "@/components/dashboard/ui/Stat";

interface DonorViewProps {
  activeTab: string;
  donations: DonationItem[];
  needs: NeedRequest[];
  profile: UserProfile | null;
  isAddDonationModalOpen: boolean;
  setIsAddDonationModalOpen: (v: boolean) => void;
  donorFormData: DonorItemForm;
  setDonorFormData: React.Dispatch<React.SetStateAction<DonorItemForm>>;
  donorFile: File | null;
  setDonorFile: (file: File | null) => void;
  handleDonorCreateItem: (e: React.FormEvent) => void;
  isSubmitting: boolean;
}

const STAGE_IDS = ["available", "reserved", "completed"] as const;
const STAGE_LABELS = ["متاح بالمنصة", "قيد التوصيل", "تم التسليم"] as const;

const STATUS_FILTERS = [
  { id: "all", label: "الكل" },
  { id: "available", label: "متاح" },
  { id: "reserved", label: "قيد التوصيل" },
  { id: "completed", label: "تم التسليم" },
] as const;

type StatusFilter = (typeof STATUS_FILTERS)[number]["id"];

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

export default function DonorView({
  activeTab,
  donations,
  needs,
  profile,
  isAddDonationModalOpen,
  setIsAddDonationModalOpen,
  donorFormData,
  setDonorFormData,
  donorFile,
  setDonorFile,
  handleDonorCreateItem,
  isSubmitting,
}: DonorViewProps) {
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("all");
  const [needSuggestions, setNeedSuggestions] = React.useState<
    NeedSuggestion[]
  >([]);

  const mine = donations.filter((d) => d.donor_id === profile?.id);
  const visible = mine.filter(
    (d) => statusFilter === "all" || d.status === statusFilter
  );
  const openNeeds = needs.filter(
    (n) => n.status === "pending" && (n.quantity || 1) > 0
  );

  const targetNeed = donorFormData.target_need_id
    ? needs.find((n) => n.id === donorFormData.target_need_id)
    : null;

  /* ---------------- AI classification ---------------- */
  /**
   * Once the item has been described, ask which open needs it would satisfy.
   * Best-effort and non-blocking: the donor can publish to the catalogue as
   * usual whether or not this returns anything.
   */
  const suggestNeedsFor = async (item: {
    title: string;
    category: string;
    sub_category: string;
    condition: string;
    description: string;
  }) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const suggestions = await findNeedsForDonationAction(
        session.access_token,
        { ...item, location: donorFormData.location }
      );
      setNeedSuggestions(suggestions);
    } catch {
      setNeedSuggestions([]);
    }
  };

  const handleImage = async (file: File | null) => {
    setDonorFile(file);
    if (!file) {
      setNeedSuggestions([]);
      return;
    }

    setIsAnalyzing(true);
    const toastId = toast.loading("الذكاء الاصطناعي يقرأ الصورة…");

    try {
      // Shrunk before it is sent, not just before it is stored: the model is
      // on a per-attempt clock and an unscaled photo spends it on the upload.
      const payload = new FormData();
      payload.append("image", await compressImage(file, { maxEdge: ANALYSIS_MAX_EDGE }));
      const analysis = await analyzeItemAction(payload);
      if (!analysis) throw new Error("no-analysis");

      setDonorFormData((prev) => ({
        ...prev,
        // A targeted donation keeps the need's own title and category.
        title: prev.target_need_id
          ? prev.title
          : analysis.suggested_title || prev.title,
        category: prev.target_need_id
          ? prev.category
          : analysis.category || prev.category,
        sub_category: prev.target_need_id
          ? prev.sub_category
          : analysis.sub_category || prev.sub_category,
        condition: analysis.condition || prev.condition,
        // Unlike the fields above, anything the donor has already written is
        // kept. A title or a category is a label the model can restate, but a
        // description is authored text — silently replacing it when someone
        // swaps the photo would throw away work they cannot get back.
        description:
          prev.description.trim().length > 0
            ? prev.description
            : analysis.suggested_description || prev.description,
      }));

      toast.success(
        donorFormData.target_need_id
          ? `تم تقدير حالة القطعة: ${analysis.condition}`
          : `تم التصنيف: ${analysis.category} — ${analysis.sub_category}`,
        { id: toastId }
      );

      // Pointless while already fulfilling a specific need.
      if (!donorFormData.target_need_id) {
        void suggestNeedsFor({
          title: analysis.suggested_title || donorFormData.title,
          category: analysis.category || donorFormData.category,
          sub_category: analysis.sub_category || donorFormData.sub_category,
          condition: analysis.condition || donorFormData.condition,
          // Mirrors the rule applied to the form above. The generated text is
          // the richest signal the matcher gets, so passing the stale empty
          // value here would hand it noticeably less to work with.
          description:
            donorFormData.description.trim().length > 0
              ? donorFormData.description
              : analysis.suggested_description || "",
        });
      }
    } catch {
      toast.error("تعذّر التصنيف التلقائي. عبّئ الحقول يدوياً.", {
        id: toastId,
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const startTargetedDonation = (need: NeedRequest) => {
    setDonorFormData({
      title: `تلبية طلب: ${need.title}`,
      category: need.category,
      sub_category: need.sub_category ?? "",
      condition: "ممتازة",
      description: "",
      location: "",
      target_need_id: need.id,
    });
    setDonorFile(null);
    setIsAddDonationModalOpen(true);
  };

  /**
   * Same as `startTargetedDonation`, but for a donor already mid-form: the
   * photo they uploaded and the condition the model read from it are kept, so
   * accepting a suggestion costs them nothing they have already done.
   */
  const switchToTargetedNeed = (need: NeedRequest) => {
    setDonorFormData({
      ...donorFormData,
      title: `تلبية طلب: ${need.title}`,
      category: need.category,
      sub_category: need.sub_category ?? "",
      target_need_id: need.id,
    });
    setNeedSuggestions([]);
  };

  const closeModal = () => {
    setIsAddDonationModalOpen(false);
    setDonorFormData({ ...donorFormData, target_need_id: null });
    setNeedSuggestions([]);
  };

  const setField = <K extends keyof DonorItemForm>(
    key: K,
    value: DonorItemForm[K]
  ) => setDonorFormData({ ...donorFormData, [key]: value });

  const locationField = (
    <Field
      label="موقع الاستلام"
      hint="حدّد النقطة على الخريطة أو اكتب الموقع نصياً"
    >
      <div className="overflow-hidden rounded-xl ring-1 ring-sand-200">
        <MapPicker
          onLocationSelect={(lat, lng) =>
            setField(
              "location",
              `إحداثيات الخريطة: ${lat.toFixed(4)}, ${lng.toFixed(4)}`
            )
          }
        />
      </div>
      <Input
        icon={<MapPin size={16} />}
        required
        value={donorFormData.location}
        onChange={(e) => setField("location", e.target.value)}
        placeholder="دمشق، حي المزة…"
        className="mt-3"
      />
    </Field>
  );

  return (
    <>
      {/* ==================== Targeted donation modal ==================== */}
      {targetNeed && (
        <Modal
          isOpen={isAddDonationModalOpen}
          onClose={closeModal}
          size="lg"
          icon={
            <IconTile tone="gold" size="lg">
              <Target size={23} strokeWidth={1.75} />
            </IconTile>
          }
          title="تلبية طلب احتياج"
          description="شكراً لاستجابتك السريعة لهذا الطلب"
        >
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4 rounded-xl bg-brand-50 p-4 ring-1 ring-brand-100">
            <div>
              <p className="flex items-center gap-1.5 text-xs font-bold text-brand-800">
                <HeartHandshake size={13} />
                أنت تتبرّع لتغطية
              </p>
              <p className="mt-1.5 text-sm font-bold text-ink-900">
                {targetNeed.title}
              </p>
              <p className="mt-0.5 text-xs text-ink-700/75">
                {targetNeed.category}
                {targetNeed.sub_category ? ` — ${targetNeed.sub_category}` : ""}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="brand">
                <Hash size={11} />
                المطلوب {targetNeed.quantity}
              </Badge>
              <UrgencyBadge urgency={targetNeed.urgency} />
            </div>
          </div>

          <form onSubmit={handleDonorCreateItem} className="flex flex-col gap-6">
            <FileDrop
              file={donorFile}
              onFile={handleImage}
              busy={isAnalyzing}
              required
              label="صورة القطعة"
              hint="نستخدمها للتحقق من حالة القطعة قبل التوصيل"
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="الفئة (من الطلب)"
                value={donorFormData.category}
                disabled
                readOnly
              />
              <Input
                label="التصنيف الفرعي (من الطلب)"
                value={donorFormData.sub_category}
                disabled
                readOnly
              />
            </div>

            <Select
              label="حالة القطعة"
              value={donorFormData.condition}
              onChange={(e) => setField("condition", e.target.value)}
            >
              <option value="ممتازة">ممتازة</option>
              <option value="جيدة جداً">جيدة جداً</option>
              <option value="مقبولة">مقبولة</option>
            </Select>

            {/* Shown here too, so a description written by the model is never
                saved without the donor having had the chance to read it. */}
            <Textarea
              label="الوصف"
              rows={3}
              value={donorFormData.description}
              onChange={(e) => setField("description", e.target.value)}
              placeholder="المقاس، اللون، أي ملاحظة مفيدة…"
            />

            {locationField}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              full
              disabled={isSubmitting || isAnalyzing}
            >
              {isSubmitting ? "جاري الاعتماد…" : "أكّد التبرع"}
            </Button>
          </form>
        </Modal>
      )}

      {/* ==================== General donation modal ==================== */}
      {!targetNeed && (
        <Modal
          isOpen={isAddDonationModalOpen}
          onClose={() => setIsAddDonationModalOpen(false)}
          size="lg"
          icon={
            <IconTile tone="brand" size="lg">
              <Heart size={23} strokeWidth={1.75} />
            </IconTile>
          }
          title="تبرّع جديد"
          description="ارفع الصورة أولاً وسيقترح النظام العنوان والتصنيف"
        >
          <form onSubmit={handleDonorCreateItem} className="flex flex-col gap-6">
            <FileDrop
              file={donorFile}
              onFile={handleImage}
              busy={isAnalyzing}
              required
              label="صورة القطعة"
              hint="صورة واضحة بإضاءة جيدة تكفي"
            />

            {/* The moment of highest intent: the donor is holding the item and
                a real person is already waiting for one like it. */}
            {needSuggestions.length > 0 && (
              <div className="rounded-xl bg-brand-50 p-4 ring-1 ring-brand-200">
                <p className="flex items-center gap-1.5 text-xs font-bold text-brand-800">
                  <Sparkles size={13} />
                  {needSuggestions.length === 1
                    ? "هناك طلب مفتوح تناسبه قطعتك"
                    : `هناك ${needSuggestions.length} طلبات مفتوحة تناسبها قطعتك`}
                </p>
                <p className="mt-1 text-micro text-brand-900/70">
                  اختر طلباً لتذهب قطعتك إليه مباشرة بدل انتظار من يطلبها.
                </p>

                <ul className="mt-3 flex flex-col gap-2">
                  {needSuggestions.map(({ need, score }) => {
                    // Recomputed here rather than read from the server result:
                    // suggestions are fetched the moment the photo is read,
                    // which is before the donor has picked a pickup point, so
                    // the distance the server saw was always unknown. Doing it
                    // from live form state also keeps it correct as they move
                    // the map pin.
                    const distanceKm = distanceBetween(
                      donorFormData.location,
                      need.delivery_location
                    );

                    return (
                    <li
                      key={need.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-white p-3 ring-1 ring-brand-100"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-ink-900">
                          {need.title}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-micro text-ink-700/70">
                          <UrgencyBadge urgency={need.urgency} />
                          <span className="tabular-nums">تطابق {score}%</span>
                          {distanceKm !== null && (
                            <span>· {formatDistanceAr(distanceKm)}</span>
                          )}
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="dark"
                        size="sm"
                        onClick={() => switchToTargetedNeed(need)}
                      >
                        <Target size={13} />
                        وجّه له
                      </Button>
                    </li>
                    );
                  })}
                </ul>
              </div>
            )}

            <Input
              label="عنوان القطعة"
              required
              value={donorFormData.title}
              onChange={(e) => setField("title", e.target.value)}
              placeholder="مثال: حقيبة مدرسية جديدة"
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="الفئة"
                required
                list="donor-category-suggestions"
                value={donorFormData.category}
                onChange={(e) => setField("category", e.target.value)}
                placeholder="ملابس، أثاث…"
              />
              <datalist id="donor-category-suggestions">
                {CATEGORY_SUGGESTIONS.map((option) => (
                  <option key={option} value={option} />
                ))}
              </datalist>

              <Input
                label="التصنيف الفرعي"
                required
                value={donorFormData.sub_category}
                onChange={(e) => setField("sub_category", e.target.value)}
                placeholder="معاطف شتوية…"
              />
            </div>

            <Select
              label="حالة القطعة"
              value={donorFormData.condition}
              onChange={(e) => setField("condition", e.target.value)}
            >
              <option value="ممتازة">ممتازة</option>
              <option value="جيدة جداً">جيدة جداً</option>
              <option value="مقبولة">مقبولة</option>
            </Select>

            {locationField}

            <Textarea
              label="الوصف"
              required
              rows={3}
              value={donorFormData.description}
              onChange={(e) => setField("description", e.target.value)}
              placeholder="المقاس، اللون، أي ملاحظة مفيدة…"
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              full
              disabled={isSubmitting || isAnalyzing}
            >
              {isSubmitting ? "جاري النشر…" : "أضف إلى الكاتالوج"}
            </Button>
          </form>
        </Modal>
      )}

      {/* ==================== My donations ==================== */}
      {activeTab === "overview" && (
        <>
          <PageHeader
            title="سجل التبرعات"
            description="كل قطعة رفعتها ومرحلتها الحالية، من النشر حتى التسليم الموثّق."
            actions={
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsAddDonationModalOpen(true)}
              >
                <Plus size={15} />
                تبرّع جديد
              </Button>
            }
          />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="إجمالي تبرعاتي"
              value={mine.length}
              icon={Package}
            />
            <StatCard
              label="متاح بالمنصة"
              value={mine.filter((d) => d.status === "available").length}
              hint="بانتظار مستفيد"
              icon={Sparkles}
            />
            <StatCard
              label="قيد التوصيل"
              value={mine.filter((d) => d.status === "reserved").length}
              hint="مع متطوّع"
              icon={Truck}
            />
            <StatCard
              label="تم تسليمه"
              value={mine.filter((d) => d.status === "completed").length}
              hint="دورة مكتملة"
              icon={CheckCircle2}
            />
          </div>

          <Surface flush className="mt-6">
            <Toolbar>
              <span className="text-xs text-ink-700/60">
                {visible.length} من {mine.length} قطعة
              </span>
              <FilterTabs
                options={STATUS_FILTERS}
                value={statusFilter}
                onChange={setStatusFilter}
              />
            </Toolbar>

            <DataTable minWidth="52rem">
              <THead>
                <TR>
                  <TH>القطعة</TH>
                  <TH>الفئة</TH>
                  <TH>الموقع</TH>
                  <TH>المرحلة</TH>
                  <TH justify="end">الحالة</TH>
                </TR>
              </THead>
              <TBody>
                {visible.length === 0 ? (
                  <TableEmpty
                    colSpan={5}
                    icon={Package}
                    title={
                      mine.length === 0 ? "لم تتبرّع بعد" : "لا نتائج للتصفية"
                    }
                    body={
                      mine.length === 0
                        ? "ابدأ بقطعة واحدة. ارفع صورتها وسيتولّى النظام الباقي."
                        : "جرّب تصفية أخرى لرؤية بقية تبرعاتك."
                    }
                    action={
                      mine.length === 0 ? (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => setIsAddDonationModalOpen(true)}
                        >
                          <Plus size={15} />
                          تبرّع الآن
                        </Button>
                      ) : undefined
                    }
                  />
                ) : (
                  visible.map((item) => (
                    <TR key={item.id}>
                      <TD>
                        <CellStack
                          media={
                            <Image
                              src={item.image_url || "/placeholder-item.svg"}
                              alt=""
                              width={36}
                              height={36}
                              className="h-9 w-9 shrink-0 rounded-md object-cover ring-1 ring-sand-200"
                            />
                          }
                          primary={item.title}
                          secondary={item.sub_category}
                        />
                      </TD>
                      <TD className="text-ink-700/80">{item.category}</TD>
                      <TD className="max-w-44 truncate text-ink-700/80">
                        {stripCoordinatesPrefix(item.location) || "—"}
                      </TD>
                      <TD>
                        <StageBar
                          labels={STAGE_LABELS}
                          current={Math.max(
                            0,
                            STAGE_IDS.indexOf(
                              item.status as (typeof STAGE_IDS)[number]
                            )
                          )}
                        />
                      </TD>
                      <TD justify="end">
                        <StatusBadge status={item.status} />
                      </TD>
                    </TR>
                  ))
                )}
              </TBody>
            </DataTable>
          </Surface>
        </>
      )}

      {/* ==================== Open needs ==================== */}
      {activeTab === "open-needs" && (
        <>
          <PageHeader
            title="طلبات مفتوحة"
            description="طلبات قدّمها مستفيدون معتمدون. التبرع الموجّه يصل أسرع، لأن عنوان التسليم جاهز مسبقاً."
          />

          <Surface flush>
            <Toolbar>
              <span className="text-xs text-ink-700/60">
                {openNeeds.length} طلب ينتظر التغطية
              </span>
            </Toolbar>

            <DataTable minWidth="52rem">
              <THead>
                <TR>
                  <TH>الطلب</TH>
                  <TH>الفئة</TH>
                  <TH>الأولوية</TH>
                  <TH>المطلوب</TH>
                  <TH justify="end">إجراء</TH>
                </TR>
              </THead>
              <TBody>
                {openNeeds.length === 0 ? (
                  <TableEmpty
                    colSpan={5}
                    icon={Inbox}
                    title="لا طلبات مفتوحة حالياً"
                    body="كل الطلبات مغطّاة. يمكنك التبرع للكاتالوج ليجدها المستفيدون جاهزة."
                    action={
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setIsAddDonationModalOpen(true)}
                      >
                        تبرّع للكاتالوج
                      </Button>
                    }
                  />
                ) : (
                  openNeeds.map((need) => (
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
                        {need.quantity}
                      </TD>
                      <TD justify="end">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => startTargetedDonation(need)}
                        >
                          <HeartHandshake size={14} />
                          تبرّع لهذا الطلب
                        </Button>
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
