"use client";

import {
  emailSchema,
  loginSchema,
  mfaEnrollmentSchema,
  nameSchema,
  passwordSchema,
  recoveryCodeSchema,
  recoveryCodesSchema,
  signInResultSchema,
  totpCodeSchema,
  type Locale,
  type MfaEnrollment,
} from "@as/contracts";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type SyntheticEvent } from "react";
import type { AuthDict } from "@/i18n/types";
import { callApi } from "@/lib/client-api";
import styles from "./auth.module.css";
import { Done, Field, FormError, SubmitButton, useAuthForm } from "./form-kit";

interface Base {
  locale: Locale;
  dict: AuthDict;
}

function landing(locale: Locale, role: string, next?: string) {
  return next ?? (role === "member" ? `/${locale}/member` : `/${locale}/admin`);
}

export function SignInForm({ locale, dict, next }: Base & { next?: string | undefined }) {
  const router = useRouter();
  const form = useAuthForm(dict, { email: emailSchema, password: loginSchema.shape.password });
  const [busy, setBusy] = useState(false);
  const [resent, setResent] = useState(false);

  async function onSubmit(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!form.validateAll()) return;
    setBusy(true);
    const res = await callApi("POST", "/auth/sign-in", form.values);
    if (!res.ok) {
      setBusy(false);
      form.applyFailure(res);
      return;
    }
    const { next: step, user } = signInResultSchema.parse(res.data);
    const after = encodeURIComponent(landing(locale, user.role, next));
    router.push(
      step === "mfa_enroll"
        ? `/${locale}/two-factor/setup?next=${after}`
        : step === "mfa_verify"
          ? `/${locale}/two-factor?next=${after}`
          : landing(locale, user.role, next),
    );
    router.refresh();
  }

  async function resend() {
    await callApi("POST", "/auth/verify-email/resend", { email: form.values.email, locale });
    setResent(true);
  }

  return (
    <form className={styles.form} noValidate onSubmit={(e) => { void onSubmit(e); }}>
      <Field {...form.bind("email")} dict={dict} label={dict.fields.email} type="email" autoComplete="email" inputMode="email" dir="ltr" maxLength={254} required />
      <Field {...form.bind("password")} dict={dict} label={dict.fields.password} type="password" autoComplete="current-password" maxLength={128} required />
      <FormError dict={dict} error={form.formError}>
        {form.formError === "email_unverified" ? (
          resent ? <p>{dict.signIn.resent}</p> : (
            <button type="button" className={styles.inlineAction} onClick={() => { void resend(); }}>{dict.signIn.resend}</button>
          )
        ) : null}
      </FormError>
      <SubmitButton busy={busy} label={dict.signIn.submit} busyLabel={dict.signIn.submitting} />
      <p className={styles.aside}>
        <Link href={`/${locale}/forgot-password`}>{dict.signIn.forgot}</Link>
      </p>
      <p className={styles.aside}>
        {dict.signIn.noAccount} <Link href={`/${locale}/register`}>{dict.signIn.register}</Link>
      </p>
    </form>
  );
}

export function RegisterForm({ locale, dict }: Base) {
  const form = useAuthForm(dict, { name: nameSchema, email: emailSchema, password: passwordSchema });
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!form.validateAll()) return;
    setBusy(true);
    const res = await callApi("POST", "/auth/register", { ...form.values, locale });
    setBusy(false);
    if (res.ok) setSent(true);
    else form.applyFailure(res);
  }

  if (sent) return <Done title={dict.register.sent.title} body={dict.register.sent.body} />;
  return (
    <form className={styles.form} noValidate onSubmit={(e) => { void onSubmit(e); }}>
      <Field {...form.bind("name")} dict={dict} label={dict.fields.name} type="text" autoComplete="name" maxLength={120} required />
      <Field {...form.bind("email")} dict={dict} label={dict.fields.email} hint={dict.hints.email} type="email" autoComplete="email" inputMode="email" dir="ltr" maxLength={254} required />
      <Field {...form.bind("password")} dict={dict} label={dict.fields.password} hint={dict.hints.password} type="password" autoComplete="new-password" maxLength={128} required />
      <FormError dict={dict} error={form.formError} />
      <SubmitButton busy={busy} label={dict.register.submit} busyLabel={dict.register.submitting} />
      <p className={styles.aside}>
        {dict.register.haveAccount} <Link href={`/${locale}/sign-in`}>{dict.register.signIn}</Link>
      </p>
    </form>
  );
}

