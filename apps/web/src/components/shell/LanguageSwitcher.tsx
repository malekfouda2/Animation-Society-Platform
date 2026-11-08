"use client";

import type { Locale } from "@as/contracts";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { otherLocale, switchLocalePath } from "@/i18n/paths";
import styles from "./shell.module.css";

interface Props {
  locale: Locale;
  label: string;
  targetName: string;
}

/** Links to the equivalent page in the other language. */
export function LanguageSwitcher({ locale, label, targetName }: Props) {
  const pathname = usePathname();
  const target = otherLocale(locale);
  return (
    <Link
      className={styles.languageSwitch}
      href={switchLocalePath(pathname, target)}
      hrefLang={target}
      lang={target}
      aria-label={`${label}: ${targetName}`}
    >
      {targetName}
    </Link>
  );
}
