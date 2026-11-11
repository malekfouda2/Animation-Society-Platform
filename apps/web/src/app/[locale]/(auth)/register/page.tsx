import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/auth/AuthForms";
import { Sheet } from "@/components/auth/Sheet";
import { getDictionary } from "@/i18n";
import { resolveLocale } from "@/i18n/locale-params";
import { getSession, homeFor } from "@/lib/server-api";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: getDictionary(await resolveLocale(params)).auth.register.title };
}

export default async function RegisterPage({ params }: Props) {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale).auth;
  const user = await getSession();
  if (user) redirect(homeFor(locale, user));
  return (
    <Sheet title={dict.register.title} lead={dict.register.lead}>
      <RegisterForm locale={locale} dict={dict} />
    </Sheet>
  );
}
