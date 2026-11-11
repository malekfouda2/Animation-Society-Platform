import { isLocale, paragraphs } from "@as/contracts";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import page from "@/components/sections/page.module.css";
import { getDictionary } from "@/i18n";
import { MediaImage } from "@/components/ui/MediaImage";
import { StatusNote } from "@/components/ui/StatusNote";
import { pageMetadata } from "@/i18n/metadata";
import { approvalNote, publishedEntry } from "@/lib/public-content";
import styles from "../news.module.css";

type Params = Promise<{ locale: string; slug: string }>;

async function resolve(params: Params) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const entry = await publishedEntry("post", slug);
  if (!entry) notFound();
  return { locale, slug: entry.slug, item: entry.data };
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, slug, item } = await resolve(params);
  return pageMetadata(locale, `/news/${slug}`, item.title[locale], item.summary[locale]);
}

/** News article or event detail. Events show the real date, location and external registration link. */
export default async function NewsDetail({ params }: { params: Params }) {
  const { locale, item } = await resolve(params);
  const dict = getDictionary(locale);
  const n = dict.newsPage;
  const dateFmt = new Intl.DateTimeFormat(locale === "ar" ? "ar-SA-u-ca-gregory-nu-latn" : "en-GB", { dateStyle: "full", timeZone: "UTC" });
  const note = approvalNote(item.approval);
  return (
    <article>
      <header className={styles.detailHero}>
        <div className="container">
          <span className={styles.detailKind}>{item.postType === "event" ? n.labels.event : n.labels.news}</span>
          <h1 className={styles.detailTitle}>{item.title[locale]}</h1>
          <dl className={styles.facts}>
            <div><dt>{n.date}</dt><dd><time dateTime={item.date}>{dateFmt.format(new Date(`${item.date}T12:00:00Z`))}</time></dd></div>
            {item.postType === "event" && item.location[locale] ? <div><dt>{n.location}</dt><dd>{item.location[locale]}</dd></div> : null}
          </dl>
        </div>
      </header>
      <section className={page.section}>
        <div className={`container ${page.prose}`}>
          {item.image.id ? (
            <figure className={styles.figure}>
              <MediaImage media={item.image} locale={locale} className={styles.figureImg} priority />
            </figure>
          ) : null}
          {paragraphs(item.body[locale]).map((para, i) => (
            // eslint-disable-next-line @eslint-react/no-array-index-key -- paragraphs never reorder; position is the identity
            <p key={i}>{para}</p>
          ))}
          {item.postType === "event" && item.registrationUrl ? (
            <a href={item.registrationUrl} className="btn btn-primary" rel="noopener noreferrer" target="_blank">
              {dict.actions.register}
            </a>
          ) : null}
          {note ? <StatusNote status={note} dict={dict} className={page.note} /> : null}
          <Link href={`/${locale}/news`} className={page.back}>{dict.actions.backTo} {n.title}</Link>
        </div>
      </section>
    </article>
  );
}
