#!/usr/bin/env node
// Validator for GymVisual import: schema, Hebrew coverage, media files, mappings.
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const db = JSON.parse(fs.readFileSync(path.join(ROOT, 'exercise-db.json'), 'utf8'));
const gv = db.filter(x => x.src === 'gv');
const errs = [];
const GROUPS = new Set(['abdominals','legs','elbow_flexors','shoulders','chest','back','stretching','warmup','fullbody','calisthenics','triceps','forearms','biceps','back_ext','abs']);
gv.forEach(x => {
  if (x.sE || x.sR || x.sH) errs.push(x.id + ': subgroup fields must be empty (use synergists)');
  if (!x.nH || x.nH === x.nE) errs.push(x.id + ': nH missing/fallback');
  if (!x.tHe) errs.push(x.id + ': tHe missing');
  if (!GROUPS.has(x.g)) errs.push(x.id + ': bad group ' + x.g);
  if (!x.i || !x.i[0] || !fs.existsSync(path.join(ROOT, x.i[0]))) errs.push(x.id + ': jpg missing');
  if (!x.gif || !fs.existsSync(path.join(ROOT, x.gif))) errs.push(x.id + ': gif missing');
});
const heFallback = gv.filter(x => /[a-zA-Z]/.test(x.nH || '') && !/[א-ת]/.test(x.nH || '')).length;
console.log(`gv records: ${gv.length} | errors: ${errs.length} | nH without Hebrew chars: ${heFallback}`);
errs.slice(0, 20).forEach(e => console.log(' -', e));
process.exit(errs.length ? 1 : 0);
