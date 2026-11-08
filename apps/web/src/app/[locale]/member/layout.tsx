import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { getDictionary } from "@/i18n";
import { resolveLocale } from "@/i18n/locale-params";

// Private area: never indexed. Access control is enforced by the API (Stage 2), not by this layout.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function MemberLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);
  return (
    <AppShell
      locale={locale}
      dict={dict}
      title={dict.member.title}
      navLabel={dict.a11y.memberNav}
      items={[{ label: dict.member.title, current: true }]}
    >
      {children}
    </AppShell>
  );
}
