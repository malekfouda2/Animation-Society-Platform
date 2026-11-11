"use client";

import {
  CONTENT_PATHS,
  DRAFT_SCHEMAS,
  POST_TYPES,
  PROJECT_PROGRESS,
  APPROVALS,
  API_BASE_PATH,
  BOARD_MAX,
  GOAL_KEYS,
  MEDIA_MAX_BYTES,
  MEDIA_TYPES,
  FULL_CROP,
  NO_MEDIA,
  isFullCrop,
  apiErrorSchema,
  emptyDraft,
  emptySection,
  mediaUploadedSchema,
  publishIssues,
  slugSchema,
  type AdminEntry,
  type ContentData,
  type ContentKind,
  type ContentState,
  type Locale,
  type MediaRef,
  type PostData,
  type ProjectData,
  type SectionData,
  type SectionKey,
} from "@as/contracts";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { MediaImage } from "@/components/ui/MediaImage";
import type { ContentAdminDict } from "@/i18n/types";
import { callApi, type ApiResult } from "@/lib/client-api";
import styles from "./content.module.css";
import { CropDialog } from "./CropDialog";
import { MediaPickerDialog } from "./MediaLibrary";

type ErrorKey = keyof ContentAdminDict["errors"];
type Busy = null | "save" | "publish" | "unpublish" | "delete";
type Message = { tone: "ok" | "error"; text: string } | null;
type Pair = { ar: string; en: string };

export interface EditorOptions {
  fields: { value: string; label: string }[];
  covers: { key: string; src: string }[];
}

/** Dotted path ("title.ar") to the input's id. */
const idOf = (path: string) => `cf-${path.replace(/\./g, "-")}`;

function focusPath(path: string) {
  const el = document.getElementById(idOf(path));
  el?.focus();
  el?.scrollIntoView({ block: "center" });
}

function getPath(data: ContentData, path: string): unknown {
  return path.split(".").reduce<unknown>((v, k) => (v as Record<string, unknown> | undefined)?.[k], data);
}

/** Immutable update at a dotted path ("members.2.name.ar"); numeric parts index arrays. */
function setIn(target: unknown, keys: string[], value: unknown): unknown {
  const [k, ...rest] = keys;
  if (k === undefined) return value;
  if (Array.isArray(target)) {
    const copy = (target as unknown[]).slice();
    copy[Number(k)] = setIn(copy[Number(k)], rest, value);
    return copy;
  }
  const record = target as Record<string, unknown>;
  return { ...record, [k]: setIn(record[k], rest, value) };
}
function setPath<T extends ContentData>(data: T, path: string, value: unknown): T {
  return setIn(data, path.split("."), value) as T;
}

function issuesOf(kind: ContentKind, data: ContentData): Record<string, string> {
  const r = DRAFT_SCHEMAS[kind].safeParse(data);
  const out: Record<string, string> = {};
  if (!r.success) for (const i of r.error.issues) out[i.path.join(".")] ??= i.message;
  return out;
}

/**
 * Bilingual editor for one entry. Arabic and English sit side by side, each in its own direction,
 * because a published entry needs both. Saving keeps a private draft; publishing (which saves first)
 * copies it to the site. Validation shows on leaving a field and clears on return; buttons stay enabled.
 */
