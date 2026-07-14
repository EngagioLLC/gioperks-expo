#!/usr/bin/env node
/**
 * Processes brand logo assets:
 * - Chest WebP from assets/GioGo_chest_source.png/.jpg when present
 * - Wordmark WebP from Rich_Logo.png (skipped in --chest-only mode)
 * - App icon / favicon / adaptive-icon PNGs from chest
 * - Brand palette JSON from sampled pixels
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const assetsDir = join(root, 'assets');
const source = join(root, 'assets/Rich_Logo.png');
const chestSourcePng = join(assetsDir, 'GioGo_chest_source.png');
const chestSourceJpg = join(assetsDir, 'GioGo_chest_source.jpg');
const chestSource = existsSync(chestSourcePng)
  ? chestSourcePng
  : existsSync(chestSourceJpg)
    ? chestSourceJpg
    : null;
const args = process.argv.slice(2);
const chestOnly = args.includes('--chest-only') || Boolean(chestSource);

let sharp;
try {
  sharp = (await import('sharp')).default;
} catch {
  console.error('Install sharp first: npm install --save-dev sharp');
  process.exit(1);
}

const lum = (r, g, b) => 0.299 * r + 0.587 * g + 0.114 * b;
const sat = (r, g, b) => Math.max(r, g, b) - Math.min(r, g, b);

function floodFillBackground(data, width, height, isBackgroundPixel) {
  const total = width * height;
  const background = new Uint8Array(total);
  const queue = [];

  const tryPush = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const p = y * width + x;
    if (background[p]) return;
    if (!isBackgroundPixel(p * 4)) return;
    background[p] = 1;
    queue.push(p);
  };

  for (let x = 0; x < width; x++) {
    tryPush(x, 0);
    tryPush(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    tryPush(0, y);
    tryPush(width - 1, y);
  }

  while (queue.length > 0) {
    const p = queue.shift();
    const x = p % width;
    const y = (p - x) / width;
    tryPush(x - 1, y);
    tryPush(x + 1, y);
    tryPush(x, y - 1);
    tryPush(x, y + 1);
  }

  return background;
}

function applyAlphaMask(data, width, height, backgroundMask, guardForeground) {
  const total = width * height;
  for (let p = 0; p < total; p++) {
    const idx = p * 4;
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    const l = lum(r, g, b);
    const s = sat(r, g, b);

    if (backgroundMask[p] || isNeutralBackdrop(r, g, b, guardForeground) || (l < 26 && !guardForeground(r, g, b))) {
      data[idx + 3] = 0;
      continue;
    }

    if (guardForeground(r, g, b)) {
      data[idx + 3] = 255;
      continue;
    }

    if (l < 55 && s < 42) {
      data[idx + 3] = Math.max(0, Math.min(255, Math.round(((l - 18) / 34) * 255)));
    } else {
      data[idx + 3] = 255;
    }
  }
}

function isNeutralBackdrop(r, g, b, guardForeground) {
  if (guardForeground(r, g, b)) return false;
  const l = lum(r, g, b);
  const s = sat(r, g, b);
  return l < 54 && s < 36;
}

function guardWordmarkForeground(r, g, b) {
  const l = lum(r, g, b);
  const s = sat(r, g, b);
  if (l < 16) return false;
  if (b > g + 4 && b > r * 0.35 && l > 16) return true;
  if (r > 110 && g > 80 && b < 130) return true;
  if (l > 90 && s < 55) return true;
  return false;
}

function isWordmarkBackground(idx, data) {
  if (guardWordmarkForeground(data[idx], data[idx + 1], data[idx + 2])) return false;
  const l = lum(data[idx], data[idx + 1], data[idx + 2]);
  const s = sat(data[idx], data[idx + 1], data[idx + 2]);
  return l < 52 && (s < 38 || l < 26);
}

function isChestStar(r, g, b) {
  const l = lum(r, g, b);
  return r > 185 && g > 115 && b < 105 && l > 130;
}

function isChestSeed(r, g, b) {
  const l = lum(r, g, b);
  if (isChestStar(r, g, b)) return true;
  if (r > 165 && g > 105 && b < 115) return true;
  if (r > 125 && g > 50 && b < 115 && l > 50) return true;
  if (r > 90 && g > 30 && b < 70 && l > 38) return true;
  if (l > 72) return true;
  if (b > 100 && r < 120 && l > 45) return true;
  if (r > 60 && b > 60 && g < 50 && l > 38) return true;
  return false;
}

function isChestConnect(r, g, b) {
  const l = lum(r, g, b);
  if (isChestSeed(r, g, b)) return true;
  if (l < 10) return false;
  if (b > g + 3 && b > 14 && l < 70) return true;
  if (r > g && g > b && l > 25 && l < 95) return true;
  return false;
}

function isChestHaze(r, g, b) {
  const l = lum(r, g, b);
  if (isChestSeed(r, g, b)) return false;
  if (r > 160 && g > 100 && b < 120) return false;
  const s = sat(r, g, b);
  if (l < 28) return true;
  if (l < 45 && b > g + 1) return true;
  // Soft purple glow clouds that leak in from the image edges.
  if (s > 92 && b > g + 6 && l < 78 && r < 120) return true;
  return false;
}

/** Bridge dark front panel + base trim to the chest body above. */
function bridgeChestBottom(data, width, height, mask, floor) {
  if (!floor) return;

  const { floorY, leftX, rightX } = floor;
  const yMin = Math.max(0, floorY - 110);
  const yMax = Math.min(height - 1, floorY + 20);
  const xMin = Math.max(0, leftX - 12);
  const xMax = Math.min(width - 1, rightX + 12);
  const total = width * height;

  floodBridge(data, width, height, mask, xMin, xMax, yMin, yMax, bridgeChestConnect);
}

/** Fill the solid purple front panel below the lock down to the foot split. */
function bridgeCenterFrontPanel(data, width, height, mask, floor) {
  if (!floor) return;

  const { floorY } = floor;
  const xMin = Math.floor(width * 0.38);
  const xMax = Math.floor(width * 0.68);
  const yMin = Math.max(0, floorY - 95);
  const yMax = Math.min(height - 1, floorY - 18);

  const isFrontPurple = (r, g, b) => {
    const l = lum(r, g, b);
    if (bridgeChestConnect(r, g, b)) return true;
    // Dark front-panel purple that seed flood misses.
    return l >= 3 && (b > 6 || (r > 18 && b > r * 0.55));
  };

  floodBridge(data, width, height, mask, xMin, xMax, yMin, yMax, isFrontPurple);
}

/** Fill the left wing front panel and corner facets below the lid. */
function bridgeLeftFrontPanel(data, width, height, mask, floor) {
  if (!floor) return;

  const { floorY, leftX } = floor;
  const xMin = Math.max(0, leftX - 8);
  const xMax = Math.floor(width * 0.38);
  const yMin = Math.max(0, floorY - 110);
  const yMax = Math.min(height - 1, floorY + 48);

  const isFrontPurple = (r, g, b) => {
    const l = lum(r, g, b);
    if (bridgeChestConnect(r, g, b)) return true;
    return l >= 3 && (b > 6 || (r > 18 && b > r * 0.55));
  };

  floodBridge(data, width, height, mask, xMin, xMax, yMin, yMax, isFrontPurple);
}

