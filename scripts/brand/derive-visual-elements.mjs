// Derives web-ready assets from the Society's Visual Elements (brand-source/, not committed).
// Usage: node scripts/brand/derive-visual-elements.mjs   (requires the Drive files in brand-source/visual-elements-png)
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const src = (f) => join(root, "brand-source", "visual-elements-png", f);
const outDir = join(root, "apps", "web", "public", "brand", "elements");
mkdirSync(outDir, { recursive: true });
const opts = { failOn: "none", limitInputPixels: false };

async function resize(file, out, width, quality = 78) {
  const info = await sharp(src(file), opts).resize({ width, withoutEnlargement: true }).webp({ quality, alphaQuality: 90 }).toFile(join(outDir, out));
  console.log(out, `${info.width}x${info.height}`, `${Math.round(info.size / 1024)} KB`);
}

/**
 * Extracts a fractional region of a sheet, insets it to drop the sheet's frame lines, trims
 * transparent margins, then resizes.
 */
async function piece(file, out, [x0, y0, x1, y1], width, inset = 0.04) {
  const meta = await sharp(src(file), opts).metadata();
  const ix = (x1 - x0) * inset;
  const iy = (y1 - y0) * inset;
  const region = {
    left: Math.round(meta.width * (x0 + ix)),
    top: Math.round(meta.height * (y0 + iy)),
    width: Math.round(meta.width * (x1 - x0 - 2 * ix)),
    height: Math.round(meta.height * (y1 - y0 - 2 * iy)),
  };
  const cut = await sharp(src(file), opts).extract(region).png().toBuffer();
  // Each piece on the sheet is drawn inside its own thin outline frame: trim to that frame,
  // shave it off, then trim again to the artwork itself.
  const framed = await sharp(cut).trim({ threshold: 1 }).png().toBuffer();
  const fm = await sharp(framed).metadata();
  const shave = Math.max(4, Math.round(Math.min(fm.width, fm.height) * 0.012));
  const inner = await sharp(framed).extract({ left: shave, top: shave, width: fm.width - 2 * shave, height: fm.height - 2 * shave }).png().toBuffer();
  const trimmed = await sharp(inner).trim({ threshold: 1 }).png().toBuffer();
  const info = await sharp(trimmed).resize({ width, withoutEnlargement: true }).webp({ quality: 80, alphaQuality: 90 }).toFile(join(outDir, out));
  console.log(out, `${info.width}x${info.height}`, `${Math.round(info.size / 1024)} KB`);
}

await resize("Visual Elements 1-1.png", "waves-warm.webp", 2400);
await resize("Visual Elements 1-2.png", "waves-cool.webp", 2400);
// The character art sits on a 28%-opaque white layer (alpha 71). Remap alpha so that layer becomes
// fully transparent while keeping the crescent's anti-aliased edges.
{
  const { data, info } = await sharp(src("visual element 5.png"), opts).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const floor = 71;
  for (let i = 3; i < data.length; i += 4) {
    data[i] = data[i] <= floor ? 0 : Math.round(((data[i] - floor) / (255 - floor)) * 255);
  }
  const out = await sharp(data, { raw: info }).resize({ width: 1600 }).webp({ quality: 82, alphaQuality: 90 }).toFile(join(outDir, "characters.webp"));
  console.log("characters.webp", `${out.width}x${out.height}`, `${Math.round(out.size / 1024)} KB`);
}
await resize("Visual Elements 2-1.png", "lines-dark.webp", 2400);
// Visual Elements 1-3: 3 x 2 sheet of loose parts.
const cols = [[0, 0.345], [0.345, 0.655], [0.655, 1]];
const rows = [[0, 0.5], [0.5, 1]];
const names = [["bar-warm", "dots-warm", "ribbon-warm"], ["bar-cool", "dots-cool", "ribbon-cool"]];
for (const [r, [y0, y1]] of rows.entries()) {
  for (const [c, [x0, x1]] of cols.entries()) {
    await piece("Visual Elements 1-3.png", `${names[r][c]}.webp`, [x0, y0, x1, y1], 1200);
  }
}
// Visual Elements 4-1: three light panels (green sweeps, contour lines, red corner discs).
await piece("Visual Elements 4 -1.png", "panel-sweeps.webp", [0, 0, 0.34, 1], 900, 0.04);
await piece("Visual Elements 4 -1.png", "panel-contours.webp", [0.34, 0, 0.67, 1], 900, 0.04);
await piece("Visual Elements 4 -1.png", "panel-discs.webp", [0.67, 0, 1, 1], 900, 0.04);
