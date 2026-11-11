import type { Locale } from "@as/contracts";
import Link from "next/link";
import type { ReactNode } from "react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import type { Dictionary } from "@/i18n/types";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { SideNav } from "./SideNav";
import styles from "./shell.module.css";

interface Props {
  locale: Locale;
  dict: Dictionary;
  title: string;
  navLabel: string;
  items: { label: string; href?: string; section?: boolean }[];
  /** Account line and sign-out, shown under the navigation. */
  account?: ReactNode;
  children: ReactNode;
}

/** Shared member/admin frame: calm and efficient. Items without an href are not built yet. */
export function AppShell({ locale, dict, title, navLabel, items, account, children }: Props) {
  return (
    <div className={styles.app}>
      <aside className={styles.sidebar}>
        <Link href={`/${locale}`} className={styles.sidebarBrand} aria-label={`${dict.meta.siteName}, ${dict.nav.home}`}>
          <BrandLogo alt="" width={132} />
        </Link>
        <p className={styles.sidebarTitle}>{title}</p>
        <SideNav label={navLabel} items={items} />
        {account ? <div className={styles.sidebarAccount}>{account}</div> : null}
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
