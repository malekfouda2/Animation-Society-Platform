"use client";

import { isLocale } from "@as/contracts";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ar } from "@/i18n/dictionaries/ar";
import { en } from "@/i18n/dictionaries/en";
import styles from "./not-found.module.css";

/** The bouncing ball on a strip of frames: five drawings, and the one this page should be is missing. */
const FRAMES = [
  { y: 18, squash: false },
  { y: 52, squash: false },
  { y: 84, squash: true },
  { y: 52, squash: false },
  { y: 18, squash: false },
];
const MISSING = 2;

export default function NotFound() {
  const params = useParams<{ locale?: string }>();
  const locale = isLocale(params.locale) ? params.locale : "ar";
  const dict = locale === "ar" ? ar : en;
  return (
    <div className={`world ${styles.page}`}>
      <main id="main" className={`container ${styles.main}`}>
        <ol className={styles.strip} aria-hidden="true">
          {FRAMES.map((f, i) => (
            // eslint-disable-next-line @eslint-react/no-array-index-key -- fixed frames; position is the identity
            <li key={i} className={styles.frame} data-missing={i === MISSING || undefined}>
              {i === MISSING ? null : <span className={styles.ball} data-squash={f.squash || undefined} style={{ ["--y" as string]: `${f.y}%` }} />}
            </li>
          ))}
        </ol>
        <h1 className={styles.title}>{dict.notFound.title}</h1>
        <p className={styles.body}>{dict.notFound.body}</p>
        <Link href={`/${locale}`} className="btn btn-primary">{dict.notFound.home}</Link>
      </main>
    </div>
  );
}
