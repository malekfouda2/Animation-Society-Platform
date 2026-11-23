import { z } from "zod";
import { objectIdSchema } from "./content.js";

/**
 * Membership plans and the fixed membership application.
 *
 * Plans follow the Society's bylaws (اللائحة الأساسية v.3, Articles 8–12 and 17) and its 2026
 * profile: student, participant, ordinary and supporting memberships with yearly fees. Each plan
 * carries the bylaws' conditions as rules the application checks (minimum age, proof of study,
 * months of earlier membership). Fees follow the financial year (1 January to 31 December, Article
 * 54); someone joining mid-year pays for the months left (Article 12(2), counted by month as Malek
 * decided on 19 Nov 2026). Validation messages are translation keys.
 */

export const CURRENCIES = ["SAR"] as const;
export type Currency = (typeof CURRENCIES)[number];

/** What the applicant practises. The four animation fields of the site, plus "other". */
export const SPECIALIZATIONS = ["2d", "3d", "stop-motion", "hybrid", "other"] as const;
export type Specialization = (typeof SPECIALIZATIONS)[number];

/**
 * Review states (docs/ARCHITECTURE.md): draft -> submitted -> needs_changes -> submitted;
 * submitted -> approved | rejected; rejected -> draft once REAPPLY_WAIT_MONTHS have passed (Malek, 23 Nov 2026).
 * Approval is not payment and not membership.
 */
export const APPLICATION_STATES = ["draft", "submitted", "needs_changes", "approved", "rejected"] as const;
export type ApplicationState = (typeof APPLICATION_STATES)[number];

/** States in which the applicant may change the application. */
export const EDITABLE_STATES: readonly ApplicationState[] = ["draft", "needs_changes"];

export const APPLICATION_ACTIONS = ["submitted", "resubmitted", "changes_requested", "approved", "rejected", "reapplied"] as const;
export type ApplicationAction = (typeof APPLICATION_ACTIONS)[number];

export const PLAN_LIMITS = { name: 80, summary: 400, eligibility: 600, priceMinor: 10_000_000, durationMonths: 120, minAge: 120, priorMonths: 120 } as const;
export const APPLICATION_LIMITS = { fullName: 120, city: 80, message: 1000 } as const;

/** A rejected applicant may apply again this many calendar months after the decision. */
export const REAPPLY_WAIT_MONTHS = 6;

/** When someone rejected at `decidedAt` may apply again. A missing day clamps to the month's end (31 Aug -> 28 Feb). */
export function reapplyDate(decidedAt: Date): Date {
  const out = new Date(decidedAt);
  const day = out.getUTCDate();
  out.setUTCDate(1);
  out.setUTCMonth(out.getUTCMonth() + REAPPLY_WAIT_MONTHS);
  const last = new Date(Date.UTC(out.getUTCFullYear(), out.getUTCMonth() + 1, 0)).getUTCDate();
  out.setUTCDate(Math.min(day, last));
  return out;
}

/**
 * Conditions from the bylaws that the application checks. `minAge` 0 and `priorMembershipMonths` 0
 * mean no condition. Staff still verify the documents and dates during review.
 */
export const planRulesSchema = z
  .object({
    /** Article 8(7) and 9: over 18. */
    minAge: z.number().int().min(0).max(PLAN_LIMITS.minAge).default(0),
    /** Article 8(6): proof of being a student. */
    studentProof: z.boolean().default(false),
    /** Article 17(1)(ث): at least six months' membership before General Assembly membership. */
    priorMembershipMonths: z.number().int().min(0).max(PLAN_LIMITS.priorMonths).default(0),
    /** Articles 9 and 10: attends and votes in the General Assembly. Shown to applicants. */
    generalAssembly: z.boolean().default(false),
    /** Supporting membership: the application is a request, approved only after an external meeting. */
    byRequest: z.boolean().default(false),
  })
  .strict();
export type PlanRules = z.infer<typeof planRulesSchema>;
export const NO_RULES: PlanRules = { minAge: 0, studentProof: false, priorMembershipMonths: 0, generalAssembly: false, byRequest: false };

const line = (max: number) => z.string().trim().max(max, "too_long").regex(/^[^\r\n]*$/, "too_long");
const required = (max: number) => line(max).min(1, "required");
const para = (max: number) => z.string().trim().max(max, "too_long");
const both = <T extends z.ZodType>(s: T) => z.object({ ar: s, en: s }).strict();

