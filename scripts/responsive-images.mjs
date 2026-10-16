import sharp from "sharp";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PUBLIC = path.join(ROOT, "public");
const MANIFEST = path.join(ROOT, "src", "lib", "responsive-images.json");

const WIDTHS = [400, 800, 1200];
const QUALITY = 68;

function collectImagePaths() {
  const files = [
    path.join(ROOT, "src", "features", "products", "data", "products.ts"),
    path.join(ROOT, "src", "routes", "index.tsx"),
    path.join(ROOT, "src", "routes", "category.$slug.tsx"),
  ];
  const patterns = [
    /product\(\s*"[^"]+",\s*"[^"]+",\s*"[^"]+",\s*\d+,\s*\d+,\s*"([^"]+)"/g,
    /images:\s*\[\s*"([^"]+)"/g,
    /image:\s*"([^"]+)"/g,
  ];
  const found = new Set();
  for (const file of files) {
    if (!fs.existsSync(file)) continue;
    const src = fs.readFileSync(file, "utf8");
    for (const re of patterns) {
      let m;
      while ((m = re.exec(src))) found.add(m[1]);
    }
  }
  return Array.from(found).filter((p) => !/^https?:/.test(p));
}

function variantPath(relPath, width) {
  const ext = path.extname(relPath);
  return `${relPath.slice(0, -ext.length)}-${width}.webp`;
}

async function main() {
  const relPaths = collectImagePaths();
  const manifest = {};
  let generated = 0;
  let skipped = 0;

  for (const relPath of relPaths) {
    const abs = path.join(PUBLIC, decodeURIComponent(relPath));
    if (!fs.existsSync(abs)) {
      skipped++;
      continue;
    }
    const meta = await sharp(abs).metadata();
    const origW = meta.width || 0;
    const made = [];
    for (const w of WIDTHS) {
      const out = path.join(PUBLIC, decodeURIComponent(variantPath(relPath, w)));
      if (w > origW && w !== WIDTHS[0]) {
        if (fs.existsSync(out)) made.push(w);
        continue;
      }
      if (!fs.existsSync(out) || process.env.FORCE === "1") {
        await sharp(abs)
          .resize({ width: w, withoutEnlargement: true })
          .webp({ quality: QUALITY })
          .toFile(out);
        generated++;
      }
      made.push(w);
    }
    if (made.length) manifest[relPath] = made;
  }

  fs.writeFileSync(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(
    `responsive-images: ${Object.keys(manifest).length} sources, ${generated} variants written, ${skipped} sources missing`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
