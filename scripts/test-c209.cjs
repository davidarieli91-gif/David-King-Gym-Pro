/* c209 test — neon depth for the client workspace/nutrition, dark food media
   and complete RU/HE copy for the new dashboard/client-card labels. */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const crm = fs.readFileSync(path.join(root, 'fitness-crm.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'src', 'dashboard-v3.css'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
let pass = 0, fail = 0;
function ok(name, cond) { if (cond) { pass++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name); } }

/* ---------- translations ---------- */
const langs = {};
for (const l of ['en', 'ru', 'he']) langs[l] = JSON.parse(fs.readFileSync(path.join(root, 'src', 'i18n', l + '.json'), 'utf8'));
for (const l of ['ru', 'he']) {
  let bad = [];
  const walk = (o, p) => {
    for (const k of Object.keys(o || {})) {
      const v = o[k], q = p ? p + '.' + k : k;
      if (typeof v === 'string' && /\?{2,}/.test(v)) bad.push(q);
      else if (v && typeof v === 'object') walk(v, q);
    }
  };
  walk(langs[l], '');
  ok(l + ': no corrupted question-mark copy', bad.length === 0);
}
const newKeys = [
  'clients.dynamics', 'clients.everyClient', 'clients.everyClientHint', 'clients.lastActivity',
  'clients.allGroups', 'clients.goalLabel', 'clients.workoutsLabel', 'clients.metricWeight',
  'clients.metricWaist', 'clients.metricFat', 'client.quote', 'client.weeks', 'client.daysShort',
  'client.message', 'client.call', 'client.note', 'health.weightTrend', 'health.workouts30', 'health.vsPrev30', 'health.days30', 'common.all', 'programs.newHint', 'nutrition.newPlanHint',
  'programs.activeProgram', 'programs.noActive'
];
const get = (o, k) => k.split('.').reduce((a, p) => a && a[p], o);
for (const l of ['en', 'ru', 'he']) {
  ok(l + ': all c209 workspace keys exist', newKeys.every(k => typeof get(langs[l], k) === 'string' && get(langs[l], k).length));
}
ok('dashboard All chip uses common.all', crm.indexOf("t('common.all')") >= 0);
ok('profile stats use localized 30-day labels', crm.indexOf("t('health.workouts30')") >= 0 && crm.indexOf("t('health.vsPrev30')") >= 0 && crm.indexOf("t('health.days30')") >= 0);
ok('hero quote uses client.quote', crm.indexOf("t('client.quote')") >= 0);

/* ---------- neon + dark cards ---------- */
ok('dashboard cards get neon depth', css.indexOf('.dk-kpi,') >= 0 && css.indexOf('0 0 34px -18px rgb(var(--v2-glow) / .55)') >= 0);
ok('client cards get a stronger hover glow', css.indexOf('.dk-client-card:hover') >= 0 && css.indexOf('0 0 38px -12px rgb(var(--v2-glow) / .65)') >= 0);
ok('profile hero gets a gold rim glow', css.indexOf('.dk-hero {') >= 0 && css.indexOf('0 0 46px -20px rgb(var(--v2-glow) / .55)') >= 0);
ok('product and meal cards follow the dark glass', ['.dk-product-card', '.nutri-food-tile', '.nutri-meal-row', '.food-tile'].every(k => css.indexOf(k) >= 0));
ok('product media gets a dark plate + overlay', css.indexOf('.dk-product-media::after') >= 0 && css.indexOf('rgba(4,7,16,.38)') >= 0);
ok('food images are dimmed for dark themes', css.indexOf('.nutri-food-tile .nutri-food-img') >= 0 && css.indexOf('brightness(.9)') >= 0);

/* ---------- versions ---------- */
ok('trainer build c213', crm.indexOf('<meta name="dk-build" content="c213" />') >= 0);
ok('trainer RUNNING 213', crm.indexOf('var RUNNING = 213;') >= 0);
ok('sidebar + login show c209', crm.indexOf('id="v2-side-version">c213') >= 0 && crm.indexOf('3 languages · c213') >= 0);
ok('SW cache v240', sw.indexOf("CACHE_NAME = 'dk-gym-v240'") >= 0);

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
