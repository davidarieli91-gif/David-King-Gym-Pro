#!/usr/bin/env node
/* ============================================================================
 * fix-c91.cjs — rest seconds survive every path + analytics muscle i18n
 *
 * BUG 1 (user report): «секунды отдыха, даже когда я меняю, сохраняю, потом
 * открываю в работу, сбрасываются на 90 секунд».
 * Root cause chain — rest_sec is DROPPED while rebuilding exercise objects:
 *   a) startWorkoutFromProgram() prefill (program day → live workout) had no
 *      rest_sec → startFromProgram's `ex.rest_sec || 90` always yielded 90;
 *   b) openProgramEditor() re-open dropped rest_sec (plus cardio flag,
 *      superset flag, set type/time/dist) — editing + saving baked 90 INTO
 *      the stored program, which the client portal then also shows;
 *   c) saveProgramAsTemplate() / startFromTemplate() / applyTemplateToClient()
 *      dropped rest_sec on every template hop;
 *   d) finish() history record had no rest_sec → «Повторить» (reuseAsWorkout)
 *      always restarted at 90.
 *   Additionally every reader used `|| 90`, so a legit 0-second rest flipped
 *   back to 90 — all readers are now `!= null`-safe.
 *
 * BUG 2 (user report): «аналитика показывает мышцы только на русском языке».
 * renderVolume() echoed the raw ex.group string that was frozen (localized
 * snapshot) at program-build time, so a program built in RU showed Russian
 * muscle names («Ноги», «Грудь», «Разгибатели локтя»…) even in a Hebrew UI.
 * Fix: aggregate by CANONICAL group (exercise-cache group_canonical → reverse
 * map over any legacy stored variant id/EN/RU/HE, incl. old «Трицепс»/«Пресс»)
 * and localize at display time from one 3-language dictionary. Bonus: records
 * built under different UI languages now merge into ONE bar per muscle.
 *
 * Versions: meta dk-build c90→c91, login footer c90→c91, RUNNING 90→91,
 * sw dk-gym-v117→v118 (+history line).
 * ==========================================================================*/
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const FILE = path.join(ROOT, 'fitness-crm.html');
const CLIENT = path.join(ROOT, 'client.html');
const SW = path.join(ROOT, 'sw.js');
let html = fs.readFileSync(FILE, 'utf8');
let clientHtml = fs.readFileSync(CLIENT, 'utf8');
let sw = fs.readFileSync(SW, 'utf8');
const fails = [];
let patched = 0;

function repOnce(name, anchor, replacement) {
  const idx = html.indexOf(anchor);
  if (idx === -1) { fails.push(`[${name}] anchor NOT FOUND`); return; }
  if (html.indexOf(anchor, idx + 1) !== -1) { fails.push(`[${name}] anchor NOT UNIQUE`); return; }
  html = html.slice(0, idx) + replacement + html.slice(idx + anchor.length);
  patched++;
  console.log(`OK  ${name}`);
}

function repOnceClient(name, anchor, replacement) {
  const idx = clientHtml.indexOf(anchor);
  if (idx === -1) { fails.push(`[${name}] anchor NOT FOUND (client)`); return; }
  if (clientHtml.indexOf(anchor, idx + 1) !== -1) { fails.push(`[${name}] anchor NOT UNIQUE (client)`); return; }
  clientHtml = clientHtml.slice(0, idx) + replacement + clientHtml.slice(idx + anchor.length);
  patched++;
  console.log(`OK  ${name} (client)`);
}

function repOnceSw(name, anchor, replacement) {
  const idx = sw.indexOf(anchor);
  if (idx === -1) { fails.push(`[${name}] anchor NOT FOUND (sw)`); return; }
  if (sw.indexOf(anchor, idx + 1) !== -1) { fails.push(`[${name}] anchor NOT UNIQUE (sw)`); return; }
  sw = sw.slice(0, idx) + replacement + sw.slice(idx + anchor.length);
  patched++;
  console.log(`OK  ${name} (sw)`);
}

/* ============================================================
 * BUG 1 — rest_sec chain
 * ============================================================ */

