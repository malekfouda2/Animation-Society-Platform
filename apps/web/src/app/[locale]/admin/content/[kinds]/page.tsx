import { CONTENT_PATHS, SECTION_KEYS, type AdminEntry } from "@as/contracts";
import type { Metadata } from "next";
import Link from "next/link";
import styles from "@/components/admin/content.module.css";
import shell from "@/components/shell/shell.module.css";
import { getDictionary } from "@/i18n";
import { resolveLocale } from "@/i18n/locale-params";
import { kindParam } from "@/lib/admin-content";
import { apiFromServer } from "@/lib/server-api";

type Params = Promise<{ locale: string; kinds: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { kinds } = await params;
  return { title: getDictionary(await resolveLocale(params)).admin.content.kinds[kindParam(kinds)].title };
}

/** Pattern 1, List: every entry of one kind, newest saved first, each row opening its editor. */
export default async function ContentList({ params }: { params: Params }) {
  const locale = await resolveLocale(params);
  const kind = kindParam((await params).kinds);
  const dict = getDictionary(locale);
  const c = dict.admin.content;
  const k = c.kinds[kind];
  const res = await apiFromServer(`/admin/content/${CONTENT_PATHS[kind]}`);
  if (res.status === 403) {
    return (
      <>
        <h1>{dict.admin.forbidden.title}</h1>
        <p className={shell.lead}>{dict.admin.forbidden.body}</p>
      </>
    );
  }
  if (!res.ok) throw new Error(`content list unavailable (${res.status})`);
  const { items } = (await res.json()) as { items: AdminEntry[] };
  const fmt = new Intl.DateTimeFormat(locale === "ar" ? "ar-SA-u-nu-latn-ca-gregory" : "en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Riyadh" });
  const newHref = `/${locale}/admin/content/${CONTENT_PATHS[kind]}/new`;
  const other = locale === "ar" ? "en" : "ar";

  if (kind === "section") {
    // Fixed sections: every one is listed, written or not, in page order.
    const bySlug = new Map(items.map((i) => [i.slug, i]));
    return (
      <>
        <div className={styles.head}>
          <div>
            <h1>{k.title}</h1>
            <p className={shell.lead}>{k.lead}</p>
          </div>
        </div>
        <div className={shell.tableWrap}>
          <table className={shell.table}>
            <thead>
              <tr>
                <th scope="col">{c.sectionTable.section}</th>
                <th scope="col">{c.sectionTable.where}</th>
                <th scope="col">{c.table.state}</th>
                <th scope="col">{c.table.updated}</th>
              </tr>
            </thead>
            <tbody>
              {SECTION_KEYS.map((key) => {
                const item = bySlug.get(key);
                const href = item ? `/${locale}/admin/content/sections/${item.id}` : `/${locale}/admin/content/sections/new?key=${key}`;
                return (
                  <tr key={key} className={styles.row}>
                    <td><span className={styles.titleCell}><Link href={href}>{c.pageSections[key].name}</Link></span></td>
                    <td>{c.pageSections[key].where}</td>
                    <td>{item ? <span className={styles.state} data-state={item.state}>{c.states[item.state]}</span> : <span className={styles.state}>{c.sectionTable.notCreated}</span>}</td>
                    <td>{item ? <time dateTime={item.updatedAt}>{fmt.format(new Date(item.updatedAt))}</time> : <Link href={href}>{c.sectionTable.create}</Link>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </>
    );
  }

  return (
    <>
      <div className={styles.head}>
        <div>
          <h1>{k.title}</h1>
          <p className={shell.lead}>{k.lead}</p>
        </div>
        <Link href={newHref} className="btn btn-primary">{k.create}</Link>
      </div>
      {items.length === 0 ? (
        <section className={styles.empty} aria-labelledby="content-empty">
          <h2 id="content-empty">{k.empty.title}</h2>
          <p>{k.empty.body}</p>
          <Link href={newHref} className="btn btn-primary">{k.create}</Link>
        </section>
      ) : (
        <div className={shell.tableWrap}>
          <table className={shell.table}>
            <thead>
              <tr>
                <th scope="col">{c.table.title}</th>
                <th scope="col">{c.table.state}</th>
                <th scope="col">{c.table.updated}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const t = "title" in item.draft && !("section" in item.draft) ? item.draft.title : { ar: "", en: "" };
                const main = t[locale] || t[other] || c.table.untitled;
                return (
                  <tr key={item.id} className={styles.row}>
                    <td>
                      <span className={styles.titleCell}>
                        <Link href={`/${locale}/admin/content/${CONTENT_PATHS[kind]}/${item.id}`} lang={t[locale] ? locale : other}>{main}</Link>
                        {t[locale] && t[other] ? <span className={styles.titleOther} lang={other} dir={other === "ar" ? "rtl" : "ltr"}>{t[other]}</span> : null}
                        <span className={styles.slug} dir="ltr">/{item.slug}</span>
                      </span>
                    </td>
                    <td><span className={styles.state} data-state={item.state}>{c.states[item.state]}</span></td>
                    <td><time dateTime={item.updatedAt}>{fmt.format(new Date(item.updatedAt))}</time></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
