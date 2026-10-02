/* c154 unit + static test — the install button is always there.
   The banner no longer depends on beforeinstallprompt (Chrome often does not
   fire it on the first visit): it shows on every non-installed device with a
   localized step-by-step guide; the native prompt is captured early in <head>. */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const trainer = fs.readFileSync(path.join(root, 'fitness-crm.html'), 'utf8');
const html = fs.readFileSync(path.join(root, 'client.html'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
let pass = 0, fail = 0;
function ok(name, cond) { if (cond) { pass++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name); } }
const count = (s, n) => s.split(n).length - 1;

/* ---------- STATIC: early capture in the head ---------- */
const headEnd = html.indexOf('</head>');
const head = html.slice(0, headEnd);
ok('beforeinstallprompt captured in <head> (can fire before the bundle)', head.indexOf("window.addEventListener('beforeinstallprompt'") >= 0 && head.indexOf('window.dkInstallPrompt = e') >= 0);
ok('appinstalled remembered in <head>', head.indexOf("window.addEventListener('appinstalled'") >= 0);
ok('service worker registers immediately (DOMContentLoaded), not only on load', html.indexOf("else document.addEventListener('DOMContentLoaded', dkReg151)") >= 0 && html.indexOf("window.addEventListener('load', dkReg151)") >= 0);

/* ---------- STATIC: banner no longer requires the prompt ---------- */
ok('banner shows on ANY non-installed device', html.indexOf('if (dkIsStandalone() || dkInstallDismissed()) return;') >= 0);
ok('old prompt-only condition removed', html.indexOf("if (!window.dkInstallPrompt && !dkIsIOS()) return;") < 0);
ok('platform detection helpers', html.indexOf('function dkInstallPlatform()') >= 0 && html.indexOf("if (dkIsAndroid() && dkIsChrome()) return 'android';") >= 0 && html.indexOf("if (dkIsChrome()) return 'desktop';") >= 0);

/* ---------- STATIC: fallback guide ---------- */
ok('install help modal + function', html.indexOf('id="dk-install-modal"') >= 0 && html.indexOf('function dkInstallHelp()') >= 0 && html.indexOf('id="install-help-steps"') >= 0 && html.indexOf('id="install-help-close"') >= 0);
ok('native prompt used when available, guide otherwise', html.indexOf('if (window.dkInstallPrompt) {') >= 0 && html.indexOf('dkInstallHelp();') >= 0 && html.indexOf('go.classList.toggle(\'hidden\', !window.dkInstallPrompt)') >= 0);
ok('appinstalled removes the banner + toast', html.indexOf("toast(t('installDone'), 'success', 3000)") >= 0 && html.indexOf("const b = document.getElementById('dk-install-banner'); if (b) b.remove();") >= 0);
ok('settings button visible whenever not installed', html.indexOf("if (_ci151) _ci151.classList.toggle('hidden', dkIsStandalone());") >= 0);

/* ---------- STATIC: i18n ×3 ---------- */
ok('install guide keys ×3', count(html, 'installHelpTitle:') === 3 && count(html, 'installHelpAndroid:') === 3 && count(html, 'installHelpDesktop:') === 3 && count(html, 'installHelpIos:') === 3 && count(html, 'installHelpOther:') === 3 && count(html, 'installHelpClose:') === 3 && count(html, 'installDone:') === 3);
ok('Android guide names the Chrome menu', html.indexOf('«Установить приложение»</b>') >= 0 && html.indexOf('“Install app”</b>') >= 0);

/* ---------- versions ---------- */
ok('sw cache at least v181', (function () { const m = sw.match(/CACHE_NAME = 'dk-gym-v(\d+)'/); return !!m && Number(m[1]) >= 181; })());
ok('RUNNING / dk-build at least c154', (function () {
  const r = trainer.match(/var RUNNING = (\d+)/), b = trainer.match(/content="c(\d+)"/);
  return !!r && !!b && Number(r[1]) >= 154 && Number(b[1]) >= 154;
})());

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
