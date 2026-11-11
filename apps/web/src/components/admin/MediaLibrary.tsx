"use client";

import { API_BASE_PATH, MEDIA_MAX_BYTES, MEDIA_TYPES, apiErrorSchema, mediaListSchema, type Locale, type MediaItem } from "@as/contracts";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ContentAdminDict } from "@/i18n/types";
import { callApi } from "@/lib/client-api";
import styles from "./media.module.css";

type Filter = "all" | "unused";
type Load = { state: "loading" } | { state: "failed" } | { state: "ready"; items: MediaItem[]; next: string | null };

const thumb = (id: string) => `${API_BASE_PATH}/media/${id}`;

/** Loads the library one page at a time (newest first). */
function useLibrary(filter: Filter) {
  const [load, setLoad] = useState<Load>({ state: "loading" });
  const fetchPage = useCallback(async (before: string | null) => {
    const q = new URLSearchParams({ filter, ...(before ? { before } : {}) });
    const r = await callApi("GET", `/admin/media?${q.toString()}`);
    const parsed = r.ok ? mediaListSchema.safeParse(r.data) : null;
    return parsed?.success ? parsed.data : null;
  }, [filter]);

  const reload = useCallback(async () => {
    setLoad({ state: "loading" });
    const page = await fetchPage(null);
    setLoad(page ? { state: "ready", ...page } : { state: "failed" });
  }, [fetchPage]);

  useEffect(() => {
    let live = true;
    void fetchPage(null).then((page) => {
      if (live) setLoad(page ? { state: "ready", ...page } : { state: "failed" });
    });
    return () => { live = false; };
  }, [fetchPage]);

  const more = async () => {
    if (load.state !== "ready" || !load.next) return;
    const page = await fetchPage(load.next);
    if (page) setLoad({ state: "ready", items: [...load.items, ...page.items], next: page.next });
  };
  const drop = (id: string) => {
    if (load.state === "ready") setLoad({ ...load, items: load.items.filter((i) => i.id !== id) });
  };
  return { load, reload, more, drop };
}

function describeItem(item: MediaItem, dict: ContentAdminDict, fmt: Intl.DateTimeFormat) {
  const l = dict.library;
  return {
    size: l.size.replace("{w}", String(item.width)).replace("{h}", String(item.height)),
    date: l.uploaded.replace("{date}", fmt.format(new Date(item.createdAt))),
    uses: item.uses === 0 ? l.unused : item.uses === 1 ? l.usesOne : l.uses.replace("{n}", String(item.uses)),
  };
}

const dateFormat = (locale: Locale) =>
  new Intl.DateTimeFormat(locale === "ar" ? "ar-SA-u-nu-latn-ca-gregory" : "en-GB", { dateStyle: "medium", timeZone: "Asia/Riyadh" });

