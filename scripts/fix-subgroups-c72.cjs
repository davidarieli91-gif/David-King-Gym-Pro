/* c72: atlas «Показать упражнения» на уровне ПОДГРУППЫ.
 * MSUB map: atlas muscle base → exercise-DB subgroup (sE), exact strings shared
 * with body-map data-subgroup so SVG highlight stays consistent.
 * Threads skey: info plaque button → showExercisesFor(gkey, skey) →
 * screens.exercises.setBodyMapFilter(gkey, skey) + subgroup SVG highlight + label.
 */
const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'fitness-crm.html');
let s = fs.readFileSync(FILE, 'utf8');
const orig = s;

function repOnce(name, anchor, replacement) {
  const n = s.split(anchor).length - 1;
  if (n !== 1) {
    console.error('ANCHOR "' + name + '" found ' + n + ' times — abort');
    process.exit(1);
  }
  s = s.replace(anchor, replacement);
  console.log('ok  ' + name);
}

/* ---------- 1) MSUB map after MGROUP ---------- */
repOnce('MSUB insert',
  `};
  var GROUP_LABEL = {`,
  `};

  /* c72: atlas muscle → exercise-DB subgroup (exact sE strings; also used by
   * body-map data-subgroup). Falls back to group-only when absent. */
  var MSUB = {
    /* chest */
    'Clavicular head of pectoralis major': 'Upper',
    'Sternocostal head of pectoralis major': 'Middle',
    'Abdominal part of pectoralis major muscle': 'Lower',
    /* back */
    'Latissimus dorsi': 'Lats', 'Teres major': 'Lats',
    'Descending part of trapezius': 'Trapezius',
    'Transverse part of trapezius': 'Middle Back',
    'Ascending part of trapezius': 'Middle Back',
    'Rhomboid major': 'Middle Back', 'Rhomboid minor': 'Middle Back',
    'Levator scapulae': 'Neck', 'Splenius capitis': 'Neck', 'Splenius colli': 'Neck',
    'Iliocostalis lumborum': 'Lower Back', 'Iliocostalis thoracis': 'Lower Back', 'Iliocostalis colli': 'Lower Back',
    'Longissimus thoracis': 'Lower Back', 'Longissimus capitis': 'Lower Back', 'Longissimus colli': 'Lower Back',
    'Spinalis thoracis': 'Lower Back', 'Spinalis capitis': 'Lower Back', 'Spinalis colli': 'Lower Back',
    'Multifidus lumborum': 'Lower Back', 'Multifidus thoracis': 'Lower Back', 'Multifidus colli': 'Lower Back',
    'Semispinalis thoracis': 'Lower Back', 'Semispinalis colli': 'Lower Back',
    'Rotatores': 'Lower Back', 'Quadratus lumborum': 'Lower Back',
    /* shoulders */
    'Clavicular part of deltoid': 'Front', 'Acromial part of deltoid': 'Middle',
    'Scapular spinal part of deltoid': 'Rear',
    'Supraspinatus': 'Rotator Cuff', 'Infraspinatus': 'Rotator Cuff',
    'Subscapularis': 'Rotator Cuff', 'Teres minor': 'Rotator Cuff',
    /* elbow flexors */
    'Long head of biceps brachii': 'Biceps', 'Short head of biceps brachii': 'Biceps',
    'Brachialis': 'Brachialis', 'Brachioradialis': 'Brachioradialis',
    /* abdominals */
    'External abdominal oblique': 'Obliques', 'Internal abdominal oblique': 'Obliques',
    'Transversus abdominis': 'Obliques',
    /* legs */
    'Gluteus maximus': 'Glutes', 'Gluteus medius': 'Glutes', 'Gluteus minimus': 'Glutes',
    'Tensor fasciae latae': 'Abductors', 'Piriformis': 'Abductors',
    'Rectus femoris': 'Quadriceps', 'Vastus lateralis': 'Quadriceps',
    'Vastus medialis': 'Quadriceps', 'Vastus intermedius': 'Quadriceps',
    'Adductor longus': 'Adductors', 'Adductor brevis': 'Adductors',
    'Adductor magnus': 'Adductors', 'Adductor minimus': 'Adductors',
    'Gracilis': 'Adductors', 'Pectineus': 'Adductors',
    'Sartorius': 'Hip Flexors', 'Iliacus': 'Hip Flexors', 'Psoas major': 'Hip Flexors',
    'Long head of biceps femoris': 'Hamstrings', 'Short head of biceps femoris': 'Hamstrings',
    'Semitendinosus': 'Hamstrings', 'Semimembranosus': 'Hamstrings',
    'Medial head of gastrocnemius': 'Calves', 'Lateral head of gastrocnemius': 'Calves',
    'Soleus': 'Calves', 'Plantaris': 'Calves'
  };
  var GROUP_LABEL = {`
);

/* ---------- 2) plaque: subgroup in chip + data-skey on button ---------- */
repOnce('plaque chip + skey',
`    var gkey = MGROUP[base];
    var gTxt = gkey ? tr(GROUP_LABEL[gkey]) : '';
    var gHtml = gTxt ? '<span class="atlas-chip-g">' + esc(gTxt) + '</span>' : '';
    /* c67: «Показать упражнения» — jump to exercise DB filtered by this group */
    var exHtml = gkey ? '<button type="button" class="atlas-ex-btn" data-gkey="' + esc(gkey) + '">' +`,
`    var gkey = MGROUP[base];
    var skey = MSUB[base] || '';
    var gTxt = gkey ? tr(GROUP_LABEL[gkey]) : '';
    if (gTxt && skey) {
      var sTxt = (typeof subgroupName === 'function') ? subgroupName(skey) : skey;
      if (sTxt) gTxt += ' · ' + sTxt;
    }
    var gHtml = gTxt ? '<span class="atlas-chip-g">' + esc(gTxt) + '</span>' : '';
    /* c67: «Показать упражнения» — jump to exercise DB filtered by this group */
    /* c72: + data-skey — subgroup-precise filter (Upper chest, Lats, Rotator Cuff…) */
    var exHtml = gkey ? '<button type="button" class="atlas-ex-btn" data-gkey="' + esc(gkey) + '" data-skey="' + esc(skey) + '">' +`
);

