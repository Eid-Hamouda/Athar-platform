"use client";

import * as React from "react";
import Image from "next/image";
import toast from "react-hot-toast";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Legend,
} from "recharts";
import {
  UserPlus,
  Users,
  Plus,
  Package,
  ListFilter,
  Trash2,
  Search,
  Truck,
  MapPin,
  Map as MapIcon,
  PhoneCall,
  MessageCircle,
  Clock,
  BadgeCheck,
  ChevronDown,
  Inbox,
} from "lucide-react";

import type {
  UserProfile,
  NeedRequest,
  DeliverableDonation,
  NewUserForm,
  NewItemForm,
} from "@/types";
import { analyzeItemAction } from "@/app/actions/aiActions";
import { cn, formatWhatsAppNumber, stripCoordinatesPrefix } from "@/lib/utils";
import MapPicker from "@/components/MapPicker";
import { Modal } from "@/components/ui/Modal";
import { IconTile } from "@/components/ui/Card";
import { Badge, StatusBadge, UrgencyBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea, Field } from "@/components/ui/Input";
import { FileDrop } from "@/components/ui/FileDrop";
import { ANALYSIS_MAX_EDGE, compressImage } from "@/lib/compressImage";
import {
  PageHeader,
  Surface,
  Toolbar,
  DetailItem,
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
  RowActions,
  IconButton,
} from "@/components/dashboard/ui/Table";
import { StatCard, FilterTabs } from "@/components/dashboard/ui/Stat";

const CHART_COLORS = ["#0a8163", "#ffaa20", "#3bbc93", "#b74606", "#635746"];

const ROLE_LABELS: Record<string, string> = {
  admin: "مسؤول",
  donor: "متبرّع",
  beneficiary: "مستفيد",
  volunteer: "متطوّع",
  organization: "جمعية",
};

const ROLE_OPTIONS = [
  "admin",
  "donor",
  "beneficiary",
  "volunteer",
  "organization",
];

const ITEM_FILTERS = [
  { id: "all", label: "الكل" },
  { id: "available", label: "متاح" },
  { id: "reserved", label: "قيد التوصيل" },
  { id: "completed", label: "تم التسليم" },
] as const;

const NEED_FILTERS = [
  { id: "all", label: "الكل" },
  { id: "pending", label: "مفتوح" },
  { id: "pending_delivery", label: "بانتظار التوصيل" },
  { id: "completed", label: "مكتمل" },
] as const;

type ItemFilter = (typeof ITEM_FILTERS)[number]["id"];
type NeedFilter = (typeof NEED_FILTERS)[number]["id"];

interface AdminViewProps {
  activeTab: string;
  allUsers: UserProfile[];
  /** Rows carry delivery fields that aren't on the base DonationItem type. */
  donations: DeliverableDonation[];
  needs: NeedRequest[];
  pendingBeneficiaries: UserProfile[];
  newUser: NewUserForm;
  setNewUser: React.Dispatch<React.SetStateAction<NewUserForm>>;
  newItem: NewItemForm;
  setNewItem: React.Dispatch<React.SetStateAction<NewItemForm>>;
  itemFile: File | null;
  setItemFile: (file: File | null) => void;
  handleAdminCreateUser: (e: React.FormEvent) => void;
  handleAdminCreateItem: (e: React.FormEvent) => void;
  handleUpdateRole: (id: string, role: string) => void;
  handleApproveUser: (id: string) => void;
  handleDeleteUser: (id: string) => void;
  handleDeleteItem: (id: string) => void;
  handleDeleteNeed: (id: string) => void;
  handleAssignVolunteer: (donationId: string, volunteerId: string) => void;
  isAddUserModalOpen: boolean;
  setIsAddUserModalOpen: (v: boolean) => void;
  isAddItemModalOpen: boolean;
  setIsAddItemModalOpen: (v: boolean) => void;
  isSubmitting: boolean;
}

