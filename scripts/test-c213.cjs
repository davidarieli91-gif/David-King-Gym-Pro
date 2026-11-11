/* c213 — server-first multi-tenant foundation. */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const crm = fs.readFileSync(path.join(root, 'fitness-crm.html'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
const sync = fs.readFileSync(path.join(root, 'src', 'server-sync.js'), 'utf8');
const mode = fs.readFileSync(path.join(root, 'src', 'server-mode.js'), 'utf8');
const copy = fs.readFileSync(path.join(root, 'scripts', 'copy-assets.js'), 'utf8');
let pass = 0, fail = 0;
function ok(name, cond) { if (cond) { pass++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name); } }
function read(rel) { return fs.readFileSync(path.join(root, rel), 'utf8'); }

ok('trainer build c213', crm.includes('<meta name="dk-build" content="c213" />'));
ok('trainer RUNNING 213', crm.includes('var RUNNING = 213;'));
ok('sidebar + login show c213', crm.includes('id="v2-side-version">c213') && crm.includes('3 languages · c213'));
ok('SW cache v248', sw.includes("CACHE_NAME = 'dk-gym-v248'"));
ok('SW precaches server scripts', sw.includes("./src/server-mode.js") && sw.includes("./src/server-sync.js"));

ok('IndexedDB version 13', crm.includes('const DB_VERSION = 13;'));
ok('check-ins have a synced store', crm.includes("name: 'checkins'") && sync.includes("'checkins'"));
ok('trainer reads check-ins from the synced store', crm.includes("db.find('checkins', 'by_clientId'"));
ok('trainer analytics reads server nutrition days', crm.includes('const normNutr') && crm.includes("const rows = await db.find('nutrition_history', 'by_clientId', clientId)"));
ok('durable sync outbox store exists', crm.includes("name: 'sync_outbox'") && crm.includes("keyPath: 'key'"));
ok('tenant-scoped DB name', crm.includes("localStorage.getItem('dkg_db_name')"));
ok('local writes notify sync', crm.includes('notifyLocalChange(storeName, record)') && crm.includes('notifyLocalDelete(storeName, key)'));
ok('boot waits for the server gate', crm.includes('window.DKG_SERVER.ready'));
ok('boot pulls server records before screens render', crm.includes('window.DKG_SYNC.start()'));
ok('server session unlocks the app', crm.includes('window.DKG_SERVER.authenticated'));

ok('server gate CSS exists', fs.existsSync(path.join(root, 'src', 'server-gate.css')));
ok('server gate script checks /api/auth/me', mode.includes("'/api/auth/me"));
ok('server gate logs in via /api/auth/login', mode.includes("fetch('/api/auth/login'"));
ok('server gate logs out via /api/auth/logout', mode.includes("fetch('/api/auth/logout'"));
ok('server gate uses tenant DB names', mode.includes("fitness_crm_db_' + tenant.id"));
ok('server gate has a forgot-password action', crm.includes('dkg-gate-forgot') && mode.includes('/api/auth/forgot'));
ok('password reset page exists', fs.existsSync(path.join(root, 'server', 'public', 'reset.html')));
ok('password reset page posts to the API', read('server/public/reset.html').includes('/api/auth/reset'));
ok('server serves the reset page', read('server/src/app.ts').includes("'reset'"));
ok('rate limit returns 429, not 500', read('server/src/app.ts').includes('statusCode: 429') && read('server/src/app.ts').includes("code: 'too_many_requests'"));
ok('static assets do not consume the API rate limit', read('server/src/app.ts').includes('allowList'));
ok('logout clears expired sessions', read('server/src/routes/auth.ts').includes('deleteSessionByToken'));
ok('reset-app recovery page exists', fs.existsSync(path.join(root, 'server', 'public', 'reset-app.html')) && read('server/src/app.ts').includes("'reset-app'"));
ok('server manifest starts at the server root', read('server/src/app.ts').includes("start_url: '/fitness-crm.html'") && read('server/src/app.ts').includes("scope: '/'"));
ok('director can jump to the admin console from the trainer app', read('fitness-crm.html').includes('director-console-btn') && read('src/server-mode.js').includes('updateDirectorLink'));
ok('large static assets are served precompressed', read('server/src/app.ts').includes('preCompressed: true') && fs.existsSync(path.join(root, 'scripts', 'precompress.cjs')));
ok('static assets get long-lived cache headers', read('server/src/app.ts').includes("app.addHook('onSend'") && read('server/src/app.ts').includes('max-age=86400'));
ok('service worker never caches API/auth responses', read('sw.js').includes("url.pathname.startsWith('/api/')") && read('server/src/app.ts').includes("path.startsWith('/api/')"));

ok('sync engine pushes through /api/sync', sync.includes("fetch('/api/sync'"));
ok('sync engine pulls through /api/sync', sync.includes("fetch('/api/sync?since="));
ok('sync engine keeps a durable outbox', sync.includes("db.all('sync_outbox')") && sync.includes("db.put('sync_outbox'"));
ok('sync engine migrates the director cache once', sync.includes('migrateLocal') && sync.includes("dkg_migrated_"));
ok('reference food catalogue is not synced', sync.includes('skipFood') && sync.includes('OpenFoodFacts'));
ok('device seed flags are not synced', sync.includes('seeded_') && sync.includes('skipSetting'));
ok('build copies server scripts', copy.includes("'src/server-mode.js'") && copy.includes("'src/server-sync.js'"));
ok('build generates exercise thumbnails', fs.existsSync(path.join(root, 'scripts', 'build-exercise-thumbs.cjs')) && JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).scripts.build.includes('build-exercise-thumbs.cjs'));
ok('exercise grids use static thumbnails', crm.includes('function exerciseThumb') && crm.includes('exerciseCardImages') && crm.includes('images/thumbs/'));

