import { CONTENT_KINDS } from "@as/contracts";
import { Schema } from "mongoose";
import { defineModel } from "../../db/model.js";

/**
 * One editable public entry (news/event post, project or partner).
 *
 * `draft` is the working copy staff edit; `published` is the copy the public sees, or null. Both are
 * validated by the kind's schema in @as/contracts before they are written, so they are stored as
 * plain objects. `version` is the optimistic-concurrency counter: every write must name the version
 * it was based on, so two editors never silently overwrite each other.
 */
const contentEntrySchema = new Schema(
  {
    kind: { type: String, required: true, enum: CONTENT_KINDS },
    slug: { type: String, required: true, maxlength: 80 },
    draft: { type: Schema.Types.Mixed, required: true },
    published: { type: Schema.Types.Mixed, default: null },
    /** True when the draft has been edited since it was last published. */
    dirty: { type: Boolean, default: false },
    version: { type: Number, required: true, default: 0 },
    publishedAt: { type: Date, default: null },
    firstPublishedAt: { type: Date, default: null },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { collection: "contentEntries", versionKey: false, minimize: false },
);
contentEntrySchema.index({ kind: 1, slug: 1 }, { unique: true });
contentEntrySchema.index({ kind: 1, updatedAt: -1 });
contentEntrySchema.index({ kind: 1, "published.date": -1, firstPublishedAt: -1 }, { partialFilterExpression: { publishedAt: { $type: "date" } } });

export const ContentEntry = defineModel("ContentEntry", contentEntrySchema);
