import type { Metadata } from "next";
import { ResetForm } from "@/components/auth/AuthForms";
import { Sheet } from "@/components/auth/Sheet";
import { getDictionary } from "@/i18n";
import { resolveLocale } from "@/i18n/locale-params";

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: getDictionary(await resolveLocale(params)).auth.reset.title };
}

/** Forgot-password reset, and the first password for invited staff (?invite=1). */
export default async function ResetPasswordPage({ params, searchParams }: Props) {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale).auth;
  const query = await searchParams;
  const invite = query["invite"] === "1";
  const token = typeof query["token"] === "string" ? query["token"] : undefined;
  return (
    <Sheet title={invite ? dict.reset.inviteTitle : dict.reset.title} lead={invite ? dict.reset.inviteLead : dict.reset.lead}>
      <ResetForm locale={locale} dict={dict} token={token} />
    </Sheet>
  );
}
