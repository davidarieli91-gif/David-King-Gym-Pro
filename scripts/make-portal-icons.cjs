/* c155: client-portal PWA icons — generated ONCE from ckientlogo.png with sharp.
   Run: node scripts/make-portal-icons.cjs
   Outputs (repo root, shipped to dist by copy-assets):
     icon-portal-192.png           192  any
     icon-portal-512.png           512  any
     icon-portal-maskable-512.png  512  maskable (logo inside the 80% safe zone)
     icon-portal-180.png           180  apple-touch-icon (iOS Safari)
     icon-portal-32.png            32   favicon (Windows/desktop, browser tabs) */
const path = require('path');
const sharp = require('sharp');

const root = path.join(__dirname, '..');
const SRC = path.join(root, 'ckientlogo.png');
const BG = { r: 255, g: 255, b: 255, alpha: 1 }; /* the artwork is drawn on white in every preview */

async function flat(size) {
  await sharp(SRC)
    .resize(size, size, { fit: 'cover' })
    .flatten({ background: BG })
    .png({ compressionLevel: 9 })
    .toFile(path.join(root, `icon-portal-${size}.png`));
  console.log('icon-portal-' + size + '.png');
}

async function maskable(size) {
  const inner = Math.round(size * 0.78); /* keep the whole logo inside the mask safe zone */
  const logo = await sharp(SRC).resize(inner, inner, { fit: 'cover' }).flatten({ background: BG }).png().toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background: BG } })
    .composite([{ input: logo, left: Math.round((size - inner) / 2), top: Math.round((size - inner) / 2) }])
    .png({ compressionLevel: 9 })
    .toFile(path.join(root, 'icon-portal-maskable-' + size + '.png'));
  console.log('icon-portal-maskable-' + size + '.png');
}

(async () => {
  await flat(192);
  await flat(512);
  await maskable(512);
  await sharp(SRC).resize(180, 180, { fit: 'cover' }).flatten({ background: BG }).png({ compressionLevel: 9 }).toFile(path.join(root, 'icon-portal-180.png'));
  console.log('icon-portal-180.png');
  await sharp(SRC).resize(32, 32, { fit: 'cover' }).flatten({ background: BG }).png({ compressionLevel: 9 }).toFile(path.join(root, 'icon-portal-32.png'));
  console.log('icon-portal-32.png');
  console.log('done');
})().catch((e) => { console.error(e); process.exit(1); });
