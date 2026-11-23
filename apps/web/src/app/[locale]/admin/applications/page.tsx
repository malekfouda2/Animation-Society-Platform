import { adminApplicationListSchema, adminPlanSchema, applicationListQuerySchema, type ReviewFilter } from "@as/contracts";
import type { Metadata } from "next";
import Link from "next/link";
import { z } from "zod";
import content from "@/components/admin/content.module.css";
import styles from "@/components/membership/membership.module.css";
import shell from "@/components/shell/shell.module.css";
import { getDictionary } from "@/i18n";
import { resolveLocale } from "@/i18n/locale-params";
import { apiFromServer } from "@/lib/server-api";

type Params = Promise<{ locale: string }>;
type Search = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  return { title: getDictionary(await resolveLocale(params)).membership.admin.list.title };
}

const one = (v: string | string[] | undefined) => (typeof v === "string" ? v : undefined);

/** Pattern 1, List: the review queue. Status tabs, search and plan filter are GET parameters. */
export default async function ApplicationsList({ params, searchParams }: { params: Params; searchParams: Search }) {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);
  const l = dict.membership.admin.list;
  const sp = await searchParams;
  const parsed = applicationListQuerySchema.safeParse({ status: one(sp["status"]), q: one(sp["q"]), plan: one(sp["plan"]), page: one(sp["page"]) });
  const query = parsed.success ? parsed.data : applicationListQuerySchema.parse({});
  const qs = (over: Partial<{ status: ReviewFilter; q: string; plan: string; page: number }>) => {
    const v = { ...query, ...over };
    const u = new URLSearchParams();
    u.set("status", v.status);
    if (v.q) u.set("q", v.q);
    if (v.plan) u.set("plan", v.plan);
    if (v.page > 1) u.set("page", String(v.page));
    return `/${locale}/admin/applications?${u.toString()}`;
  };

  const api = new URLSearchParams({ status: query.status, q: query.q, plan: query.plan, page: String(query.page) });
  const [res, plansRes] = await Promise.all([apiFromServer(`/admin/applications?${api.toString()}`), apiFromServer("/admin/plans")]);
  if (res.status === 403) {
    return (
      <>
        <h1>{dict.admin.forbidden.title}</h1>
        <p className={shell.lead}>{dict.admin.forbidden.body}</p>
      </>
    );
  }
  if (!res.ok) throw new Error(`applications unavailable (${res.status})`);
  const list = adminApplicationListSchema.parse(await res.json());
  const plans = plansRes.ok ? z.object({ items: z.array(adminPlanSchema) }).parse(await plansRes.json()).items : [];
  const fmt = new Intl.DateTimeFormat(locale === "ar" ? "ar-SA-u-nu-latn-ca-gregory" : "en-GB", { dateStyle: "medium", timeZone: "Asia/Riyadh" });
  const total = Object.values(list.counts).reduce((a, b) => a + b, 0);
  const countOf = (f: ReviewFilter) => (f === "all" ? total : list.counts[f]);
  const filtered = query.q !== "" || query.plan !== "";

  return (
    <>
      <div className={content.head}>
        <div>
          <h1>{l.title}</h1>
          <p className={shell.lead}>{l.lead}</p>
        </div>
      </div>

      <nav aria-label={l.filters}>
        <ul className={styles.tabs}>
          {(["submitted", "needs_changes", "approved", "rejected", "draft", "all"] as const).map((f) => (
            <li key={f}>
              <Link href={qs({ status: f, page: 1 })} className={styles.tab} aria-current={query.status === f ? "page" : undefined}>
                {l.tabs[f]} <span className={styles.count}>{countOf(f)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <form className={styles.toolbar} method="get" role="search">
        <input type="hidden" name="status" value={query.status} />
        <div className={`${styles.toolbarField} ${styles.search}`}>
          <label htmlFor="q" className={content.label}>{l.search}</label>
          <input id="q" name="q" type="search" className={content.input} defaultValue={query.q} maxLength={80} placeholder={l.searchHint} />
        </div>
        <div className={styles.toolbarField}>
          <label htmlFor="plan" className={content.label}>{l.plan}</label>
          <select id="plan" name="plan" className={content.input} defaultValue={query.plan}>
            <option value="">{l.anyPlan}</option>
            {plans.map((p) => <option key={p.id} value={p.id}>{p.name[locale]}</option>)}
          </select>
        </div>
        <button type="submit" className="btn btn-secondary">{l.searchButton}</button>
        {filtered ? <Link href={qs({ q: "", plan: "", page: 1 })}>{l.clear}</Link> : null}
      </form>

      <div className={styles.tableFrame}>
        <div className={shell.tableWrap}>
          <table className={shell.table}>
            <thead>
              <tr>
                <th scope="col">{l.name}</th>
                <th scope="col">{l.planCol}</th>
                <th scope="col">{l.status}</th>
                <th scope="col">{query.status === "submitted" ? l.submitted : l.updated}</th>
              </tr>
            </thead>
            <tbody>
              {list.items.length === 0 ? (
                <tr className={styles.emptyRow}>
                  <td colSpan={4}>
                    <p><strong>{filtered ? l.noMatch.title : l.empty.title}</strong></p>
                    <p>{filtered ? l.noMatch.body : l.empty.body}</p>
                  </td>
                </tr>
              ) : list.items.map((r) => {
                const when = query.status === "submitted" ? r.submittedAt : r.updatedAt;
                return (
                  <tr key={r.id} className={content.row}>
                    <td>
                      <span className={content.titleCell}>
                        <Link href={`/${locale}/admin/applications/${r.id}`} className={styles.rowLink} dir="auto">{r.fullName || l.unnamed}</Link>
                        <span className={content.slug} dir="ltr">{r.email}</span>
                        {r.city ? <span className={styles.muted} dir="auto">{r.city}</span> : null}
                      </span>
                    </td>
                    <td>
                      {r.planName ? r.planName[locale] : <span className={styles.muted}>—</span>}
                      {r.planDemo ? <span className={styles.demo}>{dict.membership.demo}</span> : null}
                    </td>
                    <td><span className={content.state} data-state={r.status === "approved" ? "published" : r.status === "submitted" ? "changed" : undefined}>{dict.membership.states[r.status]}</span></td>
                    <td>{when ? <time dateTime={when}>{fmt.format(new Date(when))}</time> : null}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className={styles.pager}>
          <span className={styles.meta}>
            <span>{l.total.replace("{n}", String(list.total))}</span>
            <span>{l.page.replace("{page}", String(list.page)).replace("{pages}", String(list.pages))}</span>
          </span>
          <span className={styles.pagerLinks}>
            <Link href={qs({ page: Math.max(1, list.page - 1) })} className="btn btn-secondary" aria-disabled={list.page <= 1 ? true : undefined} tabIndex={list.page <= 1 ? -1 : undefined}>{l.previous}</Link>
            <Link href={qs({ page: Math.min(list.pages, list.page + 1) })} className="btn btn-secondary" aria-disabled={list.page >= list.pages ? true : undefined} tabIndex={list.page >= list.pages ? -1 : undefined}>{l.next}</Link>
          </span>
        </div>
      </div>
    </>
  );
}
