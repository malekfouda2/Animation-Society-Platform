import type { Metadata } from "next";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { SignOutButton } from "@/components/auth/AuthForms";
import { AppShell } from "@/components/shell/AppShell";
import { getDictionary } from "@/i18n";
import { resolveLocale } from "@/i18n/locale-params";
import { getSession, homeFor } from "@/lib/server-api";

// Private area: never indexed. The API authorises every request; this redirect only saves a trip.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function MemberLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: string }> }) {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);
  const user = await getSession();
  if (!user) redirect(`/${locale}/sign-in?next=${encodeURIComponent(`/${locale}/member`)}`);
  if (user.mfa === "enroll" || user.mfa === "verify") redirect(homeFor(locale, user));
  return (
    <AppShell
      locale={locale}
      dict={dict}
      title={dict.member.title}
      navLabel={dict.a11y.memberNav}
      items={[
        { label: dict.member.nav.account, href: `/${locale}/member` },
        ...(user.role === "member" ? [] : [{ label: dict.admin.title, href: `/${locale}/admin` }]),
      ]}
      account={
        <>
          <span>{dict.member.signedInAs}</span>
          <strong dir="ltr">{user.email}</strong>
          <SignOutButton locale={locale} label={dict.auth.signOut} busyLabel={dict.auth.signingOut} />
        </>
      }
    >
      {children}
    </AppShell>
  );
}