// 1a. startWorkoutFromProgram prefill: carry rest_sec + set type
repOnce('1a sWFP prefill rest+type', [
  '            group: ex.group,',
  '            cardio: ex.cardio === true,',
  '            sets: (ex.sets || []).map(s => ({',
  '              weight: s.weight || null,',
  '              reps: s.reps || null,',
  '              time: s.time != null ? s.time : null,',
  '              dist: s.dist != null ? s.dist : null,',
  '              rpe: s.rpe || null,',
  '              done: false',
  '            }))'
].join('\n'), [
  '            group: ex.group,',
  '            cardio: ex.cardio === true,',
  '            rest_sec: ex.rest_sec != null ? ex.rest_sec : 90,',
  '            sets: (ex.sets || []).map(s => ({',
  '              weight: s.weight || null,',
  '              reps: s.reps || null,',
  '              time: s.time != null ? s.time : null,',
  '              dist: s.dist != null ? s.dist : null,',
  '              rpe: s.rpe || null,',
  '              type: s.type || \'normal\',',
  '              done: false',
  '            }))'
].join('\n'));

// 1b. startFromProgram: 0-safe rest reader (0 used to flip to 90)
repOnce('1b startFromProgram 0-safe', [
  '          rest_sec: ex.rest_sec || 90',
  '        })),',
  '        started_at: Date.now()'
].join('\n'), [
  '          rest_sec: ex.rest_sec != null ? ex.rest_sec : 90',
  '        })),',
  '        started_at: Date.now()'
].join('\n'));

// 1c. reuseAsWorkout («Повторить»): 0-safe rest reader
repOnce('1c reuseAsWorkout 0-safe', [
  '            rpe: s.rpe || null,',
  '            type: s.type || \'normal\',',
  '            done: false',
  '          })),',
  '          rest_sec: ex.rest_sec || 90',
  '        }))'
].join('\n'), [
  '            rpe: s.rpe || null,',
  '            type: s.type || \'normal\',',
  '            done: false',
  '          })),',
  '          rest_sec: ex.rest_sec != null ? ex.rest_sec : 90',
  '        }))'
].join('\n'));

// 1d. finish(): store cardio + rest_sec in the history record
repOnce('1d finish record cardio+rest', [
  '          group: ex.group,',
  '          muscle_group: ex.group,'
].join('\n'), [
  '          group: ex.group,',
  '          muscle_group: ex.group,',
  '          cardio: ex.cardio === true,',
  '          rest_sec: ex.rest_sec != null ? ex.rest_sec : 90,'
].join('\n'));

// 1e. openProgramEditor: preserve rest_sec/cardio/superset + set type/time/dist
repOnce('1e editor preserve', [
  '          exercises: (d.exercises || []).map(ex => ({',
  '            exercise_id: ex.exercise_id,',
  '            name: ex.name,',
  '            group: ex.group,',
  '            sets: (ex.sets || []).map(s => ({ weight: s.weight, reps: s.reps, rpe: s.rpe }))',
  '          }))',
  '        })),',
  '        editId: programId'
].join('\n'), [
  '          exercises: (d.exercises || []).map(ex => ({',
  '            exercise_id: ex.exercise_id,',
  '            name: ex.name,',
  '            group: ex.group,',
  '            cardio: ex.cardio === true,',
  '            is_superset: ex.is_superset || false,',
  '            rest_sec: ex.rest_sec != null ? ex.rest_sec : 90,',
  '            sets: (ex.sets || []).map(s => ({ weight: s.weight, reps: s.reps, rpe: s.rpe, type: s.type || \'normal\', time: s.time != null ? s.time : null, dist: s.dist != null ? s.dist : null }))',
  '          }))',
  '        })),',
  '        editId: programId'
].join('\n'));

// 1f. saveProgramAsTemplate: preserve the same fields
repOnce('1f template save preserve', [
  '          exercises: (d.exercises || []).map(ex => ({',
  '            exercise_id: ex.exercise_id,',
  '            name: ex.name,',
  '            group: ex.group,',
  '            sets: (ex.sets || []).map(s => ({ weight: s.weight, reps: s.reps, rpe: s.rpe }))',
  '          }))',
  '        })),',
  '        created_at: Date.now(),'
].join('\n'), [
  '          exercises: (d.exercises || []).map(ex => ({',
  '            exercise_id: ex.exercise_id,',
  '            name: ex.name,',
  '            group: ex.group,',
  '            cardio: ex.cardio === true,',
  '            is_superset: ex.is_superset || false,',
  '            rest_sec: ex.rest_sec != null ? ex.rest_sec : 90,',
  '            sets: (ex.sets || []).map(s => ({ weight: s.weight, reps: s.reps, rpe: s.rpe, type: s.type || \'normal\', time: s.time != null ? s.time : null, dist: s.dist != null ? s.dist : null }))',
  '          }))',
  '        })),',
  '        created_at: Date.now(),'
].join('\n'));