function mapsHref(query: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function Thumb({ src, size = 36 }: { src?: string | null; size?: number }) {
  return (
    <Image
      src={src || "/placeholder-item.svg"}
      alt=""
      width={size}
      height={size}
      className="shrink-0 rounded-md object-cover ring-1 ring-sand-200"
      style={{ width: size, height: size }}
    />
  );
}

export default function AdminView({
  activeTab,
  allUsers,
  donations,
  needs,
  pendingBeneficiaries,
  newUser,
  setNewUser,
  newItem,
  setNewItem,
  itemFile,
  setItemFile,
  handleAdminCreateUser,
  handleAdminCreateItem,
  handleUpdateRole,
  handleApproveUser,
  handleDeleteUser,
  handleDeleteItem,
  handleDeleteNeed,
  handleAssignVolunteer,
  isAddUserModalOpen,
  setIsAddUserModalOpen,
  isAddItemModalOpen,
  setIsAddItemModalOpen,
  isSubmitting,
}: AdminViewProps) {
  const [userSearch, setUserSearch] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState("all");
  const [itemSearch, setItemSearch] = React.useState("");
  const [itemFilter, setItemFilter] = React.useState<ItemFilter>("all");
  const [needFilter, setNeedFilter] = React.useState<NeedFilter>("all");
  const [expandedItem, setExpandedItem] = React.useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);

  const volunteers = allUsers.filter((u) => u.role === "volunteer");

  /* ---------------- Filtering ---------------- */
  const filteredUsers = allUsers.filter((u) => {
    const term = userSearch.trim().toLowerCase();
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    const matchesTerm =
      !term ||
      (u.full_name ?? "").toLowerCase().includes(term) ||
      (ROLE_LABELS[u.role] ?? u.role).includes(term);
    return matchesRole && matchesTerm;
  });

  const filteredItems = donations.filter((d) => {
    const term = itemSearch.trim().toLowerCase();
    const matchesStatus = itemFilter === "all" || d.status === itemFilter;
    const matchesTerm =
      !term ||
      (d.title ?? "").toLowerCase().includes(term) ||
      (d.category ?? "").toLowerCase().includes(term);
    return matchesStatus && matchesTerm;
  });

  const filteredNeeds = needs.filter(
    (n) => needFilter === "all" || n.status === needFilter
  );

  /* ---------------- AI classification ---------------- */
  const handleImage = async (file: File | null) => {
    setItemFile(file);
    if (!file) return;

    setIsAnalyzing(true);
    const toastId = toast.loading("الذكاء الاصطناعي يصنّف الصورة…");

    try {
      // Shrunk before it is sent, not just before it is stored: the model is
      // on a per-attempt clock and an unscaled photo spends it on the upload.
      const payload = new FormData();
      payload.append("image", await compressImage(file, { maxEdge: ANALYSIS_MAX_EDGE }));
      const analysis = await analyzeItemAction(payload);
      if (!analysis) throw new Error("no-analysis");

      setNewItem({
        ...newItem,
        title: analysis.suggested_title || newItem.title,
        category: analysis.category || newItem.category,
        sub_category: analysis.sub_category || newItem.sub_category,
        condition: analysis.condition || newItem.condition,
      });

      toast.success(`${analysis.category} — ${analysis.sub_category}`, {
        id: toastId,
      });
    } catch {
      toast.error("تعذّر التصنيف. عبّئ الحقول يدوياً.", { id: toastId });
    } finally {
      setIsAnalyzing(false);
    }
  };

  /* ---------------- Chart data ---------------- */
  const usersByRole = React.useMemo(
    () =>
      ROLE_OPTIONS.map((role, i) => ({
        name: ROLE_LABELS[role],
        value: allUsers.filter((u) => u.role === role).length,
        // Pie reads `fill` off each datum, so no deprecated <Cell> needed.
        fill: CHART_COLORS[i % CHART_COLORS.length],
      })).filter((entry) => entry.value > 0),
    [allUsers]
  );

  const donationsByCategory = React.useMemo(() => {
    const counts = new Map<string, number>();
    for (const donation of donations) {
      const key = donation.category || "غير مصنّف";
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([name, العدد]) => ({ name, العدد }))
      .sort((a, b) => b.العدد - a.العدد)
      .slice(0, 6);
  }, [donations]);

  const chartTooltip = {
    borderRadius: 10,
    border: "1px solid #ece5d9",
    fontSize: 12,
    boxShadow: "0 8px 24px -6px rgba(9,23,19,.12)",
  };

  /* ======================================================================== */
  /* Overview                                                                 */
  /* ======================================================================== */
  if (activeTab === "overview") {
    return (
      <>
        <PageHeader
          title="نظرة عامة"
          description="حالة المنصة الآن: المستخدمون، القطع المسجّلة، والطلبات التي تنتظر إجراءً."
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="المستخدمون"
            value={allUsers.length}
            hint={`${volunteers.length} متطوّع`}
            icon={Users}
          />
          <StatCard
            label="القطع المسجّلة"
            value={donations.length}
            hint={`${donations.filter((d) => d.status === "available").length} متاحة الآن`}
            icon={Package}
          />
          <StatCard
            label="طلبات الاحتياج"
            value={needs.length}
            hint={`${needs.filter((n) => n.status === "pending").length} مفتوح`}
            icon={ListFilter}
          />
          <StatCard
            label="بانتظار الاعتماد"
            value={pendingBeneficiaries.length}
            hint={pendingBeneficiaries.length > 0 ? "يحتاج إجراءً" : "لا شيء معلّق"}
            icon={Clock}
            attention={pendingBeneficiaries.length > 0}
          />
        </div>

        {/* Approvals queue — the one thing that blocks other people */}
        {pendingBeneficiaries.length > 0 && (
          <Surface
            flush
            className="mt-6"
            title="حسابات تنتظر الاعتماد"
            description="لا يستطيع هؤلاء تقديم طلبات أو حجز قطع قبل اعتمادهم."
          >
            <DataTable minWidth="32rem">
              <THead>
                <TR>
                  <TH>المستخدم</TH>
                  <TH>الدور</TH>
                  <TH justify="end">إجراء</TH>
                </TR>
              </THead>
              <TBody>
                {pendingBeneficiaries.map((user) => (
                  <TR key={user.id}>
                    <TD>
                      <CellStack primary={user.full_name || "بلا اسم"} />
                    </TD>
                    <TD>
                      <Badge variant="neutral">
                        {ROLE_LABELS[user.role] ?? user.role}
                      </Badge>
                    </TD>
                    <TD justify="end">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleApproveUser(user.id)}
                      >
                        <BadgeCheck size={14} />
                        اعتماد
                      </Button>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </DataTable>
          </Surface>
        )}

        {/* Charts */}
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <Surface title="توزيع المستخدمين حسب الدور">
            <div dir="ltr" className="h-60">
              {usersByRole.length === 0 ? (
                <p className="pt-20 text-center text-xs text-ink-700/70">
                  لا بيانات بعد
                </p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={usersByRole}
                      cx="50%"
                      cy="46%"
                      innerRadius={48}
                      outerRadius={72}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="none"
                    />
                    <RechartsTooltip contentStyle={chartTooltip} />
                    <Legend
                      height={28}
                      iconType="circle"
                      iconSize={8}
                      formatter={(value) => (
                        <span style={{ fontSize: 12, color: "#635746" }}>
                          {value}
                        </span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </Surface>

          <Surface title="القطع حسب الفئة">
            <div dir="ltr" className="h-60">
              {donationsByCategory.length === 0 ? (
                <p className="pt-20 text-center text-xs text-ink-700/70">
                  لا بيانات بعد
                </p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={donationsByCategory}
                    margin={{ top: 8, right: 4, bottom: 0, left: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#ece5d9"
                    />
                    <XAxis
                      dataKey="name"
                      reversed
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#635746", fontSize: 11 }}
                    />
                    <YAxis
                      orientation="right"
                      allowDecimals={false}
                      axisLine={false}
                      tickLine={false}
                      width={28}
                      tick={{ fill: "#635746", fontSize: 11 }}
                    />
                    <RechartsTooltip
                      cursor={{ fill: "#f7f3ec" }}
                      contentStyle={chartTooltip}
                    />
                    <Bar
                      dataKey="العدد"
                      fill="#0a8163"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={34}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </Surface>
        </div>

        {/* Recent activity */}
        <Surface flush className="mt-6" title="أحدث القطع المسجّلة">
          <DataTable minWidth="34rem">
            <THead>
              <TR>
                <TH>القطعة</TH>
                <TH>الفئة</TH>
                <TH justify="end">المرحلة</TH>
              </TR>
            </THead>
            <TBody>
              {donations.length === 0 ? (
                <TableEmpty
                  colSpan={3}
                  icon={Inbox}
                  title="لا قطع مسجّلة"
                  body="ستظهر هنا آخر القطع التي يرفعها المتبرعون."
                />
              ) : (
                donations.slice(0, 5).map((item) => (
                  <TR key={item.id}>
                    <TD>
                      <CellStack
                        media={<Thumb src={item.image_url} />}
                        primary={item.title}
                        secondary={item.sub_category}
                      />
                    </TD>
                    <TD className="text-ink-700/80">{item.category}</TD>
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
    );
  }

  /* ======================================================================== */
  /* Management tabs                                                          */
  /* ======================================================================== */
  return (
    <>
      {/* ---------------- Add user modal ---------------- */}
      <Modal
        isOpen={isAddUserModalOpen}
        onClose={() => setIsAddUserModalOpen(false)}
        icon={
          <IconTile tone="brand" size="lg">
            <UserPlus size={23} strokeWidth={1.75} />
          </IconTile>
        }
        title="إضافة مستخدم"
        description="إنشاء الحسابات يدوياً يتطلّب مفتاح خدمة، لذا هذه العملية محاكاة حالياً"
      >
        <form onSubmit={handleAdminCreateUser} className="flex flex-col gap-5">
          <Input
            label="الاسم الكامل"
            required
            value={newUser.fullName}
            onChange={(e) =>
              setNewUser({ ...newUser, fullName: e.target.value })
            }
          />
          <Input
            type="email"
            dir="ltr"
            label="البريد الإلكتروني"
            required
            value={newUser.email}
            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
          />
          <Input
            type="password"
            dir="ltr"
            label="كلمة المرور"
            required
            value={newUser.password}
            onChange={(e) =>
              setNewUser({ ...newUser, password: e.target.value })
            }
          />
          <Select
            label="الدور"
            value={newUser.role}
            onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
          >
            {ROLE_OPTIONS.map((role) => (
              <option key={role} value={role}>
                {ROLE_LABELS[role]}
              </option>
            ))}
          </Select>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            full
            disabled={isSubmitting}
          >
            إنشاء الحساب
          </Button>
        </form>
      </Modal>

      {/* ---------------- Add item modal ---------------- */}
      <Modal
        isOpen={isAddItemModalOpen}
        onClose={() => setIsAddItemModalOpen(false)}
        size="lg"
        icon={
          <IconTile tone="gold" size="lg">
            <Plus size={23} strokeWidth={1.75} />
          </IconTile>
        }
        title="إضافة قطعة للكاتالوج"
        description="ارفع الصورة أولاً ليتولّى النظام التصنيف"
      >
        <form onSubmit={handleAdminCreateItem} className="flex flex-col gap-6">
          <FileDrop
            file={itemFile}
            onFile={handleImage}
            busy={isAnalyzing}
            required
            label="صورة القطعة"
          />

          <Input
            label="عنوان القطعة"
            required
            value={newItem.title}
            onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
            placeholder="مثال: معطف شتوي بحالة ممتازة"
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="الفئة"
              required
              value={newItem.category}
              onChange={(e) =>
                setNewItem({ ...newItem, category: e.target.value })
              }
              placeholder="ملابس، كتب…"
            />
            <Input
              label="التصنيف الفرعي"
              required
              value={newItem.sub_category}
              onChange={(e) =>
                setNewItem({ ...newItem, sub_category: e.target.value })
              }
              placeholder="شتوي، مدرسي…"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="حالة القطعة"
              value={newItem.condition || "ممتازة"}
              onChange={(e) =>
                setNewItem({ ...newItem, condition: e.target.value })
              }
            >
              <option value="ممتازة">ممتازة</option>
              <option value="جيدة جداً">جيدة جداً</option>
              <option value="مقبولة">مقبولة</option>
            </Select>

            <Select
              label="تعيين متطوّع (اختياري)"
              value={newItem.volunteer_id || ""}
              onChange={(e) =>
                setNewItem({ ...newItem, volunteer_id: e.target.value })
              }
            >
              <option value="">— بلا تعيين —</option>
              {volunteers.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.full_name}
                </option>
              ))}
            </Select>
          </div>

          <Textarea
            label="الوصف"
            required
            rows={3}
            value={newItem.description || ""}
            onChange={(e) =>
              setNewItem({ ...newItem, description: e.target.value })
            }
            placeholder="وصف تفصيلي للقطعة…"
          />

          <Field label="موقع الاستلام">
            <div className="overflow-hidden rounded-xl ring-1 ring-sand-200">
              <MapPicker
                onLocationSelect={(lat, lng) =>
                  setNewItem({
                    ...newItem,
                    location: `إحداثيات: ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
                  })
                }
              />
            </div>
            <Input
              icon={<MapPin size={16} />}
              required
              value={newItem.location}
              onChange={(e) =>
                setNewItem({ ...newItem, location: e.target.value })
              }
              placeholder="أو اكتب الموقع نصياً"
              className="mt-3"
            />
          </Field>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            full
            disabled={isSubmitting || isAnalyzing}
          >
            {isSubmitting ? "جاري النشر…" : "نشر في الكاتالوج"}
          </Button>
        </form>
      </Modal>

      {/* ==================== Users ==================== */}
      {activeTab === "manage-users" && (
        <>
          <PageHeader
            title="المستخدمون"
            description="غيّر الأدوار، اعتمد الحسابات المعلّقة، أو أزل حساباً."
            actions={
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsAddUserModalOpen(true)}
              >
                <UserPlus size={15} />
                مستخدم جديد
              </Button>
            }
          />

          <Surface flush>
            <Toolbar>
              <Input
                density="compact"
                icon={<Search size={15} />}
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="ابحث بالاسم أو الدور…"
                className="sm:w-64"
                aria-label="ابحث في المستخدمين"
              />
              <div className="flex items-center gap-2">
                <span className="text-xs text-ink-700/60">
                  {filteredUsers.length} من {allUsers.length}
                </span>
                <Select
                  density="compact"
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="w-36"
                  aria-label="تصفية بالدور"
                >
                  <option value="all">كل الأدوار</option>
                  {ROLE_OPTIONS.map((role) => (
                    <option key={role} value={role}>
                      {ROLE_LABELS[role]}
                    </option>
                  ))}
                </Select>
              </div>
            </Toolbar>

            <DataTable minWidth="46rem">
              <THead>
                <TR>
                  <TH>المستخدم</TH>
                  <TH>الدور</TH>
                  <TH>حالة الحساب</TH>
                  <TH justify="end">إجراءات</TH>
                </TR>
              </THead>
              <TBody>
                {filteredUsers.length === 0 ? (
                  <TableEmpty
                    colSpan={4}
                    icon={Users}
                    title="لا نتائج"
                    body="لا يوجد مستخدم يطابق البحث أو التصفية الحالية."
                  />
                ) : (
                  filteredUsers.map((user) => (
                    <TR key={user.id}>
                      <TD>
                        <CellStack
                          media={
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-sand-100 text-xs font-bold text-ink-800 ring-1 ring-sand-200">
                              {(user.full_name ?? "؟").trim().charAt(0)}
                            </span>
                          }
                          primary={user.full_name || "بلا اسم"}
                          secondary={ROLE_LABELS[user.role] ?? user.role}
                        />
                      </TD>
                      <TD>
                        <Select
                          density="compact"
                          value={user.role}
                          onChange={(e) =>
                            handleUpdateRole(user.id, e.target.value)
                          }
                          className="w-32"
                          aria-label={`دور ${user.full_name}`}
                        >
                          {ROLE_OPTIONS.map((role) => (
                            <option key={role} value={role}>
                              {ROLE_LABELS[role]}
                            </option>
                          ))}
                        </Select>
                      </TD>
                      <TD>
                        {user.is_approved ? (
                          <Badge variant="success">
                            <BadgeCheck size={11} />
                            معتمد
                          </Badge>
                        ) : (
                          <Badge variant="warning">
                            <Clock size={11} />
                            معلّق
                          </Badge>
                        )}
                      </TD>
                      <TD justify="end">
                        <RowActions>
                          {!user.is_approved && (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleApproveUser(user.id)}
                            >
                              اعتماد
                            </Button>
                          )}
                          <IconButton
                            tone="danger"
                            aria-label={`حذف ${user.full_name}`}
                            onClick={() => handleDeleteUser(user.id)}
                          >
                            <Trash2 size={15} />
                          </IconButton>
                        </RowActions>
                      </TD>
                    </TR>
                  ))
                )}
              </TBody>
            </DataTable>
          </Surface>
        </>
      )}

      {/* ==================== Items ==================== */}
      {activeTab === "manage-items" && (
        <>
          <PageHeader
            title="القطع والتبرعات"
            description="افتح أي صف لرؤية تفاصيل التوصيل وتعيين المندوب المسؤول."
            actions={
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsAddItemModalOpen(true)}
              >
                <Plus size={15} />
                إضافة قطعة
              </Button>
            }
          />

          <Surface flush>
            <Toolbar>
              <Input
                density="compact"
                icon={<Search size={15} />}
                value={itemSearch}
                onChange={(e) => setItemSearch(e.target.value)}
                placeholder="ابحث بالعنوان أو الفئة…"
                className="sm:w-64"
                aria-label="ابحث في القطع"
              />
              <FilterTabs
                options={ITEM_FILTERS}
                value={itemFilter}
                onChange={setItemFilter}
              />
            </Toolbar>

            <DataTable minWidth="56rem">
              <THead>
                <TR>
                  <TH className="w-8" />
                  <TH>القطعة</TH>
                  <TH>الفئة</TH>
                  <TH>حالة القطعة</TH>
                  <TH>المرحلة</TH>
                  <TH>المندوب</TH>
                  <TH justify="end">إجراءات</TH>
                </TR>
              </THead>
              <TBody>
                {filteredItems.length === 0 ? (
                  <TableEmpty
                    colSpan={7}
                    icon={Package}
                    title="لا قطع مطابقة"
                    body="جرّب تصفية أخرى، أو أضف قطعة جديدة للكاتالوج."
                  />
                ) : (
                  filteredItems.map((item) => {
                    const isOpen = expandedItem === item.id;
                    const isRequested =
                      item.status === "reserved" || item.status === "completed";
                    const dropoff = stripCoordinatesPrefix(
                      item.delivery_location
                    );
                    const assigned = volunteers.find(
                      (v) => v.id === item.volunteer_id
                    );

                    return (
                      <React.Fragment key={item.id}>
                        <TR
                          interactive
                          onClick={() =>
                            setExpandedItem(isOpen ? null : item.id)
                          }
                        >
                          <TD className="pe-0">
                            <ChevronDown
                              size={15}
                              className={cn(
                                "text-ink-700/60 transition-transform",
                                isOpen && "rotate-180"
                              )}
                            />
                          </TD>
                          <TD>
                            <CellStack
                              media={<Thumb src={item.image_url} />}
                              primary={item.title}
                              secondary={item.sub_category}
                            />
                          </TD>
                          <TD className="text-ink-700/80">{item.category}</TD>
                          <TD>
                            {item.condition ? (
                              <Badge variant="gold">{item.condition}</Badge>
                            ) : (
                              <span className="text-ink-700/60">—</span>
                            )}
                          </TD>
                          <TD>
                            <StatusBadge status={item.status} />
                          </TD>
                          <TD className="text-ink-700/80">
                            {assigned?.full_name ?? (
                              <span className="text-ink-700/70">
                                غير معيّن
                              </span>
                            )}
                          </TD>
                          <TD justify="end">
                            <RowActions>
                              <IconButton
                                tone="danger"
                                aria-label={`حذف ${item.title}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteItem(item.id);
                                }}
                              >
                                <Trash2 size={15} />
                              </IconButton>
                            </RowActions>
                          </TD>
                        </TR>

                        {isOpen && (
                          <tr className="bg-sand-50/80">
                            <td colSpan={7} className="px-4 py-5">
                              <dl className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                                <DetailItem label="موقع الاستلام">
                                  {stripCoordinatesPrefix(item.location) ||
                                    "غير محدد"}
                                  {stripCoordinatesPrefix(item.location) && (
                                    <ActionChip
                                      href={mapsHref(
                                        stripCoordinatesPrefix(item.location)
                                      )}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="mt-2 flex w-fit"
                                    >
                                      <MapIcon
                                        size={12}
                                        className="text-brand-600"
                                      />
                                      الخريطة
                                    </ActionChip>
                                  )}
                                </DetailItem>

                                <DetailItem label="الوصف">
                                  {item.description || "—"}
                                </DetailItem>

                                {isRequested ? (
                                  <>
                                    <DetailItem label="عنوان التسليم">
                                      {item.delivery_address ||
                                        "لم يُحدَّد بعد"}
                                      {dropoff && (
                                        <ActionChip
                                          href={mapsHref(dropoff)}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="mt-2 flex w-fit"
                                        >
                                          <MapIcon
                                            size={12}
                                            className="text-brand-600"
                                          />
                                          الخريطة
                                        </ActionChip>
                                      )}
                                    </DetailItem>

                                    {item.contact_phone && (
                                      <DetailItem label="تواصل المستفيد">
                                        <div className="flex flex-wrap gap-2">
                                          <ActionChip
                                            tone="dark"
                                            href={`tel:${item.contact_phone}`}
                                          >
                                            <PhoneCall size={12} />
                                            اتصال
                                          </ActionChip>
                                          <ActionChip
                                            tone="whatsapp"
                                            href={formatWhatsAppNumber(
                                              item.contact_phone
                                            )}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                          >
                                            <MessageCircle size={12} />
                                            واتساب
                                          </ActionChip>
                                        </div>
                                      </DetailItem>
                                    )}

                                    <DetailItem label="المندوب المكلّف">
                                      <Select
                                        density="compact"
                                        value={item.volunteer_id || ""}
                                        onChange={(e) =>
                                          handleAssignVolunteer(
                                            item.id,
                                            e.target.value
                                          )
                                        }
                                        className="w-full max-w-56"
                                        aria-label="تعيين متطوّع"
                                      >
                                        <option value="">
                                          — بانتظار التعيين —
                                        </option>
                                        {volunteers.map((v) => (
                                          <option key={v.id} value={v.id}>
                                            {v.full_name}
                                          </option>
                                        ))}
                                      </Select>
                                    </DetailItem>
                                  </>
                                ) : (
                                  <DetailItem label="التوصيل">
                                    <span className="flex items-start gap-2 text-ink-700/75">
                                      <Truck
                                        size={14}
                                        className="mt-0.5 shrink-0 text-ink-700/60"
                                      />
                                      متاحة في الكاتالوج — يُفعَّل تعيين
                                      المندوب بعد حجزها من مستفيد.
                                    </span>
                                  </DetailItem>
                                )}
                              </dl>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </TBody>
            </DataTable>
          </Surface>
        </>
      )}

      {/* ==================== Needs ==================== */}
      {activeTab === "manage-needs" && (
        <>
          <PageHeader
            title="طلبات الاحتياج"
            description="الطلبات المقدّمة من المستفيدين والجمعيات المعتمدة."
          />

          <Surface flush>
            <Toolbar>
              <span className="text-xs text-ink-700/60">
                {filteredNeeds.length} من {needs.length} طلب
              </span>
              <FilterTabs
                options={NEED_FILTERS}
                value={needFilter}
                onChange={setNeedFilter}
              />
            </Toolbar>

            <DataTable minWidth="50rem">
              <THead>
                <TR>
                  <TH>الطلب</TH>
                  <TH>الفئة</TH>
                  <TH>الأولوية</TH>
                  <TH>المتبقّي</TH>
                  <TH>المرحلة</TH>
                  <TH justify="end">إجراءات</TH>
                </TR>
              </THead>
              <TBody>
                {filteredNeeds.length === 0 ? (
                  <TableEmpty
                    colSpan={6}
                    icon={ListFilter}
                    title="لا طلبات مطابقة"
                    body="ستظهر هنا الطلبات بمجرد أن يقدّمها مستفيد معتمد."
                  />
                ) : (
                  filteredNeeds.map((need) => (
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
                        {need.quantity ?? 0}
                      </TD>
                      <TD>
                        <StatusBadge status={need.status} />
                      </TD>
                      <TD justify="end">
                        <RowActions>
                          <IconButton
                            tone="danger"
                            aria-label={`حذف ${need.title}`}
                            onClick={() => handleDeleteNeed(need.id)}
                          >
                            <Trash2 size={15} />
                          </IconButton>
                        </RowActions>
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
