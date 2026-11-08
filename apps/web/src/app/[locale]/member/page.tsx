import type { Metadata } from "next";
import { getDictionary } from "@/i18n";
import { resolveLocale } from "@/i18n/locale-params";
import styles from "@/components/shell/shell.module.css";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  return { title: getDictionary(await resolveLocale(params)).member.title };
}

export default async function MemberHome({ params }: { params: Promise<{ locale: string }> }) {
  const dict = getDictionary(await resolveLocale(params));
  return (
    <>
      <h1>{dict.member.title}</h1>
      <p>{dict.member.placeholder}</p>
      <p className={styles.notice} role="note">
        {dict.member.noAuthYet}
      </p>
    </>
  );
}
