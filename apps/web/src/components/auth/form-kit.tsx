"use client";

import type { ZodType } from "zod";
import { useId, useState, type InputHTMLAttributes, type ReactNode } from "react";
import type { AuthDict } from "@/i18n/types";
import type { ApiResult } from "@/lib/client-api";
import styles from "./auth.module.css";

export type ErrorKey = keyof AuthDict["errors"];

function isErrorKey(errors: AuthDict["errors"], key: string): key is ErrorKey {
  return key in errors;
}

/** First message key from a shared schema; the contracts use translation keys as messages. */
function schemaError(schema: ZodType, value: string): string | null {
  const r = schema.safeParse(value);
  return r.success ? null : (r.error.issues[0]?.message ?? "failed");
}

/** Field names are unique on each account screen, so the name finds the input. */
function focusField(name: string) {
  document.getElementsByName(name)[0]?.focus();
}

/**
 * Blur-first validation: a field shows an error only after it has been left once, clears as soon as
 * it is focused or edited, and the submit button is never disabled.
 */
export function useAuthForm<F extends string>(dict: AuthDict, schemas: Record<F, ZodType>, initial: Partial<Record<F, string>> = {}) {
  const names = Object.keys(schemas) as F[];
  const [values, setValues] = useState<Record<F, string>>(() => Object.fromEntries(names.map((n) => [n, initial[n] ?? ""])) as Record<F, string>);
  const [errors, setErrors] = useState<Partial<Record<F, ErrorKey>>>({});
  const [formError, setFormError] = useState<ErrorKey | null>(null);

  const toKey = (key: string | null | undefined): ErrorKey | undefined =>
    key ? (isErrorKey(dict.errors, key) ? key : "failed") : undefined;

  const check = (name: F, value: string) => toKey(schemaError(schemas[name], value));

  return {
    values,
    errors,
    formError,
    setFormError,
    reset() {
      setValues(Object.fromEntries(names.map((n) => [n, ""])) as Record<F, string>);
      setErrors({});
    },
    bind(name: F) {
      return {
        name,
        value: values[name],
        error: errors[name],
        onChange: (v: string) => {
          setValues((s) => ({ ...s, [name]: v }));
          if (errors[name]) setErrors((e) => ({ ...e, [name]: undefined }));
        },
        onBlur: (value: string) => {
          // A pristine empty field is left alone until submit.
          if (value === "") return;
          setErrors((e) => ({ ...e, [name]: check(name, value) }));
        },
        onFocus: () => {
          if (errors[name]) setErrors((e) => ({ ...e, [name]: undefined }));
        },
      };
    },
    /** Validates every field; focuses the first invalid one. Returns true when all pass. */
    validateAll(): boolean {
      const next = Object.fromEntries(names.map((n) => [n, check(n, values[n])])) as Partial<Record<F, ErrorKey>>;
      setErrors(next);
      setFormError(null);
      const first = names.find((n) => next[n]);
      if (first) focusField(first);
      return !first;
    },
    /** Maps an API failure to field errors (by the server's message keys) or one form-level message. */
    applyFailure(result: Extract<ApiResult<unknown>, { ok: false }>) {
      const fieldErrors: Partial<Record<F, ErrorKey>> = {};
      for (const n of names) {
        const key = toKey(result.fields[n]?.[0]);
        if (key) fieldErrors[n] = key;
      }
      if (Object.keys(fieldErrors).length > 0) {
        setErrors(fieldErrors);
        const first = names.find((n) => fieldErrors[n]);
        if (first) focusField(first);
        return;
      }
      const code = result.code;
      setFormError(
        code === "invalid_credentials" || code === "email_unverified" || code === "token_invalid" || code === "rate_limited"
          ? code
          : code === "unauthenticated"
            ? "session_ended"
            : "failed",
      );
    },
  };
}

type FieldProps = {
  label: string;
  hint?: string | undefined;
  dict: AuthDict;
  name: string;
  value: string;
  error: ErrorKey | undefined;
  onChange: (v: string) => void;
  onBlur: (value: string) => void;
  onFocus: () => void;
  after?: ReactNode;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "onBlur" | "onFocus" | "name">;

export function Field({ label, hint, dict, name, value, error, onChange, onBlur, onFocus, after, className, ...input }: FieldProps) {
  const id = useId();
  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>{label}</label>
      <input
        {...input}
        id={id}
        name={name}
        value={value}
        className={className ? `${styles.input} ${className}` : styles.input}
        aria-invalid={error ? true : undefined}
        aria-describedby={`${id}-msg`}
        onChange={(e) => { onChange(e.currentTarget.value); }}
        onBlur={(e) => { onBlur(e.currentTarget.value); }}
        onFocus={onFocus}
      />
      {after}
      <p id={`${id}-msg`} className={error ? styles.error : styles.hint} aria-live="polite">
        {error ? dict.errors[error] : hint ?? ""}
      </p>
    </div>
  );
}

export function FormError({ dict, error, children }: { dict: AuthDict; error: ErrorKey | null; children?: ReactNode }) {
  if (!error) return null;
  return (
    <div className={styles.formError} role="alert">
      <p>{dict.errors[error]}</p>
      {children}
    </div>
  );
}

export function SubmitButton({ busy, label, busyLabel }: { busy: boolean; label: string; busyLabel: string }) {
  return (
    <button type="submit" className={`btn btn-primary ${styles.submit}`} aria-busy={busy || undefined}>
      {busy ? busyLabel : label}
    </button>
  );
}

/** Success panel that replaces a form: what happened, and the one next step. */
export function Done({ title, body, children }: { title: string; body: string; children?: ReactNode }) {
  return (
    <div className={styles.done} role="status">
      <span className={styles.doneBall} aria-hidden="true" />
      <h2 className={styles.doneTitle}>{title}</h2>
      <p>{body}</p>
      {children}
    </div>
  );
}
