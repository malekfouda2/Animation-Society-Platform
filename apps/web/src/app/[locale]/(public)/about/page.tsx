import type { Metadata } from "next";
import { Objectives } from "@/components/sections/Objectives";
import { PageHero } from "@/components/sections/PageHero";
import styles from "@/components/sections/page.module.css";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusNote } from "@/components/ui/StatusNote";
import { ABOUT, BOARD, GENERAL_ASSEMBLY, OBJECTIVES_META, VISION_MISSION } from "@/content/society";
import { getDictionary } from "@/i18n";
import { resolveLocale } from "@/i18n/locale-params";
import { pageMetadata } from "@/i18n/metadata";

type Params = Promise<{ locale: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const d = getDictionary(locale);
  return pageMetadata(locale, "/about", d.about.title, d.about.lead);
}

export default async function AboutPage({ params }: { params: Params }) {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);
  const a = dict.about;
  const toc = [
    ["introduction", a.toc.intro],
    ["vision-mission", a.toc.visionMission],
    ["objectives", a.toc.objectives],
    ["board", a.toc.board],
    ["general-assembly", a.toc.assembly],
  ] as const;

  return (
    <>
      <PageHero locale={locale} title={a.title} lead={a.lead} tone="green" art="coverRibbons" />
      <nav className={styles.toc} aria-label={dict.a11y.onThisPage}>
        <ul className={`container ${styles.tocList}`}>
          {toc.map(([id, label]) => (
            <li key={id}><a href={`#${id}`}>{label}</a></li>
          ))}
        </ul>
      </nav>

      <section id="introduction" className={styles.section} aria-labelledby="intro-title">
        <div className="container">
          <h2 id="intro-title">{a.toc.intro}</h2>
          <div className={styles.prose} data-reveal="">
            <p>{ABOUT.intro[locale]}</p>
          </div>
          <StatusNote status={ABOUT.status} dict={dict} className={styles.note} />
        </div>
      </section>

      <section id="vision-mission" className={styles.section} aria-labelledby="vm-title">
        <div className="container">
          <h2 id="vm-title">{a.toc.visionMission}</h2>
          {VISION_MISSION.vision && VISION_MISSION.mission ? (
            <div className={styles.twoCol}>
              <div><h3>{a.vision}</h3><p>{VISION_MISSION.vision[locale]}</p></div>
              <div><h3>{a.mission}</h3><p>{VISION_MISSION.mission[locale]}</p></div>
            </div>
          ) : (
            <EmptyState title={a.visionMissionPending.title} body={a.visionMissionPending.body} icon="flag" />
          )}
        </div>
      </section>

      <section id="objectives" className={styles.section} aria-labelledby="objectives-title">
        <div className="container">
          <h2 id="objectives-title">{a.toc.objectives}</h2>
          <Objectives locale={locale} />
          <StatusNote status={OBJECTIVES_META.status} dict={dict} className={styles.note} />
        </div>
      </section>

      <section id="board" className={styles.section} aria-labelledby="board-title">
        <div className="container">
          <h2 id="board-title">{a.toc.board}</h2>
          {BOARD.members.length === 0 ? (
            <EmptyState
              title={a.boardEmpty.title}
              body={a.boardEmpty.body}
              icon="award"
              action={{ href: `/${locale}/contact`, label: dict.actions.contact }}
            />
          ) : null}
        </div>
      </section>

      <section id="general-assembly" className={styles.section} aria-labelledby="ga-title">
        <div className="container">
          <h2 id="ga-title">{a.toc.assembly}</h2>
          <div className={styles.prose} data-reveal="">
            <p>{GENERAL_ASSEMBLY.body[locale]}</p>
          </div>
          <p className={styles.callout}>{GENERAL_ASSEMBLY.votingNote[locale]}</p>
          <StatusNote status="draft" dict={dict} className={styles.note} />
        </div>
      </section>
    </>
  );
}
