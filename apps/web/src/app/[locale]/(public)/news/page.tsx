import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/sections/PageHero";
import page from "@/components/sections/page.module.css";
import { EmptyState } from "@/components/ui/EmptyState";
import { NEWS } from "@/content/news";
import { getDictionary } from "@/i18n";
import { resolveLocale } from "@/i18n/locale-params";
import { pageMetadata } from "@/i18n/metadata";
import styles from "./news.module.css";

type Params = Promise<{ locale: string }>;
type Search = Promise<{ type?: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const d = getDictionary(locale);
  return pageMetadata(locale, "/news", d.newsPage.title, d.newsPage.lead);
}

export default async function NewsPage({ params, searchParams }: { params: Params; searchParams: Search }) {
  const locale = await resolveLocale(params);
  const { type } = await searchParams;
  const dict = getDictionary(locale);
  const n = dict.newsPage;
  const filter = type === "news" || type === "event" ? type : "all";
  const items = NEWS.filter((i) => filter === "all" || i.kind === filter).toSorted((a, b) => b.date.localeCompare(a.date));
  const tabs = [
    ["all", n.filters.all],
    ["news", n.filters.news],
    ["event", n.filters.events],
  ] as const;
  const dateFmt = new Intl.DateTimeFormat(locale === "ar" ? "ar-SA-u-ca-gregory-nu-latn" : "en-GB", { dateStyle: "long" });

  return (
    <>
      <PageHero locale={locale} title={n.title} lead={n.lead} tone="cream" art="dotsWarm" />
      <section className={page.section} aria-label={n.title}>
        <div className="container">
          <nav aria-label={n.title} className={styles.tabs}>
            {tabs.map(([key, label]) => (
              <Link
                key={key}
                href={key === "all" ? `/${locale}/news` : `/${locale}/news?type=${key}`}
                aria-current={filter === key ? "page" : undefined}
                className={styles.tab}
              >
                {label}
              </Link>
            ))}
          </nav>
          {NEWS.length === 0 ? (
            <EmptyState title={n.empty.title} body={n.empty.body} icon="megaphone" action={{ href: `/${locale}/projects`, label: dict.actions.allProjects }} />
          ) : items.length === 0 ? (
            <EmptyState title={n.filteredEmpty.title} body={n.filteredEmpty.body} icon="calendar" action={{ href: `/${locale}/news`, label: n.showAll }} />
          ) : (
            <ul className={styles.list}>
              {items.map((item) => (
                <li key={item.slug} className={styles.item}>
                  <span className={styles.label}>{item.kind === "event" ? n.labels.event : n.labels.news}</span>
                  <time dateTime={item.date} className={styles.date}>{dateFmt.format(new Date(item.date))}</time>
                  <h2 className={styles.title}>
                    <Link href={`/${locale}/news/${item.slug}`}>{item.title[locale]}</Link>
                  </h2>
                  <p>{item.summary[locale]}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </>
  );
}
