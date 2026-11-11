import Image from "next/image";
import Link from "next/link";
import { Arc, Balls, Blob, Contours, Planet } from "@/components/art/Shapes";
import { IntroFilm } from "@/components/media/IntroFilm";
import { Journey } from "@/components/sections/Journey";
import { BoardList } from "@/components/sections/BoardList";
import { MembershipDeck } from "@/components/sections/MembershipDeck";
import { Art } from "@/components/ui/Art";
import { BrandIcon } from "@/components/ui/BrandIcon";
import { EmptyState } from "@/components/ui/EmptyState";
import { MediaImage } from "@/components/ui/MediaImage";
import { StatusNote } from "@/components/ui/StatusNote";
import { ARTWORK, VIDEOS } from "@/config/artwork";
import { FIELDS } from "@/content/fields";
import { MEMBERSHIP_INTRO } from "@/content/membership";
import { getDictionary } from "@/i18n";
import { resolveLocale } from "@/i18n/locale-params";
import { coverKey, publishedList } from "@/lib/public-content";
import { siteSections } from "@/lib/site-sections";
import styles from "./home.module.css";

/*
 * Home: one continuous night-studio journey. Brand shapes float on parallax layers
 * (data-speed / data-depth, driven by components/motion/MotionEngine) and sections scrub with
 * scroll through --p (data-progress). Without JS or under reduced motion every layer is static and
 * every scrubbed section shows its finished state.
 */
