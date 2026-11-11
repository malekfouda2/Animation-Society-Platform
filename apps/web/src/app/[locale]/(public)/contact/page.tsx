import type { Metadata } from "next";
import { ContactForm } from "@/components/contact/ContactForm";
import { PageHero } from "@/components/sections/PageHero";
import { SOCIETY } from "@/content/society";
import { getDictionary } from "@/i18n";
import { resolveLocale } from "@/i18n/locale-params";
import { pageMetadata } from "@/i18n/metadata";
import styles from "./contact.module.css";

type Params = Promise<{ locale: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const d = getDictionary(locale);
  return pageMetadata(locale, "/contact", d.contactPage.title, d.contactPage.lead);
}

/*
 * Contact at the animator's desk: the form is a sheet of paper on the peg bar of a drawing disc
 * (the rotating light table animators turn while drawing). The disc turns a little as the page
 * scrolls. Other ways to reach the Society sit beside it.
 */
export default async function ContactPage({ params }: { params: Params }) {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);
  const c = dict.contactPage;
  return (
    <>
      <PageHero title={c.title} lead={c.lead} tone="cream" />
      <section className={styles.desk} aria-label={c.title} data-progress="">
        <div className={`container ${styles.grid}`}>
          <div className={styles.station}>
            <span className={styles.disc} aria-hidden="true" />
            <div className={styles.sheet} data-enter="sheet">
              <span className={styles.pegbar} aria-hidden="true"><i /><i /><i /></span>
              <ContactForm locale={locale} labels={c.form} />
            </div>
            <p className={`status-note ${styles.devNote}`}>{c.devNote}</p>
          </div>
          <aside className={styles.info} aria-labelledby="contact-info" data-enter="rise" style={{ ["--enter-i" as string]: 1 }}>
            <h2 id="contact-info" className={styles.infoTitle}>{c.info}</h2>
            <dl className={styles.channels}>
              <div>
                <dt>{c.website}</dt>
                <dd><a href={SOCIETY.website} className={styles.big} dir="ltr">animation.org.sa</a></dd>
              </div>
              <div>
                <dt>{c.form.email}</dt>
                <dd>
                  {SOCIETY.email ? (
                    <a href={`mailto:${SOCIETY.email}`} className={styles.big} dir="ltr">{SOCIETY.email}</a>
                  ) : (
                    <span className={styles.pending}>{c.emailPending}</span>
                  )}
                </dd>
              </div>
            </dl>
          </aside>
        </div>
      </section>
    </>
  );
}
