/* c137 unit test — technique player fixes (auto-play, step tap, pause/resume)
   + the «В зал» → «Начать тренировку» rename. Static analysis of the REAL
   files; the module behaviour itself is covered by test-voice-coach.cjs. */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'client.html'), 'utf8');
const mod = fs.readFileSync(path.join(root, 'src', 'voice-coach.js'), 'utf8');
const trainer = fs.readFileSync(path.join(root, 'fitness-crm.html'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
let pass = 0, fail = 0;
function ok(name, cond) { if (cond) { pass++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name); } }
function count(s, needle) { return s.split(needle).length - 1; }

/* ---------- 1. module: auto + goto/pause/resume/reset ---------- */
ok('module version c137', mod.indexOf("var VERSION = 'c137'") >= 0);
ok('auto-continue with a breathing gap', mod.indexOf('STEP_GAP_MS = 800') >= 0 && mod.indexOf('st.idx = i + 1; sayStep(false);') >= 0);
ok('auto can be disabled per call', mod.indexOf('opts.auto === false') >= 0);
ok('pause keeps the position, cancels the pending timer', mod.indexOf('function stopSteps()') >= 0 && mod.indexOf('stepState._paused = true; clearTimeout(stepState._timer);') >= 0);
ok('onend respects pause (cancel must not advance)', mod.indexOf('if (stepState !== st || st._paused) return;') >= 0);
ok('resume from the paused position', mod.indexOf('function stepResume()') >= 0 && mod.indexOf('if (!stepState || stepState.finished) return stepStatus(); return sayStep(false);') >= 0);
ok('goto jumps to a step (finished reset)', mod.indexOf('function stepGoto(i)') >= 0 && mod.indexOf('stepState.finished = false;') >= 0);
ok('reset clears the player', mod.indexOf('function resetSteps()') >= 0 && mod.indexOf('stepState = null;') >= 0);
ok('status reports finished + keeps the index', mod.indexOf('finished: !!stepState.finished') >= 0);
ok('startIndex supported', mod.indexOf('opts.startIndex') >= 0);
ok('api exports stepGoto/stepResume/resetSteps', mod.indexOf('stepGoto: stepGoto') >= 0 && mod.indexOf('stepResume: stepResume') >= 0 && mod.indexOf('resetSteps: resetSteps') >= 0);

/* ---------- 2. portal: player behaviour ---------- */
ok('voiceStepsStart takes startIndex + key', html.indexOf('function voiceStepsStart(name, steps, startIndex, key)') >= 0);
ok('auto + gap wired (800ms)', html.indexOf('auto: true, gapMs: 800, startIndex: startIndex || 0,') >= 0);
ok('intro skipped on a jump start', html.indexOf('if (name && !startIndex) voiceSay(') >= 0);
ok('playing key tracked', html.indexOf('let voiceTechPlayingKey = null;') >= 0 && html.indexOf('voiceTechPlayingKey = (key != null) ? String(key) : null;') >= 0);
ok('▶ resumes paused playback instead of restarting', html.indexOf('if (st.active && !st.finished && voiceTechPlayingKey === String(cached.key)) { window.dkVoiceCoach.stepResume(); return; }') >= 0);
ok('technique steps are tappable buttons', html.indexOf('data-tech-step="${i}"') >= 0 && html.indexOf('voice-step-item') >= 0);
ok('step tap handler wired (delegated)', html.indexOf("const b = e.target.closest('[data-tech-step]');") >= 0 && html.indexOf('voiceTechStepTap(+b.getAttribute(\'data-tech-step\'))') >= 0);
ok('step tap: goto when active, else start from it', html.indexOf('window.dkVoiceCoach.stepGoto(i);') >= 0 && html.indexOf('voiceStepsStart(cached.name, cached.steps, i, cached.key);') >= 0);
ok('active step highlighted + scrolled', html.indexOf("b.classList.toggle('voice-step-active'") >= 0 && html.indexOf("a.scrollIntoView({ block: 'nearest' })") >= 0);
ok('CSS for step items + active state', html.indexOf('.voice-step-item {') >= 0 && html.indexOf('.voice-step-active {') >= 0);
ok('stop button keeps the counter (pause)', html.indexOf('window.dkVoiceCoach.stopSteps(); } catch(e135) {} renderVoiceBarStep(window.dkVoiceCoach.stepStatus().index, window.dkVoiceCoach.stepStatus().total);') >= 0);
ok('closing the modal resets the player + key', html.indexOf('dkVoiceCoach.resetSteps(); } catch (e135) {}') >= 0 && html.indexOf('voiceTechPlayingKey = null;') >= 0);
ok('onDone keeps the last position visible', html.indexOf('onDone: function () { const st = window.dkVoiceCoach.stepStatus(); renderVoiceBarStep(st.index, st.total); }') >= 0);

/* ---------- 3. rename: «В зал» → «Начать тренировку» ---------- */
ok('RU start button renamed', html.indexOf("startBtn:'Начать тренировку'") >= 0);
ok('EN start button renamed', html.indexOf("startBtn:'Start workout'") >= 0);
ok('HE start button renamed', html.indexOf("startBtn:'התחל אימון'") >= 0);
ok('RU hint follows the new name', html.indexOf('«Начать тренировку»') >= 0);
ok('EN hint follows the new name', html.indexOf('"Start workout" to fill in your sets') >= 0);
ok('HE hint follows the new name', html.indexOf('"התחל אימון" כדי למלא את הסטים') >= 0);
ok('no «В зал» leftovers in the portal', html.indexOf('В зал') === -1);
ok('no «(кг)»-style regression in startHint', count(html, 'startHint:') === 3);

/* ---------- 4. versions ---------- */
ok('sw cache at least v164', (function () { const m = sw.match(/CACHE_NAME = 'dk-gym-v(\d+)'/); return !!m && Number(m[1]) >= 164; })());
ok('RUNNING / dk-build at least c137', (function () {
  const r = trainer.match(/var RUNNING = (\d+)/), b = trainer.match(/content="c(\d+)"/);
  return !!r && !!b && Number(r[1]) >= 137 && Number(b[1]) >= 137;
})());

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
