import type { Metadata } from "next";
import { Suspense } from "react";
import { ApiStatus } from "@/components/status/ApiStatus";
import styles from "@/components/shell/shell.module.css";
import { getDictionary } from "@/i18n";
import { resolveLocale } from "@/i18n/locale-params";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  return { title: getDictionary(await resolveLocale(params)).admin.title };
}

export default async function AdminHome({ params }: { params: Promise<{ locale: string }> }) {
  const dict = getDictionary(await resolveLocale(params));
  return (
    <>
      <h1>{dict.admin.title}</h1>
      <p>{dict.admin.placeholder}</p>
      <p className={styles.notice} role="note">
        {dict.admin.noAuthYet}
      </p>
      <Suspense fallback={<p aria-busy="true">…</p>}>
        <ApiStatus dict={dict} />
      </Suspense>
    </>
  );
}
