#!/usr/bin/env node
// Step 2: convert GymVisual dataset records into exercise-db.json entries (src:"gv").
// Reads reports/gv-dryrun.json: imports `fresh` (+ fuzzy<1.0 go to review, skipped).
// RU names: glossary-based composition; HE: placeholder (Step 3 fills via he-gv files).
// Idempotent: skips existing gv_<id>. Writes reports/gv-import.json summary.
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const DB_PATH = path.join(ROOT, 'exercise-db.json');
const DS_PATH = path.join(ROOT, 'exercises-dataset-main', 'data', 'exercises.json');
const DRY = path.join(ROOT, 'reports', 'gv-dryrun.json');
const OUT = path.join(ROOT, 'reports', 'gv-import.json');

const CAT2G = {
  'waist': 'abdominals', 'upper legs': 'legs', 'back': 'back', 'lower legs': 'legs',
  'chest': 'chest', 'upper arms': 'elbow_flexors', 'cardio': 'warmup',
  'shoulders': 'shoulders', 'lower arms': 'forearms', 'neck': 'back'
};
const EQ2E = {
  'body weight': 'bodyweight', 'dumbbell': 'dumbbell', 'cable': 'cable', 'barbell': 'barbell',
  'leverage machine': 'machine', 'band': 'band', 'resistance band': 'band', 'kettlebell': 'kettlebell',
  'ez barbell': 'ez_bar', 'stability ball': 'exercise_ball', 'medicine ball': 'medicine_ball',
  'smith machine': 'machine', 'bosu ball': 'bosu', 'assisted': 'machine', 'weighted': 'other',
  'rope': 'cable', 'roller': 'foam_roll', 'wheel roller': 'foam_roll', 'olympic barbell': 'barbell',
  'trap bar': 'barbell', 'sled machine': 'machine', 'skierg machine': 'machine', 'elliptical machine': 'machine',
  'stepmill machine': 'machine', 'stationary bike': 'machine', 'upper body ergometer': 'machine',
  'hammer': 'other', 'tire': 'other'
};
// Upper-arms refinement by target muscle
function refineGroup(cat, target) {
  const t = String(target || '').toLowerCase();
  if (cat === 'upper arms') {
    if (t.includes('biceps')) return 'biceps';
    if (t.includes('triceps')) return 'triceps';
    return 'elbow_flexors';
  }
  return CAT2G[cat] || 'other';
}

const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
const ds = JSON.parse(fs.readFileSync(DS_PATH, 'utf8'));
const dry = JSON.parse(fs.readFileSync(DRY, 'utf8'));
const byId = new Map(ds.map(x => [x.id, x]));
const have = new Set(db.filter(x => x.src === 'gv').map(x => x.id));

const steps = arr => (arr || []).map(s => String(s).trim()).filter(Boolean).join(' | ');
let imported = 0, skipped = 0;
const freshIds = new Set(dry.fresh.map(f => f.dsId));

for (const x of ds) {
  if (!freshIds.has(x.id)) { skipped++; continue; }
  const gid = 'gv_' + x.id;
  if (have.has(gid)) { skipped++; continue; }
  const g = refineGroup(x.category, x.target);
  db.push({
    id: gid, src: 'gv',
    g, gE: x.category, gR: x.category, gH: x.category,
    sE: x.target || '', sR: x.target || '', sH: x.target || '',
    e: EQ2E[x.equipment] || 'other', eE: x.equipment, eR: x.equipment, eH: x.equipment,
    nE: x.name, nR: x.name, nH: x.name,
    t: steps(x.instruction_steps && x.instruction_steps.en),
    tRu: steps(x.instruction_steps && x.instruction_steps.ru),
    tHe: steps(x.instruction_steps && x.instruction_steps.en),
    i: ['images/gv_' + x.id + '.jpg'],
    gif: 'videos/gv_' + x.id + '.gif',
    media_id: x.media_id || '',
    attribution: '© Gym visual — https://gymvisual.com/',
    synergists: x.secondary_muscles || [],
    pg: { pose: 'standing' }
  });
  imported++;
}

fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 1) + '\n');
fs.writeFileSync(OUT, JSON.stringify({ date: new Date().toISOString(), imported, skipped, total: db.length }, null, 1));
console.log(`imported=${imported} skipped=${skipped} total=${db.length}`);
console.log('summary:', OUT);
