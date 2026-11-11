"use client";

import { LOCALES, nameSchema, passwordSchema, recoveryCodesSchema, totpCodeSchema, type Locale, type SessionUser } from "@as/contracts";
import { useRouter } from "next/navigation";
import { useId, useState, type SyntheticEvent } from "react";
import { z } from "zod";
import type { AuthDict, Dictionary } from "@/i18n/types";
import { callApi } from "@/lib/client-api";
import styles from "./auth.module.css";
import { RecoveryCodes } from "./AuthForms";
import { Field, FormError, SubmitButton, useAuthForm } from "./form-kit";

const LANGUAGE_NAMES: Record<Locale, string> = { ar: "العربية", en: "English" };

export function ProfileForm({ user, dict, labels }: { user: SessionUser; dict: AuthDict; labels: Dictionary["member"]["profile"] }) {
  const router = useRouter();
  const form = useAuthForm(dict, { name: nameSchema }, { name: user.name });
  const [locale, setLocale] = useState<Locale>(user.locale);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const selectId = useId();

  async function onSubmit(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaved(false);
    if (!form.validateAll()) return;
    setBusy(true);
    const res = await callApi("PATCH", "/account/profile", { name: form.values.name, locale });
    setBusy(false);
    if (res.ok) {
      setSaved(true);
      router.refresh();
    } else form.applyFailure(res);
  }

  return (
    <form className={styles.form} noValidate onSubmit={(e) => { void onSubmit(e); }}>
      <Field {...form.bind("name")} dict={dict} label={dict.fields.name} type="text" autoComplete="name" maxLength={120} required />
      <div className={styles.field}>
        <label htmlFor={selectId} className={styles.label}>{labels.language}</label>
        <select id={selectId} className={styles.input} value={locale} onChange={(e) => { setLocale(z.enum(LOCALES).parse(e.currentTarget.value)); setSaved(false); }}>
          {LOCALES.map((l) => <option key={l} value={l} lang={l}>{LANGUAGE_NAMES[l]}</option>)}
        </select>
      </div>
      <FormError dict={dict} error={form.formError} />
      <div className={styles.row}>
        <SubmitButton busy={busy} label={labels.save} busyLabel={labels.saving} />
        {saved ? <p role="status" className={styles.saved}>{labels.saved}</p> : null}
      </div>
    </form>
  );
}

export function PasswordForm({ dict, labels }: { dict: AuthDict; labels: Dictionary["member"]["password"] }) {
  const form = useAuthForm(dict, { currentPassword: z.string().min(1, "password"), newPassword: passwordSchema });
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  async function onSubmit(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaved(false);
    if (!form.validateAll()) return;
    setBusy(true);
    const res = await callApi("POST", "/account/password", form.values);
    setBusy(false);
    if (res.ok) {
      setSaved(true);
      form.reset();
    } else form.applyFailure(res);
  }

  return (
    <form className={styles.form} noValidate onSubmit={(e) => { void onSubmit(e); }}>
      <input type="text" name="username" autoComplete="username" hidden readOnly />
      <Field {...form.bind("currentPassword")} dict={dict} label={dict.fields.currentPassword} type="password" autoComplete="current-password" maxLength={128} required />
      <Field {...form.bind("newPassword")} dict={dict} label={dict.fields.newPassword} hint={dict.hints.password} type="password" autoComplete="new-password" maxLength={128} required />
      <FormError dict={dict} error={form.formError} />
      <div className={styles.row}>
        <SubmitButton busy={busy} label={labels.save} busyLabel={labels.saving} />
        {saved ? <p role="status" className={styles.saved}>{labels.saved}</p> : null}
      </div>
    </form>
  );
}

export function RegenerateCodesForm({ dict, labels }: { dict: AuthDict; labels: Dictionary["admin"]["security"] }) {
  const router = useRouter();
  const form = useAuthForm(dict, { code: totpCodeSchema });
  const [busy, setBusy] = useState(false);
  const [codes, setCodes] = useState<string[] | null>(null);

  async function onSubmit(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!form.validateAll()) return;
    setBusy(true);
    const res = await callApi("POST", "/auth/mfa/recovery-codes", { code: form.values.code });
    setBusy(false);
    if (res.ok) setCodes(recoveryCodesSchema.parse(res.data).recoveryCodes);
    else form.applyFailure(res);
  }

  if (codes) return <RecoveryCodes dict={dict} codes={codes} onDone={() => { setCodes(null); router.refresh(); }} />;
  return (
    <form className={styles.form} noValidate onSubmit={(e) => { void onSubmit(e); }}>
      <p>{labels.regenerateLead}</p>
      <Field {...form.bind("code")} dict={dict} label={dict.fields.code} type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]*" maxLength={6} dir="ltr" className={styles.codeInput} required />
      <FormError dict={dict} error={form.formError} />
      <SubmitButton busy={busy} label={labels.regenerate} busyLabel={labels.regenerating} />
    </form>
  );
}
