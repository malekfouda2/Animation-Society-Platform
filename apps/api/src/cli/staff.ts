/**
 * Operator command for staff accounts. There is deliberately no public or seed route that creates
 * administrators: the first admin is invited from the server shell, and receives an emailed link to
 * choose a password (no password ever passes through the shell or its history).
 *
 *   npm run staff -w @as/api -- invite --email a@example.org --name "Name" --role admin --locale ar
 *   npm run staff -w @as/api -- reset-mfa --email a@example.org --reason "Lost phone, identity checked by X"
 *   npm run staff -w @as/api -- disable --email a@example.org --reason "Left the Society"
 */
import { emailSchema, LOCALES, nameSchema } from "@as/contracts";
import { parseArgs } from "node:util";
import { z } from "zod";
import { loadEnv } from "../config/env.js";
import { connectDatabase } from "../db/mongo.js";
import { audit } from "../features/audit/audit.model.js";
import { AuthToken, MfaCredential, Session, User } from "../features/auth/auth.models.js";
import { TOKEN_TTL } from "../features/auth/auth.service.js";
import { digest, randomToken } from "../features/auth/secrets.js";
import { createMailer, localInboxTransport } from "../features/email/email.service.js";

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: {
    email: { type: "string" },
    name: { type: "string" },
    role: { type: "string" },
    locale: { type: "string" },
    reason: { type: "string" },
  },
});

function fail(message: string): never {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}

async function main() {
  const env = loadEnv();
  if (env.EMAIL_MODE !== "mock") fail("No email adapter is implemented for this EMAIL_MODE yet.");
  const db = await connectDatabase(env.MONGODB_URI);
  const mailer = createMailer(localInboxTransport);
  const now = new Date();
  const command = positionals[0];
  try {
    const email = emailSchema.parse(values.email);
    if (command === "invite") {
      const name = nameSchema.parse(values.name);
      const role = z.enum(["admin", "editor"]).parse(values.role);
      const locale = z.enum(LOCALES).parse(values.locale ?? "ar");
      let user = await User.findOne({ email });
      if (user) {
        // Promoting an existing account: end its sessions so the new role starts with a fresh sign-in.
        const from = user.role;
        user.role = role;
        await user.save();
        await Session.deleteMany({ userId: user._id });
        await audit({ actorId: null, actorKind: "cli", action: "user.role_changed", targetType: "user", targetId: String(user._id), meta: { from, to: role } }, now);
      } else {
        user = await User.create({ email, name, role, locale, passwordHash: null });
        await audit({ actorId: null, actorKind: "cli", action: "user.staff_invited", targetType: "user", targetId: String(user._id), meta: { role } }, now);
      }
      await AuthToken.updateMany({ userId: user._id, purpose: "set_password", usedAt: null }, { usedAt: now });
      const token = randomToken();
      await AuthToken.create({ tokenHash: digest(token), userId: user._id, purpose: "set_password", expiresAt: new Date(now.getTime() + TOKEN_TTL.set_password) });
      await mailer.send(user.email, user.locale, { template: "staff_invite", vars: { name: user.name, role, link: `${env.PUBLIC_ORIGIN}/${user.locale}/reset-password?token=${token}&invite=1` } });
      process.stdout.write(`Invitation emailed to ${email} (role ${role}). In development, open the local inbox at ${env.PUBLIC_ORIGIN}/${user.locale}/dev/inbox\n`);
    } else if (command === "reset-mfa" || command === "disable") {
      const reason = z.string().trim().min(5).max(500).parse(values.reason);
      const user = await User.findOne({ email });
      if (!user) fail("No account with that email.");
      if (command === "reset-mfa") {
        // The staff member enrols a new authenticator at their next sign-in.
        await MfaCredential.deleteOne({ userId: user._id });
      } else {
        user.status = "disabled";
        await user.save();
      }
      await Session.deleteMany({ userId: user._id });
      await audit({ actorId: null, actorKind: "cli", action: command === "reset-mfa" ? "mfa.reset" : "user.disabled", targetType: "user", targetId: String(user._id), reason }, now);
      process.stdout.write(`${command} done for ${email}; their sessions were ended.\n`);
    } else {
      fail("Usage: staff invite|reset-mfa|disable --email … (see src/cli/staff.ts)");
    }
  } catch (err) {
    if (err instanceof z.ZodError) fail(`Invalid arguments: ${err.issues.map((i) => i.path.join(".") || i.message).join(", ")}`);
    throw err;
  } finally {
    await db.disconnect();
  }
}

void main();
