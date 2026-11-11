import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/sections/PageHero";
import { MediaImage } from "@/components/ui/MediaImage";
import { getDictionary } from "@/i18n";
import { resolveLocale } from "@/i18n/locale-params";
import { pageMetadata } from "@/i18n/metadata";
import { publishedList } from "@/lib/public-content";
import styles from "./partners.module.css";

type Params = Promise<{ locale: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const d = getDictionary(locale);
  return pageMetadata(locale, "/partners", d.partnersPage.title, d.partnersPage.lead);
}

/*
 * Partners as animation cels: each partner's logo is painted on a clear acetate sheet with peg
 * holes, layered like a scene. Until the Society approves partners, the cels are blank and fanned
 * beside an invitation to get in touch.
 */
export default async function PartnersPage({ params }: { params: Params }) {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);
  const p = dict.partnersPage;
  const list = await publishedList("partner");
  const partners = list.ok ? list.items : [];
  const empty = !list.ok ? dict.unavailable : partners.length === 0 ? p.empty : null;
  return (
    <>
      <PageHero title={p.title} lead={p.lead} tone="mist" />
      <section className={styles.section} aria-label={p.title}>
        <div className="container">
          {empty ? (
            <div className={styles.empty}>
              <div className={styles.stack} aria-hidden="true" data-enter="deal">
                {[0, 1, 2].map((k) => (
                  <span key={k} className={styles.cel} style={{ ["--k" as string]: k }}>
                    <span className={styles.pegs}><i /><i /><i /></span>
                  </span>
                ))}
              </div>
              <div className={styles.copy} data-enter="rise" style={{ ["--enter-i" as string]: 1 }}>
                <h2 className={styles.title}>{empty.title}</h2>
                <p className={styles.body}>{empty.body}</p>
                <Link href={`/${locale}/contact`} className="btn btn-primary">{dict.actions.contact}</Link>
              </div>
            </div>
          ) : (
            <ul className={styles.grid}>
              {partners.map(({ slug, data: partner }, i) => (
                <li key={slug} data-enter="deal" style={{ ["--enter-i" as string]: i % 4 }}>
                  {/* The logo is painted on the cel; without one, the name is lettered on it. */}
                  <a href={partner.url} rel="noopener noreferrer" target="_blank" className={`${styles.cel} ${styles.logoCel}`}>
                    <span className={styles.pegs} aria-hidden="true"><i /><i /><i /></span>
                    {partner.logo.id ? (
                      <MediaImage media={partner.logo} locale={locale} className={styles.logo} fit="contain" />
                    ) : (
                      <span className={styles.nameplate}>{partner.title[locale]}</span>
                    )}
                    <span className={styles.visit}>{p.visit}</span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </>
  );
}
