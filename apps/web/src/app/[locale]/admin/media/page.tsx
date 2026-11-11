import type { Metadata } from "next";
import styles from "@/components/admin/content.module.css";
import { MediaManager } from "@/components/admin/MediaLibrary";
import shell from "@/components/shell/shell.module.css";
import { getDictionary } from "@/i18n";
import { resolveLocale } from "@/i18n/locale-params";

type Params = Promise<{ locale: string }>;
type Search = Promise<{ filter?: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  return { title: getDictionary(await resolveLocale(params)).admin.content.library.title };
}

/** Pattern 1, List: every upload, where it's used, and clean-up of unused ones. The API checks access. */
export default async function MediaPage({ params, searchParams }: { params: Params; searchParams: Search }) {
  const locale = await resolveLocale(params);
  const { filter } = await searchParams;
  const c = getDictionary(locale).admin.content;
  return (
    <>
      <div className={styles.head}>
        <div>
          <h1>{c.library.title}</h1>
          <p className={shell.lead}>{c.library.lead}</p>
        </div>
      </div>
      <MediaManager key={filter} dict={c} locale={locale} filter={filter === "unused" ? "unused" : "all"} />
    </>
  );
}
