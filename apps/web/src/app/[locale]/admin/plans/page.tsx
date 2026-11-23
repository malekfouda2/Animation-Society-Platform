import { adminPlanSchema } from "@as/contracts";
import type { Metadata } from "next";
import Link from "next/link";
import { z } from "zod";
import content from "@/components/admin/content.module.css";
import { PlanPrice } from "@/components/membership/PlanPrice";
import styles from "@/components/membership/membership.module.css";
import shell from "@/components/shell/shell.module.css";
import { getDictionary } from "@/i18n";
import { resolveLocale } from "@/i18n/locale-params";
import { apiFromServer } from "@/lib/server-api";

type Params = Promise<{ locale: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  return { title: getDictionary(await resolveLocale(params)).membership.admin.plans.title };
}

/** Pattern 1, List: membership plans in display order. A handful of rows, so no search or paging. */
export default async function PlansList({ params }: { params: Params }) {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);
  const m = dict.membership;
  const p = m.admin.plans;
  const res = await apiFromServer("/admin/plans");
  if (res.status === 403) {
    return (
      <>
        <h1>{dict.admin.forbidden.title}</h1>
        <p className={shell.lead}>{dict.admin.forbidden.body}</p>
      </>
    );
  }
  if (!res.ok) throw new Error(`plans unavailable (${res.status})`);
  const { items } = z.object({ items: z.array(adminPlanSchema) }).parse(await res.json());
  const newHref = `/${locale}/admin/plans/new`;
  return (
    <>
      <div className={content.head}>
        <div>
          <h1>{p.title}</h1>
          <p className={shell.lead}>{p.lead}</p>
        </div>
        <Link href={newHref} className="btn btn-primary">{p.create}</Link>
      </div>
      <div className={styles.tableFrame}>
        <div className={shell.tableWrap}>
          <table className={shell.table}>
            <thead>
              <tr>
                <th scope="col">{p.name}</th>
                <th scope="col">{p.price}</th>
                <th scope="col">{p.status}</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr className={styles.emptyRow}>
                  <td colSpan={3}>
                    <p><strong>{p.empty.title}</strong></p>
                    <p>{p.empty.body}</p>
                  </td>
                </tr>
              ) : items.map((plan) => (
                <tr key={plan.id} className={content.row}>
                  <td>
                    <span className={content.titleCell}>
                      <Link href={`/${locale}/admin/plans/${plan.id}`} className={styles.rowLink}>{plan.name[locale]}</Link>
                      <span className={content.slug} dir="ltr">{plan.key}</span>
                    </span>
                    {plan.demo ? <span className={styles.demo}>{m.demo}</span> : null}
                  </td>
                  <td><PlanPrice plan={plan} locale={locale} dict={m} /></td>
                  <td><span className={content.state} data-state={plan.enabled ? "published" : undefined}>{plan.enabled ? p.enabled : p.disabled}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
