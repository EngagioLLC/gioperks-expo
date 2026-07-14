#!/usr/bin/env node
/**
 * Renders GioGo_chest.webp (with alpha) to PNG favicon/app icon sizes.
 * Trims transparent margins first so the chest is visually centered in each frame.
 * Requires: npm install sharp (devDependency)
 */
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const chestWebp = join(root, 'assets/GioGo_chest.webp');

let sharp;
try {
  sharp = (await import('sharp')).default;
} catch {
  console.error('Install sharp first: npm install --save-dev sharp');
  process.exit(1);
}

async function renderCenteredChest(chestPath, outPath, size, { paddingRatio = 0.14, background = null }) {
  const trimmed = await sharp(chestPath).ensureAlpha().trim({ threshold: 10 }).toBuffer();
  const padding = Math.round(size * paddingRatio);
  const inner = size - padding * 2;
  const chest = await sharp(trimmed)
    .resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  const bg = background ?? { r: 0, g: 0, b: 0, alpha: 0 };
  await sharp({
    create: { width: size, height: size, channels: 4, background: bg },
  })
    .composite([{ input: chest, gravity: 'center' }])
    .png()
    .toFile(outPath);
}

const outputs = [
  { name: 'favicon.png', size: 48, paddingRatio: 0.1 },
  { name: 'icon.png', size: 1024, paddingRatio: 0.14 },
  { name: 'adaptive-icon.png', size: 1024, paddingRatio: 0.2 },
  {
    name: 'splash-icon.png',
    size: 512,
    paddingRatio: 0.16,
    background: { r: 0, g: 0, b: 0, alpha: 1 },
  },
];

for (const { name, size, paddingRatio, background } of outputs) {
  const out = join(root, 'assets', name);
  await renderCenteredChest(chestWebp, out, size, { paddingRatio, background });
  console.log(`Wrote ${out} (${size}x${size})`);
}