/** Posts the emailed token once on load; the token is then dropped from the address bar. */
export function VerifyEmail({ locale, dict, token }: Base & { token: string | undefined }) {
  const [state, setState] = useState<"working" | "done" | "failed">(token ? "working" : "failed");
  const startedRef = useRef(false);
  useEffect(() => {
    if (!token || startedRef.current) return;
    startedRef.current = true;
    window.history.replaceState(null, "", window.location.pathname);
    void callApi("POST", "/auth/verify-email", { token }).then((res) => { setState(res.ok ? "done" : "failed"); });
  }, [token]);

  if (state === "working") return <p role="status" aria-busy="true">{dict.verify.working}</p>;
  if (state === "done") {
    return (
      <Done title={dict.verify.done.title} body={dict.verify.done.body}>
        <Link href={`/${locale}/sign-in`} className="btn btn-primary">{dict.verify.signIn}</Link>
      </Done>
    );
  }
  return (
    <div className={styles.stack}>
      <div className={styles.formError} role="alert">
        <p><strong>{dict.verify.failed.title}</strong></p>
        <p>{dict.verify.failed.body}</p>
      </div>
      <p>{dict.verify.resendLead}</p>
      <EmailLinkForm locale={locale} dict={dict} path="/auth/verify-email/resend" submit={dict.verify.resend} busyLabel={dict.forgot.submitting} sent={{ title: dict.verify.resent, body: "" }} />
    </div>
  );
}

function EmailLinkForm({ locale, dict, path, submit, busyLabel, sent }: Base & { path: string; submit: string; busyLabel: string; sent: { title: string; body: string } }) {
  const form = useAuthForm(dict, { email: emailSchema });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  async function onSubmit(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!form.validateAll()) return;
    setBusy(true);
    const res = await callApi("POST", path, { email: form.values.email, locale });
    setBusy(false);
    if (res.ok) setDone(true);
    else form.applyFailure(res);
  }
  if (done) return <Done title={sent.title} body={sent.body} />;
  return (
    <form className={styles.form} noValidate onSubmit={(e) => { void onSubmit(e); }}>
      <Field {...form.bind("email")} dict={dict} label={dict.fields.email} type="email" autoComplete="email" inputMode="email" dir="ltr" maxLength={254} required />
      <FormError dict={dict} error={form.formError} />
      <SubmitButton busy={busy} label={submit} busyLabel={busyLabel} />
    </form>
  );
}

export function ForgotForm({ locale, dict }: Base) {
  return (
    <div className={styles.stack}>
      <EmailLinkForm locale={locale} dict={dict} path="/auth/password/forgot" submit={dict.forgot.submit} busyLabel={dict.forgot.submitting} sent={dict.forgot.sent} />
      <p className={styles.aside}><Link href={`/${locale}/sign-in`}>{dict.forgot.back}</Link></p>
    </div>
  );
}

export function ResetForm({ locale, dict, token }: Base & { token: string | undefined }) {
  const form = useAuthForm(dict, { password: passwordSchema });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  // Keep the token in memory only, and out of the address bar (and so out of history and Referer).
  const [linkToken] = useState(token);
  useEffect(() => {
    if (token) window.history.replaceState(null, "", window.location.pathname);
  }, [token]);

  async function onSubmit(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!form.validateAll()) return;
    setBusy(true);
    const res = await callApi("POST", "/auth/password/reset", { token: linkToken, password: form.values.password });
    setBusy(false);
    if (res.ok) setDone(true);
    else form.applyFailure(res);
  }

  if (!linkToken) {
    return (
      <div className={styles.stack}>
        <p>{dict.reset.missing}</p>
        <Link href={`/${locale}/forgot-password`} className="btn btn-secondary">{dict.reset.requestNew}</Link>
      </div>
    );
  }
  if (done) {
    return (
      <Done title={dict.reset.done.title} body={dict.reset.done.body}>
        <Link href={`/${locale}/sign-in`} className="btn btn-primary">{dict.reset.signIn}</Link>
      </Done>
    );
  }
  return (
    <form className={styles.form} noValidate onSubmit={(e) => { void onSubmit(e); }}>
      <Field {...form.bind("password")} dict={dict} label={dict.fields.newPassword} hint={dict.hints.password} type="password" autoComplete="new-password" maxLength={128} required />
      <FormError dict={dict} error={form.formError}>
        {form.formError === "token_invalid" ? <Link href={`/${locale}/forgot-password`}>{dict.reset.requestNew}</Link> : null}
      </FormError>
      <SubmitButton busy={busy} label={dict.reset.submit} busyLabel={dict.reset.submitting} />
    </form>
  );
}

