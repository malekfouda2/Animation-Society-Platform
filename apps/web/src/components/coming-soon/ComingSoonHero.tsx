import { LOCALE_DIRECTION, type Locale } from "@as/contracts";
import Link from "next/link";
import { StatusNote } from "@/components/ui/StatusNote";
import { Art } from "@/components/ui/Art";
import { ARTWORK } from "@/config/artwork";
import { siteSections } from "@/lib/site-sections";
import type { Dictionary } from "@/i18n/types";
import { BounceStage } from "./BounceStage";
import { HeroScene } from "./HeroScene";
import hero from "./hero.module.css";

/**
 * Saved hero (green field, white lightbox disc with the bouncing-ball exercise, character crescent).
 * Kept intact for the coming-soon landing page (Malek, 5 Nov 2026). Preview: /{locale}/preview/coming-soon.
 * Swap the copy and actions here when the coming-soon content is supplied.
 */
export async function ComingSoonHero({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const { HERO } = await siteSections();
  return (
    <section className={hero.hero} aria-labelledby="coming-soon-title">
      <div className={`container ${hero.grid}`}>
        <div className={hero.copy}>
          <h1 id="coming-soon-title" className={hero.title}>
            {HERO.title[locale]}
          </h1>
          <p className={hero.body}>{HERO.body[locale]}</p>
          <div className={hero.actions}>
            <Link href={`/${locale}/membership`} className="btn btn-primary">
              {dict.actions.exploreMembership}
            </Link>
            <Link href={`/${locale}/about`} className="btn btn-secondary">
              {dict.actions.aboutSociety}
            </Link>
          </div>
          <StatusNote status={HERO.status} dict={dict} className={hero.status} />
        </div>
        <HeroScene
          disc={
            <BounceStage
              dir={LOCALE_DIRECTION[locale]}
              labels={dict.stage}
              description={ARTWORK.homeHero.alt[locale]}
              screenClassName={hero.screen}
              controlsClassName={hero.controls}
            />
          }
          crescent={<Art name="characters" locale={locale} className={hero.crescentImg} sizes="(min-width: 64rem) 46vw, 100vw" priority />}
        />
      </div>
    </section>
  );
}
