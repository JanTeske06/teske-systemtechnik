import sharp from 'sharp';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'pictures');
await mkdir(outDir, { recursive: true });

const logoPath = join(root, 'static', 'images', 'logo_whitemode.svg');
const logoBuf = await readFile(logoPath);
const logoB64 = logoBuf.toString('base64');
const logoUri = `data:image/svg+xml;base64,${logoB64}`;

const W = 2400;
const H = 1000;

const stone950 = '#0c0a09';
const stone900 = '#1c1917';
const stone400 = '#a8a29e';
const stone300 = '#d6d3d1';
const stone100 = '#f5f5f4';
const orange  = '#f97316';
const amber   = '#fbbf24';

const logoSize = 180;
const gap = 56;
const titleX = (W / 2) - 320;
const titleY = H / 2;
const logoX = titleX - gap - logoSize;
const logoY = titleY - (logoSize / 2);

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="bgGrad" cx="50%" cy="50%" r="65%">
      <stop offset="0%" stop-color="${stone900}"/>
      <stop offset="55%" stop-color="${stone950}"/>
      <stop offset="100%" stop-color="#050403"/>
    </radialGradient>
    <linearGradient id="hairlineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%"  stop-color="${stone400}" stop-opacity="0"/>
      <stop offset="50%" stop-color="${stone400}" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="${stone400}" stop-opacity="0"/>
    </linearGradient>
    <pattern id="dots" x="0" y="0" width="48" height="48" patternUnits="userSpaceOnUse">
      <circle cx="1" cy="1" r="1" fill="${stone400}" fill-opacity="0.07"/>
    </pattern>
  </defs>

  <rect width="${W}" height="${H}" fill="${stone950}"/>
  <rect width="${W}" height="${H}" fill="url(#bgGrad)"/>
  <rect width="${W}" height="${H}" fill="url(#dots)"/>

  <line x1="120" y1="120" x2="${W-120}" y2="120" stroke="url(#hairlineGrad)" stroke-width="1"/>
  <line x1="120" y1="${H-120}" x2="${W-120}" y2="${H-120}" stroke="url(#hairlineGrad)" stroke-width="1"/>

  <g opacity="0.55">
    <line x1="120" y1="100" x2="120" y2="140" stroke="${stone400}" stroke-width="1" stroke-opacity="0.4"/>
    <line x1="${W-120}" y1="100" x2="${W-120}" y2="140" stroke="${stone400}" stroke-width="1" stroke-opacity="0.4"/>
    <line x1="120" y1="${H-140}" x2="120" y2="${H-100}" stroke="${stone400}" stroke-width="1" stroke-opacity="0.4"/>
    <line x1="${W-120}" y1="${H-140}" x2="${W-120}" y2="${H-100}" stroke="${stone400}" stroke-width="1" stroke-opacity="0.4"/>
  </g>

  <image href="${logoUri}" x="${logoX}" y="${logoY}" width="${logoSize}" height="${logoSize}" preserveAspectRatio="xMidYMid meet"/>

  <g font-family="'Segoe UI', 'Inter', 'Helvetica Neue', Arial, sans-serif">
    <text x="${titleX}" y="${titleY - 18}"
          fill="${stone100}"
          font-size="78"
          font-weight="700"
          letter-spacing="6"
          text-anchor="start"
          dominant-baseline="alphabetic">TESKE</text>
    <text x="${titleX}" y="${titleY + 64}"
          fill="${stone100}"
          font-size="78"
          font-weight="700"
          letter-spacing="6"
          text-anchor="start"
          dominant-baseline="alphabetic">SYSTEMTECHNIK</text>

    <line x1="${titleX}" y1="${titleY + 92}" x2="${titleX + 96}" y2="${titleY + 92}"
          stroke="${orange}" stroke-width="3"/>

    <text x="${titleX + 116}" y="${titleY + 100}"
          fill="${stone400}"
          font-size="24"
          font-weight="400"
          letter-spacing="2"
          text-anchor="start"
          dominant-baseline="alphabetic">Quality engineered in Germany.</text>
  </g>

  <text x="${W/2}" y="${H - 80}"
        fill="${stone400}" fill-opacity="0.45"
        font-family="'Consolas', 'JetBrains Mono', 'Courier New', monospace"
        font-size="14"
        letter-spacing="6"
        text-anchor="middle">PYTHON  ·  AUTOMATION  ·  API DEVELOPMENT  ·  CUSTOM SOFTWARE</text>
</svg>`;

const svgOutPath = join(outDir, 'teske-systemtechnik-banner.svg');
await writeFile(svgOutPath, svg, 'utf8');

const pngOutPath = join(outDir, 'teske-systemtechnik-banner.png');
await sharp(Buffer.from(svg), { density: 144 })
  .resize(W, H, { fit: 'fill' })
  .png({ compressionLevel: 9 })
  .toFile(pngOutPath);

console.log(`Wrote ${pngOutPath}  (${W}x${H})`);
console.log(`Wrote ${svgOutPath}`);