/* ---------- 3) delegated handler passes skey ---------- */
repOnce('handler skey',
`        var b = e.target.closest ? e.target.closest('[data-gkey]') : null;
        if (b) { showExercisesFor(b.getAttribute('data-gkey')); return; }`,
`        var b = e.target.closest ? e.target.closest('[data-gkey]') : null;
        if (b) { showExercisesFor(b.getAttribute('data-gkey'), b.getAttribute('data-skey')); return; }`
);

/* ---------- 4) showExercisesFor signature ---------- */
repOnce('showExercisesFor signature',
`  function showExercisesFor(gkey) {
    if (!gkey) return;`,
`  function showExercisesFor(gkey, skey) {
    if (!gkey) return;`
);

/* ---------- 5) showExercisesFor body: filter + highlight + label ---------- */
repOnce('showExercisesFor body',
`      if (typeof screens !== 'undefined' && screens && screens.exercises && screens.exercises.setBodyMapFilter) {
        screens.exercises.setBodyMapFilter(gkey);
      }
      var svgBox = document.getElementById('exercise-bodymap-svg');
      if (svgBox) {
        svgBox.querySelectorAll('.bm-muscle').forEach(function (m) { m.classList.remove('bm-selected'); });
        svgBox.querySelectorAll('.bm-muscle[data-group="' + gkey + '"]').forEach(function (m) { m.classList.add('bm-selected'); });
      }
      var lbl = document.getElementById('exercise-bodymap-active');
      if (lbl) lbl.textContent = (typeof groupName === 'function') ? groupName(gkey) : gkey;`,
`      if (typeof screens !== 'undefined' && screens && screens.exercises && screens.exercises.setBodyMapFilter) {
        screens.exercises.setBodyMapFilter(gkey, skey || null);
      }
      var svgBox = document.getElementById('exercise-bodymap-svg');
      if (svgBox) {
        svgBox.querySelectorAll('.bm-muscle').forEach(function (m) { m.classList.remove('bm-selected'); });
        var sel = skey ? svgBox.querySelectorAll('.bm-muscle[data-group="' + gkey + '"][data-subgroup="' + skey + '"]') : [];
        if (!sel.length) sel = svgBox.querySelectorAll('.bm-muscle[data-group="' + gkey + '"]');
        sel.forEach(function (m) { m.classList.add('bm-selected'); });
      }
      var lbl = document.getElementById('exercise-bodymap-active');
      if (lbl) {
        var gName = (typeof groupName === 'function') ? groupName(gkey) : gkey;
        var sName = (skey && typeof subgroupName === 'function') ? subgroupName(skey) : '';
        lbl.textContent = gName + (sName ? ' / ' + sName : '');
      }`
);

/* ---------- 6) version markers ---------- */
repOnce('dk-build meta',
  `<meta name="dk-build" content="c71" />`,
  `<meta name="dk-build" content="c72" />`
);
repOnce('RUNNING',
  `var RUNNING = 71; /* numeric part of dk-build c71 */`,
  `var RUNNING = 72; /* numeric part of dk-build c72 */`
);

/* ---------- 7) MSUB sanity: every MSUB value must exist in DB sE for that group ---------- */
const DB = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'exercise-db.json'), 'utf8'));
const arr = Array.isArray(DB) ? DB : (DB.exercises || []);
const validSE = new Set(arr.map(e => (e.sE || '').trim()));
const bad = Object.entries(MSUBPairs()).filter(([, v]) => !validSE.has(v));
if (bad.length) { console.error('MSUB values not in DB sE:', bad); process.exit(1); }
function MSUBPairs() {
  const m = {};
  const re = /'([A-Za-z][^']*)':\s*'([A-Za-z][^']*)'/g;
  const start = s.indexOf('var MSUB = {');
  const end = s.indexOf('};', start);
  const blk = s.slice(start, end);
  let mm;
  while ((mm = re.exec(blk)) !== null) m[mm[1]] = mm[2];
  return m;
}
console.log('MSUB entries all valid against exercise-db.json sE');

/* ---------- 8) MGROUP/MSUB key parity: every MSUB key must exist in MGROUP ---------- */
{
  const start = s.indexOf('var MGROUP = {');
  const end = s.indexOf('};', start);
  const blk = s.slice(start, end);
  const re = /'([A-Za-z][^']*)':\s*'[a-z_]+'/g;
  const keys = new Set();
  let mm;
  while ((mm = re.exec(blk)) !== null) keys.add(mm[1]);
  const msubStart = s.indexOf('var MSUB = {');
  const msubEnd = s.indexOf('};', msubStart);
  const msubBlk = s.slice(msubStart, msubEnd);
  const re2 = /'([A-Za-z][^']*)':\s*'/g;
  const missing = [];
  while ((mm = re2.exec(msubBlk)) !== null) if (!keys.has(mm[1])) missing.push(mm[1]);
  if (missing.length) { console.error('MSUB keys missing from MGROUP:', missing); process.exit(1); }
  console.log('MSUB keys ⊆ MGROUP keys ✓');
}

fs.writeFileSync(FILE, s);
console.log('written, delta bytes:', s.length - orig.length);
