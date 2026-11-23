"use client";

import { APPLICATION_LIMITS, type AdminApplication } from "@as/contracts";
import { useRouter } from "next/navigation";
import { useId, useRef, useState } from "react";
import content from "@/components/admin/content.module.css";
import type { MembershipDict } from "@/i18n/types";
import { callApi } from "@/lib/client-api";
import styles from "./membership.module.css";

type Mode = "idle" | "changes" | "reject";

/**
 * Staff decision for a submitted application: approve, ask for changes (with a message), or reject
 * (with a reason, behind a named confirmation). Each action names the version it was made from, so
 * a decision taken on a stale page is refused rather than overwriting someone else's.
 */
export function ReviewPanel({ app, dict }: { app: AdminApplication; dict: MembershipDict }) {
  const d = dict.admin.detail;
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("idle");
  const [text, setText] = useState("");
  const [error, setError] = useState<keyof MembershipDict["errors"] | null>(null);
  const [busy, setBusy] = useState<"approve" | "changes" | "reject" | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [met, setMet] = useState(false);
  const meetingId = useId();
  const byRequest = app.plan?.rules.byRequest ?? false;
  const textId = useId();
  const textRef = useRef<HTMLTextAreaElement>(null);
  const openerRef = useRef<HTMLButtonElement | null>(null);

  if (app.status !== "submitted") {
    const note = app.status === "approved" || app.status === "rejected" ? d.decided[app.status] : d.waiting[app.status];
    return (
      <section className={styles.decision} aria-labelledby="decision-title">
        <h2 id="decision-title">{d.decide}</h2>
        {done ? <p role="status" className={content.message} data-tone="ok">{done}</p> : null}
        <p>{note}</p>
      </section>
    );
  }

  async function act(kind: "approve" | "changes" | "reject") {
    setError(null);
    if (kind !== "approve" && text.trim() === "") {
      setError("required");
      textRef.current?.focus();
      return;
    }
    if (kind === "approve" && byRequest && !met) {
      setError("meeting");
      document.getElementById(meetingId)?.focus();
      return;
    }
    setBusy(kind);
    const path = kind === "approve" ? "approve" : kind === "changes" ? "request-changes" : "reject";
    const body = kind === "approve" ? { version: app.version, meetingConfirmed: met } : kind === "changes" ? { version: app.version, message: text } : { version: app.version, reason: text };
    const res = await callApi("POST", `/admin/applications/${app.id}/${path}`, body);
    setBusy(null);
    if (!res.ok) {
      setError(res.code === "conflict" ? "conflict" : res.code === "network" ? "network" : res.code === "forbidden" ? "forbidden" : res.code === "unauthenticated" || res.code === "mfa_required" ? "session_ended" : res.fields["message"]?.[0] === "too_long" || res.fields["reason"]?.[0] === "too_long" ? "too_long" : "failed");
      return;
    }
    setDone(kind === "approve" ? d.done.approved : kind === "changes" ? d.done.changes : d.done.rejected);
    setMode("idle");
    setText("");
    router.refresh();
  }

  function open(next: Mode, opener: HTMLButtonElement) {
    openerRef.current = opener;
    setMode(next);
    setText("");
    setError(null);
    requestAnimationFrame(() => textRef.current?.focus());
  }
  function cancel() {
    setMode("idle");
    setError(null);
    requestAnimationFrame(() => openerRef.current?.focus());
  }

  return (
    <section className={styles.decision} aria-labelledby="decision-title">
      <h2 id="decision-title">{d.decide}</h2>
      <p className={content.hint}>{d.decideLead}</p>
      {mode === "idle" ? (
        <div className={styles.decisionActions}>
          <p>{d.approveLead}</p>
          {byRequest ? (
            <label className={styles.planChoice} htmlFor={meetingId} aria-label={d.meetingConfirm}>
              <input id={meetingId} type="checkbox" checked={met} aria-invalid={error === "meeting" ? true : undefined} onChange={(e) => { setMet(e.currentTarget.checked); if (error === "meeting") setError(null); }} />
              <span className={styles.planBody}>
                <span className={styles.planName}>{d.meetingConfirm}</span>
                <span className={styles.planText}>{d.meetingHint}</span>
              </span>
            </label>
          ) : null}
          <button type="button" className="btn btn-primary" aria-busy={busy === "approve" || undefined} onClick={() => { void act("approve"); }}>{busy === "approve" ? d.approving : d.approve}</button>
          <button type="button" className="btn btn-secondary" onClick={(e) => { open("changes", e.currentTarget); }}>{d.requestChanges}</button>
          <button type="button" className={`btn btn-secondary ${content.danger}`} onClick={(e) => { open("reject", e.currentTarget); }}>{d.reject}</button>
        </div>
      ) : (
        <form
          className={mode === "reject" ? content.confirm : styles.decisionActions}
          noValidate
          onSubmit={(e) => { e.preventDefault(); void act(mode); }}
        >
          <div className={content.field}>
            <label htmlFor={textId} className={content.label}>{mode === "changes" ? d.messageLabel : d.reasonLabel}</label>
            <textarea
              ref={textRef}
              id={textId}
              className={content.input}
              value={text}
              maxLength={APPLICATION_LIMITS.message}
              dir="auto"
              aria-invalid={error === "required" || error === "too_long" ? true : undefined}
              aria-describedby={`${textId}-msg`}
              onChange={(e) => { setText(e.currentTarget.value); if (error) setError(null); }}
              onKeyDown={(e) => { if (e.key === "Escape") cancel(); }}
            />
            <p id={`${textId}-msg`} className={error ? content.error : content.hint} aria-live="polite">{error ? dict.errors[error] : mode === "changes" ? d.messageHint : d.reasonHint}</p>
          </div>
          <div className={content.confirmRow}>
            <button type="submit" className={mode === "reject" ? `btn btn-secondary ${content.danger}` : "btn btn-primary"} aria-busy={busy !== null || undefined}>
              {mode === "changes" ? (busy ? d.requesting : d.sendRequest) : busy ? d.rejecting : d.confirmReject}
            </button>
            <button type="button" className="btn btn-secondary" onClick={cancel}>{d.cancel}</button>
          </div>
        </form>
      )}
      {error && mode === "idle" ? <p role="alert" className={content.message} data-tone="error">{dict.errors[error]}</p> : null}
    </section>
  );
}
