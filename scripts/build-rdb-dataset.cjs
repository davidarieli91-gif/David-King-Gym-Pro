#!/usr/bin/env node
/*
 * Build the RepDB Free source as a SEPARATE exercise database.
 *
 * Input (extracted RepDB free ZIP):
 *   %TEMP%/repdb-free/free.json
 *   %TEMP%/repdb-free/images/flat/*.webp
 *
 * Output:
 *   exercise-db-rdb.json          compact records for the app's unpacker
 *   images/rdb/*.webp             local copies of the 650 exercise images
 *
 * The source remains separate from exercise-db.json. IDs are prefixed rdb_.
 * Run: node scripts/build-rdb-dataset.cjs [path-to-extracted-repdb-free]
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const srcDir = path.resolve(process.argv[2] || path.join(process.env.TEMP || '', 'repdb-free'));
const sourceJson = path.join(srcDir, 'free.json');
const sourceImages = path.join(srcDir, 'images', 'flat');
const outJson = path.join(root, 'exercise-db-rdb.json');
const outImages = path.join(root, 'images', 'rdb');
const { EQUIPMENT_TAXONOMY, canonicalEquipment, legSubgroup } = require('./exercise-taxonomy.cjs');

if (!fs.existsSync(sourceJson)) {
  console.error('Missing RepDB free.json at ' + sourceJson);
  process.exit(1);
}

const repdb = JSON.parse(fs.readFileSync(sourceJson, 'utf8'));
const existing = JSON.parse(fs.readFileSync(path.join(root, 'exercise-db.json'), 'utf8'));

/* Existing group labels are the canonical 3-language labels used by the app. */
const groupLabels = {};
for (const e of existing) {
  if (e.g && !groupLabels[e.g]) groupLabels[e.g] = { en: e.gE || e.g, ru: e.gR || e.g, he: e.gH || e.g };
}
const fallbackGroups = {
  abdominals: { en: 'Abdominals', ru: 'Мышцы кора', he: 'בטן' },
  shoulders: { en: 'Shoulders', ru: 'Плечи', he: 'כתפיים' },
  legs: { en: 'Legs', ru: 'Ноги', he: 'רגליים' },
  back: { en: 'Back', ru: 'Спина', he: 'גב' },
  chest: { en: 'Chest', ru: 'Грудь', he: 'חזה' },
  elbow_flexors: { en: 'Elbow Flexors', ru: 'Сгибатели локтя', he: 'מכופפי מרפק' },
  triceps: { en: 'Triceps', ru: 'Разгибатели локтя', he: 'פושטי מרפק' },
  forearms: { en: 'Forearms', ru: 'Предплечья', he: 'אמות' },
  cardio: { en: 'Cardio', ru: 'Кардио', he: 'אירובי' },
  fullbody: { en: 'Full Body', ru: 'Всё тело', he: 'כל הגוף' },
  stretching: { en: 'Stretching', ru: 'Растяжка', he: 'מתיחות' },
  balance: { en: 'Stability & Balance', ru: 'Устойчивость и баланс', he: 'יציבות ואיזון' }
};
function groupLabel(g) {
  return groupLabels[g] || fallbackGroups[g] || { en: g, ru: g, he: g };
}

/* Equipment: use the shared canonical taxonomy (c195). Raw labels are
   aliases; name-based refinement separates categories the sources lumped
   into "other" (bar bands, battling ropes, suspension, rings, sticks...). */
function equipmentFor(key, nameEn, isBodyweight) {
  const canonical = canonicalEquipment(key, nameEn, isBodyweight);
  const t = EQUIPMENT_TAXONOMY[canonical] || EQUIPMENT_TAXONOMY.other;
  return [canonical, t.en, t.ru, t.he];
}

function muscleGroup(m) {
  const p = String(m || '').toLowerCase();
  if (/pectoralis|chest/.test(p)) return 'chest';
  if (/latissimus|rhomboid|trapezius|erector|lower_back|middle_back/.test(p)) return 'back';
  if (/deltoid|shoulder/.test(p)) return 'shoulders';
  if (/triceps/.test(p)) return 'triceps';
  if (/biceps|brachialis|brachioradialis/.test(p)) return 'elbow_flexors';
  if (/forearm|wrist/.test(p)) return 'forearms';
  if (/rectus|oblique|transverse|abdominal|core/.test(p)) return 'abdominals';
  if (/gluteus|quadriceps|hamstring|gastrocnemius|soleus|adductor|abductor|hip_flexor|tibialis/.test(p)) return 'legs';
  if (/cardio/.test(p)) return 'cardio';
  return null;
}

function primaryKey(x) {
  return String((x.primary_muscles && x.primary_muscles[0]) || '').toLowerCase();
}
function nameHas(x, re) { return re.test(String(x.name_en || '')); }

function groupFor(x) {
  if (x.category === 'cardio') return 'cardio';
  if (x.category === 'stretching') return 'stretching';
  const bp = String(x.body_part || '').toLowerCase();
  const p = primaryKey(x);
  if (bp === 'chest') return 'chest';
  if (bp === 'back') return 'back';
  if (bp === 'shoulders') return 'shoulders';
  if (bp === 'lower_arms') return 'forearms';
  if (bp === 'upper_arms') return /triceps/.test(p) ? 'triceps' : 'elbow_flexors';
  if (bp === 'core') return 'abdominals';
  if (bp === 'upper_legs' || bp === 'lower_legs') return 'legs';
  if (bp === 'full_body') return 'fullbody';
  return 'fullbody';
}