/** Restore the full-width bottom gold ridge and side feet trim. */
function bridgeBottomRidge(data, width, height, mask, floor) {
  if (!floor) return;

  const { floorY, leftX, rightX } = floor;
  const yMin = Math.max(0, floorY - 22);
  const yMax = Math.min(height - 1, floorY + 48);
  const xMin = Math.max(0, leftX - 10);
  const xMax = Math.min(width - 1, rightX + 10);

  const isRidgePixel = (r, g, b) => {
    const l = lum(r, g, b);
    const s = sat(r, g, b);
    if (s > 150 && b > 90 && l < 68) return false;
    if (bridgeChestConnect(r, g, b)) return true;
    if (r > 85 && g > 30 && b < 135 && l > 30) return true;
    return l >= 6 && l < 90 && (r > 14 || b > 8);
  };

  floodBridge(data, width, height, mask, xMin, xMax, yMin, yMax, isRidgePixel);

  for (let y = yMin; y <= yMax; y++) {
    let runStart = -1;
    for (let x = xMin; x <= xMax + 1; x++) {
      const inRow = x <= xMax;
      let keep = false;
      if (inRow) {
        const idx = (y * width + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        keep = isRidgePixel(r, g, b);
      }

      if (keep && runStart < 0) runStart = x;
      if ((!keep || !inRow) && runStart >= 0) {
        const runEnd = x - 1;
        if (runEnd - runStart >= 2) {
          for (let rx = runStart; rx <= runEnd; rx++) {
            mask[y * width + rx] = 1;
          }
        }
        runStart = -1;
      }
    }
  }
}

function isInteriorBodyPixel(r, g, b) {
  const l = lum(r, g, b);
  if (l < 8) return false;
  if (r > 160 && g > 100 && b < 120) return true;
  if (bridgeChestConnect(r, g, b)) return true;
  if (b > 15 && r < 110 && g < 45 && l >= 12) return true;
  if (r > 22 && g < 22 && l >= 12 && l < 95) return true;
  return false;
}

function isCornerTrimPixel(r, g, b) {
  const l = lum(r, g, b);
  const s = sat(r, g, b);
  if (l < 8) return false;
  if (s > 120 && b > 100 && l >= 35 && l < 70 && r < 120) return false;
  if (r > 160 && g > 100 && b < 120) return true;
  if (bridgeChestConnect(r, g, b)) return true;
  if (b > 15 && r < 120 && g < 50 && l >= 12) return true;
  if (r > 22 && g < 25 && l >= 12 && l < 100) return true;
  return false;
}

function isExteriorPurpleGlow(r, g, b) {
  const l = lum(r, g, b);
  const s = sat(r, g, b);
  if (isChestStar(r, g, b)) return false;
  if (r > 160 && g > 100 && b < 120) return false;
  if (isProtectedChestPixel(r, g, b)) return false;
  if (s > 85 && b > 60 && l < 75 && r < 130) return true;
  return isChestHaze(r, g, b) && l < 55;
}

function isProtectedChestPixel(r, g, b) {
  if (isChestStar(r, g, b)) return true;
  if (r > 160 && g > 100 && b < 120) return true;
  if (r > 125 && g > 50 && b < 115 && lum(r, g, b) > 50) return true;
  if (r > 90 && g > 30 && b < 70 && lum(r, g, b) > 38) return true;
  const l = lum(r, g, b);
  const s = sat(r, g, b);
  // Dark structural purple panels + corner facets.
  if (l < 38 && b > g + 1 && s > 35) return true;
  // Coin gold highlights.
  if (r > g && g > b && l > 72) return true;
  // Bright chest edge facets (not the soft exterior nebula).
  if (s > 108 && l >= 38 && l < 82 && r < 130 && g < 22) return true;
  return false;
}

function isSoftPurpleGlow(r, g, b) {
  if (isProtectedChestPixel(r, g, b)) return false;
  const l = lum(r, g, b);
  const s = sat(r, g, b);
  if (s > 55 && b > g + 1 && l < 72 && r < 130) return true;
  return l < 40 && b > g + 1 && s > 55;
}

function isExteriorHazePixel(r, g, b, x, y, floor) {
  if (isChestStar(r, g, b)) return false;
  if (r > 160 && g > 100 && b < 120) return false;
  if (r > 90 && g > 30 && b < 70 && lum(r, g, b) > 38) return false;

  if (floor) {
    const { leftX, rightX } = floor;
    if (x < leftX + 22) return true;
    if (x > rightX + 2) return true;
    if (x < leftX - 4 || x > rightX + 6) return sat(r, g, b) > 45;
  }

  return isSoftPurpleGlow(r, g, b);
}

/** Flood-remove purple haze connected to the image border. */
function stripEdgeConnectedHaze(target, width, height, floor) {
  const total = width * height;
  const visited = new Uint8Array(total);
  const queue = [];

  const tryPush = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const p = y * width + x;
    if (visited[p] || !target.get(p)) return;
    const idx = p * 4;
    if (!isExteriorHazePixel(target.data[idx], target.data[idx + 1], target.data[idx + 2], x, y, floor)) {
      return;
    }
    visited[p] = 1;
    queue.push(p);
  };

  for (let x = 0; x < width; x++) {
    tryPush(x, 0);
    tryPush(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    tryPush(0, y);
    tryPush(width - 1, y);
  }

  while (queue.length > 0) {
    const p = queue.shift();
    const x = p % width;
    const y = (p - x) / width;
    tryPush(x - 1, y);
    tryPush(x + 1, y);
    tryPush(x, y - 1);
    tryPush(x, y + 1);
  }

  for (let p = 0; p < total; p++) {
    if (visited[p]) target.set(p, 0);
  }
}

/** Peel soft purple halo layers from the outside of the chest mask. */
function peelExteriorPurpleHalo(target, width, height, iterations = 14) {
  for (let iter = 0; iter < iterations; iter++) {
    const toRemove = [];

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const p = y * width + x;
        if (!target.get(p)) continue;

        let touchesBg = false;
        for (const [dx, dy] of [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ]) {
          if (!target.get((y + dy) * width + (x + dx))) {
            touchesBg = true;
            break;
          }
        }

        if (!touchesBg) continue;

        const idx = p * 4;
        if (isSoftPurpleGlow(target.data[idx], target.data[idx + 1], target.data[idx + 2])) {
          toRemove.push(p);
        }
      }
    }

    if (!toRemove.length) break;
    for (const p of toRemove) target.set(p, 0);
  }
}

/** Remove glow pixels sitting outside the chest side wings. */
function stripWingExteriorGlow(target, width, height, floor) {
  if (!floor) return;

  const { leftX, rightX } = floor;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const inOuterLeft = x < leftX + 22;
      const inOuterRight = x > rightX + 2;
      if (!inOuterLeft && !inOuterRight) continue;

      const p = y * width + x;
      if (!target.get(p)) continue;

      const idx = p * 4;
      const r = target.data[idx];
      const g = target.data[idx + 1];
      const b = target.data[idx + 2];
      if (isChestStar(r, g, b)) continue;
      if (r > 160 && g > 100 && b < 120) continue;
      if (r > 90 && g > 30 && b < 70 && lum(r, g, b) > 38) continue;
      target.set(p, 0);
    }
  }
}

