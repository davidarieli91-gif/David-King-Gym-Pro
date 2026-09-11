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
  'videos',
  'vendor',
  'data',
  'reports',
  'muscle-icons',
  'src/muscle-map.js',
  'src/i18n',
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

// c56: i18n словари также кладём в dist/assets/i18n — рядом с бандлом
// assets/crm.js, чтобы module-relative кандидат ('./i18n/<name>.json' от
// import.meta.url бандла) тоже находил файлы на GitHub Pages.
try {
  const i18nSrc = resolve(root, 'src/i18n');
  if (existsSync(i18nSrc)) {
    await cp(i18nSrc, resolve(dist, 'assets', 'i18n'), { recursive: true });
    console.log('copied assets/i18n');
  }
} catch (e) {
  console.warn('assets/i18n copy failed:', e.message);
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
