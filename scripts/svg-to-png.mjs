import sharp from 'sharp';
import { readFile, readdir, mkdir, stat } from 'fs/promises';
import { join, basename, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const projectsDir = join(root, 'static', 'projects');
const outDir = join(root, 'pictures');
const MAX = 4000;

await mkdir(outDir, { recursive: true });

const projects = await readdir(projectsDir);
for (const proj of projects) {
  const imgDir = join(projectsDir, proj, 'images');
  let entries;
  try { entries = await readdir(imgDir); } catch { continue; }
  for (const entry of entries) {
    if (!entry.toLowerCase().endsWith('.svg')) continue;
    const svgPath = join(imgDir, entry);
    const svgBuf = await readFile(svgPath);

    // Parse viewBox to determine aspect/native size
    const svgText = svgBuf.toString('utf8');
    const vb = svgText.match(/viewBox="([\d.\-\s]+)"/);
    let w, h;
    if (vb) {
      const parts = vb[1].trim().split(/\s+/).map(Number);
      w = parts[2]; h = parts[3];
    } else {
      const meta = await sharp(svgBuf).metadata();
      w = meta.width; h = meta.height;
    }

    // Scale up to a high-quality raster but cap at MAX on the longest side
    const scale = Math.min(MAX / w, MAX / h, 4);
    const targetW = Math.round(w * scale);
    const targetH = Math.round(h * scale);

    const name = basename(entry, '.svg');
    const outName = `${proj}-${name}.png`;
    const outPath = join(outDir, outName);

    await sharp(svgBuf, { density: 96 * scale })
      .resize(targetW, targetH, { fit: 'fill' })
      .png({ compressionLevel: 9 })
      .toFile(outPath);

    const s = await stat(outPath);
    console.log(`${outName}  ${targetW}x${targetH}  ${(s.size/1024).toFixed(1)} KB`);
  }
}
