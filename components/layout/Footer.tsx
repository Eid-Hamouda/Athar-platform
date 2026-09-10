import Link from "next/link";
import { ArrowLeft, Mail, MapPin, Phone } from "lucide-react";
import {
  FiFacebook,
  FiInstagram,
  FiLinkedin,
  FiTwitter,
} from "react-icons/fi";
import { Container, Panel } from "@/components/ui/Section";
import { Logo } from "@/components/ui/Logo";
import { ButtonLink } from "@/components/ui/Button";

const columns = [
  {
    title: "المنصة",
    links: [
      { href: "/how-it-works", label: "كيف تعمل" },
      { href: "/catalog", label: "المعروضات والطلبات" },
      { href: "/donate", label: "تبرّع بقطعة" },
      { href: "/matches", label: "المطابقة الذكية" },
    ],
  },
  {
    title: "عن أثر",
    links: [
      { href: "/about", label: "قصتنا" },
      { href: "/faq", label: "الأسئلة الشائعة" },
      { href: "/contact", label: "تواصل معنا" },
      { href: "/auth/register", label: "انضم كمتطوع" },
    ],
  },
  {
    title: "قانوني",
    links: [
      { href: "/policy", label: "سياسة المنصة" },
      { href: "/privacy", label: "الخصوصية" },
      { href: "/terms", label: "شروط الاستخدام" },
    ],
  },
];

const socials = [
  { href: "#", label: "فيسبوك", Icon: FiFacebook },
  { href: "#", label: "إكس", Icon: FiTwitter },
  { href: "#", label: "إنستغرام", Icon: FiInstagram },
  { href: "#", label: "لينكدإن", Icon: FiLinkedin },
];

export function Footer() {
  return (
    <footer className="pb-5">
      <Container width="wide">
        <Panel textured className="p-8 md:p-14">
          <div className="grid gap-14 lg:grid-cols-[1.15fr_1.35fr]">
            {/* ---------------- Closing note ---------------- */}
            <div>
              <Logo tone="light" />

              <h2 className="mt-8 max-w-md font-display text-h1 font-extrabold text-balance text-sand-50">
                ما يفيض عنك، يكفي بيتاً كاملاً.
              </h2>

              <p className="mt-5 max-w-md text-pretty text-sand-200/75">
                منصة مجانية بالكامل لكل الأطراف — بلا عمولة ولا رسوم اشتراك.
              </p>

              <ButtonLink
                href="/auth/register"
                variant="gold"
                size="lg"
                className="mt-8"
              >
                أنشئ حسابك مجاناً
                <ArrowLeft
                  size={18}
                  className="transition-transform duration-300 group-hover/btn:-translate-x-1"
                />
              </ButtonLink>
            </div>

            {/* ---------------- Link columns ---------------- */}
            <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
              {columns.map((column) => (
                <nav key={column.title}>
                  <h3 className="text-small font-bold text-gold-300">
                    {column.title}
                  </h3>
                  <ul className="mt-5 flex flex-col gap-3.5">
                    {column.links.map((link) => (
                      <li key={link.href + link.label}>
                        <Link
                          href={link.href}
                          className="text-sm text-sand-200/75 transition-colors hover:text-sand-50"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </nav>
              ))}
            </div>
          </div>

          {/* ---------------- Contact + legal bar ---------------- */}
          <div className="mt-14 flex flex-col gap-6 border-t border-white/10 pt-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-x-7 gap-y-3 text-small text-sand-200/70">
              <span className="flex items-center gap-2">
                <MapPin size={15} className="text-gold-300" />
                دمشق، سوريا
              </span>
              <a
                href="tel:+963123456789"
                dir="ltr"
                className="flex items-center gap-2 transition-colors hover:text-sand-50"
              >
                <Phone size={15} className="text-gold-300" />
                +963 123 456 789
              </a>
              <a
                href="mailto:support@athar-platform.com"
                className="flex items-center gap-2 transition-colors hover:text-sand-50"
              >
                <Mail size={15} className="text-gold-300" />
                support@athar-platform.com
              </a>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex gap-2">
                {socials.map(({ href, label, Icon }) => (
                  <a
                    key={label}
                    href={href}
                    aria-label={label}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-sand-200/70 ring-1 ring-white/10 transition-colors hover:bg-white/15 hover:text-sand-50"
                  >
                    <Icon size={16} />
                  </a>
                ))}
              </div>
              <p className="text-small text-sand-300/70">
                © {new Date().getFullYear()} أثر
              </p>
            </div>
          </div>
        </Panel>
      </Container>
    </footer>
  );
}
