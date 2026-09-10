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

import type { UserProfile, DonationItem, NeedRequest } from "@/types";
import { analyzeItemAction } from "@/app/actions/aiActions";
import { stripCoordinatesPrefix } from "@/lib/utils";
import MapPicker from "@/components/MapPicker";
import { Modal } from "@/components/ui/Modal";
import { IconTile } from "@/components/ui/Card";
import { Badge, StatusBadge, UrgencyBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea, Field } from "@/components/ui/Input";
import { FileDrop } from "@/components/ui/FileDrop";
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
  donorFormData: any;
  setDonorFormData: (data: any) => void;
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
  const handleImage = async (file: File | null) => {
    setDonorFile(file);
    if (!file) return;

    setIsAnalyzing(true);
    const toastId = toast.loading("الذكاء الاصطناعي يقرأ الصورة…");

    try {
      const payload = new FormData();
      payload.append("image", file);
      const analysis = await analyzeItemAction(payload);
      if (!analysis) throw new Error("no-analysis");

      setDonorFormData((prev: any) => ({
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
      }));

      toast.success(
        donorFormData.target_need_id
          ? `تم تقدير حالة القطعة: ${analysis.condition}`
          : `تم التصنيف: ${analysis.category} — ${analysis.sub_category}`,
        { id: toastId }
      );
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

  const closeModal = () => {
    setIsAddDonationModalOpen(false);
    setDonorFormData({ ...donorFormData, target_need_id: null });
  };

  const setField = (key: string, value: string) =>
    setDonorFormData({ ...donorFormData, [key]: value });

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
