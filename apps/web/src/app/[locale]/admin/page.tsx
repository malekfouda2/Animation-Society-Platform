import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { ApiStatus } from "@/components/status/ApiStatus";
import styles from "@/components/shell/shell.module.css";
import { getDictionary } from "@/i18n";
import { resolveLocale } from "@/i18n/locale-params";
import { getSession } from "@/lib/server-api";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  return { title: getDictionary(await resolveLocale(params)).admin.title };
}

export default async function AdminHome({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);
  const user = await getSession();
  if (!user) redirect(`/${locale}/sign-in`);
  return (
    <>
      <h1>{dict.admin.welcome.replace("{name}", user.name)}</h1>
      <p className={styles.lead}>{dict.admin.roleLine}: <strong>{dict.admin.roles[user.role]}</strong></p>
      <p className={styles.notice} role="note">{dict.admin.comingNext}</p>
      <Suspense fallback={<p aria-busy="true">…</p>}>
        <ApiStatus dict={dict} />
      </Suspense>
    </>
  );
}
