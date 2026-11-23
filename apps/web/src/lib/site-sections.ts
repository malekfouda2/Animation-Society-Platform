import "server-only";
import { POLICY_KEYS, type PolicyKey, type SectionData, type SectionKey, type SectionOf } from "@as/contracts";
import { cache } from "react";
import type { IconName } from "@/config/artwork";
import { POLICY_TITLES } from "@/content/policies";
import type { ContentStatus, Localized } from "@/content/types";
import { getDictionary } from "@/i18n";
import { publishedList } from "./public-content";

/** The note under a section: null for approved text, "pending" when the Society hasn't supplied it. */
export type Note = ContentStatus | null;

const noteOf = (s: { approval: "approved" | "supplied" | "draft" } | undefined): Note =>
  s ? (s.approval === "approved" ? null : s.approval) : "pending";

const pendingText: Localized = { ar: getDictionary("ar").status.pending, en: getDictionary("en").status.pending };
const lines = (v: { ar: string; en: string }): Localized<readonly string[]> => ({
  ar: v.ar.split("\n").map((l) => l.trim()).filter(Boolean),
  en: v.en.split("\n").map((l) => l.trim()).filter(Boolean),
});
const present = (v: { ar: string; en: string }): Localized | null => (v.ar.trim() || v.en.trim() ? v : null);

/**
 * Goal icons stay with the design and follow the order of the Society's five goals (profile 2026):
 * content and consultations, development opportunities, the festival, training content, sponsorship.
 * Extra goals reuse the set in order.
 */
const GOAL_ICONS: readonly IconName[] = ["pen", "growth", "filmReel", "skills", "partnerships"];
const paragraphs = (v: { ar: string; en: string }): Localized<readonly string[]> => ({
  ar: v.ar.split(/\n\s*\n/).map((l) => l.trim()).filter(Boolean),
  en: v.en.split(/\n\s*\n/).map((l) => l.trim()).filter(Boolean),
});

/**
 * Published page sections, shaped for the pages. Fetched once per request (React cache). A section
 * that isn't published (or an API that can't be reached) shows the honest "awaiting content" state.
 */
export const siteSections = cache(async () => {
  const list = await publishedList("section");
  const byKey = new Map<SectionKey, SectionData>(list.ok ? list.items.map((i) => [i.data.section, i.data]) : []);
  const get = <K extends SectionKey>(key: K) => byKey.get(key) as SectionOf<K> | undefined;

  const hero = get("hero");
  const about = get("about");
  const vision = get("vision");
  const goals = get("goals");
  const assembly = get("assembly");
  const board = get("board");

  return {
    HERO: {
      status: noteOf(hero),
      title: hero?.title ?? { ar: getDictionary("ar").meta.siteName, en: getDictionary("en").meta.siteName },
      body: hero?.body ?? { ar: getDictionary("ar").meta.description, en: getDictionary("en").meta.description },
    },
    ABOUT: {
      status: noteOf(about),
      intro: about?.intro ?? pendingText,
      purpose: about ? present(about.purpose) : null,
      founders: about && present(about.founders) ? paragraphs(about.founders) : null,
    },
    VISION_MISSION: {
      status: noteOf(vision),
      vision: vision ? present(vision.vision) : null,
      /** The mission is a list of points, one per line. */
      mission: vision && present(vision.mission) ? lines(vision.mission) : null,
    },
    OBJECTIVES: goals
      ? (() => {
          const ar = lines(goals.items).ar;
          const en = lines(goals.items).en;
          return ar.map((t, i) => ({ key: String(i), icon: GOAL_ICONS[i % GOAL_ICONS.length] ?? "flag", title: { ar: t, en: en[i] ?? "" } }));
        })()
      : [],
    OBJECTIVES_META: { status: noteOf(goals) },
    GENERAL_ASSEMBLY: {
      status: noteOf(assembly),
      body: assembly?.body ?? pendingText,
      votingNote: assembly?.votingNote ?? { ar: "", en: "" },
      members: assembly?.members ?? [],
    },
    BOARD: {
      status: noteOf(board),
      members: board?.members ?? [],
    },
    POLICIES: POLICY_KEYS.map((slug: PolicyKey) => {
      const p = get(`policy-${slug}`);
      return { slug, title: POLICY_TITLES[slug], text: p ? lines({ ar: p.body.ar.replace(/\n\s*\n/g, "\n"), en: p.body.en.replace(/\n\s*\n/g, "\n") }) : null, status: noteOf(p) };
    }),
  };
});