/** Picker in a modal dialog: choose an already uploaded image for this place. */
export function MediaPickerDialog({ dict, locale, onPick, onClose }: { dict: ContentAdminDict; locale: Locale; onPick: (item: MediaItem) => void; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { load, more } = useLibrary("all");
  const l = dict.library;
  const fmt = dateFormat(locale);

  useEffect(() => {
    const d = dialogRef.current;
    if (d && !d.open) d.showModal();
    return () => { d?.close(); };
  }, []);

  return (
    <dialog ref={dialogRef} className={`${styles.dialog} ${styles.picker}`} aria-labelledby="pick-title" aria-describedby="pick-lead" onClose={onClose}>
      <div className={styles.dialogHead}>
        <h2 id="pick-title">{l.pickTitle}</h2>
        <p id="pick-lead">{l.pickLead}</p>
      </div>
      {load.state === "loading" ? <p aria-busy="true">{l.loading}</p> : null}
      {load.state === "failed" ? <p role="alert">{l.failed}</p> : null}
      {load.state === "ready" && load.items.length === 0 ? <p>{l.empty.body}</p> : null}
      {load.state === "ready" && load.items.length > 0 ? (
        <ul className={styles.grid}>
          {load.items.map((item) => {
            const d = describeItem(item, dict, fmt);
            return (
              <li key={item.id}>
                <button type="button" className={styles.pick} onClick={() => { onPick(item); }} aria-label={`${l.use}: ${d.size}, ${d.date}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- staff thumbnail served by the API */}
                  <img src={thumb(item.id)} alt="" width={item.width} height={item.height} loading="lazy" className={styles.thumb} />
                  <span className={styles.meta}>{d.size}</span>
                  <span className={styles.meta}>{d.date}</span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
      <div className={styles.dialogActions}>
        {load.state === "ready" && load.next ? <button type="button" className="btn btn-secondary" onClick={() => { void more(); }}>{l.more}</button> : null}
        <button type="button" className="btn btn-secondary" onClick={onClose}>{l.close}</button>
      </div>
    </dialog>
  );
}

/** The Media page: every upload with where it's used; unused ones can be deleted. */
export function MediaManager({ dict, locale, filter }: { dict: ContentAdminDict; locale: Locale; filter: Filter }) {
  const { load, reload, more, drop } = useLibrary(filter);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const keepRef = useRef<HTMLButtonElement>(null);
  const l = dict.library;
  const fmt = dateFormat(locale);

  useEffect(() => {
    if (confirming) keepRef.current?.focus();
  }, [confirming]);

  async function remove(id: string) {
    setBusy(id);
    const r = await callApi("DELETE", `/admin/media/${id}`);
    setBusy(null);
    setConfirming(null);
    if (r.ok) {
      drop(id);
      setMessage({ tone: "ok", text: l.deleted });
    } else {
      setMessage({ tone: "error", text: r.code === "conflict" ? l.inUse : dict.messages.failed });
      void reload();
    }
  }

  async function upload(file: File) {
    setMessage(null);
    if (!(MEDIA_TYPES as readonly string[]).includes(file.type)) {
      setMessage({ tone: "error", text: dict.errors.media_type });
      return;
    }
    if (file.size > MEDIA_MAX_BYTES) {
      setMessage({ tone: "error", text: dict.errors.media_too_large });
      return;
    }
    setBusy("upload");
    try {
      const res = await fetch(`${API_BASE_PATH}/admin/media`, { method: "POST", credentials: "same-origin", headers: { "Content-Type": file.type }, body: file });
      if (res.ok) {
        setMessage({ tone: "ok", text: l.added });
        void reload();
        return;
      }
      const parsed = apiErrorSchema.safeParse(await res.json().catch(() => null));
      const key = res.status === 413 ? "media_too_large" : parsed.success ? parsed.data.error.fields?.["file"]?.[0] : undefined;
      setMessage({ tone: "error", text: key && key in dict.errors ? dict.errors[key as keyof typeof dict.errors] : dict.messages.failed });
    } catch {
      setMessage({ tone: "error", text: dict.messages.network });
    } finally {
      setBusy(null);
    }
  }

  const empty = filter === "unused" ? l.unusedEmpty : l.empty;
  return (
    <>
      <div className={styles.bar}>
        <nav aria-label={l.title} className={styles.filters}>
          {(["all", "unused"] as const).map((f) => (
            <a key={f} href={`/${locale}/admin/media${f === "all" ? "" : "?filter=unused"}`} aria-current={filter === f ? "page" : undefined} className={styles.filter}>
              {l.filters[f]}
            </a>
          ))}
        </nav>
        <span className={styles.spacer} />
        <input id="library-upload" className={styles.fileInput} type="file" accept={MEDIA_TYPES.join(",")} onChange={(e) => {
          const file = e.currentTarget.files?.[0];
          e.currentTarget.value = "";
          if (file) void upload(file);
        }} />
        <label htmlFor="library-upload" className={`btn btn-primary ${styles.fileButton}`} aria-busy={busy === "upload" || undefined}>
          {busy === "upload" ? dict.media.uploading : dict.media.upload}
        </label>
      </div>
      {message ? <p className={styles.message} data-tone={message.tone} role={message.tone === "error" ? "alert" : "status"}>{message.text}</p> : null}

      {load.state === "loading" ? <p aria-busy="true">{l.loading}</p> : null}
      {load.state === "failed" ? <p role="alert">{l.failed}</p> : null}
      {load.state === "ready" && load.items.length === 0 ? (
        <section className={styles.empty} aria-labelledby="media-empty">
          <h2 id="media-empty">{empty.title}</h2>
          <p>{empty.body}</p>
        </section>
      ) : null}
      {load.state === "ready" && load.items.length > 0 ? (
        <ul className={styles.grid}>
          {load.items.map((item) => {
            const d = describeItem(item, dict, fmt);
            return (
              <li key={item.id} className={styles.card}>
                {/* eslint-disable-next-line @next/next/no-img-element -- staff thumbnail served by the API */}
                <img src={thumb(item.id)} alt="" width={item.width} height={item.height} loading="lazy" className={styles.thumb} />
                <span className={styles.usage} data-used={item.uses > 0 || undefined}>{d.uses}</span>
                <span className={styles.meta}>{d.size}</span>
                <span className={styles.meta}>{d.date}</span>
                {item.uses === 0 ? (
                  confirming === item.id ? (
                    <div className={styles.confirm} role="alertdialog" aria-labelledby={`del-${item.id}`} aria-describedby={`del-${item.id}-body`}>
                      <p id={`del-${item.id}`} className={styles.confirmTitle}>{l.confirmDelete}</p>
                      <p id={`del-${item.id}-body`}>{l.confirmBody}</p>
                      <div className={styles.confirmRow}>
                        <button type="button" className={`btn ${styles.danger}`} onClick={() => { void remove(item.id); }} aria-busy={busy === item.id || undefined}>
                          {busy === item.id ? l.deleting : l.delete}
                        </button>
                        <button ref={keepRef} type="button" className="btn btn-secondary" onClick={() => { setConfirming(null); }}>{l.keep}</button>
                      </div>
                    </div>
                  ) : (
                    <button type="button" className={`btn ${styles.danger}`} onClick={() => { setConfirming(item.id); }}>{l.delete}</button>
                  )
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}
      {load.state === "ready" && load.next ? <button type="button" className="btn btn-secondary" onClick={() => { void more(); }}>{l.more}</button> : null}
      <p className={styles.note}>{l.pruneNote}</p>
    </>
  );
}
