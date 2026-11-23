import type { Locale } from "@as/contracts";
import type { MembershipDict } from "@/i18n/types";
import styles from "./membership.module.css";

/** Review history, newest first. Shared by the member's page and the staff detail page. */
export function History({ events, locale, dict, who }: { events: { at: string; action: keyof MembershipDict["actions"]; message: string | null }[]; locale: Locale; dict: MembershipDict; who?: readonly (string | null)[] }) {
  const fmt = new Intl.DateTimeFormat(locale === "ar" ? "ar-SA-u-nu-latn-ca-gregory" : "en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Riyadh" });
  return (
    <ol className={styles.timeline}>
      {[...events].reverse().map((e, i) => {
        const by = who?.[events.length - 1 - i] ?? null;
        return (
          <li key={`${e.at}-${String(i)}`} data-action={e.action}>
            <p className={styles.timelineHead}>
              <strong>{dict.actions[e.action]}</strong>
              <time dateTime={e.at}>{fmt.format(new Date(e.at))}</time>
              {by ? <span className={styles.timelineWho}>{by}</span> : null}
            </p>
            {e.message ? <p className={styles.timelineMessage} dir="auto">{e.message}</p> : null}
          </li>
        );
      })}
    </ol>
  );
}