function isStructuralCornerFacet(r, g, b) {
  const l = lum(r, g, b);
  if (isBottomGoldPixel(r, g, b)) return true;
  // Dark corner bracket / foot facet purple (not the bright magenta fringe).
  if (l < 45 && b > 50 && b < 220 && r < 135 && g < 40) return true;
  return false;
}

function isLeftBackCornerGlow(r, g, b) {
  const l = lum(r, g, b);
  const s = sat(r, g, b);
  if (b > 200 && r > 70 && g < 60) return true;
  if (l > 50 && s > 140 && b > 180 && r > 90) return true;
  if (s > 95 && b > 145 && l >= 18 && l < 52 && r < 115 && g < 20) return true;
  if (s > 80 && b > g + 20 && l >= 25 && l < 50 && r < 100) return true;
  return false;
}

/** Remove bright magenta fringe left of the back corner bracket. */
function stripLeftBackCornerGlow(target, width, height, floor) {
  if (!floor) return;

  const { floorY, leftX } = floor;
  const yMin = Math.max(0, floorY - 95);
  const yMax = Math.min(height - 1, floorY + 22);

  for (let y = yMin; y <= yMax; y++) {
    let bracketX = -1;
    for (let x = leftX + 20; x <= leftX + 48; x++) {
      const p = y * width + x;
      if (!target.get(p)) continue;
      const idx = p * 4;
      const r = target.data[idx];
      const g = target.data[idx + 1];
      const b = target.data[idx + 2];
      const l = lum(r, g, b);
      if (isBottomGoldPixel(r, g, b) || (l < 35 && b > 40 && b < 130)) {
        bracketX = x;
        break;
      }
    }

    const stripBefore = bracketX > 0 ? bracketX : leftX + 30;

    for (let x = Math.max(0, leftX + 6); x < stripBefore; x++) {
      const p = y * width + x;
      if (!target.get(p)) continue;

      const idx = p * 4;
      const r = target.data[idx];
      const g = target.data[idx + 1];
      const b = target.data[idx + 2];
      if (isBottomGoldPixel(r, g, b)) continue;
      if (isStructuralCornerFacet(r, g, b)) continue;
      if (b > g || isLeftBackCornerGlow(r, g, b)) {
        target.set(p, 0);
      }
    }

    for (let x = stripBefore; x < leftX + 32; x++) {
      const p = y * width + x;
      if (!target.get(p)) continue;
      const idx = p * 4;
      const r = target.data[idx];
      const g = target.data[idx + 1];
      const b = target.data[idx + 2];
      if (isBottomGoldPixel(r, g, b)) continue;
      if (isStructuralCornerFacet(r, g, b)) continue;
      if (isLeftBackCornerGlow(r, g, b)) {
        target.set(p, 0);
      }
    }
  }
}

/** Restore bottom corner foot facets stripped by glow removal. */
function refillBottomCornerTrim(data, width, height, mask, floor) {
  if (!floor) return;

  const { floorY, leftX, rightX } = floor;
  const yMin = Math.max(0, floorY - 22);
  const yMax = Math.min(height - 1, floorY + 48);

  for (let y = yMin; y <= yMax; y++) {
    for (let x = Math.max(0, leftX + 20); x <= leftX + 50; x++) {
      const idx = (y * width + x) * 4;
      if (isStructuralCornerFacet(data[idx], data[idx + 1], data[idx + 2])) {
        mask[y * width + x] = 1;
      }
    }
    for (let x = Math.max(0, rightX - 45); x <= Math.min(width - 1, rightX + 12); x++) {
      const idx = (y * width + x) * 4;
      if (isStructuralCornerFacet(data[idx], data[idx + 1], data[idx + 2])) {
        mask[y * width + x] = 1;
      }
    }
  }
}

function refillBottomCornerTrimAlpha(data, width, height, floor) {
  if (!floor) return;

  const { floorY, leftX, rightX } = floor;
  const yMin = Math.max(0, floorY - 22);
  const yMax = Math.min(height - 1, floorY + 48);

  for (let y = yMin; y <= yMax; y++) {
    for (let x = Math.max(0, leftX + 20); x <= leftX + 50; x++) {
      const idx = (y * width + x) * 4;
      if (isStructuralCornerFacet(data[idx], data[idx + 1], data[idx + 2])) {
        data[idx + 3] = 255;
      }
    }
    for (let x = Math.max(0, rightX - 45); x <= Math.min(width - 1, rightX + 12); x++) {
      const idx = (y * width + x) * 4;
      if (isStructuralCornerFacet(data[idx], data[idx + 1], data[idx + 2])) {
        data[idx + 3] = 255;
      }
    }
  }
}

function isBottomGoldPixel(r, g, b) {
  const l = lum(r, g, b);
  if (r > 115 && g > 45 && b < 125 && l > 45) return true;
  return r > 40 && g >= 8 && r > g && g > b && l >= 15 && l < 75;
}

function isStrictBottomGold(r, g, b) {
  const l = lum(r, g, b);
  return r > 115 && g > 45 && b < 125 && l > 45;
}

/** Remove horizontal purple glow slabs at the bottom corners. */
function stripBottomGlowWings(target, width, height, floor) {
  if (!floor) return;

  const { floorY, leftX, rightX } = floor;
  const yMin = Math.max(0, floorY - 20);
  const yMax = Math.min(height - 1, floorY + 48);

  for (let y = yMin; y <= yMax; y++) {
    const goldX = [];
    for (let x = 0; x < width; x++) {
      const p = y * width + x;
      if (!target.get(p)) continue;
      const idx = p * 4;
      if (isStrictBottomGold(target.data[idx], target.data[idx + 1], target.data[idx + 2])) {
        goldX.push(x);
      }
    }

    const leftAnchor = goldX.filter((x) => x < leftX + 50);
    const rightAnchor = goldX.filter((x) => x > rightX - 50);
    const leftKeepMin = leftAnchor.length ? Math.min(...leftAnchor) - 8 : leftX + 14;
    const rightKeepMin = rightAnchor.length ? Math.min(...rightAnchor) - 14 : rightX - 8;
    const rightKeepMax = rightAnchor.length ? Math.max(...rightAnchor) + 8 : rightX + 4;

    for (let x = 0; x < width; x++) {
      const p = y * width + x;
      if (!target.get(p)) continue;

      const idx = p * 4;
      const r = target.data[idx];
      const g = target.data[idx + 1];
      const b = target.data[idx + 2];
      const l = lum(r, g, b);

      if (isChestStar(r, g, b)) continue;
      if (isBottomGoldPixel(r, g, b)) continue;
      if (isStructuralCornerFacet(r, g, b)) continue;
      if (r > 90 && g > 30 && b < 70 && l > 38) continue;
      if (!(b > g && l < 85)) continue;

      const inLeftWing = x < leftX + 50 && x < leftKeepMin;
      const inRightWing = x > rightX - 48 && (x < rightKeepMin || x > rightKeepMax);
      if (inLeftWing || inRightWing) target.set(p, 0);
    }
  }
}

