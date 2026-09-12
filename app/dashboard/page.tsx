"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  Menu,
  X,
  LogOut,
  LayoutDashboard,
  Users,
  Package,
  ListFilter,
  Store,
  HeartHandshake,
  Truck,
  ExternalLink,
  Clock,
  ShoppingBag,
  History,
  ChevronLeft,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { supabase } from "@/lib/supabase";
import { compressImage } from "@/lib/compressImage";
import { cn } from "@/lib/utils";
import type { UserProfile, DonationItem, NeedRequest } from "@/types";
import AdminView from "@/components/dashboard/AdminView";
import BeneficiaryView from "@/components/dashboard/BeneficiaryView";
import VolunteerView from "@/components/dashboard/VolunteerView";
import DonorView from "@/components/dashboard/DonorView";
import { Logo } from "@/components/ui/Logo";
import { LoadingState } from "@/components/ui/Feedback";

/* -------------------------------------------------------------------------- */
/* Navigation model                                                           */
/* -------------------------------------------------------------------------- */

interface NavLink {
  id: string;
  label: string;
  icon: LucideIcon;
}

interface NavGroup {
  label: string;
  items: NavLink[];
}

const ROLE_LABELS: Record<string, string> = {
  admin: "مسؤول المنصة",
  donor: "متبرّع",
  beneficiary: "مستفيد",
  volunteer: "متطوّع",
  organization: "جمعية شريكة",
};

const TAB_LABELS: Record<string, string> = {
  overview: "نظرة عامة",
  "manage-users": "المستخدمون",
  "manage-items": "القطع والتبرعات",
  "manage-needs": "طلبات الاحتياج",
  catalog: "الكاتالوج",
  cart: "سلة الحجز",
  "my-needs": "طلباتي",
  "volunteer-tasks": "المهام النشطة",
  "volunteer-history": "سجل التسليمات",
  "open-needs": "طلبات مفتوحة",
};

const NAV: Record<string, NavGroup[]> = {
  admin: [
    {
      label: "التحليلات",
      items: [{ id: "overview", label: "نظرة عامة", icon: LayoutDashboard }],
    },
    {
      label: "الإدارة",
      items: [
        { id: "manage-users", label: "المستخدمون", icon: Users },
        { id: "manage-items", label: "القطع والتبرعات", icon: Package },
        { id: "manage-needs", label: "طلبات الاحتياج", icon: ListFilter },
      ],
    },
  ],
  donor: [
    {
      label: "تبرعاتي",
      items: [{ id: "overview", label: "سجل التبرعات", icon: Package }],
    },
    {
      label: "فرص العطاء",
      items: [
        { id: "open-needs", label: "طلبات مفتوحة", icon: HeartHandshake },
      ],
    },
  ],
  beneficiary: [
    {
      label: "التصفّح",
      items: [
        { id: "catalog", label: "الكاتالوج المتاح", icon: Store },
        { id: "cart", label: "سلة الحجز", icon: ShoppingBag },
      ],
    },
    {
      label: "طلباتي",
      items: [{ id: "my-needs", label: "سجل الطلبات", icon: HeartHandshake }],
    },
  ],
  volunteer: [
    {
      label: "الميدان",
      items: [
        { id: "volunteer-tasks", label: "المهام النشطة", icon: Truck },
        { id: "volunteer-history", label: "سجل التسليمات", icon: History },
      ],
    },
  ],
};

NAV.organization = NAV.beneficiary;

/* -------------------------------------------------------------------------- */

