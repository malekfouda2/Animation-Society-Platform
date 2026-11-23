import { adminPlanSchema } from "@as/contracts";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import content from "@/components/admin/content.module.css";
import { PlanEditor } from "@/components/membership/PlanEditor";
import styles from "@/components/membership/membership.module.css";
import shell from "@/components/shell/shell.module.css";
import { getDictionary } from "@/i18n";
import { resolveLocale } from "@/i18n/locale-params";
import { apiFromServer } from "@/lib/server-api";

type Params = Promise<{ locale: string; id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  return { title: getDictionary(await resolveLocale(params)).membership.admin.plans.editTitle };
}

export default async function EditPlan({ params, searchParams }: { params: Params; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const locale = await resolveLocale(params);
  const { id } = await params;
  const dict = getDictionary(locale);
  const m = dict.membership;
  const res = await apiFromServer(`/admin/plans/${encodeURIComponent(id)}`);
  if (res.status === 404) notFound();
  if (res.status === 403) {
    return (
      <>
        <h1>{dict.admin.forbidden.title}</h1>
        <p className={shell.lead}>{dict.admin.forbidden.body}</p>
      </>
    );
  }
  if (!res.ok) throw new Error(`plan unavailable (${res.status})`);
  const plan = adminPlanSchema.parse(await res.json());
  const created = (await searchParams)["created"] === "1";
  return (
    <>
      <div className={styles.detailHead}>
        <Link href={`/${locale}/admin/plans`} className={styles.crumb}>{m.admin.plans.back}</Link>
        <h1>{plan.name[locale]}</h1>
        {created ? <p className={content.message} data-tone="ok" role="status">{m.admin.plans.created}</p> : null}
      </div>
      <PlanEditor locale={locale} dict={m} plan={plan} />
    </>
  );
}
