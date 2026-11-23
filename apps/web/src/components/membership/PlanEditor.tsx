"use client";

import { NO_RULES, PLAN_LIMITS, adminPlanSchema, type AdminPlan, type Locale, type PlanRules } from "@as/contracts";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState } from "react";
import content from "@/components/admin/content.module.css";
import type { MembershipDict } from "@/i18n/types";
import { callApi } from "@/lib/client-api";
import styles from "./membership.module.css";

type Pair = { ar: string; en: string };
type ErrorKey = keyof MembershipDict["errors"];

const PRICE = /^\d{1,6}(?:[.,]\d{1,2})?$/;

/** "150.5" -> 15050 halalas. Null when it isn't a price. */
function toMinor(v: string): number | null {
  const t = v.trim();
  if (!PRICE.test(t)) return null;
  return Math.round(Number(t.replace(",", ".")) * 100);
}

/** Pattern 3, Form: one plan, both languages side by side. */
export function PlanEditor({ locale, dict, plan }: { locale: Locale; dict: MembershipDict; plan: AdminPlan | null }) {
  const p = dict.admin.plans;
  const router = useRouter();
  const [key, setKey] = useState(plan?.key ?? "");
  const [name, setName] = useState<Pair>(plan?.name ?? { ar: "", en: "" });
  const [summary, setSummary] = useState<Pair>(plan?.summary ?? { ar: "", en: "" });
  const [eligibility, setEligibility] = useState<Pair>(plan?.eligibility ?? { ar: "", en: "" });
  const [price, setPrice] = useState(plan ? (plan.priceMinor / 100).toFixed(2) : "");
  const [duration, setDuration] = useState(plan ? String(plan.durationMonths) : "12");
  const [enabled, setEnabled] = useState(plan?.enabled ?? false);
  const [order, setOrder] = useState(String(plan?.sortOrder ?? 0));
  const [rules, setRules] = useState<PlanRules>(plan?.rules ?? { ...NO_RULES });
  const setRule = <K extends keyof PlanRules>(k: K, v: PlanRules[K]) => { setRules((r) => ({ ...r, [k]: v })); touch("rules"); };
  const whole = (v: string, max: number) => Math.max(0, Math.min(max, Math.trunc(Number(v) || 0)));
  const [version, setVersion] = useState(plan?.version ?? 0);
  const [errors, setErrors] = useState<Record<string, ErrorKey | undefined>>({});
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const id = useId();

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => { window.removeEventListener("beforeunload", warn); };
  }, [dirty]);

  const touch = (field: string) => { setDirty(true); setMessage(null); if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined })); };
  const err = (f: string) => errors[f];

  async function onSubmit() {
    const next: Record<string, ErrorKey | undefined> = {};
    const minor = toMinor(price);
    const months = Number(duration);
    if (!plan && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(key.trim())) next["key"] = "slug";
    if (!name.ar.trim()) next["name.ar"] = "required";
    if (!name.en.trim()) next["name.en"] = "required";
    if (minor === null) next["priceMinor"] = "price";
    if (!Number.isInteger(months) || months < 1 || months > PLAN_LIMITS.durationMonths) next["durationMonths"] = "duration";
    setErrors(next);
    const first = Object.keys(next)[0];
    if (first) { document.querySelector<HTMLElement>(`[data-field="${first}"]`)?.focus(); return; }

    const fields = { name, summary, eligibility, priceMinor: minor ?? 0, currency: "SAR" as const, durationMonths: months, enabled, sortOrder: Math.max(0, Math.min(100, Math.trunc(Number(order) || 0))), rules };
    setBusy(true);
    const res = plan ? await callApi("PATCH", `/admin/plans/${plan.id}`, { ...fields, version }) : await callApi("POST", "/admin/plans", { ...fields, key: key.trim() });
    setBusy(false);
    if (!res.ok) {
      const fe: Record<string, ErrorKey> = {};
      for (const [k, v] of Object.entries(res.fields)) fe[k] = (v[0] && v[0] in dict.errors ? v[0] : "failed") as ErrorKey;
      setErrors(fe);
      setMessage({ tone: "error", text: dict.errors[res.code === "conflict" ? "conflict" : res.code === "network" ? "network" : res.code === "forbidden" ? "forbidden" : "failed"] });
      return;
    }
    const saved = adminPlanSchema.parse(res.data);
    setDirty(false);
    if (!plan) {
      router.push(`/${locale}/admin/plans/${saved.id}?created=1`);
      return;
    }
    setVersion(saved.version);
    setMessage({ tone: "ok", text: p.saved });
    router.refresh();
  }

  const pair = (label: string, field: string, value: Pair, setter: (v: Pair) => void, opts: { max: number; area?: boolean; required?: boolean; hint?: string }) => (
    <div className={content.pair} role="group" aria-labelledby={`${id}-${field}`}>
      <span id={`${id}-${field}`} className={content.pairLabel}>{label}{opts.required ? null : <span className={styles.optional}> {dict.optional}</span>}</span>
      {opts.hint ? <p className={content.pairHint}>{opts.hint}</p> : null}
      <div className={content.pairFields}>
        {(["ar", "en"] as const).map((lang) => {
          const fid = `${id}-${field}-${lang}`;
          const e = err(`${field}.${lang}`);
          const common = {
            id: fid,
            "data-field": `${field}.${lang}`,
            className: content.input,
            value: value[lang],
            maxLength: opts.max,
            lang,
            dir: lang === "ar" ? "rtl" : "ltr",
            "aria-invalid": e ? true : undefined,
            "aria-describedby": `${fid}-msg`,
          } as const;
          return (
            <div key={lang} className={content.field}>
              <label htmlFor={fid} className={content.langLabel}>{lang === "ar" ? "العربية" : "English"}</label>
              {opts.area ? (
                <textarea {...common} onChange={(ev) => { setter({ ...value, [lang]: ev.currentTarget.value }); touch(`${field}.${lang}`); }} />
              ) : (
                <input {...common} onChange={(ev) => { setter({ ...value, [lang]: ev.currentTarget.value }); touch(`${field}.${lang}`); }} />
              )}
              <p id={`${fid}-msg`} className={e ? content.error : content.hint} aria-live="polite">{e ? dict.errors[e] : ""}</p>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <form className={content.editor} noValidate onSubmit={(e) => { e.preventDefault(); void onSubmit(); }}>
      {plan?.demo ? <p className={content.status}><span className={styles.demo}>{dict.demo}</span> {p.demoLocked}</p> : null}
      <fieldset className={content.group}>
        <legend>{p.planName}</legend>
        <div className={content.field}>
          <label htmlFor={`${id}-key`} className={content.label}>{p.key}</label>
          <input id={`${id}-key`} data-field="key" className={content.input} value={key} readOnly={plan !== null} maxLength={40} dir="ltr" aria-invalid={err("key") ? true : undefined} aria-describedby={`${id}-key-msg`} onChange={(e) => { setKey(e.currentTarget.value.toLowerCase()); touch("key"); }} />
          <p id={`${id}-key-msg`} className={err("key") ? content.error : content.hint} aria-live="polite">{err("key") ? dict.errors[err("key") ?? "failed"] : plan ? p.keyLocked : p.keyHint}</p>
        </div>
        {pair(p.planName, "name", name, setName, { max: PLAN_LIMITS.name, required: true })}
        {pair(p.summary, "summary", summary, setSummary, { max: PLAN_LIMITS.summary, area: true })}
        {pair(p.eligibility, "eligibility", eligibility, setEligibility, { max: PLAN_LIMITS.eligibility, area: true, hint: p.eligibilityHint })}
      </fieldset>

      <fieldset className={content.group}>
        <legend>{p.price}</legend>
        <div className={content.grid2}>
          <div className={content.field}>
            <label htmlFor={`${id}-price`} className={content.label}>{p.priceLabel}</label>
            <input id={`${id}-price`} data-field="priceMinor" className={content.input} value={price} inputMode="decimal" dir="ltr" aria-invalid={err("priceMinor") ? true : undefined} aria-describedby={`${id}-price-msg`} onChange={(e) => { setPrice(e.currentTarget.value); touch("priceMinor"); }} />
            <p id={`${id}-price-msg`} className={err("priceMinor") ? content.error : content.hint} aria-live="polite">{err("priceMinor") ? dict.errors[err("priceMinor") ?? "failed"] : p.priceHint}</p>
          </div>
          <div className={content.field}>
            <label htmlFor={`${id}-duration`} className={content.label}>{p.durationLabel}</label>
            <input id={`${id}-duration`} data-field="durationMonths" className={content.input} value={duration} inputMode="numeric" dir="ltr" aria-invalid={err("durationMonths") ? true : undefined} aria-describedby={`${id}-duration-msg`} onChange={(e) => { setDuration(e.currentTarget.value); touch("durationMonths"); }} />
            <p id={`${id}-duration-msg`} className={err("durationMonths") ? content.error : content.hint} aria-live="polite">{err("durationMonths") ? dict.errors[err("durationMonths") ?? "failed"] : p.durationHint}</p>
          </div>
        </div>
        <p className={content.pairHint}>{p.snapshotNote}</p>
      </fieldset>

      <fieldset className={content.group}>
        <legend>{p.rules}</legend>
        <p className={content.pairHint}>{p.rulesHint}</p>
        <div className={content.grid2}>
          <div className={content.field}>
            <label htmlFor={`${id}-age`} className={content.label}>{p.minAge}</label>
            <input id={`${id}-age`} className={content.input} value={String(rules.minAge)} inputMode="numeric" dir="ltr" aria-describedby={`${id}-age-msg`} onChange={(e) => { setRule("minAge", whole(e.currentTarget.value, PLAN_LIMITS.minAge)); }} />
            <p id={`${id}-age-msg`} className={content.hint}>{p.minAgeHint}</p>
          </div>
          <div className={content.field}>
            <label htmlFor={`${id}-prior`} className={content.label}>{p.priorMonths}</label>
            <input id={`${id}-prior`} className={content.input} value={String(rules.priorMembershipMonths)} inputMode="numeric" dir="ltr" aria-describedby={`${id}-prior-msg`} onChange={(e) => { setRule("priorMembershipMonths", whole(e.currentTarget.value, PLAN_LIMITS.priorMonths)); }} />
            <p id={`${id}-prior-msg`} className={content.hint}>{p.priorMonthsHint}</p>
          </div>
        </div>
        <label className={styles.planChoice} htmlFor={`${id}-proof`} aria-label={p.studentProof}>
          <input id={`${id}-proof`} type="checkbox" checked={rules.studentProof} onChange={(e) => { setRule("studentProof", e.currentTarget.checked); }} />
          <span className={styles.planBody}><span className={styles.planName}>{p.studentProof}</span></span>
        </label>
        <label className={styles.planChoice} htmlFor={`${id}-ga`} aria-label={p.generalAssembly}>
          <input id={`${id}-ga`} type="checkbox" checked={rules.generalAssembly} onChange={(e) => { setRule("generalAssembly", e.currentTarget.checked); }} />
          <span className={styles.planBody}><span className={styles.planName}>{p.generalAssembly}</span></span>
        </label>
        <label className={styles.planChoice} htmlFor={`${id}-request`} aria-label={p.byRequest}>
          <input id={`${id}-request`} type="checkbox" aria-describedby={`${id}-request-hint`} checked={rules.byRequest} onChange={(e) => { setRule("byRequest", e.currentTarget.checked); }} />
          <span className={styles.planBody}>
            <span className={styles.planName}>{p.byRequest}</span>
            <span id={`${id}-request-hint`} className={styles.planText}>{p.byRequestHint}</span>
          </span>
        </label>
      </fieldset>

      <fieldset className={content.group}>
        <legend>{p.status}</legend>
        <label className={styles.planChoice} htmlFor={`${id}-enabled`} aria-label={p.offer}>
          <input id={`${id}-enabled`} type="checkbox" aria-describedby={`${id}-enabled-hint`} checked={enabled} onChange={(e) => { setEnabled(e.currentTarget.checked); touch("enabled"); }} />
          <span className={styles.planBody}>
            <span className={styles.planName}>{p.offer}</span>
            <span id={`${id}-enabled-hint`} className={styles.planText}>{p.offerHint}</span>
          </span>
        </label>
        <div className={content.field}>
          <label htmlFor={`${id}-order`} className={content.label}>{p.order} <span className={styles.optional}>{dict.optional}</span></label>
          <input id={`${id}-order`} className={content.input} value={order} inputMode="numeric" dir="ltr" aria-describedby={`${id}-order-msg`} onChange={(e) => { setOrder(e.currentTarget.value); touch("sortOrder"); }} />
          <p id={`${id}-order-msg`} className={content.hint}>{p.orderHint}</p>
        </div>
      </fieldset>

      <div className={content.actions}>
        <button type="submit" className="btn btn-primary" aria-busy={busy || undefined}>{busy ? p.saving : p.save}</button>
        <span className={content.spacer} />
        {message ? <p className={content.message} data-tone={message.tone} role={message.tone === "error" ? "alert" : "status"}>{message.text}</p> : null}
      </div>
    </form>
  );
}
