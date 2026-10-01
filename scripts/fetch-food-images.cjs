/* c147: fetch every food-db.json image ONCE and store it locally.
   • output: food-images/<id>.jpg — max 256px, JPEG q80 (≈15–25 KB each)
   • RESUMABLE: existing files are skipped, so an interrupted run continues
   • failures.json lists items that failed (apps fall back to the external URL
     and then to a category placeholder)
   Run:  node scripts/fetch-food-images.cjs  */
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
let sharp;
try { sharp = require('sharp'); } catch (e) { console.error('sharp is required: npm i -D sharp'); process.exit(1); }

const root = path.join(__dirname, '..');
const outDir = path.join(root, 'food-images');
const db = JSON.parse(fs.readFileSync(path.join(root, 'food-db.json'), 'utf8'));
const items = (Array.isArray(db) ? db : []).filter(x => x && x.id && x.image_url && /^https?:/i.test(x.image_url));
fs.mkdirSync(outDir, { recursive: true });

const log = m => console.log(new Date().toISOString().slice(11, 19), m);

function fetchBuf(url, redirects) {
  redirects = redirects == null ? 5 : redirects;
  return new Promise((resolve, reject) => {
    const mod = /^https:/i.test(url) ? https : http;
    const req = mod.get(url, {
      timeout: 25000,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DavidKingGym/1.0; image mirror)', 'Accept': 'image/*,*/*;q=0.8' }
    }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location && redirects > 0) {
        res.resume();
        return resolve(fetchBuf(new URL(res.headers.location, url).toString(), redirects - 1));
      }
      if (res.statusCode !== 200) { res.resume(); return reject(new Error('HTTP ' + res.statusCode)); }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    });
    req.on('timeout', () => req.destroy(new Error('timeout')));
    req.on('error', reject);
  });
}

async function one(it) {
  const dst = path.join(outDir, it.id + '.jpg');
  try {
    if (fs.existsSync(dst) && fs.statSync(dst).size > 800) return 'skip';
  } catch (e) {}
  const buf = await fetchBuf(it.image_url);
  if (!buf || buf.length < 900) throw new Error('body too small');
  const out = await sharp(buf)
    .rotate()
    .resize(256, 256, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 80 })
    .toBuffer();
  if (out.length < 800) throw new Error('resized too small');
  fs.writeFileSync(dst, out);
  return 'ok';
}

(async () => {
  const queue = items.slice();
  const fail = [];
  let ok = 0, skip = 0, done = 0;
  const total = items.length;
  log('start: ' + total + ' images, workers=8');
  const workers = Array.from({ length: 8 }, async () => {
    while (queue.length) {
      const it = queue.shift();
      try {
        const r = await one(it);
        if (r === 'skip') skip++; else ok++;
      } catch (e) {
        fail.push({ id: it.id, url: it.image_url, err: String(e && e.message || e) });
      }
      done++;
      if (done % 100 === 0 || done === total) {
        log('progress ' + done + '/' + total + ' ok=' + ok + ' skip=' + skip + ' fail=' + fail.length);
        try { fs.writeFileSync(path.join(outDir, 'failures.json'), JSON.stringify(fail, null, 1)); } catch (e) {}
      }
    }
  });
  await Promise.all(workers);
  try { fs.writeFileSync(path.join(outDir, 'failures.json'), JSON.stringify(fail, null, 1)); } catch (e) {}
  log('DONE total=' + total + ' ok=' + ok + ' skip=' + skip + ' fail=' + fail.length);
})();
