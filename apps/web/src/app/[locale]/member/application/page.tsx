import { memberApplicationResponseSchema } from "@as/contracts";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ApplicationForm } from "@/components/membership/ApplicationForm";
import shell from "@/components/shell/shell.module.css";
import { getDictionary } from "@/i18n";
import { resolveLocale } from "@/i18n/locale-params";
import { apiFromServer } from "@/lib/server-api";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  return { title: getDictionary(await resolveLocale(params)).membership.apply.title };
}

/** Pattern 3, Form (page): the member's one application, with its status and history. */
export default async function ApplicationPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);
  const res = await apiFromServer("/account/application");
  if (res.status === 401) redirect(`/${locale}/sign-in?next=${encodeURIComponent(`/${locale}/member/application`)}`);
  if (res.status === 403) {
    // Staff accounts don't apply for membership.
    return (
      <>
        <h1>{dict.membership.apply.title}</h1>
        <p className={shell.lead}>{dict.membership.errors.forbidden}</p>
      </>
    );
  }
  if (!res.ok) throw new Error(`application unavailable (${res.status})`);
  const { application, plans } = memberApplicationResponseSchema.parse(await res.json());
  return (
    <>
      <h1>{dict.membership.apply.title}</h1>
      <p className={shell.lead}>{dict.membership.apply.lead}</p>
      <ApplicationForm locale={locale} dict={dict.membership} initial={application} plans={plans} />
    </>
  );
}
