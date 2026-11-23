/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument -- supertest bodies are untyped; each value is asserted. */
import { EMPTY_ANSWERS, emptyDraft, proratedFee, reapplyDate } from "@as/contracts";
import { generate } from "otplib";
import sharp from "sharp";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Database } from "../../src/db/mongo.js";
import { AuditEvent } from "../../src/features/audit/audit.model.js";
import { User } from "../../src/features/auth/auth.models.js";
import { hashPassword } from "../../src/features/auth/secrets.js";
import { createMailer, localInboxTransport } from "../../src/features/email/email.service.js";
import { createMembershipService } from "../../src/features/membership/membership.service.js";
import { ApplicationEvent } from "../../src/features/membership/membership.models.js";
import { ORIGIN, buildApp, connectFresh, lastEmail, testClock, testUri } from "./helpers.js";

const uri = testUri("animation_society_it_membership");
const PASSWORD = "correct horse battery";
type Agent = ReturnType<typeof request.agent>;

const PLAN = {
  name: { ar: "خطة اختبار", en: "Test plan" },
  summary: { ar: "", en: "" },
  eligibility: { ar: "", en: "" },
  priceMinor: 1000,
  currency: "SAR",
  durationMonths: 12,
  enabled: true,
  sortOrder: 1,
};

