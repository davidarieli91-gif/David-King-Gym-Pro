/* c73: (1) sidebar — Atlas button ABOVE Settings (Settings is the last item);
 *      (2) atlas is members-only — openAtlas() is a no-op (routes to login)
 *      while the trainer session is locked; version bumps.
 */
const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'fitness-crm.html');
let s = fs.readFileSync(FILE, 'utf8');
const orig = s;

function repOnce(name, anchor, replacement) {
  const n = s.split(anchor).length - 1;
  if (n !== 1) {
    console.error('ANCHOR "' + name + '" found ' + n + ' times — abort');
    process.exit(1);
  }
  s = s.replace(anchor, replacement);
  console.log('ok  ' + name);
}

/* ---------- 1) swap nav buttons: Atlas above Settings ---------- */
{
  const iSet = s.indexOf('data-i18n="nav.settings"');
  const iAtlas = s.indexOf('id="nav-atlas"');
  if (iSet < 0 || iAtlas < 0) { console.error('nav markers not found'); process.exit(1); }
  const setStart = s.lastIndexOf('<button', iSet);
  const setEnd = s.indexOf('</button>', iSet) + '</button>'.length;
  const atlasStart = s.lastIndexOf('<button', iAtlas);
  const atlasEnd = s.indexOf('</button>', iAtlas) + '</button>'.length;
  if (!(setStart < setEnd && setEnd < atlasStart && atlasStart < atlasEnd)) {
    console.error('unexpected nav layout — abort');
    process.exit(1);
  }
  const gap = s.slice(setEnd, atlasStart); /* whitespace between the two buttons */
  const settingsBtn = s.slice(setStart, setEnd);
  const atlasBtn = s.slice(atlasStart, atlasEnd);
  const before = s.slice(setStart, atlasEnd);
  s = s.replace(before, atlasBtn + gap + settingsBtn);
  console.log('ok  nav swap (atlas now before settings)');
}

/* ---------- 2) auth guard at the top of openAtlas ---------- */
repOnce('openAtlas auth guard',
`  function openAtlas() {
    if (!bindDom.done) { bindDom(); bindDom.done = true; }
    if (!modal) return;`,
`  function openAtlas() {
    /* c73: the atlas is members-only — while the session is locked, never open
     * (sidebar stays visible under the login screen, so its button is a leak);
     * bring the lock screen forward instead. */
    if (typeof auth === 'undefined' || !auth || typeof auth.isUnlocked !== 'function' || !auth.isUnlocked()) {
      if (typeof router !== 'undefined' && router && router.show) {
        try { router.show('login'); } catch (e) { /* noop */ }
      }
      return;
    }
    if (!bindDom.done) { bindDom(); bindDom.done = true; }
    if (!modal) return;`
);

/* ---------- 3) version markers ---------- */
repOnce('dk-build meta',
  `<meta name="dk-build" content="c72" />`,
  `<meta name="dk-build" content="c73" />`
);
repOnce('RUNNING',
  `var RUNNING = 72; /* numeric part of dk-build c72 */`,
  `var RUNNING = 73; /* numeric part of dk-build c73 */`
);

/* ---------- sanity: nav order ---------- */
{
  const navI18n = s.slice(s.indexOf('<nav', s.indexOf('aside.workspace') > 0 ? s.indexOf('aside.workspace') : 0), s.indexOf('</nav>', s.indexOf('data-i18n="nav.settings"')) + 6);
  const order = [...navI18n.matchAll(/data-i18n="(nav\.[a-z]+)"/g)].map(m => m[1]);
  console.log('nav order:', order.join(' → '));
  if (order.indexOf('nav.atlas') !== -1 &&
      order.indexOf('nav.settings') !== -1 &&
      order.indexOf('nav.atlas') > order.indexOf('nav.settings')) {
    console.error('atlas still after settings — abort');
    process.exit(1);
  }
  console.log('atlas above settings ✓');
}

fs.writeFileSync(FILE, s);
console.log('written, delta bytes:', s.length - orig.length);
