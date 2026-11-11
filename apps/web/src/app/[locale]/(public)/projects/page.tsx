import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/sections/PageHero";
import page from "@/components/sections/page.module.css";
import { Art } from "@/components/ui/Art";
import { EmptyState } from "@/components/ui/EmptyState";
import { MediaImage } from "@/components/ui/MediaImage";
import { FIELDS } from "@/content/fields";
import { getDictionary } from "@/i18n";
import { resolveLocale } from "@/i18n/locale-params";
import { pageMetadata } from "@/i18n/metadata";
import { coverKey, publishedList } from "@/lib/public-content";
import styles from "./projects.module.css";

type Params = Promise<{ locale: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const d = getDictionary(locale);
  return pageMetadata(locale, "/projects", d.projectsPage.title, d.projectsPage.lead);
}

/*
 * Projects as production slates: each initiative is a clapperboard (title, field, status chalked on
 * the board) beside its cover in a camera viewfinder. The clapper opens on hover/focus.
 */
export default async function ProjectsPage({ params }: { params: Params }) {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);
  const p = dict.projectsPage;
  const fieldName = (slug: string) => FIELDS.find((f) => f.slug === slug)?.name[locale] ?? slug;
  const list = await publishedList("project");
  return (
    <>
      <PageHero title={p.title} lead={p.lead} tone="mist" />
      <section className={page.section} aria-label={p.title}>
        <div className="container">
          {!list.ok ? (
            <EmptyState title={dict.unavailable.title} body={dict.unavailable.body} icon="flag" />
          ) : list.items.length === 0 ? (
            <EmptyState title={p.empty.title} body={p.empty.body} icon="flag" />
          ) : (
            <ul className={styles.list}>
              {list.items.map(({ slug, data: item }) => (
                <li key={slug}>
                  <Link href={`/${locale}/projects/${slug}`} className={styles.item}>
                    <span className={styles.viewfinder} data-enter="power">
                      {item.image.id ? (
                        <MediaImage media={item.image} locale={locale} className={styles.coverImg} />
                      ) : (
                        <Art name={coverKey(item.cover)} locale={locale} className={styles.coverImg} sizes="(min-width: 64rem) 50vw, 100vw" />
                      )}
                      <span className={styles.marks} aria-hidden="true" />
                    </span>
                    <span className={styles.slate} data-enter="drop" style={{ ["--enter-i" as string]: 1 }}>
                      <span className={styles.clapper} aria-hidden="true"><span /></span>
                      <span className={styles.board}>
                        <span className={styles.title}>{item.title[locale]}</span>
                        <span className={styles.summary}>{item.summary[locale]}</span>
                        <span className={styles.cells}>
                          <span className={styles.cell}>
                            <span className={styles.cellLabel}>{p.field}</span>
                            <span className={styles.cellValue}>{fieldName(item.field)}</span>
                          </span>
                          <span className={styles.cell}>
                            <span className={styles.cellLabel}>{p.progress}</span>
                            <span className={styles.cellValue}>
                              <span className={styles.lamp} data-kind={item.progress} aria-hidden="true" />
                              {item.progressLabel[locale]}
                            </span>
                          </span>
                        </span>
                        <span className={styles.more}>{dict.actions.viewDetails}</span>
                      </span>
                    </span>
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
