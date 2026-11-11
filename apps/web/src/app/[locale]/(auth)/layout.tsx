import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import styles from "@/components/auth/auth.module.css";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { LanguageSwitcher } from "@/components/shell/LanguageSwitcher";
import { getDictionary } from "@/i18n";
import { resolveLocale } from "@/i18n/locale-params";

// Account screens are personal and never indexed.
export const metadata: Metadata = { robots: { index: false, follow: false } };

/** Account screens: the night-studio desk with one sheet of paper; no site chrome to distract. */
export default async function AuthLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: string }> }) {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);
  return (
    <div className={`world ${styles.page}`}>
      <header className={`container ${styles.bar}`}>
        <Link href={`/${locale}`} aria-label={`${dict.meta.siteName}, ${dict.nav.home}`}>
          <BrandLogo variant="colorOnDark" alt="" width={112} />
        </Link>
        <div className={styles.barEnd}>
          <LanguageSwitcher locale={locale} label={dict.a11y.switchLanguage} targetName={dict.language.switchTo} />
          <Link href={`/${locale}`} className={styles.back}>{dict.auth.layout.back}</Link>
        </div>
      </header>
      <main id="main" tabIndex={-1} className={`container ${styles.desk}`}>
        {children}
      </main>
      <p className={`container ${styles.note}`}>{dict.auth.layout.note}</p>
    </div>
  );
}
