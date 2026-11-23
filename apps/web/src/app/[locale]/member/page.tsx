import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PasswordForm, ProfileForm } from "@/components/auth/AccountForms";
import styles from "@/components/shell/shell.module.css";
import { getDictionary } from "@/i18n";
import { resolveLocale } from "@/i18n/locale-params";
import { memberApplicationResponseSchema } from "@as/contracts";
import Link from "next/link";
import ms from "@/components/membership/membership.module.css";
import { apiFromServer, getSession } from "@/lib/server-api";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  return { title: getDictionary(await resolveLocale(params)).member.title };
}

export default async function MemberHome({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);
  const user = await getSession();
  if (!user) redirect(`/${locale}/sign-in`);
  let application = null;
  if (user.role === "member") {
    const res = await apiFromServer("/account/application");
    if (res.ok) application = memberApplicationResponseSchema.parse(await res.json()).application;
  }
  const m = dict.membership;
  return (
    <>
      <h1>{user.name}</h1>
      <p className={styles.lead}>{dict.member.comingNext}</p>
      {user.role === "member" ? (
        <section className={styles.panel} aria-labelledby="application-title">
          <h2 id="application-title">{dict.member.status.title}</h2>
          <div className={ms.memberCard}>
            {application ? (
              <>
                <p className={ms.statusTitle}>{m.apply.status[application.status].title}</p>
                <p>{m.apply.status[application.status].body}</p>
                <Link href={`/${locale}/member/application`} className="btn btn-primary">{dict.member.status.open}</Link>
              </>
            ) : (
              <>
                <p>{dict.member.status.none}</p>
                <Link href={`/${locale}/member/application`} className="btn btn-primary">{dict.member.status.start}</Link>
              </>
            )}
          </div>
        </section>
      ) : null}
      <section className={styles.panel} aria-labelledby="profile-title">
        <h2 id="profile-title">{dict.member.profile.title}</h2>
        <ProfileForm user={user} dict={dict.auth} labels={dict.member.profile} />
      </section>
      <section className={styles.panel} aria-labelledby="password-title">
        <h2 id="password-title">{dict.member.password.title}</h2>
        <p className={styles.lead}>{dict.member.password.lead}</p>
        <PasswordForm dict={dict.auth} labels={dict.member.password} />
      </section>
    </>
  );
}
