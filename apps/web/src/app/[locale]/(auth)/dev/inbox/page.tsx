import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import styles from "@/components/auth/auth.module.css";
import { Sheet } from "@/components/auth/Sheet";
import { getDictionary } from "@/i18n";
import { resolveLocale } from "@/i18n/locale-params";
import { apiFromServer } from "@/lib/server-api";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: getDictionary(await resolveLocale(params)).devInbox.title };
}

const inboxSchema = z.object({
  emails: z.array(z.object({ id: z.string(), to: z.string(), locale: z.string(), subject: z.string(), text: z.string().nullable(), createdAt: z.string() })),
});

/** Splits text into plain runs and same-origin links (the only links these emails contain). */
function linkify(text: string, origin: string) {
  return text.split(/(https?:\/\/\S+)/g).map((part, i) =>
    part.startsWith(origin) ? (
      // eslint-disable-next-line @eslint-react/no-array-index-key -- static split of one string
      <a key={i} href={part}>{part}</a>
    ) : (
      part
    ),
  );
}

/**
 * Development-only local inbox. The API route exists only with EMAIL_MODE=mock outside production,
 * so in any other environment this page is a 404.
 */
export default async function DevInboxPage({ params }: Props) {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale).devInbox;
  const res = await apiFromServer("/dev/inbox");
  if (res.status === 404) notFound();
  if (!res.ok) throw new Error(`inbox unavailable (${res.status})`);
  const { emails } = inboxSchema.parse(await res.json());
  const origin = process.env["PUBLIC_ORIGIN"] ?? "";
  return (
    <Sheet title={dict.title} lead={dict.lead} wide>
      {emails.length === 0 ? <p>{dict.empty}</p> : (
        <ol className={styles.mails}>
          {emails.map((e) => (
            <li key={e.id} className={styles.mail} lang={e.locale} dir={e.locale === "ar" ? "rtl" : "ltr"}>
              <p className={styles.mailHead}><span dir="ltr">{e.to}</span><time dateTime={e.createdAt} dir="ltr">{e.createdAt.replace("T", " ").slice(0, 19)}</time></p>
              <h2 className={styles.mailSubject}>{e.subject}</h2>
              <pre className={styles.mailBody}>{e.text ? linkify(e.text, origin) : ""}</pre>
            </li>
          ))}
        </ol>
      )}
    </Sheet>
  );
}
