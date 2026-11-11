import type { Metadata } from "next";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { SignOutButton } from "@/components/auth/AuthForms";
import { AppShell } from "@/components/shell/AppShell";
import styles from "@/components/shell/shell.module.css";
import { getDictionary } from "@/i18n";
import { resolveLocale } from "@/i18n/locale-params";
import { getSession, homeFor } from "@/lib/server-api";

// Private area: never indexed. Every admin API route checks role and the second factor itself.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AdminLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: string }> }) {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);
  const user = await getSession();
  if (!user) redirect(`/${locale}/sign-in?next=${encodeURIComponent(`/${locale}/admin`)}`);
  if (user.mfa === "enroll" || user.mfa === "verify") redirect(homeFor(locale, user));
  const staff = user.role !== "member";
  const items = staff
    ? [
        { label: dict.admin.nav.overview, href: `/${locale}/admin` },
        { label: dict.admin.nav.posts, href: `/${locale}/admin/content/posts`, section: true },
        { label: dict.admin.nav.projects, href: `/${locale}/admin/content/projects`, section: true },
        { label: dict.admin.nav.partners, href: `/${locale}/admin/content/partners`, section: true },
        { label: dict.admin.nav.sections, href: `/${locale}/admin/content/sections`, section: true },
        { label: dict.admin.nav.media, href: `/${locale}/admin/media` },
        { label: dict.admin.nav.security, href: `/${locale}/admin/security` },
        ...(user.role === "admin" ? [{ label: dict.admin.nav.audit, href: `/${locale}/admin/audit` }] : []),
      ]
    : [{ label: dict.member.nav.account, href: `/${locale}/member` }];
  return (
    <AppShell
      locale={locale}
      dict={dict}
      title={dict.admin.title}
      navLabel={dict.a11y.adminNav}
      items={items}
      account={
        <>
          <span>{dict.admin.roles[user.role]}</span>
          <strong dir="ltr">{user.email}</strong>
          <SignOutButton locale={locale} label={dict.auth.signOut} busyLabel={dict.auth.signingOut} />
        </>
      }
    >
      {staff ? children : (
        <>
          <h1>{dict.admin.forbidden.title}</h1>
          <p className={styles.lead}>{dict.admin.forbidden.body}</p>
        </>
      )}
    </AppShell>
  );
}
