import { POLICY_KEYS, type Locale } from "@as/contracts";
import Image from "next/image";
import Link from "next/link";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { POLICY_TITLES } from "@/content/policies";
import { SOCIETY } from "@/content/society";
import type { Dictionary } from "@/i18n/types";
import styles from "./footer.module.css";

export function SiteFooter({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const explore = ["fields", "projects", "news", "partners"] as const;
  const society = ["about", "membership", "contact"] as const;
  return (
    <footer className={styles.footer}>
      <Image src="/brand/elements/lines-dark.webp" alt="" fill sizes="100vw" className={styles.art} data-speed="0.08" />
      <div className={styles.glow} aria-hidden="true" />
      <div className={`container ${styles.statement}`}>
        <p className={styles.big} aria-hidden="true">
          {dict.footer.statement.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </p>
        <p className="visually-hidden">{dict.footer.statement.join(" ")}</p>
        <Link href={`/${locale}/membership`} className="btn btn-primary">
          {dict.actions.exploreMembership}
        </Link>
      </div>
      <div className={`container ${styles.inner}`}>
        <div className={styles.brand}>
          <BrandLogo variant="colorOnDark" alt={dict.meta.siteName} width={140} />
          <p className={styles.tagline}>{dict.meta.tagline}</p>
          <a href={SOCIETY.website} className={styles.site}>
            {dict.footer.website}
          </a>
        </div>
        <nav aria-label={dict.footer.explore} className={styles.col}>
          <h2 className={styles.heading}>{dict.footer.explore}</h2>
          <ul>
            {explore.map((s) => (
              <li key={s}><Link href={`/${locale}/${s}`}>{dict.nav[s]}</Link></li>
            ))}
          </ul>
        </nav>
        <nav aria-label={dict.footer.society} className={styles.col}>
          <h2 className={styles.heading}>{dict.footer.society}</h2>
          <ul>
            {society.map((s) => (
              <li key={s}><Link href={`/${locale}/${s}`}>{dict.nav[s]}</Link></li>
            ))}
            <li><Link href={`/${locale}/member`}>{dict.actions.signIn}</Link></li>
          </ul>
        </nav>
        <nav aria-label={dict.footer.policies} className={styles.col}>
          <h2 className={styles.heading}>{dict.footer.policies}</h2>
          <ul>
            {POLICY_KEYS.map((slug) => (
              <li key={slug}><Link href={`/${locale}/policies#${slug}`}>{POLICY_TITLES[slug][locale]}</Link></li>
            ))}
          </ul>
        </nav>
      </div>
      <div className={`container ${styles.base}`}>
        <p>{dict.footer.note}</p>
      </div>
    </footer>
  );
}
