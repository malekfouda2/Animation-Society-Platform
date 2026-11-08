import { LOCALES, isLocale } from "@as/contracts";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import page from "@/components/sections/page.module.css";
import { NEWS } from "@/content/news";
import { getDictionary } from "@/i18n";
import { pageMetadata } from "@/i18n/metadata";
import styles from "../news.module.css";

type Params = Promise<{ locale: string; slug: string }>;

export const dynamicParams = false;
export function generateStaticParams() {
  // No published items yet; Next requires at least one param set for a static route segment,
  // so a reserved placeholder keeps the template built. It always 404s.
  const slugs = NEWS.length > 0 ? NEWS.map((n) => n.slug) : ["__none__"];
  return LOCALES.flatMap((locale) => slugs.map((slug) => ({ locale, slug })));
}

async function resolve(params: Params) {
  const { locale, slug } = await params;
  const item = NEWS.find((n) => n.slug === slug);
  if (!isLocale(locale) || !item) notFound();
  return { locale, item };
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, item } = await resolve(params);
  return pageMetadata(locale, `/news/${item.slug}`, item.title[locale], item.summary[locale]);
}

/** News article or event detail. Events show the real date, location and external registration link. */
export default async function NewsDetail({ params }: { params: Params }) {
  const { locale, item } = await resolve(params);
  const dict = getDictionary(locale);
  const n = dict.newsPage;
  const dateFmt = new Intl.DateTimeFormat(locale === "ar" ? "ar-SA-u-ca-gregory-nu-latn" : "en-GB", { dateStyle: "full" });
  return (
    <article>
      <header className={styles.detailHero}>
        <div className="container">
          <span className={styles.label}>{item.kind === "event" ? n.labels.event : n.labels.news}</span>
          <h1>{item.title[locale]}</h1>
          <dl className={styles.facts}>
            <div><dt>{n.date}</dt><dd><time dateTime={item.date}>{dateFmt.format(new Date(item.date))}</time></dd></div>
            {item.location ? <div><dt>{n.location}</dt><dd>{item.location[locale]}</dd></div> : null}
          </dl>
        </div>
      </header>
      <section className={page.section}>
        <div className={`container ${page.prose}`}>
          {item.body[locale].map((para) => <p key={para.slice(0, 24)}>{para}</p>)}
          {item.kind === "event" && item.registrationUrl ? (
            <a href={item.registrationUrl} className="btn btn-primary" rel="noopener noreferrer" target="_blank">
              {dict.actions.register}
            </a>
          ) : null}
          <Link href={`/${locale}/news`} className={page.back}>{dict.actions.backTo} {n.title}</Link>
        </div>
      </section>
    </article>
  );
}
