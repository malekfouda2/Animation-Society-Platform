import { APPLICATION_ACTIONS, APPLICATION_STATES, CURRENCIES, SPECIALIZATIONS } from "@as/contracts";
import { Schema } from "mongoose";
import { defineModel } from "../../db/model.js";

const localized = (max: number) => ({
  ar: { type: String, default: "", maxlength: max },
  en: { type: String, default: "", maxlength: max },
});

const rulesSchema = new Schema(
  {
    minAge: { type: Number, default: 0, min: 0, max: 120 },
    studentProof: { type: Boolean, default: false },
    priorMembershipMonths: { type: Number, default: 0, min: 0, max: 120 },
    generalAssembly: { type: Boolean, default: false },
    byRequest: { type: Boolean, default: false },
  },
  { _id: false },
);

/**
 * A membership plan. Price is in minor units and only ever read from here by the server.
 * `rules` are the bylaws' conditions for the plan; `demo` marks synthetic development plans.
 */
const planSchema = new Schema(
  {
    key: { type: String, required: true, maxlength: 40 },
    name: localized(80),
    summary: localized(400),
    eligibility: localized(600),
    priceMinor: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, enum: CURRENCIES },
    durationMonths: { type: Number, required: true, min: 1 },
    enabled: { type: Boolean, required: true, default: false },
    rules: { type: rulesSchema, default: () => ({}) },
    demo: { type: Boolean, required: true, default: false },
    sortOrder: { type: Number, default: 0 },
    version: { type: Number, required: true, default: 0 },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
  },
  { collection: "membershipPlans", versionKey: false },
);
planSchema.index({ key: 1 }, { unique: true });
planSchema.index({ enabled: 1, sortOrder: 1 });
export const MembershipPlan = defineModel("MembershipPlan", planSchema);

const snapshotSchema = new Schema(
  {
    id: String,
    key: String,
    name: localized(80),
    summary: localized(400),
    eligibility: localized(600),
    priceMinor: Number,
    currency: { type: String, enum: CURRENCIES },
    durationMonths: Number,
    rules: { type: rulesSchema, default: () => ({}) },
    demo: Boolean,
    version: Number,
  },
  { _id: false },
);

/**
 * One membership application per account. The review state is separate from payment and from
 * membership entitlement (Stage 4). History lives in applicationEvents, not in this document.
 */
const applicationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    /** Copy of the account email when the application was created, for staff search. */
    email: { type: String, required: true, maxlength: 254 },
    status: { type: String, required: true, enum: APPLICATION_STATES, default: "draft" },
    planId: { type: Schema.Types.ObjectId, ref: "MembershipPlan", default: null },
    /** The plan as it stood at the last (re)submission. */
    planSnapshot: { type: snapshotSchema, default: null },
    answers: {
      fullName: { type: String, default: "", maxlength: 120 },
      fullNameEn: { type: String, default: "", maxlength: 120 },
      phone: { type: String, default: "", maxlength: 24 },
      city: { type: String, default: "", maxlength: 80 },
      specialization: { type: String, default: "", enum: ["", ...SPECIALIZATIONS] },
      photoId: { type: Schema.Types.ObjectId, ref: "MediaAsset", default: null },
      birthDate: { type: String, default: "", maxlength: 10 },
      /** A private image (member_photo purpose: owner and administrators only) proving student status. */
      studentProofId: { type: Schema.Types.ObjectId, ref: "MediaAsset", default: null },
      memberSince: { type: String, default: "", maxlength: 7 },
    },
    /** Latest correction request or rejection reason (also kept in the history). */
    staffMessage: { type: String, default: null, maxlength: 1000 },
    submittedAt: { type: Date, default: null },
    decidedAt: { type: Date, default: null },
    decidedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    version: { type: Number, required: true, default: 0 },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
  },
  { collection: "applications", versionKey: false },
);
applicationSchema.index({ userId: 1 }, { unique: true });
applicationSchema.index({ status: 1, updatedAt: -1 });
applicationSchema.index({ planId: 1 });
export const Application = defineModel("Application", applicationSchema);

/** Append-only review history: every state change with who, when and the staff message. */
const applicationEventSchema = new Schema(
  {
    applicationId: { type: Schema.Types.ObjectId, required: true, ref: "Application" },
    action: { type: String, required: true, enum: APPLICATION_ACTIONS },
    from: { type: String, default: null, enum: [null, ...APPLICATION_STATES] },
    to: { type: String, required: true, enum: APPLICATION_STATES },
    actorId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    actorKind: { type: String, required: true, enum: ["member", "staff", "cli", "system"] },
    message: { type: String, default: null, maxlength: 1000 },
    /** The answers and plan as submitted, so staff can see what changed between submissions. */
    submitted: { type: Schema.Types.Mixed, default: null },
    at: { type: Date, required: true },
  },
  { collection: "applicationEvents", versionKey: false },
);
applicationEventSchema.index({ applicationId: 1, at: 1 });
export const ApplicationEvent = defineModel("ApplicationEvent", applicationEventSchema);