// 1g. startFromTemplate: carry rest_sec into the live workout
repOnce('1g startFromTemplate rest', [
  '        name: tpl.name || \'\',',
  '        client_id: \'\',',
  '        exercises: (tpl.exercises || []).map(ex => ({',
  '          exercise_id: ex.exercise_id,',
  '          name: ex.name,',
  '          group: ex.group,',
  '          cardio: ex.cardio === true || ex.category === \'cardio\','
].join('\n'), [
  '        name: tpl.name || \'\',',
  '        client_id: \'\',',
  '        exercises: (tpl.exercises || []).map(ex => ({',
  '          exercise_id: ex.exercise_id,',
  '          name: ex.name,',
  '          group: ex.group,',
  '          cardio: ex.cardio === true || ex.category === \'cardio\',',
  '          rest_sec: ex.rest_sec != null ? ex.rest_sec : 90,'
].join('\n'));

// 1h. applyTemplateToClient: carry rest_sec into the live workout
repOnce('1h applyTemplateToClient rest', [
  '        name: tpl.name || \'\',',
  '        client_id: clientId,',
  '        exercises: (tpl.exercises || []).map(ex => ({',
  '          exercise_id: ex.exercise_id,',
  '          name: ex.name,',
  '          group: ex.group,',
  '          cardio: ex.cardio === true || ex.category === \'cardio\','
].join('\n'), [
  '        name: tpl.name || \'\',',
  '        client_id: clientId,',
  '        exercises: (tpl.exercises || []).map(ex => ({',
  '          exercise_id: ex.exercise_id,',
  '          name: ex.name,',
  '          group: ex.group,',
  '          cardio: ex.cardio === true || ex.category === \'cardio\',',
  '          rest_sec: ex.rest_sec != null ? ex.rest_sec : 90,'
].join('\n'));

// 1i. program builder rest input: display 0 as 0 (was 90)
repOnce('1i builder rest display 0-safe',
  'value="${ex.rest_sec || 90}" data-pb-rest="${ei}"',
  'value="${ex.rest_sec != null ? ex.rest_sec : 90}" data-pb-rest="${ei}"');

// 1j. live workout rest input: display 0 as 0
repOnce('1j live rest display 0-safe',
  'value="${ex.rest_sec || 90}" data-exercise-rest="${idx}"',
  'value="${ex.rest_sec != null ? ex.rest_sec : 90}" data-exercise-rest="${idx}"');

// 1k. live workout rest handler: 0 stays 0
repOnce('1k live rest handler 0-safe',
  '            _workout.exercises[exIdx].rest_sec = parseInt(input.value, 10) || 90;',
  '            const rv = parseInt(input.value, 10);\n            _workout.exercises[exIdx].rest_sec = (!isNaN(rv) && rv >= 0 && rv <= 600) ? rv : 90;');

// 1l. rest timer on set-done: 0-safe
repOnce('1l restTimer set-done 0-safe',
  '              const restSec = ex.rest_sec || 90;',
  '              const restSec = ex.rest_sec != null ? ex.rest_sec : 90;');

// 1m. rest timer on «Сделал всё»: 0-safe
repOnce('1m restTimer done-all 0-safe',
  '          restTimer.start(ex.rest_sec || 90);',
  '          restTimer.start(ex.rest_sec != null ? ex.rest_sec : 90);');

// 1n. draft migration: don't overwrite a stored 0
repOnce('1n draft migration 0-safe',
  '            if (!ex.rest_sec) ex.rest_sec = 90;',
  '            if (ex.rest_sec == null) ex.rest_sec = 90;');

// 1o. client portal: session builder kept `parseInt(...) || 90` — same 0-flip
repOnceClient('1o portal session rest 0-safe',
  '        rest_sec: parseInt(ex.rest_sec,10) || 90,',
  '        rest_sec: (function(){ const rv = parseInt(ex.rest_sec,10); return (!isNaN(rv) && rv >= 0) ? rv : 90; })(),');

/* ============================================================
 * BUG 2 — analytics muscle-group i18n
 * ============================================================ */

