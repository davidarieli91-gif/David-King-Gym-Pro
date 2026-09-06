#!/usr/bin/env node
// GI synergists: split comma-joined source strings, drop non-muscles, dedupe.
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const DB_PATH = path.join(ROOT, 'exercise-db.json');

const DROP = new Set(['cardiovascular system', 'feet', 'hands', 'ankles', 'ankle stabilizers', 'sternocleidomastoid']);
// canonical target per key (mirrors SYNERGIST_CANONICAL + GI anatomical additions)
const CANON = (() => {
  const m = {
    chest: ['chest', 'upper chest', 'upper_chest', 'pectorals', 'pec', 'pecs', 'serratus anterior',
      'pectoralis major sternal head', 'pectoralis major clavicular head'],
    back: ['back', 'lats', 'lat', 'latissimus dorsi', 'middle back', 'middle_back', 'lower back', 'lower_back',
      'upper back', 'upper_back', 'trapezius', 'traps', 'trapezius upper fibers', 'trapezius middle fibers',
      'trapezius lower fibers', 'rhomboids', 'teres minor', 'teres major', 'infraspinatus', 'subscapularis',
      'levator scapulae', 'levator_scapulae', 'spinal erectors', 'spinal_erectors', 'spine', 'splenius',
      'quadratus lumborum', 'quadratus_lumborum', 'rotator cuff', 'rotator_cuff', 'erector spinae',
      'trapezius upper fibers', 'trapezius middle fibers', 'trapezius lower fibers'],
    shoulders: ['shoulders', 'deltoids', 'delts', 'delt', 'deltoid anterior', 'deltoid lateral', 'deltoid posterior',
      'front deltoids', 'front_deltoids', 'front delts', 'front_delts', 'front shoulders',
      'rear deltoids', 'rear_deltoids', 'rear delts', 'rear_delts', 'rear shoulders', 'rear_delt'],
    elbow_flexors: ['biceps', 'biceps brachii', 'brachialis', 'brachioradialis', 'elbow flexors', 'elbow_flexors', 'arms'],
    triceps: ['triceps', 'triceps brachii', 'anconeus'],
    forearms: ['forearms', 'forearm', 'grip', 'wrists', 'wrist extensors', 'wrist flexors'],
    abdominals: ['abdominals', 'abs', 'core', 'obliques', 'rectus abdominis', 'rectus_abdominis',
      'transverse abdominus', 'transverse abdominis', 'upper_abs', 'upper abs'],
    legs: ['legs', 'quadriceps', 'quads', 'hamstrings', 'glutes', 'gluteus maximus', 'gluteus medius',
      'gluteus minimus', 'calves', 'calf', 'adductors', 'abductors', 'adductor magnus', 'adductor longus',
      'adductor brevis', 'gastrocnemius', 'soleus', 'hip flexors', 'hip_flexors', 'hip abductors', 'hips',
      'iliopsoas', 'shins', 'tibialis anterior', 'groin', 'inner thighs', 'gracilis', 'pectineous',
      'pectineus',       'sartorius', 'tensor fasciae latae', 'deep hip external rotators'],
  };
  const rev = {};
  Object.entries(m).forEach(([c, ks]) => ks.forEach(k => { rev[k] = c; }));
  return rev;
})();
const canonOf = s => CANON[String(s).trim().toLowerCase()] || null;

const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
let touched = 0, dropped = 0, unmapped = {};
db.filter(x => x.src === 'gi').forEach(x => {
  const target = canonOf(x.g) || x.g;
  const seen = new Set(), out = [];
  (x.synergists || []).forEach(s => {
    String(s).split(',').forEach(part => {
      const key = part.trim().replace(/\s+/g, ' ');
      if (!key) return;
      const lk = key.toLowerCase();
      if (DROP.has(lk)) { dropped++; return; }
      const c = canonOf(key);
      if (!c) { unmapped[lk] = (unmapped[lk] || 0) + 1; dropped++; return; }
      if (c === target) return;
      const dk = c + '|' + lk;
      if (seen.has(dk)) return;
      seen.add(dk);
      out.push(key);
    });
  });
  if (JSON.stringify(out) !== JSON.stringify(x.synergists)) { x.synergists = out; touched++; }
});
fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 1) + '\n');
console.log('touched:', touched, '| dropped parts:', dropped);
console.log('unmapped:', JSON.stringify(unmapped));
const empty = db.filter(x => x.src === 'gi' && (!x.synergists || !x.synergists.length));
console.log('gi empty synergists:', empty.length);
