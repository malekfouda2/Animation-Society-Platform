"use client";

import { isLocale } from "@as/contracts";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ar } from "@/i18n/dictionaries/ar";
import { en } from "@/i18n/dictionaries/en";

export default function NotFound() {
  const params = useParams<{ locale?: string }>();
  const locale = isLocale(params.locale) ? params.locale : "ar";
  const dict = locale === "ar" ? ar : en;
  return (
    <main id="main" className="container" style={{ paddingBlock: "var(--as-space-16)", flex: 1 }}>
      <h1>{dict.notFound.title}</h1>
      <p>{dict.notFound.body}</p>
      <Link href={`/${locale}`}>{dict.notFound.home}</Link>
    </main>
  );
}
