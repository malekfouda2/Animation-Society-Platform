import { Schema } from "mongoose";
import { defineModel } from "../../db/model.js";

/**
 * An uploaded image. The file itself lives in MEDIA_DIR as `<id>.webp` (re-encoded, metadata
 * stripped); this record holds what was checked about it. Descriptions (alt text) belong to the
 * entries that use the image, not to the file.
 */
const mediaAssetSchema = new Schema(
  {
    mime: { type: String, required: true, enum: ["image/webp"] },
    width: { type: Number, required: true },
    height: { type: Number, required: true },
    bytes: { type: Number, required: true },
    sha256: { type: String, required: true },
    /** Format as uploaded (png, jpeg or webp), for the record. */
    sourceFormat: { type: String, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    createdAt: { type: Date, required: true },
  },
  { collection: "mediaAssets", versionKey: false },
);
mediaAssetSchema.index({ createdAt: -1 });

export const MediaAsset = defineModel("MediaAsset", mediaAssetSchema);