/* c227: dark-mode exercise renders */
const portalFull = read('server/public/portal-full.html');
ok('dark mode darkens exercise renders in every trainer view', crm.includes('html[data-mode="dark"] img[src*="images/thumbs/"]') && crm.includes('img[src*="images/rdb/"]') && crm.includes('hue-rotate(180deg)'));
ok('client portal dark mode darkens exercise renders', portalFull.includes('html[data-mode="dark"] img[src*="images/thumbs/"]') && portalFull.includes('img[src*="images/rdb/"]') && portalFull.includes('hue-rotate(180deg)'));
ok('legacy client app dark mode darkens exercise renders', read('client.html').includes('html[data-mode="dark"] img[src*="images/thumbs/"]') && read('client.html').includes('hue-rotate(180deg)'));
ok('exercise renders keep their normal look when printing', crm.includes('@media print') && crm.includes('mix-blend-mode: normal !important') && portalFull.includes('mix-blend-mode: normal !important'));
ok('service worker caches the exercise DB on first use', !sw.includes("'./exercise-db.json'") && sw.includes('isExerciseDb') && sw.includes('caches.match(req)'));

ok('server migration exists', fs.existsSync(path.join(root, 'server', 'migrations', '001_init.sql')));
ok('server isolates records by tenant', read('server/migrations/001_init.sql').includes('record_rev_seq') && read('server/migrations/001_init.sql').includes('FORCE ROW LEVEL SECURITY'));
ok('director admin never reads tenant records', !read('server/src/routes/admin.ts').includes('FROM records'));
ok('portal response strips private client fields', read('server/src/routes/portal.ts').includes('PORTAL_CLIENT_FIELDS') && read('server/src/routes/portal.ts').includes('portalClient(resolved.client)'));
ok('portal page exists', fs.existsSync(path.join(root, 'server', 'public', 'portal.html')));
ok('director console exists', fs.existsSync(path.join(root, 'server', 'public', 'admin.html')));
ok('director can edit and delete trainers', read('server/src/routes/admin.ts').includes("'/tenants/:id/update'") && read('server/src/routes/admin.ts').includes("'/tenants/:id/delete'"));
ok('director console has clear add/edit/delete trainer controls', read('server/public/admin.html').includes('Добавить нового тренера') && read('server/public/admin.html').includes('data-edit') && read('server/public/admin.html').includes('data-delete') && read('server/public/admin.html').includes('Редактировать'));
ok('invite registration page exists', fs.existsSync(path.join(root, 'server', 'public', 'join.html')));
ok('docker image ships the frontend and public pages', read('server/Dockerfile').includes('COPY dist ./public-app') && read('server/Dockerfile').includes('COPY server/public ./public'));
ok('compose builds from the repository root', read('deploy/docker-compose.yml').includes('context: ..') && read('deploy/docker-compose.yml').includes('dockerfile: server/Dockerfile'));

