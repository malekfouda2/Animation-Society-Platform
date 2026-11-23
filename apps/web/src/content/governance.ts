import type { Localized } from "./types";

/**
 * The Society's governance documents, served unchanged from apps/web/public/documents/ (git-ignored;
 * copied from the Society Drive, see docs/DEVELOPMENT.md). Titles are the documents' own; English
 * titles are developer translations (D08). All documents are in Arabic.
 *
 * Not listed: the conflict-of-interest, whistleblowing, document-retention and membership-request
 * procedure PDFs in the Drive are damaged at the source and need re-uploading (19 Nov 2026).
 */
export const GOVERNANCE_DOCUMENTS: readonly { key: string; href: string; title: Localized; pages: number }[] = [
  { key: "bylaws", href: "/documents/bylaws.pdf", title: { ar: "اللائحة الأساسية", en: "Bylaws" }, pages: 38 },
  { key: "privacy", href: "/documents/privacy.pdf", title: { ar: "سياسة خصوصية البيانات", en: "Data privacy policy" }, pages: 4 },
  { key: "code-of-conduct", href: "/documents/code-of-conduct.pdf", title: { ar: "سياسة قواعد السلوك", en: "Code of conduct policy" }, pages: 4 },
  { key: "beneficiaries", href: "/documents/beneficiaries.pdf", title: { ar: "سياسة تنظيم العلاقة مع المستفيدين وتقديم الخدمات لهم", en: "Policy on relations with beneficiaries and providing services to them" }, pages: 3 },
  { key: "ethics-charter", href: "/documents/ethics-charter.pdf", title: { ar: "الميثاق الأخلاقي للعاملين في القطاع الخيري", en: "Ethics charter for workers in the charitable sector" }, pages: 24 },
];
