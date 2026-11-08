import type { Locale } from "@as/contracts";
import type { ReactNode } from "react";
import { Balls, Blob, Contours, Planet } from "@/components/art/Shapes";
import { Art } from "@/components/ui/Art";
import type { ArtworkKey } from "@/config/artwork";
import styles from "./page.module.css";

interface Props {
  locale: Locale;
  title: string;
  lead: string;
  /** Which brand light the page opens with. */
  tone?: "green" | "mist" | "cream";
  art?: ArtworkKey;
  children?: ReactNode;
}

/** Inner-page opening: a title in front of floating brand shapes and one Drive visual element. */
export function PageHero({ locale, title, lead, tone = "mist", art, children }: Props) {
  return (
    <section className={`${styles.hero} ${styles[tone]}`} aria-labelledby="page-title">
      <div className={styles.heroLayers} aria-hidden="true">
        <Contours className={styles.heroRings} rings={9} tone={tone === "cream" ? "warm" : "green"} speed={0.12} depth={12} />
        {tone === "cream" ? (
          <Planet className={styles.heroShape} speed={0.3} depth={28} />
        ) : (
          <Blob className={styles.heroShape} variant={tone === "green" ? 0 : 2} speed={0.3} depth={28} />
        )}
        <Balls className={styles.heroBalls} warm={tone !== "green"} speed={0.5} depth={50} />
        {art ? <Art name={art} locale={locale} className={styles.heroArt} sizes="(min-width: 64rem) 40vw, 80vw" priority speed={0.18} /> : null}
      </div>
      <div className="container">
        <h1 id="page-title" className={styles.title}>{title}</h1>
        <p className={styles.lead}>{lead}</p>
        {children}
      </div>
    </section>
  );
}
