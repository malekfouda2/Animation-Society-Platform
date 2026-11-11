import { isSectionKey, type AdminEntry } from "@as/contracts";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ContentEditor } from "@/components/admin/ContentEditor";
import { getDictionary } from "@/i18n";
import { resolveLocale } from "@/i18n/locale-params";
import { editorOptions, kindParam } from "@/lib/admin-content";
import { apiFromServer } from "@/lib/server-api";

type Params = Promise<{ locale: string; kinds: string }>;
type Search = Promise<{ key?: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { kinds } = await params;
  return { title: getDictionary(await resolveLocale(params)).admin.content.kinds[kindParam(kinds)].newTitle };
}

/** Pattern 3, Form: a new entry. Nothing is stored until "Save draft" or "Publish". */
export default async function NewContent({ params, searchParams }: { params: Params; searchParams: Search }) {
  const locale = await resolveLocale(params);
  const kind = kindParam((await params).kinds);
  const c = getDictionary(locale).admin.content;
  if (kind === "section") {
    // A section is written once, at its fixed key; an existing one is edited at its own address.
    const { key = "" } = await searchParams;
    if (!isSectionKey(key)) notFound();
    const res = await apiFromServer(`/admin/content/sections`);
    if (res.ok) {
      const { items } = (await res.json()) as { items: AdminEntry[] };
      const existing = items.find((i) => i.slug === key);
      if (existing) redirect(`/${locale}/admin/content/sections/${existing.id}`);
    }
    return <ContentEditor locale={locale} kind={kind} dict={c} initial={null} options={editorOptions(locale)} sectionKey={key} />;
  }
  return <ContentEditor locale={locale} kind={kind} dict={c} initial={null} options={editorOptions(locale)} />;
}
