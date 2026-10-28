/* c194 RepDB Free — separate fourth exercise source.
   Validates the generated dataset, its media, and the UI/seed wiring. */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const rdb = JSON.parse(fs.readFileSync(path.join(root, 'exercise-db-rdb.json'), 'utf8'));
const legacy = JSON.parse(fs.readFileSync(path.join(root, 'exercise-db.json'), 'utf8'));
const crm = fs.readFileSync(path.join(root, 'fitness-crm.html'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
const copy = fs.readFileSync(path.join(root, 'scripts', 'copy-assets.js'), 'utf8');
let pass = 0, fail = 0;
function ok(name, cond) { cond ? pass++ : fail++; console.log((cond ? 'PASS ' : 'FAIL ') + name); }
function has(s, x) { return s.indexOf(x) >= 0; }

ok('RepDB has exactly 650 exercises', rdb.length === 650);
ok('all RepDB ids prefixed', rdb.every(e => /^rdb_/.test(e.id)));
ok('RepDB ids unique', new Set(rdb.map(e => e.id)).size === rdb.length);
const legacyIds = new Set(legacy.map(e => e.id));
ok('RepDB ids do not collide with existing bases', rdb.every(e => !legacyIds.has(e.id)));
ok('source tag is rdb', rdb.every(e => e.src === 'rdb'));
ok('all records have names', rdb.every(e => e.nE && e.nR && e.nH));
ok('all RU names translated', rdb.every(e => e.nR && e.nR !== e.nE));
ok('all HE names translated', rdb.every(e => e.nH && e.nH !== e.nE));
ok('all records have technique', rdb.every(e => e.t && e.t.length > 20));
ok('all RU techniques translated', rdb.every(e => e.tRu && e.tRu !== e.t));
ok('all HE techniques translated', rdb.every(e => e.tHe && e.tHe !== e.t));
ok('all records have at least one image', rdb.every(e => Array.isArray(e.i) && e.i.length >= 1));
ok('all image files exist', rdb.every(e => e.i.every(p => fs.existsSync(path.join(root, p)))));
ok('two-pose exercises crossfade', rdb.filter(e => e.i.length >= 2).length >= 450);
ok('single-image holds remain valid', rdb.filter(e => e.i.length === 1).length > 0);
ok('197 bodyweight records', rdb.filter(e => e.e === 'bodyweight').length === 197);
ok('25 pull-up-bar records', rdb.filter(e => e.e === 'pull_up_bar').length === 25);
ok('3 dip-station records', rdb.filter(e => e.e === 'dip_station').length === 3);
ok('9 rings records', rdb.filter(e => e.e === 'rings').length === 9);
ok('attribution present', rdb.every(e => e.attribution === 'Exercise data by RepDB (repdb.co)'));
ok('source URL present', rdb.every(e => /^https:\/\/exercise-dataset\.com\/exercise\//.test(e.source_url)));

ok('trainer has RepDB tab', has(crm, 'id="bm-tab-rdb"'));
ok('trainer has RepDB source key', has(crm, 'sourceRepDB'));
ok('trainer fetches separate JSON', has(crm, "fetch('exercise-db-rdb.json"));
ok('trainer unpacks separate JSON', has(crm, 'EXERCISE_DB_RDB_RAW'));
ok('trainer seeds RepDB separately', has(crm, 'seedRepDBBase'));
ok('seed syncs translation/subgroup/equipment fields into existing RepDB rows', crm.includes("'name_ru', 'name_he', 'technique_ru', 'technique_he'") && crm.includes("'subgroup_en', 'subgroup_ru', 'subgroup_he'") && crm.includes("'equipment_type', 'equipment_en', 'equipment_ru'") && crm.includes("if (updates.length) await db.bulkPut('exercise_base', updates);"));
ok('trainer maps source repdb', has(crm, "e.src === 'rdb' ? 'repdb'"));
ok('trainer filters source repdb', has(crm, "_sourceFilter = 'repdb'"));
ok('trainer tree has RepDB root', has(crm, "repdb: { name: 'repdb'"));
ok('trainer badge is RDB', has(crm, "'RDB'"));
ok('trainer cache refresh before picker', /async function openPicker\(\)/.test(crm) && /await loadExerciseCache\(\)/.test(crm));
ok('RepDB equipment labels are real UTF-8', crm.includes("ru: 'Брусья'") && crm.includes("ru: 'Кольца'") && crm.includes("ru: 'Турник'"));
ok('no corrupted question-mark equipment labels', !/ru:'\?{3,}'/.test(crm) && !/ru: '\?{3,}'/.test(crm));
ok('exercise media slot no longer shrinks to a small square', crm.includes('#exercise-gif-slot { width: 100%; max-height: none !important; }'));
ok('exercise media slot has a hard full-width inline fallback', crm.includes('style="width:100%;max-height:none;aspect-ratio:1/1"'));
ok('mobile media column is explicitly full width', crm.includes('#exercise-view:not(.em2col) > .em-media'));
ok('modal media child stretches instead of shrinking in grid centering', crm.includes('#exercise-gif-slot { display: flex !important; flex-direction: column; align-items: stretch; justify-content: center; }') && crm.includes('#exercise-gif-slot > .ex-anim-container'));
ok('login build label is current', crm.includes('3 languages · c207'));

for (const lang of ['en', 'ru', 'he']) {
  const d = JSON.parse(fs.readFileSync(path.join(root, 'src', 'i18n', lang + '.json'), 'utf8'));
  ok('i18n ' + lang + ' RepDB label', d.exercise && d.exercise.sourceRepDB === 'RepDB');
}
ok('copy-assets ships RepDB JSON', has(copy, "'exercise-db-rdb.json'"));
ok('SW precaches RepDB JSON', has(sw, "'./exercise-db-rdb.json'"));
ok('trainer build c207', has(crm, 'name="dk-build" content="c207"'));
ok('SW cache v234', has(sw, "CACHE_NAME = 'dk-gym-v234'"));

console.log('\n' + pass + ' passed, ' + fail + ' failed');
if (fail) process.exitCode = 1;
