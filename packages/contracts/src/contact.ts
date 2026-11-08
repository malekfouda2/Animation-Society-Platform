import { z } from "zod";
import { LOCALES } from "./locale.js";

/** Contact form payload, validated identically in the browser and on the server. */
export const contactMessageSchema = z.object({
  // Single-line fields reject CR/LF (prevents email header injection when forwarded).
  name: z.string().trim().min(1, "name").max(120, "name").regex(/^[^\r\n]*$/, "name"),
  email: z.email("email").max(254, "email"),
  subject: z.string().trim().min(1, "subject").max(160, "subject").regex(/^[^\r\n]*$/, "subject"),
  message: z.string().trim().min(10, "message").max(5000, "message"),
  locale: z.enum(LOCALES),
  /** Honeypot: real people leave it empty (hidden from users and assistive tech). */
  website: z.string().max(200).optional(),
});
export type ContactMessageInput = z.infer<typeof contactMessageSchema>;

export const contactAcceptedSchema = z.object({ status: z.literal("accepted") });
