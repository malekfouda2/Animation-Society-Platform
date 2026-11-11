import type { Metadata } from "next";
import { ForgotForm } from "@/components/auth/AuthForms";
import { Sheet } from "@/components/auth/Sheet";
import { getDictionary } from "@/i18n";
import { resolveLocale } from "@/i18n/locale-params";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: getDictionary(await resolveLocale(params)).auth.forgot.title };
}

export default async function ForgotPasswordPage({ params }: Props) {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale).auth;
  return (
    <Sheet title={dict.forgot.title} lead={dict.forgot.lead}>
      <ForgotForm locale={locale} dict={dict} />
    </Sheet>
  );
}
