"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  Eye,
  EyeOff,
  UserPlus,
  PackageOpen,
  HeartHandshake,
  Truck,
  Building2,
  Info,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { AuthShell } from "@/components/ui/AuthShell";
import { Input, Field } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Feedback";

const roles = [
  {
    id: "donor",
    label: "متبرّع",
    note: "لديّ فائض أريد إيصاله",
    icon: PackageOpen,
  },
  {
    id: "beneficiary",
    label: "مستفيد",
    note: "أحتاج مساعدة عينية",
    icon: HeartHandshake,
  },
  {
    id: "volunteer",
    label: "متطوّع",
    note: "أستطيع نقل وتوصيل",
    icon: Truck,
  },
  {
    id: "organization",
    label: "جمعية",
    note: "أمثّل جهة خيرية",
    icon: Building2,
  },
] as const;

type RoleId = (typeof roles)[number]["id"];

export default function RegisterPage() {
  const router = useRouter();
  const [reveal, setReveal] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [form, setForm] = React.useState({
    fullName: "",
    email: "",
    password: "",
    role: "donor" as RoleId,
  });

  const needsApproval =
    form.role === "beneficiary" || form.role === "organization";

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const toastId = toast.loading("جاري إنشاء الحساب…");

    try {
      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
      });
      if (error) throw error;

      if (data.user) {
        const { error: profileError } = await supabase.from("profiles").insert([
          {
            id: data.user.id,
            full_name: form.fullName,
            role: form.role,
            is_approved: !needsApproval,
          },
        ]);
        if (profileError) throw profileError;
      }

      toast.success(
        needsApproval
          ? "أُنشئ حسابك. سيراجعه الفريق قبل تفعيل الطلبات."
          : "أُنشئ حسابك بنجاح. أهلاً بك في أثر.",
        { id: toastId }
      );
      router.push("/dashboard");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "تعذّر إنشاء الحساب. حاول مرة أخرى.",
        { id: toastId }
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell
      title="أنشئ حسابك"
      description="مجاني بالكامل، ويستغرق دقيقتين. اختر دورك وسنبني لك لوحة مناسبة له."
      pitch="انضم إلى شبكة تكافل حقيقية، لا قائمة بريدية."
      pitchBody="أكثر من 350 متبرّعاً و50 جمعية شريكة يعملون على نفس المنصة، بنفس الشفافية."
      image={{
        src: "/images/community-hands.jpg",
        alt: "أيادٍ متشابكة تعبّر عن التكافل",
      }}
      proof={{
        quote:
          "كنا نصرف ساعات على فرز التبرعات. أثر صنّفت وربطت كل شيء مكاننا.",
        name: "سارة الحلبي",
        role: "منسّقة — جمعية الإحسان",
        avatar: "/images/avatar-1.jpg",
      }}
      switchPrompt="لديك حساب بالفعل؟"
      switchHref="/auth/login"
      switchLabel="سجّل الدخول"
    >
      <form onSubmit={handleRegister} className="flex flex-col gap-5">
        {/* ---------- Role picker ---------- */}
        <Field
          label="ما دورك في المنصة؟"
          hint="يحدّد هذا شكل لوحة التحكم والصلاحيات المتاحة لك"
        >
          <div className="grid grid-cols-2 gap-2.5">
            {roles.map((role) => {
              const active = form.role === role.id;
              return (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => setForm({ ...form, role: role.id })}
                  aria-pressed={active}
                  className={cn(
                    "flex flex-col items-start gap-2 rounded-xl p-4 text-start transition-all duration-200",
                    active
                      ? "bg-brand-600 text-white shadow-md ring-2 ring-brand-600"
                      : "bg-sand-50 text-ink-800 ring-1 ring-inset ring-sand-200 hover:bg-white hover:ring-sand-300"
                  )}
                >
                  <role.icon
                    size={19}
                    strokeWidth={1.75}
                    className={active ? "text-gold-300" : "text-brand-600"}
                  />
                  <span className="text-sm font-bold">{role.label}</span>
                  <span
                    className={cn(
                      "text-micro",
                      active ? "text-white/75" : "text-ink-700/65"
                    )}
                  >
                    {role.note}
                  </span>
                </button>
              );
            })}
          </div>
        </Field>

        {needsApproval && (
          <Alert tone="info" icon={Info}>
            حسابات المستفيدين والجمعيات تمرّ بتدقيق يدوي قبل تفعيل تقديم الطلبات،
            ويستغرق ذلك عادةً أقل من 48 ساعة عمل.
          </Alert>
        )}

        <Input
          id="register-name"
          label="الاسم الكامل"
          required
          autoComplete="name"
          placeholder="مثال: ريم العبد"
          value={form.fullName}
          onChange={(e) => setForm({ ...form, fullName: e.target.value })}
        />

        <Input
          id="register-email"
          type="email"
          label="البريد الإلكتروني"
          required
          autoComplete="email"
          dir="ltr"
          placeholder="name@example.com"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />

        <Input
          id="register-password"
          type={reveal ? "text" : "password"}
          label="كلمة المرور"
          hint="ستة أحرف على الأقل"
          required
          minLength={6}
          autoComplete="new-password"
          dir="ltr"
          placeholder="••••••••"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          trailing={
            <button
              type="button"
              onClick={() => setReveal((v) => !v)}
              aria-label={reveal ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
              className="flex h-9 w-9 items-center justify-center rounded-full text-sand-500 transition-colors hover:bg-sand-100 hover:text-ink-800"
            >
              {reveal ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          }
        />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          full
          disabled={isLoading}
          className="mt-2"
        >
          <UserPlus size={18} />
          {isLoading ? "جاري الإنشاء…" : "إنشاء الحساب"}
        </Button>

        <p className="text-small text-ink-700/65">
          بإنشائك الحساب فإنك توافق على{" "}
          <a href="/terms" className="font-semibold text-brand-700 underline underline-offset-2">
            شروط الاستخدام
          </a>{" "}
          و
          <a href="/privacy" className="font-semibold text-brand-700 underline underline-offset-2">
            سياسة الخصوصية
          </a>
          .
        </p>
      </form>
    </AuthShell>
  );
}
