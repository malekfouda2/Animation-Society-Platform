import type { Locale, MediaRef } from "@as/contracts";
import { MediaImage } from "@/components/ui/MediaImage";
import type { Localized } from "@/content/types";
import styles from "./board.module.css";

/** Board of Directors as a cast list: portrait (when supplied), name and role. */
export function BoardList({ members, locale, compact }: { members: readonly { name: Localized; role: Localized; portrait: MediaRef }[]; locale: Locale; compact?: boolean }) {
  return (
    <ul className={`${styles.list}${compact ? ` ${styles.compact}` : ""}`}>
      {members.map((m) => (
        <li key={`${m.name.en}-${m.role.en}`} className={styles.member}>
          {m.portrait.id ? (
            <MediaImage media={m.portrait} locale={locale} className={styles.portrait} sizes="96px" />
          ) : (
            <span className={styles.initial} aria-hidden="true">{m.name[locale].trim().charAt(0)}</span>
          )}
          <span className={styles.name}>{m.name[locale]}</span>
          <span className={styles.role}>{m.role[locale]}</span>
        </li>
      ))}
    </ul>
  );
}