describe.skipIf(!uri)("membership plans and application review (integration)", () => {
  let db: Database;
  const clock = testClock();
  const app = buildApp(clock);
  let admin: Agent;
  let editor: Agent;
  let alice: Agent;
  let bob: Agent;
  let planId = "";
  let hiddenPlanId = "";

  const send = (agent: Agent, method: "post" | "patch" | "put" | "delete", path: string, body?: object) =>
    agent[method](`/api/v1${path}`).set("Origin", ORIGIN).send(body);
  const photo = async () => sharp({ create: { width: 300, height: 400, channels: 3, background: { r: 40, g: 120, b: 200 } } }).jpeg().toBuffer();

  async function account(email: string, role: "admin" | "editor" | "member"): Promise<Agent> {
    await User.create({ email, name: `Synthetic ${role}`, role, locale: "en", passwordHash: await hashPassword(PASSWORD), emailVerifiedAt: clock.now() });
    const agent = request.agent(app);
    await send(agent, "post", "/auth/sign-in", { email, password: PASSWORD }).expect(200);
    if (role !== "member") {
      const enrol = await send(agent, "post", "/auth/mfa/enroll").expect(200);
      const code = await generate({ secret: enrol.body.secret as string, epoch: Math.floor(clock.now().getTime() / 1000) });
      await send(agent, "post", "/auth/mfa/enroll/confirm", { code }).expect(200);
    }
    return agent;
  }

  const complete = (photoId: string) => ({ fullName: "مقدم تجريبي", fullNameEn: "Synthetic Applicant", phone: "+966 50 000 0000", city: "Riyadh", specialization: "2d", photoId });

  beforeAll(async () => {
    db = await connectFresh(uri ?? "");
    admin = await account("admin@example.test", "admin");
    editor = await account("editor@example.test", "editor");
    alice = await account("alice@example.test", "member");
    bob = await account("bob@example.test", "member");
  });
  afterAll(async () => { await db.disconnect(); });

  it("lets administrators alone manage plans, and shows visitors only enabled ones", async () => {
    await request(app).get("/api/v1/admin/plans").expect(401);
    await alice.get("/api/v1/admin/plans").expect(403);
    await send(editor, "post", "/admin/plans", { ...PLAN, key: "editor-plan" }).expect(403);
    // No Origin: refused before anything else.
    await admin.post("/api/v1/admin/plans").send({ ...PLAN, key: "no-origin" }).expect(403);

    const created = await send(admin, "post", "/admin/plans", { ...PLAN, key: "test-plan" }).expect(201);
    planId = created.body.id;
    expect(created.body.demo).toBe(false);
    // Staff can't mark a plan as demo, or slip in unknown fields.
    await send(admin, "post", "/admin/plans", { ...PLAN, key: "sneaky", demo: true }).expect(400);
    const hidden = await send(admin, "post", "/admin/plans", { ...PLAN, key: "hidden-plan", enabled: false }).expect(201);
    hiddenPlanId = hidden.body.id;
    await send(admin, "post", "/admin/plans", { ...PLAN, key: "test-plan" }).expect(400);

    const pub = await request(app).get("/api/v1/membership/plans").expect(200);
    expect(pub.body.items.map((p: { key: string }) => p.key)).toEqual(["test-plan"]);
    expect(pub.body.items[0]).not.toHaveProperty("enabled");

    await send(admin, "patch", `/admin/plans/${planId}`, { ...PLAN, version: 5 }).expect(409);
  });

  it("keeps member photos private to their owner and administrators", async () => {
    const up = await alice.post("/api/v1/account/photo").set("Origin", ORIGIN).set("Content-Type", "image/jpeg").send(await photo()).expect(201);
    const id = up.body.id as string;
    await alice.get(`/api/v1/media/${id}`).expect(200).expect("Cache-Control", "private, no-store");
    await admin.get(`/api/v1/media/${id}`).expect(200);
    await bob.get(`/api/v1/media/${id}`).expect(404);
    await editor.get(`/api/v1/media/${id}`).expect(404);
    await request(app).get(`/api/v1/media/${id}`).expect(404);
    // Not in the staff library, and an editor can't place it on a public page.
    const lib = await editor.get("/api/v1/admin/media").expect(200);
    expect(lib.body.items.map((i: { id: string }) => i.id)).not.toContain(id);
    const partner = { ...emptyDraft("partner"), logo: { id, alt: { ar: "x", en: "x" }, width: 300, height: 400 } };
    const misuse = await send(editor, "post", "/admin/content/partners", { slug: "photo-misuse", data: partner }).expect(400);
    expect(misuse.body.error.fields).toEqual({ media: ["media_missing"] });
    // Staff accounts don't apply.
    await editor.post("/api/v1/account/photo").set("Origin", ORIGIN).set("Content-Type", "image/jpeg").send(await photo()).expect(403);
  });

  it("walks an application through submit, correction, resubmission and approval", async () => {
    const empty = await alice.get("/api/v1/account/application").expect(200).expect("Cache-Control", "no-store");
    expect(empty.body.application).toBeNull();
    expect(empty.body.plans).toHaveLength(1);

    // Server-owned fields can't be set by the applicant.
    await send(alice, "put", "/account/application", { version: -1, planId, answers: EMPTY_ANSWERS, status: "approved" }).expect(400);
    await send(alice, "put", "/account/application", { version: -1, planId, answers: { ...EMPTY_ANSWERS, priceMinor: 1 } }).expect(400);
    const disabled = await send(alice, "put", "/account/application", { version: -1, planId: hiddenPlanId, answers: EMPTY_ANSWERS }).expect(400);
    expect(disabled.body.error.fields).toEqual({ planId: ["plan_unavailable"] });

    const draft = await send(alice, "put", "/account/application", { version: -1, planId: "", answers: EMPTY_ANSWERS }).expect(200);
    expect(draft.body.status).toBe("draft");
    const incomplete = await send(alice, "post", "/account/application/submit", { version: 0 }).expect(400);
    expect(Object.keys(incomplete.body.error.fields).sort()).toEqual(["answers.city", "answers.fullName", "answers.fullNameEn", "answers.phone", "answers.photoId", "answers.specialization", "planId"]);

    // Someone else's photo can't be attached.
    const bobPhoto = await bob.post("/api/v1/account/photo").set("Origin", ORIGIN).set("Content-Type", "image/jpeg").send(await photo()).expect(201);
    await send(alice, "put", "/account/application", { version: 0, planId, answers: complete(bobPhoto.body.id) }).expect(400);

    const own = await alice.post("/api/v1/account/photo").set("Origin", ORIGIN).set("Content-Type", "image/jpeg").send(await photo()).expect(201);
    const saved = await send(alice, "put", "/account/application", { version: 0, planId, answers: complete(own.body.id) }).expect(200);
    await send(alice, "put", "/account/application", { version: 0, planId, answers: complete(own.body.id) }).expect(409);
    const submitted = await send(alice, "post", "/account/application/submit", { version: saved.body.version }).expect(200);
    expect(submitted.body.status).toBe("submitted");
    expect(submitted.body.plan.priceMinor).toBe(1000);
    expect(submitted.body.answers.phone).toBe("+966500000000");
    expect(submitted.body.canPay).toBe(false);
    expect((await lastEmail("alice@example.test")).subject).toBe("We received your membership application");

    // Locked while under review.
    await send(alice, "put", "/account/application", { version: submitted.body.version, planId, answers: complete(own.body.id) }).expect(409);

    // Another member, an editor and an anonymous caller can't reach it.
    const id = submitted.body.id as string;
    await bob.get(`/api/v1/admin/applications/${id}`).expect(403);
    await editor.get(`/api/v1/admin/applications/${id}`).expect(403);
    await editor.get("/api/v1/admin/applications").expect(403);
    await send(editor, "post", `/admin/applications/${id}/approve`, { version: submitted.body.version }).expect(403);
    await request(app).get(`/api/v1/admin/applications/${id}`).expect(401);
    const bobsView = await bob.get("/api/v1/account/application").expect(200);
    expect(bobsView.body.application).toBeNull();

    // The queue, its counts and search.
    const queue = await admin.get("/api/v1/admin/applications").expect(200);
    expect(queue.body.items.map((r: { id: string }) => r.id)).toEqual([id]);
    expect(queue.body.counts).toMatchObject({ submitted: 1, draft: 0 });
    expect((await admin.get("/api/v1/admin/applications?status=all&q=ALICE@").expect(200)).body.total).toBe(1);
    expect((await admin.get("/api/v1/admin/applications?status=all&q=.*").expect(200)).body.total).toBe(0);
    await admin.get("/api/v1/admin/applications?status=bogus").expect(400);

    // A price change after submission doesn't touch the submitted snapshot.
    const plan = await admin.get(`/api/v1/admin/plans/${planId}`).expect(200);
    await send(admin, "patch", `/admin/plans/${planId}`, { ...PLAN, priceMinor: 2000, version: plan.body.version }).expect(200);

    await send(admin, "post", `/admin/applications/${id}/request-changes`, { version: submitted.body.version, message: "" }).expect(400);
    await send(admin, "post", `/admin/applications/${id}/approve`, { version: 0 }).expect(409);
    const changes = await send(admin, "post", `/admin/applications/${id}/request-changes`, { version: submitted.body.version, message: "Please use a clearer photo." }).expect(200);
    expect(changes.body.status).toBe("needs_changes");
    expect(changes.body.plan.priceMinor).toBe(1000);
    expect((await lastEmail("alice@example.test")).text).toContain("Please use a clearer photo.");
    const mine = await alice.get("/api/v1/account/application").expect(200);
    expect(mine.body.application.staffMessage).toBe("Please use a clearer photo.");

    // Correct and resubmit: the snapshot takes the plan as it is now.
    const fixed = await send(alice, "put", "/account/application", { version: mine.body.application.version, planId, answers: { ...complete(own.body.id), city: "Jeddah" } }).expect(200);
    const resubmitted = await send(alice, "post", "/account/application/submit", { version: fixed.body.version }).expect(200);
    expect(resubmitted.body.status).toBe("submitted");
    expect(resubmitted.body.plan.priceMinor).toBe(2000);
    expect(resubmitted.body.staffMessage).toBeNull();
    expect((await lastEmail("alice@example.test")).subject).toBe("We received your updated application");

    // Two decisions sent at once against the same version: exactly one wins, the other is refused.
    const v = resubmitted.body.version as number;
    const results = await Promise.all([
      send(admin, "post", `/admin/applications/${id}/approve`, { version: v }),
      send(admin, "post", `/admin/applications/${id}/approve`, { version: v }),
      send(admin, "post", `/admin/applications/${id}/approve`, { version: v }),
    ]);
    expect(results.map((r) => r.status).sort()).toEqual([200, 409, 409]);
    const a = results.find((r) => r.status === 200);
    if (!a) throw new Error("no approval succeeded");
    expect(a.body.status).toBe("approved");
    expect((await lastEmail("alice@example.test")).subject).toBe("Your membership application is approved");

    const detail = await admin.get(`/api/v1/admin/applications/${id}`).expect(200);
    expect(detail.body.history.map((e: { action: string }) => e.action)).toEqual(["submitted", "changes_requested", "resubmitted", "approved"]);
    expect(detail.body.history[1].actorEmail).toBe("admin@example.test");
    expect(await ApplicationEvent.countDocuments({ action: "approved" })).toBe(1);
    expect(await AuditEvent.countDocuments({ action: "application.approved", targetId: id })).toBe(1);

    // Decided: neither side can change it now.
    await send(admin, "post", `/admin/applications/${id}/reject`, { version: a.body.version, reason: "Late." }).expect(409);
    const approved = await alice.get("/api/v1/account/application").expect(200);
    expect(approved.body.application.canPay).toBe(true);
    await send(alice, "post", "/account/application/submit", { version: approved.body.application.version }).expect(409);
  });

  it("records a rejection with its reason, and only approval opens payment", async () => {
    const own = await bob.post("/api/v1/account/photo").set("Origin", ORIGIN).set("Content-Type", "image/jpeg").send(await photo()).expect(201);
    const saved = await send(bob, "put", "/account/application", { version: -1, planId, answers: complete(own.body.id) }).expect(200);
    const sub = await send(bob, "post", "/account/application/submit", { version: saved.body.version }).expect(200);

    const gate = createMembershipService({ mailer: createMailer(localInboxTransport), publicOrigin: ORIGIN, photos: { ownPhoto: () => Promise.resolve(null) } });
    const bobId = String((await User.findOne({ email: "bob@example.test" }).lean())?._id);
    await expect(gate.checkoutEligibility(bobId)).rejects.toMatchObject({ code: "forbidden" });

    const rejected = await send(admin, "post", `/admin/applications/${sub.body.id}/reject`, { version: sub.body.version, reason: "Not eligible for this plan." }).expect(200);
    expect(rejected.body.status).toBe("rejected");
    expect((await lastEmail("bob@example.test")).text).toContain("Not eligible for this plan.");
    const view = await bob.get("/api/v1/account/application").expect(200);
    expect(view.body.application.staffMessage).toBe("Not eligible for this plan.");
    expect(view.body.application.canPay).toBe(false);
    await send(bob, "put", "/account/application", { version: view.body.application.version, planId, answers: complete(own.body.id) }).expect(409);
    await expect(gate.checkoutEligibility(bobId)).rejects.toMatchObject({ code: "forbidden" });

    const aliceId = String((await User.findOne({ email: "alice@example.test" }).lean())?._id);
    const ok = await gate.checkoutEligibility(aliceId);
    expect(ok.plan.priceMinor).toBe(2000);

    const counts = (await admin.get("/api/v1/admin/applications?status=all").expect(200)).body.counts;
    expect(counts).toMatchObject({ approved: 1, rejected: 1, submitted: 0 });
  });

  it("applies a plan's bylaws conditions on the server, and pro-rates what is due", async () => {
    const carol = await account("carol@example.test", "member");
    const rules = { minAge: 18, studentProof: true, priorMembershipMonths: 6, generalAssembly: true, byRequest: false };
    const created = await send(admin, "post", "/admin/plans", { ...PLAN, key: "ruled-plan", rules }).expect(201);
    expect(created.body.rules).toEqual(rules);
    const ruled = created.body.id as string;

    const now = clock.now();
    const iso = (d: Date) => d.toISOString().slice(0, 10);
    const yearsAgo = (n: number) => iso(new Date(Date.UTC(now.getUTCFullYear() - n, now.getUTCMonth(), now.getUTCDate())));
    const monthsAgo = (n: number) => new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - n, 1)).toISOString().slice(0, 7);
    const own = await carol.post("/api/v1/account/photo").set("Origin", ORIGIN).set("Content-Type", "image/jpeg").send(await photo()).expect(201);

    // Too young, no proof of study, and a membership that started this month.
    const draft = await send(carol, "put", "/account/application", { version: -1, planId: ruled, answers: { ...EMPTY_ANSWERS, ...complete(own.body.id), birthDate: yearsAgo(10), memberSince: monthsAgo(0) } }).expect(200);
    const refused = await send(carol, "post", "/account/application/submit", { version: draft.body.version }).expect(400);
    expect(refused.body.error.fields).toEqual({ "answers.birthDate": ["age"], "answers.studentProofId": ["student_proof"], "answers.memberSince": ["prior_membership"] });

    // Someone else's upload can't be used as the proof.
    const bobs = await bob.post("/api/v1/account/photo").set("Origin", ORIGIN).set("Content-Type", "image/jpeg").send(await photo()).expect(201);
    const stolen = await send(carol, "put", "/account/application", { version: draft.body.version, planId: ruled, answers: { ...EMPTY_ANSWERS, ...complete(own.body.id), studentProofId: bobs.body.id } }).expect(400);
    expect(stolen.body.error.fields).toEqual({ "answers.studentProofId": ["student_proof"] });

    const proof = await carol.post("/api/v1/account/photo").set("Origin", ORIGIN).set("Content-Type", "image/jpeg").send(await photo()).expect(201);
    const fixed = await send(carol, "put", "/account/application", { version: draft.body.version, planId: ruled, answers: { ...EMPTY_ANSWERS, ...complete(own.body.id), birthDate: yearsAgo(30), memberSince: monthsAgo(6), studentProofId: proof.body.id } }).expect(200);
    const sent = await send(carol, "post", "/account/application/submit", { version: fixed.body.version }).expect(200);
    expect(sent.body.plan.rules).toEqual(rules);
    expect(sent.body.due).toBeNull();

    // Staff see the proof; once approved, the amount due is the yearly fee for the months left.
    const seen = await admin.get(`/api/v1/admin/applications/${sent.body.id as string}`).expect(200);
    expect(seen.body.studentProof.id).toBe(proof.body.id);
    await send(admin, "post", `/admin/applications/${sent.body.id as string}/approve`, { version: seen.body.version }).expect(200);
    const mine = await carol.get("/api/v1/account/application").expect(200);
    const expected = proratedFee(PLAN.priceMinor, clock.now());
    expect(mine.body.application.due).toEqual({ ...expected, currency: "SAR" });
  });

  it("requires a confirmed meeting before approving a by-request plan", async () => {
    const dana = await account("dana@example.test", "member");
    const created = await send(admin, "post", "/admin/plans", { ...PLAN, key: "request-plan", rules: { minAge: 0, studentProof: false, priorMembershipMonths: 0, generalAssembly: true, byRequest: true } }).expect(201);
    const own = await dana.post("/api/v1/account/photo").set("Origin", ORIGIN).set("Content-Type", "image/jpeg").send(await photo()).expect(201);
    const saved = await send(dana, "put", "/account/application", { version: -1, planId: created.body.id, answers: { ...EMPTY_ANSWERS, ...complete(own.body.id) } }).expect(200);
    const sent = await send(dana, "post", "/account/application/submit", { version: saved.body.version }).expect(200);
    const id = sent.body.id as string;

    const refused = await send(admin, "post", `/admin/applications/${id}/approve`, { version: sent.body.version }).expect(400);
    expect(refused.body.error.fields).toEqual({ meetingConfirmed: ["meeting"] });
    expect((await dana.get("/api/v1/account/application").expect(200)).body.application.canPay).toBe(false);

    await send(admin, "post", `/admin/applications/${id}/approve`, { version: sent.body.version, meetingConfirmed: true }).expect(200);
    expect((await dana.get("/api/v1/account/application").expect(200)).body.application.canPay).toBe(true);
    const logged = await AuditEvent.findOne({ action: "application.approved", targetId: id }).lean();
    expect(logged?.meta).toMatchObject({ meetingConfirmed: true });
  });

  it("lets a rejected applicant reapply only after six months, keeping the history", async () => {
    const erin = await account("erin@example.test", "member");
    const own = await erin.post("/api/v1/account/photo").set("Origin", ORIGIN).set("Content-Type", "image/jpeg").send(await photo()).expect(201);
    const saved = await send(erin, "put", "/account/application", { version: -1, planId, answers: { ...EMPTY_ANSWERS, ...complete(own.body.id) } }).expect(200);
    const sent = await send(erin, "post", "/account/application/submit", { version: saved.body.version }).expect(200);
    const rejected = await send(admin, "post", `/admin/applications/${sent.body.id as string}/reject`, { version: sent.body.version, reason: "Not yet." }).expect(200);
    expect((await lastEmail("erin@example.test")).text).toContain("six months");

    const waiting = (await erin.get("/api/v1/account/application").expect(200)).body.application;
    expect(waiting.canReapply).toBe(false);
    expect(waiting.reapplyAt).toBe(reapplyDate(new Date(rejected.body.decidedAt as string)).toISOString());
    await send(erin, "post", "/account/application/reapply", { version: waiting.version }).expect(409);
    await bob.post("/api/v1/account/application/reapply").send({ version: 0 }).expect(403);

    const later = createMembershipService({ mailer: createMailer(localInboxTransport), publicOrigin: ORIGIN, photos: { ownPhoto: () => Promise.resolve(null) }, now: () => new Date(new Date(waiting.reapplyAt as string).getTime() + 1000) });
    const user = await User.findOne({ email: "erin@example.test" }).lean();
    const auth = { userId: String(user?._id), email: "erin@example.test" } as Parameters<typeof later.reapply>[0];
    await expect(later.reapply(auth, waiting.version - 1)).rejects.toMatchObject({ code: "conflict" });
    const reopened = await later.reapply(auth, waiting.version as number);
    expect(reopened).toMatchObject({ status: "draft", staffMessage: null, plan: null, reapplyAt: null, canReapply: false, canPay: false });
    expect(reopened.answers.city).toBe("Riyadh");
    expect(reopened.history.map((e) => e.action)).toEqual(["submitted", "rejected", "reapplied"]);
    await expect(later.reapply(auth, reopened.version)).rejects.toMatchObject({ code: "conflict" });
  });
});
