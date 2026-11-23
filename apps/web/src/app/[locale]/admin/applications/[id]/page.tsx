import { API_BASE_PATH, adminApplicationSchema, ageOn } from "@as/contracts";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import content from "@/components/admin/content.module.css";
import { History } from "@/components/membership/History";
import { PlanPrice } from "@/components/membership/PlanPrice";
import { ReviewPanel } from "@/components/membership/ReviewPanel";
import styles from "@/components/membership/membership.module.css";
import shell from "@/components/shell/shell.module.css";
import { getDictionary } from "@/i18n";
import { resolveLocale } from "@/i18n/locale-params";
import { apiFromServer } from "@/lib/server-api";

type Params = Promise<{ locale: string; id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  return { title: getDictionary(await resolveLocale(params)).membership.admin.list.title };
}

/** Pattern 2, Detail: one application, its answers, its history and the decision. */
export default async function ApplicationDetail({ params }: { params: Params }) {
  const locale = await resolveLocale(params);
  const { id } = await params;
  const dict = getDictionary(locale);
  const m = dict.membership;
  const d = m.admin.detail;
  const res = await apiFromServer(`/admin/applications/${encodeURIComponent(id)}`);
  if (res.status === 404 || res.status === 400) notFound();
  if (res.status === 403) {
    return (
      <>
        <h1>{dict.admin.forbidden.title}</h1>
        <p className={shell.lead}>{dict.admin.forbidden.body}</p>
      </>
    );
  }
  if (!res.ok) throw new Error(`application unavailable (${res.status})`);
  const app = adminApplicationSchema.parse(await res.json());
  const fmt = new Intl.DateTimeFormat(locale === "ar" ? "ar-SA-u-nu-latn-ca-gregory" : "en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Riyadh" });
  const plan = app.plan ?? app.currentPlan;
  const who = app.history.map((e) => {
    const name = e.actorKind === "member" ? d.applicant : e.actorKind === "staff" ? e.actorEmail : d.server;
    return name ? `${d.by} ${name}` : null;
  });

  return (
    <>
      <div className={styles.detailHead}>
        <Link href={`/${locale}/admin/applications`} className={styles.crumb}>{d.back}</Link>
        <h1 dir="auto">{app.answers.fullName || m.admin.list.unnamed}</h1>
        <p className={styles.meta}>
          <span className={content.state} data-state={app.status === "approved" ? "published" : app.status === "submitted" ? "changed" : undefined}>{m.states[app.status]}</span>
          <span dir="ltr">{app.email}</span>
          {app.submittedAt ? <span>{d.submittedOn} <time dateTime={app.submittedAt}>{fmt.format(new Date(app.submittedAt))}</time></span> : <span>{d.createdOn} <time dateTime={app.createdAt}>{fmt.format(new Date(app.createdAt))}</time></span>}
        </p>
      </div>

      <div className={styles.detailGrid}>
        <div className={content.editor}>
          <section className={content.group} aria-labelledby="answers-title">
            <h2 id="answers-title" className={styles.groupTitle}>{d.answers}</h2>
            <dl className={styles.answers}>
              <div>
                <dt>{app.plan ? d.submittedPlan : d.draftPlan}</dt>
                <dd>
                  {plan ? <>{plan.name[locale]} <PlanPrice plan={plan} locale={locale} dict={m} /></> : d.noPlan}
                  {plan?.demo ? <span className={styles.demo}>{m.demo}</span> : null}
                </dd>
              </div>
              <div><dt>{m.apply.fullName}</dt><dd><bdi>{app.answers.fullName}</bdi></dd></div>
              {app.answers.fullNameEn ? <div><dt>{m.apply.fullNameEn}</dt><dd><bdi>{app.answers.fullNameEn}</bdi></dd></div> : null}
              <div><dt>{m.apply.phone}</dt><dd dir="ltr">{app.answers.phone}</dd></div>
              <div><dt>{m.apply.city}</dt><dd dir="auto">{app.answers.city}</dd></div>
              <div><dt>{m.apply.specialization}</dt><dd>{app.answers.specialization ? m.specializations[app.answers.specialization] : ""}</dd></div>
              <div><dt>{d.account}</dt><dd><span dir="auto">{app.accountName}</span> <span dir="ltr" className={styles.muted}>{app.email}</span></dd></div>
              {app.answers.birthDate ? (
                <div>
                  <dt>{d.birthDate}</dt>
                  <dd><span dir="ltr">{app.answers.birthDate}</span> · {d.age.replace("{n}", String(ageOn(app.answers.birthDate, new Date())))}</dd>
                </div>
              ) : null}
              {app.answers.memberSince ? <div><dt>{d.memberSince}</dt><dd dir="ltr">{app.answers.memberSince}</dd></div> : null}
              {(app.plan ?? app.currentPlan)?.rules.studentProof ? (
                <div>
                  <dt>{d.studentProof}</dt>
                  <dd>
                    {app.studentProof ? (
                      <a href={`${API_BASE_PATH}/media/${app.studentProof.id}`} target="_blank" rel="noopener" className={styles.photoFrame}>
                        {/* eslint-disable-next-line @next/next/no-img-element -- private, authorised image served by the API. */}
                        <img src={`${API_BASE_PATH}/media/${app.studentProof.id}`} alt={`${d.studentProof}: ${app.answers.fullName}`} width={app.studentProof.width || undefined} height={app.studentProof.height || undefined} />
                      </a>
                    ) : d.noProof}
                  </dd>
                </div>
              ) : null}
              <div>
                <dt>{d.photo}</dt>
                <dd>
                  {app.photo ? (
                    <span className={styles.photoFrame}>
                      {/* eslint-disable-next-line @next/next/no-img-element -- private, authorised image served by the API. */}
                      <img src={`${API_BASE_PATH}/media/${app.photo.id}`} alt={`${d.photo}: ${app.answers.fullName}`} width={app.photo.width || undefined} height={app.photo.height || undefined} />
                    </span>
                  ) : d.noPhoto}
                </dd>
              </div>
            </dl>
            <p className={styles.muted}>{d.checkNote}</p>
          </section>

          <section className={styles.history} aria-labelledby="history-title">
            <h2 id="history-title">{d.history}</h2>
            {app.history.length === 0 ? <p className={styles.muted}>{d.noHistory}</p> : <History events={app.history} locale={locale} dict={m} who={who} />}
          </section>
        </div>
        <ReviewPanel app={app} dict={m} />
      </div>
    </>
  );
}
