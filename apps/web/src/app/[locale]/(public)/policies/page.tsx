import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/sections/PageHero";
import { StatusNote } from "@/components/ui/StatusNote";
import { getDictionary } from "@/i18n";
import { resolveLocale } from "@/i18n/locale-params";
import { pageMetadata } from "@/i18n/metadata";
import { siteSections } from "@/lib/site-sections";
import styles from "./policies.module.css";

type Params = Promise<{ locale: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const d = getDictionary(locale);
  return pageMetadata(locale, "/policies", d.policiesPage.title, d.policiesPage.lead);
}

/** Blank script lines on a policy page still waiting for its text (decorative). */
const LINES = [92, 100, 86, 97, 64];

/*
 * Policies as a production binder: coloured index tabs down the side, one punched page per policy.
 * No legal wording is written here: a page without Society text shows blank ruled lines and a
 * stamp saying it is awaiting the text, with one shared way to ask about it.
 */
export default async function PoliciesPage({ params }: { params: Params }) {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);
  const p = dict.policiesPage;
  const { POLICIES } = await siteSections();
  const anyPending = POLICIES.some((policy) => !policy.text);
  return (
    <>
      <PageHero title={p.title} lead={p.lead} tone="mist" />
      <section className={styles.binder} aria-label={p.title}>
        <div className={`container ${styles.grid}`}>
          <nav className={styles.tabs} aria-label={dict.a11y.onThisPage}>
            <ul>
              {POLICIES.map((policy, i) => (
                <li key={policy.slug} style={{ ["--k" as string]: i }}>
                  <a href={`#${policy.slug}`} className={styles.tab}>{policy.title[locale]}</a>
                </li>
              ))}
            </ul>
            {anyPending ? (
              <div className={styles.ask}>
                <p>{p.pending.body}</p>
                <Link href={`/${locale}/contact`} className="btn btn-secondary">{dict.actions.contact}</Link>
              </div>
            ) : null}
          </nav>
          <div className={styles.pages}>
            {POLICIES.map((policy, i) => (
              <section
                key={policy.slug}
                id={policy.slug}
                className={styles.page}
                style={{ ["--k" as string]: i }}
                aria-labelledby={`${policy.slug}-title`}
                data-enter="sheet"
              >
                <span className={styles.holes} aria-hidden="true"><i /><i /><i /></span>
                <h2 id={`${policy.slug}-title`} className={styles.pageTitle}>{policy.title[locale]}</h2>
                {policy.text ? (
                  <div className={styles.prose}>
                    {policy.text[locale].map((para, n) => (
                      // eslint-disable-next-line @eslint-react/no-array-index-key -- paragraphs never reorder; position is the identity
                      <p key={n}>{para}</p>
                    ))}
                    <StatusNote status={policy.status} dict={dict} />
                  </div>
                ) : (
                  <>
                    <span className={styles.lines} aria-hidden="true">
                      {LINES.map((w, n) => (
                        // eslint-disable-next-line @eslint-react/no-array-index-key -- fixed decorative lines
                        <i key={n} style={{ inlineSize: `${w}%` }} />
                      ))}
                    </span>
                    <p className={styles.stamp}>{p.pending.title}</p>
                  </>
                )}
              </section>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
