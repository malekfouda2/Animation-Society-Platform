import {
  APPLICATION_PAGE_SIZE,
  APPLICATION_STATES,
  EDITABLE_STATES,
  NO_RULES,
  phoneSchema,
  proratedFee,
  reapplyDate,
  submitIssues,
  type PlanRules,
  type AdminApplication,
  type AdminApplicationList,
  type AdminPlan,
  type ApplicationAction,
  type ApplicationAnswers,
  type ApplicationListQuery,
  type ApplicationState,
  type Locale,
  type MemberApplication,
  type PlanFields,
  type PlanSnapshot,
  type PublicPlan,
  type SaveApplicationInput,
} from "@as/contracts";
import mongoose, { type ClientSession } from "mongoose";
import { HttpError } from "../../http/errors.js";
import { audit } from "../audit/audit.model.js";
import type { AuthenticatedSession } from "../auth/auth.service.js";
import { User } from "../auth/auth.models.js";
import type { Mailer } from "../email/email.service.js";
import type { EmailTemplate } from "../email/email.templates.js";
import { Application, ApplicationEvent, MembershipPlan } from "./membership.models.js";

type Localized = { ar: string; en: string };

interface PlanDoc {
  _id: mongoose.Types.ObjectId;
  key: string;
  name: Localized;
  summary: Localized;
  eligibility: Localized;
  priceMinor: number;
  currency: "SAR";
  durationMonths: number;
  enabled: boolean;
  rules?: Partial<PlanRules>;
  demo: boolean;
  sortOrder: number;
  version: number;
  updatedAt: Date;
}

