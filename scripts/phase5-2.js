// DK Gym — Phase 5.2: map Burnfit animations + custom illustrations to pg/mm exercises
const fs = require('fs');
const ex = JSON.parse(fs.readFileSync('exercise-db.json', 'utf8'));
const report = [];
const log = (m) => { console.log('[P5.2]', m); report.push(m); };

// Order matters: specific patterns first
const RULES = [
  [/wrist/, ['images/bf_DB_WRIST_CURL.gif']],
  [/bench press|chest press/, ['images/custom/bench_press.png']],
  [/pulldown|pull-up|pull up|pullup|chin-up|chin up/, ['images/custom/lat_pulldown.png']],
  [/curl|bicep/, ['images/custom/bicep_curl.png']],
  [/sumo/, ['images/bf_BB_SM_SQT.gif']],
  [/romanian|stiff/, ['images/bf_BB_DL.gif']],
  [/deadlift/, ['images/bf_BB_DL.gif', 'images/bf_KB_DL.gif']],
  [/goblet/, ['images/bf_KB_SM_DL.gif']],
  [/squat/, ['images/bf_BW_OH_SQT.gif', 'images/bf_BB_SM_SQT.gif']],
  [/lunge|split squat|step-up|step up/, ['images/bf_LUNGE.gif']],
  [/crunch/, ['images/bf_CRUNCH.gif']],
  [/sit-up|sit up|situp/, ['images/bf_SIT_UP.gif']],
  [/dip/, ['images/bf_BENCH_DIPS.gif']],
  [/hyperextension|back extension|good morning/, ['images/bf_HPET.gif']],
  [/hip thrust|glute bridge/, ['images/bf_GLUTE_BRDG.gif']],
  [/leg curl|hamstring curl|nordic/, ['images/bf_NOR_HAM_CURL.gif']],
  [/leg press/, ['images/bf_SL_LEG_PRESS.gif']],
  [/shoulder press|overhead press|military|push press/, ['images/bf_SEAT_DB_SHD_PRESS.gif']],
  [/skull|tricep|pushdown|push-down/, ['images/bf_SKULL_CRUSH.gif']],
  [/reverse fly|rear delt|lateral raise|flye|fly/, ['images/bf_CABLE_REV_FLY.gif', 'images/bf_DB_DEC_FLY.gif']],
  [/row/, ['images/bf_INVT_ROW.gif']],
  [/push-up|push up|pushup/, ['images/bf_PIKE_PUSH_UP.gif']],
  [/mountain climber|bicycle|air bike/, ['images/bf_ABS_AIR_BIKE.gif']],
  [/clean/, ['images/bf_HANG_CLEAN.gif']],
  [/snatch/, ['images/bf_BB_SNATCH_BAL.gif']],
  [/swing/, ['images/bf_KB_SM_DL.gif']],
  [/thruster/, ['images/bf_THRUSTER.gif']],
  [/wall ?ball/, ['images/bf_WB_SHOT.gif']],
  [/treadmill|running|jog|sprint/, ['images/bf_TREADMIL-1.gif', 'images/bf_RUNNING.gif']],
  [/cycl|spin|bike/, ['images/bf_CYCLE.gif']],
  [/elliptical/, ['images/bf_ELLIP_MC.gif']],
  [/stair|stepmill|climb/, ['images/bf_CLIMB_STAIRS.gif', 'images/bf_STEPMILL_MAC.gif']],
  [/swim/, ['images/bf_수영.gif']],
  [/yoga|stretch/, ['images/bf_요가.gif']],
  [/box|kick|punch/, ['images/bf_킥복싱.gif']],
  [/walk/, ['images/bf_WALKING.gif']],
  [/ab coaster/, ['images/bf_복근-코스터-머신.gif']],
  [/glute kickback|monster glute/, ['images/bf_MON_GLUTE_MC.gif']]
];

let assigned = 0;
const perRule = {};
const unmatched = [];
for (const x of ex) {
  if (x.src === 'bf') continue;
  if (Array.isArray(x.i) && x.i.length) continue;
  const name = (x.nE || '').toLowerCase();
  let done = false;
  for (const [re, candidates] of RULES) {
    if (!re.test(name)) continue;
    for (const p of candidates) {
      if (fs.existsSync(p)) {
        x.i = [p];
        x.img_src = p.indexOf('custom') !== -1 ? 'custom-illustration' : 'mapped-burnfit';
        assigned++;
        perRule[p] = (perRule[p] || 0) + 1;
        done = true;
        break;
      }
    }
    if (done) break;
  }
  if (!done) unmatched.push(x.id);
}
fs.writeFileSync('exercise-db.json', JSON.stringify(ex));
log('Images assigned: ' + assigned + ' of ' + (assigned + unmatched.length));
log('Unmatched: ' + unmatched.length);
log('Unmatched sample: ' + unmatched.slice(0, 30).join(', '));
for (const [p, c] of Object.entries(perRule).sort((a, b) => b[1] - a[1])) log(c + 'x -> ' + p);

fs.mkdirSync('reports', { recursive: true });
fs.writeFileSync('reports/phase5-2-report.md', '# Phase 5.2 Report\n\n**Generated:** ' + new Date().toISOString() + '\n\n' + report.map(r => '- ' + r).join('\n') + '\n');
console.log('=== PHASE 5.2 COMPLETE ===');
