"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Eye, EyeOff, LogIn } from "lucide-react";

import { supabase } from "@/lib/supabase";
import { useExpressAuth } from "@/lib/auth-context";
import { AuthShell } from "@/components/ui/AuthShell";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function LoginPage() {
  const router = useRouter();
  const { login: expressLogin } = useExpressAuth();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [reveal, setReveal] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const toastId = toast.loading("جاري تسجيل الدخول…");

    // Donor/volunteer/organization/admin accounts live on the real Athar
    // backend; beneficiary accounts still live on Supabase (see
    // ATHAR_FRONTEND_BACKEND_INTEGRATION_PROMPT.md). The login form has no
    // role picker, so we try the real backend first and fall back to
    // Supabase — each store only recognizes its own users, so this is safe.
    try {
      await expressLogin({ email, password });
      toast.success("أهلاً بك مجدداً.", { id: toastId });
      router.push("/dashboard");
      return;
    } catch {
      // Not an Express account (or backend unreachable) — try Supabase next.
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;

      toast.success("أهلاً بك مجدداً.", { id: toastId });
      router.push("/dashboard");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "بيانات الدخول غير صحيحة. حاول مرة أخرى.",
        { id: toastId }
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell
      title="مرحباً بك مجدداً"
      description="سجّل دخولك لمتابعة تبرعاتك وطلباتك ومهامك."
      pitch="كل قطعة رفعتها لها مسار، وكل مسار له نهاية موثّقة."
      pitchBody="من لوحتك ترى ما وصل، وما هو قيد التوصيل، وما ينتظر متطوعاً — دون أن تسأل أحداً."
      image={{
        src: "/images/clothing-rack.jpg",
        alt: "رفّ ملابس مرتّبة بإضاءة دافئة",
      }}
      proof={{
        quote:
          "صوّرت الملابس بالجوال، وبعد يومين وصلني إشعار إنها صارت عند عائلة في حرستا.",
        name: "أحمد محمود",
        role: "متبرّع — دمشق",
        avatar: "/images/avatar-3.jpg",
      }}
      switchPrompt="ليس لديك حساب؟"
      switchHref="/auth/register"
      switchLabel="أنشئ واحداً مجاناً"
    >
      <form onSubmit={handleLogin} className="flex flex-col gap-5">
        <Input
          id="login-email"
          type="email"
          label="البريد الإلكتروني"
          required
          autoComplete="email"
          dir="ltr"
          placeholder="name@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <Input
          id="login-password"
          type={reveal ? "text" : "password"}
          label="كلمة المرور"
          required
          autoComplete="current-password"
          dir="ltr"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
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
          <LogIn size={18} />
          {isLoading ? "جاري التحقق…" : "تسجيل الدخول"}
        </Button>
      </form>
    </AuthShell>
  );
}
