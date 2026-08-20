import { cp, mkdir, readdir, rm } from 'fs/promises';
import { existsSync } from 'fs';
import { resolve } from 'path';

const root = resolve(import.meta.dirname, '..');
const dist = resolve(root, 'dist');

const assets = [
  'exercise-db.json',
  'food-db.json',
  'manifest.json',
  'sw.js',
  'icon-192.png',
  'icon-512.png',
  'images',
  'vendor',
  'data',
  'reports',
];

for (const asset of assets) {
  const src = resolve(root, asset);
  const dst = resolve(dist, asset);
  if (!existsSync(src)) {
    console.log(`skip ${asset} (not found)`);
    continue;
  }
  await mkdir(resolve(dst, '..'), { recursive: true });
  await cp(src, dst, { recursive: true });
  console.log(`copied ${asset}`);
}

// Clean Vite's hashed duplicates that are also copied as static assets
// (Vite hashes manifest/icon referenced from HTML; we keep the root copies
// that sw.js expects and remove the hashed ones to avoid duplication)
try {
  const assetDir = resolve(dist, 'assets');
  if (existsSync(assetDir)) {
    const files = await readdir(assetDir);
    for (const f of files) {
      if (/^(fitness-crm|client|index)-.*\.html$/.test(f) || /^manifest-.*\.json$/.test(f) || /^icon-.*\.png$/.test(f)) {
        await rm(resolve(assetDir, f));
        console.log(`removed duplicate ${f}`);
      }
    }
  }
} catch {}
console.log('assets copied');
