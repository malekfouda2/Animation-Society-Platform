import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/sections/PageHero";
import { getDictionary } from "@/i18n";
import { resolveLocale } from "@/i18n/locale-params";
import { pageMetadata } from "@/i18n/metadata";
import { publishedList } from "@/lib/public-content";
import styles from "./news.module.css";

type Params = Promise<{ locale: string }>;
type Search = Promise<{ type?: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const d = getDictionary(locale);
  return pageMetadata(locale, "/news", d.newsPage.title, d.newsPage.lead);
}

/** Blank exposure-sheet rows behind the empty state (decorative). */
const SHEET_ROWS = Array.from({ length: 14 }, (_, i) => i);

/*
 * News as an exposure sheet (the animator's timing chart): filters are the sheet's column tabs, and
 * each item is a row with its date in the frame column. With nothing published, the sheet is blank
 * and a ball ticks down it frame by frame behind the note.
 */
export default async function NewsPage({ params, searchParams }: { params: Params; searchParams: Search }) {
  const locale = await resolveLocale(params);
  const { type } = await searchParams;
  const dict = getDictionary(locale);
  const n = dict.newsPage;
  const filter = type === "news" || type === "event" ? type : "all";
  const list = await publishedList("post");
  const all = list.ok ? list.items : [];
  // The API already orders posts newest first.
  const items = all.filter((i) => filter === "all" || i.data.postType === filter);
  const tabs = [
    ["all", n.filters.all],
    ["news", n.filters.news],
    ["event", n.filters.events],
  ] as const;
  const dateFmt = new Intl.DateTimeFormat(locale === "ar" ? "ar-SA-u-ca-gregory-nu-latn" : "en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
  const empty = !list.ok ? dict.unavailable : all.length === 0 ? n.empty : items.length === 0 ? n.filteredEmpty : null;
  const emptyAction = !list.ok
    ? { href: `/${locale}/news${filter === "all" ? "" : `?type=${filter}`}`, label: n.showAll }
    : all.length === 0
    ? { href: `/${locale}/projects`, label: dict.actions.allProjects }
    : { href: `/${locale}/news`, label: n.showAll };

  return (
    <>
      <PageHero title={n.title} lead={n.lead} tone="cream" />
      <section className={styles.section} aria-label={n.title}>
        <div className="container">
          <div className={styles.sheet} data-enter="sheet">
            <nav aria-label={n.title} className={styles.tabs}>
              {tabs.map(([key, label]) => (
                <Link
                  key={key}
                  href={key === "all" ? `/${locale}/news` : `/${locale}/news?type=${key}`}
                  aria-current={filter === key ? "page" : undefined}
                  className={styles.tab}
                  scroll={false}
                >
                  {label}
                </Link>
              ))}
            </nav>
            {empty ? (
              <div className={styles.blank}>
                <div className={styles.rows} aria-hidden="true">
                  {SHEET_ROWS.map((r) => (
                    <span key={r} className={styles.row}><i /><i /><i /></span>
                  ))}
                  <span className={styles.tick} />
                </div>
                <div className={styles.note}>
                  <h2 className={styles.noteTitle}>{empty.title}</h2>
                  <p className={styles.noteBody}>{empty.body}</p>
                  <Link href={emptyAction.href} className="btn btn-secondary">{emptyAction.label}</Link>
                </div>
              </div>
            ) : (
              <ul className={styles.list}>
                {items.map(({ slug, data: item }) => (
                  <li key={slug} className={styles.item}>
                    <time dateTime={item.date} className={styles.frame}>{dateFmt.format(new Date(`${item.date}T12:00:00Z`))}</time>
                    <span className={styles.label} data-kind={item.postType}>{item.postType === "event" ? n.labels.event : n.labels.news}</span>
                    <div className={styles.action}>
                      <h2 className={styles.title}>
                        <Link href={`/${locale}/news/${slug}`}>{item.title[locale]}</Link>
                      </h2>
                      <p>{item.summary[locale]}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
