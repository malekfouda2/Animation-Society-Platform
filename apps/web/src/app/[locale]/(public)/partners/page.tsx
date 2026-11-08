import type { Metadata } from "next";
import Image from "next/image";
import { PageHero } from "@/components/sections/PageHero";
import page from "@/components/sections/page.module.css";
import { EmptyState } from "@/components/ui/EmptyState";
import { PARTNERS } from "@/content/partners";
import { getDictionary } from "@/i18n";
import { resolveLocale } from "@/i18n/locale-params";
import { pageMetadata } from "@/i18n/metadata";

type Params = Promise<{ locale: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const d = getDictionary(locale);
  return pageMetadata(locale, "/partners", d.partnersPage.title, d.partnersPage.lead);
}

export default async function PartnersPage({ params }: { params: Params }) {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);
  const p = dict.partnersPage;
  return (
    <>
      <PageHero locale={locale} title={p.title} lead={p.lead} tone="mist" art="dotsCool" />
      <section className={page.section} aria-label={p.title}>
        <div className="container">
          {PARTNERS.length === 0 ? (
            <EmptyState title={p.empty.title} body={p.empty.body} icon="partnerships" action={{ href: `/${locale}/contact`, label: dict.actions.contact }} />
          ) : (
            <ul>
              {PARTNERS.map((partner) => (
                <li key={partner.url}>
                  <a href={partner.url} rel="noopener noreferrer" target="_blank" aria-label={`${partner.name[locale]}: ${p.visit}`}>
                    <Image src={partner.logo} alt={partner.name[locale]} width={200} height={100} />
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
