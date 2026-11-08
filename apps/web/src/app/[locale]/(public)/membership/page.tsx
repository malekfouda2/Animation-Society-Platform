import type { Metadata } from "next";
import Link from "next/link";
import { Journey } from "@/components/sections/Journey";
import { MembershipTypes } from "@/components/sections/MembershipTypes";
import { PageHero } from "@/components/sections/PageHero";
import page from "@/components/sections/page.module.css";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusNote } from "@/components/ui/StatusNote";
import { BENEFITS, FAQ, FAQ_META, MEMBERSHIP_INTRO, MEMBERSHIP_TYPES_META, PLANS } from "@/content/membership";
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

export default async function MembershipPage({ params }: { params: Params }) {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);
  const m = dict.membershipPage;
  return (
    <>
      <PageHero locale={locale} title={m.title} lead={m.lead} tone="green" art="panelDiscs">
        <p className={styles.applyNote}>{m.applyNote}</p>
      </PageHero>

      <section className={page.section} aria-labelledby="why-title">
        <div className="container">
          <h2 id="why-title">{m.why}</h2>
          <div className={page.prose} data-reveal=""><p>{MEMBERSHIP_INTRO.why[locale]}</p></div>
          <StatusNote status={MEMBERSHIP_INTRO.status} dict={dict} />
        </div>
      </section>

      <section className={page.section} aria-labelledby="types-title">
        <div className="container">
          <h2 id="types-title">{m.types}</h2>
          <MembershipTypes locale={locale} grantedLabel={m.granted} detailed={{ who: m.who, rights: m.rights }} />
          <StatusNote status={MEMBERSHIP_TYPES_META.status} dict={dict} className={page.note} />
        </div>
      </section>

      <section className={page.section} aria-labelledby="plans-title">
        <div className={`container ${page.twoCol}`}>
          <div>
            <h2 id="plans-title">{m.plans}</h2>
            {PLANS.items.length === 0 ? <EmptyState title={m.plansEmpty.title} body={m.plansEmpty.body} icon="ticket" /> : null}
          </div>
          <div>
            <h2>{m.benefits}</h2>
            {BENEFITS.items.length === 0 ? <EmptyState title={m.benefitsEmpty.title} body={m.benefitsEmpty.body} icon="award" /> : null}
          </div>
        </div>
      </section>

      <section className={`${page.section} ${styles.journey}`} aria-labelledby="journey-title">
        <div className="container">
          <h2 id="journey-title">{m.journey}</h2>
          <Journey locale={locale} headingLevel="h3" />
        </div>
      </section>

      <section className={page.section} aria-labelledby="faq-title">
        <div className="container">
          <h2 id="faq-title">{m.faq}</h2>
          <div className={styles.faq}>
            {FAQ.map((item) => (
              <details key={item.q.en} className={styles.faqItem}>
                <summary>{item.q[locale]}</summary>
                <p>{item.a[locale]}</p>
              </details>
            ))}
          </div>
          <StatusNote status={FAQ_META.status} dict={dict} className={page.note} />
          <p className={styles.contact}>
            <Link href={`/${locale}/contact`} className="btn btn-secondary">{dict.actions.contact}</Link>
          </p>
        </div>
      </section>
    </>
  );
}
