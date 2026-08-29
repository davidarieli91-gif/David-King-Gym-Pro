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
  'logo-web.webp',
  'icon-512.png',
  'images',
  'vendor',
  'data',
  'reports',
  'src/muscle-map.js',
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

// Дублируем PWA-файлы в dist/assets/ — манифест отдаётся оттуда же,
// поэтому браузер резолвит иконки относительно /assets/
for (const pwa of ['icon-192.png', 'icon-512.png', 'manifest.json']) {
  const src = resolve(root, pwa);
  const dst = resolve(dist, 'assets', pwa);
  if (existsSync(src)) {
    await cp(src, dst);
    console.log(`copied assets/${pwa}`);
  }
}

// Clean Vite's emitted HTML duplicates in assets/ (entries are already at dist root)
try {
  const assetDir = resolve(dist, 'assets');
  if (existsSync(assetDir)) {
    const files = await readdir(assetDir);
    for (const f of files) {
      if (/\.html$/i.test(f)) {
        await rm(resolve(assetDir, f));
        console.log(`removed duplicate ${f}`);
      }
    }
  }
} catch {}
console.log('assets copied');
