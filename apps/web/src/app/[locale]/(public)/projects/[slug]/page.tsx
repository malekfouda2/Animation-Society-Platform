import { isLocale, paragraphs } from "@as/contracts";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import page from "@/components/sections/page.module.css";
import { Art } from "@/components/ui/Art";
import { MediaImage } from "@/components/ui/MediaImage";
import { StatusNote } from "@/components/ui/StatusNote";
import { FIELDS } from "@/content/fields";
import { getDictionary } from "@/i18n";
import { pageMetadata } from "@/i18n/metadata";
import { approvalNote, coverKey, publishedEntry } from "@/lib/public-content";
import styles from "../projects.module.css";

type Params = Promise<{ locale: string; slug: string }>;

async function resolve(params: Params) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const entry = await publishedEntry("project", slug);
  if (!entry) notFound();
  return { locale, slug: entry.slug, item: entry.data };
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, slug, item } = await resolve(params);
  return pageMetadata(locale, `/projects/${slug}`, item.title[locale], item.summary[locale]);
}

/** Initiative detail: the slate claps shut as the page opens, then the notes read like a script page. */
export default async function ProjectDetail({ params }: { params: Params }) {
  const { locale, item } = await resolve(params);
  const dict = getDictionary(locale);
  const p = dict.projectsPage;
  const field = FIELDS.find((f) => f.slug === item.field);
  const [first, ...rest] = paragraphs(item.body[locale]);
  const note = approvalNote(item.approval);
  return (
    <article>
      <header className={styles.detailHero}>
        <div className={`container ${styles.detailGrid}`}>
          <div className={`${styles.slate} ${styles.slateBig}`}>
            <span className={`${styles.clapper} ${styles.clap}`} aria-hidden="true"><span /></span>
            <span className={styles.board}>
              <h1 className={styles.detailTitle}>{item.title[locale]}</h1>
              <span className={styles.cells}>
                <span className={styles.cell}>
                  <span className={styles.cellLabel}>{p.field}</span>
                  <span className={styles.cellValue}>
                    {field ? <Link href={`/${locale}/fields#${field.slug}`}>{field.name[locale]}</Link> : item.field}
                  </span>
                </span>
                <span className={styles.cell}>
                  <span className={styles.cellLabel}>{p.progress}</span>
                  <span className={styles.cellValue}>
                    <span className={styles.lamp} data-kind={item.progress} aria-hidden="true" />
                    {item.progressLabel[locale]}
                  </span>
                </span>
              </span>
            </span>
          </div>
          <figure className={styles.detailCover}>
            <span className={styles.viewfinder}>
              {item.image.id ? (
                <MediaImage media={item.image} locale={locale} className={styles.coverImg} priority />
              ) : (
                <Art name={coverKey(item.cover)} locale={locale} className={styles.coverImg} sizes="(min-width: 64rem) 45vw, 100vw" priority />
              )}
              <span className={styles.marks} aria-hidden="true" />
            </span>
            {item.image.id ? null : <figcaption className={styles.coverNote}>{p.coverNote}</figcaption>}
          </figure>
        </div>
      </header>
      <section className={page.section}>
        <div className={`container ${styles.script}`}>
          <p className={styles.scriptLead}>{item.summary[locale]}</p>
          <div className={styles.scriptBody}>
            {first ? <p className={styles.scriptFirst}>{first}</p> : null}
            {rest.map((para, i) => (
              // eslint-disable-next-line @eslint-react/no-array-index-key -- paragraphs never reorder; position is the identity
              <p key={i}>{para}</p>
            ))}
            {item.externalUrl ? (
              <a href={item.externalUrl} className="btn btn-primary" rel="noopener noreferrer" target="_blank">
                {p.participate}
              </a>
            ) : (
              <p className={styles.tape}>{p.noRegistration}</p>
            )}
            {note ? <StatusNote status={note} dict={dict} className={page.note} /> : null}
            <Link href={`/${locale}/projects`} className={page.back}>
              {dict.actions.backTo} {p.title}
            </Link>
          </div>
        </div>
      </section>
    </article>
  );
}
