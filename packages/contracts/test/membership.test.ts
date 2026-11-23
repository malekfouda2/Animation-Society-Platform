import { describe, expect, it } from "vitest";
import { EMPTY_ANSWERS, NO_RULES, ageOn, applicationAnswersSchema, createPlanSchema, formatPrice, monthsLeftInYear, phoneSchema, proratedFee, reapplyDate, saveApplicationSchema, submitIssues } from "../src/membership.js";

describe("membership contracts", () => {
  it("lists every missing answer before submitting", () => {
    expect(submitIssues("", EMPTY_ANSWERS)).toEqual({
      planId: ["plan"],
      "answers.fullName": ["required"],
      "answers.fullNameEn": ["required"],
      "answers.phone": ["required"],
      "answers.city": ["required"],
      "answers.specialization": ["required"],
      "answers.photoId": ["photo"],
    });
    const full = { ...EMPTY_ANSWERS, fullName: "مقدم تجريبي", fullNameEn: "Synthetic Applicant", phone: "+966 50 000 0000", city: "Riyadh", specialization: "2d" as const, photoId: "a".repeat(24) };
    expect(submitIssues("b".repeat(24), full)).toEqual({});
    expect(submitIssues("b".repeat(24), { ...full, phone: "12" })).toEqual({ "answers.phone": ["phone"] });
  });

  it("requires the card name in Arabic and in English letters", () => {
    const full = { ...EMPTY_ANSWERS, fullName: "مُقدّم تجريبي", fullNameEn: "Anne-Marie O'Neil", phone: "+966500000000", city: "Riyadh", specialization: "2d" as const, photoId: "a".repeat(24) };
    expect(submitIssues("b".repeat(24), full)).toEqual({});
    expect(submitIssues("b".repeat(24), { ...full, fullName: "Synthetic" })).toEqual({ "answers.fullName": ["name_ar"] });
    expect(submitIssues("b".repeat(24), { ...full, fullNameEn: "مقدم" })).toEqual({ "answers.fullNameEn": ["name_en"] });
    expect(submitIssues("b".repeat(24), { ...full, fullNameEn: "..." })).toEqual({ "answers.fullNameEn": ["name_en"] });
  });

  it("opens reapplying six calendar months after a rejection", () => {
    expect(reapplyDate(new Date("2026-03-15T10:00:00Z")).toISOString()).toBe("2026-09-15T10:00:00.000Z");
    expect(reapplyDate(new Date("2026-08-31T10:00:00Z")).toISOString()).toBe("2027-02-28T10:00:00.000Z");
    expect(reapplyDate(new Date("2026-11-23T00:00:00Z")).toISOString()).toBe("2027-05-23T00:00:00.000Z");
  });

  it("normalises phone numbers and refuses other text", () => {
    expect(phoneSchema.parse(" +966 50-000 0000 ")).toBe("+966500000000");
    expect(applicationAnswersSchema.safeParse({ ...EMPTY_ANSWERS, phone: "call me" }).success).toBe(false);
  });

  it("refuses fields the applicant may not set", () => {
    const r = saveApplicationSchema.safeParse({ version: -1, planId: "", answers: EMPTY_ANSWERS, status: "approved" });
    expect(r.success).toBe(false);
    const extra = saveApplicationSchema.safeParse({ version: -1, planId: "", answers: { ...EMPTY_ANSWERS, priceMinor: 1 } });
    expect(extra.success).toBe(false);
  });

  it("requires both plan names and a whole, positive duration", () => {
    const base = { key: "demo", name: { ar: "تجريبي", en: "Demo" }, summary: { ar: "", en: "" }, eligibility: { ar: "", en: "" }, priceMinor: 1000, currency: "SAR", durationMonths: 12, enabled: true };
    expect(createPlanSchema.safeParse(base).success).toBe(true);
    expect(createPlanSchema.safeParse({ ...base, name: { ar: "", en: "Demo" } }).success).toBe(false);
    expect(createPlanSchema.safeParse({ ...base, durationMonths: 0 }).success).toBe(false);
    expect(createPlanSchema.safeParse({ ...base, priceMinor: 10.5 }).success).toBe(false);
  });

  it("formats minor units", () => {
    expect(formatPrice(1000, "SAR", "en")).toContain("10.00");
  });

  it("applies the bylaws' conditions of the chosen plan", () => {
    const today = new Date("2026-11-19T12:00:00Z");
    const full = { ...EMPTY_ANSWERS, fullName: "مقدم تجريبي", fullNameEn: "Synthetic Applicant", phone: "+966500000000", city: "Riyadh", specialization: "2d" as const, photoId: "a".repeat(24) };
    const plan = "b".repeat(24);
    // Participant: over 18.
    const adult = { ...NO_RULES, minAge: 18 };
    expect(submitIssues(plan, full, adult, today)).toEqual({ "answers.birthDate": ["required"] });
    expect(submitIssues(plan, { ...full, birthDate: "2008-11-20" }, adult, today)).toEqual({ "answers.birthDate": ["age"] });
    expect(submitIssues(plan, { ...full, birthDate: "2008-11-19" }, adult, today)).toEqual({});
    expect(submitIssues(plan, { ...full, birthDate: "2027-01-01" }, adult, today)).toEqual({ "answers.birthDate": ["date"] });
    // Student: proof of study.
    expect(submitIssues(plan, full, { ...NO_RULES, studentProof: true }, today)).toEqual({ "answers.studentProofId": ["student_proof"] });
    expect(submitIssues(plan, { ...full, studentProofId: "c".repeat(24) }, { ...NO_RULES, studentProof: true }, today)).toEqual({});
    // Ordinary: six months' earlier membership (and over 18).
    const ordinary = { ...NO_RULES, minAge: 18, priorMembershipMonths: 6, generalAssembly: true };
    const grown = { ...full, birthDate: "1990-01-01" };
    expect(submitIssues(plan, { ...grown, memberSince: "2026-06" }, ordinary, today)).toEqual({ "answers.memberSince": ["prior_membership"] });
    expect(submitIssues(plan, { ...grown, memberSince: "2026-05" }, ordinary, today)).toEqual({});
    expect(ageOn("2000-02-29", new Date("2026-02-28T00:00:00Z"))).toBe(25);
  });

  it("pro-rates the yearly fee by the months left in the financial year (Riyadh time)", () => {
    expect(monthsLeftInYear(new Date("2026-01-15T00:00:00Z"))).toBe(12);
    expect(monthsLeftInYear(new Date("2026-12-31T20:59:00Z"))).toBe(1);
    expect(monthsLeftInYear(new Date("2026-12-31T21:00:00Z"))).toBe(12); // already 1 January in Riyadh
    expect(proratedFee(40_000, new Date("2026-07-01T00:00:00Z"))).toEqual({ amountMinor: 20_000, months: 6, periodEnd: "2026-12-31" });
    expect(proratedFee(20_000, new Date("2026-11-19T12:00:00Z"))).toEqual({ amountMinor: 3_333, months: 2, periodEnd: "2026-12-31" });
    expect(proratedFee(60_000, new Date("2026-12-31T20:59:00Z")).periodEnd).toBe("2026-12-31");
  });
});
