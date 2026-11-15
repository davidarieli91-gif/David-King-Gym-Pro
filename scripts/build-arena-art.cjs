/* c250: Arena lesson art - cut the light plate out of the flat illustrations so
 * the figure can sit on the Arena's own stage in every theme (dark navy plate
 * in dark themes, ice plate in light themes). Global theme filters stay out of
 * the way: no invert, no blend modes, no washed-out or black images.
 *
 * Input : images/rdb/*.webp (flat illustration, light-blue plate)
 *         images/bf_*.webp (render on white)
 * Output: images/arena/<slug>.webp (transparent, trimmed) + manifest.json
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const root = path.join(__dirname, '..');
const outDir = path.join(root, 'images', 'arena');

const data = JSON.parse(fs.readFileSync(path.join(root, 'arena-data.json'), 'utf8'));
const sources = new Set();
for (const game of data.games || []) {
  for (const p of game.paths || []) {
    for (const tier of p.tiers || []) {
      for (const lesson of tier.lessons || []) {
        if (lesson.image) sources.add(String(lesson.image));
      }
    }
  }
}

function slugFor(src) {
  return String(src)
    .replace(/^\/+/, '')
    .replace(/^images\//, '')
    .replace(/[/\\]+/g, '__')
    .replace(/\.webp$/i, '')
    .replace(/[^a-z0-9_-]+/gi, '-')
    .toLowerCase();
}

const TOL = 34;        // hard background tolerance (RGB distance)
const SOFT = 92;       // feather radius: pixels this close are partially transparent
const MIN_BLOB = 60;   // connected non-bg blobs smaller than this are watermark artifacts

function dist(a, b) {
  const dr = a[0] - b[0], dg = a[1] - b[1], db = a[2] - b[2];
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

function quantKey(r, g, b) {
  return ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3);
}

async function processOne(src) {
  const input = path.join(root, src.replace(/^\//, ''));
  if (!fs.existsSync(input)) return { src, skipped: 'missing' };

  const { data: raw, info } = await sharp(input, { animated: false })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height;
  const N = W * H;

  // Background colour: median of the border ring (robust against one odd corner).
  const samples = [];
  const push = (x, y) => {
    const i = (y * W + x) * 4;
    samples.push([raw[i], raw[i + 1], raw[i + 2]]);
  };
  for (let x = 0; x < W; x += 3) { push(x, 0); push(x, H - 1); }
  for (let y = 0; y < H; y += 3) { push(0, y); push(W - 1, y); }
  const med = [0, 1, 2].map((c) => {
    const v = samples.map((s) => s[c]).sort((a, b) => a - b);
    return v[Math.floor(v.length / 2)];
  });

  const px = (i) => [raw[i * 4], raw[i * 4 + 1], raw[i * 4 + 2]];
  const alpha = new Uint8Array(N).fill(255);
  const lum = (p) => 0.2126 * p[0] + 0.7152 * p[1] + 0.0722 * p[2];
  const sat = (p) => { const mx = Math.max(p[0], p[1], p[2]), mn = Math.min(p[0], p[1], p[2]); return mx ? (mx - mn) : 0; };
  /* White/grey plates (Burnfit, GymImpulse) also hide a baked checkerboard or
     faint watermark: key those out by "light + desaturated", which follows the
     whole connected plate area instead of one exact colour. Coloured plates
     (RepDB light blue) keep the colour-distance criterion. */
  const plateIsGrey = sat(med) <= 14;
  const isPlate = (p) => plateIsGrey
    ? (sat(p) <= 30 && lum(p) >= 110)
    : (dist(p, med) <= TOL);

  // Flood fill the background from every border pixel that matches the plate.
  // Already-transparent pixels count as background regardless of their RGB
  // value: some sources keep (0,0,0,0) margins, others (255,255,255,0).
  const seen = new Uint8Array(N);
  const queue = [];
  const enqueue = (i) => {
    if (seen[i]) return;
    seen[i] = 1;
    if (raw[i * 4 + 3] < 40 || isPlate(px(i))) { alpha[i] = 0; queue.push(i); }
  };
  for (let x = 0; x < W; x++) { enqueue(x); enqueue((H - 1) * W + x); }
  for (let y = 0; y < H; y++) { enqueue(y * W); enqueue(y * W + W - 1); }
  while (queue.length) {
    const i = queue.pop();
    const x = i % W, y = (i / W) | 0;
    if (x > 0) enqueue(i - 1);
    if (x < W - 1) enqueue(i + 1);
    if (y > 0) enqueue(i - W);
    if (y < H - 1) enqueue(i + W);
  }

  // Feather: pixels that survived but are close to the plate colour and touch
  // transparency become partially transparent, with the plate colour unmixed.
  for (let pass = 0; pass < 2; pass++) {
    const updates = [];
    for (let i = 0; i < N; i++) {
      if (alpha[i] === 0) continue;
      const x = i % W, y = (i / W) | 0;
      let touchesClear = false;
      if (x > 0 && alpha[i - 1] === 0) touchesClear = true;
      if (!touchesClear && x < W - 1 && alpha[i + 1] === 0) touchesClear = true;
      if (!touchesClear && y > 0 && alpha[i - W] === 0) touchesClear = true;
      if (!touchesClear && y < H - 1 && alpha[i + W] === 0) touchesClear = true;
      if (!touchesClear) continue;
      const p = px(i);
      const a = plateIsGrey
        ? (sat(p) <= 30 ? Math.max(0, Math.min(1, (200 - lum(p)) / 90)) : 1)
        : Math.max(0, Math.min(1, (dist(p, med) - TOL) / (SOFT - TOL)));
      if (a >= 1) continue;
      updates.push([i, a]);
    }
    if (!updates.length) break;
    for (const [i, a] of updates) alpha[i] = Math.round(a * 255);
  }

  // Remove tiny non-background blobs (Burnfit's faint watermark letters).
  const comp = new Int32Array(N).fill(-1);
  const blobs = [];
  for (let i = 0; i < N; i++) {
    if (comp[i] !== -1 || alpha[i] === 0) continue;
    const id = blobs.length;
    const stack = [i];
    comp[i] = id;
    const members = [];
    while (stack.length) {
      const j = stack.pop();
      members.push(j);
      const x = j % W, y = (j / W) | 0;
      const near = [];
      if (x > 0) near.push(j - 1);
      if (x < W - 1) near.push(j + 1);
      if (y > 0) near.push(j - W);
      if (y < H - 1) near.push(j + W);
      for (const k of near) {
        if (comp[k] !== -1 || alpha[k] === 0) continue;
        comp[k] = id;
        stack.push(k);
      }
    }
    blobs.push(members);
  }
  for (const members of blobs) {
    if (members.length >= MIN_BLOB) continue;
    // watermark fragments: low saturation and light
    let rs = 0, gs = 0, bs = 0;
    for (const i of members) { rs += raw[i * 4]; gs += raw[i * 4 + 1]; bs += raw[i * 4 + 2]; }
    rs /= members.length; gs /= members.length; bs /= members.length;
    const mx = Math.max(rs, gs, bs), mn = Math.min(rs, gs, bs);
    const sat = mx ? (mx - mn) / mx : 0;
    if (sat < 0.12 && (rs + gs + bs) / 3 > 150) {
      for (const i of members) alpha[i] = 0;
    }
  }

  // Write alpha back, trim the transparent margins, keep a 6px breather.
  for (let i = 0; i < N; i++) raw[i * 4 + 3] = alpha[i];
  let minX = W, minY = H, maxX = -1, maxY = -1;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (alpha[y * W + x] > 8) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return { src, skipped: 'fully transparent' };
  const pad = 6;
  minX = Math.max(0, minX - pad); minY = Math.max(0, minY - pad);
  maxX = Math.min(W - 1, maxX + pad); maxY = Math.min(H - 1, maxY + pad);
  const cw = maxX - minX + 1, ch = maxY - minY + 1;

  const out = path.join(outDir, slugFor(src) + '.webp');
  await sharp(raw, { raw: { width: W, height: H, channels: 4 } })
    .extract({ left: minX, top: minY, width: cw, height: ch })
    .resize(560, 560, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 86, effort: 5, alphaQuality: 90 })
    .toFile(out);

  return { src, out: '/images/arena/' + path.basename(out), w: cw, h: ch };
}

(async () => {
  fs.mkdirSync(outDir, { recursive: true });
  const manifest = {};
  const report = [];
  for (const src of [...sources].sort()) {
    try {
      const res = await processOne(src);
      report.push(res);
      if (res.out) manifest[src] = res.out;
    } catch (error) {
      report.push({ src, error: error.message });
    }
  }
  fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
  fs.writeFileSync(path.join(outDir, 'report.json'), JSON.stringify(report, null, 2), 'utf8');
  const ok = report.filter((r) => r.out).length;
  console.log('[arena-art] ' + ok + '/' + sources.size + ' processed');
  report.filter((r) => !r.out).forEach((r) => console.log('  skip', r.src, r.skipped || r.error));
})();