export const planKeySchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug")
  .max(40, "slug");

/** What staff enter for a plan. Price is in minor units (halalas); the server never takes a price from a checkout request. */
export const planFieldsSchema = z
  .object({
    name: both(required(PLAN_LIMITS.name)),
    summary: both(para(PLAN_LIMITS.summary)),
    eligibility: both(para(PLAN_LIMITS.eligibility)),
    priceMinor: z.number().int("price").min(0, "price").max(PLAN_LIMITS.priceMinor, "price"),
    currency: z.enum(CURRENCIES),
    durationMonths: z.number().int("duration").min(1, "duration").max(PLAN_LIMITS.durationMonths, "duration"),
    enabled: z.boolean(),
    sortOrder: z.number().int().min(0).max(100).default(0),
    rules: planRulesSchema.default(() => ({ ...NO_RULES })),
  })
  .strict();
export type PlanFields = z.infer<typeof planFieldsSchema>;
export const createPlanSchema = planFieldsSchema.extend({ key: planKeySchema }).strict();
export const updatePlanSchema = planFieldsSchema.extend({ version: z.number().int().min(0) }).strict();

/** A plan as visitors and applicants see it. */
export const publicPlanSchema = z.object({
  id: z.string(),
  key: z.string(),
  name: both(z.string()),
  summary: both(z.string()),
  eligibility: both(z.string()),
  priceMinor: z.number(),
  currency: z.enum(CURRENCIES),
  durationMonths: z.number(),
  rules: planRulesSchema,
  /** Synthetic development plan; never the Society's real offer. */
  demo: z.boolean(),
});
export type PublicPlan = z.infer<typeof publicPlanSchema>;

export const adminPlanSchema = publicPlanSchema.extend({
  enabled: z.boolean(),
  sortOrder: z.number(),
  version: z.number(),
  updatedAt: z.string(),
});
export type AdminPlan = z.infer<typeof adminPlanSchema>;

/** The plan as it was when the application was (re)submitted: what review and checkout rely on. */
export const planSnapshotSchema = publicPlanSchema.extend({ version: z.number() });
export type PlanSnapshot = z.infer<typeof planSnapshotSchema>;

/** Phone as typed, digits with an optional leading +; spaces and dashes are removed. */
export const phoneSchema = z
  .string()
  .transform((v) => v.trim().replace(/[\s-]/g, ""))
  .pipe(z.string().regex(/^\+?[0-9]{8,15}$/, "phone"));

/** The applicant's answers as saved. Drafts may be incomplete; submitIssues lists what's missing. */
export const applicationAnswersSchema = z
  .object({
    /** Full name in Arabic, as printed on the card. */
    fullName: line(APPLICATION_LIMITS.fullName),
    /** Full name in English, as printed on the card. */
    fullNameEn: line(APPLICATION_LIMITS.fullName).default(""),
    phone: z.string().trim().max(24, "phone").regex(/^[0-9+\s-]*$/, "phone"),
    city: line(APPLICATION_LIMITS.city),
    specialization: z.union([z.literal(""), z.enum(SPECIALIZATIONS)]),
    /** A private member photo uploaded by the applicant (for the membership card). */
    photoId: z.union([z.literal(""), objectIdSchema]),
    /** Date of birth (YYYY-MM-DD), asked when the plan has a minimum age. */
    birthDate: z.union([z.literal(""), z.iso.date("date")]).default(""),
    /** A private image of a valid document proving student status, when the plan needs one. */
    studentProofId: z.union([z.literal(""), objectIdSchema]).default(""),
    /** When the applicant's earlier membership of the Society started (YYYY-MM), when the plan needs it. */
    memberSince: z.union([z.literal(""), z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "month")]).default(""),
  })
  .strict();
export type ApplicationAnswers = z.infer<typeof applicationAnswersSchema>;
export const EMPTY_ANSWERS: ApplicationAnswers = { fullName: "", fullNameEn: "", phone: "", city: "", specialization: "", photoId: "", birthDate: "", studentProofId: "", memberSince: "" };