function makeMaskTarget(data, mask) {
  return {
    data,
    get: (p) => mask[p] === 1,
    set: (p) => {
      mask[p] = 0;
    },
  };
}

function makeAlphaTarget(data) {
  return {
    data,
    get: (p) => data[p * 4 + 3] >= 128,
    set: (p) => {
      data[p * 4 + 3] = 0;
    },
  };
}

/** Paint chest body facets directly from source pixels inside the footprint. */
function fillInteriorBodyFromRaw(data, width, height, mask, floor) {
  if (!floor) return;

  const { floorY, leftX, rightX } = floor;
  const yMin = Math.max(0, floorY - 110);
  const yMax = Math.min(height - 1, floorY + 48);

  for (let y = yMin; y <= yMax; y++) {
    const innerBand = y <= floorY + 8;
    const xMin = innerBand ? Math.max(0, leftX - 12) : Math.max(0, leftX + 18);
    const xMax = innerBand ? Math.min(width - 1, rightX + 12) : Math.min(width - 1, rightX - 18);

    for (let x = xMin; x <= xMax; x++) {
      const idx = (y * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const l = lum(r, g, b);
      const s = sat(r, g, b);
      const inLeftHalo = x >= leftX + 26 && x <= leftX + 42;
      const inRightHalo = x >= rightX - 42 && x <= rightX + 14;
      if ((inLeftHalo || inRightHalo) && y > floorY - 5 && s > 95 && b > 80 && l < 72) {
        continue;
      }
      if (!isInteriorBodyPixel(r, g, b)) continue;
      mask[y * width + x] = 1;
    }
  }
}

/** Restore corner trim facets after glow stripping. */
function fillCornerFacetsFromRaw(data, width, height, mask, floor) {
  if (!floor) return;

  const { floorY, leftX, rightX } = floor;
  const yMin = Math.max(0, floorY - 40);
  const yMax = Math.min(height - 1, floorY + 48);

  for (let y = yMin; y <= yMax; y++) {
    for (let x = Math.max(0, leftX + 8); x <= Math.min(width - 1, leftX + 50); x++) {
      const idx = (y * width + x) * 4;
      if (isCornerTrimPixel(data[idx], data[idx + 1], data[idx + 2])) {
        mask[y * width + x] = 1;
      }
    }
    for (let x = Math.max(0, rightX - 50); x <= Math.min(width - 1, rightX + 10); x++) {
      const idx = (y * width + x) * 4;
      if (isCornerTrimPixel(data[idx], data[idx + 1], data[idx + 2])) {
        mask[y * width + x] = 1;
      }
    }
  }
}

/** Fill horizontal gaps between corner trim facets on the same row. */
function bridgeCornerRowGaps(data, width, height, mask, floor) {
  if (!floor) return;

  const { floorY, leftX } = floor;
  const yMin = Math.max(0, floorY - 24);
  const yMax = Math.min(height - 1, floorY + 48);
  const xMin = Math.max(0, leftX + 8);
  const xMax = Math.min(width - 1, leftX + 50);

  for (let y = yMin; y <= yMax; y++) {
    let leftEdge = -1;
    let rightEdge = -1;

    for (let x = xMin; x <= xMax; x++) {
      const idx = (y * width + x) * 4;
      if (!isCornerTrimPixel(data[idx], data[idx + 1], data[idx + 2])) continue;
      if (leftEdge < 0) leftEdge = x;
      rightEdge = x;
    }

    if (leftEdge < 0 || rightEdge - leftEdge < 4) continue;

    for (let x = leftEdge; x <= rightEdge; x++) {
      const idx = (y * width + x) * 4;
      if (isCornerTrimPixel(data[idx], data[idx + 1], data[idx + 2])) {
        mask[y * width + x] = 1;
      }
    }
  }
}

function isBottomTrimPixel(r, g, b) {
  return isCornerTrimPixel(r, g, b);
}

/** Fill horizontal bottom-trim rows inside a footprint band. */
function bridgeBottomRowsInBand(data, width, height, mask, floor, xMin, xMax, minSpan = 8) {
  if (!floor) return;

  const { floorY } = floor;
  const yMin = Math.max(0, floorY - 8);
  const yMax = Math.min(height - 1, floorY + 48);
  const bandMin = Math.max(0, xMin);
  const bandMax = Math.min(width - 1, xMax);

  for (let y = yMin; y <= yMax; y++) {
    let leftEdge = -1;
    let rightEdge = -1;

    for (let x = bandMin; x <= bandMax; x++) {
      const idx = (y * width + x) * 4;
      if (!isBottomTrimPixel(data[idx], data[idx + 1], data[idx + 2])) continue;
      if (leftEdge < 0) leftEdge = x;
      rightEdge = x;
    }

    if (leftEdge < 0 || rightEdge - leftEdge < minSpan) continue;

    for (let x = leftEdge; x <= rightEdge; x++) {
      const idx = (y * width + x) * 4;
      if (isBottomTrimPixel(data[idx], data[idx + 1], data[idx + 2])) {
        mask[y * width + x] = 1;
      }
    }
  }
}

/** Fill horizontal gaps in the center front bottom ridge beside the foot. */
function bridgeCenterBottomRows(data, width, height, mask, floor) {
  bridgeBottomRowsInBand(data, width, height, mask, floor, Math.floor(width * 0.3), Math.floor(width * 0.7));
}

/** Fill horizontal gaps in the right wing bottom ridge beside the foot. */
function bridgeRightBottomRows(data, width, height, mask, floor) {
  if (!floor) return;
  const { rightX } = floor;
  bridgeBottomRowsInBand(data, width, height, mask, floor, rightX - 45, rightX + 12);
}

/** Remove purple nebula glow outside the chest footprint. */
function stripExteriorSideGlow(target, width, height, floor) {
  if (!floor) return;

  const { leftX, rightX } = floor;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const p = y * width + x;
      if (!target.get(p)) continue;

      const onFarLeft = x < leftX - 4;
      const onFarRight = x > rightX + 4;
      if (!onFarLeft && !onFarRight) continue;

      const idx = p * 4;
      if (isExteriorPurpleGlow(target.data[idx], target.data[idx + 1], target.data[idx + 2])) {
        target.set(p, 0);
      }
    }
  }
}

/** Remove side halo pixels that sit below the chest base. */
function stripSideGlowBelowFloor(target, width, height, floor) {
  if (!floor) return;

  const { floorY, leftX, rightX } = floor;
  const brightGlowStart = floorY + 8;
  const darkFringeStart = floorY + 10;

  for (let y = brightGlowStart; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const p = y * width + x;
      if (!target.get(p)) continue;

      const inLeftHalo = x >= leftX + 28 && x <= leftX + 44;
      const inRightHalo = x >= rightX - 44 && x <= rightX + 16;
      const inOuterLeftTail = x >= leftX + 34 && x <= leftX + 44;
      const inOuterRightTail = x >= rightX - 44 && x <= rightX + 16;
      if (!inLeftHalo && !inRightHalo) continue;

      const idx = p * 4;
      const r = target.data[idx];
      const g = target.data[idx + 1];
      const b = target.data[idx + 2];
      const l = lum(r, g, b);
      const s = sat(r, g, b);
      const isBrightGlow = s > 95 && b > 80 && l >= 38 && l < 72 && r < 130;
      const isDarkGlowFringe =
        inOuterLeftTail && y > darkFringeStart && b > 50 && r < 60 && g < 12 && l < 42;
      if (isBrightGlow || isDarkGlowFringe) target.set(p, 0);
    }
  }
}

