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

export default async function FieldsPage({ params }: { params: Params }) {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);
  return (
    <>
      <PageHero locale={locale} title={dict.fieldsPage.title} lead={dict.fieldsPage.lead} tone="cream" art="ribbonWarm" />
      <nav className={page.toc} aria-label={dict.fieldsPage.jump}>
        <ul className={`container ${page.tocList}`}>
          {FIELDS.map((f) => (
            <li key={f.slug}><a href={`#${f.slug}`}>{f.name[locale]}</a></li>
          ))}
        </ul>
      </nav>
      {FIELDS.map((field, i) => {
        const art = ARTWORK[field.art];
        return (
          <section key={field.slug} id={field.slug} className={styles.field} aria-labelledby={`${field.slug}-title`}>
            <div className={`container ${styles.grid} ${i % 2 ? styles.flip : ""}`}>
              <div className={styles.frame} data-reveal="">
                <Image src={art.src} width={art.width} height={art.height} alt={art.alt?.[locale] ?? ""} unoptimized className={styles.art} />
              </div>
              <div data-reveal="" style={{ ["--reveal-i" as string]: 1 }}>
                <h2 id={`${field.slug}-title`}>{field.name[locale]}</h2>
                <p className={styles.summary}>{field.summary[locale]}</p>
                <p>{field.description[locale]}</p>
                <h3 className={styles.rolesTitle}>{dict.fieldsPage.roles}</h3>
                <ul className={styles.roles}>
                  {field.roles[locale].map((role) => (
                    <li key={role}>{role}</li>
                  ))}
                </ul>
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
