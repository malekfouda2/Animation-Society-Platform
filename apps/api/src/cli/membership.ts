/**
 * Operator command for membership plans.
 *
 *   npm run membership -w @as/api -- seed-demo-plans
 *   npm run membership -w @as/api -- seed-society-plans
 *
 * `seed-society-plans` adds the Society's four plans from its bylaws and 2026 profile (see
 * SOCIETY_PLANS) and, in development, switches the demo plans off.
 *
 * Adds two DEMO plans for development, modelled on the two membership types people apply for in
 * the Society's materials (working and affiliate). Their prices (SAR 10.00 and 5.00) and the
 * 12-month duration are synthetic: the Society has not approved plans, prices or durations
 * (DECISIONS D02). Every screen labels them "demo". Refuses to run in production. Skips any plan
 * whose key already exists, so it is safe to run again.
 */
import { loadEnv } from "../config/env.js";
import { connectDatabase } from "../db/mongo.js";
import { audit } from "../features/audit/audit.model.js";
import { MembershipPlan } from "../features/membership/membership.models.js";

const DEMO_PLANS = [
  {
    key: "demo-working",
    name: { ar: "العضوية العاملة (تجريبية)", en: "Working membership (demo)" },
    summary: {
      ar: "خطة تجريبية للتطوير فقط. السعر والمدة غير معتمدين من الجمعية.",
      en: "A demo plan for development only. The price and duration are not the Society's.",
    },
    eligibility: {
      ar: "للمتخصصين والممارسين في مجال الرسوم المتحركة (وصف مؤقت من مواد الجمعية).",
      en: "For specialists and practitioners in animation (provisional wording from the Society's materials).",
    },
    priceMinor: 1000,
    sortOrder: 1,
  },
  {
    key: "demo-affiliate",
    name: { ar: "العضوية المنتسبة (تجريبية)", en: "Affiliate membership (demo)" },
    summary: {
      ar: "خطة تجريبية للتطوير فقط. السعر والمدة غير معتمدين من الجمعية.",
      en: "A demo plan for development only. The price and duration are not the Society's.",
    },
    eligibility: {
      ar: "لمن لا تنطبق عليه شروط العضوية العاملة (وصف مؤقت من مواد الجمعية).",
      en: "For applicants who don't meet the working-membership conditions (provisional wording from the Society's materials).",
    },
    priceMinor: 500,
    sortOrder: 2,
  },
];

/**
 * The Society's plans, from its bylaws (Articles 8(6), 8(7), 9, 10, 12, 17) and 2026 profile. Names,
 * fees and conditions are copied from those documents; English is a developer translation (D08).
 * Supporting membership needs an unrestricted donation of at least SAR 100,000 from the member's own
 * account, which a card checkout cannot take. It is offered by request (Malek, 23 Nov 2026): the
 * application is the request, staff meet the applicant externally, then approve in the dashboard.
 */
const SOCIETY_PLANS = [
  {
    key: "student",
    name: { ar: "عضوية الطالب «المنتسب»", en: "Student (affiliate) membership" },
    summary: { ar: "ابدأ من مقعد الدراسة، وابنِ مهارتك وحضورك داخل مجتمع الرسوم المتحركة.", en: "Start from your seat in class, and build your skills and presence in the animation community." },
    eligibility: { ar: "إثبات صفة طالب بوثيقة سارية. لا تمنح هذه العضوية حضور الجمعية العمومية أو التصويت أو الترشح.", en: "Proof of student status with a valid document. This membership does not give the right to attend the General Assembly, vote or stand for election." },
    priceMinor: 20_000,
    enabled: true,
    sortOrder: 1,
    rules: { minAge: 0, studentProof: true, priorMembershipMonths: 0, generalAssembly: false },
  },
  {
    key: "participant",
    name: { ar: "عضوية المشارك", en: "Participant membership" },
    summary: { ar: "وسّع خبرتك وعلاقاتك، وكن أقرب إلى مجتمع الصناعة وفرصه.", en: "Grow your experience and network, and get closer to the industry and its opportunities." },
    eligibility: { ar: "أن يكون المتقدم قد تجاوز 18 عامًا. لا يحق للمشارك حضور الجمعية العمومية أو التصويت فيها.", en: "The applicant must be over 18. A participant may not attend or vote in the General Assembly." },
    priceMinor: 40_000,
    enabled: true,
    sortOrder: 2,
    rules: { minAge: 18, studentProof: false, priorMembershipMonths: 0, generalAssembly: false },
  },
  {
    key: "ordinary",
    name: { ar: "العضوية العادية «القيادي»", en: "Ordinary (leader) membership" },
    summary: { ar: "انتقل من المشاركة إلى صناعة القرار داخل الجمعية العمومية.", en: "Move from taking part to making decisions in the General Assembly." },
    eligibility: { ar: "كمال الأهلية وحسن السيرة والسلوك، ومضي ستة أشهر على عضوية الجمعية. يراجع الطلب اللجنة ثم يصدر قرار مجلس الإدارة.", en: "Full legal capacity and good conduct, and at least six months as a member of the Society. The committee reviews the application, then the board decides." },
    priceMinor: 60_000,
    enabled: true,
    sortOrder: 3,
    rules: { minAge: 18, studentProof: false, priorMembershipMonths: 6, generalAssembly: true },
  },
  {
    key: "supporting",
    name: { ar: "العضوية الداعمة", en: "Supporting membership" },
    summary: { ar: "حوّل دعمك إلى أثر مؤسسي يساند استدامة الجمعية ونموها.", en: "Turn your support into institutional impact that sustains the Society and its growth." },
    eligibility: { ar: "استيفاء شروط العضوية العادية، وتبرع غير مقيد لا يقل عن 100,000 ريال يصدر من الحساب الخاص للعضو.", en: "Meet the conditions of ordinary membership, plus an unrestricted donation of at least SAR 100,000 from the member's own account." },
    priceMinor: 60_000,
    enabled: true,
    sortOrder: 4,
    rules: { minAge: 18, studentProof: false, priorMembershipMonths: 6, generalAssembly: true, byRequest: true },
  },
];

