/* c155 unit + static test — client-portal PWA icons from ckientlogo.png.
   Data audit: the five generated PNGs exist with the EXACT pixel sizes the
   platforms need; the maskable variant keeps the logo inside the safe zone;
   manifest / head links / copy-assets / SW precache all point at the portal
   icon set (the trainer's own icons stay untouched). */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'client.html'), 'utf8');
const trainer = fs.readFileSync(path.join(root, 'fitness-crm.html'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
const copy = fs.readFileSync(path.join(root, 'scripts', 'copy-assets.js'), 'utf8');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest-portal.json'), 'utf8'));
const manifestCrm = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));
let pass = 0, fail = 0;
function ok(name, cond) { if (cond) { pass++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name); } }
function eq(name, got, want) { const g = JSON.stringify(got), w = JSON.stringify(want); if (g === w) { pass++; console.log('PASS ' + name + ' = ' + g); } else { fail++; console.log('FAIL ' + name + ' got ' + g + ' want ' + w); } }

function pngSize(file) {
  const b = fs.readFileSync(file);
  if (!(b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4E && b[3] === 0x47)) return null;
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
}

(async function () {
  /* ---------- 1. data audit ---------- */
  const files = ['icon-portal-192.png', 'icon-portal-512.png', 'icon-portal-maskable-512.png', 'icon-portal-180.png', 'icon-portal-32.png'];
  for (const f of files) ok('exists + real PNG: ' + f, fs.existsSync(path.join(root, f)) && !!pngSize(path.join(root, f)));
  eq('192 dimensions', pngSize(path.join(root, 'icon-portal-192.png')), { w: 192, h: 192 });
  eq('512 dimensions', pngSize(path.join(root, 'icon-portal-512.png')), { w: 512, h: 512 });
  eq('maskable dimensions', pngSize(path.join(root, 'icon-portal-maskable-512.png')), { w: 512, h: 512 });
  eq('apple-touch dimensions', pngSize(path.join(root, 'icon-portal-180.png')), { w: 180, h: 180 });
  eq('favicon dimensions', pngSize(path.join(root, 'icon-portal-32.png')), { w: 32, h: 32 });
  for (const f of files) {
    const sz = fs.statSync(path.join(root, f)).size;
    ok('sensible size ' + f + ' (' + Math.round(sz / 1024) + ' KB)', sz > 500 && sz < 700 * 1024);
  }
  /* the maskable edge ring must be the white safe zone; its center must carry the logo */
  const edgeRaw = await sharp(path.join(root, 'icon-portal-maskable-512.png')).extract({ left: 0, top: 256, width: 32, height: 4 }).raw({ depth: 'uchar' }).toBuffer({ resolveWithObject: true });
  const eCh = edgeRaw.info.channels;
  let edgeWhite = true;
  for (let i = 0; i < edgeRaw.data.length; i += eCh) {
    if (!(edgeRaw.data[i] > 245 && edgeRaw.data[i + 1] > 245 && edgeRaw.data[i + 2] > 245)) { edgeWhite = false; break; }
  }
  ok('maskable keeps the logo inside the safe zone (white edge ring)', edgeWhite);
  const centerRaw = await sharp(path.join(root, 'icon-portal-maskable-512.png')).extract({ left: 240, top: 240, width: 32, height: 32 }).raw({ depth: 'uchar' }).toBuffer({ resolveWithObject: true });
  const cCh = centerRaw.info.channels;
  let centerVaried = false;
  for (let i = 0; i < centerRaw.data.length; i += cCh) {
    if (centerRaw.data[i] < 240 || centerRaw.data[i + 1] < 240 || centerRaw.data[i + 2] < 240) { centerVaried = true; break; }
  }
  ok('maskable center contains the artwork', centerVaried);
  ok('source artwork present (ckientlogo.png)', fs.existsSync(path.join(root, 'ckientlogo.png')));

  /* ---------- 2. manifest ---------- */
  const icons = manifest.icons || [];
  eq('manifest has 3 portal icons', icons.length, 3);
  ok('manifest any 192/512 + maskable 512', icons.some(i => i.sizes === '192x192' && i.purpose === 'any' && /icon-portal-192\.png$/.test(i.src)) && icons.some(i => i.sizes === '512x512' && i.purpose === 'any' && /icon-portal-512\.png$/.test(i.src)) && icons.some(i => i.sizes === '512x512' && i.purpose === 'maskable' && /icon-portal-maskable-512\.png$/.test(i.src)));
  ok('manifest no longer uses the trainer icon', icons.every(i => i.src.indexOf('icon-512.png') < 0 && i.src.indexOf('icon-192.png') < 0));
  ok('trainer manifest untouched', (manifestCrm.icons || []).some(i => /icon-512\.png$/.test(i.src)) && JSON.stringify(manifestCrm).indexOf('icon-portal') < 0);

  /* ---------- 3. portal head ---------- */
  ok('favicon + 192 link in the portal head', html.indexOf('<link rel="icon" type="image/png" sizes="32x32" href="icon-portal-32.png" />') >= 0 && html.indexOf('<link rel="icon" type="image/png" sizes="192x192" href="icon-portal-192.png" />') >= 0);
  ok('apple-touch-icon for iOS Safari', html.indexOf('<link rel="apple-touch-icon" sizes="180x180" href="icon-portal-180.png" />') >= 0);
  ok('iOS web-app metas', html.indexOf('name="apple-mobile-web-app-capable"') >= 0 && html.indexOf('name="apple-mobile-web-app-title"') >= 0 && html.indexOf('name="apple-mobile-web-app-status-bar-style"') >= 0);
  ok('old trainer icon link removed from the portal', html.indexOf('rel="apple-touch-icon" href="icon-512.png"') < 0);

  /* ---------- 4. shipping ---------- */
  for (const f of files) ok('copy-assets ships ' + f, copy.indexOf("'" + f + "'") >= 0 && copy.indexOf("'" + f + "',") >= 0);
  ok('source artwork NOT shipped (1.8 MB)', copy.indexOf("'ckientlogo.png'") < 0 && copy.indexOf('"ckientlogo.png"') < 0);
  for (const f of files) ok('SW precaches ' + f, sw.indexOf("'./" + f + "'") >= 0);

  /* ---------- 5. generator script ---------- */
  ok('icon generator script kept', fs.existsSync(path.join(root, 'scripts', 'make-portal-icons.cjs')));

  /* ---------- versions ---------- */
  ok('sw cache at least v182', (function () { const m = sw.match(/CACHE_NAME = 'dk-gym-v(\d+)'/); return !!m && Number(m[1]) >= 182; })());
  ok('RUNNING / dk-build at least c155', (function () {
    const r = trainer.match(/var RUNNING = (\d+)/), b = trainer.match(/content="c(\d+)"/);
    return !!r && !!b && Number(r[1]) >= 155 && Number(b[1]) >= 155;
  })());

  console.log('\n' + pass + ' passed, ' + fail + ' failed');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.log('FAIL suite crashed: ' + (e && e.message)); process.exit(1); });
