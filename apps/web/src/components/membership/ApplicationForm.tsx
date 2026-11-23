"use client";

import {
  API_BASE_PATH,
  EDITABLE_STATES,
  EMPTY_ANSWERS,
  MEDIA_MAX_BYTES,
  MEDIA_TYPES,
  SPECIALIZATIONS,
  formatPrice,
  memberApplicationSchema,
  submitIssues,
  type ApplicationAnswers,
  type Locale,
  type MemberApplication,
  type PublicPlan,
} from "@as/contracts";
import Link from "next/link";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import type { MembershipDict } from "@/i18n/types";
import { callApi, type ApiResult } from "@/lib/client-api";
import content from "@/components/admin/content.module.css";
import { History } from "./History";
import { PlanPrice } from "./PlanPrice";
import styles from "./membership.module.css";

type ErrorKey = keyof MembershipDict["errors"];
type Fields = Partial<Record<string, ErrorKey>>;

const asKey = (dict: MembershipDict, k: string | undefined): ErrorKey => (k && k in dict.errors ? (k as ErrorKey) : "failed");

function failureMessage(res: Extract<ApiResult<unknown>, { ok: false }>): ErrorKey {
  if (res.code === "network") return "network";
  if (res.code === "conflict") return "conflict";
  if (res.code === "rate_limited") return "rate_limited";
  if (res.code === "unauthenticated") return "session_ended";
  if (res.code === "forbidden") return "forbidden";
  return "failed";
}

/** Which step of the sequence the application is at (fill in, review, decision, payment). */
function stepOf(status: MemberApplication["status"] | null): number {
  if (!status || status === "draft" || status === "needs_changes") return 0;
  if (status === "submitted") return 1;
  return status === "approved" ? 3 : 2;
}

export function Steps({ dict, status }: { dict: MembershipDict; status: MemberApplication["status"] | null }) {
  const current = stepOf(status);
  return (
    <ol className={styles.steps} aria-label={dict.apply.stepsLabel}>
      {dict.apply.steps.map((label, i) => (
        <li key={label} data-state={i < current ? "done" : i === current ? "current" : "next"} aria-current={i === current ? "step" : undefined}>
          <span className={styles.stepMark} aria-hidden="true">{i + 1}</span>
          <span>{label}</span>
        </li>
      ))}
    </ol>
  );
}

function Field({ label, hint, error, dict, children, id, optional }: { label: string; hint?: string; error?: ErrorKey | undefined; dict: MembershipDict; children: ReactNode; id: string; optional?: boolean }) {
  return (
    <div className={content.field}>
      <label htmlFor={id} className={content.label}>
        {label}
        {optional ? <span className={styles.optional}> {dict.optional}</span> : null}
      </label>
      {children}
      <p id={`${id}-msg`} className={error ? content.error : content.hint} aria-live="polite">
        {error ? dict.errors[error] : hint ?? ""}
      </p>
    </div>
  );
}