/* c226: adaptive program workspace */
ok('program builder has an adaptive 3-pane workspace', crm.includes('id="pb-shell"') && crm.includes('class="pb-workspace"') && crm.includes('id="pb-left-body"') && crm.includes('id="pb-composer-host"'));
ok('program builder keeps its stable modal ids', crm.includes('id="program-builder-modal"') && crm.includes('id="program-day-preview-modal"') && crm.includes('id="bodymap-picker-modal"'));
ok('program builder uses the full desktop width', crm.includes('md:max-w-[min(97vw,1280px)]') && crm.includes('xl:max-w-[min(98vw,1900px)]'));
ok('program builder has a reorder mode', crm.includes('id="pb-reorder-btn"') && crm.includes('pbUI.reorderMode') && crm.includes("shellEl.classList.toggle('pb-reorder-on'"));
ok('touch reordering has quick move controls', crm.includes('data-pb-quick-move') && crm.includes('function pbQuickMove') && crm.includes('function pbMoveExercise'));
ok('each builder card has a touch action menu', crm.includes('data-pb-menu=') && crm.includes('id="pb-card-menu"') && crm.includes('function pbMenuAction') && crm.includes("item('top'"));
ok('desktop composer mounts the full body-map picker inline', crm.includes("bodyMapPicker.mountInline('pb-composer-host'") && crm.includes('function pbEnsureComposer') && crm.includes("root.classList.add('bm-builder-inline')"));
ok('composer gets the add-to-day callback', crm.includes('.mountInline(\'pb-composer-host\', _pb.exerciseCache, function (pickedEx)') && crm.includes('pbAddExercise(pickedEx.id)'));
ok('center editor is compact, composer takes the remaining width', crm.includes('.pb-center { flex: 0 0 360px; }') && crm.includes('.pb-right { flex: 1 1 auto;') && crm.includes('@container bmPicker (min-width: 1040px)'));
ok('phone muscle tree stacks the icon and readable group name', crm.includes('.picker-tree-col .bm-group-header {') && crm.includes('flex-direction: column;') && crm.includes('.picker-tree-col .bm-group-header > .flex-1'));
ok('new workspace labels follow EN/RU/HE', crm.includes('const PB_L =') && crm.includes('function pbT(key, vars)') && crm.includes('muscleSplit:'));
ok('phone builder skips the hidden side library render', crm.includes('if (window.innerWidth >= 1280) pbEnsureComposer()'));

ok('day preview is wide on desktop', crm.includes('lg:max-w-[min(96vw,1024px)] xl:max-w-[min(96vw,1440px)]') && crm.includes('.dp-grid {'));
ok('day preview has day chips and a summary side panel', crm.includes('id="program-day-preview-days"') && crm.includes('data-preview-day') && crm.includes('dp-side-card') && crm.includes("pbT('muscleSplit')"));
ok('exercise picker widens on ultrawide screens', crm.includes('min-[1900px]:max-w-[min(96vw,1720px)]') && crm.includes('min-[2200px]:max-w-[min(94vw,2100px)]'));
ok('exercise picker shows the body map from 1280px', crm.includes('@media (max-width: 1279px)') && crm.includes('.picker-map-col { display: none !important; }'));

/* c229: portion units + nutrient comparison */
ok('portion units exist with piece/pack/glass/tbsp/tsp/handful/can', crm.includes("const DK_UNIT_ORDER = ['serving','piece','pack','package','glass','tbsp','tsp','handful','can']") && crm.includes("handful: { en: 'handful'") && crm.includes("can:     { en: 'can'"));
ok('food detail edit form stores unit weights', crm.includes('name="unit_piece"') && crm.includes('name="unit_handful"') && crm.includes('name="unit_can"') && crm.includes('units: Object.values(unitMap)'));
ok('portion modal converts quantity × unit to grams', crm.includes('id="food-portion-qty"') && crm.includes('id="food-portion-unit"') && crm.includes('const syncUnitGrams') && crm.includes('u.grams * q'));
ok('products tab has a comparison tab', crm.includes('data-nutrition-tab="compare"') && crm.includes('id="cmp-root"') && crm.includes('const nutritionCompare'));
ok('comparison ranks per 1 g / 10 g / 100 g / 100 kcal', crm.includes("if (_basis === '10g') return 10") && crm.includes("_basis === '100kcal'") && crm.includes("seg('basis'"));
ok('comparison has a usefulness score with penalties', crm.includes('function scoreOf(f)') && crm.includes('saturated_fat) || 0) / 22') && crm.includes('n.sugars) || 0) / 50'));
ok('implausible imported values are ignored in rankings', crm.includes('const PLAUSIBLE_MAX = {') && crm.includes('function plausible(key, value)') && crm.includes('if (kcal < 20) return 0;'));
ok('products can be compared side by side', crm.includes('function compareRows()') && crm.includes('data-cmp-toggle') && crm.includes("cmpT('compareTitle')"));
ok('client portal has portion units and a compare button', (function () {
  const p = read('server/public/portal-full.html');
  return p.includes('function cpFoodUnits') && p.includes("piece:   { en: 'piece'") && p.includes('id="btn-portal-compare"') && p.includes('const CP_NUTRIENTS');
})());

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
