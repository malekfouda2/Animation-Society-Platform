import mongoose, { Schema, type InferSchemaType } from "mongoose";

const contactMessageSchema = new Schema(
  {
    name: { type: String, required: true, maxlength: 120 },
    email: { type: String, required: true, maxlength: 254, lowercase: true, trim: true },
    subject: { type: String, required: true, maxlength: 160 },
    message: { type: String, required: true, maxlength: 5000 },
    locale: { type: String, required: true, enum: ["ar", "en"] },
    /** Delivery to the Society mailbox; "stored" until an approved email provider is configured. */
    delivery: { type: String, required: true, enum: ["stored", "sent", "failed"], default: "stored" },
  },
  { timestamps: true, collection: "contactMessages" },
);
contactMessageSchema.index({ createdAt: -1 });

export type ContactMessageDoc = InferSchemaType<typeof contactMessageSchema>;
export const ContactMessage = mongoose.models["ContactMessage"] ?? mongoose.model("ContactMessage", contactMessageSchema);
