const fs = require('fs');
const db = JSON.parse(fs.readFileSync('exercise-db.json', 'utf8'));

const GROUP_ALIASES = {
  abdominals: 'abdominals', abs: 'abdominals', core: 'abdominals', obliques: 'abdominals',
  'rectus abdominis': 'abdominals', 'transverse abdominis': 'abdominals',
  legs: 'legs', quadriceps: 'legs', quads: 'legs', hamstrings: 'legs', glutes: 'legs',
  'gluteus maximus': 'legs', 'gluteus medius': 'legs', calves: 'legs', calf: 'legs',
  adductors: 'legs', abductors: 'legs', 'hip flexors': 'legs', 'hip_flexors': 'legs',
  chest: 'chest', pecs: 'chest', 'pectorals': 'chest', 'serratus anterior': 'chest',
  back: 'back', lats: 'back', 'middle back': 'back', 'lower back': 'back',
  traps: 'back', trapezius: 'back', rhomboids: 'back', 'rear delts': 'shoulders',
  shoulders: 'shoulders', delts: 'shoulders', deltoids: 'shoulders',
  'rear deltoids': 'shoulders', 'rear deltoid': 'shoulders', 'rotator cuff': 'shoulders',
  biceps: 'elbow_flexors', brachialis: 'elbow_flexors', brachioradialis: 'elbow_flexors',
  'elbow flexors': 'elbow_flexors', triceps: 'triceps', forearms: 'forearms', grip: 'forearms'
};
const canon = s => GROUP_ALIASES[String(s || '').trim().toLowerCase()] || '';

const RULES = [
  { group: 'abdominals', re: /\b(abdominal|abs?|crunch|sit[\s-]?up|leg raise|knee raise|toes? to bar|v[\s-]?up|hollow|plank|dead bug|russian twist|side bend|heel touch|mountain climber|dragon flag|l[\s-]?sit|hanging|reverse crunch|bicycle|scissor|flutter kick|wood chop|pallof)\b/i },
  { group: 'abdominals', re: /\b(hip thrust|glute bridge)\b/i, onlyIf: /\b(abdominal|abs?)\b/i },
  { group: 'legs', re: /\b(squat|deadlift|hip thrust|glute bridge|lunge|leg press|calf raise|leg extension|leg curl|hip abduction|hip adduction|step[\s-]?up|hack squat|good morning|hip hinge|sumo|romanian)\b/i },
  { group: 'chest', re: /\b(push[\s-]?up|bench press|chest press|chest fly|pec deck|cable crossover|dip)\b/i },
  { group: 'back', re: /\b(row|pulldown|pull[\s-]?down|pull[\s-]?up|chin[\s-]?up|lat pull|hyperextension|back extension|face pull)\b/i },
  { group: 'shoulders', re: /\b(overhead press|shoulder press|military press|lateral raise|front raise|rear delt|reverse fly|upright row|arnold press|handstand press|pike push)\b/i },
  { group: 'elbow_flexors', re: /\b(biceps? curl|hammer curl|preacher curl|concentration curl|drag curl|spider curl)\b/i },
  { group: 'triceps', re: /\b(triceps|skull crusher|pushdown|kickback|close[\s-]?grip bench|diamond push)\b/i },
  { group: 'forearms', re: /\b(wrist curl|wrist extension|reverse curl|farmers? carry|farmer carry|grip)\b/i }
];

function inferredGroups(r) {
  const name = [r.nE, r.nR, r.nH].filter(Boolean).join(' ').toLowerCase();
  const out = [];
  for (const rule of RULES) {
    if (!rule.re.test(name)) continue;
    if (rule.onlyIf && !rule.onlyIf.test(name)) continue;
    out.push(rule.group);
  }
  return [...new Set(out)];
}

function subCanon(r) {
  const s = String(r.sE || r.s || '').trim().toLowerCase();
  if (!s) return '';
  if (/upper|lower|middle|general/.test(s)) {
    // ambiguous; use the primary group
    return canon(r.gE || r.g) || '';
  }
  return canon(s);
}

const candidates = [];
for (const r of db) {
  const g = canon(r.gE || r.g);
  if (!g || ['fullbody', 'cardio', 'stretching', 'warmup', 'balance', 'calisthenics'].includes(g)) continue;
  const inf = inferredGroups(r);
  if (!inf.length) continue;
  const syn = (r.synergists || []).map(canon).filter(Boolean);
  const reasons = [];
  let score = 0;

  // Strong inversion: the name says abs/legs but the DB says the other group.
  if (inf.length && !inf.includes(g)) {
    // Only flag when a specific strong rule contradicts the primary.
    score += 3;
    reasons.push('name implies ' + inf.join('/') + ' but primary is ' + g);
  }
  // The inferred target is listed as a synergist -> role inversion.
  for (const x of inf) {
    if (x !== g && syn.includes(x)) {
      score += 2;
      reasons.push('inferred target ' + x + ' is in synergists');
    }
  }
  // Subgroup belongs to a different group than the primary.
  const sc = subCanon(r);
  if (sc && sc !== g && !(g === 'legs' && sc === 'legs')) {
    score += 2;
    reasons.push('subgroup ' + (r.sE || r.s) + ' belongs to ' + sc + ' but primary is ' + g);
  }
  // Abdominal-specific names are almost never leg primary unless explicitly "hip thrust".
  if (/\b(abdominal|abs?|crunch|sit[\s-]?up|leg raise|knee raise|toes? to bar|v[\s-]?up|plank|dead bug|russian twist|side bend|heel touch)\b/i.test(String(r.nE || ''))) {
    if (g !== 'abdominals') { score += 2; reasons.push('abdominal name but primary is ' + g); }
  }
  // Hip thrust with "abdominal" in the name: abs is the stated target.
  if (/\b(abdominal|abs?)\b/i.test(String(r.nE || '')) && /\bhip thrust\b/i.test(String(r.nE || ''))) {
    if (g !== 'abdominals') { score += 3; reasons.push('abdominal hip thrust should be abdominals'); }
  }

  if (score >= 3) candidates.push({ score, id: r.id, src: r.src, g, gE: r.gE, s: r.s, sE: r.sE, nE: r.nE, nR: r.nR, syn: r.synergists, inf, reasons });
}

candidates.sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
console.log('candidates', candidates.length);
for (const c of candidates.slice(0, 120)) console.log(JSON.stringify(c));

// Exact target
const target = db.find(r => /weighted abdominal hip thrust/i.test(String(r.nE || '')));
console.log('\nTARGET:', JSON.stringify(target && { id: target.id, g: target.g, gE: target.gE, s: target.s, sE: target.sE, nE: target.nE, nR: target.nR, syn: target.synergists, mt: target.mt, e: target.e, i: target.i }, null, 2));
