"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import { LayoutDashboard, LogOut, Menu, X, HeartHandshake } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { useExpressAuth } from "@/lib/auth-context";
import { Logo } from "@/components/ui/Logo";
import { ButtonLink, buttonClass } from "@/components/ui/Button";

const links = [
  { href: "/", label: "الرئيسية" },
  { href: "/how-it-works", label: "كيف تعمل" },
  { href: "/catalog", label: "المعروضات" },
  { href: "/about", label: "من نحن" },
  { href: "/faq", label: "الأسئلة" },
];

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = React.useState<Session | null>(null);
  const { user: expressUser, logout: expressLogout } = useExpressAuth();
  const isAuthenticated = Boolean(session) || Boolean(expressUser);

  // Remember which route the sheet was opened on, so navigating away closes it
  // without needing an effect that reacts to the pathname.
  const [openedOn, setOpenedOn] = React.useState<string | null>(null);
  const open = openedOn !== null && openedOn === pathname;

  React.useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await Promise.all([supabase.auth.signOut(), expressLogout()]);
    router.push("/auth/login");
    router.refresh();
  };

  // The dashboard and the auth split screen own their full viewport.
  if (pathname?.startsWith("/dashboard") || pathname?.startsWith("/auth"))
    return null;

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname?.startsWith(href);

  return (
    <header className="sticky top-0 z-50 pt-4 pb-2">
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
        <div className="glass flex items-center justify-between gap-3 rounded-full p-2 shadow-lg ring-1 ring-white/50">
          <Link
            href="/"
            className="shrink-0 rounded-full ps-2"
            aria-label="أثر — الصفحة الرئيسية"
          >
            <Logo />
          </Link>

          {/* ---------------- Desktop nav ---------------- */}
          <nav className="hidden items-center gap-1 lg:flex">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-full px-4 py-2.5 text-sm font-semibold transition-colors",
                  isActive(link.href)
                    ? "bg-ink-900 text-sand-50"
                    : "text-ink-800 hover:bg-white/70 hover:text-brand-700"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* ---------------- Desktop actions ---------------- */}
          <div className="hidden items-center gap-2 lg:flex">
            {isAuthenticated ? (
              <>
                <Link
                  href="/dashboard"
                  className={buttonClass({ variant: "outline", size: "md" })}
                >
                  <LayoutDashboard size={16} />
                  لوحتي
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  aria-label="تسجيل الخروج"
                  className="flex h-11 w-11 items-center justify-center rounded-full text-ink-700 transition-colors hover:bg-rose-50 hover:text-rose-600"
                >
                  <LogOut size={17} />
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="rounded-full px-4 py-2.5 text-sm font-semibold text-ink-800 transition-colors hover:text-brand-700"
                >
                  الدخول
                </Link>
                <ButtonLink href="/auth/register" variant="primary">
                  <HeartHandshake size={16} />
                  تبرّع الآن
                </ButtonLink>
              </>
            )}
          </div>

          {/* ---------------- Mobile trigger ---------------- */}
          <button
            type="button"
            onClick={() => setOpenedOn(open ? null : (pathname ?? "/"))}
            aria-expanded={open}
            aria-label="القائمة"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-ink-900 text-sand-50 transition-colors hover:bg-ink-800 lg:hidden"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* ---------------- Mobile sheet ---------------- */}
        {open && (
          <div className="glass mt-2 animate-pop rounded-3xl p-3 shadow-xl ring-1 ring-white/50 lg:hidden">
            <nav className="flex flex-col gap-1">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "rounded-2xl px-4 py-3.5 text-sm font-semibold transition-colors",
                    isActive(link.href)
                      ? "bg-ink-900 text-sand-50"
                      : "text-ink-800 hover:bg-white/70"
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="mt-3 flex flex-col gap-2 border-t border-white/60 pt-3">
              {isAuthenticated ? (
                <>
                  <ButtonLink href="/dashboard" variant="dark" full>
                    <LayoutDashboard size={16} />
                    لوحة التحكم
                  </ButtonLink>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="rounded-full px-4 py-3 text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-50"
                  >
                    تسجيل الخروج
                  </button>
                </>
              ) : (
                <>
                  <ButtonLink href="/auth/login" variant="outline" full>
                    تسجيل الدخول
                  </ButtonLink>
                  <ButtonLink href="/auth/register" variant="primary" full>
                    <HeartHandshake size={16} />
                    تبرّع الآن
                  </ButtonLink>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
