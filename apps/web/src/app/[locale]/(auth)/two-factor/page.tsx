import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { MfaVerifyForm } from "@/components/auth/AuthForms";
import { Sheet } from "@/components/auth/Sheet";
import { getDictionary } from "@/i18n";
import { resolveLocale } from "@/i18n/locale-params";
import { getSession, homeFor, safeNext } from "@/lib/server-api";

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: getDictionary(await resolveLocale(params)).auth.mfa.verifyTitle };
}

export default async function TwoFactorPage({ params, searchParams }: Props) {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale).auth;
  const user = await getSession();
  if (!user) redirect(`/${locale}/sign-in`);
  if (user.mfa !== "verify") redirect(homeFor(locale, user));
  const next = safeNext(locale, (await searchParams)["next"]) ?? `/${locale}/admin`;
  return (
    <Sheet title={dict.mfa.verifyTitle} lead={dict.mfa.verifyLead}>
      <MfaVerifyForm locale={locale} dict={dict} next={next} />
    </Sheet>
  );
}
