import type { Metadata } from "next";
import Link from "next/link";
import { PlanEditor } from "@/components/membership/PlanEditor";
import styles from "@/components/membership/membership.module.css";
import { getDictionary } from "@/i18n";
import { resolveLocale } from "@/i18n/locale-params";

type Params = Promise<{ locale: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  return { title: getDictionary(await resolveLocale(params)).membership.admin.plans.newTitle };
}

export default async function NewPlan({ params }: { params: Params }) {
  const locale = await resolveLocale(params);
  const m = getDictionary(locale).membership;
  return (
    <>
      <div className={styles.detailHead}>
        <Link href={`/${locale}/admin/plans`} className={styles.crumb}>{m.admin.plans.back}</Link>
        <h1>{m.admin.plans.newTitle}</h1>
      </div>
      <PlanEditor locale={locale} dict={m} plan={null} />
    </>
  );
}
