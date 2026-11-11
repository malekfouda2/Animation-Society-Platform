import type { ReactNode } from "react";
import styles from "./auth.module.css";

/** One sheet of animation paper on its peg bar: the frame for every account screen. */
export function Sheet({ title, lead, wide, children }: { title: string; lead?: string; wide?: boolean; children: ReactNode }) {
  return (
    <section className={wide ? `${styles.sheet} ${styles.sheetWide}` : styles.sheet} aria-labelledby="sheet-title">
      <span className={styles.pegbar} aria-hidden="true"><i /><i /><i /></span>
      <h1 id="sheet-title" className={styles.title}>{title}</h1>
      {lead ? <p className={styles.lead}>{lead}</p> : null}
      {children}
    </section>
  );
}
