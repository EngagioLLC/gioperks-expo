#!/usr/bin/env node
/**
 * Renders GioGo_chest.webp (with alpha) to PNG favicon/app icon sizes.
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

const sizes = [
  { name: 'favicon.png', size: 48 },
  { name: 'icon.png', size: 1024 },
  { name: 'adaptive-icon.png', size: 1024 },
];

for (const { name, size } of sizes) {
  const out = join(root, 'assets', name);
  await sharp(chestWebp)
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(out);
  console.log(`Wrote ${out} (${size}x${size})`);
}
