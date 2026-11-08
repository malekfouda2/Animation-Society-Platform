import type { Locale } from "@as/contracts";
import { MEMBERSHIP_TYPES } from "@/content/membership";
import styles from "./sections.module.css";

interface Props {
  locale: Locale;
  grantedLabel: string;
  /** Detailed shows who/rights; compact shows who only. */
  detailed?: { who: string; rights: string };
}

export function MembershipTypes({ locale, grantedLabel, detailed }: Props) {
  return (
    <dl className={styles.types}>
      {MEMBERSHIP_TYPES.map((t, i) => (
        <div key={t.key} className={styles.type} data-reveal="" style={{ ["--reveal-i" as string]: i }}>
          <dt className={styles.typeName}>
            {t.name[locale]}
            {t.granted ? <span className={styles.typeGranted}>{grantedLabel}</span> : null}
          </dt>
          {detailed ? (
            <>
              <dd className={styles.typeLabel}>{detailed.who}</dd>
              <dd className={styles.typeText}>{t.who[locale]}</dd>
              <dd className={styles.typeLabel}>{detailed.rights}</dd>
              <dd className={styles.typeText}>{t.rights[locale]}</dd>
            </>
          ) : (
            <dd className={styles.typeText}>{t.who[locale]}</dd>
          )}
        </div>
      ))}
    </dl>
  );
}