interface ApplicationDoc {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  email: string;
  status: ApplicationState;
  planId: mongoose.Types.ObjectId | null;
  planSnapshot: PlanSnapshot | null;
  answers: Omit<ApplicationAnswers, "fullNameEn" | "photoId" | "specialization" | "studentProofId" | "birthDate" | "memberSince"> & {
    fullNameEn?: string;
    photoId: mongoose.Types.ObjectId | null;
    studentProofId?: mongoose.Types.ObjectId | null;
    birthDate?: string;
    memberSince?: string;
    specialization: ApplicationAnswers["specialization"];
  };
  staffMessage: string | null;
  submittedAt: Date | null;
  decidedAt: Date | null;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

interface EventDoc {
  action: ApplicationAction;
  from: ApplicationState | null;
  to: ApplicationState;
  actorId: mongoose.Types.ObjectId | null;
  actorKind: "member" | "staff" | "cli" | "system";
  message: string | null;
  at: Date;
}

const STALE = "This application changed since you opened it; reload to see the latest version";

function toPublicPlan(p: PlanDoc): PublicPlan {
  return {
    id: String(p._id),
    key: p.key,
    name: { ar: p.name.ar, en: p.name.en },
    summary: { ar: p.summary.ar, en: p.summary.en },
    eligibility: { ar: p.eligibility.ar, en: p.eligibility.en },
    priceMinor: p.priceMinor,
    currency: p.currency,
    durationMonths: p.durationMonths,
    rules: rulesOf(p),
    demo: p.demo,
  };
}

/** Plans saved before rules existed have none. */
function rulesOf(p: { rules?: Partial<PlanRules> | null }): PlanRules {
  return { ...NO_RULES, ...(p.rules ?? {}) };
}

function toAdminPlan(p: PlanDoc): AdminPlan {
  return { ...toPublicPlan(p), enabled: p.enabled, sortOrder: p.sortOrder, version: p.version, updatedAt: p.updatedAt.toISOString() };
}

function answersOf(doc: ApplicationDoc): ApplicationAnswers {
  return {
    fullName: doc.answers.fullName,
    fullNameEn: doc.answers.fullNameEn ?? "",
    phone: doc.answers.phone,
    city: doc.answers.city,
    specialization: doc.answers.specialization,
    photoId: doc.answers.photoId ? String(doc.answers.photoId) : "",
    birthDate: doc.answers.birthDate ?? "",
    studentProofId: doc.answers.studentProofId ? String(doc.answers.studentProofId) : "",
    memberSince: doc.answers.memberSince ?? "",
  };
}

function isDuplicateKey(err: unknown): boolean {
  return typeof err === "object" && err !== null && "code" in err && err.code === 11000;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Which transitions staff and applicants may make; anything else is a conflict. */
const FROM: Record<"submit" | "review", readonly ApplicationState[]> = {
  submit: EDITABLE_STATES,
  review: ["submitted"],
};

export interface MembershipServiceDeps {
  mailer: Mailer;
  publicOrigin: string;
  /** Looks up the applicant's own member photo (media service). */
  photos: { ownPhoto(userId: string, id: string): Promise<{ id: string; width: number; height: number } | null> };
  now?: () => Date;
}

export function createMembershipService({ mailer, publicOrigin, photos, now = () => new Date() }: MembershipServiceDeps) {
  const transaction = <T>(fn: (session: ClientSession) => Promise<T>) => mongoose.connection.transaction(fn);
  const memberLink = (locale: Locale) => `${publicOrigin}/${locale}/member/application`;

  async function photoOf(doc: ApplicationDoc) {
    if (!doc.answers.photoId) return null;
    return photos.ownPhoto(String(doc.userId), String(doc.answers.photoId));
  }

  async function history(applicationId: mongoose.Types.ObjectId): Promise<EventDoc[]> {
    // Bounded: an application has a handful of review rounds.
    return ApplicationEvent.find({ applicationId }, { submitted: 0 }).sort({ at: 1, _id: 1 }).limit(200).lean<EventDoc[]>();
  }

  async function proofOf(doc: ApplicationDoc) {
    if (!doc.answers.studentProofId) return null;
    return photos.ownPhoto(String(doc.userId), String(doc.answers.studentProofId));
  }

  async function toMember(doc: ApplicationDoc): Promise<MemberApplication> {
    const events = await history(doc._id);
    const snapshot = doc.planSnapshot ? { ...doc.planSnapshot, rules: rulesOf(doc.planSnapshot) } : null;
    const reapplyAt = doc.status === "rejected" && doc.decidedAt ? reapplyDate(doc.decidedAt) : null;
    return {
      id: String(doc._id),
      status: doc.status,
      version: doc.version,
      planId: doc.planId ? String(doc.planId) : "",
      plan: snapshot,
      answers: answersOf(doc),
      photo: await photoOf(doc),
      studentProof: await proofOf(doc),
      staffMessage: doc.status === "needs_changes" || doc.status === "rejected" ? doc.staffMessage : null,
      submittedAt: doc.submittedAt?.toISOString() ?? null,
      decidedAt: doc.decidedAt?.toISOString() ?? null,
      history: events.map((e) => ({ at: e.at.toISOString(), action: e.action, from: e.from, to: e.to, message: e.message })),
      canPay: doc.status === "approved",
      reapplyAt: reapplyAt?.toISOString() ?? null,
      canReapply: reapplyAt !== null && now() >= reapplyAt,
      // What joining now would cost: the yearly fee for the months left in the financial year.
      due: doc.status === "approved" && snapshot ? { ...proratedFee(snapshot.priceMinor, now()), currency: snapshot.currency } : null,
    };
  }

  async function enabledPlan(planId: string, session?: ClientSession): Promise<PlanDoc | null> {
    if (!mongoose.isValidObjectId(planId)) return null;
    return MembershipPlan.findOne({ _id: planId, enabled: true }, null, session ? { session } : {}).lean<PlanDoc>();
  }

  /**
   * Applies one review transition atomically: the state and version must still be what the actor
   * saw (so two staff deciding at once cannot both win), the history event, the activity log entry
   * and the applicant's email are written in the same transaction, and the email is sent after.
   */
  async function transition(opts: {
    id: string;
    version: number;
    from: readonly ApplicationState[];
    to: ApplicationState;
    action: ApplicationAction;
    actor: { id: string; kind: "member" | "staff" };
    set?: Record<string, unknown>;
    message?: string | null;
    submitted?: unknown;
    /** Omitted when the change needs no email (the applicant reopening their own application). */
    email?: (user: { name: string; locale: Locale }) => EmailTemplate;
    owner?: string;
    auditMeta?: Record<string, unknown>;
  }): Promise<ApplicationDoc> {
    if (!mongoose.isValidObjectId(opts.id)) throw new HttpError("not_found", "Application not found");
    const at = now();
    let emailId = "";
    const updated = await transaction(async (session) => {
      const current = await Application.findOne({ _id: opts.id, ...(opts.owner ? { userId: opts.owner } : {}) }, null, { session }).lean<ApplicationDoc>();
      if (!current) throw new HttpError("not_found", "Application not found");
      if (current.version !== opts.version) throw new HttpError("conflict", STALE);
      if (!opts.from.includes(current.status)) throw new HttpError("conflict", "This application can't make that change in its current state");
      const doc = await Application.findOneAndUpdate(
        { _id: opts.id, version: opts.version, status: { $in: opts.from } },
        { $set: { ...opts.set, status: opts.to, updatedAt: at }, $inc: { version: 1 } },
        { session, returnDocument: "after" },
      ).lean<ApplicationDoc>();
      if (!doc) throw new HttpError("conflict", STALE);
      const [event] = await ApplicationEvent.create(
        [{ applicationId: doc._id, action: opts.action, from: current.status, to: opts.to, actorId: opts.actor.id, actorKind: opts.actor.kind, message: opts.message ?? null, submitted: opts.submitted ?? null, at }],
        { session },
      );
      await audit(
        { actorId: opts.actor.id, actorKind: "user", action: `application.${opts.action}`, targetType: "application", targetId: String(doc._id), ...(opts.message ? { reason: opts.message.slice(0, 500) } : {}), meta: { from: current.status, to: opts.to, ...opts.auditMeta } },
        at,
        session,
      );
      const user = await User.findById(doc.userId, { email: 1, name: 1, locale: 1 }, { session }).lean();
      if (user && opts.email) {
        emailId = await mailer.queue(user.email, user.locale, opts.email({ name: user.name, locale: user.locale }), { session, dedupeKey: `application-event:${String(event?._id)}` });
      }
      return doc;
    });
    if (emailId) await mailer.deliver(emailId);
    return updated;
  }

  function staffOnly(auth: AuthenticatedSession) {
    return { id: auth.userId, kind: "staff" as const };
  }

  return {
    // ---------- Plans ----------

    async publicPlans(): Promise<PublicPlan[]> {
      const docs = await MembershipPlan.find({ enabled: true }).sort({ sortOrder: 1, _id: 1 }).limit(50).lean<PlanDoc[]>();
      return docs.map(toPublicPlan);
    },

    async adminPlans(): Promise<AdminPlan[]> {
      const docs = await MembershipPlan.find({}).sort({ sortOrder: 1, _id: 1 }).limit(100).lean<PlanDoc[]>();
      return docs.map(toAdminPlan);
    },

    async adminPlan(id: string): Promise<AdminPlan> {
      if (!mongoose.isValidObjectId(id)) throw new HttpError("not_found", "Plan not found");
      const doc = await MembershipPlan.findById(id).lean<PlanDoc>();
      if (!doc) throw new HttpError("not_found", "Plan not found");
      return toAdminPlan(doc);
    },

    /** Staff-created plans are never demo plans; only the development seed makes those. */
    async createPlan(auth: AuthenticatedSession, input: PlanFields & { key: string }): Promise<AdminPlan> {
      const at = now();
      try {
        return await transaction(async (session) => {
          const [doc] = await MembershipPlan.create([{ ...input, demo: false, version: 0, createdAt: at, updatedAt: at }], { session });
          if (!doc) throw new Error("plan not created");
          await audit({ actorId: auth.userId, actorKind: "user", action: "plan.created", targetType: "plan", targetId: String(doc._id), meta: { key: input.key, priceMinor: input.priceMinor, currency: input.currency, durationMonths: input.durationMonths, enabled: input.enabled } }, at, session);
          return toAdminPlan(doc.toObject() as PlanDoc);
        });
      } catch (err) {
        if (isDuplicateKey(err)) throw new HttpError("validation_failed", "That key is already used", { key: ["slug_taken"] });
        throw err;
      }
    },

    /**
     * Changes a plan. Applications already submitted keep the snapshot they were submitted with; the
     * change shows up only when an application is (re)submitted.
     */
    async updatePlan(auth: AuthenticatedSession, id: string, input: PlanFields & { version: number }): Promise<AdminPlan> {
      if (!mongoose.isValidObjectId(id)) throw new HttpError("not_found", "Plan not found");
      const at = now();
      const { version, ...fields } = input;
      return transaction(async (session) => {
        const before = await MembershipPlan.findById(id, null, { session }).lean<PlanDoc>();
        if (!before) throw new HttpError("not_found", "Plan not found");
        const doc = await MembershipPlan.findOneAndUpdate({ _id: id, version }, { $set: { ...fields, updatedAt: at }, $inc: { version: 1 } }, { session, returnDocument: "after" }).lean<PlanDoc>();
        if (!doc) throw new HttpError("conflict", "Someone else saved this plan; reload to see their changes");
        await audit(
          {
            actorId: auth.userId,
            actorKind: "user",
            action: "plan.updated",
            targetType: "plan",
            targetId: id,
            meta: { key: doc.key, priceBefore: before.priceMinor, priceAfter: doc.priceMinor, durationBefore: before.durationMonths, durationAfter: doc.durationMonths, enabled: doc.enabled },
          },
          at,
          session,
        );
        return toAdminPlan(doc);
      });
    },

    // ---------- The applicant ----------

    async mine(auth: AuthenticatedSession): Promise<MemberApplication | null> {
      const doc = await Application.findOne({ userId: auth.userId }).lean<ApplicationDoc>();
      return doc ? toMember(doc) : null;
    },

    /** Saves the applicant's draft (creating it on first save). Only while it is theirs to edit. */
    async save(auth: AuthenticatedSession, input: SaveApplicationInput): Promise<MemberApplication> {
      if (input.planId && !(await enabledPlan(input.planId))) {
        throw new HttpError("validation_failed", "Choose one of the plans offered", { planId: ["plan_unavailable"] });
      }
      if (input.answers.photoId && !(await photos.ownPhoto(auth.userId, input.answers.photoId))) {
        throw new HttpError("validation_failed", "Upload your photo again", { "answers.photoId": ["photo"] });
      }
      if (input.answers.studentProofId && !(await photos.ownPhoto(auth.userId, input.answers.studentProofId))) {
        throw new HttpError("validation_failed", "Upload your document again", { "answers.studentProofId": ["student_proof"] });
      }
      const at = now();
      const set = {
        planId: input.planId || null,
        "answers.fullName": input.answers.fullName,
        "answers.fullNameEn": input.answers.fullNameEn,
        "answers.phone": input.answers.phone,
        "answers.city": input.answers.city,
        "answers.specialization": input.answers.specialization,
        "answers.photoId": input.answers.photoId || null,
        "answers.birthDate": input.answers.birthDate,
        "answers.studentProofId": input.answers.studentProofId || null,
        "answers.memberSince": input.answers.memberSince,
        updatedAt: at,
      };
      if (input.version === -1) {
        try {
          const [doc] = await Application.create([{ userId: auth.userId, email: auth.email, status: "draft", ...{ planId: set.planId }, answers: { ...input.answers, photoId: input.answers.photoId || null, studentProofId: input.answers.studentProofId || null }, version: 0, createdAt: at, updatedAt: at }]);
          if (!doc) throw new Error("application not created");
          return await toMember(doc.toObject() as ApplicationDoc);
        } catch (err) {
          if (isDuplicateKey(err)) throw new HttpError("conflict", STALE);
          throw err;
        }
      }
      const doc = await Application.findOneAndUpdate(
        { userId: auth.userId, version: input.version, status: { $in: EDITABLE_STATES } },
        { $set: set, $inc: { version: 1 } },
        { returnDocument: "after" },
      ).lean<ApplicationDoc>();
      if (!doc) {
        const current = await Application.findOne({ userId: auth.userId }, { status: 1 }).lean();
        if (!current) throw new HttpError("not_found", "Application not found");
        if (!EDITABLE_STATES.includes(current.status)) throw new HttpError("conflict", "This application is with the Society's team and can't be changed now");
        throw new HttpError("conflict", STALE);
      }
      return toMember(doc);
    },

    /**
     * Sends the application for review (first time, or after corrections). Checks every answer, that
     * the plan is still offered and the photo is the applicant's own, then records the plan snapshot.
     */
    async submit(auth: AuthenticatedSession, version: number): Promise<MemberApplication> {
      const doc = await Application.findOne({ userId: auth.userId }).lean<ApplicationDoc>();
      if (!doc) throw new HttpError("not_found", "Application not found");
      const answers = answersOf(doc);
      const planId = doc.planId ? String(doc.planId) : "";
      const plan = planId ? await enabledPlan(planId) : null;
      // The plan's bylaws conditions (age, proof of study, earlier membership) are checked here too.
      const issues = submitIssues(planId, answers, plan ? rulesOf(plan) : null, now());
      if (planId && !plan) issues["planId"] = ["plan_unavailable"];
      if (answers.photoId && !(await photos.ownPhoto(auth.userId, answers.photoId))) issues["answers.photoId"] = ["photo"];
      if (plan && rulesOf(plan).studentProof && answers.studentProofId && !(await photos.ownPhoto(auth.userId, answers.studentProofId))) issues["answers.studentProofId"] = ["student_proof"];
      if (Object.keys(issues).length > 0) throw new HttpError("validation_failed", "Complete the highlighted answers", issues);
      if (!plan) throw new HttpError("validation_failed", "Choose a plan", { planId: ["plan"] });

      const snapshot: PlanSnapshot = { ...toPublicPlan(plan), version: plan.version };
      const resubmitted = doc.status === "needs_changes";
      const updated = await transition({
        id: String(doc._id),
        owner: auth.userId,
        version,
        from: FROM.submit,
        to: "submitted",
        action: resubmitted ? "resubmitted" : "submitted",
        actor: { id: auth.userId, kind: "member" },
        set: { planSnapshot: snapshot, submittedAt: now(), staffMessage: null, "answers.phone": phoneSchema.parse(answers.phone) },
        submitted: { answers: { ...answers, phone: phoneSchema.parse(answers.phone) }, plan: snapshot },
        email: (u) => ({ template: "application_received", vars: { name: u.name, link: memberLink(u.locale), resubmitted } }),
      });
      return toMember(updated);
    },

    /**
     * Reopens a rejected application as a draft once the waiting period has passed. Answers stay for
     * the applicant to update; the earlier decision and submissions remain in the history.
     */
    async reapply(auth: AuthenticatedSession, version: number): Promise<MemberApplication> {
      const doc = await Application.findOne({ userId: auth.userId }).lean<ApplicationDoc>();
      if (!doc) throw new HttpError("not_found", "Application not found");
      if (doc.status === "rejected" && (!doc.decidedAt || now() < reapplyDate(doc.decidedAt))) {
        throw new HttpError("conflict", "You can apply again once the waiting period has passed");
      }
      const updated = await transition({
        id: String(doc._id),
        owner: auth.userId,
        version,
        from: ["rejected"],
        to: "draft",
        action: "reapplied",
        actor: { id: auth.userId, kind: "member" },
        set: { planSnapshot: null, submittedAt: null, decidedAt: null, decidedBy: null, staffMessage: null },
      });
      return toMember(updated);
    },

    // ---------- Staff review (administrators) ----------

    async adminList(q: ApplicationListQuery): Promise<AdminApplicationList> {
      const filter: Record<string, unknown> = {};
      if (q.status !== "all") filter["status"] = q.status;
      if (q.plan) filter["planId"] = new mongoose.Types.ObjectId(q.plan);
      if (q.q) {
        const re = new RegExp(escapeRegex(q.q), "i");
        filter["$or"] = [{ "answers.fullName": re }, { "answers.fullNameEn": re }, { email: re }, { "answers.city": re }];
      }
      const [total, docs, grouped] = await Promise.all([
        Application.countDocuments(filter),
        Application.find(filter)
          // The review queue reads oldest submission first; other views show the latest activity first.
          .sort(q.status === "submitted" ? { submittedAt: 1, _id: 1 } : { updatedAt: -1, _id: -1 })
          .skip((q.page - 1) * APPLICATION_PAGE_SIZE)
          .limit(APPLICATION_PAGE_SIZE)
          .lean<ApplicationDoc[]>(),
        Application.aggregate<{ _id: ApplicationState; n: number }>([{ $group: { _id: "$status", n: { $sum: 1 } } }]),
      ]);
      const planIds = [...new Set(docs.filter((d) => !d.planSnapshot && d.planId).map((d) => String(d.planId)))];
      const plans = new Map((await MembershipPlan.find({ _id: { $in: planIds } }).lean<PlanDoc[]>()).map((p) => [String(p._id), p]));
      const counts = Object.fromEntries(APPLICATION_STATES.map((s) => [s, grouped.find((g) => g._id === s)?.n ?? 0])) as Record<ApplicationState, number>;
      return {
        items: docs.map((d) => {
          const plan = d.planSnapshot ?? (d.planId ? plans.get(String(d.planId)) : undefined);
          return {
            id: String(d._id),
            status: d.status,
            fullName: d.answers.fullName,
            email: d.email,
            city: d.answers.city,
            planName: plan ? { ar: plan.name.ar, en: plan.name.en } : null,
            planDemo: plan?.demo ?? false,
            submittedAt: d.submittedAt?.toISOString() ?? null,
            updatedAt: d.updatedAt.toISOString(),
          };
        }),
        page: q.page,
        pages: Math.max(1, Math.ceil(total / APPLICATION_PAGE_SIZE)),
        total,
        counts,
      };
    },

    async adminGet(id: string): Promise<AdminApplication> {
      if (!mongoose.isValidObjectId(id)) throw new HttpError("not_found", "Application not found");
      const doc = await Application.findById(id).lean<ApplicationDoc>();
      if (!doc) throw new HttpError("not_found", "Application not found");
      const [events, user, current] = await Promise.all([
        history(doc._id),
        User.findById(doc.userId, { email: 1, name: 1 }).lean(),
        doc.planId ? MembershipPlan.findById(doc.planId).lean<PlanDoc>() : Promise.resolve(null),
      ]);
      const actorIds = [...new Set(events.flatMap((e) => (e.actorId ? [String(e.actorId)] : [])))];
      const emails = new Map((await User.find({ _id: { $in: actorIds } }, { email: 1 }).lean()).map((u) => [String(u._id), u.email]));
      return {
        id: String(doc._id),
        status: doc.status,
        version: doc.version,
        planId: doc.planId ? String(doc.planId) : "",
        plan: doc.planSnapshot ? { ...doc.planSnapshot, rules: rulesOf(doc.planSnapshot) } : null,
        currentPlan: current ? toPublicPlan(current) : null,
        answers: answersOf(doc),
        photo: await photoOf(doc),
        studentProof: await proofOf(doc),
        staffMessage: doc.staffMessage,
        submittedAt: doc.submittedAt?.toISOString() ?? null,
        decidedAt: doc.decidedAt?.toISOString() ?? null,
        email: user?.email ?? doc.email,
        accountName: user?.name ?? "",
        createdAt: doc.createdAt.toISOString(),
        updatedAt: doc.updatedAt.toISOString(),
        history: events.map((e) => ({
          at: e.at.toISOString(),
          action: e.action,
          from: e.from,
          to: e.to,
          message: e.message,
          actorKind: e.actorKind,
          actorEmail: e.actorId ? emails.get(String(e.actorId)) ?? null : null,
        })),
      };
    },

    async requestChanges(auth: AuthenticatedSession, id: string, version: number, message: string): Promise<AdminApplication> {
      await transition({
        id, version, from: FROM.review, to: "needs_changes", action: "changes_requested", actor: staffOnly(auth), message,
        set: { staffMessage: message },
        email: (u) => ({ template: "application_changes", vars: { name: u.name, link: memberLink(u.locale), message } }),
      });
      return this.adminGet(id);
    },

    /** Approval makes the applicant eligible to pay. It grants no membership by itself. */
    async approve(auth: AuthenticatedSession, id: string, version: number, meetingConfirmed = false): Promise<AdminApplication> {
      if (!mongoose.isValidObjectId(id)) throw new HttpError("not_found", "Application not found");
      const pending = await Application.findById(id, { version: 1, planSnapshot: 1 }).lean<Pick<ApplicationDoc, "version" | "planSnapshot">>();
      // A stale version falls through to the transition's conflict, so this reads the snapshot the admin saw.
      const byRequest = pending?.version === version && pending.planSnapshot ? rulesOf(pending.planSnapshot).byRequest : false;
      if (byRequest && !meetingConfirmed) throw new HttpError("validation_failed", "Confirm the meeting took place", { meetingConfirmed: ["meeting"] });
      await transition({
        id, version, from: FROM.review, to: "approved", action: "approved", actor: staffOnly(auth),
        ...(byRequest ? { auditMeta: { meetingConfirmed: true } } : {}),
        set: { decidedAt: now(), decidedBy: auth.userId, staffMessage: null },
        email: (u) => ({ template: "application_approved", vars: { name: u.name, link: memberLink(u.locale) } }),
      });
      return this.adminGet(id);
    },

    async reject(auth: AuthenticatedSession, id: string, version: number, reason: string): Promise<AdminApplication> {
      await transition({
        id, version, from: FROM.review, to: "rejected", action: "rejected", actor: staffOnly(auth), message: reason,
        set: { decidedAt: now(), decidedBy: auth.userId, staffMessage: reason },
        email: (u) => ({ template: "application_rejected", vars: { name: u.name, link: memberLink(u.locale), reason } }),
      });
      return this.adminGet(id);
    },

    /**
     * The gate Stage 4 checkout must call: only an approved application may start paid activation,
     * and the amount comes from its plan snapshot, never from the request.
     */
    async checkoutEligibility(userId: string): Promise<{ applicationId: string; plan: PlanSnapshot }> {
      const doc = await Application.findOne({ userId }).lean<ApplicationDoc>();
      if (doc?.status !== "approved" || !doc.planSnapshot) throw new HttpError("forbidden", "Payment opens only after your application is approved");
      return { applicationId: String(doc._id), plan: doc.planSnapshot };
    },
  };
}

export type MembershipService = ReturnType<typeof createMembershipService>;