/** Remove outer glow tails below the feet without cutting real trim facets. */
function stripOuterGlowColumns(target, width, height, floor) {
  if (!floor) return;

  const { floorY, leftX, rightX } = floor;
  const yStart = floorY + 10;

  for (let y = yStart; y < height; y++) {
    for (let x = leftX + 30; x <= leftX + 48; x++) {
      const p = y * width + x;
      if (!target.get(p)) continue;

      const idx = p * 4;
      const r = target.data[idx];
      const g = target.data[idx + 1];
      const b = target.data[idx + 2];
      const l = lum(r, g, b);
      const s = sat(r, g, b);
      const isGlowTail =
        (s > 90 && b > 80 && l < 72 && r < 130) || (b > 50 && r < 60 && g < 12 && l < 42);
      if (isGlowTail) target.set(p, 0);
    }

    for (let x = rightX + 4; x < width; x++) {
      const p = y * width + x;
      if (!target.get(p)) continue;

      const idx = p * 4;
      if (isExteriorPurpleGlow(target.data[idx], target.data[idx + 1], target.data[idx + 2])) {
        target.set(p, 0);
      }
    }
  }
}

/** Drop floating purple glow specks; keep the main chest body and top stars. */
function pruneDetachedGlowSpecks(mask, width, height) {
  const total = width * height;
  const labels = new Int32Array(total);
  const stats = [];
  let nextLabel = 1;

  for (let p = 0; p < total; p++) {
    if (!mask[p] || labels[p]) continue;

    const label = nextLabel++;
    const queue = [p];
    labels[p] = label;
    let count = 0;
    let minY = height;

    while (queue.length > 0) {
      const cur = queue.shift();
      count++;
      const x = cur % width;
      const y = (cur - x) / width;
      minY = Math.min(minY, y);

      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
        const np = ny * width + nx;
        if (!mask[np] || labels[np]) continue;
        labels[np] = label;
        queue.push(np);
      }
    }

    stats[label] = { count, minY };
  }

  let mainLabel = 1;
  for (let label = 2; label < nextLabel; label++) {
    if (!stats[label]) continue;
    if (stats[label].count > stats[mainLabel].count) mainLabel = label;
  }

  for (let p = 0; p < total; p++) {
    if (!mask[p]) continue;
    const label = labels[p];
    if (!label || label === mainLabel) continue;
    if (stats[label].minY < 180) continue;
    mask[p] = 0;
  }
}

/** Restore the curved gold trim at the front bottom center. */
function bridgeCenterFrontTrim(data, width, height, mask, floor) {
  if (!floor) return;

  const { floorY } = floor;
  const yMin = Math.max(0, floorY - 32);
  const yMax = Math.min(height - 1, floorY + 48);
  const xMin = Math.floor(width * 0.44);
  const xMax = Math.floor(width * 0.72);
  const total = width * height;

  const isFrontGold = (r, g, b) => {
    const l = lum(r, g, b);
    if (r > 115 && g > 45 && b < 125 && l > 45) return true;
    // Gold shadow ramp at the curved front trim corners.
    return r > 28 && g >= 2 && r > g && l >= 12 && l < 80;
  };

  const queue = [];
  const seen = new Uint8Array(total);

  for (let y = yMin; y <= yMax; y++) {
    for (let x = xMin; x <= xMax; x++) {
      const p = y * width + x;
      if (mask[p]) {
        seen[p] = 1;
        queue.push(p);
        continue;
      }
      const idx = p * 4;
      if (!isFrontGold(data[idx], data[idx + 1], data[idx + 2])) continue;
      seen[p] = 1;
      queue.push(p);
    }
  }

  while (queue.length > 0) {
    const p = queue.shift();
    mask[p] = 1;
    const x = p % width;
    const y = (p - x) / width;
    const neighbors = [
      [x - 1, y],
      [x + 1, y],
      [x, y - 1],
      [x, y + 1],
    ];
    for (const [nx, ny] of neighbors) {
      if (nx < xMin || nx > xMax || ny < yMin || ny > yMax) continue;
      const np = ny * width + nx;
      if (seen[np]) continue;
      const idx = np * 4;
      if (!bridgeChestConnect(data[idx], data[idx + 1], data[idx + 2]) && !isFrontGold(data[idx], data[idx + 1], data[idx + 2])) {
        continue;
      }
      seen[np] = 1;
      queue.push(np);
    }
  }
}

function bridgeChestConnect(r, g, b) {
  const l = lum(r, g, b);
  if (r > 125 && g > 50 && b < 115 && l > 50) return true;
  if (b > g + 2 && b > 8 && r < 95 && g < 40 && l >= 4 && l < 70) return true;
  if (r > 35 && g > 6 && l > 18 && l < 100) return true;
  return false;
}

function floodBridge(data, width, height, mask, xMin, xMax, yMin, yMax, canConnect) {
  const total = width * height;
  const queue = [];
  const seen = new Uint8Array(total);

  for (let y = yMin; y <= yMax; y++) {
    for (let x = xMin; x <= xMax; x++) {
      const p = y * width + x;
      if (!mask[p]) continue;
      seen[p] = 1;
      queue.push(p);
    }
  }

  for (let y = yMin; y <= yMax; y++) {
    for (let x = xMin; x <= xMax; x++) {
      const p = y * width + x;
      if (seen[p]) continue;
      const idx = p * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      if (r > 125 && g > 50 && b < 115 && lum(r, g, b) > 50) {
        seen[p] = 1;
        queue.push(p);
      }
    }
  }

  while (queue.length > 0) {
    const p = queue.shift();
    mask[p] = 1;
    const x = p % width;
    const y = (p - x) / width;
    const neighbors = [
      [x - 1, y],
      [x + 1, y],
      [x, y - 1],
      [x, y + 1],
    ];
    for (const [nx, ny] of neighbors) {
      if (nx < xMin || nx > xMax || ny < yMin || ny > yMax) continue;
      const np = ny * width + nx;
      if (seen[np]) continue;
      const idx = np * 4;
      if (!canConnect(data[idx], data[idx + 1], data[idx + 2])) continue;
      seen[np] = 1;
      queue.push(np);
    }
  }
}