export function ApplicationForm({ locale, dict, initial, plans }: { locale: Locale; dict: MembershipDict; initial: MemberApplication | null; plans: PublicPlan[] }) {
  const a = dict.apply;
  const [app, setApp] = useState<MemberApplication | null>(initial);
  const [planId, setPlanId] = useState(initial?.planId ?? "");
  const [answers, setAnswers] = useState<ApplicationAnswers>(initial?.answers ?? EMPTY_ANSWERS);
  const [photo, setPhoto] = useState(initial?.photo ?? null);
  const [proof, setProof] = useState(initial?.studentProof ?? null);
  // Latest allowed values for the date fields (today, this month), fixed when the form opens.
  const [today] = useState(() => new Date().toISOString().slice(0, 10));
  const [errors, setErrors] = useState<Fields>({});
  const [busy, setBusy] = useState<"save" | "submit" | "reapply" | "photoId" | "studentProofId" | null>(null);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [dirty, setDirty] = useState(false);
  const statusRef = useRef<HTMLDivElement>(null);
  const nameId = useId();
  const nameEnId = useId();
  const phoneId = useId();
  const cityId = useId();
  const specId = useId();
  const photoId = useId();
  const birthId = useId();
  const proofId = useId();
  const sinceId = useId();
  const ids = { name: nameId, nameEn: nameEnId, phone: phoneId, city: cityId, spec: specId, photo: photoId, birth: birthId, proof: proofId, since: sinceId };

  const editable = !app || EDITABLE_STATES.includes(app.status);
  const status = app?.status ?? null;

  // Warn before leaving with unsaved answers.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => { window.removeEventListener("beforeunload", warn); };
  }, [dirty]);

  function set<K extends keyof ApplicationAnswers>(key: K, value: ApplicationAnswers[K]) {
    setAnswers((s) => ({ ...s, [key]: value }));
    setDirty(true);
    setMessage(null);
    if (errors[`answers.${key}`]) setErrors((e) => ({ ...e, [`answers.${key}`]: undefined }));
  }

  function showFields(fields: Record<string, string[]>) {
    const next: Fields = {};
    for (const [k, v] of Object.entries(fields)) next[k] = asKey(dict, v[0]);
    setErrors(next);
    // Focus the first problem in form order.
    const order = ["planId", "answers.fullName", "answers.fullNameEn", "answers.phone", "answers.city", "answers.specialization", "answers.birthDate", "answers.memberSince", "answers.photoId", "answers.studentProofId"];
    const first = order.find((k) => next[k]);
    if (first) document.querySelector<HTMLElement>(`[data-field="${first}"]`)?.focus();
  }

  async function save(): Promise<MemberApplication | null> {
    const res = await callApi("PUT", "/account/application", { version: app?.version ?? -1, planId, answers });
    if (!res.ok) {
      if (Object.keys(res.fields).length > 0) showFields(res.fields);
      setMessage({ tone: "error", text: dict.errors[res.code === "conflict" && app && !EDITABLE_STATES.includes(app.status) ? "locked" : failureMessage(res)] });
      return null;
    }
    const saved = memberApplicationSchema.parse(res.data);
    setApp(saved);
    setDirty(false);
    return saved;
  }

  async function onSave() {
    setBusy("save");
    setMessage(null);
    const saved = await save();
    setBusy(null);
    if (saved) setMessage({ tone: "ok", text: a.saved });
  }

  async function onSubmit() {
    setMessage(null);
    const issues = submitIssues(planId, answers, plans.find((p) => p.id === planId)?.rules ?? null);
    if (Object.keys(issues).length > 0) {
      showFields(issues);
      return;
    }
    setBusy("submit");
    const saved = dirty || !app ? await save() : app;
    if (!saved) { setBusy(null); return; }
    const res = await callApi("POST", "/account/application/submit", { version: saved.version });
    setBusy(null);
    if (!res.ok) {
      if (Object.keys(res.fields).length > 0) showFields(res.fields);
      setMessage({ tone: "error", text: dict.errors[failureMessage(res)] });
      return;
    }
    const submitted = memberApplicationSchema.parse(res.data);
    setApp(submitted);
    setAnswers(submitted.answers);
    setDirty(false);
    statusRef.current?.focus();
  }

  /** Reopens a rejected application as a draft; the server enforces the waiting period. */
  async function onReapply() {
    if (!app) return;
    setBusy("reapply");
    setMessage(null);
    const res = await callApi("POST", "/account/application/reapply", { version: app.version });
    setBusy(null);
    if (!res.ok) {
      setMessage({ tone: "error", text: dict.errors[failureMessage(res)] });
      return;
    }
    const reopened = memberApplicationSchema.parse(res.data);
    setApp(reopened);
    setPlanId(plans.some((p) => p.id === reopened.planId) ? reopened.planId : "");
    setAnswers(reopened.answers);
    statusRef.current?.focus();
  }

  /** Uploads a private image (the card photo, or the proof of study) for this application. */
  async function onUpload(field: "photoId" | "studentProofId", file: File) {
    const key = `answers.${field}`;
    const show = field === "photoId" ? setPhoto : setProof;
    setMessage(null);
    setErrors((e) => ({ ...e, [key]: undefined }));
    if (!(MEDIA_TYPES as readonly string[]).includes(file.type)) { setErrors((e) => ({ ...e, [key]: "media_type" })); return; }
    if (file.size > MEDIA_MAX_BYTES) { setErrors((e) => ({ ...e, [key]: "media_too_large" })); return; }
    setBusy(field);
    try {
      const res = await fetch(`${API_BASE_PATH}/account/photo`, { method: "POST", credentials: "same-origin", headers: { "Content-Type": file.type }, body: file });
      const json = (await res.json().catch(() => null)) as { id?: string; width?: number; height?: number; error?: { fields?: Record<string, string[]> } } | null;
      if (res.ok && json?.id) {
        show({ id: json.id, width: json.width ?? 0, height: json.height ?? 0 });
        set(field, json.id);
      } else {
        setErrors((e) => ({ ...e, [key]: asKey(dict, json?.error?.fields?.["file"]?.[0] ?? (res.status === 429 ? "rate_limited" : "failed")) }));
      }
    } catch {
      setErrors((e) => ({ ...e, [key]: "network" }));
    }
    setBusy(null);
  }

  const err = (k: string) => errors[k];
  const describe = (id: string) => ({ "aria-describedby": `${id}-msg` });
  const chosen = plans.find((p) => p.id === planId) ?? null;
  const rules = chosen?.rules ?? null;
  const upload = (field: "photoId" | "studentProofId", image: { id: string; width: number; height: number } | null, id: string, label: string, hint: string, alt: string) => (
    <div className={content.media}>
      <span className={content.label} id={`${id}-label`}>{label}</span>
      <div className={content.mediaRow}>
        <div className={styles.photoFrame}>
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element -- private, authorised image served by the API; not for the image optimiser.
            <img src={`${API_BASE_PATH}/media/${image.id}`} alt={alt} width={image.width || undefined} height={image.height || undefined} />
          ) : <span>{a.noImage}</span>}
        </div>
        <div className={content.mediaActions}>
          <input id={id} data-field={`answers.${field}`} type="file" accept={MEDIA_TYPES.join(",")} className={content.fileInput} aria-labelledby={`${id}-label ${id}-button`} aria-describedby={`${id}-msg`} onChange={(e) => { const f = e.currentTarget.files?.[0]; e.currentTarget.value = ""; if (f) void onUpload(field, f); }} />
          <label id={`${id}-button`} htmlFor={id} className={`btn btn-secondary ${content.fileButton}`} aria-busy={busy === field || undefined}>
            {busy === field ? a.uploading : image ? a.replace : a.upload}
          </label>
        </div>
      </div>
      <p id={`${id}-msg`} className={err(`answers.${field}`) ? content.error : content.hint} aria-live="polite">{err(`answers.${field}`) ? dict.errors[err(`answers.${field}`) ?? "failed"] : hint}</p>
    </div>
  );

  return (
    <div className={styles.application}>
      <Steps dict={dict} status={status} />

      <div ref={statusRef} tabIndex={-1} className={styles.statusPanel} data-status={status ?? "draft"} role="status">
        <p className={styles.statusTitle}>{a.status[status ?? "draft"].title}</p>
        <p>{a.status[status ?? "draft"].body}</p>
        {app?.due ? (
          <p className={styles.due}>
            {a.due
              .replace("{amount}", formatPrice(app.due.amountMinor, app.due.currency, locale))
              .replace("{months}", String(app.due.months))
              .replace("{end}", new Intl.DateTimeFormat(locale === "ar" ? "ar-SA-u-ca-gregory-nu-latn" : "en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${app.due.periodEnd}T00:00:00Z`)))}
          </p>
        ) : null}
        {app?.staffMessage ? (
          <blockquote className={styles.staffNote}>
            <p className={styles.staffNoteLabel}>{status === "rejected" ? a.rejectReason : a.staffMessage}</p>
            <p dir="auto">{app.staffMessage}</p>
          </blockquote>
        ) : null}
        {app?.reapplyAt ? (
          <>
            <p>{app.canReapply ? a.reapplyNow : a.reapplyOn.replace("{date}", new Intl.DateTimeFormat(locale === "ar" ? "ar-SA-u-ca-gregory-nu-latn" : "en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Riyadh" }).format(new Date(app.reapplyAt)))}</p>
            {app.canReapply ? <button type="button" className="btn btn-primary" aria-busy={busy === "reapply" || undefined} onClick={() => { void onReapply(); }}>{busy === "reapply" ? a.reapplying : a.reapply}</button> : null}
            {message?.tone === "error" ? <p className={content.message} data-tone="error" role="alert">{message.text}</p> : null}
          </>
        ) : null}
      </div>

      {app && !editable ? (
        <Summary app={app} locale={locale} dict={dict} />
      ) : (
        <form className={content.editor} noValidate onSubmit={(e) => { e.preventDefault(); void onSubmit(); }}>
          <fieldset className={content.group}>
            <legend>{a.plan}</legend>
            {plans.length === 0 ? (
              <div className={styles.emptyPlans}>
                <p className={styles.statusTitle}>{a.noPlans.title}</p>
                <p>{a.noPlans.body}</p>
              </div>
            ) : (
              <div className={styles.planChoices} role="radiogroup" aria-describedby="plan-msg" aria-invalid={err("planId") ? true : undefined}>
                {plans.map((p, i) => (
                  <label key={p.id} className={styles.planChoice}>
                    <input
                      type="radio"
                      name="planId"
                      value={p.id}
                      checked={planId === p.id}
                      data-field={i === 0 ? "planId" : undefined}
                      onChange={() => { setPlanId(p.id); setDirty(true); setMessage(null); setErrors((e) => ({ ...e, planId: undefined })); }}
                    />
                    <span className={styles.planBody}>
                      <span className={styles.planName}>{p.name[locale]}</span>
                      <PlanPrice plan={p} locale={locale} dict={dict} />
                      {p.summary[locale] ? <span className={styles.planText}>{p.summary[locale]}</span> : null}
                      {p.eligibility[locale] ? <span className={styles.planText}>{p.eligibility[locale]}</span> : null}
                      {p.rules.generalAssembly ? <span className={styles.planText}>{a.generalAssembly}</span> : null}
                      {p.rules.byRequest ? <span className={styles.planText}>{dict.byRequest}</span> : null}
                      {p.demo ? <span className={styles.demo}>{dict.demo}</span> : null}
                    </span>
                  </label>
                ))}
              </div>
            )}
            <p id="plan-msg" className={err("planId") ? content.error : content.hint} aria-live="polite">{err("planId") ? dict.errors[err("planId") ?? "failed"] : chosen?.demo ? dict.demoNote : ""}</p>
          </fieldset>

          <fieldset className={content.group}>
            <legend>{a.you}</legend>
            <Field id={ids.name} label={a.fullName} hint={a.fullNameHint} error={err("answers.fullName")} dict={dict}>
              <input id={ids.name} data-field="answers.fullName" className={content.input} value={answers.fullName} maxLength={120} autoComplete="name" lang="ar" dir="rtl" required aria-invalid={err("answers.fullName") ? true : undefined} {...describe(ids.name)} onChange={(e) => { set("fullName", e.currentTarget.value); }} />
            </Field>
            <Field id={ids.nameEn} label={a.fullNameEn} hint={a.fullNameEnHint} error={err("answers.fullNameEn")} dict={dict}>
              <input id={ids.nameEn} data-field="answers.fullNameEn" className={content.input} value={answers.fullNameEn} maxLength={120} lang="en" dir="ltr" required aria-invalid={err("answers.fullNameEn") ? true : undefined} {...describe(ids.nameEn)} onChange={(e) => { set("fullNameEn", e.currentTarget.value); }} />
            </Field>
            <div className={content.grid2}>
              <Field id={ids.phone} label={a.phone} hint={a.phoneHint} error={err("answers.phone")} dict={dict}>
                <input id={ids.phone} data-field="answers.phone" className={content.input} value={answers.phone} maxLength={24} type="tel" inputMode="tel" autoComplete="tel" dir="ltr" required aria-invalid={err("answers.phone") ? true : undefined} {...describe(ids.phone)} onChange={(e) => { set("phone", e.currentTarget.value); }} />
              </Field>
              <Field id={ids.city} label={a.city} error={err("answers.city")} dict={dict}>
                <input id={ids.city} data-field="answers.city" className={content.input} value={answers.city} maxLength={80} autoComplete="address-level2" dir="auto" required aria-invalid={err("answers.city") ? true : undefined} {...describe(ids.city)} onChange={(e) => { set("city", e.currentTarget.value); }} />
              </Field>
            </div>
            <Field id={ids.spec} label={a.specialization} error={err("answers.specialization")} dict={dict}>
              <select id={ids.spec} data-field="answers.specialization" className={content.input} value={answers.specialization} required aria-invalid={err("answers.specialization") ? true : undefined} {...describe(ids.spec)} onChange={(e) => { set("specialization", (SPECIALIZATIONS as readonly string[]).includes(e.currentTarget.value) ? (e.currentTarget.value as ApplicationAnswers["specialization"]) : ""); }}>
                <option value="">{a.choose}</option>
                {SPECIALIZATIONS.map((s) => <option key={s} value={s}>{dict.specializations[s]}</option>)}
              </select>
            </Field>
            {rules && rules.minAge > 0 ? (
              <Field id={ids.birth} label={a.birthDate} hint={a.birthDateHint.replace("{n}", String(rules.minAge))} error={err("answers.birthDate")} dict={dict}>
                <input id={ids.birth} data-field="answers.birthDate" type="date" className={content.input} value={answers.birthDate} max={today} autoComplete="bday" dir="ltr" required aria-invalid={err("answers.birthDate") ? true : undefined} {...describe(ids.birth)} onChange={(e) => { set("birthDate", e.currentTarget.value); }} />
              </Field>
            ) : null}
            {rules && rules.priorMembershipMonths > 0 ? (
              <Field id={ids.since} label={a.memberSince} hint={a.memberSinceHint.replace("{n}", String(rules.priorMembershipMonths))} error={err("answers.memberSince")} dict={dict}>
                <input id={ids.since} data-field="answers.memberSince" type="month" className={content.input} value={answers.memberSince} placeholder="2026-01" max={today.slice(0, 7)} dir="ltr" required aria-invalid={err("answers.memberSince") ? true : undefined} {...describe(ids.since)} onChange={(e) => { set("memberSince", e.currentTarget.value); }} />
              </Field>
            ) : null}
            {upload("photoId", photo, ids.photo, a.photo, a.photoHint, a.photoAlt)}
            {rules?.studentProof ? upload("studentProofId", proof, ids.proof, a.studentProof, a.studentProofHint, a.studentProofAlt) : null}
          </fieldset>

          <div className={content.actions}>
            <button type="submit" className="btn btn-primary" aria-busy={busy === "submit" || undefined}>{busy === "submit" ? a.submitting : status === "needs_changes" ? a.resubmit : a.submit}</button>
            <button type="button" className="btn btn-secondary" aria-busy={busy === "save" || undefined} onClick={() => { void onSave(); }}>{busy === "save" ? a.saving : a.save}</button>
            <span className={content.spacer} />
            {message ? <p className={content.message} data-tone={message.tone} role={message.tone === "error" ? "alert" : "status"}>{message.text}</p> : dirty ? <p className={content.message}>{a.unsaved}</p> : <p className={content.message}>{a.submitLead}</p>}
          </div>
        </form>
      )}

      {app && app.history.length > 0 ? (
        <section className={styles.history} aria-labelledby="history-title">
          <h2 id="history-title">{a.history}</h2>
          <History events={app.history} locale={locale} dict={dict} />
        </section>
      ) : null}
      <p><Link href={`/${locale}/contact`}>{a.contact}</Link></p>
    </div>
  );
}

function Summary({ app, locale, dict }: { app: MemberApplication; locale: Locale; dict: MembershipDict }) {
  const a = dict.apply;
  return (
    <section className={content.group} aria-labelledby="answers-title">
      <h2 id="answers-title" className={styles.groupTitle}>{a.answers}</h2>
      <dl className={styles.answers}>
        {app.plan ? (
          <div>
            <dt>{a.submittedPlan}</dt>
            <dd>
              {app.plan.name[locale]} <PlanPrice plan={app.plan} locale={locale} dict={dict} />
              {app.plan.demo ? <span className={styles.demo}>{dict.demo}</span> : null}
            </dd>
          </div>
        ) : null}
        <div><dt>{a.fullName}</dt><dd><bdi>{app.answers.fullName}</bdi></dd></div>
        {app.answers.fullNameEn ? <div><dt>{a.fullNameEn}</dt><dd><bdi>{app.answers.fullNameEn}</bdi></dd></div> : null}
        <div><dt>{a.phone}</dt><dd dir="ltr">{app.answers.phone}</dd></div>
        <div><dt>{a.city}</dt><dd dir="auto">{app.answers.city}</dd></div>
        <div><dt>{a.specialization}</dt><dd>{app.answers.specialization ? dict.specializations[app.answers.specialization] : ""}</dd></div>
        {app.answers.birthDate ? <div><dt>{a.birthDate}</dt><dd dir="ltr">{app.answers.birthDate}</dd></div> : null}
        {app.answers.memberSince ? <div><dt>{a.memberSince}</dt><dd dir="ltr">{app.answers.memberSince}</dd></div> : null}
        {app.studentProof ? (
          <div>
            <dt>{a.studentProof}</dt>
            <dd>
              <span className={styles.photoFrame}>
                {/* eslint-disable-next-line @next/next/no-img-element -- private, authorised image served by the API. */}
                <img src={`${API_BASE_PATH}/media/${app.studentProof.id}`} alt={a.studentProofAlt} width={app.studentProof.width || undefined} height={app.studentProof.height || undefined} />
              </span>
            </dd>
          </div>
        ) : null}
        <div>
          <dt>{a.photo}</dt>
          <dd>
            {app.photo ? (
              <span className={styles.photoFrame}>
                {/* eslint-disable-next-line @next/next/no-img-element -- private, authorised image served by the API. */}
                <img src={`${API_BASE_PATH}/media/${app.photo.id}`} alt={a.photoAlt} width={app.photo.width || undefined} height={app.photo.height || undefined} />
              </span>
            ) : a.noPhoto}
          </dd>
        </div>
      </dl>
    </section>
  );
}
