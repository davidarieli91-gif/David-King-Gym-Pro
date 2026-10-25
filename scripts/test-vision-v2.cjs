/* c199 — Vision V2: six complete themes replace the 33-theme pack and both
   texture systems. Checks the theme registry, shell, dashboard, portal and
   i18n wiring. */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const crm = fs.readFileSync(path.join(root, 'fitness-crm.html'), 'utf8');
const portal = fs.readFileSync(path.join(root, 'client.html'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
const tailwind = fs.readFileSync(path.join(root, 'tailwind.config.js'), 'utf8');
let pass = 0, fail = 0;
function ok(name, cond) { cond ? pass++ : fail++; console.log((cond ? 'PASS ' : 'FAIL ') + name); }
function has(s, x) { return s.indexOf(x) >= 0; }
const themes = ['v2-nebula', 'v2-aurora', 'v2-abyss', 'v2-solar', 'v2-arctic', 'v2-pearl'];

/* ---------- theme registry ---------- */
ok('trainer ships the six Vision themes', themes.every(id => has(crm, "id:'" + id + "'")));
ok('portal ships the same six themes', themes.every(id => has(portal, "id:'" + id + "'")));
ok('every trainer theme has a CSS token block', themes.every(id => has(crm, 'data-theme="' + id + '"')));
ok('every portal theme has a CSS token block', themes.every(id => has(portal, 'data-theme="' + id + '"')));
ok('trainer no longer lists the 33 legacy themes', !has(crm, "id:'midnight-obsidian'") && !has(crm, "id:'retro-1940'"));
ok('portal no longer lists the 33 legacy themes', !has(portal, "id:'midnight-obsidian'") && !has(portal, "id:'retro-1940'"));
ok('trainer maps old themes to Vision presets', has(crm, "'retro-1940':'v2-solar'") && has(crm, "'ocean-deep':'v2-nebula'") && has(crm, "'forest-night':'v2-abyss'"));
ok('portal maps old themes to Vision presets', has(portal, "'retro-1940':'v2-solar'") && has(portal, "'royal-purple':'v2-aurora'"));
ok('trainer has normalizeThemeId', has(crm, 'function normalizeThemeId(id)'));
ok('portal has normalizePortalTheme', has(portal, 'function normalizePortalTheme(t)'));
ok('applyTheme forces the v2 UI', has(crm, "document.documentElement.setAttribute('data-ui', 'v2')") && has(portal, "document.documentElement.setAttribute('data-ui', 'v2')"));

/* ---------- shell / scene ---------- */
ok('trainer html is v2 + nebula by default', has(crm, 'data-theme="v2-nebula" data-mode="dark" data-ui="v2"'));
ok('portal html is v2 + nebula by default', has(portal, 'data-theme="v2-nebula" data-mode="dark" data-ui="v2"'));
ok('trainer has the scene layers', has(crm, 'id="v2-scene"') && has(crm, 'id="v2-orb"') && has(crm, 'class="v2-grid"'));
ok('portal has the scene layer', has(portal, 'id="v2-scene"'));
ok('six scene gradients in trainer theme block', (crm.match(/--v2-scene:/g) || []).length >= 6);
ok('six scene gradients in portal theme block', (portal.match(/--v2-scene:/g) || []).length >= 6);
ok('trainer has the new top search', has(crm, 'id="v2-global-search"') && has(crm, 'id="v2-search-results"'));
ok('trainer has the profile menu', has(crm, 'id="v2-profile-btn"') && has(crm, 'id="v2-profile-menu"'));
ok('trainer has the mobile drawer', has(crm, 'v2-drawer-open') && has(crm, 'v2-drawer-backdrop'));
ok('trainer sidebar has the daily focus card', has(crm, 'class="v2-side-card"'));
ok('theme preview cards exist', has(crm, 'class="v2-theme-card') && has(crm, 'class="v2-theme-preview'));

/* ---------- dashboard ---------- */
ok('dashboard has KPI cards', has(crm, 'class="v2-kpi-grid"') && has(crm, 'id="v2-kpi-clients"'));
ok('dashboard has the roster + rail grid', has(crm, 'class="v2-dash-grid"') && has(crm, 'class="v2-dash-rail"'));
ok('dashboard has real coach insight', has(crm, 'id="v2-coach-text"') && has(crm, 'renderKpis'));
ok('empty client groups are hidden', has(crm, 'counts[g.id] || 0) > 0'));
ok('dashboard KPIs are localized through t()', has(crm, "tr('clients.kpiTotalSub')") && has(crm, "tr('clients.coachGood'"));
ok('new dashboard strings use data-i18n keys', has(crm, 'data-i18n="clients.kpiTotal"') && has(crm, 'data-i18n="clients.quickActions"') && has(crm, 'data-i18n="clients.coach"'));

/* ---------- workouts / anatomy ---------- */
ok('inline picker can mount the 3D body', has(crm, "root.classList.contains('bm-inline')"));
ok('3D mount has an SVG fallback', has(crm, 'window.DKBody3D.mount') && has(crm, '[body3d] fallback to SVG'));
ok('3D default is the new stage', has(crm, "getItem('dk_bodymap_mode') || '3d'"));
ok('atlas has neon stage lights', has(crm, '0x22d3ee') && has(crm, 'RingGeometry(0.46, 0.5'));
ok('exercise cards mark their source for neon plates', has(crm, 'v2-src-${src.toLowerCase()}'));
ok('neon x-ray image treatment exists', has(crm, '.bm-ex-card.v2-src-bf .aspect-square img'));
ok('exercise screen uses the full-width Vision layout', has(crm, 'html[data-ui="v2"] [data-screen="workouts"]'));

/* ---------- retired systems ---------- */
ok('trainer texture UI is gone', !has(crm, 'data-tex="wood"') && !has(crm, 'data-ptex="frost"'));
ok('trainer texture effects are forced off', has(crm, "texApply('none', null)"));
ok('trainer panel textures are forced off', has(crm, "ptexApply('off', null, PTEX_DEFAULT_TAU)"));
ok('portal texture sections are removed', has(portal, "['cps-tex-grid', 'cps-ptex-grid'].forEach"));
ok('portal texture effects are forced off', has(portal, "texApply('none', null)"));
ok('portal panel textures are forced off', has(portal, "ptexApply('off', null, 0.55)"));
ok('old texture setting UI no longer renders', !has(crm, 'settings.textureEffects') || !has(crm, 'data-tex="water"'));
ok('portal has Vision theme cards', has(portal, 'class="cp-theme-card'));

/* ---------- tailwind + fonts ---------- */
ok('Tailwind dark: follows data-mode', has(tailwind, 'darkMode: [\'selector\', \'[data-mode="dark"]\']'));
ok('display font is Space Grotesk', has(tailwind, 'Space Grotesk') && has(crm, 'Space+Grotesk'));
ok('portal loads Space Grotesk', has(portal, 'Space+Grotesk') || has(portal, "--font-display: 'Space Grotesk'"));

/* ---------- i18n ---------- */
for (const lang of ['en', 'ru', 'he']) {
  const d = JSON.parse(fs.readFileSync(path.join(root, 'src', 'i18n', lang + '.json'), 'utf8'));
  const keys = ['subtitle', 'workspace', 'kpiTotal', 'kpiActive', 'kpiWorkouts', 'kpiNew', 'roster', 'quickActions', 'coach', 'atlasEyebrow', 'dailyFocus'];
  ok('i18n ' + lang + ' has all Vision dashboard keys', keys.every(k => d.clients && typeof d.clients[k] === 'string' && d.clients[k].length > 0));
  ok('i18n ' + lang + ' has no corrupted new strings', !/\?{3,}/.test([d.clients.kpiTotal, d.clients.workspace, d.clients.coach, d.settings.themesHint].join(' ')));
}
ok('theme hint says six worlds', /6 /.test(JSON.parse(fs.readFileSync(path.join(root, 'src', 'i18n', 'en.json'), 'utf8')).settings.themesHint));

/* ---------- c199 depth pass ---------- */
ok('sidebar client search removed', !has(crm, 'id="aside-search"'));
ok('rich client cards exist', has(crm, 'v2-client-card') && has(crm, 'v2-client-progress') && has(crm, 'v2-client-dot'));
ok('client cards use real workout stats', has(crm, 'c._wk30') && has(crm, 'c._wkTotal'));
ok('client cards have a 6-week sparkline', has(crm, 'c._spark = s.spark') && has(crm, 'v2-client-spark'));
ok('client status pills are localized', has(crm, "t('clients.statusActive')"));
ok('exercise modal gets the neon source plate', has(crm, "gifSlot.setAttribute('data-src', _srcCode)"));
ok('exercise modal image is dark/transparent on GV/BF', has(crm, '#exercise-gif-slot[data-src="gv"] img'));
ok('exercise cards advertise their animation', has(crm, 'class="v2-anim-badge"'));
ok('card sheen animation exists', has(crm, '@keyframes v2-card-sheen'));

/* ---------- versions ---------- */
ok('trainer build c199', has(crm, 'name="dk-build" content="c199"'));
ok('login build c199', has(crm, '3 languages · c199'));
ok('RUNNING 199', has(crm, 'var RUNNING = 199;'));
ok('SW cache v226', has(sw, "CACHE_NAME = 'dk-gym-v226'"));

console.log('\n' + pass + ' passed, ' + fail + ' failed');
if (fail) process.exitCode = 1;
