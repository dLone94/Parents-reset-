import type { Metadata, Viewport } from "next";
import { Manrope, Source_Serif_4 } from "next/font/google";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { ToastProvider } from "@/components/feedback/Toast";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { MobileTabBar } from "@/components/layout/MobileTabBar";
import { OfflineBanner } from "@/components/layout/OfflineBanner";
import { ServiceWorkerRegistration } from "@/components/layout/ServiceWorkerRegistration";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { routing } from "@/i18n/routing";
import { themeScript } from "@/lib/theme";
import { buildAlternates, getSiteUrl } from "@/lib/seo";
import { getCurrentUser } from "@/lib/supabase/user";
import { PersistenceProvider } from "@/services/persistence/PersistenceProvider";
import "../globals.css";

const body = Manrope({
  subsets: ["latin", "latin-ext", "cyrillic", "cyrillic-ext", "greek", "vietnamese"],
  variable: "--font-body",
  display: "swap",
});

const display = Source_Serif_4({
  subsets: ["latin", "latin-ext", "cyrillic", "cyrillic-ext", "greek", "vietnamese"],
  variable: "--font-display",
  display: "swap",
  weight: ["500", "600"],
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const viewport: Viewport = {
  themeColor: "#faf6ef",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    metadataBase: new URL(getSiteUrl()),
    title: {
      default: t("home.title"),
      template: `%s · ${t("siteName")}`,
    },
    description: t("home.description"),
    applicationName: t("siteName"),
    manifest: "/manifest.webmanifest",
    appleWebApp: { capable: true, statusBarStyle: "default", title: t("siteName") },
    icons: {
      icon: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
      apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    },
    alternates: buildAlternates(locale, "/"),
    openGraph: {
      siteName: t("siteName"),
      locale,
      type: "website",
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "common" });
  const user = await getCurrentUser();

  return (
    <html lang={locale} className={`${body.variable} ${display.variable} h-full antialiased`}>
      <head>
        {/* Sets the palette before the first paint, so a night visit never
            flashes a bright screen. */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-full flex-col pb-16 md:pb-0">
        <NextIntlClientProvider>
          <ThemeProvider>
            <ToastProvider>
              <PersistenceProvider userId={user?.id ?? null}>
                <a
                  href="#content"
                  className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-paper focus:px-4 focus:py-2"
                >
                  {t("skipToContent")}
                </a>
                <OfflineBanner />
                <Header userEmail={user?.email ?? null} />
                <main id="content" className="flex flex-1 flex-col">
                  {children}
                </main>
                <ServiceWorkerRegistration />
                <Footer />
                <MobileTabBar />
              </PersistenceProvider>
            </ToastProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