export function MfaVerifyForm({ locale, dict, next }: Base & { next: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<"code" | "recovery">("code");
  const codeForm = useAuthForm(dict, { code: totpCodeSchema });
  const recoveryForm = useAuthForm(dict, { recoveryCode: recoveryCodeSchema });
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = mode === "code" ? codeForm : recoveryForm;
    if (!form.validateAll()) return;
    setBusy(true);
    const body = mode === "code" ? { code: codeForm.values.code } : { recoveryCode: recoveryForm.values.recoveryCode };
    const res = await callApi("POST", "/auth/mfa/verify", body);
    if (res.ok) {
      router.push(next);
      router.refresh();
      return;
    }
    setBusy(false);
    if (res.code === "unauthenticated") {
      router.push(`/${locale}/sign-in`);
      return;
    }
    if (mode === "code") codeForm.applyFailure(res);
    else recoveryForm.applyFailure({ ...res, fields: res.fields["code"] ? { recoveryCode: ["recovery_code"] } : res.fields });
  }

  const form = mode === "code" ? codeForm : recoveryForm;
  return (
    <form className={styles.form} noValidate onSubmit={(e) => { void onSubmit(e); }}>
      {mode === "code" ? (
        <Field {...codeForm.bind("code")} dict={dict} label={dict.fields.code} hint={dict.hints.code} type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]*" maxLength={6} dir="ltr" className={styles.codeInput} required />
      ) : (
        <Field {...recoveryForm.bind("recoveryCode")} dict={dict} label={dict.fields.recoveryCode} hint={dict.hints.recoveryCode} type="text" autoComplete="off" autoCapitalize="characters" spellCheck={false} maxLength={12} dir="ltr" required />
      )}
      <FormError dict={dict} error={form.formError} />
      <SubmitButton busy={busy} label={dict.mfa.submit} busyLabel={dict.mfa.submitting} />
      <p className={styles.aside}>
        <button type="button" className={styles.inlineAction} onClick={() => { setMode(mode === "code" ? "recovery" : "code"); }}>
          {mode === "code" ? dict.mfa.useRecovery : dict.mfa.useCode}
        </button>
      </p>
      {mode === "recovery" ? <p className={styles.aside}>{dict.mfa.recoveryLead}</p> : null}
    </form>
  );
}

export function RecoveryCodes({ dict, codes, onDone }: { dict: AuthDict; codes: string[]; onDone?: () => void }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className={styles.stack} role="status">
      <h2 className={styles.doneTitle}>{dict.mfa.codesTitle}</h2>
      <p>{dict.mfa.codesLead}</p>
      <ol className={styles.codes} dir="ltr">
        {codes.map((c) => <li key={c}><code>{c}</code></li>)}
      </ol>
      <div className={styles.row}>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => {
            void navigator.clipboard.writeText(codes.join("\n")).then(() => { setCopied(true); });
          }}
        >
          {copied ? dict.mfa.copied : dict.mfa.copy}
        </button>
        {onDone ? <button type="button" className="btn btn-primary" onClick={onDone}>{dict.mfa.saved}</button> : null}
      </div>
    </div>
  );
}

export function MfaSetup({ locale, dict, next }: Base & { next: string }) {
  const router = useRouter();
  const [enrollment, setEnrollment] = useState<MfaEnrollment | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [codes, setCodes] = useState<string[] | null>(null);
  const [busy, setBusy] = useState(false);
  const form = useAuthForm(dict, { code: totpCodeSchema });
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    void callApi("POST", "/auth/mfa/enroll").then((res) => {
      if (res.ok) setEnrollment(mfaEnrollmentSchema.parse(res.data));
      else if (res.code === "unauthenticated") router.push(`/${locale}/sign-in`);
      else setLoadError(true);
    });
  }, [locale, router]);

  async function onSubmit(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!form.validateAll()) return;
    setBusy(true);
    const res = await callApi("POST", "/auth/mfa/enroll/confirm", { code: form.values.code });
    setBusy(false);
    if (res.ok) setCodes(recoveryCodesSchema.parse(res.data).recoveryCodes);
    else if (res.code === "unauthenticated") router.push(`/${locale}/sign-in`);
    else form.applyFailure(res);
  }

  if (codes) {
    return <RecoveryCodes dict={dict} codes={codes} onDone={() => { router.push(next); router.refresh(); }} />;
  }
  if (loadError) return <FormError dict={dict} error="failed" />;
  if (!enrollment) return <p role="status" aria-busy="true">{dict.mfa.loading}</p>;
  // The QR comes from our own API (qrcode library output), rendered as an image, never as live markup.
  const qrSrc = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(enrollment.qrSvg)}`;
  return (
    <form className={styles.form} noValidate onSubmit={(e) => { void onSubmit(e); }}>
      <ol className={styles.steps}>
        <li>{dict.mfa.steps[0]}</li>
        <li>
          {dict.mfa.steps[1]}
          <span className={styles.qr}>
            {/* eslint-disable-next-line @next/next/no-img-element -- inline data URI; nothing to optimise */}
            <img src={qrSrc} alt={dict.mfa.qrAlt} width={184} height={184} />
          </span>
          <span className={styles.secret}>
            <span>{dict.mfa.manual}</span>
            <code dir="ltr">{enrollment.secret.replace(/(.{4})/g, "$1 ").trim()}</code>
          </span>
        </li>
        <li>{dict.mfa.steps[2]}</li>
      </ol>
      <Field {...form.bind("code")} dict={dict} label={dict.fields.code} type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]*" maxLength={6} dir="ltr" className={styles.codeInput} required />
      <FormError dict={dict} error={form.formError} />
      <SubmitButton busy={busy} label={dict.mfa.confirm} busyLabel={dict.mfa.confirming} />
    </form>
  );
}

export function SignOutButton({ locale, label, busyLabel, className }: { locale: Locale; label: string; busyLabel: string; className?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      className={className ?? "btn btn-secondary"}
      aria-busy={busy || undefined}
      onClick={() => {
        setBusy(true);
        void callApi("POST", "/auth/sign-out").then(() => {
          router.push(`/${locale}/sign-in`);
          router.refresh();
        });
      }}
    >
      {busy ? busyLabel : label}
    </button>
  );
}
