/* eslint-disable @typescript-eslint/no-unsafe-member-access -- supertest bodies are untyped; each value is asserted. */
import { generate } from "otplib";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Database } from "../../src/db/mongo.js";
import { AuditEvent } from "../../src/features/audit/audit.model.js";
import { MfaCredential, Session, User } from "../../src/features/auth/auth.models.js";
import { hashPassword } from "../../src/features/auth/secrets.js";
import { Email } from "../../src/features/email/email.model.js";
import { ORIGIN, buildApp, connectFresh, lastEmail, testClock, testUri } from "./helpers.js";

const uri = testUri("animation_society_it_auth");
const MIN = 60_000;
const PASSWORD = "correct horse battery";

describe.skipIf(!uri)("accounts and sessions (integration)", () => {
  let db: Database;
  const clock = testClock();
  const app = buildApp(clock);
  const post = (agent: ReturnType<typeof request.agent>, path: string, body: object = {}) =>
    agent.post(`/api/v1${path}`).set("Origin", ORIGIN).send(body);

  beforeAll(async () => { db = await connectFresh(uri ?? ""); });
  afterAll(async () => { await db.disconnect(); });

  async function registerVerified(email: string, name = "Synthetic Member") {
    const agent = request.agent(app);
    await post(agent, "/auth/register", { name, email, password: PASSWORD, locale: "en" }).expect(202);
    const { token } = await lastEmail(email);
    await post(agent, "/auth/verify-email", { token }).expect(200);
    return agent;
  }

  async function signIn(email: string, password = PASSWORD) {
    const agent = request.agent(app);
    const res = await post(agent, "/auth/sign-in", { email, password });
    return { agent, res };
  }

  it("registers, requires email confirmation, and makes each link single-use", async () => {
    const agent = request.agent(app);
    await post(agent, "/auth/register", { name: "Synthetic One", email: "One@Example.test ", password: PASSWORD, locale: "ar" }).expect(202);
    const user = await User.findOne({ email: "one@example.test" }).lean();
    expect(user?.passwordHash).toMatch(/^\$argon2id\$/);
    expect(user?.role).toBe("member");

    const blocked = await post(agent, "/auth/sign-in", { email: "one@example.test", password: PASSWORD });
    expect(blocked.status).toBe(403);
    expect(blocked.body.error.code).toBe("email_unverified");

    const { token, locale, text } = await lastEmail("one@example.test");
    expect(locale).toBe("ar");
    expect(text).toContain(`${ORIGIN}/ar/verify-email?token=`);
    await post(agent, "/auth/verify-email", { token }).expect(200);
    const reused = await post(agent, "/auth/verify-email", { token });
    expect(reused.status).toBe(400);
    expect(reused.body.error.code).toBe("token_invalid");

    const ok = await post(agent, "/auth/sign-in", { email: "one@example.test", password: PASSWORD });
    expect(ok.status).toBe(200);
    expect(ok.body).toMatchObject({ next: "done", user: { email: "one@example.test", role: "member", mfa: "not_required" } });
    const cookie = String(ok.headers["set-cookie"]);
    expect(cookie).toMatch(/as_session=[A-Za-z0-9_-]{43}/);
    expect(cookie).toMatch(/HttpOnly/);
    expect(cookie).toMatch(/SameSite=Lax/);
    expect(ok.headers["cache-control"]).toBe("no-store");
    // Only a digest of the token is stored.
    const raw = /as_session=([A-Za-z0-9_-]{43})/.exec(cookie)?.[1] ?? "";
    expect(await Session.countDocuments({ tokenHash: raw })).toBe(0);

    const me = await agent.get("/api/v1/auth/session").expect(200);
    expect(me.body.email).toBe("one@example.test");
  });

  it("answers a duplicate sign-up like a new one and emails the owner instead", async () => {
    const agent = request.agent(app);
    await post(agent, "/auth/register", { name: "Someone Else", email: "one@example.test", password: "another long password", locale: "en" }).expect(202);
    expect(await User.countDocuments({ email: "one@example.test" })).toBe(1);
    expect((await lastEmail("one@example.test")).template).toBe("account_exists");
  });

  it("expires an unused confirmation link after 24 hours", async () => {
    const agent = request.agent(app);
    await post(agent, "/auth/register", { name: "Late Clicker", email: "late@example.test", password: PASSWORD, locale: "en" }).expect(202);
    const { token } = await lastEmail("late@example.test");
    clock.advance(24 * 60 * MIN + 1);
    const res = await post(agent, "/auth/verify-email", { token });
    expect(res.body.error.code).toBe("token_invalid");
    // A fresh link works, and the old one stays dead.
    await post(agent, "/auth/verify-email/resend", { email: "late@example.test", locale: "en" }).expect(202);
    const fresh = await lastEmail("late@example.test");
    expect(fresh.token).not.toBe(token);
    await post(agent, "/auth/verify-email", { token: fresh.token }).expect(200);
  });

  it("gives the same error for a wrong password and an unknown email", async () => {
    const wrong = await signIn("one@example.test", "not the password at all");
    const unknown = await signIn("nobody@example.test", PASSWORD);
    expect(wrong.res.status).toBe(401);
    expect(unknown.res.status).toBe(401);
    expect(wrong.res.body.error.code).toBe("invalid_credentials");
    expect(unknown.res.body.error.message).toBe(wrong.res.body.error.message);
  });

  it("refuses state-changing requests from another origin", async () => {
    const res = await request(app).post("/api/v1/auth/sign-in").set("Origin", "https://evil.example").send({ email: "one@example.test", password: PASSWORD });
    expect(res.status).toBe(403);
    const none = await request(app).post("/api/v1/auth/sign-out");
    expect(none.status).toBe(403);
  });

  it("signs out by revoking the session on the server", async () => {
    const { agent, res } = await signIn("one@example.test");
    const cookie = String(res.headers["set-cookie"]).split(";")[0] ?? "";
    await post(agent, "/auth/sign-out").expect(204);
    // Replaying the old cookie after sign-out does not work.
    await request(app).get("/api/v1/auth/session").set("Cookie", cookie).expect(401);
  });

  it("ends an idle member session after 14 days", async () => {
    const { agent } = await signIn("one@example.test");
    clock.advance(13 * 24 * 60 * MIN);
    await agent.get("/api/v1/auth/session").expect(200);
    clock.advance(14 * 24 * 60 * MIN + MIN);
    await agent.get("/api/v1/auth/session").expect(401);
  });

  it("resets a password once, within an hour, and revokes every session", async () => {
    const email = "reset@example.test";
    const member = await registerVerified(email);
    const { agent: other } = await signIn(email);
    await member.get("/api/v1/auth/session").expect(401); // registerVerified's agent never signed in
    await other.get("/api/v1/auth/session").expect(200);

    await post(request.agent(app), "/auth/password/forgot", { email, locale: "en" }).expect(202);
    const first = await lastEmail(email);
    clock.advance(61 * MIN);
    expect((await post(request.agent(app), "/auth/password/reset", { token: first.token, password: "a brand new password" })).body.error.code).toBe("token_invalid");

    await post(request.agent(app), "/auth/password/forgot", { email, locale: "en" }).expect(202);
    const second = await lastEmail(email);
    await post(request.agent(app), "/auth/password/reset", { token: second.token, password: "a brand new password" }).expect(200);
    expect((await post(request.agent(app), "/auth/password/reset", { token: second.token, password: "yet another password" })).body.error.code).toBe("token_invalid");

    await other.get("/api/v1/auth/session").expect(401);
    expect((await signIn(email)).res.status).toBe(401);
    expect((await signIn(email, "a brand new password")).res.status).toBe(200);
    expect((await lastEmail(email)).template).toBe("password_changed");
    expect(await AuditEvent.countDocuments({ action: "auth.password_reset" })).toBe(1);
  });

  it("answers a reset request for an unknown email the same way, sending nothing", async () => {
    const before = await Email.countDocuments();
    await post(request.agent(app), "/auth/password/forgot", { email: "ghost@example.test", locale: "en" }).expect(202);
    expect(await Email.countDocuments()).toBe(before);
  });

  it("updates only whitelisted profile fields", async () => {
    const { agent } = await signIn("one@example.test");
    const sneaky = await agent.patch("/api/v1/account/profile").set("Origin", ORIGIN).send({ name: "New Name", locale: "en", role: "admin" });
    expect(sneaky.status).toBe(400);
    const ok = await agent.patch("/api/v1/account/profile").set("Origin", ORIGIN).send({ name: "New Name", locale: "en" });
    expect(ok.status).toBe(200);
    expect(ok.body).toMatchObject({ name: "New Name", role: "member" });
  });

  it("changing the password keeps this session and ends the others", async () => {
    const email = "change@example.test";
    await registerVerified(email);
    const a = await signIn(email);
    const b = await signIn(email);
    const res = await a.agent.post("/api/v1/account/password").set("Origin", ORIGIN).send({ currentPassword: PASSWORD, newPassword: "changed password here" });
    expect(res.status).toBe(200);
    await a.agent.get("/api/v1/auth/session").expect(200);
    await b.agent.get("/api/v1/auth/session").expect(401);
  });

  it("keeps members out of the staff API", async () => {
    const { agent } = await signIn("one@example.test");
    const res = await agent.get("/api/v1/admin/overview");
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("forbidden");
    await request(app).get("/api/v1/admin/overview").expect(401);
  });

  describe("staff two-step sign-in", () => {
    const adminEmail = "admin@example.test";
    let secret = "";
    let recovery: string[] = [];
    const code = async (offsetSteps = 0) =>
      generate({ secret, epoch: Math.floor(clock.now().getTime() / 1000) + offsetSteps * 30 });

    beforeAll(async () => {
      await User.create({ email: adminEmail, name: "Synthetic Admin", role: "admin", locale: "en", passwordHash: await hashPassword(PASSWORD), emailVerifiedAt: clock.now() });
      await User.create({ email: "editor@example.test", name: "Synthetic Editor", role: "editor", locale: "ar", passwordHash: await hashPassword(PASSWORD), emailVerifiedAt: clock.now() });
    });

    it("requires enrolment before any staff route works", async () => {
      const { agent, res } = await signIn(adminEmail);
      expect(res.body).toMatchObject({ next: "mfa_enroll", user: { role: "admin", mfa: "enroll" } });
      const blocked = await agent.get("/api/v1/admin/overview");
      expect(blocked.status).toBe(403);
      expect(blocked.body.error.code).toBe("mfa_required");

      const enrol = await post(agent, "/auth/mfa/enroll").expect(200);
      expect(enrol.body.uri).toMatch(/^otpauth:\/\/totp\//);
      expect(enrol.body.qrSvg).toMatch(/^<svg/);
      secret = enrol.body.secret as string;
      // The stored secret is sealed, never plain.
      const cred = await MfaCredential.findOne().lean();
      expect(cred?.pendingSecretSealed).toMatch(/^v1\./);
      expect(JSON.stringify(cred)).not.toContain(secret);

      expect((await post(agent, "/auth/mfa/enroll/confirm", { code: "000000" })).status).toBe(400);
      const oldCookie = String(res.headers["set-cookie"]).split(";")[0] ?? "";
      const confirmed = await post(agent, "/auth/mfa/enroll/confirm", { code: await code() }).expect(200);
      recovery = confirmed.body.recoveryCodes as string[];
      expect(recovery).toHaveLength(10);
      // Session token rotated on reaching full access.
      await request(app).get("/api/v1/auth/session").set("Cookie", oldCookie).expect(401);
      await agent.get("/api/v1/admin/overview").expect(200);
      await agent.get("/api/v1/admin/audit").expect(200);
    });

    it("asks for a code at every sign-in and refuses a replayed one", async () => {
      clock.advance(30_000);
      const { agent, res } = await signIn(adminEmail);
      expect(res.body.next).toBe("mfa_verify");
      const c = await code();
      await post(agent, "/auth/mfa/verify", { code: c }).expect(200);
      await agent.get("/api/v1/admin/overview").expect(200);

      const second = await signIn(adminEmail);
      const replay = await post(second.agent, "/auth/mfa/verify", { code: c });
      expect(replay.status).toBe(400);
      clock.advance(30_000);
      await post(second.agent, "/auth/mfa/verify", { code: await code() }).expect(200);
    });

    it("accepts each recovery code once", async () => {
      const a = await signIn(adminEmail);
      await post(a.agent, "/auth/mfa/verify", { recoveryCode: recovery[0]?.toLowerCase() }).expect(200);
      const b = await signIn(adminEmail);
      expect((await post(b.agent, "/auth/mfa/verify", { recoveryCode: recovery[0] })).status).toBe(400);
      const left = await a.agent.get("/api/v1/auth/mfa/recovery-codes").expect(200);
      expect(left.body.remaining).toBe(9);
    });

    it("ends the session after five wrong codes", async () => {
      const { agent } = await signIn(adminEmail);
      for (let i = 0; i < 4; i++) expect((await post(agent, "/auth/mfa/verify", { code: "123456" })).status).toBe(400);
      expect((await post(agent, "/auth/mfa/verify", { code: "123456" })).status).toBe(401);
      await agent.get("/api/v1/auth/session").expect(401);
    });

    it("drops a half-finished staff sign-in after 10 minutes and idle staff sessions after 30", async () => {
      const pending = await signIn(adminEmail);
      clock.advance(11 * MIN);
      await pending.agent.get("/api/v1/auth/session").expect(401);

      const { agent } = await signIn(adminEmail);
      await post(agent, "/auth/mfa/verify", { code: await code() }).expect(200);
      clock.advance(29 * MIN);
      await agent.get("/api/v1/admin/overview").expect(200);
      clock.advance(31 * MIN);
      await agent.get("/api/v1/admin/overview").expect(401);
    });

    it("lets an editor into the staff area but not the administrator-only audit log", async () => {
      const { agent, res } = await signIn("editor@example.test");
      expect(res.body.next).toBe("mfa_enroll");
      const enrol = await post(agent, "/auth/mfa/enroll").expect(200);
      const editorSecret = enrol.body.secret as string;
      await post(agent, "/auth/mfa/enroll/confirm", { code: await generate({ secret: editorSecret, epoch: Math.floor(clock.now().getTime() / 1000) }) }).expect(200);
      await agent.get("/api/v1/admin/overview").expect(200);
      const audit = await agent.get("/api/v1/admin/audit");
      expect(audit.status).toBe(403);
      expect(audit.body.error.code).toBe("forbidden");
    });

    it("records enrolment and recovery-code use in the audit log without secrets", async () => {
      const events = await AuditEvent.find({ action: /^mfa\./ }).lean();
      expect(events.map((e) => e.action).sort()).toEqual(["mfa.enrolled", "mfa.enrolled", "mfa.recovery_code_used"]);
      expect(JSON.stringify(events)).not.toContain(secret);
    });
  });
});
