#!/usr/bin/env node
/**
 * Processes assets/Rich_Logo.png:
 * - Full logo WebP
 * - Chest + wordmark WebP extractions
 * - App icon / favicon / adaptive-icon PNGs from chest
 * - Brand palette JSON from sampled pixels
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const source = join(root, 'assets/Rich_Logo.png');
const assetsDir = join(root, 'assets');

let sharp;
try {
  sharp = (await import('sharp')).default;
} catch {
  console.error('Install sharp first: npm install --save-dev sharp');
  process.exit(1);
}

/** Flood-fill background from edges; protect chest art via foreground expansion. */
async function keyOutBackground(input, { lumThreshold = 52, satThreshold = 70, darkCutoff = 36 } = {}) {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  const total = width * height;
  const lum = (r, g, b) => 0.299 * r + 0.587 * g + 0.114 * b;
  const sat = (r, g, b) => Math.max(r, g, b) - Math.min(r, g, b);

  const isForeground = (idx) => {
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    const l = lum(r, g, b);
    const s = sat(r, g, b);

    if (l >= 88) return true;
    if (r > 170 && g > 110 && b < 110) return true;
    if (s < 42 && l > 95) return true;
    return l > lumThreshold || s > satThreshold;
  };

  const isStructural = (idx) => {
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    const l = lum(r, g, b);
    return l >= 8 && l <= 72;
  };

  const protectedMask = new Uint8Array(total);
  const queue = new Int32Array(total);
  let head = 0;
  let tail = 0;

  for (let p = 0; p < total; p++) {
    if (!isForeground(p * 4)) continue;
    protectedMask[p] = 1;
    queue[tail++] = p;
  }

  while (head < tail) {
    const p = queue[head++];
    const x = p % width;
    const y = (p - x) / width;
    const neighbors = [
      [x - 1, y],
      [x + 1, y],
      [x, y - 1],
      [x, y + 1],
    ];
    for (const [nx, ny] of neighbors) {
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
      const np = ny * width + nx;
      if (protectedMask[np]) continue;
      if (!isStructural(np * 4)) continue;
      protectedMask[np] = 1;
      queue[tail++] = np;
    }
  }

  for (let p = 0; p < total; p++) {
    const idx = p * 4;
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    const l = lum(r, g, b);

    if (protectedMask[p]) {
      data[idx + 3] = 255;
      continue;
    }

    if (l <= 12 || l < darkCutoff) {
      data[idx + 3] = 0;
      continue;
    }

    const edgeAlpha = Math.round(((l - darkCutoff) / (lumThreshold - darkCutoff)) * 255);
    data[idx + 3] = Math.max(0, Math.min(255, edgeAlpha));
  }

  return sharp(data, {
    raw: { width, height, channels: 4 },
  });
}

/** Remove floor reflection by trimming empty/dark rows from the bottom. */
async function trimChestBottom(rawBuffer, keepGlowPx = 32) {
  const { data, info } = await sharp(rawBuffer).raw().toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  const lum = (r, g, b) => 0.299 * r + 0.587 * g + 0.114 * b;
  const sat = (r, g, b) => Math.max(r, g, b) - Math.min(r, g, b);

  let lastContentRow = -1;
  const xStart = Math.floor(width * 0.12);
  const xEnd = Math.floor(width * 0.88);

  for (let y = height - 1; y >= 0; y--) {
    let score = 0;
    for (let x = xStart; x < xEnd; x++) {
      const idx = (y * width + x) * 3;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const l = lum(r, g, b);
      const s = sat(r, g, b);
      if (l > 55 || (r > 180 && g > 120) || (l > 40 && s > 50)) score++;
    }
    if (score > 15) {
      lastContentRow = y;
      break;
    }
  }

  if (lastContentRow < 0) return rawBuffer;

  const newHeight = Math.min(height, lastContentRow + keepGlowPx + 1);
  if (newHeight >= height) return rawBuffer;

  return sharp(rawBuffer).extract({ left: 0, top: 0, width, height: newHeight }).toBuffer();
}

/** Simple key for icons on transparent canvas. */
async function keyOutBlack(input, threshold = 22) {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    if (lum <= threshold) {
      data[i + 3] = 0;
    }
  }
  return sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  });
}

function loadPixels(imagePath) {
  return sharp(imagePath).raw().toBuffer({ resolveWithObject: true });
}

/** Tight crop for chest — excludes GioGo silver text and vertical padding. */
function detectChestBounds(data, width, height, pad = 12) {
  const px = (x, y) => {
    const i = (y * width + x) * 3;
    return [data[i], data[i + 1], data[i + 2]];
  };
  const lum = (c) => 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2];
  const sat = (c) => Math.max(...c) - Math.min(...c);
  const isSilverText = (c) => lum(c) > 165 && sat(c) < 45;

  let minX = width;
  let maxX = 0;
  let minY = height;
  let maxY = 0;

  // Hard cap before the silver "GioGo" letter; stars end near x≈560.
  const maxScanX = 555;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x <= maxScanX; x++) {
      const c = px(x, y);
      if (lum(c) < 18) continue;
      // Drop bright text / halo pixels near the wordmark boundary.
      if (x > 480 && (isSilverText(c) || lum(c) > 130)) continue;

      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }
  }

  return {
    left: Math.max(0, minX - pad),
    top: Math.max(0, minY - pad),
    width: Math.min(width, maxX + pad + 1) - Math.max(0, minX - pad),
    height: Math.min(height, maxY + pad + 1) - Math.max(0, minY - pad),
  };
}

