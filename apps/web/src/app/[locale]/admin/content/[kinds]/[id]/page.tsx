import { CONTENT_PATHS, type AdminEntry } from "@as/contracts";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ContentEditor } from "@/components/admin/ContentEditor";
import shell from "@/components/shell/shell.module.css";
import { getDictionary } from "@/i18n";
import { resolveLocale } from "@/i18n/locale-params";
import { editorOptions, kindParam } from "@/lib/admin-content";
import { apiFromServer } from "@/lib/server-api";

type Params = Promise<{ locale: string; kinds: string; id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { kinds } = await params;
  return { title: getDictionary(await resolveLocale(params)).admin.content.kinds[kindParam(kinds)].editTitle };
}

/** Pattern 3, Form: edit one entry (loaded fresh from the API; never cached). */
export default async function EditContent({ params }: { params: Params }) {
  const locale = await resolveLocale(params);
  const { kinds, id } = await params;
  const kind = kindParam(kinds);
  const dict = getDictionary(locale);
  const c = dict.admin.content;
  const res = await apiFromServer(`/admin/content/${CONTENT_PATHS[kind]}/${encodeURIComponent(id)}`);
  if (res.status === 404) notFound();
  if (res.status === 403) {
    return (
      <>
        <h1>{dict.admin.forbidden.title}</h1>
        <p className={shell.lead}>{dict.admin.forbidden.body}</p>
      </>
    );
  }
  if (!res.ok) throw new Error(`content entry unavailable (${res.status})`);
  const entry = (await res.json()) as AdminEntry;
  return <ContentEditor key={entry.id} locale={locale} kind={kind} dict={c} initial={entry} options={editorOptions(locale)} />;
}
