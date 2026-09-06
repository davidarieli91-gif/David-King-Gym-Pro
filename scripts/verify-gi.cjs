#!/usr/bin/env node
// Validates gi records: image on disk, names, canonical group, clean synergists.
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const db = JSON.parse(fs.readFileSync(path.join(ROOT, 'exercise-db.json'), 'utf8'));
const GROUPS = new Set(['abdominals', 'shoulders', 'legs', 'back', 'chest', 'elbow_flexors',
  'triceps', 'forearms', 'warmup', 'fullbody', 'stretching', 'calisthenics']);
const gi = db.filter(x => x.src === 'gi');
let errs = [];
gi.forEach(x => {
  if (!x.nE) errs.push(x.id + ': missing nE');
  if (!GROUPS.has(x.g)) errs.push(x.id + ': bad group ' + x.g);
  (x.i || []).forEach(p => {
    if (!fs.existsSync(path.join(ROOT, p))) errs.push(x.id + ': missing file ' + p);
  });
  (x.synergists || []).forEach(s => {
    if (String(s).includes(',')) errs.push(x.id + ': un-split synergist: ' + s);
  });
  if (!x.t) errs.push(x.id + ': missing instructions');
});
console.log(`gi records: ${gi.length} | errors: ${errs.length}`);
errs.slice(0, 20).forEach(e => console.log(' ', e));
process.exit(errs.length ? 1 : 0);