/** Tight crop for wordmark — right of chest with vertical trim. */
function detectWordmarkBounds(data, width, height, chestRightX, pad = 8) {
  const px = (x, y) => {
    const i = (y * width + x) * 3;
    return [data[i], data[i + 1], data[i + 2]];
  };
  const lum = (c) => 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2];

  let minX = width;
  let maxX = 0;
  let minY = height;
  let maxY = 0;

  for (let y = 0; y < height; y++) {
    for (let x = chestRightX; x < width; x++) {
      const c = px(x, y);
      if (lum(c) < 18) continue;

      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }
  }

  return {
    left: Math.max(0, minX - pad),
    top: Math.max(0, minY - pad),
    width: Math.min(width, maxX + pad + 1) - Math.max(0, minX - pad),
    height: Math.min(height, maxY + pad + 1) - Math.max(0, minY - pad),
  };
}

async function extractBrandColors(imagePath) {
  const { data, info } = await sharp(imagePath).raw().toBuffer({ resolveWithObject: true });
  const w = info.width;
  const px = (x, y) => {
    const i = (y * w + x) * 3;
    return [data[i], data[i + 1], data[i + 2]];
  };

  const silvers = [];
  const lightPurples = [];
  const deepPurples = [];
  const golds = [];

  for (let y = 200; y < 700; y += 3) {
    for (let x = 730; x < 1440; x += 3) {
      const [r, g, b] = px(x, y);
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      const sat = Math.max(r, g, b) - Math.min(r, g, b);
      if (lum < 25) continue;
      if (b > 140 && r > 80 && g < 130 && sat > 60) lightPurples.push([r, g, b]);
      if (sat < 50 && lum > 140 && lum < 240) silvers.push([r, g, b]);
      if (r > 200 && g > 150 && b < 80 && sat > 80) golds.push([r, g, b]);
    }
  }

  for (let y = 300; y < 900; y += 3) {
    for (let x = 50; x < 650; x += 3) {
      const [r, g, b] = px(x, y);
      if (b > 100 && r < 100 && g < 50) deepPurples.push([r, g, b]);
    }
  }

  const median = (pts) => {
    if (!pts.length) return null;
    const med = (c) => {
      const sorted = pts.map((p) => p[c]).sort((a, b) => a - b);
      return sorted[Math.floor(sorted.length / 2)];
    };
    return [med(0), med(1), med(2)];
  };

  const toHex = ([r, g, b]) =>
    `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase()}`;

  return {
    black: '#000000',
    silver: toHex(median(silvers) ?? [205, 188, 196]),
    lightPurple: toHex(median(lightPurples) ?? [143, 20, 252]),
    deepPurple: toHex(median(deepPurples) ?? [55, 1, 142]),
    gold: toHex(median(golds) ?? [249, 189, 40]),
  };
}

const meta = await sharp(source).metadata();
const { data: sourceData, info: sourceInfo } = await loadPixels(source);

const chestCrop = detectChestBounds(sourceData, sourceInfo.width, sourceInfo.height);
const chestRightX = chestCrop.left + chestCrop.width;
const wordmarkCrop = detectWordmarkBounds(
  sourceData,
  sourceInfo.width,
  sourceInfo.height,
  Math.max(560, chestRightX - 8),
);

console.log('Chest crop', chestCrop);
console.log('Wordmark crop', wordmarkCrop);

const outputs = {
  logoWebp: join(assetsDir, 'GioGo_logo.webp'),
  chestWebp: join(assetsDir, 'GioGo_chest.webp'),
  wordmarkWebp: join(assetsDir, 'GioGo_wordmark.webp'),
  paletteJson: join(assetsDir, 'brand-palette.json'),
};

await sharp(source).webp({ quality: 92, effort: 6 }).toFile(outputs.logoWebp);
console.log(`Wrote ${outputs.logoWebp}`);

const chestRaw = await sharp(source).extract(chestCrop).toBuffer();

const wordmarkRaw = await sharp(source).extract(wordmarkCrop).toBuffer();

await sharp(chestRaw).webp({ quality: 92, effort: 6 }).toFile(outputs.chestWebp);
console.log(`Wrote ${outputs.chestWebp}`);

const wordmarkTransparent = await keyOutBackground(wordmarkRaw);

await wordmarkTransparent.clone().webp({ quality: 92, effort: 6, lossless: false }).toFile(outputs.wordmarkWebp);
console.log(`Wrote ${outputs.wordmarkWebp}`);

const chestMeta = await sharp(outputs.chestWebp).metadata();
const wordmarkMeta = await sharp(outputs.wordmarkWebp).metadata();
const logoMeta = await sharp(outputs.logoWebp).metadata();

const palette = await extractBrandColors(source);
writeFileSync(outputs.paletteJson, `${JSON.stringify(palette, null, 2)}\n`);
console.log(`Wrote ${outputs.paletteJson}`, palette);

const chestForIcons = await keyOutBlack(chestRaw, 22);

const iconSizes = [
  { name: 'favicon.png', size: 48 },
  { name: 'icon.png', size: 1024 },
  { name: 'adaptive-icon.png', size: 1024 },
];

for (const { name, size } of iconSizes) {
  const out = join(assetsDir, name);
  await chestForIcons
    .clone()
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(out);
  console.log(`Wrote ${out} (${size}x${size})`);
}

writeFileSync(
  join(root, 'assets/brand-assets.json'),
  `${JSON.stringify(
    {
      chestAspect: chestMeta.width / chestMeta.height,
      wordmarkAspect: wordmarkMeta.width / wordmarkMeta.height,
      logoAspect: logoMeta.width / logoMeta.height,
      chestWidth: chestMeta.width,
      chestHeight: chestMeta.height,
      wordmarkWidth: wordmarkMeta.width,
      wordmarkHeight: wordmarkMeta.height,
      chestCrop,
      wordmarkCrop,
      palette,
    },
    null,
    2,
  )}\n`,
);
console.log('Done.');
