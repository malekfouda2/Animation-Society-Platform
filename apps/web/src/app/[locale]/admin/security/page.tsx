import type { Metadata } from "next";
import { z } from "zod";
import { RegenerateCodesForm } from "@/components/auth/AccountForms";
import styles from "@/components/shell/shell.module.css";
import { getDictionary } from "@/i18n";
import { resolveLocale } from "@/i18n/locale-params";
import { apiFromServer } from "@/lib/server-api";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  return { title: getDictionary(await resolveLocale(params)).admin.security.title };
}

export default async function SecurityPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);
  const s = dict.admin.security;
  const res = await apiFromServer("/auth/mfa/recovery-codes");
  if (!res.ok) throw new Error(`recovery codes unavailable (${res.status})`);
  const { remaining } = z.object({ remaining: z.number() }).parse(await res.json());
  return (
    <>
      <h1>{s.title}</h1>
      <section className={styles.panel} aria-labelledby="codes-title">
        <h2 id="codes-title">{s.codesLeft}: {remaining}</h2>
        {remaining <= 3 ? <p className={styles.notice} role="note">{s.codesLow}</p> : null}
        <RegenerateCodesForm dict={dict.auth} labels={s} />
      </section>
    </>
  );
}
