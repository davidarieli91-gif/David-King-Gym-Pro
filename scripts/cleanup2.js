// DK Gym — Great Cleanup Phase 4 (data) + X-Ray
const fs = require('fs');

// ---------- 1. Убираем картинки у pg и mm упражнений ----------
const exercises = JSON.parse(fs.readFileSync('exercise-db.json', 'utf8'));
let imgRemoved = 0;
for (const x of exercises) {
  if ((x.src === 'pg' || x.src === 'mm') && Array.isArray(x.i) && x.i.length) {
    imgRemoved += x.i.length;
    x.i = [];
  }
}
fs.writeFileSync('exercise-db.json', JSON.stringify(exercises));

// ---------- 2. Удаляем осиротевшие файлы картинок mm_/pg_ ----------
const referenced = new Set();
for (const x of exercises) {
  if (Array.isArray(x.i)) x.i.forEach((p) => referenced.add(p));
}
let filesDeleted = 0, bytesFreed = 0;
if (fs.existsSync('images')) {
  for (const f of fs.readdirSync('images')) {
    if (!(f.startsWith('mm_') || f.startsWith('pg_'))) continue;
    const rel = 'images/' + f;
    if (referenced.has(rel)) continue;
    try {
      const st = fs.statSync(rel);
      fs.unlinkSync(rel);
      filesDeleted++;
      bytesFreed += st.size;
    } catch (e) {}
  }
}

// ---------- 3. Рентген: вытаскиваем куски кода вокруг маркеров ----------
const html = fs.readFileSync('fitness-crm.html', 'utf8');
const lines = html.split('\n');
const markers = [
  'AI Pro', 'llmGenerateProgram', 'autoGenerateProgram', 'AI Configuration',
  'aiEndpoint', 'Suggest foods', 'suggestFoodsForGaps', 'Smart program generator',
  'full_name', 'training_days', 'fitness_level', 'allergies', 'frequency', 'training_experience'
];
const out = [];
for (const m of markers) {
  out.push('\n\n========== MARKER: ' + m + ' ==========');
  let idx = -1, found = 0;
  while ((idx = html.indexOf(m, idx + 1)) !== -1 && found < 4) {
    const lineNo = html.slice(0, idx).split('\n').length;
    const start = Math.max(0, lineNo - 15);
    const end = Math.min(lines.length, lineNo + 15);
    out.push('\n----- occurrence ' + (found + 1) + ' at line ' + lineNo + ' -----');
    for (let i = start; i < end; i++) out.push((i + 1) + ': ' + lines[i]);
    found++;
  }
  if (found === 0) out.push('(not found)');
}
fs.mkdirSync('reports', { recursive: true });
fs.writeFileSync('reports/xray.md', out.join('\n'));

console.log('=== CLEANUP2 COMPLETE ===');
console.log('Image refs removed (pg/mm):', imgRemoved);
console.log('Orphan files deleted:', filesDeleted);
console.log('MB freed:', (bytesFreed / 1048576).toFixed(1));
