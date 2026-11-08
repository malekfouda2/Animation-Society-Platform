import type { Locale } from "@as/contracts";
import { MEMBERSHIP_TYPES } from "@/content/membership";
import { SOCIETY } from "@/content/society";
import styles from "./sections.module.css";

/**
 * Home: the four membership types as a hand of membership cards laid on the table. Each card lifts
 * and straightens on hover. Card colours are the guideline primaries with black
 * ink (contrast ≥5.3:1). Decorative ring pattern only; all meaning is in the text.
 */
export function MembershipDeck({ locale, grantedLabel }: { locale: Locale; grantedLabel: string }) {
  return (
    <ul className={styles.deck}>
      {MEMBERSHIP_TYPES.map((t, i) => (
        <li key={t.key} className={styles.card} data-type={t.key} style={{ ["--k" as string]: i, ["--enter-i" as string]: i, ["--deal-r" as string]: `${(i - 1.5) * 14}deg` }} data-enter="deal">
          <span className={styles.cardSociety}>{SOCIETY.name[locale]}</span>
          <span className={styles.cardName}>{t.name[locale]}</span>
          <span className={styles.cardWho}>{t.who[locale]}</span>
          {t.granted ? <span className={styles.cardGranted}>{grantedLabel}</span> : null}
        </li>
      ))}
    </ul>
  );
}