// 2a. dictionary + helpers before renderVolume
repOnce('2a muscle i18n dictionary', [
  '    /** Render volume per muscle group (placeholder until Phase 3 logs data). */',
  '    function renderVolume(workouts) {'
].join('\n'), [
  '    /* c91: muscle-group i18n — the «התפלגות שרירים» panel used to echo the',
  '       group string frozen in the workout record (build-time UI language),',
  '       so a program built in Russian showed Russian muscle names even in a',
  '       Hebrew UI. One canonical key per group + 3-language labels + reverse',
  '       lookup for every legacy stored variant (id / EN / RU / HE, incl. old',
  '       «Трицепс»/«Пресс» naming). Unknown strings pass through untouched. */',
  '    const DK_MUSCLE_GROUP_I18N = {',
  '      abdominals:    { en: \'Abdominals\',    ru: \'Мышцы кора\',        he: \'שרירי ליבה\' },',
  '      back:          { en: \'Back\',          ru: \'Спина\',             he: \'גב\' },',
  '      chest:         { en: \'Chest\',         ru: \'Грудь\',             he: \'חזה\' },',
  '      elbow_flexors: { en: \'Elbow Flexors\', ru: \'Сгибатели локтя\',   he: \'כופפי מרפק\' },',
  '      forearms:      { en: \'Forearms\',      ru: \'Предплечья\',        he: \'אמות\' },',
  '      fullbody:      { en: \'Full Body\',     ru: \'Всё тело\',          he: \'כל הגוף\' },',
  '      legs:          { en: \'Legs\',          ru: \'Ноги\',              he: \'רגליים\' },',
  '      shoulders:     { en: \'Shoulders\',     ru: \'Плечи\',             he: \'כתפיים\' },',
  '      stretching:    { en: \'Stretching\',    ru: \'Растяжка\',          he: \'מתיחות\' },',
  '      triceps:       { en: \'Triceps\',       ru: \'Разгибатели локтя\', he: \'פושטי מרפק\' },',
  '      warmup:        { en: \'Warmup\',        ru: \'Разминка\',          he: \'חימום\' }',
  '    };',
  '    const DK_MG_REVERSE = (function () {',
  '      const map = {};',
  '      Object.keys(DK_MUSCLE_GROUP_I18N).forEach(key => {',
  '        const lbl = DK_MUSCLE_GROUP_I18N[key];',
  '        map[key] = key;',
  '        [\'en\', \'ru\', \'he\'].forEach(l => { map[String(lbl[l]).toLowerCase()] = key; });',
  '      });',
  '      // legacy / alias names',
  '      map[\'abs\'] = \'abdominals\'; map[\'пресс\'] = \'abdominals\'; map[\'core\'] = \'abdominals\';',
  '      map[\'трицепс\'] = \'triceps\'; map[\'бицепс\'] = \'elbow_flexors\'; map[\'biceps\'] = \'elbow_flexors\';',
  '      map[\'все тело\'] = \'fullbody\'; map[\'leg\'] = \'legs\'; map[\'shoulder\'] = \'shoulders\';',
  '      map[\'forearm\'] = \'forearms\'; map[\'warm up\'] = \'warmup\';',
  '      return map;',
  '    })();',
  '    /** Any stored group variant (canonical id / EN / RU / HE) → canonical key. */',
  '    function dkMuscleGroupKey(name) {',
  '      if (!name) return \'\';',
  '      return DK_MG_REVERSE[String(name).trim().toLowerCase()] || \'\';',
  '    }',
  '    /** Canonical group key → label in the current UI language (fallback: input). */',
  '    function dkLocalizeMuscleGroup(key) {',
  '      const lang = (typeof currentLang === \'function\') ? currentLang() : \'en\';',
  '      const lbl = DK_MUSCLE_GROUP_I18N[String(key || \'\').trim().toLowerCase()];',
  '      if (!lbl) return key || \'\';',
  '      return lbl[lang] || lbl.en;',
  '    }',
  '    /** Render volume per muscle group (placeholder until Phase 3 logs data). */',
  '    function renderVolume(workouts) {'
].join('\n'));

