const fs = require('fs');
const db = JSON.parse(fs.readFileSync('exercise-db.json', 'utf8'));
const words = {
  taz: '\u0442\u0430\u0437\u043e\u0432',      // тазов
  tal: '\u0442\u0430\u043b\u043e\u0432',      // талов
  press: '\u043f\u0440\u0435\u0441\u0441',    // пресс
  abs: '\u043f\u0440\u0435\u0441\u0441'
};
const needles = [words.taz, words.tal, words.press];
const hits = db.filter(r => {
  const hay = [r.nR, r.nE, r.nH, r.tRu, r.t].filter(Boolean).join(' ').toLowerCase();
  return needles.some(w => hay.includes(w));
});
console.log('hits', hits.length);
for (const r of hits.slice(0, 80)) {
  console.log(JSON.stringify({
    id: r.id, src: r.src, g: r.g, gE: r.gE, s: r.s, sE: r.sE,
    nE: r.nE, nR: r.nR, syn: r.synergists, mt: r.mt, e: r.e,
    i: r.i, gif: r.gif
  }));
}
