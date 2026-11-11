import "server-only";
import { API_BASE_PATH, CONTENT_PATHS, DRAFT_SCHEMAS, type ContentKind, type PublicEntry } from "@as/contracts";
import { loadWebEnv } from "@/config/env";
import { ARTWORK, type ArtworkKey } from "@/config/artwork";

/**
 * Published content from the API. Sends no cookies: the public routes only ever return published
 * copies. Not cached, so an editor's publish shows on the next page view.
 */
async function fetchPublic(path: string): Promise<Response> {
  return fetch(`${loadWebEnv().API_INTERNAL_ORIGIN}${API_BASE_PATH}/content/${path}`, { cache: "no-store" });
}

/**
 * Reads a published copy through the shared schema, so entries published before a field existed
 * get its default (e.g. no image) and anything malformed is left out rather than breaking a page.
 */
function normalise<K extends ContentKind>(kind: K, entry: PublicEntry<K>): PublicEntry<K> | null {
  const parsed = DRAFT_SCHEMAS[kind].safeParse(entry.data);
  return parsed.success ? { ...entry, data: parsed.data as PublicEntry<K>["data"] } : null;
}

export type ListResult<K extends ContentKind> = { ok: true; items: PublicEntry<K>[] } | { ok: false };

/** A list for a public page. When the API can't be reached the page shows a "can't load" state. */
export async function publishedList<K extends ContentKind>(kind: K): Promise<ListResult<K>> {
  try {
    const res = await fetchPublic(CONTENT_PATHS[kind]);
    if (!res.ok) return { ok: false };
    const body = (await res.json()) as { items: PublicEntry<K>[] };
    return { ok: true, items: body.items.flatMap((i) => normalise(kind, i) ?? []) };
  } catch {
    return { ok: false };
  }
}

/** One published entry, or null when there is none at that address. Other failures throw. */
export async function publishedEntry<K extends ContentKind>(kind: K, slug: string): Promise<PublicEntry<K> | null> {
  const res = await fetchPublic(`${CONTENT_PATHS[kind]}/${encodeURIComponent(slug)}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`content unavailable (${res.status})`);
  return normalise(kind, (await res.json()) as PublicEntry<K>);
}

/** Project covers are keys into the artwork manifest; anything unknown falls back to the default cover. */
export function coverKey(key: string): ArtworkKey {
  return key in ARTWORK && ARTWORK[key as ArtworkKey].fit === "cover" ? (key as ArtworkKey) : "coverRibbons";
}

/** The status note shown under an entry: approved content carries none. */
export function approvalNote(approval: "approved" | "supplied" | "draft"): "supplied" | "draft" | null {
  return approval === "approved" ? null : approval;
}
