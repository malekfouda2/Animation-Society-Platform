import type { Metadata } from "next";
import { z } from "zod";
import styles from "@/components/shell/shell.module.css";
import { getDictionary } from "@/i18n";
import { resolveLocale } from "@/i18n/locale-params";
import { apiFromServer } from "@/lib/server-api";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  return { title: getDictionary(await resolveLocale(params)).admin.audit.title };
}

const auditSchema = z.object({
  events: z.array(z.object({
    id: z.string(),
    at: z.string(),
    actorId: z.string().nullable(),
    actorEmail: z.string().nullable(),
    actorKind: z.enum(["user", "cli", "system"]),
    action: z.string(),
    targetId: z.string(),
    targetEmail: z.string().nullable(),
    targetLabel: z.string().nullable(),
  })),
});

/** Administrators only: the API refuses editors, and so does this page. */
export default async function AuditPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);
  const a = dict.admin.audit;
  const res = await apiFromServer("/admin/audit");
  if (res.status === 403) {
    return (
      <>
        <h1>{dict.admin.forbidden.title}</h1>
        <p className={styles.lead}>{dict.admin.forbidden.body}</p>
      </>
    );
  }
  if (!res.ok) throw new Error(`audit log unavailable (${res.status})`);
  const { events } = auditSchema.parse(await res.json());
  const fmt = new Intl.DateTimeFormat(locale === "ar" ? "ar-SA-u-nu-latn-ca-gregory" : "en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Riyadh" });
  return (
    <>
      <h1>{a.title}</h1>
      <p className={styles.lead}>{a.lead}</p>
      {events.length === 0 ? <p>{a.empty}</p> : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr><th scope="col">{a.when}</th><th scope="col">{a.action}</th><th scope="col">{a.actor}</th><th scope="col">{a.target}</th></tr>
            </thead>
            <tbody>
              {events.map((e) => (
                <tr key={e.id}>
                  <td><time dateTime={e.at}>{fmt.format(new Date(e.at))}</time></td>
                  <td>{a.actions[e.action] ?? <code dir="ltr">{e.action}</code>}</td>
                  <td>{e.actorKind === "cli" ? a.cli : e.actorKind === "system" ? a.system : <span dir="ltr">{e.actorEmail ?? e.actorId}</span>}</td>
                  <td>{e.targetLabel ? <span dir="auto">{e.targetLabel}</span> : <span dir="ltr">{e.targetEmail ?? e.targetId}</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
