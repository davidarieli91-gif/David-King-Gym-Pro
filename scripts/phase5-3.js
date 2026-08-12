// DK Gym — Phase 5.3: map custom illustrations to remaining image gaps (re-runnable)
const fs = require('fs');
const ex = JSON.parse(fs.readFileSync('exercise-db.json', 'utf8'));
const report = [];
const log = (m) => { console.log('[P5.3]', m); report.push(m); };

// Order matters: most specific first
const RULES = [
  [/face pull/, ['images/custom/face_pull.png']],
  [/lateral raise|side raise/, ['images/custom/lateral_raise.png']],
  [/pec deck|butterfly|chest fly|cable fly|fly machine/, ['images/custom/chest_fly.png']],
  [/leg extension|knee extension/, ['images/custom/leg_extension.png']],
  [/calf/, ['images/custom/calf_raise.png']],
  [/plank/, ['images/custom/plank.png']],
  [/pushdown|push-down|pressdown/, ['images/custom/cable_pushdown.png']],
  [/shoulder press|machine press|press machine/, ['images/custom/machine_shoulder_press.png']],
  [/seated row|cable row|machine row|rowing machine|low row/, ['images/custom/seated_row.png']],
  [/bench press|chest press/, ['images/custom/bench_press.png']],
  [/pulldown|pull-down|pull up|pull-up|chin up|chin-up/, ['images/custom/lat_pulldown.png']],
];

let assigned = 0, curlAssigned = 0;
const perRule = {};
const unmatched = [];

for (const x of ex) {
  if (x.src === 'bf') continue;
  if (Array.isArray(x.i) && x.i.length) continue;
  const name = (x.nE || '').toLowerCase();
  let done = false;

  for (const [re, cands] of RULES) {
    if (!re.test(name)) continue;
    for (const p of cands) {
      if (fs.existsSync(p)) {
        x.i = [p]; x.img_src = 'custom-illustration';
        assigned++; perRule[p] = (perRule[p] || 0) + 1;
        done = true; break;
      }
    }
    if (done) break;
  }

  // bicep curls (skip wrist curls — they have their own Burnfit GIF)
  if (!done && /curl|bicep/.test(name) && !/wrist/.test(name) && fs.existsSync('images/custom/bicep_curl.png')) {
    x.i = ['images/custom/bicep_curl.png']; x.img_src = 'custom-illustration';
    assigned++; curlAssigned++;
    perRule['images/custom/bicep_curl.png'] = (perRule['images/custom/bicep_curl.png'] || 0) + 1;
    done = true;
  }

  if (!done) unmatched.push(x.id + ' (' + (x.nE || '') + ')');
}

fs.writeFileSync('exercise-db.json', JSON.stringify(ex));
log('Custom illustrations assigned: ' + assigned);
log('Still without image: ' + unmatched.length);
log('Unmatched sample: ' + unmatched.slice(0, 40).join(', '));
for (const [p, c] of Object.entries(perRule).sort((a, b) => b[1] - a[1])) log(c + 'x -> ' + p);

fs.mkdirSync('reports', { recursive: true });
fs.writeFileSync('reports/phase5-3-report.md', '# Phase 5.3 Report\n\n**Generated:** ' + new Date().toISOString() + '\n\n' + report.map(r => '- ' + r).join('\n') + '\n');
console.log('=== PHASE 5.3 COMPLETE ===');
