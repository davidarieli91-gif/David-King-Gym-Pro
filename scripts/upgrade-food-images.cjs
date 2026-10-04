/* c161: upgrade the kept products' photos to ~400px (the old mirror was 200px
   OFF previews / small thumbnails). For OpenFoodFacts URLs the size segment
   is swapped (.200.jpg → .400.jpg); other sources keep their original URL.
   Resume-safe: files already ≥380px wide are skipped. Run:
     node scripts/upgrade-food-images.cjs [--limit N] */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const root = path.join(__dirname, '..');
const db = JSON.parse(fs.readFileSync(path.join(root, 'food-db.json'), 'utf8'));
const imgDir = path.join(root, 'food-images');
const failuresPath = path.join(imgDir, 'failures.json');
const LIMIT = (() => { const i = process.argv.indexOf('--limit'); return i > 0 ? parseInt(process.argv[i + 1], 10) : 0; })();
const WORKERS = 8;

function hiResUrl(url) {
  const u = String(url || '');
  if (!u) return '';
  /* OFF image URLs end with <name>.<rev>.<size>.jpg — swap the size */
  if (/images\.openfoodfacts\.org/.test(u)) return u.replace(/\.\d+\.jpg$/i, '.400.jpg');
  return u;
}

async function upgradeOne(f) {
  const out = path.join(imgDir, f.id + '.jpg');
  try {
    if (fs.existsSync(out)) {
      const m = await sharp(out).metadata();
      if ((m.width || 0) >= 380 && (m.height || 0) >= 380) return 'skip';
    }
    const url = hiResUrl(f.image_url);
    if (!url) return 'nourl';
    const res = await fetch(url, { headers: { 'User-Agent': 'DavidKingGym/1.0 (personal fitness app)' } });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const buf = Buffer.from(await res.arrayBuffer());
    await sharp(buf)
      .rotate()
      .resize(400, 400, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 82 })
      .toFile(out + '.tmp');
    fs.renameSync(out + '.tmp', out);
    return 'ok';
  } catch (e) {
    return 'fail:' + (e && e.message ? e.message : e);
  }
}

(async () => {
  if (!fs.existsSync(imgDir)) { console.error('food-images folder missing'); process.exit(1); }
  let list = db.filter((f) => f.image_url);
  if (LIMIT > 0) list = list.slice(0, LIMIT);
  const failures = [];
  let ok = 0, skip = 0, fail = 0;
  let idx = 0;
  async function worker() {
    while (idx < list.length) {
      const f = list[idx++];
      const r = await upgradeOne(f);
      if (r === 'ok') ok++;
      else if (r === 'skip') skip++;
      else { fail++; failures.push({ id: f.id, error: r }); if (failures.length <= 10) console.log('FAIL ' + f.id + ' ' + r); }
      if ((ok + skip + fail) % 100 === 0) console.log('progress ' + (ok + skip + fail) + '/' + list.length + ' (ok ' + ok + ', skip ' + skip + ', fail ' + fail + ')');
    }
  }
  await Promise.all(Array.from({ length: WORKERS }, worker));
  fs.writeFileSync(failuresPath, JSON.stringify(failures, null, 2), 'utf8');
  let bytes = 0, files = 0;
  for (const f of fs.readdirSync(imgDir)) {
    if (!/\.jpg$/i.test(f)) continue;
    bytes += fs.statSync(path.join(imgDir, f)).size;
    files++;
  }
  console.log('done — ok ' + ok + ', skipped(already hi-res) ' + skip + ', failed ' + fail);
  console.log('images ' + files + ' | ' + (bytes / 1048576).toFixed(1) + ' MB');
})().catch((e) => { console.error(e); process.exit(1); });
