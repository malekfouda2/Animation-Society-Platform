import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/sections/PageHero";
import page from "@/components/sections/page.module.css";
import { Art } from "@/components/ui/Art";
import { EmptyState } from "@/components/ui/EmptyState";
import { FIELDS } from "@/content/fields";
import { INITIATIVES } from "@/content/initiatives";
import { getDictionary } from "@/i18n";
import { resolveLocale } from "@/i18n/locale-params";
import { pageMetadata } from "@/i18n/metadata";
import styles from "./projects.module.css";

type Params = Promise<{ locale: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const d = getDictionary(locale);
  return pageMetadata(locale, "/projects", d.projectsPage.title, d.projectsPage.lead);
}

export default async function ProjectsPage({ params }: { params: Params }) {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);
  const p = dict.projectsPage;
  const fieldName = (slug: string) => FIELDS.find((f) => f.slug === slug)?.name[locale] ?? slug;
  return (
    <>
      <PageHero locale={locale} title={p.title} lead={p.lead} tone="mist" art="ribbonWarm" />
      <section className={page.section} aria-label={p.title}>
        <div className="container">
          {INITIATIVES.length === 0 ? (
            <EmptyState title={p.empty.title} body={p.empty.body} icon="flag" />
          ) : (
            <ul className={styles.list}>
              {INITIATIVES.map((item, i) => (
                <li key={item.slug} data-reveal="" style={{ ["--reveal-i" as string]: i }}>
                  <Link href={`/${locale}/projects/${item.slug}`} className={styles.item}>
                    <div className={styles.cover}>
                      <Art name={item.cover} locale={locale} className={styles.coverImg} sizes="(min-width: 64rem) 40vw, 100vw" />
                    </div>
                    <div className={styles.body}>
                      <h2 className={styles.title}>{item.title[locale]}</h2>
                      <p>{item.summary[locale]}</p>
                      <dl className={styles.meta}>
                        <div><dt>{p.field}</dt><dd>{fieldName(item.field)}</dd></div>
                        <div><dt>{p.progress}</dt><dd>{item.progress.label[locale]}</dd></div>
                      </dl>
                      <span className={styles.more}>{dict.actions.viewDetails}</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </>
  );
}
