/* c215 — DKG Arena content and wiring. */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const root = path.join(__dirname, '..');
let pass = 0, fail = 0;
function ok(name, cond) { if (cond) { pass++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name); } }
function read(rel) { return fs.readFileSync(path.join(root, rel), 'utf8'); }

const arena = JSON.parse(read('arena-data.json'));
const crm = read('fitness-crm.html');
const js = read('src/arena.js');
const sync = read('src/server-sync.js');
const copy = read('scripts/copy-assets.js');
const sw = read('sw.js');

ok('arena data has eight games', Array.isArray(arena.games) && arena.games.length === 8);
ok('all eight games are available', arena.games.every(g => g.available) && arena.games.every(g => (g.paths || []).length));
for (const gameId of ['street_workout', 'strength', 'kettlebell', 'mobility', 'speed', 'endurance', 'hypertrophy', 'olympic']) {
  ok(gameId + ' path has three tiers of four lessons', (function () {
    const g = arena.games.find(x => x.id === gameId);
    const p = g && g.paths && g.paths[0];
    return !!p && p.tiers.length === 3 && p.tiers.every(t => t.lessons.length === 4 && t.exam && t.exam.stations.length >= 2 && t.trophy);
  })());
}
const mu = arena.games.find(g => g.id === 'street_workout').paths.find(p => p.id === 'muscle_up');
const dl = arena.games.find(g => g.id === 'strength').paths.find(p => p.id === 'deadlift');
ok('muscle-up has three tiers', mu.tiers.length === 3 && mu.tiers.every(t => t.lessons.length >= 3 && t.exam.stations.length >= 2 && t.trophy.name));
ok('deadlift has three bodyweight tiers', dl.tiers.length === 3 && dl.tiers.every((t, i) => t.exam.stations.some(s => s.type === 'load_bw' && s.target === [1, 1.5, 2][i])));
ok('trophy names are tier + path', /Бронзов/.test(dl.tiers[0].trophy.name.ru) && /Серебрян/.test(dl.tiers[1].trophy.name.ru) && /Золот/.test(dl.tiers[2].trophy.name.ru));
ok('trophies are trilingual', mu.tiers.every(t => t.trophy.name.en && t.trophy.name.ru && t.trophy.name.he));
ok('arena screen exists', crm.includes('data-screen="arena"') && crm.includes('id="arena-root"'));
ok('arena nav exists', crm.includes('data-nav="arena"') && crm.includes('data-i18n="nav.arena"'));
ok('arena script is loaded', crm.includes('src/arena.js?v=248'));
ok('arena store is in the schema', crm.includes("name: 'arena_progress'") && crm.includes("by_clientId"));
ok('arena progress is synced', sync.includes("'arena_progress'"));
ok('arena data and script are copied to dist', copy.includes("'arena-data.json'") && copy.includes("'src/arena.js'"));
ok('service worker v247 includes arena', sw.includes("CACHE_NAME = 'dk-gym-v247'") && sw.includes('./src/arena.js') && sw.includes('./arena-data.json'));
ok('profile exposes trophy count and arena shortcut', crm.includes('profile-arena-count') && crm.includes('data-quick-action="arena"'));
ok('arena has exam + trophy logic', js.includes('submitExam') && js.includes('trophyEarned') && js.includes('exam_attempts'));
ok('arena shows last-attempt breakdown + weak stations', js.includes('function examResultRows') && js.includes("u('weakStations')") && js.includes("u('attemptHistory')"));
ok('arena retries prefill the last attempt', js.includes('lastValues') && js.includes('values = setValues') && js.includes('values = { weight: weight, bodyweight: bodyweight }'));
ok('arena tier header shows lesson progress', js.includes('checkedLessons') && js.includes('${tierLessons.length}'));
ok('arena requires every station before submitting', js.includes('missingStation') && js.includes("u('fillStations')"));
ok('arena scrolls to the failed attempt', js.includes('data-arena-last-attempt') && js.includes('scrollIntoView'));
ok('arena exposes a guarded progress reset', js.includes("action === 'reset-path'") && js.includes("u('resetConfirm')") && js.includes("db.del('arena_progress'"));
ok('trophies can be shared', js.includes("action === 'share-trophy'") && js.includes('navigator.share') && read('server/public/portal-arena.html').includes('share-trophy'));
ok('arena supports time and distance stations', js.includes("station.type === 'time'") && js.includes("station.type === 'distance'") && js.includes('parseTime') && js.includes('fmtTime'));
ok('client arena supports time and distance', read('server/public/portal-arena.html').includes("s.type === 'time'") && read('server/public/portal-arena.html').includes("s.type === 'distance'") && read('server/public/portal-arena.html').includes('parseTime'));
ok('simple arena supports time and distance', read('server/public/portal.html').includes("station.type === 'time'") && read('server/public/portal.html').includes("station.type === 'distance'") && read('server/public/portal.html').includes('arenaParseTime'));
ok('client portal can open paths and submit arena exams', read('server/public/portal.html').includes('data-arena-path') && read('server/public/portal.html').includes('saveArenaRecord') && read('server/public/portal.html').includes('data-a-input'));
ok('portal API allows arena progress', read('server/src/routes/portal.ts').includes("'arena_progress'") && read('server/src/routes/portal.ts').includes('id,'));
ok('director console links to the arena', read('server/public/admin.html').includes('/fitness-crm.html?screen=arena'));
ok('client portal has its own installable app identity', read('server/public/portal.html').includes('__DKG_PORTAL_TOKEN__/manifest.json') && read('server/src/app.ts').includes("'/p/:token/manifest.json'") && read('server/src/app.ts').includes("'/p/:token/sw.js'"));
ok('portal settings expose theme, units, password and install', read('server/public/portal.html').includes('settings-card') && read('server/public/portal.html').includes('set-password') && read('server/public/portal.html').includes('set-install'));
ok('portal can log a workout into workout_history', read('server/public/portal.html').includes('startPortalWorkout') && read('server/public/portal.html').includes("collection: 'workout_history'") && read('server/src/routes/portal.ts').includes("'workout_history'"));
ok('portal password change endpoint exists', read('server/src/routes/portal.ts').includes("'/portal/:token/password'"));
ok('full legacy portal is the default client experience', fs.existsSync(path.join(root, 'server', 'public', 'portal-full.html')) && read('server/src/app.ts').includes("'portal-full.html'") && read('server/src/app.ts').includes('buildPortalPayload'));
ok('full portal skips blocking draft/cloud boot', read('server/public/portal-full.html').includes('if (window.__DKG_SERVER_MODE__) return;') && read('server/public/portal-full.html').includes('__DKG_SERVER_MODE__'));
ok('full portal saves workouts to the server', read('server/public/portal-full.html').includes("collection: 'workout_history'") && read('server/public/portal-full.html').includes('x-portal-pin'));
ok('full portal saves check-ins to the server', read('server/public/portal-full.html').includes("collection: 'checkins'") && read('server/public/portal-full.html').includes('function dkPushChecks'));
ok('full portal saves nutrition snapshots to the server', read('server/public/portal-full.html').includes("collection: 'nutrition_history'") && read('server/public/portal-full.html').includes('function dkPushNutr'));
ok('portal writes allow nutrition history', read('server/src/routes/portal.ts').includes("'nutrition_history'"));
ok('full portal understands trainer plan quantities', read('server/public/portal-full.html').includes('f.quantity != null'));
ok('full portal seeds server check-ins into the journal', read('server/public/portal-full.html').includes('remoteCheckins') && read('server/public/portal-full.html').includes("nsKey('dk_checkins')"));
ok('client portal has a dedicated arena page', fs.existsSync(path.join(root, 'server', 'public', 'portal-arena.html')) && read('server/src/app.ts').includes("'/p/:token/arena'") && read('server/public/portal-full.html').includes('portal-arena-btn'));
ok('client arena reads and writes arena_progress', read('server/public/portal-arena.html').includes('collection=arena_progress') && read('server/public/portal-arena.html').includes("collection: 'arena_progress'"));
ok('client arena gets a server-injected boot payload', read('server/public/portal-arena.html').includes('__DKG_PORTAL_BOOT__') && read('server/src/app.ts').includes('buildPortalPayload(rawToken)'));
ok('simple portal loads the latest arena data', read('server/public/portal.html').includes('arena-data.json?v=6') && read('server/public/portal-arena.html').includes('/arena-data.json?v=6'));
ok('simple portal opens the full arena page', read('server/public/portal.html').includes('/p/__DKG_PORTAL_TOKEN__/arena'));
ok('client portal service worker caches the arena shell', read('server/src/app.ts').includes('dk-portal-v2') && read('server/src/app.ts').includes("BASE + '/arena'") && read('server/src/app.ts').includes('arena-data.json?v=6'));
ok('client arena keeps an offline progress cache', read('server/public/portal-arena.html').includes('dk_arena_records_') && read('server/public/portal-arena.html').includes('serviceWorker.register'));
const check = spawnSync(process.execPath, ['--check', path.join(root, 'src', 'arena.js')], { encoding: 'utf8' });
ok('arena.js parses', check.status === 0);

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
