/**
 * Operator command for uploaded images.
 *
 *   npm run media -w @as/api -- prune --dry-run     # list what would be deleted
 *   npm run media -w @as/api -- prune               # delete it
 *   npm run media -w @as/api -- prune --older-than-hours 72
 *
 * Deletes uploads that no entry (draft or published) refers to and that are older than the grace
 * period (24 hours by default), so an image picked for a draft that isn't saved yet is never lost.
 * Each deletion is recorded in the activity log. Suitable for a daily scheduled job.
 */
import { resolve } from "node:path";
import { parseArgs } from "node:util";
import { loadEnv } from "../config/env.js";
import { connectDatabase } from "../db/mongo.js";
import { createMediaService, PRUNE_GRACE_MS } from "../features/media/media.service.js";

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: { "dry-run": { type: "boolean", default: false }, "older-than-hours": { type: "string" } },
});

async function main() {
  if (positionals[0] !== "prune") {
    process.stderr.write("Usage: npm run media -w @as/api -- prune [--dry-run] [--older-than-hours N]\n");
    process.exit(1);
  }
  const hours = values["older-than-hours"] === undefined ? PRUNE_GRACE_MS / 3_600_000 : Number(values["older-than-hours"]);
  if (!Number.isFinite(hours) || hours < 1) {
    process.stderr.write("--older-than-hours must be at least 1.\n");
    process.exit(1);
  }
  const env = loadEnv();
  const db = await connectDatabase(env.MONGODB_URI);
  try {
    const media = createMediaService({ dir: resolve(env.MEDIA_DIR) });
    const ids = await media.pruneCandidates(hours * 3_600_000);
    if (values["dry-run"]) {
      process.stdout.write(`${ids.length} unused image(s) older than ${hours} h would be deleted${ids.length ? `:\n${ids.join("\n")}` : ""}\n`);
      return;
    }
    let deleted = 0;
    for (const id of ids) {
      try {
        await media.remove({ userId: null, kind: "cli" }, id);
        deleted++;
      } catch (err) {
        // Picked up by an entry since the scan: kept.
        process.stdout.write(`kept ${id}: ${err instanceof Error ? err.message : "error"}\n`);
      }
    }
    process.stdout.write(`deleted ${deleted} unused image(s) older than ${hours} h\n`);
  } finally {
    await db.disconnect();
  }
}

void main();
