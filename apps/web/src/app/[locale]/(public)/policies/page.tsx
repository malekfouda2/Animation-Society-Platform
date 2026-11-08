import type { Metadata } from "next";
import { PageHero } from "@/components/sections/PageHero";
import page from "@/components/sections/page.module.css";
import { EmptyState } from "@/components/ui/EmptyState";
import { POLICIES } from "@/content/policies";
import { getDictionary } from "@/i18n";
import { resolveLocale } from "@/i18n/locale-params";
import { pageMetadata } from "@/i18n/metadata";

type Params = Promise<{ locale: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const d = getDictionary(locale);
  return pageMetadata(locale, "/policies", d.policiesPage.title, d.policiesPage.lead);
}

/** Readable templates for Society-supplied policies. No legal wording is written here. */
export default async function PoliciesPage({ params }: { params: Params }) {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);
  const p = dict.policiesPage;
  return (
    <>
      <PageHero locale={locale} title={p.title} lead={p.lead} tone="mist" />
      <nav className={page.toc} aria-label={dict.a11y.onThisPage}>
        <ul className={`container ${page.tocList}`}>
          {POLICIES.map((policy) => (
            <li key={policy.slug}><a href={`#${policy.slug}`}>{policy.title[locale]}</a></li>
          ))}
        </ul>
      </nav>
      {POLICIES.map((policy) => (
        <section key={policy.slug} id={policy.slug} className={page.section} aria-labelledby={`${policy.slug}-title`}>
          <div className="container">
            <h2 id={`${policy.slug}-title`}>{policy.title[locale]}</h2>
            {policy.text ? (
              <div className={page.prose}>{policy.text[locale].map((para) => <p key={para.slice(0, 24)}>{para}</p>)}</div>
            ) : (
              <EmptyState title={p.pending.title} body={p.pending.body} icon="document" action={{ href: `/${locale}/contact`, label: dict.actions.contact }} />
            )}
          </div>
        </section>
      ))}
    </>
  );
}
