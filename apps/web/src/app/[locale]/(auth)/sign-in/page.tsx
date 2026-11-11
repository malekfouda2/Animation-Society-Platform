import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SignInForm } from "@/components/auth/AuthForms";
import { Sheet } from "@/components/auth/Sheet";
import { getDictionary } from "@/i18n";
import { resolveLocale } from "@/i18n/locale-params";
import { getSession, homeFor, safeNext } from "@/lib/server-api";

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: getDictionary(await resolveLocale(params)).auth.signIn.title };
}

export default async function SignInPage({ params, searchParams }: Props) {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale).auth;
  const next = safeNext(locale, (await searchParams)["next"]);
  const user = await getSession();
  if (user) redirect(user.mfa === "enroll" || user.mfa === "verify" ? homeFor(locale, user) : next ?? homeFor(locale, user));
  return (
    <Sheet title={dict.signIn.title} lead={dict.signIn.lead}>
      <SignInForm locale={locale} dict={dict} next={next} />
    </Sheet>
  );
}