function floodFillMask(width, height, canEnter, seedOnly = false) {
  const total = width * height;
  const mask = new Uint8Array(total);
  const queue = [];

  for (let p = 0; p < total; p++) {
    const idx = p * 4;
    const r = canEnter.data[idx];
    const g = canEnter.data[idx + 1];
    const b = canEnter.data[idx + 2];
    const isSeed = canEnter.isSeed(r, g, b);
    if (seedOnly ? isSeed : canEnter.isConnect(r, g, b)) {
      if (seedOnly && !isSeed) continue;
      mask[p] = 1;
      queue.push(p);
    }
  }

  while (queue.length > 0) {
    const p = queue.shift();
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
      if (mask[np]) continue;
      const idx = np * 4;
      if (!canEnter.isConnect(canEnter.data[idx], canEnter.data[idx + 1], canEnter.data[idx + 2])) {
        continue;
      }
      mask[np] = 1;
      queue.push(np);
    }
  }

  return mask;
}

function floodFillHazeFromEdges(data, width, height) {
  const total = width * height;
  const haze = new Uint8Array(total);
  const queue = [];

  const tryPush = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const p = y * width + x;
    if (haze[p]) return;
    const idx = p * 4;
    if (!isChestHaze(data[idx], data[idx + 1], data[idx + 2])) return;
    haze[p] = 1;
    queue.push(p);
  };

  for (let x = 0; x < width; x++) {
    tryPush(x, 0);
    tryPush(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    tryPush(0, y);
    tryPush(width - 1, y);
  }

  while (queue.length > 0) {
    const p = queue.shift();
    const x = p % width;
    const y = (p - x) / width;
    tryPush(x - 1, y);
    tryPush(x + 1, y);
    tryPush(x, y - 1);
    tryPush(x, y + 1);
  }

  return haze;
}

/** Simple mask for clean chest sources with minimal exterior glow. */
function buildChestArtMaskMinimal(data, width, height) {
  const total = width * height;
  const background = floodFillBackground(data, width, height, (idx) => {
    const l = lum(data[idx], data[idx + 1], data[idx + 2]);
    return l < 22;
  });

  const mask = new Uint8Array(total);
  for (let p = 0; p < total; p++) {
    if (background[p]) continue;
    const idx = p * 4;
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    const l = lum(r, g, b);
    const s = sat(r, g, b);
    // Drop wordmark letters that leak into the crop on the right edge.
    if (l > 155 && s < 55) continue;
    mask[p] = 1;
  }

  pruneDetachedGlowSpecks(mask, width, height);
  return mask;
}

/** Mask for isolated chest renders on cosmic / nebula backgrounds. */
function buildChestArtMaskCosmic(data, width, height, floor) {
  const total = width * height;

  const isCosmicBackdrop = (r, g, b) => {
    if (isChestSeed(r, g, b) || isChestStar(r, g, b)) return false;
    const l = lum(r, g, b);
    const s = sat(r, g, b);
    if (l < 32) return true;
    if (l < 55 && b > g + 2 && s > 12 && s < 110) return true;
    return false;
  };

  const cosmicBg = floodFillBackground(data, width, height, (idx) =>
    isCosmicBackdrop(data[idx], data[idx + 1], data[idx + 2]),
  );

  const ctx = {
    data,
    isSeed: isChestSeed,
    isConnect: isChestConnect,
  };
  const foreground = floodFillMask(width, height, ctx, true);
  const haze = floodFillHazeFromEdges(data, width, height);

  const mask = new Uint8Array(total);
  for (let p = 0; p < total; p++) {
    mask[p] = foreground[p] && !haze[p] && !cosmicBg[p] ? 1 : 0;
  }

  bridgeChestBottom(data, width, height, mask, floor);
  bridgeCenterFrontPanel(data, width, height, mask, floor);
  bridgeBottomRidge(data, width, height, mask, floor);
  fillInteriorBodyFromRaw(data, width, height, mask, floor);
  fillCornerFacetsFromRaw(data, width, height, mask, floor);
  bridgeCornerRowGaps(data, width, height, mask, floor);
  bridgeCenterBottomRows(data, width, height, mask, floor);
  bridgeRightBottomRows(data, width, height, mask, floor);

  const maskTarget = makeMaskTarget(data, mask);
  stripEdgeConnectedHaze(maskTarget, width, height, floor);
  peelExteriorPurpleHalo(maskTarget, width, height, 18);
  stripWingExteriorGlow(maskTarget, width, height, floor);
  stripBottomGlowWings(maskTarget, width, height, floor);
  stripLeftBackCornerGlow(maskTarget, width, height, floor);
  pruneDetachedGlowSpecks(mask, width, height);

  return mask;
}

/** Keep only chest body + 4 stars; drop disconnected purple glow. */
function buildChestArtMask(data, width, height, floor, { minimalGlow = false, cosmicBg = false } = {}) {
  if (cosmicBg) {
    return buildChestArtMaskCosmic(data, width, height, floor);
  }
  if (minimalGlow) {
    return buildChestArtMaskMinimal(data, width, height);
  }

  const total = width * height;
  const ctx = {
    data,
    isSeed: isChestSeed,
    isConnect: isChestConnect,
  };
  const foreground = floodFillMask(width, height, ctx, true);
  const haze = floodFillHazeFromEdges(data, width, height);

  const mask = new Uint8Array(total);
  for (let p = 0; p < total; p++) {
    mask[p] = foreground[p] && !haze[p] ? 1 : 0;
  }

  bridgeChestBottom(data, width, height, mask, floor);
  bridgeLeftFrontPanel(data, width, height, mask, floor);
  bridgeCenterFrontPanel(data, width, height, mask, floor);
  bridgeCenterFrontTrim(data, width, height, mask, floor);
  bridgeBottomRidge(data, width, height, mask, floor);
  fillInteriorBodyFromRaw(data, width, height, mask, floor);

  if (!minimalGlow) {
    stripSideGlowBelowFloor(
      {
        data,
        get: (p) => mask[p] === 1,
        set: (p) => {
          mask[p] = 0;
        },
      },
      width,
      height,
      floor,
    );
    stripOuterGlowColumns(
      {
        data,
        get: (p) => mask[p] === 1,
        set: (p) => {
          mask[p] = 0;
        },
      },
      width,
      height,
      floor,
    );
    stripExteriorSideGlow(
      {
        data,
        get: (p) => mask[p] === 1,
        set: (p) => {
          mask[p] = 0;
        },
      },
      width,
      height,
      floor,
    );
  }

  const pruneBelowY = floor ? Math.max(0, floor.floorY - 110) : height;

  // Drop faint fringe pixels with few solid neighbors (not on the chest base).
  for (let y = 1; y < height - 1; y++) {
    if (floor && y >= pruneBelowY) continue;
    for (let x = 1; x < width - 1; x++) {
      const p = y * width + x;
      if (!mask[p]) continue;
      const idx = p * 4;
      const l = lum(data[idx], data[idx + 1], data[idx + 2]);
      if (l > 24) continue;

      let solidNeighbors = 0;
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]) {
        const np = (y + dy) * width + (x + dx);
        if (!mask[np]) continue;
        const ni = np * 4;
        if (lum(data[ni], data[ni + 1], data[ni + 2]) > 30) solidNeighbors++;
      }

      if (solidNeighbors < 2) mask[p] = 0;
    }
  }

  pruneDetachedGlowSpecks(mask, width, height);
  fillCornerFacetsFromRaw(data, width, height, mask, floor);
  bridgeCornerRowGaps(data, width, height, mask, floor);
  bridgeCenterBottomRows(data, width, height, mask, floor);
  bridgeRightBottomRows(data, width, height, mask, floor);

  const maskTarget = makeMaskTarget(data, mask);
  stripEdgeConnectedHaze(maskTarget, width, height, floor);
  peelExteriorPurpleHalo(maskTarget, width, height, 24);
  stripWingExteriorGlow(maskTarget, width, height, floor);
  stripBottomGlowWings(maskTarget, width, height, floor);
  refillBottomCornerTrim(data, width, height, mask, floor);
  stripLeftBackCornerGlow(maskTarget, width, height, floor);
  stripExteriorSideGlow(maskTarget, width, height, floor);
  pruneDetachedGlowSpecks(mask, width, height);

  return mask;
}

