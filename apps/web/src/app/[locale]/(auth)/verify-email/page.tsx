import type { Metadata } from "next";
import { VerifyEmail } from "@/components/auth/AuthForms";
import { Sheet } from "@/components/auth/Sheet";
import { getDictionary } from "@/i18n";
import { resolveLocale } from "@/i18n/locale-params";

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: getDictionary(await resolveLocale(params)).auth.verify.title };
}

export default async function VerifyEmailPage({ params, searchParams }: Props) {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale).auth;
  const token = (await searchParams)["token"];
  return (
    <Sheet title={dict.verify.title}>
      <VerifyEmail locale={locale} dict={dict} token={typeof token === "string" ? token : undefined} />
    </Sheet>
  );
}
