/* eslint-disable @typescript-eslint/no-unsafe-member-access -- supertest bodies are untyped; each value is asserted. */
import { emptyDraft } from "@as/contracts";
import { generate } from "otplib";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Database } from "../../src/db/mongo.js";
import { AuditEvent } from "../../src/features/audit/audit.model.js";
import { User } from "../../src/features/auth/auth.models.js";
import { hashPassword } from "../../src/features/auth/secrets.js";
import { ORIGIN, SOCIETY_INBOX, buildApp, connectFresh, lastEmail, testClock, testUri } from "./helpers.js";

const uri = testUri("animation_society_it_content");
const PASSWORD = "correct horse battery";

type Agent = ReturnType<typeof request.agent>;

/** A complete, publishable synthetic post (all names and text are made up for the test). */
const post = {
  ...emptyDraft("post"),
  title: { ar: "خبر تجريبي", en: "Synthetic news item" },
  summary: { ar: "ملخص تجريبي", en: "Synthetic summary" },
  body: { ar: "فقرة أولى\n\nفقرة ثانية", en: "First paragraph\n\nSecond paragraph" },
  date: "2026-11-01",
};

describe.skipIf(!uri)("content publishing (integration)", () => {
  let db: Database;
  const clock = testClock();
  const app = buildApp(clock);
  let editor: Agent;
  let admin: Agent;
  let member: Agent;

  const send = (agent: Agent, method: "post" | "patch" | "delete", path: string, body?: object) =>
    agent[method](`/api/v1${path}`).set("Origin", ORIGIN).send(body);

  /** Signs a staff account in through both steps (enrolling its authenticator on the way). */
  async function staff(email: string, role: "admin" | "editor") {
    await User.create({ email, name: "Synthetic Staff", role, locale: "en", passwordHash: await hashPassword(PASSWORD), emailVerifiedAt: clock.now() });
    const agent = request.agent(app);
    await send(agent, "post", "/auth/sign-in", { email, password: PASSWORD }).expect(200);
    const enrol = await send(agent, "post", "/auth/mfa/enroll").expect(200);
    const code = await generate({ secret: enrol.body.secret as string, epoch: Math.floor(clock.now().getTime() / 1000) });
    await send(agent, "post", "/auth/mfa/enroll/confirm", { code }).expect(200);
    return agent;
  }

  beforeAll(async () => {
    db = await connectFresh(uri ?? "");
    editor = await staff("editor@example.test", "editor");
    admin = await staff("admin@example.test", "admin");
    await User.create({ email: "member@example.test", name: "Synthetic Member", role: "member", locale: "en", passwordHash: await hashPassword(PASSWORD), emailVerifiedAt: clock.now() });
    member = request.agent(app);
    await send(member, "post", "/auth/sign-in", { email: "member@example.test", password: PASSWORD }).expect(200);
  });
  afterAll(async () => { await db.disconnect(); });

  it("keeps the editing API to signed-in staff who passed the second factor", async () => {
    await request(app).get("/api/v1/admin/content/posts").expect(401);
    const m = await member.get("/api/v1/admin/content/posts");
    expect(m.status).toBe(403);
    expect(m.body.error.code).toBe("forbidden");
    await send(member, "post", "/admin/content/posts", { slug: "x", data: post }).expect(403);

    // Password step done, authenticator not yet: refused.
    await User.create({ email: "halfway@example.test", name: "Synthetic Editor", role: "editor", locale: "en", passwordHash: await hashPassword(PASSWORD), emailVerifiedAt: clock.now() });
    const halfway = request.agent(app);
    await send(halfway, "post", "/auth/sign-in", { email: "halfway@example.test", password: PASSWORD }).expect(200);
    const h = await halfway.get("/api/v1/admin/content/posts");
    expect(h.body.error.code).toBe("mfa_required");

    const list = await editor.get("/api/v1/admin/content/posts").expect(200);
    expect(list.headers["cache-control"]).toBe("no-store");
    await editor.get("/api/v1/admin/content/members").expect(404);
  });

  it("refuses cross-site writes", async () => {
    const res = await editor.post("/api/v1/admin/content/posts").set("Origin", "https://evil.example").send({ slug: "x", data: post });
    expect(res.status).toBe(403);
    await editor.post("/api/v1/admin/content/posts").send({ slug: "x", data: post }).expect(403);
  });

  it("keeps drafts private, publishes both languages together, and only republishing changes the live copy", async () => {
    const created = await send(editor, "post", "/admin/content/posts", { slug: "Synthetic-News", data: { ...post, summary: { ar: "", en: "Only English" } } }).expect(201);
    const id = created.body.id as string;
    expect(created.body).toMatchObject({ slug: "synthetic-news", state: "draft", version: 0, everPublished: false });

    // Public routes never show a draft.
    expect((await request(app).get("/api/v1/content/posts").expect(200)).body.items).toEqual([]);
    await request(app).get("/api/v1/content/posts/synthetic-news").expect(404);

    // Publishing with a language missing is refused and names the field.
    const half = await send(editor, "post", `/admin/content/posts/${id}/publish`, { version: 0 });
    expect(half.status).toBe(400);
    expect(half.body.error.fields).toEqual({ "summary.ar": ["required"] });

    await send(editor, "patch", `/admin/content/posts/${id}`, { version: 0, slug: "synthetic-news", data: post }).expect(200);
    const published = await send(editor, "post", `/admin/content/posts/${id}/publish`, { version: 1 }).expect(200);
    expect(published.body).toMatchObject({ state: "published", version: 2, everPublished: true });

    const live = await request(app).get("/api/v1/content/posts/synthetic-news").expect(200);
    expect(live.body.data.title.en).toBe("Synthetic news item");
    expect(live.body).not.toHaveProperty("draft");

    // Editing the draft leaves the public copy alone until it is published again.
    const edited = await send(editor, "patch", `/admin/content/posts/${id}`, { version: 2, slug: "synthetic-news", data: { ...post, title: { ar: "عنوان معدل", en: "Edited title" } } }).expect(200);
    expect(edited.body.state).toBe("changed");
    expect((await request(app).get("/api/v1/content/posts/synthetic-news")).body.data.title.en).toBe("Synthetic news item");
    await send(admin, "post", `/admin/content/posts/${id}/publish`, { version: 3 }).expect(200);
    expect((await request(app).get("/api/v1/content/posts/synthetic-news")).body.data.title.en).toBe("Edited title");
  });

  it("rejects stale saves, changed published addresses, duplicate addresses and unsafe links", async () => {
    const [entry] = (await editor.get("/api/v1/admin/content/posts")).body.items as { id: string; version: number }[];
    const id = entry?.id ?? "";
    const stale = await send(editor, "patch", `/admin/content/posts/${id}`, { version: 0, slug: "synthetic-news", data: post });
    expect(stale.status).toBe(409);
    expect(stale.body.error.code).toBe("conflict");

    const moved = await send(editor, "patch", `/admin/content/posts/${id}`, { version: entry?.version, slug: "new-address", data: post });
    expect(moved.body.error.fields).toEqual({ slug: ["slug_locked"] });

    const dup = await send(editor, "post", "/admin/content/posts", { slug: "synthetic-news", data: post });
    expect(dup.body.error.fields).toEqual({ slug: ["slug_taken"] });

    const bad = await send(editor, "post", "/admin/content/posts", { slug: "bad-link", data: { ...post, postType: "event", registrationUrl: "javascript:alert(1)" } });
    expect(bad.body.error.fields).toEqual({ registrationUrl: ["url"] });
    const extra = await send(editor, "post", "/admin/content/posts", { slug: "extra", data: { ...post, price: 100 } });
    expect(extra.status).toBe(400);
    const badSlug = await send(editor, "post", "/admin/content/posts", { slug: "../etc", data: post });
    expect(badSlug.body.error.fields).toEqual({ slug: ["slug"] });
  });

  it("deletes only unpublished entries, and logs every change", async () => {
    const [entry] = (await editor.get("/api/v1/admin/content/posts")).body.items as { id: string; version: number }[];
    const id = entry?.id ?? "";
    const live = await editor.delete(`/api/v1/admin/content/posts/${id}?version=${entry?.version}`).set("Origin", ORIGIN);
    expect(live.status).toBe(409);

    const off = await send(editor, "post", `/admin/content/posts/${id}/unpublish`, { version: entry?.version }).expect(200);
    expect(off.body.state).toBe("draft");
    await request(app).get("/api/v1/content/posts/synthetic-news").expect(404);
    await editor.delete(`/api/v1/admin/content/posts/${id}?version=${off.body.version}`).set("Origin", ORIGIN).expect(204);
    await editor.get(`/api/v1/admin/content/posts/${id}`).expect(404);

    const actions = (await AuditEvent.find({ targetType: "content", targetId: id }).sort({ _id: 1 }).lean()).map((e) => e.action);
    expect(actions).toEqual(["content.created", "content.updated", "content.published", "content.updated", "content.published", "content.unpublished", "content.deleted"]);

    // Editors manage content but still can't read the administrator-only activity log.
    await editor.get("/api/v1/admin/audit").expect(403);
  });

  it("lists published projects and partners on the public routes only", async () => {
    const project = { ...emptyDraft("project"), title: { ar: "مشروع", en: "Project" }, summary: { ar: "ملخص", en: "Summary" }, body: { ar: "نص", en: "Text" }, progressLabel: { ar: "مستمر", en: "Ongoing" } };
    const p = await send(editor, "post", "/admin/content/projects", { slug: "synthetic-project", data: project }).expect(201);
    await send(editor, "post", `/admin/content/projects/${p.body.id}/publish`, { version: 0 }).expect(200);
    const partner = { ...emptyDraft("partner"), title: { ar: "شريك", en: "Partner" }, url: "https://partner.example" };
    await send(editor, "post", "/admin/content/partners", { slug: "synthetic-partner", data: partner }).expect(201);

    const projects = (await request(app).get("/api/v1/content/projects").expect(200)).body.items as { slug: string }[];
    expect(projects.map((i) => i.slug)).toEqual(["synthetic-project"]);
    expect((await request(app).get("/api/v1/content/partners")).body.items).toEqual([]);
    // A post route can't read a project by its address.
    await request(app).get("/api/v1/content/posts/synthetic-project").expect(404);
  });

  it("forwards contact messages to the Society inbox through the outbox", async () => {
    await request(app)
      .post("/api/v1/contact")
      .set("Origin", ORIGIN)
      .send({ name: "Synthetic Sender", email: "sender@example.test", subject: "Workshop question", message: "Is there a workshop next month?", locale: "en" })
      .expect(202);
    const email = await lastEmail(SOCIETY_INBOX);
    expect(email.template).toBe("contact_received");
    expect(email.subject).toContain("Workshop question");
    expect(email.text).toContain("sender@example.test");
  });
});