const USAGE = "Usage: npm run membership -w @as/api -- seed-demo-plans | seed-society-plans\n";

async function seedSocietyPlans(production: boolean) {
  const at = new Date();
  for (const plan of SOCIETY_PLANS) {
    if (await MembershipPlan.exists({ key: plan.key })) {
      process.stdout.write(`skip ${plan.key} (exists)\n`);
      continue;
    }
    const [doc] = await MembershipPlan.create([{ ...plan, currency: "SAR", durationMonths: 12, demo: false, version: 0, createdAt: at, updatedAt: at }]);
    await audit({ actorId: null, actorKind: "cli", action: "plan.created", targetType: "plan", targetId: String(doc?._id), reason: "Society plans from the bylaws and 2026 profile", meta: { key: plan.key, priceMinor: plan.priceMinor, currency: "SAR", enabled: plan.enabled } }, at);
    process.stdout.write(`added ${plan.key}${plan.enabled ? "" : " (switched off)"}\n`);
  }
  // A supporting plan seeded before the by-request flow existed moves to it, once.
  const supporting = await MembershipPlan.findOneAndUpdate({ key: "supporting", "rules.byRequest": { $ne: true } }, { $set: { "rules.byRequest": true, enabled: true, updatedAt: at }, $inc: { version: 1 } }, { returnDocument: "after" }).lean();
  if (supporting) {
    await audit({ actorId: null, actorKind: "cli", action: "plan.updated", targetType: "plan", targetId: String(supporting._id), reason: "supporting membership offered by request", meta: { key: "supporting", enabled: true, byRequest: true } }, at);
    process.stdout.write("supporting now offered by request\n");
  }
  // Demo plans stop being offered once the real ones exist (development only; production never has them).
  if (!production) {
    const demo = await MembershipPlan.find({ demo: true, enabled: true }, { _id: 1, key: 1 }).lean();
    for (const d of demo) {
      await MembershipPlan.updateOne({ _id: d._id }, { $set: { enabled: false, updatedAt: at }, $inc: { version: 1 } });
      await audit({ actorId: null, actorKind: "cli", action: "plan.updated", targetType: "plan", targetId: String(d._id), reason: "demo plan retired for the Society's plans", meta: { key: d.key, enabled: false } }, at);
      process.stdout.write(`switched off ${d.key} (demo)\n`);
    }
  }
}

async function main() {
  const command = process.argv[2];
  if (command !== "seed-demo-plans" && command !== "seed-society-plans") {
    process.stderr.write(USAGE);
    process.exit(1);
  }
  const env = loadEnv();
  if (command === "seed-demo-plans" && env.NODE_ENV === "production") {
    process.stderr.write("Demo plans are for development only; refusing to seed them in production.\n");
    process.exit(1);
  }
  const db = await connectDatabase(env.MONGODB_URI);
  try {
    if (command === "seed-society-plans") {
      await seedSocietyPlans(env.NODE_ENV === "production");
      return;
    }
    const at = new Date();
    for (const plan of DEMO_PLANS) {
      if (await MembershipPlan.exists({ key: plan.key })) {
        process.stdout.write(`skip ${plan.key} (exists)\n`);
        continue;
      }
      const [doc] = await MembershipPlan.create([{ ...plan, currency: "SAR", durationMonths: 12, enabled: true, demo: true, version: 0, createdAt: at, updatedAt: at }]);
      await audit({ actorId: null, actorKind: "cli", action: "plan.created", targetType: "plan", targetId: String(doc?._id), reason: "demo plan seed", meta: { key: plan.key, demo: true } }, at);
      process.stdout.write(`added ${plan.key} (demo)\n`);
    }
  } finally {
    await db.disconnect();
  }
}

void main();
