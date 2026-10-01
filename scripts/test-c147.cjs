/* c147 unit + static test — bundled food images.
   Data audit: every food-db.json item with an image_url must have a local
   JPEG mirror produced by scripts/fetch-food-images.cjs. */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const trainer = fs.readFileSync(path.join(root, 'fitness-crm.html'), 'utf8');
const html = fs.readFileSync(path.join(root, 'client.html'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
const copy = fs.readFileSync(path.join(root, 'scripts', 'copy-assets.js'), 'utf8');
const db = JSON.parse(fs.readFileSync(path.join(root, 'food-db.json'), 'utf8'));
let pass = 0, fail = 0;
function ok(name, cond) { if (cond) { pass++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name); } }
const count = (s, n) => s.split(n).length - 1;

/* ---------- 1. data audit ---------- */
const dir = path.join(root, 'food-images');
ok('food-images dir exists', fs.existsSync(dir));
const items = (Array.isArray(db) ? db : []).filter(x => x && x.id && x.image_url && /^https?:/i.test(x.image_url));
const files = fs.readdirSync(dir).filter(f => /\.jpg$/i.test(f));
ok('mirror has a file for EVERY item with an image_url (' + items.length + ')', files.length === items.length);
ok('mirror is re-runnable / failures recorded', fs.existsSync(path.join(dir, 'failures.json')) && JSON.parse(fs.readFileSync(path.join(dir, 'failures.json'), 'utf8')).length === 0);
let badMagic = 0, badSize = 0, totalBytes = 0;
for (const f of files) {
  const b = fs.readFileSync(path.join(dir, f));
  totalBytes += b.length;
  if (!(b[0] === 0xFF && b[1] === 0xD8 && b[2] === 0xFF)) badMagic++;
  if (b.length < 800 || b.length > 200 * 1024) badSize++;
}
ok('all files are real JPEGs (FF D8 FF)', badMagic === 0);
ok('all files are sensible thumbnails (0.8–200 KB)', badSize === 0);
ok('total mirror stays compact (< 60 MB), got ' + (totalBytes / 1048576).toFixed(1) + ' MB', totalBytes < 60 * 1048576);
ok('every file maps to a db id', files.every(f => items.some(it => it.id + '.jpg' === f)));

/* ---------- 2. app wiring ---------- */
ok('trainer helper window.dkFoodImgTag', trainer.indexOf('window.dkFoodImgTag = function (f, cls)') >= 0);
ok('trainer helper chains local → external → hide', trainer.indexOf("food-images/' + escapeAttr(id) + '.jpg\" data-ext=\"' + escapeAttr(ext)") >= 0 && trainer.indexOf('this.dataset.ext') >= 0);
ok('portal helper foodImgTag', html.indexOf('function foodImgTag(f, cls)') >= 0);
ok('portal helper chains local → external → hide', html.indexOf("food-images/' + esc(id) + '.jpg\" data-ext=\"' + esc(ext)") >= 0 && html.indexOf('this.dataset.ext') >= 0);
ok('portal meal rows show photos', html.indexOf("${foodImgTag(f, 'absolute inset-0 w-full h-full object-cover')}") >= 0);
ok('portal diary search rows show photos', html.indexOf("+ foodImgTag(p, 'absolute inset-0 w-full h-full object-cover') +") >= 0);
ok('trainer picker + browser + detail use the helper', count(trainer, 'window.dkFoodImgTag(f, ') >= 2 && trainer.indexOf("window.dkFoodImgTag(food, 'absolute inset-0 w-full h-full object-contain bg-surface-2')") >= 0);
ok('placeholders behind the images (🥗)', html.indexOf('🥗</span>') >= 0 && trainer.indexOf('🥗</span>') >= 0);
ok('copy-assets ships food-images', copy.indexOf("'food-images'") >= 0);
ok('no external-only image markup left in the two food renderers', count(trainer, 'nextElementSibling.style.display') === 0);

/* ---------- 3. versions ---------- */
ok('sw cache at least v174', (function () { const m = sw.match(/CACHE_NAME = 'dk-gym-v(\d+)'/); return !!m && Number(m[1]) >= 174; })());
ok('RUNNING / dk-build at least c147', (function () {
  const r = trainer.match(/var RUNNING = (\d+)/), b = trainer.match(/content="c(\d+)"/);
  return !!r && !!b && Number(r[1]) >= 147 && Number(b[1]) >= 147;
})());

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
