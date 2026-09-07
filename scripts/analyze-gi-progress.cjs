#!/usr/bin/env node
// Analyzes GI translation progress: which sentences remain untranslated (RU/HE).
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

const sentences = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts', 'gi-sentences.json'), 'utf8'));
console.log('unique sentences total:', sentences.length);

function buildTM(which) {
  const TM = new Map();
  const files = fs.readdirSync(path.join(ROOT, 'scripts'))
    .filter(f => new RegExp(`^${which}-gi-desc-\\d+\\.json$`).test(f))
    .sort((a, b) => parseInt(a.match(/\d+/)[0]) - parseInt(b.match(/\d+/)[0]));
  for (const f of files) {
    const b = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts', f), 'utf8'));
    for (const [idx, tr] of Object.entries(b)) if (tr && String(tr).trim()) TM.set(parseInt(idx, 10), String(tr).trim());
  }
  return { TM, files: files.length };
}

const db = JSON.parse(fs.readFileSync(path.join(ROOT, 'exercise-db.json'), 'utf8'));
const gi = db.filter(x => x.src === 'gi');

const usage = new Map();
for (const x of gi) {
  const parts = String(x.t || '').split('|').map(s => s.trim()).filter(Boolean);
  for (const p of parts) usage.set(p, (usage.get(p) || 0) + 1);
}

for (const which of ['ru', 'he']) {
  const { TM, files } = buildTM(which);
  let trSent = 0, unSent = 0;
  const unList = [];
  sentences.forEach((s, i) => {
    if (TM.has(i)) trSent++;
    else { unSent++; unList.push([s.en, usage.get(s.en) || 0, i]); }
  });
  unList.sort((a, b) => b[1] - a[1]);
  console.log(`--- ${which.toUpperCase()}: batches=${files.length} translated=${trSent} untranslated=${unSent}`);
  console.log('top untranslated by usage:');
  unList.slice(0, 8).forEach(([s, n, i]) => console.log('  ' + n + 'x idx=' + i + '  ' + s.slice(0, 90)));
}

// Exercises completion status
const { TM: ruTM } = buildTM('ru');
const { TM: heTM } = buildTM('he');
let ruFull = 0, ruPart = 0, ruNone = 0, heFull = 0, hePart = 0, heNone = 0, bothFull = 0;
for (const x of gi) {
  const parts = String(x.t || '').split('|').map(s => s.trim()).filter(Boolean);
  const idxOf = s => { const e = sentences.find(q => q.en === s); return e ? e.n !== undefined ? sentences.indexOf(e) : -1 : -1; };
  // faster: map en->idx
  break;
}
// build en->idx map once
const enIdx = new Map();
sentences.forEach((s, i) => { if (!enIdx.has(s.en)) enIdx.set(s.en, i); });
for (const x of gi) {
  const parts = String(x.t || '').split('|').map(s => s.trim()).filter(Boolean);
  const ruHit = parts.filter(s => enIdx.has(s) && ruTM.has(enIdx.get(s))).length;
  const heHit = parts.filter(s => enIdx.has(s) && heTM.has(enIdx.get(s))).length;
  if (ruHit === parts.length) ruFull++; else if (ruHit > 0) ruPart++; else ruNone++;
  if (heHit === parts.length) heFull++; else if (heHit > 0) hePart++; else heNone++;
  if (ruHit === parts.length && heHit === parts.length) bothFull++;
}
console.log(`exercises: RU full=${ruFull} part=${ruPart} none=${ruNone} | HE full=${heFull} part=${hePart} none=${heNone} | both full=${bothFull}`);