export default function DashboardPage() {
  const router = useRouter();

  const [profile, setProfile] = React.useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = React.useState("overview");
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  // Modals
  const [isAddUserModalOpen, setIsAddUserModalOpen] = React.useState(false);
  const [isAddItemModalOpen, setIsAddItemModalOpen] = React.useState(false);
  const [isAddNeedModalOpen, setIsAddNeedModalOpen] = React.useState(false);
  const [isAddDonationModalOpen, setIsAddDonationModalOpen] =
    React.useState(false);

  // Shared data
  const [allUsers, setAllUsers] = React.useState<UserProfile[]>([]);
  const [donations, setDonations] = React.useState<DonationItem[]>([]);
  const [needs, setNeeds] = React.useState<NeedRequest[]>([]);

  // Beneficiary state
  const [cart, setCart] = React.useState<DonationItem[]>([]);
  const [deliveryAddress, setDeliveryAddress] = React.useState("");
  const [deliveryLocation, setDeliveryLocation] = React.useState("");
  const [contactPhone, setContactPhone] = React.useState("");
  const [newNeed, setNewNeed] = React.useState({
    title: "",
    category: "",
    sub_category: "",
    urgency: "عادي",
    description: "",
    quantity: 1,
    delivery_address: "",
    delivery_location: "",
    contact_phone: "",
  });

  // Admin state
  const [newUser, setNewUser] = React.useState({
    fullName: "",
    email: "",
    password: "",
    role: "beneficiary",
  });
  const [newItem, setNewItem] = React.useState({
    title: "",
    category: "",
    sub_category: "",
    location: "",
    condition: "ممتازة",
    description: "",
    volunteer_id: "",
  });
  const [itemFile, setItemFile] = React.useState<File | null>(null);

  // Donor state
  const [donorFormData, setDonorFormData] = React.useState({
    title: "",
    category: "",
    sub_category: "",
    condition: "ممتازة",
    description: "",
    location: "",
    target_need_id: null as string | null,
  });
  const [donorFile, setDonorFile] = React.useState<File | null>(null);

  /* ---------------- Bootstrap ---------------- */
  React.useEffect(() => {
    const fetchData = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return router.push("/auth/login");

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();
      setProfile(profileData);

      if (profileData?.role === "volunteer") setActiveTab("volunteer-tasks");
      if (
        profileData?.role === "beneficiary" ||
        profileData?.role === "organization"
      )
        setActiveTab("catalog");

      if (profileData?.role === "admin") {
        const { data: usersData } = await supabase.from("profiles").select("*");
        setAllUsers(usersData || []);
      }

      const [{ data: donationsData }, { data: needsData }] = await Promise.all([
        supabase
          .from("donations")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase
          .from("needs")
          .select("*")
          .order("created_at", { ascending: false }),
      ]);

      setDonations(donationsData || []);
      setNeeds(needsData || []);
      setLoading(false);
    };

    fetchData();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  /* ---------------- Admin actions ---------------- */
  const handleAssignVolunteer = async (
    donationId: string,
    volunteerId: string
  ) => {
    const toastId = toast.loading("جاري تعيين المتطوّع…");
    try {
      const { error } = await supabase
        .from("donations")
        .update({ volunteer_id: volunteerId || null })
        .eq("id", donationId);
      if (error) throw error;

      setDonations((prev) =>
        prev.map((d) =>
          d.id === donationId
            ? { ...d, volunteer_id: volunteerId || undefined }
            : d
        )
      );
      toast.success("حُدّث التعيين.", { id: toastId });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذّر التعيين.", {
        id: toastId,
      });
    }
  };

  const handleAdminCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    // Creating auth users requires a service-role key, so this stays a stub.
    toast.success("تمت محاكاة إنشاء المستخدم.");
    setIsAddUserModalOpen(false);
  };

  const handleUpdateRole = async (id: string, role: string) => {
    await supabase.from("profiles").update({ role }).eq("id", id);
    setAllUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role } : u)));
    toast.success("حُدّث الدور.");
  };

  const handleApproveUser = async (id: string) => {
    await supabase.from("profiles").update({ is_approved: true }).eq("id", id);
    setAllUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, is_approved: true } : u))
    );
    toast.success("اعتُمد الحساب.");
  };

  const handleDeleteUser = async (id: string) => {
    await supabase.from("profiles").delete().eq("id", id);
    setAllUsers((prev) => prev.filter((u) => u.id !== id));
    toast.success("حُذف المستخدم.");
  };

  const handleDeleteItem = async (id: string) => {
    await supabase.from("donations").delete().eq("id", id);
    setDonations((prev) => prev.filter((d) => d.id !== id));
    toast.success("حُذف العنصر.");
  };

  const handleDeleteNeed = async (id: string) => {
    await supabase.from("needs").delete().eq("id", id);
    setNeeds((prev) => prev.filter((n) => n.id !== id));
    toast.success("حُذف الطلب.");
  };

  const handleAdminCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemFile) return toast.error("أضف صورة للعنصر.");

    setIsSubmitting(true);
    const toastId = toast.loading("جاري الرفع…");

    try {
      // Shrunk client-side so next/image can refetch it inside its 7s budget.
      const upload = await compressImage(itemFile);
      const extension = upload.name.split(".").pop() ?? "jpg";
      const fileName = `admin_${Date.now()}_${Math.random()
        .toString(36)
        .slice(2)}.${extension}`;

      await supabase.storage
        .from("donations-images")
        .upload(fileName, upload, { contentType: upload.type });
      const { data } = supabase.storage
        .from("donations-images")
        .getPublicUrl(fileName);

      const { data: inserted, error } = await supabase
        .from("donations")
        .insert({
          title: newItem.title,
          category: newItem.category,
          sub_category: newItem.sub_category,
          location: newItem.location,
          condition: newItem.condition,
          description: newItem.description,
          image_url: data.publicUrl,
          donor_id: profile?.id,
          status: "available",
          volunteer_id: newItem.volunteer_id || null,
        })
        .select()
        .single();
      if (error) throw error;

      setDonations((prev) => [inserted, ...prev]);
      setNewItem({
        title: "",
        category: "",
        sub_category: "",
        location: "",
        condition: "ممتازة",
        description: "",
        volunteer_id: "",
      });
      setItemFile(null);
      setIsAddItemModalOpen(false);
      toast.success("أُضيف العنصر.", { id: toastId });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذّرت الإضافة.", {
        id: toastId,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ---------------- Beneficiary actions ---------------- */
  const handleCreateNeed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNeed.delivery_location)
      return toast.error("حدّد موقع التوصيل على الخريطة.");
    if (!newNeed.contact_phone) return toast.error("أدخل رقم التواصل.");

    setIsSubmitting(true);
    const { data: inserted, error } = await supabase
      .from("needs")
      .insert({ ...newNeed, beneficiary_id: profile?.id, status: "pending" })
      .select()
      .single();
    setIsSubmitting(false);

    if (error) return toast.error(error.message);

    setNeeds((prev) => [inserted, ...prev]);
    setNewNeed({
      title: "",
      category: "",
      sub_category: "",
      urgency: "عادي",
      description: "",
      quantity: 1,
      delivery_address: "",
      delivery_location: "",
      contact_phone: "",
    });
    toast.success("رُفع طلبك.");
    setIsAddNeedModalOpen(false);
    setActiveTab("my-needs");
  };

  const handleAddToCart = (item: DonationItem) => {
    if (cart.some((c) => c.id === item.id))
      return toast.error("القطعة موجودة في السلة.");
    setCart((prev) => [...prev, item]);
    toast.success("أُضيفت إلى السلة.");
  };

  const handleRemoveFromCart = (id: string) =>
    setCart((prev) => prev.filter((c) => c.id !== id));

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    if (!deliveryLocation) return toast.error("حدّد موقع التوصيل على الخريطة.");
    if (!contactPhone) return toast.error("أدخل رقم التواصل.");

    setIsSubmitting(true);
    const toastId = toast.loading("جاري تأكيد الحجز…");

    try {
      const payload = {
        status: "reserved",
        delivery_address: deliveryAddress,
        delivery_location: deliveryLocation,
        contact_phone: contactPhone,
        beneficiary_id: profile?.id,
      };

      await Promise.all(
        cart.map((item) =>
          supabase.from("donations").update(payload).eq("id", item.id)
        )
      );

      setDonations((prev) =>
        prev.map((d) =>
          cart.some((c) => c.id === d.id) ? { ...d, ...payload } : d
        )
      );
      setCart([]);
      setDeliveryAddress("");
      setDeliveryLocation("");
      setContactPhone("");
      toast.success("حُجزت القطع. بانتظار تعيين متطوّع.", { id: toastId });
      setActiveTab("catalog");
    } catch {
      toast.error("تعذّر تأكيد الحجز.", { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ---------------- Donor actions ---------------- */
  const handleDonorCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!donorFile) return toast.error("أضف صورة للقطعة.");

    setIsSubmitting(true);
    const toastId = toast.loading("جاري رفع التبرع…");

    try {
      // Shrunk client-side so next/image can refetch it inside its 7s budget.
      const upload = await compressImage(donorFile);
      const extension = upload.name.split(".").pop() ?? "jpg";
      const fileName = `donation_${Date.now()}_${Math.random()
        .toString(36)
        .slice(2)}.${extension}`;

      await supabase.storage
        .from("donations-images")
        .upload(fileName, upload, { contentType: upload.type });
      const { data: publicUrl } = supabase.storage
        .from("donations-images")
        .getPublicUrl(fileName);

      const targetNeed = donorFormData.target_need_id
        ? needs.find((n) => n.id === donorFormData.target_need_id)
        : null;

      const payload = {
        title: donorFormData.title,
        category: donorFormData.category,
        sub_category: donorFormData.sub_category,
        condition: donorFormData.condition,
        description: donorFormData.description,
        location: donorFormData.location,
        image_url: publicUrl.publicUrl,
        donor_id: profile?.id,
        target_need_id: donorFormData.target_need_id,
        status: targetNeed ? "reserved" : "available",
        beneficiary_id: targetNeed ? targetNeed.beneficiary_id : null,
        delivery_address: targetNeed ? targetNeed.delivery_address : null,
        delivery_location: targetNeed ? targetNeed.delivery_location : null,
        contact_phone: targetNeed ? targetNeed.contact_phone : null,
      };

      const { data: inserted, error } = await supabase
        .from("donations")
        .insert(payload)
        .select()
        .single();
      if (error) throw error;

      setDonations((prev) => [inserted, ...prev]);

      if (targetNeed) {
        const nextQuantity = Math.max(0, (targetNeed.quantity || 1) - 1);
        const nextStatus =
          nextQuantity === 0 ? "pending_delivery" : targetNeed.status;

        const { error: updateError } = await supabase
          .from("needs")
          .update({ quantity: nextQuantity, status: nextStatus })
          .eq("id", targetNeed.id);
        if (updateError) console.error("Need update failed:", updateError);

        setNeeds((prev) =>
          prev.map((n) =>
            n.id === targetNeed.id
              ? { ...n, quantity: nextQuantity, status: nextStatus }
              : n
          )
        );
      }

      setIsAddDonationModalOpen(false);
      setDonorFormData({
        title: "",
        category: "",
        sub_category: "",
        condition: "ممتازة",
        description: "",
        location: "",
        target_need_id: null,
      });
      setDonorFile(null);

      toast.success(
        targetNeed
          ? "تم التبرع. جاري ترتيب التوصيل."
          : "نُشر تبرّعك في الكاتالوج.",
        { id: toastId }
      );
    } catch (error) {
      toast.error(
        `تعذّر رفع التبرع: ${
          error instanceof Error ? error.message : "خطأ غير متوقع"
        }`,
        { id: toastId }
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ---------------- Volunteer actions ---------------- */
  const handleCompleteDelivery = async (donationId: string) => {
    const toastId = toast.loading("جاري تأكيد التسليم…");
    try {
      const donation = donations.find((d) => d.id === donationId);

      await supabase
        .from("donations")
        .update({ status: "completed" })
        .eq("id", donationId);

      let nextNeeds = [...needs];
      let closedNeed = false;

      if (donation?.target_need_id) {
        const relatedNeed = needs.find((n) => n.id === donation.target_need_id);
        if (relatedNeed && relatedNeed.quantity === 0) {
          await supabase
            .from("needs")
            .update({ status: "completed" })
            .eq("id", relatedNeed.id);
          nextNeeds = nextNeeds.map((n) =>
            n.id === relatedNeed.id ? { ...n, status: "completed" } : n
          );
          closedNeed = true;
        }
      }

      setDonations((prev) =>
        prev.map((d) =>
          d.id === donationId ? { ...d, status: "completed" } : d
        )
      );
      setNeeds(nextNeeds);

      toast.success(
        closedNeed
          ? "أُكّد التسليم وأُغلق طلب الاحتياج."
          : "أُكّد التسليم بنجاح.",
        { id: toastId }
      );
    } catch {
      toast.error("تعذّر تأكيد التسليم.", { id: toastId });
    }
  };

  /* ---------------- Render ---------------- */

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-sand-50">
        <LoadingState label="جاري تحميل لوحتك…" />
      </div>
    );
  }

  const role = profile?.role ?? "";
  const groups = NAV[role] ?? [];
  const initials = (profile?.full_name ?? "؟").trim().charAt(0);
  const awaitingApproval =
    profile &&
    !profile.is_approved &&
    (role === "beneficiary" || role === "organization");

  const pendingApprovals =
    role === "admin"
      ? allUsers.filter(
          (u) =>
            !u.is_approved &&
            (u.role === "beneficiary" || u.role === "organization")
        ).length
      : 0;

  const navigate = (id: string) => {
    setActiveTab(id);
    setIsSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-sand-50" dir="rtl">
      {/* ==================== Mobile scrim ==================== */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 animate-fade bg-ink-950/50 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* ==================== Sidebar ==================== */}
      <aside
        className={cn(
          // `start-0` is the right edge under dir="rtl", which is where the
          // sidebar belongs; `translate-x-full` then hides it off that edge.
          "fixed inset-y-0 start-0 z-50 flex w-64 flex-col border-e border-white/5 bg-ink-950 transition-transform duration-300 ease-out lg:translate-x-0",
          isSidebarOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Brand */}
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-white/8 px-4">
          <Link href="/" className="flex items-center gap-2.5">
            <Logo tone="light" compact />
            <span className="text-sm font-bold text-sand-50">لوحة التحكم</span>
          </Link>
          <button
            type="button"
            onClick={() => setIsSidebarOpen(false)}
            aria-label="إغلاق القائمة"
            className="flex h-8 w-8 items-center justify-center rounded-md text-sand-300/70 hover:bg-white/10 hover:text-sand-50 lg:hidden"
          >
            <X size={17} />
          </button>
        </div>

        {/* Grouped nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-5">
          {groups.map((group) => (
            <div key={group.label} className="mb-6 last:mb-0">
              <p className="px-3 pb-2 text-micro font-bold text-sand-300/70">
                {group.label}
              </p>

              <ul className="flex flex-col gap-0.5">
                {group.items.map((item) => {
                  const isActive = activeTab === item.id;
                  const badge =
                    item.id === "cart"
                      ? cart.length
                      : item.id === "manage-users"
                        ? pendingApprovals
                        : 0;

                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => navigate(item.id)}
                        aria-current={isActive ? "page" : undefined}
                        className={cn(
                          "group relative flex w-full items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                          isActive
                            ? "bg-white/8 text-sand-50"
                            : "text-sand-300/65 hover:bg-white/5 hover:text-sand-100"
                        )}
                      >
                        {/* Precise active marker instead of a filled pill */}
                        {isActive && (
                          <span className="absolute inset-y-1.5 -start-3 w-0.5 rounded-full bg-gold-300" />
                        )}
                        <item.icon
                          size={16}
                          strokeWidth={1.75}
                          className={
                            isActive ? "text-gold-300" : "text-sand-300/60"
                          }
                        />
                        <span className="truncate">{item.label}</span>
                        {badge > 0 && (
                          <span className="ms-auto rounded-full bg-gold-300/90 px-1.5 py-0.5 text-micro font-bold tabular-nums text-ink-900">
                            {badge}
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Account */}
        <div className="shrink-0 border-t border-white/8 p-3">
          <div className="flex items-center gap-2.5 rounded-md px-2 py-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white/10 text-xs font-bold text-sand-50">
              {initials}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-sand-50">
                {profile?.full_name ?? "مستخدم"}
              </p>
              <p className="truncate text-micro text-sand-300/70">
                {ROLE_LABELS[role] ?? role}
              </p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              aria-label="تسجيل الخروج"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-sand-300/60 transition-colors hover:bg-rose-500/15 hover:text-rose-300"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* ==================== Main ==================== */}
      <div className="flex min-h-screen flex-col lg:ms-64">
        {/* Breadcrumb bar — the page's own title lives in each view's header */}
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-sand-200 bg-sand-50/90 px-4 backdrop-blur-md md:px-6">
          <button
            type="button"
            onClick={() => setIsSidebarOpen(true)}
            aria-label="القائمة"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-ink-800 ring-1 ring-sand-300 transition-colors hover:bg-white lg:hidden"
          >
            <Menu size={17} />
          </button>

          <nav
            aria-label="مسار التنقّل"
            className="flex min-w-0 items-center gap-1.5 text-sm"
          >
            <span className="hidden shrink-0 text-ink-700/60 sm:inline">
              {ROLE_LABELS[role] ?? "لوحة التحكم"}
            </span>
            <ChevronLeft
              size={14}
              className="hidden shrink-0 text-ink-700/55 sm:inline"
            />
            <span className="truncate font-semibold text-ink-900">
              {TAB_LABELS[activeTab] ?? "لوحة التحكم"}
            </span>
          </nav>

          <Link
            href="/"
            className="ms-auto flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold text-ink-700/75 transition-colors hover:bg-white hover:text-ink-900"
          >
            <ExternalLink size={13} />
            <span className="hidden sm:inline">عرض الموقع</span>
          </Link>
        </header>

        {/* Content */}
        <div className="mx-auto w-full max-w-[88rem] flex-1 px-4 py-6 md:px-6 md:py-8">
          {awaitingApproval && (
            <div className="mb-6 flex items-start gap-3 rounded-xl bg-gold-50 px-4 py-3.5 ring-1 ring-inset ring-gold-200">
              <Clock size={16} className="mt-0.5 shrink-0 text-gold-700" />
              <p className="text-sm text-gold-900">
                <span className="font-bold">حسابك قيد المراجعة.</span> يمكنك
                تصفّح الكاتالوج الآن، وتُفعَّل صلاحية تقديم الطلبات والحجز بعد
                اعتماد الفريق — عادةً خلال أقل من 48 ساعة عمل.
              </p>
            </div>
          )}

          {role === "admin" && (
            <AdminView
              activeTab={activeTab}
              allUsers={allUsers}
              donations={donations}
              needs={needs}
              pendingBeneficiaries={allUsers.filter(
                (u) =>
                  !u.is_approved &&
                  (u.role === "beneficiary" || u.role === "organization")
              )}
              newUser={newUser}
              setNewUser={setNewUser}
              newItem={newItem}
              setNewItem={setNewItem}
              itemFile={itemFile}
              setItemFile={setItemFile}
              handleAdminCreateUser={handleAdminCreateUser}
              handleAdminCreateItem={handleAdminCreateItem}
              handleUpdateRole={handleUpdateRole}
              handleApproveUser={handleApproveUser}
              handleDeleteUser={handleDeleteUser}
              handleDeleteItem={handleDeleteItem}
              handleDeleteNeed={handleDeleteNeed}
              handleAssignVolunteer={handleAssignVolunteer}
              isAddUserModalOpen={isAddUserModalOpen}
              setIsAddUserModalOpen={setIsAddUserModalOpen}
              isAddItemModalOpen={isAddItemModalOpen}
              setIsAddItemModalOpen={setIsAddItemModalOpen}
              isSubmitting={isSubmitting}
            />
          )}

          {(role === "beneficiary" || role === "organization") && (
            <BeneficiaryView
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              profile={profile}
              donations={donations}
              needs={needs}
              cart={cart}
              newNeed={newNeed}
              setNewNeed={setNewNeed}
              deliveryAddress={deliveryAddress}
              setDeliveryAddress={setDeliveryAddress}
              deliveryLocation={deliveryLocation}
              setDeliveryLocation={setDeliveryLocation}
              contactPhone={contactPhone}
              setContactPhone={setContactPhone}
              handleCreateNeed={handleCreateNeed}
              handleAddToCart={handleAddToCart}
              handleRemoveFromCart={handleRemoveFromCart}
              handleBulkSubmit={handleBulkSubmit}
              isAddNeedModalOpen={isAddNeedModalOpen}
              setIsAddNeedModalOpen={setIsAddNeedModalOpen}
              isSubmitting={isSubmitting}
            />
          )}

          {role === "volunteer" && (
            <VolunteerView
              activeTab={activeTab}
              donations={donations.filter((d) => d.volunteer_id === profile?.id)}
              handleCompleteDelivery={handleCompleteDelivery}
            />
          )}

          {role === "donor" && (
            <DonorView
              activeTab={activeTab}
              donations={donations}
              profile={profile}
              needs={needs}
              isAddDonationModalOpen={isAddDonationModalOpen}
              setIsAddDonationModalOpen={setIsAddDonationModalOpen}
              donorFormData={donorFormData}
              setDonorFormData={setDonorFormData}
              donorFile={donorFile}
              setDonorFile={setDonorFile}
              handleDonorCreateItem={handleDonorCreateItem}
              isSubmitting={isSubmitting}
            />
          )}
        </div>
      </div>
    </div>
  );
}