function subgroupFor(x) {
  const g = groupFor(x);
  const p = primaryKey(x);
  const n = String(x.name_en || '').toLowerCase();
  if (g === 'chest') {
    if (n.includes('incline')) return 'Upper';
    if (n.includes('decline') || n.includes('dip')) return 'Lower';
    return 'Middle';
  }
  if (g === 'back') {
    if (/erector|lower back|deadlift|good morning|back extension|superman/.test(p + ' ' + n)) return 'Lower Back';
    if (/trapezius/.test(p) || n.includes('shrug')) return 'Trapezius';
    if (/rhomboid/.test(p) || n.includes('row')) return 'Middle Back';
    return 'Lats';
  }
  if (g === 'shoulders') {
    if (/posterior/.test(p) || n.includes('rear') || n.includes('reverse fly') || n.includes('face pull')) return 'Rear';
    if (/anterior/.test(p) || (n.includes('front') && n.includes('raise'))) return 'Front';
    if (n.includes('shrug')) return 'Trapezius';
    return 'Middle';
  }
  if (g === 'legs') return legSubgroup(x.name_en, x.primary_muscles);
  if (g === 'abdominals') {
    if (/obliques/.test(p) || /twist|side bend|bicycle|russian/.test(n)) return 'Obliques';
    if (/hanging|leg raise|knee raise|reverse crunch/.test(n)) return 'Lower';
    return 'Upper';
  }
  if (g === 'elbow_flexors') {
    if (/brachialis/.test(p)) return 'Brachialis';
    if (/brachioradialis/.test(p)) return 'Brachioradialis';
    return 'Biceps';
  }
  if (g === 'triceps') {
    if (/overhead/.test(n)) return 'Seated';
    if (/lying|skull|french/.test(n)) return 'Lying';
    return 'Compound';
  }
  if (g === 'forearms') return 'Wrist Curls';
  return 'General';
}

/* Build an English-name lookup from the existing three bases for translation reuse. */
function normName(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\b(the|a|an|with|on|to|for|version|v)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
const oldByName = new Map();
for (const e of existing) {
  for (const nm of [e.nE, ...(e.synonyms || [])]) {
    const k = normName(nm);
    if (k && !oldByName.has(k) && (e.nR || e.nH)) oldByName.set(k, e);
  }
}
function translated(x) {
  const candidates = [x.name_en, ...(x.synonyms || [])];
  for (const nm of candidates) {
    const hit = oldByName.get(normName(nm));
    if (hit) return hit;
  }
  return null;
}

fs.mkdirSync(outImages, { recursive: true });
const records = [];
let copied = 0;
for (const x of repdb.exercises) {
  const images = [];
  for (const key of (x.images && x.images.flat) || []) {
    const file = `${x.id}-${key}.webp`;
    const src = path.join(sourceImages, file);
    if (!fs.existsSync(src)) {
      console.warn('missing image', file);
      continue;
    }
    const dst = path.join(outImages, file);
    if (!fs.existsSync(dst) || fs.statSync(dst).size !== fs.statSync(src).size) {
      fs.copyFileSync(src, dst);
      copied++;
    }
    images.push(`images/rdb/${file}`);
  }
  if (!images.length) console.warn('no images for', x.id);

  const g = groupFor(x);
  const gl = groupLabel(g);
  const sub = subgroupFor(x);
  const [eqKey, eqEn, eqRu, eqHe] = equipmentFor(x.equipment, x.name_en, x.is_bodyweight);
  const hit = translated(x);
  const stepsEn = [...(x.instructions_en || [])];
  if (x.tips_en && x.tips_en.length) stepsEn.push('Tip: ' + x.tips_en.join(' '));
  const techEn = stepsEn.join(' | ');
  const techRu = hit && hit.tRu ? hit.tRu : techEn;
  const techHe = hit && hit.tHe ? hit.tHe : techEn;

  records.push({
    id: 'rdb_' + x.id,
    src: 'rdb',
    g,
    gE: gl.en, gR: gl.ru, gH: gl.he,
    sE: sub, sR: sub, sH: sub,
    e: eqKey, eE: eqEn, eR: eqRu, eH: eqHe,
    nE: x.name_en,
    nR: hit && hit.nR ? hit.nR : x.name_en,
    nH: hit && hit.nH ? hit.nH : x.name_en,
    t: techEn,
    tRu: techRu,
    tHe: techHe,
    i: images,
    gif: '',
    attribution: 'Exercise data by RepDB (repdb.co)',
    source_url: `https://exercise-dataset.com/exercise/${x.id}/`,
    synergists: Array.from(new Set((x.secondary_muscles || []).map(muscleGroup).filter(Boolean)))
      .filter(sg => sg !== g),
    mt: x.mechanic || 'compound',
    s: sub,
    f: x.force_type === 'dynamic' ? null : x.force_type,
    lv: x.difficulty === 'advanced' ? 'expert' : x.difficulty,
    cat: x.category === 'olympic' ? 'olympic weightlifting' : x.category,
    is_bodyweight: !!x.is_bodyweight,
    met: x.met || null
  });
}

fs.writeFileSync(outJson, JSON.stringify(records, null, 0), 'utf8');
console.log(`RepDB: ${records.length} records, ${copied} images copied, ${fs.statSync(outJson).size} bytes JSON`);
console.log('Output: ' + path.relative(root, outJson));
console.log('Images: ' + path.relative(root, outImages));
