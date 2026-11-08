// Cuts individual brand line icons from the Society icon sheet (brand-source/drive/icons.pdf, guideline p.26).
// Usage: pdftocairo -png -transp -r 300 -singlefile brand-source/drive/icons.pdf brand-source/icons-hi
//        node scripts/brand/derive-icons.mjs
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const sheet = join(root, "brand-source", "icons-hi.png");
const outDir = join(root, "apps", "web", "public", "brand", "icons");
mkdirSync(outDir, { recursive: true });

// Grid detected from the 300 dpi render (pixel row/column runs with visible ink).
const rows = [[134, 318], [388, 572], [600, 822], [863, 1077], [1129, 1338], [1383, 1602], [1654, 1838], [1908, 2092], [2162, 2346]];
const cols = [[246, 431], [519, 703], [791, 975], [1063, 1247], [1335, 1519], [1607, 1792], [1869, 2061]];
const pick = {
  growth: [2, 0], skills: [7, 4], creativity: [3, 1], community: [6, 6], partnerships: [1, 0],
  clapper: [1, 3], flag: [3, 0], award: [6, 5], ticket: [5, 5], calendar: [7, 5], document: [5, 4],
  megaphone: [5, 1], filmReel: [0, 4], pen: [4, 1], camera: [8, 5],
};
for (const [name, [r, c]] of Object.entries(pick)) {
  const [y0, y1] = rows[r]; const [x0, x1] = cols[c];
  const cut = await sharp(sheet).extract({ left: x0 - 6, top: y0 - 6, width: x1 - x0 + 12, height: y1 - y0 + 12 }).png().toBuffer();
  const info = await sharp(cut).trim({ threshold: 1 }).resize({ width: 160, height: 160, fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).webp({ quality: 90, alphaQuality: 100 }).toFile(join(outDir, `${name}.webp`));
  console.log(name, `${Math.round(info.size / 1024)} KB`);
}
