import "server-only";
import { kindFromPath, type ContentKind, type Locale } from "@as/contracts";
import { notFound } from "next/navigation";
import type { EditorOptions } from "@/components/admin/ContentEditor";
import { ARTWORK, type ArtworkKey } from "@/config/artwork";
import { FIELDS } from "@/content/fields";

/** The content kind named by the route segment, or a 404. */
export function kindParam(kinds: string): ContentKind {
  const kind = kindFromPath(kinds);
  if (!kind) notFound();
  return kind;
}

export function editorOptions(locale: Locale): EditorOptions {
  return {
    fields: FIELDS.map((f) => ({ value: f.slug, label: f.name[locale] })),
    covers: (Object.keys(ARTWORK) as ArtworkKey[])
      .filter((k) => ARTWORK[k].fit === "cover")
      .map((k) => ({ key: k, src: ARTWORK[k].src })),
  };
}
