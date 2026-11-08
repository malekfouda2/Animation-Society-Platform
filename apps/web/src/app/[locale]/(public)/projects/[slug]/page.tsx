import { LOCALES, isLocale } from "@as/contracts";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import page from "@/components/sections/page.module.css";
import { Art } from "@/components/ui/Art";
import { StatusNote } from "@/components/ui/StatusNote";
import { FIELDS } from "@/content/fields";
import { INITIATIVES } from "@/content/initiatives";
import { getDictionary } from "@/i18n";
import { pageMetadata } from "@/i18n/metadata";
import styles from "../projects.module.css";

type Params = Promise<{ locale: string; slug: string }>;

export const dynamicParams = false;
export function generateStaticParams() {
  return LOCALES.flatMap((locale) => INITIATIVES.map((i) => ({ locale, slug: i.slug })));
}

async function resolve(params: Params) {
  const { locale, slug } = await params;
  const item = INITIATIVES.find((i) => i.slug === slug);
  if (!isLocale(locale) || !item) notFound();
  return { locale, item };
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, item } = await resolve(params);
  return pageMetadata(locale, `/projects/${item.slug}`, item.title[locale], item.summary[locale]);
}

export default async function ProjectDetail({ params }: { params: Params }) {
  const { locale, item } = await resolve(params);
  const dict = getDictionary(locale);
  const p = dict.projectsPage;
  const field = FIELDS.find((f) => f.slug === item.field);
  return (
    <article>
      <header className={styles.detailHero}>
        <div className={`container ${styles.detailGrid}`}>
          <div>
            <h1 className={styles.detailTitle}>{item.title[locale]}</h1>
            <p className={styles.detailSummary}>{item.summary[locale]}</p>
            <dl className={styles.meta}>
              <div>
                <dt>{p.field}</dt>
                <dd>{field ? <Link href={`/${locale}/fields#${field.slug}`}>{field.name[locale]}</Link> : item.field}</dd>
              </div>
              <div><dt>{p.progress}</dt><dd>{item.progress.label[locale]}</dd></div>
            </dl>
          </div>
          <figure className={styles.detailCover}>
            <Art name={item.cover} locale={locale} className={styles.coverImg} sizes="(min-width: 64rem) 45vw, 100vw" priority />
            <figcaption className={styles.coverNote}>{p.coverNote}</figcaption>
          </figure>
        </div>
      </header>
      <section className={page.section}>
        <div className={`container ${page.prose}`}>
          {item.body[locale].map((para) => (
            <p key={para.slice(0, 24)}>{para}</p>
          ))}
          {item.externalUrl ? (
            <a href={item.externalUrl} className="btn btn-primary" rel="noopener noreferrer" target="_blank">
              {p.participate}
            </a>
          ) : (
            <p className={page.callout}>{p.noRegistration}</p>
          )}
          <StatusNote status={item.status} dict={dict} className={page.note} />
          <Link href={`/${locale}/projects`} className={page.back}>
            {dict.actions.backTo} {p.title}
          </Link>
        </div>
      </section>
    </article>
  );
}
