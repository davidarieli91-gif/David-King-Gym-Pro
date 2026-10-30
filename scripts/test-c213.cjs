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
ok('SW cache v244', sw.includes("CACHE_NAME = 'dk-gym-v244'"));
ok('SW precaches server scripts', sw.includes("./src/server-mode.js") && sw.includes("./src/server-sync.js"));

ok('IndexedDB version 11', crm.includes('const DB_VERSION = 11;'));
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

ok('server migration exists', fs.existsSync(path.join(root, 'server', 'migrations', '001_init.sql')));
ok('server isolates records by tenant', read('server/migrations/001_init.sql').includes('record_rev_seq') && read('server/migrations/001_init.sql').includes('FORCE ROW LEVEL SECURITY'));
ok('director admin never reads tenant records', !read('server/src/routes/admin.ts').includes('FROM records'));
ok('portal response strips private client fields', read('server/src/routes/portal.ts').includes('PORTAL_CLIENT_FIELDS') && read('server/src/routes/portal.ts').includes('portalClient(resolved.client)'));
ok('portal page exists', fs.existsSync(path.join(root, 'server', 'public', 'portal.html')));
ok('director console exists', fs.existsSync(path.join(root, 'server', 'public', 'admin.html')));
ok('invite registration page exists', fs.existsSync(path.join(root, 'server', 'public', 'join.html')));
ok('docker image ships the frontend and public pages', read('server/Dockerfile').includes('COPY dist ./public-app') && read('server/Dockerfile').includes('COPY server/public ./public'));
ok('compose builds from the repository root', read('deploy/docker-compose.yml').includes('context: ..') && read('deploy/docker-compose.yml').includes('dockerfile: server/Dockerfile'));

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
