import type { Metadata } from "next";
import Link from "next/link";
import { Journey } from "@/components/sections/Journey";
import { PageHero } from "@/components/sections/PageHero";
import page from "@/components/sections/page.module.css";
import { StatusNote } from "@/components/ui/StatusNote";
import { PlanPrice } from "@/components/membership/PlanPrice";
import { FAQ, FAQ_META, MEMBERSHIP_INTRO, MEMBERSHIP_TYPES, MEMBERSHIP_TYPES_META, type Point } from "@/content/membership";
import type { Locale } from "@as/contracts";
import { publicPlans } from "@/lib/public-content";
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
  const plans = await publicPlans();
  const applyHref = `/${locale}/member/application`;
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
              <li key={t.key} className={styles.typeRow} id={`type-${t.key}`}>
                <div className={styles.pair} data-type={t.key} data-enter="deal" style={{ ["--enter-i" as string]: i % 2, ["--deal-r" as string]: `${i % 2 ? 4 : -4}deg` }}>
                  <div className={styles.front}>
                    <span className={styles.society}>{SOCIETY.name[locale]}</span>
                    <span className={styles.chip} aria-hidden="true" />
                    <h3 className={styles.typeName}>{t.name[locale]}</h3>
                    <p className={styles.typeFee}>{t.fee[locale]}</p>
                    {t.granted ? <span className={styles.granted}>{m.granted}</span> : null}
                  </div>
                  <div className={styles.back}>
                    <p className={styles.typeWho}>{t.who[locale]}</p>
                    <p className={styles.typeFacts}>{t.facts[locale]}</p>
                  </div>
                </div>
                <div className={styles.typeDetail}>
                  <PointGroup title={t.requirements.heading[locale]} label={m.requirements} items={t.requirements.items} locale={locale} />
                  <PointGroup title={t.rights.heading[locale]} label={m.rights} items={t.rights.items} note={t.rights.note[locale]} locale={locale} />
                  <PointGroup title={t.benefits.heading[locale]} label={m.benefits} items={t.benefits.items} note={t.benefits.note[locale]} locale={locale} />
                  <p className={styles.typeSource}>{m.source}: {t.source[locale]}</p>
                </div>
              </li>
            ))}
          </ul>
          <StatusNote status={MEMBERSHIP_TYPES_META.status} dict={dict} className={page.note} />
        </div>
      </section>

      <section className={styles.booth} aria-label={m.plans}>
        <div className={`container ${styles.tickets}`}>
          {plans === null || plans.length === 0 ? (
            <article className={styles.ticket} data-enter="slide" aria-labelledby="plans-title">
              <h2 id="plans-title" className={styles.ticketRole}>{m.plans}</h2>
              <p className={styles.ticketTitle}>{plans === null ? m.plansUnavailable.title : m.plansEmpty.title}</p>
              <p className={styles.ticketBody}>{plans === null ? m.plansUnavailable.body : m.plansEmpty.body}</p>
            </article>
          ) : (
            <section className={styles.planTickets} aria-labelledby="plans-title">
              <h2 id="plans-title" className={styles.sectionTitle}>{m.plans}</h2>
              {plans.map((plan, i) => (
                <article key={plan.id} className={styles.ticket} data-enter="slide" style={{ ["--enter-i" as string]: i }} aria-labelledby={`plan-${plan.id}`}>
                  {plan.demo ? <p className={styles.ticketRole}><span className={styles.demoStamp}>{dict.membership.demo}</span></p> : null}
                  <h3 id={`plan-${plan.id}`} className={styles.ticketTitle}>{plan.name[locale]}</h3>
                  <p className={styles.ticketPrice}><PlanPrice plan={plan} locale={locale} dict={dict.membership} /></p>
                  {plan.eligibility[locale] ? <p className={styles.ticketBody}>{plan.eligibility[locale]}</p> : null}
                  {plan.rules.byRequest ? <p className={styles.ticketBody}>{dict.membership.byRequest}</p> : null}
                  {plan.demo ? <p className={styles.ticketBody}>{dict.membership.demoNote}</p> : null}
                </article>
              ))}
              <p><Link href={applyHref} className="btn btn-primary">{m.applyCta}</Link></p>
            </section>
          )}
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

/** One group of a membership type's details: a labelled heading, its points, and the source's note. */
function PointGroup({ title, label, items, note, locale }: { title: string; label: string; items: readonly Point[]; note?: string; locale: Locale }) {
  return (
    <section className={styles.group}>
      <p className={styles.groupLabel}>{label}</p>
      <h4 className={styles.groupTitle}>{title}</h4>
      <dl className={styles.points}>
        {items.map((pt) => (
          <div key={pt.title.en}>
            <dt>{pt.title[locale]}</dt>
            <dd>{pt.body[locale]}</dd>
          </div>
        ))}
      </dl>
      {note ? <p className={styles.groupNote}>{note}</p> : null}
    </section>
  );
}