/** Remove black background from wordmark; preserves purple / gold / silver letter art. */
async function keyOutWordmarkBackground(input) {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  const background = floodFillBackground(data, width, height, (idx) => isWordmarkBackground(idx, data));
  applyAlphaMask(data, width, height, background, guardWordmarkForeground);

  return sharp(data, {
    raw: { width, height, channels: 4 },
  });
}

/** Crop off the gold "REWARDS" subline below the main GioGo lettering. */
function detectGioGoWordmarkHeight(data, width, height, channels, pad = 8) {
  const rowStats = [];
  for (let y = 0; y < height; y++) {
    let n = 0;
    let gold = 0;
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * channels;
      if (data[i + 3] < 20) continue;
      n++;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      if (r > 150 && g > 90 && b < 115 && r - b > 40) gold++;
    }
    rowStats.push({ n, goldRatio: n ? gold / n : 0 });
  }

  let bestGapStart = -1;
  let bestGapEnd = -1;
  let bestGapLen = 0;
  let gapStart = -1;

  for (let y = Math.floor(height * 0.35); y < height; y++) {
    if (rowStats[y].n < 80) {
      if (gapStart < 0) gapStart = y;
    } else if (gapStart >= 0) {
      const len = y - gapStart;
      if (len >= 8 && len > bestGapLen) {
        bestGapLen = len;
        bestGapStart = gapStart;
        bestGapEnd = y;
      }
      gapStart = -1;
    }
  }

  if (bestGapStart < 0) return height;

  let lowerGold = 0;
  let lowerN = 0;
  for (let y = bestGapEnd; y < Math.min(height, bestGapEnd + 40); y++) {
    lowerN += rowStats[y].n;
    lowerGold += rowStats[y].n * rowStats[y].goldRatio;
  }
  if (!lowerN || lowerGold / lowerN < 0.15) return height;

  let cropBottom = bestGapStart - 1;
  while (cropBottom > 0 && rowStats[cropBottom].n < 120) cropBottom--;

  return Math.min(height, cropBottom + pad + 1);
}

async function trimWordmarkRewardsSubline(image) {
  const { data, info } = await sharp(image).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const cropHeight = detectGioGoWordmarkHeight(data, info.width, info.height, info.channels);
  if (cropHeight >= info.height) return image;

  return sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  }).extract({ left: 0, top: 0, width: info.width, height: cropHeight });
}

/** Detect chest base line from raw RGB (before alpha keying). */
async function detectChestFloorFromRaw(rawBuffer) {
  const { data, info } = await sharp(rawBuffer).raw().toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  const xStart = Math.floor(width * 0.12);
  const xEnd = Math.floor(width * 0.88);
  const scanStart = Math.max(0, height - 220);

  let floorY = -1;
  let leftX = width;
  let rightX = 0;

  for (let y = height - 1; y >= scanStart; y--) {
    let score = 0;
    let lx = width;
    let rx = 0;
    for (let x = xStart; x < xEnd; x++) {
      const idx = (y * width + x) * 3;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const l = lum(r, g, b);
      const s = sat(r, g, b);
      const isStruct = (r > 160 && g > 100 && b < 120) || l > 55 || (l > 40 && s > 50);
      if (!isStruct) continue;
      score++;
      lx = Math.min(lx, x);
      rx = Math.max(rx, x);
    }

    if (score >= 50 && rx - lx > width * 0.55) {
      floorY = y;
      leftX = lx;
      rightX = rx;
      break;
    }
  }

  if (floorY < 0) return null;

  // Widen footprint using the bottom band of chest art (includes wing corners).
  for (let y = Math.max(0, floorY - 35); y <= floorY; y++) {
    let lx = width;
    let rx = 0;
    let score = 0;
    for (let x = xStart; x < xEnd; x++) {
      const idx = (y * width + x) * 3;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const l = lum(r, g, b);
      const s = sat(r, g, b);
      const isStruct = (r > 160 && g > 100 && b < 120) || l > 55 || (l > 40 && s > 50);
      if (!isStruct) continue;
      score++;
      lx = Math.min(lx, x);
      rx = Math.max(rx, x);
    }
    if (score >= 12) {
      leftX = Math.min(leftX, lx);
      rightX = Math.max(rightX, rx);
    }
  }

  return { floorY, leftX, rightX };
}

function isChestFootStruct(r, g, b) {
  const l = lum(r, g, b);
  const s = sat(r, g, b);
  if (isChestHaze(r, g, b)) return false;
  return (r > 160 && g > 100 && b < 120) || l > 58 || (l > 42 && s > 55);
}

/** Remove glow below the chest feet using the lowest foot across the footprint. */
function stripUnderChestFloorGlow(data, width, height, floor) {
  if (!floor) return;

  const { floorY, leftX, rightX } = floor;
  const xStart = Math.max(0, leftX - 8);
  const xEnd = Math.min(width - 1, rightX + 8);
  const scanStart = Math.max(0, floorY - 50);
  let globalBottom = -1;

  for (let x = xStart; x <= xEnd; x++) {
    for (let y = height - 1; y >= scanStart; y--) {
      if (data[(y * width + x) * 4 + 3] < 128) continue;
      globalBottom = Math.max(globalBottom, y);
      break;
    }
  }

  if (globalBottom < 0) return;

  for (let y = globalBottom + 2; y < height; y++) {
    for (let x = 0; x < width; x++) {
      data[(y * width + x) * 4 + 3] = 0;
    }
  }

  // Safety: drop any remaining glow outside the chest footprint.
  for (let y = floorY + 54; y < height; y++) {
    for (let x = 0; x < width; x++) {
      data[(y * width + x) * 4 + 3] = 0;
    }
  }
}

