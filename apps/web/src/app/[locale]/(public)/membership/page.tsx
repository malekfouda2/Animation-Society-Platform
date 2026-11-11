import type { Metadata } from "next";
import Link from "next/link";
import { Journey } from "@/components/sections/Journey";
import { PageHero } from "@/components/sections/PageHero";
import page from "@/components/sections/page.module.css";
import { StatusNote } from "@/components/ui/StatusNote";
import { BENEFITS, FAQ, FAQ_META, MEMBERSHIP_INTRO, MEMBERSHIP_TYPES, MEMBERSHIP_TYPES_META, PLANS } from "@/content/membership";
import { SOCIETY } from "@/content/society";
import { getDictionary } from "@/i18n";
import { resolveLocale } from "@/i18n/locale-params";
import { pageMetadata } from "@/i18n/metadata";
import styles from "./membership.module.css";

type Params = Promise<{ locale: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const d = getDictionary(locale);
  return pageMetadata(locale, "/membership", d.membershipPage.title, d.membershipPage.lead);
}

/*
 * Membership as the card office: each membership type is a card shown front and back (who it's for
 * on the front, what it includes on the back, under the magnetic stripe). Plans and benefits are
 * blank tickets until the Society approves them. Then the bouncing-ball journey and the questions.
 */
export default async function MembershipPage({ params }: { params: Params }) {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);
  const m = dict.membershipPage;
  return (
    <>
      <PageHero title={m.title} lead={m.lead} tone="green">
        <p className={styles.applyNote}>{m.applyNote}</p>
      </PageHero>

      <section className={styles.why} aria-labelledby="why-title">
        <div className="container">
          <h2 id="why-title" className={styles.kicker} data-enter="rise">{m.why}</h2>
          <p className={styles.statement} data-enter="rise" style={{ ["--enter-i" as string]: 1 }}>{MEMBERSHIP_INTRO.why[locale]}</p>
          <StatusNote status={MEMBERSHIP_INTRO.status} dict={dict} />
        </div>
      </section>

      <section className={styles.types} aria-labelledby="types-title">
        <div className="container">
          <h2 id="types-title" className={styles.sectionTitle} data-enter="rise">{m.types}</h2>
          <ul className={styles.wallet}>
            {MEMBERSHIP_TYPES.map((t, i) => (
              <li key={t.key} className={styles.pair} data-type={t.key} data-enter="deal" style={{ ["--enter-i" as string]: i % 2, ["--deal-r" as string]: `${i % 2 ? 6 : -6}deg` }}>
                <div className={styles.front}>
                  <span className={styles.society}>{SOCIETY.name[locale]}</span>
                  <span className={styles.chip} aria-hidden="true" />
                  <h3 className={styles.typeName}>{t.name[locale]}</h3>
                  {t.granted ? <span className={styles.granted}>{m.granted}</span> : null}
                </div>
                <dl className={styles.back}>
                  <div>
                    <dt>{m.who}</dt>
                    <dd>{t.who[locale]}</dd>
                  </div>
                  <div>
                    <dt>{m.rights}</dt>
                    <dd>{t.rights[locale]}</dd>
                  </div>
                </dl>
              </li>
            ))}
          </ul>
          <StatusNote status={MEMBERSHIP_TYPES_META.status} dict={dict} className={page.note} />
        </div>
      </section>

      <section className={styles.booth} aria-label={`${m.plans}, ${m.benefits}`}>
        <div className={`container ${styles.tickets}`}>
          {PLANS.items.length === 0 ? (
            <article className={styles.ticket} data-enter="slide" aria-labelledby="plans-title">
              <h2 id="plans-title" className={styles.ticketRole}>{m.plans}</h2>
              <p className={styles.ticketTitle}>{m.plansEmpty.title}</p>
              <p className={styles.ticketBody}>{m.plansEmpty.body}</p>
            </article>
          ) : null}
          {BENEFITS.items.length === 0 ? (
            <article className={`${styles.ticket} ${styles.ticketWarm}`} data-enter="slide" style={{ ["--enter-i" as string]: 1 }} aria-labelledby="benefits-title">
              <h2 id="benefits-title" className={styles.ticketRole}>{m.benefits}</h2>
              <p className={styles.ticketTitle}>{m.benefitsEmpty.title}</p>
              <p className={styles.ticketBody}>{m.benefitsEmpty.body}</p>
            </article>
          ) : null}
        </div>
      </section>

      <section className={styles.journey} aria-labelledby="journey-title">
        <div className="container">
          <h2 id="journey-title" className={styles.sectionTitle} data-enter="rise">{m.journey}</h2>
          <Journey locale={locale} headingLevel="h3" />
        </div>
      </section>

      <section className={styles.faqSection} aria-labelledby="faq-title">
        <div className={`container ${styles.faqGrid}`}>
          <div data-enter="rise">
            <h2 id="faq-title" className={styles.sectionTitle}>{m.faq}</h2>
            <p className={styles.contact}>
              <Link href={`/${locale}/contact`} className="btn btn-secondary">{dict.actions.contact}</Link>
            </p>
          </div>
          <div>
            <div className={styles.faq}>
              {FAQ.map((item, i) => (
                <details key={item.q.en} className={styles.faqItem} data-enter="rise" style={{ ["--enter-i" as string]: i }}>
                  <summary>
                    <span>{item.q[locale]}</span>
                    <span className={styles.drop} aria-hidden="true" />
                  </summary>
                  <p>{item.a[locale]}</p>
                </details>
              ))}
            </div>
            <StatusNote status={FAQ_META.status} dict={dict} className={page.note} />
          </div>
        </div>
      </section>
    </>
  );
}
