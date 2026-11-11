import type { Metadata } from "next";
import Image from "next/image";
import { PageHero } from "@/components/sections/PageHero";
import page from "@/components/sections/page.module.css";
import { StatusNote } from "@/components/ui/StatusNote";
import { ARTWORK } from "@/config/artwork";
import { FIELDS } from "@/content/fields";
import { getDictionary } from "@/i18n";
import { resolveLocale } from "@/i18n/locale-params";
import { pageMetadata } from "@/i18n/metadata";
import styles from "./fields.module.css";

type Params = Promise<{ locale: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const d = getDictionary(locale);
  return pageMetadata(locale, "/fields", d.fieldsPage.title, d.fieldsPage.lead);
}

/*
 * Fields: one chapter per technique, each shot on its own set. 2D on a lit drawing disc with onion
 * skins, 3D in a modelling viewport over a perspective grid, stop-motion on a tabletop set that
 * moves on twos, hybrid split between paper and viewport. The roles read like a crew sheet.
 */
export default async function FieldsPage({ params }: { params: Params }) {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);
  return (
    <>
      <PageHero title={dict.fieldsPage.title} lead={dict.fieldsPage.lead} tone="cream" />
      <nav className={styles.jump} aria-label={dict.fieldsPage.jump}>
        <ul className={`container ${styles.jumpList}`}>
          {FIELDS.map((f, i) => {
            const art = ARTWORK[f.art];
            return (
              <li key={f.slug} data-enter="deal" style={{ ["--enter-i" as string]: i, ["--deal-r" as string]: `${(i - 1.5) * 5}deg` }}>
                <a href={`#${f.slug}`} className={styles.jumpLink} data-field={f.slug}>
                  <span className={styles.jumpThumb} aria-hidden="true">
                    <Image src={art.src} width={art.width} height={art.height} alt="" unoptimized />
                  </span>
                  <span className={styles.jumpName}>{f.name[locale]}</span>
                </a>
              </li>
            );
          })}
        </ul>
      </nav>

      {FIELDS.map((field) => {
        const art = ARTWORK[field.art];
        return (
          <section key={field.slug} id={field.slug} className={styles.field} data-field={field.slug} aria-labelledby={`${field.slug}-title`}>
            <div className="container">
              <div className={styles.stage} data-enter="power">
                <div className={styles.set} aria-hidden="true">
                  <span className={styles.grid} />
                  <span className={styles.light} />
                  <span className={styles.gizmo}><i /><i /><i /></span>
                  <span className={styles.pegs}><i /><i /><i /></span>
                </div>
                <div className={styles.subject}>
                  <Image src={art.src} width={art.width} height={art.height} alt="" unoptimized className={`${styles.art} ${styles.ghostPrev}`} aria-hidden="true" />
                  <Image src={art.src} width={art.width} height={art.height} alt="" unoptimized className={`${styles.art} ${styles.ghostNext}`} aria-hidden="true" />
                  <Image src={art.src} width={art.width} height={art.height} alt={art.alt?.[locale] ?? ""} unoptimized className={`${styles.art} ${styles.key}`} />
                  <span className={styles.shadow} aria-hidden="true" />
                </div>
              </div>
              <div className={styles.copy}>
                <div data-enter="rise">
                  <h2 id={`${field.slug}-title`} className={styles.name}>{field.name[locale]}</h2>
                  <p className={styles.summary}>{field.summary[locale]}</p>
                </div>
                <div data-enter="rise" style={{ ["--enter-i" as string]: 1 }}>
                  <p className={styles.description}>{field.description[locale]}</p>
                  <h3 className={styles.rolesTitle}>{dict.fieldsPage.roles}</h3>
                  <ul className={styles.crew}>
                    {field.roles[locale].map((role) => (
                      <li key={role}>{role}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </section>
        );
      })}
      <div className="container">
        <StatusNote status="draft" dict={dict} className={page.note} />
      </div>
    </>
  );
}