/** Keep chest + stars only; binary alpha, no glow halos. */
async function keyOutChestBackground(input, floor, { minimalGlow = false, cosmicBg = false } = {}) {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  const mask = buildChestArtMask(data, width, height, floor, { minimalGlow, cosmicBg });
  const total = width * height;

  for (let p = 0; p < total; p++) {
    data[p * 4 + 3] = mask[p] ? 255 : 0;
  }

  if (minimalGlow || cosmicBg) {
    if (cosmicBg && floor) {
      const alphaTarget = makeAlphaTarget(data);
      peelExteriorPurpleHalo(alphaTarget, width, height, 12);
      stripWingExteriorGlow(alphaTarget, width, height, floor);
      stripUnderChestFloorGlow(data, width, height, floor);
    }
    return sharp(data, {
      raw: { width, height, channels: 4 },
    });
  }

  const alphaTarget = makeAlphaTarget(data);
  stripEdgeConnectedHaze(alphaTarget, width, height, floor);
  peelExteriorPurpleHalo(alphaTarget, width, height, 20);
  stripWingExteriorGlow(alphaTarget, width, height, floor);
  stripBottomGlowWings(alphaTarget, width, height, floor);
  refillBottomCornerTrimAlpha(data, width, height, floor);
  stripLeftBackCornerGlow(alphaTarget, width, height, floor);
  stripExteriorSideGlow(alphaTarget, width, height, floor);
  stripUnderChestFloorGlow(data, width, height, floor);

  return sharp(data, {
    raw: { width, height, channels: 4 },
  });
}

async function trimTransparentMargins(image) {
  return image.trim({
    background: { r: 0, g: 0, b: 0, alpha: 0 },
    threshold: 8,
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
function detectChestBounds(data, width, height, pad = 12, { maxScanX = 555 } = {}) {
  const px = (x, y) => {
    const i = (y * width + x) * 3;
    return [data[i], data[i + 1], data[i + 2]];
  };
  const lum = (c) => 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2];
  const sat = (c) => Math.max(...c) - Math.min(...c);
  const isSilverText = (c) => lum(c) > 165 && sat(c) < 50;

  let minX = width;
  let maxX = 0;
  let minY = height;
  let maxY = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x <= maxScanX; x++) {
      const c = px(x, y);
      if (lum(c) < 18) continue;
      // Drop wordmark letters and their soft fringe to the right of the stars.
      if (x > 470 && (isSilverText(c) || lum(c) > 120)) continue;
      if (x > 400 && isSilverText(c)) continue;

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
function detectWordmarkBounds(data, width, height, chestRightX, pad = 4) {
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

const chestImagePath = chestOnly ? chestSource : source;
const chestSourceMeta = chestOnly ? await sharp(chestImagePath).metadata() : null;
const isolatedChest =
  chestOnly && chestSourceMeta && chestSourceMeta.width <= 720 && chestSourceMeta.height <= 720;
const cosmicBg = isolatedChest;
const minimalGlow = chestOnly && !cosmicBg;

const { data: chestSourceData, info: chestSourceInfo } = chestOnly
  ? await loadPixels(chestImagePath)
  : { data: sourceData, info: sourceInfo };

const chestCrop = detectChestBounds(
  chestSourceData,
  chestSourceInfo.width,
  chestSourceInfo.height,
  isolatedChest ? 4 : chestOnly ? 8 : 12,
  isolatedChest ? { maxScanX: chestSourceInfo.width - 1 } : chestOnly ? { maxScanX: 540 } : {},
);
const chestRightX = chestCrop.left + chestCrop.width;
const wordmarkCrop = detectWordmarkBounds(
  sourceData,
  sourceInfo.width,
  sourceInfo.height,
  Math.max(560, chestRightX - 8),
);

console.log('Chest source', chestImagePath);
console.log('Chest mode', { isolatedChest, cosmicBg, minimalGlow });
console.log('Chest crop', chestCrop);
if (!chestOnly) {
  console.log('Wordmark crop', wordmarkCrop);
}

const outputs = {
  chestWebp: join(assetsDir, 'GioGo_chest.webp'),
  wordmarkWebp: join(assetsDir, 'GioGo_wordmark.webp'),
  paletteJson: join(assetsDir, 'brand-palette.json'),
};

const chestRaw = await sharp(chestImagePath).extract(chestCrop).toBuffer();
const chestFloor = await detectChestFloorFromRaw(chestRaw);
console.log('Chest floor', chestFloor);

const chestTransparent = await keyOutChestBackground(chestRaw, chestFloor, { minimalGlow, cosmicBg });
await chestTransparent.clone().webp({ quality: 92, effort: 6, lossless: false }).toFile(outputs.chestWebp);
console.log(`Wrote ${outputs.chestWebp}`);

if (!chestOnly) {
  const wordmarkRaw = await sharp(source).extract(wordmarkCrop).toBuffer();
  const wordmarkTransparent = await trimTransparentMargins(
    await trimWordmarkRewardsSubline(await keyOutWordmarkBackground(wordmarkRaw)),
  );

  await wordmarkTransparent.clone().webp({ quality: 92, effort: 6, lossless: false }).toFile(outputs.wordmarkWebp);
  console.log(`Wrote ${outputs.wordmarkWebp}`);
} else {
  console.log(`Skipped ${outputs.wordmarkWebp} (chest-only mode)`);
}

const chestMeta = await sharp(outputs.chestWebp).metadata();
const wordmarkMeta =
  chestOnly && existsSync(outputs.wordmarkWebp)
    ? await sharp(outputs.wordmarkWebp).metadata()
    : chestOnly
      ? null
      : await sharp(outputs.wordmarkWebp).metadata();

const brandAssetsPath = join(root, 'assets/brand-assets.json');
const existingBrandAssets = existsSync(brandAssetsPath)
  ? JSON.parse(readFileSync(brandAssetsPath, 'utf8'))
  : {};

if (!chestOnly) {
  const palette = await extractBrandColors(source);
  writeFileSync(outputs.paletteJson, `${JSON.stringify(palette, null, 2)}\n`);
  console.log(`Wrote ${outputs.paletteJson}`, palette);
}

const chestForIcons = await keyOutChestBackground(chestRaw, chestFloor, { minimalGlow, cosmicBg });

async function renderCenteredChestIcon(chestSharp, outPath, size, { paddingRatio = 0.14, background = null }) {
  const trimmed = await chestSharp.clone().ensureAlpha().trim({ threshold: 10 }).toBuffer();
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

const iconOutputs = [
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

for (const { name, size, paddingRatio, background } of iconOutputs) {
  const out = join(assetsDir, name);
  await renderCenteredChestIcon(chestForIcons, out, size, { paddingRatio, background });
  console.log(`Wrote ${out} (${size}x${size})`);
}

writeFileSync(
  brandAssetsPath,
  `${JSON.stringify(
    {
      ...existingBrandAssets,
      chestAspect: chestMeta.width / chestMeta.height,
      wordmarkAspect: wordmarkMeta
        ? wordmarkMeta.width / wordmarkMeta.height
        : existingBrandAssets.wordmarkAspect,
      chestWidth: chestMeta.width,
      chestHeight: chestMeta.height,
      wordmarkWidth: wordmarkMeta?.width ?? existingBrandAssets.wordmarkWidth,
      wordmarkHeight: wordmarkMeta?.height ?? existingBrandAssets.wordmarkHeight,
      chestCrop,
      wordmarkCrop: chestOnly ? existingBrandAssets.wordmarkCrop : wordmarkCrop,
      chestSource: chestOnly ? chestImagePath : source,
      minimalGlow: chestOnly ? minimalGlow : false,
      cosmicBg: chestOnly ? cosmicBg : false,
    },
    null,
    2,
  )}\n`,
);
console.log('Done.');
