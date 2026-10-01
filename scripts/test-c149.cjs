/* c149 unit + static test — the generator comes back (modal + nutrition fields + AI panel).
   Unit part extracts the REAL BMR/target math out of fitness-crm.html (brace-balanced
   scanner); static part pins the restored HTML blocks and the new wiring. */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const trainer = fs.readFileSync(path.join(root, 'fitness-crm.html'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
let pass = 0, fail = 0;
function ok(name, cond) { if (cond) { pass++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name); } }
function eq(name, got, want) { const g = JSON.stringify(got), w = JSON.stringify(want); if (g === w) { pass++; console.log('PASS ' + name + ' = ' + g); } else { fail++; console.log('FAIL ' + name + ' got ' + g + ' want ' + w); } }
const count = (s, n) => s.split(n).length - 1;

function extractFn(src, name) {
  const start = src.indexOf('function ' + name + '(');
  if (start < 0) throw new Error('function not found: ' + name);
  let depth = 0, i = src.indexOf('{', start);
  let inStr = null, inLine = false, inBlock = false, esc = false;
  for (; i < src.length; i++) {
    const c = src[i], n = src[i + 1];
    if (inLine) { if (c === '\n') inLine = false; continue; }
    if (inBlock) { if (c === '*' && n === '/') { inBlock = false; i++; } continue; }
    if (inStr) { if (esc) { esc = false; continue; } if (c === '\\') { esc = true; continue; } if (c === inStr) inStr = null; continue; }
    if (c === '/' && n === '/') { inLine = true; i++; continue; }
    if (c === '/' && n === '*') { inBlock = true; i++; continue; }
    if (c === '"' || c === "'" || c === '`') { inStr = c; continue; }
    if (c === '{') depth++;
    else if (c === '}') { depth--; if (!depth) return src.slice(start, i + 1); }
  }
  throw new Error('unbalanced: ' + name);
}

/* ---------- UNIT: BMR + target calories (extracted from the real module) ---------- */
const src = [extractFn(trainer, 'calcBMR'), extractFn(trainer, 'calcTargetCalories')]
  .join('\n') + '\n;globalThis.__T149 = { calcBMR, calcTargetCalories };';
new Function(src)();
const T = globalThis.__T149;

eq('Mifflin male (80 kg/180 cm/30 y)', T.calcBMR({ weight: 80, height: 180, age: 30, sex: 'm' }), 1780);
eq('Mifflin female (−166 kcal)', T.calcBMR({ weight: 80, height: 180, age: 30, sex: 'f' }), 1614);
eq('missing sex defaults to male', T.calcBMR({ weight: 80, height: 180, age: 30 }), 1780);
eq('Katch-McArdle blend at 20% BF', T.calcBMR({ weight: 80, height: 180, age: 30, sex: 'm', body_fat_pct: 20 }), 1760);
eq('sane defaults without data', T.calcBMR({}), 1618);

eq('lose_weight −20%', T.calcTargetCalories(2000, 'lose_weight', {}), 1600);
eq('maintain ×1.0', T.calcTargetCalories(2000, 'maintain', {}), 2000);
eq('gain_muscle +10%', T.calcTargetCalories(2000, 'gain_muscle', {}), 2200);
eq('aggressive cut <8 weeks −25%', T.calcTargetCalories(2000, 'lose_weight', { goal_weeks: 6 }), 1500);
eq('high body fat extra −2%', T.calcTargetCalories(2000, 'lose_weight', { body_fat_pct: 32 }), 1560);
eq('calorie floor 800', T.calcTargetCalories(100, 'lose_weight', {}), 800);
eq('calorie ceiling 6000', T.calcTargetCalories(10000, 'gain_muscle', {}), 6000);

/* ---------- STATIC: restored generator modal ---------- */
ok('generator-modal exists exactly once', count(trainer, 'id="generator-modal"') === 1);
ok('modal skeleton (subtitle/close/loading/results)', trainer.indexOf('id="generator-subtitle"') >= 0 && trainer.indexOf('id="generator-close"') >= 0 && trainer.indexOf('id="generator-loading"') >= 0 && trainer.indexOf('id="generator-results"') >= 0);
ok('results targets renderResult expects', trainer.indexOf('id="generator-profile-summary"') >= 0 && trainer.indexOf('id="generator-rules"') >= 0 && trainer.indexOf('id="generator-split"') >= 0);
ok('selector .bg-surface.w-full present for questionnaire insert', trainer.indexOf('class="bg-surface w-full sm:max-w-xl') >= 0 && trainer.indexOf("modal.querySelector('.bg-surface.w-full')") >= 0);
ok('footer selector .p-3.border-t.border-border present', trainer.indexOf('class="p-3 border-t border-border flex gap-2"') >= 0 && trainer.indexOf("modal.querySelector('.p-3.border-t.border-border')") >= 0);
ok('static footer has Regenerate + Start', trainer.indexOf('id="generator-regenerate"') >= 0 && trainer.indexOf('id="generator-start"') >= 0);

/* ---------- STATIC: nutrition generate button ---------- */
ok('primary Generate button restored in the nutrition footer', trainer.indexOf('id="nutrition-generate"') >= 0 && trainer.indexOf("getElementById('nutrition-generate')") >= 0);
ok('footer order Cancel → Generate → AI Pro', (function () {
  const seg = trainer.slice(trainer.indexOf('id="nutrition-cancel"'), trainer.indexOf('id="nutrition-ai-generate"'));
  return seg.indexOf('id="nutrition-generate"') > 0;
})());

/* ---------- STATIC: questionnaire profile fields ---------- */
ok('sex radios n-sex with profile default', count(trainer, 'type="radio" name="n-sex"') === 2 && trainer.indexOf("client.sex === 'f' ? 'checked' : ''") >= 0);
ok('allergy chips n-allergy (6 values)', trainer.indexOf("['gluten','lactose','nuts','seafood','eggs','soy'].map") >= 0 && trainer.indexOf('name="n-allergy"') >= 0);
ok('liked/disliked inputs', trainer.indexOf('id="n-liked"') >= 0 && trainer.indexOf('id="n-disliked"') >= 0);
ok('applyProfileOverrides defined + used by BOTH generators', trainer.indexOf('async function applyProfileOverrides(client, q)') >= 0 && count(trainer, 'await applyProfileOverrides(client, q)') === 2);
ok('profile persisted back to the client card', trainer.indexOf("await db.put('clients', Object.assign({}, client, {") >= 0 && trainer.indexOf('last_active: Date.now()') >= 0);
ok('merged client passed to rule + AI generation', trainer.indexOf('generatePlan(profileClient, answers)') >= 0 && trainer.indexOf('llmGeneratePlan(profileClient, answers)') >= 0);
ok('merged client used by applyGenerated (rule + AI + fallback)', count(trainer, 'applyGenerated(profileClient, ') === 3);

/* ---------- STATIC: client card Nutrition Profile ---------- */
ok('client form sex radios', count(trainer, 'name="sex" value="') === 2 && trainer.indexOf("form.elements.sex.value = c.sex === 'f' ? 'f' : 'm'") >= 0);
ok('client form has all 6 allergy checkboxes', count(trainer, 'name="allergies" value="') === 6);
ok('client form liked/disliked foods inputs', trainer.indexOf('name="liked_foods"') >= 0 && trainer.indexOf('name="disliked_foods"') >= 0);
ok('client form nutrition selects (cuisine/budget/cook/stress/sleep)', trainer.indexOf('name="cuisine_pref"') >= 0 && trainer.indexOf('name="budget"') >= 0 && trainer.indexOf('name="cook_time"') >= 0 && trainer.indexOf('name="stress_level"') >= 0 && trainer.indexOf('name="sleep_quality"') >= 0);
ok('saveFromForm already collects allergies (fd.getAll)', trainer.indexOf("obj.allergies = fd.getAll('allergies')") >= 0);

/* ---------- STATIC: AI configuration panel ---------- */
ok('AI panel fields restored', trainer.indexOf('id="settings-ai-endpoint"') >= 0 && trainer.indexOf('id="settings-ai-key"') >= 0 && trainer.indexOf('id="settings-ai-model"') >= 0);
ok('AI panel buttons + status restored', trainer.indexOf('id="settings-ai-save"') >= 0 && trainer.indexOf('id="settings-ai-test"') >= 0 && trainer.indexOf('id="settings-ai-clear"') >= 0 && trainer.indexOf('id="settings-ai-status"') >= 0);
ok('AI wiring reads the same ids', trainer.indexOf("db.get('settings', 'ai_config')") >= 0 && trainer.indexOf('llmCall(') >= 0);

/* ---------- STATIC: i18n ×3 ---------- */
for (const lang of ['ru', 'en', 'he']) {
  let d = null;
  try { d = JSON.parse(fs.readFileSync(path.join(root, 'src', 'i18n', lang + '.json'), 'utf8')); } catch (e) {}
  ok(lang + '.json parses + client.sex/sexHint', !!(d && d.client && d.client.sex && d.client.sexHint));
  const need = ['aiConfig', 'aiConfigDesc', 'aiEndpoint', 'aiEndpointHint', 'aiKey', 'aiKeyHint', 'aiModel', 'aiModelHint', 'aiSave', 'aiTest', 'aiClear', 'nutritionProfile', 'foodAllergies', 'allergyGluten', 'allergyLactose', 'allergyNuts', 'allergySeafood', 'allergyEggs', 'allergySoy', 'likedFoods', 'dislikedFoods'];
  const missing = d ? need.filter(k => !(d.client && d.client[k]) && !(d.settings && d.settings[k])) : need;
  ok(lang + '.json has every restored label', missing.length === 0);
}

/* ---------- versions ---------- */
ok('sw cache at least v176', (function () { const m = sw.match(/CACHE_NAME = 'dk-gym-v(\d+)'/); return !!m && Number(m[1]) >= 176; })());
ok('RUNNING / dk-build at least c149', (function () {
  const r = trainer.match(/var RUNNING = (\d+)/), b = trainer.match(/content="c(\d+)"/);
  return !!r && !!b && Number(r[1]) >= 149 && Number(b[1]) >= 149;
})());

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
