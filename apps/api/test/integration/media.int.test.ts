/* eslint-disable @typescript-eslint/no-unsafe-member-access -- supertest bodies are untyped; each value is asserted. */
import { emptyDraft, emptySection } from "@as/contracts";
import { generate } from "otplib";
import sharp from "sharp";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Database } from "../../src/db/mongo.js";
import { User } from "../../src/features/auth/auth.models.js";
import { hashPassword } from "../../src/features/auth/secrets.js";
import { MediaAsset } from "../../src/features/media/media.model.js";
import { createMediaService } from "../../src/features/media/media.service.js";
import { ORIGIN, buildApp, connectFresh, testClock, testUri } from "./helpers.js";

const uri = testUri("animation_society_it_media");
const PASSWORD = "correct horse battery";
type Agent = ReturnType<typeof request.agent>;

/** A synthetic test picture (solid colour), with camera metadata attached to prove it is stripped. */
async function picture(format: "png" | "jpeg", width = 64, height = 48) {
  const img = sharp({ create: { width, height, channels: 3, background: { r: 200, g: 120, b: 40 } } });
  return format === "png"
    ? img.png().toBuffer()
    : img.withExif({ IFD0: { Copyright: "synthetic-secret-marker" } }).jpeg().toBuffer();
}

describe.skipIf(!uri)("media uploads and page sections (integration)", () => {
  let db: Database;
  const clock = testClock();
  const app = buildApp(clock);
  let editor: Agent;

  const send = (agent: Agent, method: "post" | "patch" | "delete", path: string, body?: object) =>
    agent[method](`/api/v1${path}`).set("Origin", ORIGIN).send(body);
  const upload = (agent: Agent, body: Buffer, type: string) =>
    agent.post("/api/v1/admin/media").set("Origin", ORIGIN).set("Content-Type", type).send(body);

  beforeAll(async () => {
    db = await connectFresh(uri ?? "");
    await User.create({ email: "editor@example.test", name: "Synthetic Editor", role: "editor", locale: "en", passwordHash: await hashPassword(PASSWORD), emailVerifiedAt: clock.now() });
    editor = request.agent(app);
    await send(editor, "post", "/auth/sign-in", { email: "editor@example.test", password: PASSWORD }).expect(200);
    const enrol = await send(editor, "post", "/auth/mfa/enroll").expect(200);
    const code = await generate({ secret: enrol.body.secret as string, epoch: Math.floor(clock.now().getTime() / 1000) });
    await send(editor, "post", "/auth/mfa/enroll/confirm", { code }).expect(200);
  });
  afterAll(async () => { await db.disconnect(); });

  it("accepts real images only, re-encodes them and strips metadata", async () => {
    await request(app).post("/api/v1/admin/media").set("Origin", ORIGIN).set("Content-Type", "image/png").send(await picture("png")).expect(401);

    const fake = await upload(editor, Buffer.from("<svg onload=alert(1)>"), "image/png");
    expect(fake.status).toBe(400);
    expect(fake.body.error.fields).toEqual({ file: ["media_unreadable"] });
    const svg = await upload(editor, Buffer.from("<svg xmlns='http://www.w3.org/2000/svg'/>"), "image/svg+xml");
    expect(svg.body.error.fields).toEqual({ file: ["media_type"] });
    // A JPEG declared as PNG is refused: the declared type must match the real format.
    const lying = await upload(editor, await picture("jpeg"), "image/png");
    expect(lying.body.error.fields).toEqual({ file: ["media_type"] });
    const tiny = await upload(editor, await picture("png", 8, 8), "image/png");
    expect(tiny.body.error.fields).toEqual({ file: ["media_small"] });

    const ok = await upload(editor, await picture("jpeg"), "image/jpeg").expect(201);
    expect(ok.body).toMatchObject({ width: 64, height: 48 });
    const served = await editor.get(`/api/v1/media/${ok.body.id}`).buffer(true).parse((res, cb) => {
      const chunks: Buffer[] = [];
      res.on("data", (c: Buffer) => chunks.push(c));
      res.on("end", () => { cb(null, Buffer.concat(chunks)); });
    }).expect(200);
    expect(served.headers["content-type"]).toBe("image/webp");
    expect(served.headers["cache-control"]).toBe("private, no-store");
    const body = served.body as Buffer;
    expect((await sharp(body).metadata()).format).toBe("webp");
    expect(body.includes(Buffer.from("synthetic-secret-marker"))).toBe(false);
  });

  it("keeps an image private until an entry using it is published, and needs its description in both languages", async () => {
    const img = await upload(editor, await picture("png"), "image/png").expect(201);
    const id = img.body.id as string;
    await request(app).get(`/api/v1/media/${id}`).expect(404);

    const partner = { ...emptyDraft("partner"), title: { ar: "شريك", en: "Partner" }, url: "https://partner.example", logo: { id, alt: { ar: "", en: "Logo" } } };
    const created = await send(editor, "post", "/admin/content/partners", { slug: "synthetic-partner", data: partner }).expect(201);
    const blocked = await send(editor, "post", `/admin/content/partners/${created.body.id}/publish`, { version: 0 });
    expect(blocked.body.error.fields).toEqual({ "logo.alt.ar": ["required"] });
    await request(app).get(`/api/v1/media/${id}`).expect(404);

    await send(editor, "patch", `/admin/content/partners/${created.body.id}`, { version: 0, slug: "synthetic-partner", data: { ...partner, logo: { id, alt: { ar: "شعار", en: "Logo" } } } }).expect(200);
    await send(editor, "post", `/admin/content/partners/${created.body.id}/publish`, { version: 1 }).expect(200);
    const pub = await request(app).get(`/api/v1/media/${id}`).expect(200);
    expect(pub.headers["cache-control"]).toBe("public, max-age=300");

    await send(editor, "post", `/admin/content/partners/${created.body.id}/unpublish`, { version: 2 }).expect(200);
    await request(app).get(`/api/v1/media/${id}`).expect(404);

    const ghost = await send(editor, "post", "/admin/content/partners", { slug: "ghost", data: { ...partner, logo: { id: "0123456789abcdef01234567", alt: { ar: "", en: "" } } } });
    expect(ghost.body.error.fields).toEqual({ media: ["media_missing"] });
    await request(app).get("/api/v1/media/../../etc/passwd").expect(404);
    await request(app).get("/api/v1/media/not-an-id").expect(404);
  });

  it("edits fixed page sections by key only, never deletes them, and publishes them for the public pages", async () => {
    const wrong = await send(editor, "post", "/admin/content/sections", { slug: "about", data: emptySection("hero") });
    expect(wrong.body.error.fields).toEqual({ slug: ["section"] });
    const unknown = await send(editor, "post", "/admin/content/sections", { slug: "pricing", data: { ...emptySection("hero"), section: "pricing" } });
    expect(unknown.status).toBe(400);

    const board = { ...emptySection("board"), members: [{ name: { ar: "اسم", en: "Name" }, role: { ar: "", en: "Chair" }, portrait: { id: "", alt: { ar: "", en: "" } } }] };
    const created = await send(editor, "post", "/admin/content/sections", { slug: "board", data: board }).expect(201);
    const blocked = await send(editor, "post", `/admin/content/sections/${created.body.id}/publish`, { version: 0 });
    expect(blocked.body.error.fields).toEqual({ "members.0.role.ar": ["required"] });
    const fixed = { ...board, members: [{ ...board.members[0], role: { ar: "رئيس", en: "Chair" } }] };
    await send(editor, "patch", `/admin/content/sections/${created.body.id}`, { version: 0, slug: "board", data: fixed }).expect(200);
    const moved = await send(editor, "patch", `/admin/content/sections/${created.body.id}`, { version: 1, slug: "hero", data: fixed });
    expect(moved.status).toBe(400);
    await send(editor, "post", `/admin/content/sections/${created.body.id}/publish`, { version: 1 }).expect(200);

    const sections = (await request(app).get("/api/v1/content/sections").expect(200)).body.items as { slug: string; data: { members: unknown[] } }[];
    expect(sections.map((s) => s.slug)).toEqual(["board"]);
    expect(sections[0]?.data.members).toHaveLength(1);

    await send(editor, "post", `/admin/content/sections/${created.body.id}/unpublish`, { version: 2 }).expect(200);
    const del = await editor.delete(`/api/v1/admin/content/sections/${created.body.id}?version=3`).set("Origin", ORIGIN);
    expect(del.status).toBe(403);
  });

  it("lists the library with usage, deletes only unused images, and prunes old unused uploads", async () => {
    const used = (await upload(editor, await picture("png"), "image/png").expect(201)).body.id as string;
    const spare = (await upload(editor, await picture("png"), "image/png").expect(201)).body.id as string;
    // Used by a draft only: still counts as in use.
    const post = { ...emptyDraft("post"), image: { id: used, alt: { ar: "", en: "" }, width: 64, height: 48, crop: { x: 0.25, y: 0, w: 0.5, h: 1 } } };
    await send(editor, "post", "/admin/content/posts", { slug: "draft-with-image", data: post }).expect(201);

    const all = (await editor.get("/api/v1/admin/media").expect(200)).body.items as { id: string; uses: number }[];
    expect(all.find((i) => i.id === used)?.uses).toBe(1);
    expect(all.find((i) => i.id === spare)?.uses).toBe(0);
    const unused = (await editor.get("/api/v1/admin/media?filter=unused").expect(200)).body.items as { id: string }[];
    expect(unused.map((i) => i.id)).toContain(spare);
    expect(unused.map((i) => i.id)).not.toContain(used);
    await request(app).get("/api/v1/admin/media").expect(401);

    const inUse = await editor.delete(`/api/v1/admin/media/${used}`).set("Origin", ORIGIN);
    expect(inUse.status).toBe(409);
    await editor.delete(`/api/v1/admin/media/${spare}`).expect(403); // no Origin: refused
    await editor.delete(`/api/v1/admin/media/${spare}`).set("Origin", ORIGIN).expect(204);
    await editor.get(`/api/v1/media/${spare}`).expect(404);

    // A crop outside the picture is refused.
    const badCrop = await send(editor, "post", "/admin/content/posts", { slug: "bad-crop", data: { ...post, image: { ...post.image, crop: { x: 0.8, y: 0, w: 0.5, h: 1 } } } });
    expect(badCrop.status).toBe(400);

    // Prune: only unused uploads past the grace period.
    const old = (await upload(editor, await picture("png"), "image/png").expect(201)).body.id as string;
    await MediaAsset.updateOne({ _id: old }, { createdAt: new Date(clock.now().getTime() - 25 * 3_600_000) });
    const fresh = (await upload(editor, await picture("png"), "image/png").expect(201)).body.id as string;
    const media = createMediaService({ dir: "/nonexistent-not-used-for-scan", now: clock.now });
    const candidates = await media.pruneCandidates();
    expect(candidates).toContain(old);
    expect(candidates).not.toContain(fresh);
    expect(candidates).not.toContain(used);
  });
});
