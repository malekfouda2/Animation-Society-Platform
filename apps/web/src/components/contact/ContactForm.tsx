"use client";

import { API_BASE_PATH, contactMessageSchema, type Locale } from "@as/contracts";
import { useId, useRef, useState, type SyntheticEvent } from "react";
import styles from "./contact.module.css";

type Field = "name" | "email" | "subject" | "message";
const FIELDS: readonly Field[] = ["name", "email", "subject", "message"];

interface Labels {
  name: string;
  email: string;
  emailHint: string;
  subject: string;
  message: string;
  send: string;
  sending: string;
  sent: { title: string; body: string };
  sendAnother: string;
  errors: Record<Field | "failed" | "rateLimited", string>;
}

function validateField(field: Field, value: string): boolean {
  const shape = contactMessageSchema.shape[field];
  return shape.safeParse(value).success;
}

export function ContactForm({ locale, labels }: { locale: Locale; labels: Labels }) {
  const id = useId();
  const [values, setValues] = useState<Record<Field, string>>({ name: "", email: "", subject: "", message: "" });
  const [errors, setErrors] = useState<Partial<Record<Field, boolean>>>({});
  const [state, setState] = useState<"idle" | "sending" | "sent" | "failed" | "rateLimited">("idle");
  const formRef = useRef<HTMLFormElement>(null);
  const honeypotRef = useRef<HTMLInputElement>(null);

  const onBlur = (field: Field) => {
    setErrors((e) => ({ ...e, [field]: !validateField(field, values[field]) }));
  };
  const onFocus = (field: Field) => {
    if (errors[field]) setErrors((e) => ({ ...e, [field]: false }));
  };

  async function onSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = Object.fromEntries(FIELDS.map((f) => [f, !validateField(f, values[f])])) as Record<Field, boolean>;
    setErrors(nextErrors);
    const firstInvalid = FIELDS.find((f) => nextErrors[f]);
    if (firstInvalid) {
      formRef.current?.querySelector<HTMLElement>(`[name="${firstInvalid}"]`)?.focus();
      return;
    }
    setState("sending");
    try {
      const res = await fetch(`${API_BASE_PATH}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, locale, website: honeypotRef.current?.value ?? "" }),
      });
      if (res.status === 202) setState("sent");
      else if (res.status === 429) setState("rateLimited");
      else setState("failed");
    } catch {
      setState("failed");
    }
  }

  if (state === "sent") {
    return (
      <div className={styles.sent} role="status">
        <span aria-hidden="true" className={styles.sentBall} />
        <h2 className={styles.sentTitle}>{labels.sent.title}</h2>
        <p>{labels.sent.body}</p>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => {
            setValues({ name: "", email: "", subject: "", message: "" });
            setErrors({});
            setState("idle");
          }}
        >
          {labels.sendAnother}
        </button>
      </div>
    );
  }

  const field = (name: Field, input: React.ReactNode, hint?: string) => (
    <div className={styles.field}>
      <label htmlFor={`${id}-${name}`} className={styles.label}>{labels[name]}</label>
      {input}
      <p id={`${id}-${name}-msg`} className={errors[name] ? styles.error : styles.hint} aria-live="polite">
        {errors[name] ? labels.errors[name] : hint ?? ""}
      </p>
    </div>
  );
  const common = (name: Field) => ({
    id: `${id}-${name}`,
    name,
    value: values[name],
    required: true,
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": `${id}-${name}-msg`,
    className: styles.input,
    onBlur: () => { onBlur(name); },
    onFocus: () => { onFocus(name); },
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const v = e.currentTarget.value;
      setValues((s) => ({ ...s, [name]: v }));
      if (errors[name]) setErrors((er) => ({ ...er, [name]: false }));
    },
  });

  return (
    <form ref={formRef} className={styles.form} noValidate onSubmit={(e) => { void onSubmit(e); }}>
      {field("name", <input {...common("name")} type="text" autoComplete="name" maxLength={120} />)}
      {field("email", <input {...common("email")} type="email" autoComplete="email" inputMode="email" maxLength={254} dir="ltr" />, labels.emailHint)}
      {field("subject", <input {...common("subject")} type="text" maxLength={160} />)}
      {field("message", <textarea {...common("message")} rows={7} maxLength={5000} />)}
      {/* Honeypot, hidden from people and assistive tech. */}
      <div className={styles.trap} aria-hidden="true">
        <label htmlFor={`${id}-website`}>Website</label>
        <input ref={honeypotRef} id={`${id}-website`} name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      {state === "failed" || state === "rateLimited" ? (
        <p className={styles.formError} role="alert">
          {state === "failed" ? labels.errors.failed : labels.errors.rateLimited}
        </p>
      ) : null}
      <button type="submit" className="btn btn-primary" aria-busy={state === "sending" || undefined}>
        {state === "sending" ? labels.sending : labels.send}
      </button>
    </form>
  );
}
