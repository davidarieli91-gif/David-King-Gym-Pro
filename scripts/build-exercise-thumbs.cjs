/* Build static thumbnails for Burnfit (bf_*) exercise images.
 *
 * Burnfit ships animated WebP files (179-352 frames, 0.5-2.1 MB each). The
 * exercise picker used to put the full animated file into every grid card:
 * a 200-card Burnfit result was ~160 MB of animations and froze low-power
 * devices. The grid now uses these small first-frame thumbnails; the full
 * animation is loaded only when the exercise card is opened.
 *
 * This runs after copy-assets.js (dist exists) and writes:
 *   dist/images/thumbs/<same basename>.webp
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const root = path.join(__dirname, '..');
const dist = path.join(root, 'dist');
const outDir = path.join(dist, 'images', 'thumbs');

if (!fs.existsSync(dist)) {
  console.error('[thumbs] dist folder not found; run the build first');
  process.exit(1);
}

const db = JSON.parse(fs.readFileSync(path.join(root, 'exercise-db.json'), 'utf8'));
const heavy = db.filter((e) => e
  && (e.src === 'bf' || String(e.id || '').startsWith('bf_') || e.src === 'gi' || String(e.id || '').startsWith('gi_'))
  && Array.isArray(e.i) && e.i[0]);

fs.mkdirSync(outDir, { recursive: true });

(async () => {
  let done = 0;
  const failed = [];

  for (const exercise of heavy) {
    const rel = String(exercise.i[0]).replace(/\\/g, '/');
    const input = path.join(root, rel);
    const output = path.join(outDir, path.basename(rel));
    if (!fs.existsSync(input)) {
      failed.push(rel + ' (missing source)');
      continue;
    }
    try {
      await sharp(input, { animated: false })
        .resize(320, 320, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .webp({ quality: 72, effort: 4 })
        .toFile(output);
      done += 1;
    } catch (error) {
      failed.push(rel + ': ' + error.message);
    }
  }

  console.log(`[thumbs] ${done} exercise thumbnails generated (Burnfit + GymImpulse), ${failed.length} failed`);
  if (failed.length) console.warn('[thumbs] failures:', failed.slice(0, 10));
})();
