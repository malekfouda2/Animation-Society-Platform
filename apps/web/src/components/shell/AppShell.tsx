import type { Locale } from "@as/contracts";
import Link from "next/link";
import type { ReactNode } from "react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import type { Dictionary } from "@/i18n/types";
import { LanguageSwitcher } from "./LanguageSwitcher";
import styles from "./shell.module.css";

interface Props {
  locale: Locale;
  dict: Dictionary;
  title: string;
  navLabel: string;
  items: { label: string; current?: boolean }[];
  children: ReactNode;
}

/** Shared member/admin frame: calm and efficient, sharing the brand navy. Items are inert until their stages ship. */
export function AppShell({ locale, dict, title, navLabel, items, children }: Props) {
  return (
    <div className={styles.app}>
      <aside className={styles.sidebar}>
        <Link href={`/${locale}`} className={styles.sidebarBrand} aria-label={`${dict.meta.siteName}, ${dict.nav.home}`}>
          <BrandLogo alt="" width={132} />
        </Link>
        <p className={styles.sidebarTitle}>{title}</p>
        <nav aria-label={navLabel}>
          <ul className={styles.sideList}>
            {items.map((item) => (
              <li key={item.label} className={styles.sideItem} aria-current={item.current ? "page" : undefined}>
                {item.label}
              </li>
            ))}
          </ul>
        </nav>
        <p className={styles.sidebarLang}>
          <LanguageSwitcher locale={locale} label={dict.a11y.switchLanguage} targetName={dict.language.switchTo} />
        </p>
      </aside>
      <main id="main" className={styles.appMain} tabIndex={-1}>
        {children}
      </main>
    </div>
  );
}
