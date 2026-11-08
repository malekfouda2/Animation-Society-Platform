import type { Locale } from "@as/contracts";
import Link from "next/link";
import { BrandLogo } from "@/components/brand/BrandLogo";
import type { Dictionary } from "@/i18n/types";
import { PUBLIC_SECTIONS } from "@/i18n/types";
import { NavBar } from "./NavBar";
import styles from "./header.module.css";

/** Minimal night-studio header: logo, language, membership and a Menu that opens the side drawer. */
export function SiteHeader({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const items = PUBLIC_SECTIONS.filter((s) => s !== "policies").map((s) => ({
    href: `/${locale}/${s}`,
    label: dict.nav[s],
  }));
  return (
    <header className={styles.header} data-header="">
      <div className={styles.bar}>
        <Link href={`/${locale}`} className={styles.logo} aria-label={`${dict.meta.siteName}, ${dict.nav.home}`}>
          <BrandLogo variant="colorOnDark" alt="" width={130} priority />
        </Link>
        <NavBar
          locale={locale}
          items={[{ href: `/${locale}`, label: dict.nav.home }, ...items]}
          cta={{ href: `/${locale}/membership`, label: dict.actions.exploreMembership }}
          secondary={[
            { href: `/${locale}/policies`, label: dict.nav.policies },
            { href: `/${locale}/member`, label: dict.actions.signIn },
          ]}
          tagline={dict.meta.tagline}
          labels={{
            nav: dict.a11y.primaryNav,
            menu: dict.a11y.menu,
            close: dict.a11y.closeMenu,
            switchLanguage: dict.a11y.switchLanguage,
            languageName: dict.language.switchTo,
            languageShort: dict.language.switchToShort,
          }}
        />
      </div>
    </header>
  );
}
