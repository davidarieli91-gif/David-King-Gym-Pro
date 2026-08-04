// DK Gym — Phase 5.2: restore real MM frames + remap PG/MM images
const fs = require('fs');
const path = require('path');
const PROD_DB = process.env.PROD_DB || '/tmp/prod/david-king-gym-main/exercise-db.json';
const report = [];
const log = (m) => { console.log('[P5.2]', m); report.push(m); };

const prod = JSON.parse(fs.readFileSync(PROD_DB, 'utf8'));
const cur = JSON.parse(fs.readFileSync('exercise-db.json', 'utf8'));
const prodById = {};
for (const x of prod) prodById[x.id] = x;

const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

// indexes of available animations
const mmGifByName = {};
const bfGifByName = {};
for (const x of prod) {
  if (x.src === 'mm' && Array.isArray(x.i) && x.i.length) {
    const f = path.basename(x.i[0]);
    if (/_0\.jpg$/.test(f)) {
      const base = f.replace(/_0\.jpg$/, '');
      const gif = 'images/gif/' + base + '.gif';
      if (fs.existsSync(gif)) mmGifByName[norm(x.nE)] = gif;
    }
  }
  if (x.src === 'bf' && Array.isArray(x.i) && x.i.length && /\.gif$/i.test(x.i[0])) {
    if (fs.existsSync(x.i[0])) bfGifByName[norm(x.nE)] = x.i[0];
  }
}

let mmRestored = 0, pgMM = 0, pgBF = 0;
const unmatched = [];
for (const x of cur) {
  if (x.src === 'mm') {
    const p = prodById[x.id];
    if (p && Array.isArray(p.i) && p.i.length && p.i.every((f) => fs.existsSync(f))) {
      x.i = p.i; mmRestored++;
    } else {
      const g = mmGifByName[norm(x.nE)];
      if (g) { x.i = [g]; mmRestored++; }
    }
  } else if (x.src === 'pg') {
    const key = norm(x.nE);
    if (mmGifByName[key]) { x.i = [mmGifByName[key]]; pgMM++; }
    else if (bfGifByName[key]) { x.i = [bfGifByName[key]]; pgBF++; }
    else unmatched.push(x.id + ' | ' + x.nE);
  }
}
fs.writeFileSync('exercise-db.json', JSON.stringify(cur));
log('MM restored: ' + mmRestored);
log('PG matched via MM gif: ' + pgMM);
log('PG matched via BF gif: ' + pgBF);
log('PG unmatched (AI layer queue): ' + unmatched.length);

fs.mkdirSync('reports', { recursive: true });
fs.writeFileSync('reports/phase5-2-report.md',
  '# Phase 5.2 Report\n\n**Generated:** ' + new Date().toISOString() + '\n\n' +
  report.map(r => '- ' + r).join('\n') +
  '\n\n## Unmatched PG (AI layer queue)\n' + unmatched.map(u => '- ' + u).join('\n') + '\n');
console.log('=== PHASE 5.2 COMPLETE ===');
