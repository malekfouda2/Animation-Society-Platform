import { LOCALE_DIRECTION, LOCALES } from "@as/contracts";
import type { Metadata, Viewport } from "next";
import { Cairo } from "next/font/google";
import Script from "next/script";
import type { ReactNode } from "react";
import { loadWebEnv } from "@/config/env";
import { getDictionary } from "@/i18n";
import { generateLocaleParams, resolveLocale } from "@/i18n/locale-params";
import { RevealObserver } from "@/components/motion/RevealObserver";
import { ProvisionalBanner } from "@/components/shell/ProvisionalBanner";
import "@/styles/global.css";

// Brand typefaces, exactly as declared in the Society guideline (pp.21-23):
// Arabic: Cairo Black (titles), Bold (subtitles), SemiBold (text), Regular (notes).
const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["400", "600", "700", "900"],
  variable: "--font-cairo",
  display: "swap",
});
// English: RNS Sanz ExtraBold (titles), Bold (subtitles), SemiBold (text), Medium (notes), declared with
// @font-face in styles/global.css. The files (© 2014 Yorlmar Campos, from the Society Drive) are
// git-ignored in public/fonts/rns-sanz/ until the web licence is confirmed; without them English
// falls back to Cairo. See README.md.

export const dynamicParams = false;
export const generateStaticParams = generateLocaleParams;

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#000000" };

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);
  return {
    metadataBase: new URL(loadWebEnv().PUBLIC_ORIGIN),
    title: { default: dict.meta.siteName, template: `%s · ${dict.meta.siteName}` },
    description: dict.meta.description,
    alternates: {
      canonical: `/${locale}`,
      languages: Object.fromEntries(LOCALES.map((l) => [l, `/${l}`])),
    },
  };
}

export default async function LocaleRootLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);
  return (
    <html
      lang={locale}
      dir={LOCALE_DIRECTION[locale]}
      className={cairo.variable}
      suppressHydrationWarning
    >
      <body>
        {/* Marks JS availability (reveal animations never hide content without it) and, once per
            session with motion allowed, arms the public intro gate before first paint. */}
        <Script id="js-flag" strategy="beforeInteractive">{"var d=document.documentElement;d.classList.add('js');try{if(!sessionStorage.getItem('as-intro-seen')&&!matchMedia('(prefers-reduced-motion: reduce)').matches)d.classList.add('intro')}catch(e){}"}</Script>
        <a className="skip-link" href="#main">
          {dict.a11y.skipToContent}
        </a>
        <ProvisionalBanner text={dict.status.banner} />
        {children}
        <RevealObserver />
      </body>
    </html>
  );
}