/* General Assembly chamber: four rows of seats on a half circle (decorative, carries no data). */
const SEATS = [
  { row: 0, r: 236, count: 13 },
  { row: 1, r: 284, count: 16 },
  { row: 2, r: 332, count: 19 },
  { row: 3, r: 380, count: 22 },
].flatMap(({ row, r, count }) =>
  Array.from({ length: count }, (_, n) => {
    const a = Math.PI - (n / (count - 1)) * Math.PI; // left to right
    return { row, n, x: +(400 + r * Math.cos(a)).toFixed(1), y: +(400 - r * Math.sin(a)).toFixed(1), order: +(n / (count - 1)).toFixed(3) };
  }),
);

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);
  const h = dict.home;
  // Published content from the API; if it can't be reached the sections show their empty state.
  const [projects, partnerList, postList, { ABOUT, BOARD, GENERAL_ASSEMBLY, HERO, OBJECTIVES, OBJECTIVES_META }] = await Promise.all([
    publishedList("project"),
    publishedList("partner"),
    publishedList("post"),
    siteSections(),
  ]);
  const featured = projects.ok ? projects.items[0] : undefined;
  const partners = partnerList.ok ? partnerList.items : [];
  const posts = postList.ok ? postList.items.slice(0, 3) : [];
  const dateFmt = new Intl.DateTimeFormat(locale === "ar" ? "ar-SA-u-ca-gregory-nu-latn" : "en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
  const fieldName = (slug: string) => FIELDS.find((f) => f.slug === slug)?.name[locale] ?? slug;
  const introWords = ABOUT.intro[locale].split(" ");
  const digits = new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en");
  const countdown = [3, 2, 1].map((n) => digits.format(n));
  const film = VIDEOS.intro[locale];

  return (
    <>
      {/* 1. Hero: the logo's ball as a planet inside the brand's contour rings */}
      <section className={styles.hero} aria-labelledby="home-title">
        <div className={styles.heroArt} aria-hidden="true">
          <div className={styles.heroGlow} />
          <Contours className={styles.heroRings} rings={11} speed={0.12} depth={14} />
          <Planet className={styles.heroPlanet} speed={0.28} depth={26} />
          <span className={styles.orbit}>
            <span className={styles.orbitBall} />
          </span>
          <span className={`${styles.orbit} ${styles.orbitWide}`}>
            <span className={`${styles.orbitBall} ${styles.orbitBallGreen}`} />
          </span>
          <Blob className={styles.heroBlobA} speed={-0.2} depth={-36} />
          <Blob className={styles.heroBlobB} variant={2} speed={0.35} depth={44} />
          <Arc className={styles.heroArc} speed={0.18} depth={-18} />
          <Balls className={styles.heroBallsA} speed={0.45} depth={60} />
          <Balls className={styles.heroBallsB} warm={false} speed={-0.3} depth={-50} />
          <Art name="ribbonWarm" locale={locale} className={styles.heroRibbon} sizes="40vw" priority speed={0.2} />
        </div>
        <div className={`container ${styles.heroCopy}`}>
          <h1 id="home-title" className={styles.heroTitle}>{HERO.title[locale]}</h1>
          <p className={styles.heroBody}>{HERO.body[locale]}</p>
          <div className={styles.actions}>
            <Link href={`/${locale}/membership`} className="btn btn-primary">
              {dict.actions.exploreMembership}
            </Link>
            <Link href={`/${locale}/about`} className="btn btn-secondary">
              {dict.actions.aboutSociety}
            </Link>
          </div>
        </div>
        <a href="#video-title" className={styles.scrollCue}>
          <span className={styles.scrollBall} aria-hidden="true" />
          {h.hero.scroll}
        </a>
      </section>

      {/* 2. Video: a cinema screen. The film countdown leader runs 3-2-1 over the poster as you scroll,
          then the Society's introduction film (Arabic on /ar, English on /en) is ready to play. */}
      <section className={styles.video} aria-labelledby="video-title" data-progress="">
        <div className={styles.beam} aria-hidden="true" data-enter="beam">
          <span className={styles.beamDust} data-speed="-0.12" />
        </div>
        <div className="container">
          <h2 id="video-title" className={styles.videoTitle} data-enter="rise">{h.video.heading}</h2>
          <div className={styles.screen} data-enter="power" style={{ ["--enter-i" as string]: 2 }}>
            <IntroFilm
              src={film.src}
              poster={film.poster}
              width={VIDEOS.intro.width}
              height={VIDEOS.intro.height}
              label={h.video.label}
              playLabel={h.video.play}
              caption={h.video.caption}
            />
            <div className={styles.leader} aria-hidden="true">
              <span className={styles.leaderSweep} />
              <span className={styles.leaderRing} />
              <span className={`${styles.leaderRing} ${styles.leaderRingInner}`} />
              <span className={styles.leaderCross} />
              {countdown.map((n, k) => (
                <span key={n} className={styles.leaderNum} style={{ ["--k" as string]: k }}>{n}</span>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* 3. About: a sheet of animation paper on the light table. The statement is pencilled in and
          inked as it scrolls past; the aims carry red/green onion skins that settle onto the key pose. */}
      <section className={styles.about} aria-labelledby="about-title" data-progress="">
        <Contours className={styles.aboutRings} rings={7} tone="warm" speed={-0.15} />
        <div className="container">
          <div className={styles.paper} data-enter="sheet">
            <span className={styles.pegs} aria-hidden="true"><span /><span /><span /></span>
            <h2 id="about-title" className={styles.paperHeading}>{h.about.heading}</h2>
            <p className={styles.statement} style={{ ["--n" as string]: introWords.length }}>
              {introWords.map((word, i) => (
                // eslint-disable-next-line @eslint-react/no-array-index-key -- words repeat; position is the identity
                <span key={`${word}-${i}`} style={{ ["--i" as string]: i }}>
                  {word}{" "}
                </span>
              ))}
            </p>
            <ul className={styles.aims}>
              {ABOUT.aims[locale].map((aim) => (
                <li key={aim}>
                  <span className={styles.ghostPrev} aria-hidden="true">{aim}</span>
                  <span className={styles.ghostNext} aria-hidden="true">{aim}</span>
                  <span className={styles.aimKey}>{aim}</span>
                </li>
              ))}
            </ul>
            <div className={styles.rowActions}>
              <Link href={`/${locale}/about`} className="btn btn-secondary">{dict.actions.aboutSociety}</Link>
              <StatusNote status={ABOUT.status} dict={dict} />
            </div>
          </div>
        </div>
      </section>

      {/* 4. Objectives: a zoetrope. On wide screens the section pins and scrolling spins the drum
          until each objective faces you; elsewhere the strip is laid out flat. */}
      <section
        className={styles.objectives}
        aria-labelledby="objectives-title"
        data-progress="pin"
        style={{ ["--count" as string]: OBJECTIVES.length }}
      >
        <div className={styles.objectivesStage}>
          <div className={`container ${styles.objectivesHead}`} data-enter="rise">
            <h2 id="objectives-title" className={styles.objectivesTitle}>{h.objectives.heading}</h2>
            <p className={styles.objectivesLead}>{h.objectives.lead}</p>
          </div>
          <div className={styles.zoetrope} data-enter="zoetrope" style={{ ["--enter-i" as string]: 1 }}>
            <span className={styles.drumRim} aria-hidden="true" />
            <ul className={styles.drum}>
              {OBJECTIVES.map((o, i) => (
                <li key={o.key} className={styles.slot} style={{ ["--k" as string]: i }}>
                  <span className={styles.slits} aria-hidden="true" />
                  <div className={styles.slotFace}>
                    <BrandIcon name={o.icon} size={64} className={styles.slotIcon} />
                    <h3 className={styles.slotTitle}>{o.title[locale]}</h3>
                  </div>
                  <span className={`${styles.slits} ${styles.slitsLow}`} aria-hidden="true" />
                </li>
              ))}
            </ul>
            <span className={styles.drumShadow} aria-hidden="true" />
          </div>
          <div className={`container ${styles.objectivesFoot}`}>
            <span className={styles.ticks} aria-hidden="true">
              {OBJECTIVES.map((o, i) => (
                <span key={o.key} style={{ ["--k" as string]: i }} />
              ))}
            </span>
            <StatusNote status={OBJECTIVES_META.status} dict={dict} />
          </div>
        </div>
      </section>

      {/* 5. Fields: four techniques as one big list. Each name moves the way its technique moves
          (line boil, extrusion, stop-motion hops, half drawn/half modelled) and the light table
          shows its drawing. */}
      <section className={styles.fields} aria-labelledby="fields-title">
        <div className={`container ${styles.fieldsGrid}`}>
          <div className={styles.fieldsHead} data-enter="rise">
            <h2 id="fields-title" className={styles.fieldsTitle}>{h.fields.heading}</h2>
            <p className={styles.fieldsLead}>{h.fields.lead}</p>
          </div>
          <ul className={styles.techList}>
            {FIELDS.map((field, i) => {
              const art = ARTWORK[field.art];
              return (
                <li key={field.slug} className={styles.tech} data-tech={field.slug} data-enter="slide" style={{ ["--enter-i" as string]: i }}>
                  <Link href={`/${locale}/fields#${field.slug}`} className={styles.techLink}>
                    <span className={styles.techName}>{field.name[locale]}</span>
                    <span className={styles.techSummary}>{field.summary[locale]}</span>
                    <span className={styles.techThumb} aria-hidden="true">
                      <Image src={art.src} width={art.width} height={art.height} alt="" unoptimized />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className={styles.lightTable} aria-hidden="true" data-enter="drop" style={{ ["--enter-i" as string]: 2 }}>
            <div className={styles.sheet}>
              <span className={styles.pegs}><span /><span /><span /></span>
              <span className={styles.sheetArts}>
                {FIELDS.map((field) => {
                  const art = ARTWORK[field.art];
                  return <Image key={field.slug} src={art.src} width={art.width} height={art.height} alt="" unoptimized className={styles.sheetArt} />;
                })}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Membership: the bouncing-ball journey, then the membership cards on the table. */}
      <section className={styles.membership} aria-labelledby="membership-title">
        <Planet className={styles.membershipPlanet} speed={0.3} depth={24} />
        <div className="container">
          <h2 id="membership-title" className={styles.membershipTitle} data-enter="rise">{h.membership.heading}</h2>
          <p className={styles.membershipLead} data-enter="rise" style={{ ["--enter-i" as string]: 1 }}>{MEMBERSHIP_INTRO.why[locale]}</p>
          <h3 className={styles.subhead} data-enter="rise">{h.membership.journey}</h3>
          <Journey locale={locale} />
          <h3 className={styles.subhead} data-enter="rise">{h.membership.types}</h3>
          <MembershipDeck locale={locale} grantedLabel={h.membership.granted} />
          <div className={styles.membershipFoot} data-enter="rise">
            <p>{h.membership.plansNote}</p>
            <Link href={`/${locale}/membership`} className="btn btn-primary">
              {dict.actions.exploreMembership}
            </Link>
          </div>
        </div>
      </section>

      {/* 7. Projects: the featured initiative as a lit cinema poster in a marquee frame. */}
      <section className={styles.projects} aria-labelledby="projects-title">
        <div className={`container ${styles.projectsGrid}`}>
          <div className={styles.projectsText} data-enter="rise">
            <h2 id="projects-title" className={styles.projectsTitle}>{h.projects.heading}</h2>
            <p className={styles.projectsLead}>{h.projects.lead}</p>
            <p className={styles.sectionLink}>
              <Link href={`/${locale}/projects`}>{dict.actions.allProjects}</Link>
            </p>
          </div>
          {featured ? (
            <div className={styles.posterSlot} data-enter="drop" style={{ ["--enter-i" as string]: 1 }}>
            <article className={styles.marquee}>
              <Link href={`/${locale}/projects/${featured.slug}`} className={styles.poster}>
                <span className={styles.posterArt}>
                  {featured.data.image.id ? (
                    <MediaImage media={featured.data.image} locale={locale} className={styles.posterImg} />
                  ) : (
                    <Art name={coverKey(featured.data.cover)} locale={locale} className={styles.posterImg} sizes="(min-width: 64rem) 30rem, 100vw" />
                  )}
                </span>
                <span className={styles.posterBody}>
                  <span className={styles.posterTitle}>{featured.data.title[locale]}</span>
                  <span className={styles.posterSummary}>{featured.data.summary[locale]}</span>
                  <span className={styles.billing}>
                    <span>{dict.projectsPage.field}: {fieldName(featured.data.field)}</span>
                    <span>{dict.projectsPage.progress}: {featured.data.progressLabel[locale]}</span>
                  </span>
                  <span className={styles.posterMore}>{dict.actions.viewDetails}</span>
                </span>
              </Link>
            </article>
            </div>
          ) : (
            <EmptyState title={h.projects.empty.title} body={h.projects.empty.body} icon="flag" />
          )}
        </div>
      </section>

      {/* 8 + 9. Governance: the General Assembly as a chamber of seats that fills as you scroll. */}
      <section className={styles.governance} aria-labelledby="governance-title" data-progress="">
        <div className="container">
          <div className={styles.chamber}>
            <svg className={styles.hemicycle} viewBox="0 0 800 420" aria-hidden="true" focusable="false">
              {SEATS.map((s) => (
                <circle key={`${s.row}-${s.n}`} cx={s.x} cy={s.y} r="9" className={styles.seat} data-row={s.row} style={{ ["--s" as string]: s.order }} />
              ))}
            </svg>
            <h2 id="governance-title" className={styles.chamberTitle} data-enter="rise">{h.governance.heading}</h2>
          </div>
          <div className={styles.govGrid}>
            <div data-enter="rise">
              <h3 className={styles.govHead}>{h.governance.assembly}</h3>
              <p className={styles.govBody}>{GENERAL_ASSEMBLY.body[locale]}</p>
              {GENERAL_ASSEMBLY.votingNote[locale] ? <p className={styles.rule}>{GENERAL_ASSEMBLY.votingNote[locale]}</p> : null}
              <div className={styles.rowActions}>
                <Link href={`/${locale}/about#general-assembly`} className="btn btn-secondary">
                  {h.governance.readMore}
                </Link>
                <StatusNote status={GENERAL_ASSEMBLY.status} dict={dict} />
              </div>
            </div>
            <div className={styles.board} data-enter="rise" style={{ ["--enter-i" as string]: 1 }}>
              <h3 className={styles.govHead}>{h.governance.board}</h3>
              {BOARD.members.length === 0 ? (
                <>
                  <p className={styles.boardEmpty}>{h.governance.boardEmpty.title}</p>
                  <p className={styles.govBody}>{h.governance.boardEmpty.body}</p>
                  <Link href={`/${locale}/about#board`} className={styles.textLink}>{h.governance.readMore}</Link>
                </>
              ) : (
                <>
                  <BoardList members={BOARD.members} locale={locale} compact />
                  <StatusNote status={BOARD.status} dict={dict} />
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 10 + 11. Partners and news as the film's end credits, rolling into the footer's closing line. */}
      <section className={styles.credits} aria-label={`${h.partners.heading}, ${h.news.heading}`}>
        <div className={`container ${styles.roll}`}>
          <div className={styles.creditBlock} data-enter="roll">
            <h2 className={styles.creditRole}>{h.partners.heading}</h2>
            {partners.length === 0 ? (
              <>
                <p className={styles.creditName}>{h.partners.empty.title}</p>
                <p className={styles.creditNote}>{h.partners.empty.body}</p>
                <Link href={`/${locale}/contact`} className="btn btn-secondary">{dict.actions.contact}</Link>
              </>
            ) : (
              <>
                <ul className={styles.creditList}>
                  {partners.map(({ slug, data }) => (
                    <li key={slug}>
                      <a href={data.url} rel="noopener noreferrer" target="_blank" className={styles.creditName}>{data.title[locale]}</a>
                    </li>
                  ))}
                </ul>
                <Link href={`/${locale}/partners`} className="btn btn-secondary">{h.partners.all}</Link>
              </>
            )}
          </div>
          <span className={styles.creditBall} aria-hidden="true" data-enter="pop" />
          <div className={styles.creditBlock} data-enter="roll">
            <h2 className={styles.creditRole}>{h.news.heading}</h2>
            {posts.length === 0 ? (
              <>
                <p className={styles.creditName}>{h.news.empty.title}</p>
                <p className={styles.creditNote}>{h.news.empty.body}</p>
                <Link href={`/${locale}/projects`} className="btn btn-secondary">{dict.actions.allProjects}</Link>
              </>
            ) : (
              <>
                <ul className={styles.creditList}>
                  {posts.map(({ slug, data }) => (
                    <li key={slug}>
                      <time dateTime={data.date} className={styles.creditNote}>{dateFmt.format(new Date(`${data.date}T12:00:00Z`))}</time>
                      <Link href={`/${locale}/news/${slug}`} className={styles.creditName}>{data.title[locale]}</Link>
                    </li>
                  ))}
                </ul>
                <Link href={`/${locale}/news`} className="btn btn-secondary">{h.news.all}</Link>
              </>
            )}
          </div>
        </div>
      </section>
      {/* 12. The closing invitation is the footer's statement ("Let's make it move"). */}
    </>
  );
}
