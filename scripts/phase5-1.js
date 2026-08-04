// DK Gym — Phase 5.1: exercise dedup + translations + runtime utilities
const fs = require('fs');
const report = [];
const log = (m) => { console.log('[P5]', m); report.push(m); };

// ---------- 1. Archive duplicate-name twins (keep best) ----------
const ex = JSON.parse(fs.readFileSync('exercise-db.json', 'utf8'));
function score(x) {
  let s = (Array.isArray(x.i) ? x.i.length : 0) * 2;
  if (x.t) s += 1;
  if (x.tRu && x.tRu !== x.t) s += 1;
  if (x.src === 'mm') s += 1; else if (x.src === 'bf') s += 0.5;
  return s;
}
const byName = {};
for (const x of ex) {
  if (x.is_archived) continue;
  const k = (x.nE || '').toLowerCase().trim();
  if (!k) continue;
  (byName[k] = byName[k] = byName[k] || []).push(x);
}
let archived = 0;
const archivedList = [];
for (const [name, arr] of Object.entries(byName)) {
  if (arr.length < 2) continue;
  arr.sort((a, b) => score(b) - score(a));
  for (let i = 1; i < arr.length; i++) {
    arr[i].is_archived = true;
    arr[i].archived_at = Date.now();
    arr[i].archived_reason = 'phase5-dedup-kept-' + arr[0].id;
    archived++;
    archivedList.push(name + ' | kept ' + arr[0].id + ' | archived ' + arr[i].id);
  }
}
log('Exercises archived as duplicates: ' + archived);

// ---------- 2. RU/HE translations for bf cardio machines ----------
const TR = {
  'bf_treadmill': { nR: 'Беговая дорожка', nH: 'הליכון', tRu: 'Настройте скорость| Настройте наклон| Выполняйте упражнение правильно', tHe: 'כוונן מהירות| כוונן שיפוע| בצע את התרגיל כראוי' },
  'bf_stepmill-machine': { nR: 'Степмилл (эскалатор)', nH: 'מכונת מדרגות', tRu: 'Заранее настройте скорость и интенсивность, во время упражнения регулируйте по самочувствию.', tHe: 'כוונן מראש מהירות ועצימות, ובמהלך התרגיל התאם לפי הרגשתך.' },
  'bf_swimming': { nR: 'Плавание', nH: 'שחייה', tRu: 'Плывите с правильной техникой.| Увеличьте интенсивность, чтобы усложнить упражнение.', tHe: 'שחה בטכניקה נכונה.| הגבר עצימות כדי להקשות.' },
  'bf_assault-bike': { nR: 'Аэробайк', nH: 'אופני מאמץ', tRu: 'Крутите педали и толкайте ручки в стабильном темпе.', tHe: 'דווש ודחוף את הידיות בקצב יציב.' }
};
let trFixed = 0;
for (const x of ex) { if (TR[x.id]) { Object.assign(x, TR[x.id]); trFixed++; } }
log('Translated bf machines: ' + trFixed);

const untr = ex.filter(x => !x.is_archived && x.t && x.tRu === x.t).map(x => x.id);
log('Still untranslated: ' + untr.length + (untr.length ? ' — ' + untr.slice(0, 20).join(', ') : ''));

fs.writeFileSync('exercise-db.json', JSON.stringify(ex));

// ---------- 3. Runtime: backup reminder + version stamp ----------
let html = fs.readFileSync('fitness-crm.html', 'utf8');
const MARK = 'Phase 5 runtime utilities';
if (html.includes(MARK)) { log('SKIP runtime injection (already present)'); }
else {
  const L = [];
  L.push('<script>');
  L.push('// ' + MARK);
  L.push('(function () {');
  L.push('  try {');
  L.push('    if (typeof backup !== "undefined" && backup && typeof backup.exportData === "function") {');
  L.push('      var oe = backup.exportData;');
  L.push('      backup.exportData = function () {');
  L.push('        var r = oe.apply(this, arguments);');
  L.push('        Promise.resolve(r).then(function () { try { localStorage.setItem("dk_last_backup", String(Date.now())); } catch (e) {} });');
  L.push('        return r;');
  L.push('      };');
  L.push('    }');
  L.push('  } catch (e) {}');
  L.push('  setTimeout(function () {');
  L.push('    try {');
  L.push('      var els = document.querySelectorAll("div,p,span,footer");');
  L.push('      for (var i = 0; i < els.length; i++) {');
  L.push('        var t = (els[i].textContent || "").trim();');
  L.push('        if (t.indexOf("v1.0.0-phase1") === 0) els[i].textContent = t.replace("v1.0.0-phase1", "v2.0-phase5");');
  L.push('      }');
  L.push('    } catch (e) {}');
  L.push('    try {');
  L.push('      var last = parseInt(localStorage.getItem("dk_last_backup") || "0", 10);');
  L.push('      var days = (Date.now() - last) / 86400000;');
  L.push('      if (!last || days > 7 && typeof toast === "function") toast("⚠️ Сделайте резервную копию: Настройки → Export full backup", "warning", 8000);');
  L.push('    } catch (e) {}');
  L.push('  }, 2500);');
  L.push('})();');
  L.push('</script>');
  L.push('');
  const bodyEnd = html.lastIndexOf('</body>');
  if (bodyEnd !== -1) { html = html.slice(0, bodyEnd) + L.join('\n') + html.slice(bodyEnd); log('INJECTED runtime utilities'); }
  else log('NOT FOUND </body>');
}
fs.writeFileSync('fitness-crm.html', html);

fs.mkdirSync('reports', { recursive: true });
fs.writeFileSync('reports/phase5-1-report.md', '# Phase 5.1 Report\n\n**Generated:** ' + new Date().toISOString() + '\n\n' + report.map(r => '- ' + r).join('\n') + '\n\n## Archived duplicates\n' + archivedList.map(r => '- ' + r).join('\n') + '\n');
console.log('=== PHASE 5.1 COMPLETE ===');
