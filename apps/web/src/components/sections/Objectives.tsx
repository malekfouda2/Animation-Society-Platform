import type { Locale } from "@as/contracts";
import { BrandIcon } from "@/components/ui/BrandIcon";
import { OBJECTIVES } from "@/content/society";
import styles from "./sections.module.css";

/** The five objectives as an editorial list; each row sweeps a brand gradient on hover/focus. */
export function Objectives({ locale, headingLevel = "h3" }: { locale: Locale; headingLevel?: "h3" | "h4" }) {
  const Heading = headingLevel;
  return (
    <ul className={styles.objectives}>
      {OBJECTIVES.map((o, i) => (
        <li key={o.key} className={styles.objective} data-reveal="" style={{ ["--reveal-i" as string]: i }}>
          <BrandIcon name={o.icon} size={72} className={styles.objectiveIcon} />
          <div>
            <Heading className={styles.objectiveTitle}>{o.title[locale]}</Heading>
            <p className={styles.objectiveBody}>{o.body[locale]}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