// 2b. aggregate by canonical key (merge cross-language duplicates)
repOnce('2b canonical aggregation', [
  '      // Aggregate by muscle group from workout.exercises[].muscle_group',
  '      const groupVolumes = new Map();',
  '      workouts.forEach(w => {',
  '        const exercises = w.exercises || [];',
  '        exercises.forEach(ex => {',
  '          const group = ex.muscle_group || ex.group || \'Unknown\';'
].join('\n'), [
  '      // Aggregate by muscle group from workout.exercises[].muscle_group',
  '      // c91: group strings were frozen in the build-time UI language —',
  '      // aggregate by CANONICAL key (cache group_canonical → reverse map) so',
  '      // records built under different UI languages merge into one bar.',
  '      const groupVolumes = new Map();',
  '      workouts.forEach(w => {',
  '        const exercises = w.exercises || [];',
  '        exercises.forEach(ex => {',
  '          const rawGroup = ex.muscle_group || ex.group || \'\';',
  '          const cachedEx = (ex.exercise_id && typeof lookupExerciseGlobal === \'function\') ? lookupExerciseGlobal(ex.exercise_id) : null;',
  '          const group = (cachedEx && cachedEx.group_canonical) || dkMuscleGroupKey(rawGroup) || rawGroup || \'Unknown\';'
].join('\n'));

// 2c. localized display
repOnce('2c localized display', [
  '              <span class="font-semibold">${escapeHTML(group)}</span>',
  '              <span class="font-mono text-muted">${fmtNumber(v)} kg·reps</span>'
].join('\n'), [
  '              <span class="font-semibold">${escapeHTML(dkLocalizeMuscleGroup(group))}</span>',
  '              <span class="font-mono text-muted">${fmtNumber(v)} kg·reps</span>'
].join('\n'));

/* ============================================================
 * Versions — c90 → c91, sw v117 → v118
 * ============================================================ */

repOnce('v meta', '<meta name="dk-build" content="c90" />', '<meta name="dk-build" content="c91" />');
repOnce('v footer', '3 languages · c90</p>', '3 languages · c91</p>');
repOnce('v RUNNING',
  'var RUNNING = 90; /* numeric part of dk-build c90 */',
  'var RUNNING = 91; /* numeric part of dk-build c91 */');

repOnceSw('v sw cache+history', [
  '// v117: c90 — previous working weights: the live workout\'s «Пред.» column now prefills from the LAST workout_history record of the selected client (weight×reps, cardio time×dist, + colored 1–10 effort badge — before it only chained set→set inside the current session, so the first set always showed «—»); orphan-history fallback for profiles restored under a new id; «Сделал всё» button marks every set done (live + portal); last-workout effort badge in the portal Prev cell (findPrev now returns rpe/time/dist); time/dist/type finally SAVED to workout_history in both apps (cardio history was silently dropped); recover.html re-links workout/nutrition history rows from the pre-restore client id',
  'const CACHE_NAME = \'dk-gym-v117\';'
].join('\n'), [
  '// v118: c91 — rest seconds finally survive every path: program day → live workout (startWorkoutFromProgram dropped rest_sec, always fell back to 90), program editor re-open (openProgramEditor dropped rest_sec/cardio/superset/set types — re-saving baked 90 into the stored program, which the portal then also showed), template save/start/apply, history reuse (finish() didn\'t store rest_sec) — and every reader is 0-safe now (a stored 0 no longer flips to 90). Analytics «התפלגות שרירים» muscle names follow the UI language (RU/HE/EN) instead of echoing the build-time frozen string; records built under different languages merge by canonical group.',
  '// v117: c90 — previous working weights: the live workout\'s «Пред.» column now prefills from the LAST workout_history record of the selected client (weight×reps, cardio time×dist, + colored 1–10 effort badge — before it only chained set→set inside the current session, so the first set always showed «—»); orphan-history fallback for profiles restored under a new id; «Сделал всё» button marks every set done (live + portal); last-workout effort badge in the portal Prev cell (findPrev now returns rpe/time/dist); time/dist/type finally SAVED to workout_history in both apps (cardio history was silently dropped); recover.html re-links workout/nutrition history rows from the pre-restore client id',
  'const CACHE_NAME = \'dk-gym-v118\';'
].join('\n'));

/* ============================================================
 * Report + write
 * ============================================================ */
if (fails.length) {
  console.error('\nFAILED PATCHES:');
  fails.forEach(f => console.error('  ' + f));
  process.exit(1);
}
fs.writeFileSync(FILE, html);
fs.writeFileSync(CLIENT, clientHtml);
fs.writeFileSync(SW, sw);
console.log(`\nPatched ${patched} anchors — fitness-crm.html, client.html, sw.js written.`);