const ARABIC_NAME = /^(?=.*\p{L})[\p{Script=Arabic}\p{M}\s.'’-]+$/u;
const LATIN_NAME = /^(?=.*\p{L})[\p{Script=Latin}\p{M}\s.'’-]+$/u;

/** Whole years between a YYYY-MM-DD birth date and `today` (UTC calendar days). */
export function ageOn(birthDate: string, today: Date): number {
  const [y, m, d] = birthDate.split("-").map(Number) as [number, number, number];
  let age = today.getUTCFullYear() - y;
  const beforeBirthday = today.getUTCMonth() + 1 < m || (today.getUTCMonth() + 1 === m && today.getUTCDate() < d);
  if (beforeBirthday) age -= 1;
  return age;
}

/** Whole months from a YYYY-MM month to `today` (a membership that started this month counts 0). */
export function monthsSince(month: string, today: Date): number {
  const [y, m] = month.split("-").map(Number) as [number, number];
  return (today.getUTCFullYear() - y) * 12 + (today.getUTCMonth() + 1 - m);
}

export const saveApplicationSchema = z
  .object({
    /** -1 when no application exists yet. */
    version: z.number().int().min(-1),
    planId: z.union([z.literal(""), objectIdSchema]),
    answers: applicationAnswersSchema,
  })
  .strict();
export type SaveApplicationInput = z.infer<typeof saveApplicationSchema>;
export const applicationVersionSchema = z.object({ version: z.number().int().min(0) }).strict();

/**
 * What must be filled in before an application can be submitted (field -> message keys). `rules`
 * are the chosen plan's conditions (null when no plan is chosen yet).
 */
export function submitIssues(planId: string, a: ApplicationAnswers, rules: PlanRules | null = null, today: Date = new Date()): Record<string, string[]> {
  const issues: Record<string, string[]> = {};
  const need = (key: string, ok: boolean, msg = "required") => {
    if (!ok) issues[key] = [msg];
  };
  need("planId", planId !== "", "plan");
  if (a.fullName.trim() === "") need("answers.fullName", false);
  else need("answers.fullName", ARABIC_NAME.test(a.fullName.trim()), "name_ar");
  if (a.fullNameEn.trim() === "") need("answers.fullNameEn", false);
  else need("answers.fullNameEn", LATIN_NAME.test(a.fullNameEn.trim()), "name_en");
  if (a.phone.trim() === "") need("answers.phone", false);
  else need("answers.phone", phoneSchema.safeParse(a.phone).success, "phone");
  need("answers.city", a.city.trim() !== "");
  need("answers.specialization", a.specialization !== "");
  need("answers.photoId", a.photoId !== "", "photo");
  if (rules && rules.minAge > 0) {
    if (a.birthDate === "") need("answers.birthDate", false);
    else if (Date.parse(`${a.birthDate}T00:00:00Z`) > today.getTime()) need("answers.birthDate", false, "date");
    else need("answers.birthDate", ageOn(a.birthDate, today) >= rules.minAge, "age");
  }
  if (rules?.studentProof) need("answers.studentProofId", a.studentProofId !== "", "student_proof");
  if (rules && rules.priorMembershipMonths > 0) {
    if (a.memberSince === "") need("answers.memberSince", false);
    else need("answers.memberSince", monthsSince(a.memberSince, today) >= rules.priorMembershipMonths, "prior_membership");
  }
  return issues;
}

/**
 * Months left in the financial year (1 January to 31 December, bylaws Article 54), counting the
 * current month, in Riyadh time (UTC+3, no daylight saving). January gives 12, December 1.
 */
export function monthsLeftInYear(at: Date): number {
  const riyadh = new Date(at.getTime() + 3 * 3_600_000);
  return 12 - riyadh.getUTCMonth();
}

/**
 * The fee for joining at `at`: the yearly fee times the months left (including this one) over 12,
 * rounded to the nearest halala (bylaws Article 12(2); counted by month, Malek 19 Nov 2026).
 */
export function proratedFee(priceMinor: number, at: Date): { amountMinor: number; months: number; periodEnd: string } {
  const months = monthsLeftInYear(at);
  const year = new Date(at.getTime() + 3 * 3_600_000).getUTCFullYear();
  return { amountMinor: Math.round((priceMinor * months) / 12), months, periodEnd: `${year}-12-31` };
}

const reason = z.string().trim().min(1, "required").max(APPLICATION_LIMITS.message, "too_long");
export const requestChangesSchema = z.object({ version: z.number().int().min(0), message: reason }).strict();
export const rejectSchema = z.object({ version: z.number().int().min(0), reason }).strict();
/** `meetingConfirmed`: required for by-request plans; the administrator states the external meeting took place. */
export const approveSchema = z.object({ version: z.number().int().min(0), meetingConfirmed: z.boolean().default(false) }).strict();

export const applicationEventSchema = z.object({
  at: z.string(),
  action: z.enum(APPLICATION_ACTIONS),
  from: z.enum(APPLICATION_STATES).nullable(),
  to: z.enum(APPLICATION_STATES),
  /** The staff message (correction request or rejection reason) shown to the applicant. */
  message: z.string().nullable(),
});
export type ApplicationEvent = z.infer<typeof applicationEventSchema>;

export const photoSchema = z.object({ id: z.string(), width: z.number(), height: z.number() });

/** The applicant's own view of their application. */
export const memberApplicationSchema = z.object({
  id: z.string(),
  status: z.enum(APPLICATION_STATES),
  version: z.number(),
  planId: z.string(),
  /** Snapshot from the last submission, if any. */
  plan: planSnapshotSchema.nullable(),
  answers: applicationAnswersSchema,
  photo: photoSchema.nullable(),
  /** The proof-of-study image, when the plan asks for one. */
  studentProof: photoSchema.nullable(),
  /** Latest correction request or rejection reason, when the current state has one. */
  staffMessage: z.string().nullable(),
  submittedAt: z.string().nullable(),
  decidedAt: z.string().nullable(),
  history: z.array(applicationEventSchema),
  /** Approved: the only state from which paid activation may start (Stage 4). */
  canPay: z.boolean(),
  /** Rejected: when the applicant may apply again. */
  reapplyAt: z.string().nullable(),
  canReapply: z.boolean(),
  /** Once approved: what paying now would cost (months left in the financial year) and when it ends. */
  due: z.object({ amountMinor: z.number(), months: z.number(), periodEnd: z.string(), currency: z.enum(CURRENCIES) }).nullable(),
});
export type MemberApplication = z.infer<typeof memberApplicationSchema>;
export const memberApplicationResponseSchema = z.object({ application: memberApplicationSchema.nullable(), plans: z.array(publicPlanSchema) });

export const adminApplicationRowSchema = z.object({
  id: z.string(),
  status: z.enum(APPLICATION_STATES),
  fullName: z.string(),
  email: z.string(),
  city: z.string(),
  planName: both(z.string()).nullable(),
  planDemo: z.boolean(),
  submittedAt: z.string().nullable(),
  updatedAt: z.string(),
});
export type AdminApplicationRow = z.infer<typeof adminApplicationRowSchema>;

export const REVIEW_FILTERS = ["all", "submitted", "needs_changes", "approved", "rejected", "draft"] as const;
export type ReviewFilter = (typeof REVIEW_FILTERS)[number];
export const APPLICATION_PAGE_SIZE = 25;

export const applicationListQuerySchema = z.object({
  status: z.enum(REVIEW_FILTERS).default("submitted"),
  q: z.string().trim().max(80).default(""),
  plan: z.union([z.literal(""), objectIdSchema]).default(""),
  page: z.coerce.number().int().min(1).max(10_000).default(1),
});
export type ApplicationListQuery = z.infer<typeof applicationListQuerySchema>;

export const adminApplicationListSchema = z.object({
  items: z.array(adminApplicationRowSchema),
  page: z.number(),
  pages: z.number(),
  total: z.number(),
  counts: z.record(z.enum(APPLICATION_STATES), z.number()),
});
export type AdminApplicationList = z.infer<typeof adminApplicationListSchema>;

export const adminApplicationEventSchema = applicationEventSchema.extend({
  actorKind: z.enum(["member", "staff", "cli", "system"]),
  actorEmail: z.string().nullable(),
});

export const adminApplicationSchema = memberApplicationSchema.omit({ history: true, canPay: true, due: true, reapplyAt: true, canReapply: true }).extend({
  email: z.string(),
  accountName: z.string(),
  /** The plan currently chosen in the draft, for staff reading a draft that was never submitted. */
  currentPlan: publicPlanSchema.nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  history: z.array(adminApplicationEventSchema),
});
export type AdminApplication = z.infer<typeof adminApplicationSchema>;

/** Formats a minor-unit amount for display (SAR has two decimals). */
export function formatPrice(priceMinor: number, currency: Currency, locale: "ar" | "en"): string {
  return new Intl.NumberFormat(locale === "ar" ? "ar-SA-u-nu-latn" : "en-GB", { style: "currency", currency, minimumFractionDigits: 2 }).format(priceMinor / 100);
}
