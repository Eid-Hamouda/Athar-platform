import type { Metadata, Viewport } from "next";
import { Rubik, Readex_Pro } from "next/font/google";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { HideOnRoutes } from "@/components/layout/RouteChrome";
import { ToastHost } from "@/components/ui/ToastHost";

// Display face: geometric, high-contrast Arabic for headlines.
const display = Rubik({
  subsets: ["arabic", "latin"],
  variable: "--font-display",
  display: "swap",
});

// Text face: Readex Pro is designed Arabic-first, so body copy stays even.
const body = Readex_Pro({
  subsets: ["arabic", "latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "أثر — أعطِ الفائض عمراً جديداً",
    template: "%s · أثر",
  },
  description:
    "أثر منصة تربط ما يفيض عن حاجتك بمن يحتاجه فعلاً. صوّر القطعة، ويتولى الذكاء الاصطناعي تصنيفها ومطابقتها، ويتولى المتطوعون توصيلها.",
  keywords: [
    "تبرع عيني",
    "منصة خيرية",
    "إعادة تدوير",
    "تكافل مجتمعي",
    "أثر",
    "سوريا",
  ],
  openGraph: {
    title: "أثر — أعطِ الفائض عمراً جديداً",
    description:
      "منصة تكافل تربط المعروضات الخيرية بالاحتياجات الحقيقية، مدعومة بالذكاء الاصطناعي وشبكة متطوعين.",
    type: "website",
    locale: "ar_SY",
    siteName: "أثر",
  },
};

export const viewport: Viewport = {
  themeColor: "#091713",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" data-scroll-behavior="smooth">
      {/* overflow-x-clip, not hidden: `hidden` would turn the body into a
          scroll container and break every `position: sticky` in the app. */}
      <body
        className={`${display.variable} ${body.variable} font-sans bg-sand-50 text-ink-800 min-h-screen overflow-x-clip`}
      >
        <ToastHost />
        <Navbar />
        <main>{children}</main>
        <HideOnRoutes prefixes={["/auth", "/dashboard"]}>
          <Footer />
        </HideOnRoutes>
      </body>
    </html>
  );
}
