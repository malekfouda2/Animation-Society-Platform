import type { Metadata } from "next";
import Link from "next/link";
import { Sketch } from "@/components/art/Sketches";
import { BoardList } from "@/components/sections/BoardList";
import { PageHero } from "@/components/sections/PageHero";
import page from "@/components/sections/page.module.css";
import { BrandIcon } from "@/components/ui/BrandIcon";
import { StatusNote } from "@/components/ui/StatusNote";
import { getDictionary } from "@/i18n";
import { resolveLocale } from "@/i18n/locale-params";
import { pageMetadata } from "@/i18n/metadata";
import { siteSections } from "@/lib/site-sections";
import styles from "./about.module.css";

type Params = Promise<{ locale: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const d = getDictionary(locale);
  return pageMetadata(locale, "/about", d.about.title, d.about.lead);
}

/*
 * About as a storyboard: each part of the page is one numbered panel (a rough pencil sketch) with
 * its notes beside it, the way a story is laid out before animation starts. Goals are a row of
 * four thumbnails. Panel numbers follow the page order, so they are a real sequence.
 */
export default async function AboutPage({ params }: { params: Params }) {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);
  const a = dict.about;
  const { ABOUT, BOARD, GENERAL_ASSEMBLY, OBJECTIVES, OBJECTIVES_META, VISION_MISSION } = await siteSections();
  const digits = new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en");
  const toc = [
    ["introduction", a.toc.intro],
    ["vision-mission", a.toc.visionMission],
    ["objectives", a.toc.objectives],
    ["board", a.toc.board],
    ["general-assembly", a.toc.assembly],
  ] as const;
  const no = (id: (typeof toc)[number][0]) => digits.format(toc.findIndex(([t]) => t === id) + 1);

  return (
    <>
      <PageHero title={a.title} lead={a.lead} tone="green" />
      <nav className={styles.strip} aria-label={dict.a11y.onThisPage}>
        <ol className={`container ${styles.stripList}`}>
          {toc.map(([id, label], i) => (
            <li key={id}>
              <a href={`#${id}`} className={styles.stripLink}>
                <span className={styles.stripNo} aria-hidden="true">{digits.format(i + 1)}</span>
                {label}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <section id="introduction" className={styles.shot} aria-labelledby="intro-title">
        <div className={`container ${styles.shotGrid}`}>
          <figure className={styles.panel} data-enter="sheet">
            <span className={styles.panelNo} aria-hidden="true">{no("introduction")}</span>
            <Sketch name="bounce" className={styles.sketch} />
          </figure>
          <div className={styles.notes} data-enter="rise" style={{ ["--enter-i" as string]: 1 }}>
            <h2 id="intro-title" className={styles.heading}>{a.toc.intro}</h2>
            <p className={styles.big}>{ABOUT.intro[locale]}</p>
            <StatusNote status={ABOUT.status} dict={dict} />
          </div>
        </div>
      </section>

      <section id="vision-mission" className={styles.shot} aria-labelledby="vm-title">
        <div className={`container ${styles.shotGrid}`}>
          <figure className={styles.panel} data-enter="sheet">
            <span className={styles.panelNo} aria-hidden="true">{no("vision-mission")}</span>
            <Sketch name="horizon" className={styles.sketch} />
          </figure>
          <div className={styles.notes} data-enter="rise" style={{ ["--enter-i" as string]: 1 }}>
            <h2 id="vm-title" className={styles.heading}>{a.toc.visionMission}</h2>
            <h3 className={styles.label}>{a.vision}</h3>
            {VISION_MISSION.vision ? (
              <>
                <blockquote className={styles.quote}><p>{VISION_MISSION.vision[locale]}</p></blockquote>
                <StatusNote status={VISION_MISSION.status} dict={dict} />
              </>
            ) : (
              <p className={page.muted}>{a.visionMissionPending.body}</p>
            )}
            <h3 className={styles.label}>{a.mission}</h3>
            {VISION_MISSION.mission ? (
              <blockquote className={styles.quote}><p>{VISION_MISSION.mission[locale]}</p></blockquote>
            ) : (
              <p className={styles.pencil}>{a.missionPending}</p>
            )}
          </div>
        </div>
      </section>

      <section id="objectives" className={styles.goals} aria-labelledby="objectives-title">
        <div className="container">
          <h2 id="objectives-title" className={styles.goalsTitle} data-enter="rise">
            <span className={styles.panelNo} aria-hidden="true">{no("objectives")}</span>
            {a.toc.objectives}
          </h2>
          <ul className={styles.thumbs}>
            {OBJECTIVES.map((o, i) => (
              <li
                key={o.key}
                className={styles.thumb}
                data-enter="deal"
                style={{ ["--enter-i" as string]: i, ["--deal-r" as string]: `${(i - 1.5) * 4}deg` }}
              >
                <span className={styles.thumbFrame} aria-hidden="true">
                  <BrandIcon name={o.icon} size={96} className={styles.thumbIcon} />
                </span>
                <p className={styles.thumbText}>{o.title[locale]}</p>
              </li>
            ))}
          </ul>
          <StatusNote status={OBJECTIVES_META.status} dict={dict} />
        </div>
      </section>

      <section id="board" className={styles.shot} aria-labelledby="board-title">
        <div className={`container ${styles.shotGrid}`}>
          <figure className={styles.panel} data-enter="sheet">
            <span className={styles.panelNo} aria-hidden="true">{no("board")}</span>
            <Sketch name="table" className={styles.sketch} />
          </figure>
          <div className={styles.notes} data-enter="rise" style={{ ["--enter-i" as string]: 1 }}>
            <h2 id="board-title" className={styles.heading}>{a.toc.board}</h2>
            {BOARD.members.length === 0 ? (
              <>
                <p className={styles.big}>{a.boardEmpty.title}</p>
                <p className={page.muted}>{a.boardEmpty.body}</p>
                <Link href={`/${locale}/contact`} className="btn btn-secondary">{dict.actions.contact}</Link>
              </>
            ) : (
              <>
                <BoardList members={BOARD.members} locale={locale} />
                <StatusNote status={BOARD.status} dict={dict} />
              </>
            )}
          </div>
        </div>
      </section>

      <section id="general-assembly" className={styles.shot} aria-labelledby="ga-title">
        <div className={`container ${styles.shotGrid}`}>
          <figure className={styles.panel} data-enter="sheet">
            <span className={styles.panelNo} aria-hidden="true">{no("general-assembly")}</span>
            <Sketch name="chamber" className={styles.sketch} />
          </figure>
          <div className={styles.notes} data-enter="rise" style={{ ["--enter-i" as string]: 1 }}>
            <h2 id="ga-title" className={styles.heading}>{a.toc.assembly}</h2>
            <p className={styles.big}>{GENERAL_ASSEMBLY.body[locale]}</p>
            {GENERAL_ASSEMBLY.votingNote[locale] ? <p className={styles.director}>{GENERAL_ASSEMBLY.votingNote[locale]}</p> : null}
            <StatusNote status={GENERAL_ASSEMBLY.status} dict={dict} />
          </div>
        </div>
      </section>
    </>
  );
}
