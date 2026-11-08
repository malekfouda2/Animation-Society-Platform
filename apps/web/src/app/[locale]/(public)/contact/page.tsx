import type { Metadata } from "next";
import { ContactForm } from "@/components/contact/ContactForm";
import { PageHero } from "@/components/sections/PageHero";
import page from "@/components/sections/page.module.css";
import { SOCIETY } from "@/content/society";
import { getDictionary } from "@/i18n";
import { resolveLocale } from "@/i18n/locale-params";
import { pageMetadata } from "@/i18n/metadata";

type Params = Promise<{ locale: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const d = getDictionary(locale);
  return pageMetadata(locale, "/contact", d.contactPage.title, d.contactPage.lead);
}

export default async function ContactPage({ params }: { params: Params }) {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);
  const c = dict.contactPage;
  return (
    <>
      <PageHero locale={locale} title={c.title} lead={c.lead} tone="cream" art="panelDiscs" />
      <section className={page.section} aria-label={c.title}>
        <div className={`container ${page.twoCol}`}>
          <div>
            <ContactForm locale={locale} labels={c.form} />
            <p className={`status-note ${page.note}`}>{c.devNote}</p>
          </div>
          <aside aria-labelledby="contact-info">
            <h2 id="contact-info">{c.info}</h2>
            <dl>
              <dt>{c.website}</dt>
              <dd><a href={SOCIETY.website}>animation.org.sa</a></dd>
            </dl>
            {SOCIETY.email ? <p><a href={`mailto:${SOCIETY.email}`}>{SOCIETY.email}</a></p> : <p className="status-note">{c.emailPending}</p>}
          </aside>
        </div>
      </section>
    </>
  );
}