export function ContentEditor({
  locale,
  kind,
  dict,
  initial,
  options,
  sectionKey,
}: {
  locale: Locale;
  kind: ContentKind;
  dict: ContentAdminDict;
  initial: AdminEntry | null;
  options: EditorOptions;
  /** For a page section that has never been written: which one. */
  sectionKey?: SectionKey;
}) {
  const path = CONTENT_PATHS[kind];
  const [id, setId] = useState(initial?.id ?? null);
  const [slug, setSlug] = useState(initial?.slug ?? sectionKey ?? "");
  const [data, setData] = useState<ContentData>(() => {
    if (!initial) return kind === "section" ? emptySection(sectionKey ?? "hero") : emptyDraft(kind);
    // Drafts saved before a field existed get its default (e.g. no image).
    const parsed = DRAFT_SCHEMAS[kind].safeParse(initial.draft);
    return parsed.success ? parsed.data : initial.draft;
  });
  const [uploading, setUploading] = useState<string | null>(null);
  /** Which image field has the library picker or the crop tool open. */
  const [picking, setPicking] = useState<string | null>(null);
  const [cropping, setCropping] = useState<string | null>(null);
  const [version, setVersion] = useState(initial?.version ?? 0);
  const [state, setState] = useState<ContentState>(initial?.state ?? "draft");
  const [everPublished, setEverPublished] = useState(initial?.everPublished ?? false);
  const [unsaved, setUnsaved] = useState(initial === null);
  const [errors, setErrors] = useState<Record<string, ErrorKey>>({});
  const [busy, setBusy] = useState<Busy>(null);
  const [message, setMessage] = useState<Message>(null);
  const [confirming, setConfirming] = useState(false);
  const keepRef = useRef<HTMLButtonElement>(null);
  // Opening the delete confirmation moves focus to its safe choice.
  useEffect(() => {
    if (confirming) keepRef.current?.focus();
  }, [confirming]);

  const errorKey = (k: string | undefined): ErrorKey => (k && k in dict.errors ? (k as ErrorKey) : "failed");
  const clear = (p: string) => {
    if (errors[p]) setErrors(({ [p]: _gone, ...rest }) => rest);
  };
  const edit = (p: string, value: unknown) => {
    setData((d) => setPath(d, p, value));
    setUnsaved(true);
    setMessage(null);
    clear(p);
  };
  /** Format errors only (empty is fine in a draft); "required" is checked when publishing. */
  const blur = (p: string, value: string) => {
    if (value === "") return;
    if (p === "slug") {
      const r = slugSchema.safeParse(value);
      if (!r.success) setErrors((e) => ({ ...e, slug: errorKey(r.error.issues[0]?.message) }));
      return;
    }
    const issue = issuesOf(kind, setPath(data, p, value))[p];
    if (issue) setErrors((e) => ({ ...e, [p]: errorKey(issue) }));
  };

  function showFieldErrors(fields: Record<string, string | string[] | undefined>, text: string) {
    const next: Record<string, ErrorKey> = {};
    for (const [k, v] of Object.entries(fields)) next[k] = errorKey(Array.isArray(v) ? v[0] : v);
    setErrors(next);
    setMessage({ tone: "error", text });
    const first = Object.keys(next)[0];
    if (first) focusPath(first);
  }

  function failure(r: Extract<ApiResult<unknown>, { ok: false }>, blocked = false) {
    if (r.code === "validation_failed" && r.fields["media"]) {
      setMessage({ tone: "error", text: dict.errors.media_missing });
      return;
    }
    if (r.code === "validation_failed" && Object.keys(r.fields).length > 0) {
      showFieldErrors(r.fields, blocked ? dict.messages.publishBlocked : dict.messages.fixFields);
      return;
    }
    const m = dict.messages;
    const text =
      r.code === "conflict" ? m.conflict
        : r.code === "forbidden" ? m.forbidden
          : r.code === "unauthenticated" || r.code === "mfa_required" ? m.sessionEnded
            : r.code === "network" ? m.network
              : m.failed;
    setMessage({ tone: "error", text });
  }

  /** Uploads a picture straight away (it stays private until the entry is published). */
  async function uploadTo(p: string, file: File) {
    clear(p);
    if (!(MEDIA_TYPES as readonly string[]).includes(file.type)) {
      setErrors((e) => ({ ...e, [p]: "media_type" }));
      return;
    }
    if (file.size > MEDIA_MAX_BYTES) {
      setErrors((e) => ({ ...e, [p]: "media_too_large" }));
      return;
    }
    setUploading(p);
    setMessage(null);
    try {
      const res = await fetch(`${API_BASE_PATH}/admin/media`, { method: "POST", credentials: "same-origin", headers: { "Content-Type": file.type }, body: file });
      const json: unknown = await res.json().catch(() => null);
      if (res.status === 413) {
        setErrors((e) => ({ ...e, [p]: "media_too_large" }));
        return;
      }
      if (!res.ok) {
        const parsed = apiErrorSchema.safeParse(json);
        const code = parsed.success ? parsed.data.error.code : "internal_error";
        const field = parsed.success ? parsed.data.error.fields?.["file"]?.[0] : undefined;
        if (field) setErrors((e) => ({ ...e, [p]: errorKey(field) }));
        else failure({ ok: false, status: res.status, code, fields: {} });
        return;
      }
      const up = mediaUploadedSchema.parse(json);
      const current = getPath(data, p) as MediaRef;
      // A new picture gets a fresh crop and description.
      edit(p, { ...current, id: up.id, width: up.width, height: up.height, crop: { ...FULL_CROP }, alt: { ar: "", en: "" } });
      setMessage({ tone: "ok", text: dict.media.uploaded });
      // Next step: describe it.
      requestAnimationFrame(() => { document.getElementById(idOf(`${p}.alt.ar`))?.focus(); });
    } catch {
      setMessage({ tone: "error", text: dict.messages.network });
    } finally {
      setUploading(null);
    }
  }

  function apply(entry: AdminEntry) {
    setId(entry.id);
    setVersion(entry.version);
    setState(entry.state);
    setEverPublished(entry.everPublished);
    setSlug(entry.slug);
    setUnsaved(false);
  }

  /** Saves the draft; returns the saved entry, or null when it failed (with errors shown). */
  async function save(): Promise<AdminEntry | null> {
    const local: Record<string, string> = issuesOf(kind, data);
    const s = slugSchema.safeParse(slug);
    if (!s.success) local["slug"] = slug === "" ? "slug" : (s.error.issues[0]?.message ?? "slug");
    if (Object.keys(local).length > 0) {
      showFieldErrors(local, dict.messages.fixFields);
      return null;
    }
    const r = id
      ? await callApi<AdminEntry>("PATCH", `/admin/content/${path}/${id}`, { version, slug: s.data, data })
      : await callApi<AdminEntry>("POST", `/admin/content/${path}`, { slug: s.data, data });
    if (!r.ok) {
      failure(r);
      return null;
    }
    if (!id) window.history.replaceState(null, "", `/${locale}/admin/content/${path}/${r.data.id}`);
    apply(r.data);
    return r.data;
  }

  async function run(kindOfAction: Exclude<Busy, null>, fn: () => Promise<void>) {
    if (busy) return;
    setBusy(kindOfAction);
    setMessage(null);
    try {
      await fn();
    } finally {
      setBusy(null);
    }
  }

  const onSave = () => run("save", async () => {
    const wasNew = id === null;
    const saved = await save();
    if (saved) setMessage({ tone: "ok", text: wasNew ? dict.messages.created : dict.messages.saved });
  });

  const onPublish = () => run("publish", async () => {
    const blocking = publishIssues(kind, data);
    let entry: AdminEntry | null = null;
    if (unsaved || !id) {
      entry = await save();
      if (!entry) return;
    }
    if (Object.keys(blocking).length > 0) {
      showFieldErrors(blocking, dict.messages.publishBlocked);
      return;
    }
    const r = await callApi<AdminEntry>("POST", `/admin/content/${path}/${entry?.id ?? id}/publish`, { version: entry?.version ?? version });
    if (!r.ok) {
      failure(r, true);
      return;
    }
    apply(r.data);
    setErrors({});
    setMessage({ tone: "ok", text: dict.messages.published });
  });

  const onUnpublish = () => run("unpublish", async () => {
    const r = await callApi<AdminEntry>("POST", `/admin/content/${path}/${id}/unpublish`, { version });
    if (!r.ok) {
      failure(r);
      return;
    }
    apply(r.data);
    setMessage({ tone: "ok", text: dict.messages.unpublished });
  });

  const onDelete = () => run("delete", async () => {
    const r = await callApi("DELETE", `/admin/content/${path}/${id}?version=${version}`);
    if (!r.ok) {
      setConfirming(false);
      failure(r);
      return;
    }
    window.location.assign(`/${locale}/admin/content/${path}`);
  });

  // Field builders. Plain functions (not components) so inputs keep focus while typing. --------
  const err = (p: string) => errors[p];
  const describe = (p: string) => `${idOf(p)}-msg`;

  function message_({ p, hint }: { p: string; hint?: string }) {
    const e = err(p);
    return (
      <p id={describe(p)} className={e ? styles.error : styles.hint} aria-live="polite">
        {e ? dict.errors[e] : hint ?? ""}
      </p>
    );
  }

  function text({ p, label, hint, type = "text", dir, readOnly }: { p: string; label: string; hint?: string; type?: string; dir?: "ltr" | "rtl"; readOnly?: boolean }) {
    const raw = p === "slug" ? slug : getPath(data, p);
    const value = typeof raw === "string" ? raw : "";
    return (
      <div className={styles.field}>
        <label htmlFor={idOf(p)} className={styles.label}>{label}</label>
        <input
          id={idOf(p)}
          name={p}
          type={type}
          dir={dir}
          className={styles.input}
          value={value}
          readOnly={readOnly}
          aria-invalid={err(p) ? true : undefined}
          aria-describedby={describe(p)}
          onChange={(e) => {
            if (p === "slug") {
              setSlug(e.currentTarget.value);
              setUnsaved(true);
              clear("slug");
            } else edit(p, e.currentTarget.value);
          }}
          onBlur={(e) => { blur(p, e.currentTarget.value); }}
          onFocus={() => { clear(p); }}
        />
        {message_({ p, ...(hint ? { hint } : {}) })}
      </div>
    );
  }

  function choice({ p, label, hint, options: opts }: { p: string; label: string; hint?: string; options: readonly { value: string; label: string }[] }) {
    return (
      <div className={styles.field}>
        <label htmlFor={idOf(p)} className={styles.label}>{label}</label>
        <select id={idOf(p)} name={p} className={styles.input} value={String(getPath(data, p))} aria-describedby={describe(p)} onChange={(e) => { edit(p, e.currentTarget.value); }}>
          {opts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        {message_({ p, ...(hint ? { hint } : {}) })}
      </div>
    );
  }

  /** One label, Arabic and English inputs. */
  function bilingual({ name, label, hint, multiline, long }: { name: string; label: string; hint?: string; multiline?: boolean; long?: boolean }) {
    const value = getPath(data, name) as Pair;
    return (
      <div className={styles.pair} role="group" aria-labelledby={`${idOf(name)}-label`}>
        <span id={`${idOf(name)}-label`} className={styles.pairLabel}>{label}</span>
        {hint ? <p className={styles.pairHint}>{hint}</p> : null}
        <div className={styles.pairFields}>
          {(["ar", "en"] as const).map((lang) => {
            const p = `${name}.${lang}`;
            const common = {
              id: idOf(p),
              name: p,
              lang,
              dir: lang === "ar" ? ("rtl" as const) : ("ltr" as const),
              className: `${styles.input}${long ? ` ${styles.body}` : ""}`,
              value: value[lang],
              "aria-invalid": err(p) ? true : undefined,
              "aria-describedby": describe(p),
              onFocus: () => { clear(p); },
            };
            return (
              <div key={lang} className={styles.field}>
                <label htmlFor={idOf(p)} className={styles.langLabel}>{dict.langs[lang]}</label>
                {multiline ? (
                  <textarea {...common} onChange={(e) => { edit(p, e.currentTarget.value); }} onBlur={(e) => { blur(p, e.currentTarget.value); }} />
                ) : (
                  <input {...common} type="text" onChange={(e) => { edit(p, e.currentTarget.value); }} onBlur={(e) => { blur(p, e.currentTarget.value); }} />
                )}
                {message_({ p })}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  /** An uploaded picture: preview, upload/replace, remove, and its description in both languages. */
  function media({ p, label }: { p: string; label: string }) {
    const ref = getPath(data, p) as MediaRef;
    const inputId = idOf(`${p}.file`);
    const busyHere = uploading === p;
    return (
      <div className={styles.media} role="group" aria-labelledby={`${idOf(p)}-label`}>
        <span id={`${idOf(p)}-label`} className={styles.pairLabel}>{label}</span>
        <div className={styles.mediaRow}>
          {ref.id ? (
            <span className={styles.mediaPreview}>
              <MediaImage media={{ ...ref, alt: { ar: "", en: "" } }} locale={locale} fit="contain" />
            </span>
          ) : (
            <span className={styles.mediaEmpty} aria-hidden="true" />
          )}
          <div className={styles.mediaActions}>
            <input
              id={inputId}
              className={styles.fileInput}
              type="file"
              accept={MEDIA_TYPES.join(",")}
              aria-describedby={describe(p)}
              onChange={(e) => {
                const file = e.currentTarget.files?.[0];
                e.currentTarget.value = "";
                if (file) void uploadTo(p, file);
              }}
            />
            <label htmlFor={inputId} id={idOf(p)} tabIndex={-1} className={`btn btn-secondary ${styles.fileButton}`} aria-busy={busyHere || undefined}>
              {busyHere ? dict.media.uploading : ref.id ? dict.media.replace : dict.media.upload}
            </label>
            <button type="button" className="btn btn-secondary" onClick={() => { setPicking(p); }}>{dict.media.choose}</button>
            {ref.id && ref.width > 0 ? (
              <button type="button" className="btn btn-secondary" onClick={() => { setCropping(p); }}>
                {dict.media.crop}
                <span className={styles.cropState}>{isFullCrop(ref.crop) ? dict.media.full : dict.media.cropped}</span>
              </button>
            ) : null}
            {ref.id ? (
              <button type="button" className={`btn ${styles.danger}`} onClick={() => { edit(p, { ...NO_MEDIA, alt: { ar: "", en: "" }, crop: { ...FULL_CROP } }); }}>{dict.media.remove}</button>
            ) : null}
          </div>
        </div>
        {message_({ p, hint: dict.media.imageHint })}
        {ref.id ? bilingual({ name: `${p}.alt`, label: dict.media.alt, hint: dict.media.altHint }) : null}
      </div>
    );
  }

  const sf = dict.sectionFields;
  function sectionFields(d: SectionData): ReactNode {
    switch (d.section) {
      case "hero":
        return <>{bilingual({ name: "title", label: sf.heroTitle })}{bilingual({ name: "body", label: sf.heroBody, multiline: true })}</>;
      case "about":
        return <>{bilingual({ name: "intro", label: sf.intro, multiline: true })}{bilingual({ name: "aims", label: sf.aims, hint: sf.aimsHint, multiline: true })}</>;
      case "vision":
        return <>{bilingual({ name: "vision", label: sf.vision, multiline: true })}{bilingual({ name: "mission", label: sf.mission, hint: sf.missionHint, multiline: true })}</>;
      case "goals":
        return (
          <>
            <p className={styles.pairHint}>{sf.goalsHint}</p>
            {GOAL_KEYS.map((k) => <div key={k}>{bilingual({ name: k, label: sf.goals[k], multiline: true })}</div>)}
          </>
        );
      case "assembly":
        return <>{bilingual({ name: "body", label: sf.assemblyBody, multiline: true, long: true })}{bilingual({ name: "votingNote", label: sf.votingNote, hint: sf.votingNoteHint, multiline: true })}</>;
      case "board":
        return (
          <div className={styles.members}>
            <p className={styles.pairHint}>{sf.membersHint}</p>
            {d.members.length === 0 ? <p className={styles.hint}>{sf.noMembers}</p> : null}
            <ol className={styles.memberList}>
              {d.members.map((m, i) => {
                const label = m.name[locale] || m.name.en || m.name.ar || sf.memberN.replace("{n}", String(i + 1));
                return (
                  // eslint-disable-next-line @eslint-react/no-array-index-key -- members are edited in place; position is their identity in the form
                  <li key={i} className={styles.member}>
                    <div className={styles.memberHead}>
                      <span className={styles.label}>{sf.memberN.replace("{n}", String(i + 1))}</span>
                      <button type="button" className={`btn ${styles.danger}`} onClick={() => { edit("members", d.members.filter((_, j) => j !== i)); }}>
                        {sf.removeMember.replace("{name}", label)}
                      </button>
                    </div>
                    {bilingual({ name: `members.${i}.name`, label: sf.memberName })}
                    {bilingual({ name: `members.${i}.role`, label: sf.memberRole })}
                    {media({ p: `members.${i}.portrait`, label: sf.portrait })}
                  </li>
                );
              })}
            </ol>
            {d.members.length < BOARD_MAX ? (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  edit("members", [...d.members, { name: { ar: "", en: "" }, role: { ar: "", en: "" }, portrait: { ...NO_MEDIA, alt: { ar: "", en: "" } } }]);
                  requestAnimationFrame(() => { document.getElementById(idOf(`members.${d.members.length}.name.ar`))?.focus(); });
                }}
              >
                {sf.addMember}
              </button>
            ) : null}
          </div>
        );
      default:
        return bilingual({ name: "body", label: sf.policyBody, hint: sf.policyHint, multiline: true, long: true });
    }
  }

  const f = dict.fields;
  const approval = choice({ p: "approval", label: f.approval, hint: f.approvalHint, options: APPROVALS.map((a) => ({ value: a, label: dict.approvals[a] })) });
  const slugField = text({ p: "slug", label: f.slug, hint: everPublished ? f.slugLocked : f.slugHint, dir: "ltr", readOnly: everPublished });

  let details: ReactNode;
  let texts: ReactNode;
  if (kind === "post") {
    const d = data as PostData;
    details = (
      <div className={styles.grid2}>
        {choice({ p: "postType", label: f.postType, options: POST_TYPES.map((t) => ({ value: t, label: dict.postTypes[t] })) })}
        {text({ p: "date", label: f.date, hint: f.dateHint, type: "date", dir: "ltr" })}
        {slugField}
        {approval}
        {d.postType === "event" ? text({ p: "registrationUrl", label: f.registrationUrl, hint: f.urlHint, type: "url", dir: "ltr" }) : null}
      </div>
    );
    texts = (
      <>
        {bilingual({ name: "title", label: f.title })}
        {bilingual({ name: "summary", label: f.summary, multiline: true })}
        {bilingual({ name: "body", label: f.body, hint: f.bodyHint, multiline: true, long: true })}
        {d.postType === "event" ? bilingual({ name: "location", label: f.location, hint: f.locationHint }) : null}
        {media({ p: "image", label: dict.media.image })}
      </>
    );
  } else if (kind === "project") {
    const d = data as ProjectData;
    details = (
      <>
        <div className={styles.grid2}>
          {slugField}
          {approval}
          {choice({ p: "field", label: f.field, options: options.fields })}
          {choice({ p: "progress", label: f.progress, options: PROJECT_PROGRESS.map((p) => ({ value: p, label: dict.progress[p] })) })}
          {text({ p: "externalUrl", label: f.externalUrl, hint: f.urlHint, type: "url", dir: "ltr" })}
        </div>
        <CoverPicker dict={dict} covers={options.covers} value={d.cover} onChange={(v) => { edit("cover", v); }} />
      </>
    );
    texts = (
      <>
        {bilingual({ name: "title", label: f.title })}
        {bilingual({ name: "summary", label: f.summary, multiline: true })}
        {bilingual({ name: "body", label: f.body, hint: f.bodyHint, multiline: true, long: true })}
        {bilingual({ name: "progressLabel", label: f.progressLabel, hint: f.progressLabelHint })}
        {media({ p: "image", label: dict.media.image })}
      </>
    );
  } else if (kind === "section") {
    const d = data as SectionData;
    details = (
      <div className={styles.grid2}>
        <div className={styles.field}>
          <span className={styles.label}>{dict.sectionTable.where}</span>
          <p className={styles.fixedValue}>{dict.pageSections[d.section].where}</p>
        </div>
        {approval}
      </div>
    );
    texts = sectionFields(d);
  } else {
    details = (
      <div className={styles.grid2}>
        {slugField}
        {approval}
        {text({ p: "url", label: f.url, hint: f.urlHint, type: "url", dir: "ltr" })}
      </div>
    );
    texts = (
      <>
        {bilingual({ name: "title", label: f.name })}
        {media({ p: "logo", label: dict.media.logo })}
      </>
    );
  }

  const a = dict.actions;
  const sectionName = kind === "section" ? dict.pageSections[(data as SectionData).section].name : null;
  const titled = "title" in data && !("section" in data) ? data.title : null;
  const title = sectionName ?? (titled ? (titled.en || titled.ar).trim() : "");
  const viewHref = viewHrefFor(locale, kind, slug);

  const listHref = `/${locale}/admin/content/${path}`;
  const showPublish = state !== "published" || unsaved;

  return (
    <>
    <div className={styles.head}>
      <div>
        <p><Link href={listHref}>{a.back}</Link></p>
        {/* The heading follows the entry: a new one becomes "Edit" once its draft is saved. */}
        <h1>{sectionName ?? (id ? dict.kinds[kind].editTitle : dict.kinds[kind].newTitle)}</h1>
        {sectionName ? <p className={styles.lead}>{dict.kinds.section.lead}</p> : id ? null : <p className={styles.lead}>{dict.kinds[kind].lead}</p>}
      </div>
    </div>
    <form className={styles.editor} noValidate onSubmit={(e) => { e.preventDefault(); void onSave(); }}>
      <div className={styles.status} role="status">
        <span className={styles.state} data-state={state}>{dict.states[state]}</span>
        <p>{dict.stateHelp[state]}</p>
        {state !== "draft" ? <a href={viewHref} target="_blank" rel="noopener">{a.view}</a> : null}
      </div>

      <fieldset className={styles.group}>
        <legend>{dict.sections.details}</legend>
        {details}
      </fieldset>
      <fieldset className={styles.group}>
        <legend>{dict.sections.text}</legend>
        {texts}
      </fieldset>

      {confirming ? (
        <div className={styles.confirm} role="alertdialog" aria-labelledby="cf-confirm-title" aria-describedby="cf-confirm-body">
          <p id="cf-confirm-title" className={styles.confirmTitle}>{a.confirmDelete.replace("{title}", title || dict.table.untitled)}</p>
          <p id="cf-confirm-body">{dict.actions.confirmDeleteBody}</p>
          <div className={styles.confirmRow}>
            <button type="button" className={`btn ${styles.danger}`} onClick={() => { void onDelete(); }} aria-busy={busy === "delete" || undefined}>
              {busy === "delete" ? a.deleting : a.delete}
            </button>
            <button ref={keepRef} type="button" className="btn btn-secondary" onClick={() => { setConfirming(false); }}>{a.keep}</button>
          </div>
        </div>
      ) : null}

      {picking ? (
        <MediaPickerDialog
          dict={dict}
          locale={locale}
          onClose={() => { setPicking(null); }}
          onPick={(item) => {
            const target = picking;
            const current = getPath(data, target) as MediaRef;
            const same = current.id === item.id;
            edit(target, { id: item.id, width: item.width, height: item.height, crop: same ? current.crop : { ...FULL_CROP }, alt: same ? current.alt : { ar: "", en: "" } });
            setPicking(null);
            requestAnimationFrame(() => { document.getElementById(idOf(`${target}.alt.ar`))?.focus(); });
          }}
        />
      ) : null}
      {cropping ? (() => {
        const target = cropping;
        const ref = getPath(data, target) as MediaRef;
        return (
          <CropDialog
            src={`${API_BASE_PATH}/media/${ref.id}`}
            width={ref.width}
            height={ref.height}
            initial={ref.crop}
            dict={dict}
            onClose={() => { setCropping(null); }}
            onApply={(crop) => {
              edit(`${target}.crop`, crop);
              setCropping(null);
              requestAnimationFrame(() => { document.getElementById(idOf(target))?.focus(); });
            }}
          />
        );
      })() : null}

      <div className={styles.actions}>
        <button type="submit" className="btn btn-secondary" aria-busy={busy === "save" || undefined}>
          {busy === "save" ? a.saving : a.save}
        </button>
        {showPublish ? (
          <button type="button" className="btn btn-primary" onClick={() => { void onPublish(); }} aria-busy={busy === "publish" || undefined}>
            {busy === "publish" ? a.publishing : state === "draft" ? a.publish : a.publishChanges}
          </button>
        ) : null}
        {state !== "draft" ? (
          <button type="button" className="btn btn-secondary" onClick={() => { void onUnpublish(); }} aria-busy={busy === "unpublish" || undefined}>
            {busy === "unpublish" ? a.unpublishing : a.unpublish}
          </button>
        ) : null}
        <span className={styles.spacer} />
        {message ? <p className={styles.message} data-tone={message.tone} role={message.tone === "error" ? "alert" : "status"}>{message.text}</p> : null}
        {id && state === "draft" && !confirming && kind !== "section" ? (
          <button type="button" className={`btn ${styles.danger}`} onClick={() => { setConfirming(true); }}>{a.delete}</button>
        ) : null}
      </div>
    </form>
    </>
  );
}

/** Where an entry shows on the public site. */
function viewHrefFor(locale: Locale, kind: ContentKind, slug: string): string {
  if (kind === "partner") return `/${locale}/partners`;
  if (kind === "post") return `/${locale}/news/${slug}`;
  if (kind === "project") return `/${locale}/projects/${slug}`;
  if (slug.startsWith("policy-")) return `/${locale}/policies#${slug.slice("policy-".length)}`;
  if (slug === "hero") return `/${locale}`;
  return `/${locale}/about`;
}

/** Covers as a row of thumbnails (radio buttons): the picture is the choice. */
function CoverPicker({ dict, covers, value, onChange }: { dict: ContentAdminDict; covers: EditorOptions["covers"]; value: string; onChange: (v: string) => void }) {
  return (
    <fieldset className={styles.covers}>
      <legend className={styles.label}>{dict.fields.cover}</legend>
      <p className={styles.hint}>{dict.fields.coverHint}</p>
      <div className={styles.coverRow}>
        {covers.map((c, i) => (
          <label key={c.key} className={styles.cover}>
            <input type="radio" name="cover" value={c.key} checked={value === c.key} onChange={() => { onChange(c.key); }} aria-label={`${dict.fields.cover} ${i + 1}`} />
            <Image src={c.src} alt="" width={120} height={72} sizes="120px" />
          </label>
        ))}
      </div>
    </fieldset>
  );
}
