#!/usr/bin/env node
/* c98 — the portal's «Карта восстановления» becomes the REAL recovery map.
 *
 * User report (2026-09-16, after c97 went live):
 *  «Карта восстановления в портале выглядит совсем не так же как карта
 *   восстановления в обычном режиме, она буквально пустая, сделай её
 *   идентичной тому что есть в обычном режиме, и пускай будут
 *   взаимосвязанные»
 *
 * Root cause: the 4th portal button (c96) was built as the 10 save-slot
 * list, while the «Карта восстановления» in the normal (trainer) mode is
 * the recoveryMap modal — an SVG body heat-map with per-muscle recovery %
 * (6-day exponential decay + 30% synergist credit), 7d/30d volume modes
 * and Front/Back/Side views. The portal had none of that — just (often
 * empty) slot rows.
 *
 * Fix (identical + interconnected):
 *  1. client.html — the recovery tab now opens with the REAL recovery map:
 *     the exact recoveryMap design (mode tabs, Front/Back/Side SVG body
 *     from src/muscle-map.js, legend, per-muscle bars) computed with the
 *     EXACT trainer formula (same TAU=3d decay, same status buckets, same
 *     done-sets-only volume, same 30% synergist credit) over the portal
 *     history, which already includes the trainer's sessions through the
 *     shared ps_hist doc (c93/c94) — so both maps show the SAME numbers.
 *     The 10 save slots stay below under their own «Ячейки сохранения»
 *     header. New portal saves and CRM backfills now also carry the
 *     canonical group + synergists (g/syn) so the credit matches exactly
 *     even for exercises outside the current share payload.
 *  2. fitness-crm.html — the trainer's recoveryMap.computeForClient now
 *     ALSO merges the trainee portal's cloud history (ps_hist, 4s guard,
 *     in-memory, dedupe by date ts — the analytics pattern), so
 *     portal-logged sessions immediately change the trainer's map too:
 *     identical & interconnected in BOTH directions.
 *  3. Versions: c98 / RUNNING=98 / sw dk-gym-v125.
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

let fails = 0;
function rep(file, from, to, label) {
  const p = path.join(ROOT, file);
  let s = fs.readFileSync(p, 'utf8');
  const n = s.split(from).length - 1;
  if (n !== 1) {
    if (n === 0 && s.split(to).length - 1 >= 1) { console.log(`skip  ${label || file} (already applied)`); return; }
    console.error(`FAIL [${label || file}]: expected 1 occurrence, found ${n}`);
    fails++;
    return;
  }
  s = s.replace(from, to);
  fs.writeFileSync(p, s);
  console.log(`ok  ${label || file}`);
}

/* ------------------------------------------------------------------ *
 * 1 — portal CSS: recovery-map styles ported from the trainer CRM
 * ------------------------------------------------------------------ */
rep('client.html',
`    .yt-player { position: relative; width: 100%; aspect-ratio: 16/9; border-radius: 12px; overflow: hidden; background: rgb(var(--c-surface-2)); }
    .yt-player iframe { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; }
  </style>`,
`    .yt-player { position: relative; width: 100%; aspect-ratio: 16/9; border-radius: 12px; overflow: hidden; background: rgb(var(--c-surface-2)); }
    .yt-player iframe { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; }
    /* c98: recovery map — ported from the trainer CRM's recoveryMap modal */
    .recp-tab { color: rgb(var(--c-muted)); border-radius: 6px; transition: all .15s; cursor: pointer; }
    .recp-tab.recp-on { background: rgb(var(--c-primary)); color: #fff; }
    .recp-muscle-row { padding: 6px 8px; border-radius: 8px; border: 1px solid rgb(var(--c-border)); background: rgb(var(--c-surface-2)); transition: all .15s; }
    .recp-muscle-row:hover { border-color: rgb(var(--c-primary) / 0.4); }
    .recp-muscle-row.recp-st-fresh { border-inline-start: 3px solid rgb(var(--c-success)); }
    .recp-muscle-row.recp-st-recovering { border-inline-start: 3px solid rgb(var(--c-warning)); }
    .recp-muscle-row.recp-st-fatigued { border-inline-start: 3px solid rgb(var(--c-danger)); }
    .recp-muscle-row.recp-st-untrained { border-inline-start: 3px solid rgb(var(--c-muted) / 0.5); opacity: 0.6; }
    .recp-bar { height: 6px; border-radius: 3px; overflow: hidden; background: rgb(var(--c-surface)); }
    .recp-bar-fill { height: 100%; border-radius: 3px; transition: width .3s; }
  </style>`,
  '1: portal CSS recp-*');

/* ------------------------------------------------------------------ *
 * 2 — portal markup: the tab opens with the REAL map, slots below
 * ------------------------------------------------------------------ */
rep('client.html',
`  <!-- ============= RECOVERY MAP (c96): 10 profile save slots ============= -->
  <section id="tab-recovery" class="hidden space-y-3 fade-in" aria-label="Recovery map">
    <div class="glass rounded-2xl p-4">
      <h2 class="font-display font-bold text-base text-text" id="txt-recovery-title">Карта восстановления</h2>
      <p class="text-[11px] text-muted mt-1 leading-relaxed" id="txt-recovery-sub"></p>
    </div>
    <div id="recovery-slots" class="space-y-2 pb-2"></div>
  </section>`,
`  <!-- ============= RECOVERY MAP (c98): the REAL recovery map — identical to
       the trainer CRM's recoveryMap (SVG body heat-map, per-muscle recovery %,
       6-day decay + 30% synergist model, same data via the shared ps_hist doc)
       + the c96 10 profile save slots below ============= -->
  <section id="tab-recovery" class="hidden space-y-3 fade-in" aria-label="Recovery map">
    <div class="glass rounded-2xl p-4">
      <div class="flex items-center gap-2 flex-wrap">
        <h2 class="font-display font-bold text-base text-text flex-1 min-w-0" id="txt-recovery-title">Карта восстановления</h2>
        <div class="flex gap-1 bg-[rgb(var(--c-surface-2))] border border-border rounded-lg p-0.5 shrink-0" id="recp-mode-tabs">
          <button data-recp-mode="recovery" class="recp-tab px-2.5 py-1 text-[11px] font-semibold transition">Восстановление</button>
          <button data-recp-mode="7d" class="recp-tab px-2.5 py-1 text-[11px] font-semibold transition">Объём 7д</button>
          <button data-recp-mode="30d" class="recp-tab px-2.5 py-1 text-[11px] font-semibold transition">Объём 30д</button>
        </div>
      </div>
      <p class="text-[11px] text-muted mt-1 leading-relaxed truncate" id="txt-recovery-sub"></p>
      <div class="mt-2 flex flex-col sm:flex-row gap-3">
        <div class="shrink-0 flex flex-col items-center mx-auto">
          <div class="flex gap-1 mb-2" id="recp-view-tabs">
            <button data-recp-view="front" class="recp-tab px-2 py-0.5 text-[10px] font-semibold transition">Спереди</button>
            <button data-recp-view="back" class="recp-tab px-2 py-0.5 text-[10px] font-semibold transition">Сзади</button>
            <button data-recp-view="side" class="recp-tab px-2 py-0.5 text-[10px] font-semibold transition">Сбоку</button>
          </div>
          <div id="recp-svg-container" class="w-[150px]"></div>
          <div id="recp-legend" class="mt-2 text-[10px] text-muted text-center leading-snug"></div>
        </div>
        <div class="flex-1 min-w-0">
          <div id="recp-muscle-list" class="space-y-1.5"></div>
        </div>
      </div>
      <div id="recp-hint" class="mt-2 pt-2 border-t border-border text-[10px] text-muted text-center leading-snug"></div>
    </div>
    <div class="glass rounded-2xl p-4">
      <h3 class="font-display font-bold text-sm text-text" id="txt-slots-title">Ячейки сохранения (10)</h3>
      <p class="text-[11px] text-muted mt-1 leading-relaxed" id="txt-slots-sub"></p>
    </div>
    <div id="recovery-slots" class="space-y-2 pb-2"></div>
  </section>`,
  '2: portal tab-recovery markup');

/* ------------------------------------------------------------------ *
 * 3 — portal i18n: map strings (RU / EN / HE)
 * ------------------------------------------------------------------ */
rep('client.html',
`recConfirmClear:'Очистить эту ячейку?',recSaved:'Ячейка сохранена ✓',recLoaded:'Данные из ячейки загружены — перезагрузка…',recCleared:'Ячейка очищена',recNoData:'Нет данных для сохранения',recCloud:'облако',`,
`recConfirmClear:'Очистить эту ячейку?',recSaved:'Ячейка сохранена ✓',recLoaded:'Данные из ячейки загружены — перезагрузка…',recCleared:'Ячейка очищена',recNoData:'Нет данных для сохранения',recCloud:'облако',
mapModeRecovery:'Восстановление',mapMode7d:'Объём 7д',mapMode30d:'Объём 30д',mapViewFront:'Спереди',mapViewBack:'Сзади',mapViewSide:'Сбоку',mapRecLabel:'Восстановление',mapLastTrained:'Последняя тренировка',mapUntrained:'Не тренирован',mapToday:'Сегодня',mapAgo:'назад',mapWorkouts:'тренировок',mapMuscles:'мышц',mapLoading:'Загрузка…',mapLegendRec:'🟢 Восстановлен · 🟡 Восстанавливается · 🔴 Утомлён · ⚪ Не тренирован',mapLegend7d:'Объём за 7 дней (кг)',mapLegend30d:'Объём за 30 дней (кг)',mapHint:'Модель восстановления: экспоненциальное затухание ~6 дней. Синергисты получают 30% усталости. Объём = подходы × повторения × вес выполненных подходов.',slotsTitle:'Ячейки сохранения (10)',daysShort:'д',`,
  '3a: L-ru map keys');

rep('client.html',
`recConfirmClear:'Clear this slot?',recSaved:'Slot saved ✓',recLoaded:'Slot data loaded — reloading…',recCleared:'Slot cleared',recNoData:'Nothing to save yet',recCloud:'cloud',`,
`recConfirmClear:'Clear this slot?',recSaved:'Slot saved ✓',recLoaded:'Slot data loaded — reloading…',recCleared:'Slot cleared',recNoData:'Nothing to save yet',recCloud:'cloud',
mapModeRecovery:'Recovery',mapMode7d:'7d Vol',mapMode30d:'30d Vol',mapViewFront:'Front',mapViewBack:'Back',mapViewSide:'Side',mapRecLabel:'Recovery',mapLastTrained:'Last trained',mapUntrained:'Not trained yet',mapToday:'Today',mapAgo:'ago',mapWorkouts:'workouts',mapMuscles:'muscles',mapLoading:'Loading…',mapLegendRec:'🟢 Fresh · 🟡 Recovering · 🔴 Fatigued · ⚪ Untrained',mapLegend7d:'7-day volume (kg)',mapLegend30d:'30-day volume (kg)',mapHint:'Recovery model: ~6-day exponential decay. Synergist muscles receive 30% fatigue credit. Volume = sets × reps × weight for done sets only.',slotsTitle:'Save slots (10)',daysShort:'d',`,
  '3b: L-en map keys');

rep('client.html',
`recConfirmClear:'לנקות את התא הזה?',recSaved:'התא נשמר ✓',recLoaded:'הנתונים נטענו — טוען מחדש…',recCleared:'התא נוקה',recNoData:'אין עדיין מה לשמור',recCloud:'ענן',`,
`recConfirmClear:'לנקות את התא הזה?',recSaved:'התא נשמר ✓',recLoaded:'הנתונים נטענו — טוען מחדש…',recCleared:'התא נוקה',recNoData:'אין עדיין מה לשמור',recCloud:'ענן',
mapModeRecovery:'התאוששות',mapMode7d:'נפח 7 ימים',mapMode30d:'נפח 30 ימים',mapViewFront:'קדמי',mapViewBack:'אחורי',mapViewSide:'צד',mapRecLabel:'התאוששות',mapLastTrained:'אימון אחרון',mapUntrained:'טרם אומן',mapToday:'היום',mapAgo:'לפני',mapWorkouts:'אימונים',mapMuscles:'שרירים',mapLoading:'טוען…',mapLegendRec:'🟢 מחלים · 🟡 בהחלמה · 🔴 עייף · ⚪ לא מאומן',mapLegend7d:'נפח 7 ימים (ק״ג)',mapLegend30d:'נפח 30 ימים (ק״ג)',mapHint:'מודל ההתאוששות: דעיכה אקספוננציאלית של ~6 ימים. שרירי עזר מקבלים 30% מהעייפות. נפח = סטים × חזרות × משקל של סטים שבוצעו.',slotsTitle:'תאי שמירה (10)',daysShort:'ימ׳',`,
  '3c: L-he map keys');

/* ------------------------------------------------------------------ *
 * 4 — updateLabels: the map subtitle is dynamic now; slots get headers
 * ------------------------------------------------------------------ */
rep('client.html',
`    document.getElementById('nav-recovery').textContent = t('navRecovery');
    document.getElementById('txt-recovery-title').textContent = t('recTitle');
    document.getElementById('txt-recovery-sub').textContent = t('recSub');`,
`    document.getElementById('nav-recovery').textContent = t('navRecovery');
    document.getElementById('txt-recovery-title').textContent = t('recTitle');
    /* c98: the map subtitle is DYNAMIC now (client · workouts · muscles — set by renderRecMap); the slots block below got its own static header */
    const _slotsTitle98 = document.getElementById('txt-slots-title'); if (_slotsTitle98) _slotsTitle98.textContent = t('slotsTitle');
    const _slotsSub98 = document.getElementById('txt-slots-sub'); if (_slotsSub98) _slotsSub98.textContent = t('recSub');`,
  '4: updateLabels slots header');

/* ------------------------------------------------------------------ *
 * 5 — setLang: re-render the map in the new language (cached data)
 * ------------------------------------------------------------------ */
rep('client.html',
`    try { renderRecovery(); } catch(e) {} /* c97: the 10 slot rows are dynamic — re-render them in the new language RIGHT NOW (updateLabels only re-translated the static title/subtitle, the rows kept the old language until the tab was re-opened) */`,
`    try { renderRecovery(); } catch(e) {} /* c97: the 10 slot rows are dynamic — re-render them in the new language RIGHT NOW (updateLabels only re-translated the static title/subtitle, the rows kept the old language until the tab was re-opened) */
    try { renderRecMap(true); } catch(e) {} /* c98: the recovery map re-renders in the new language instantly (cached per-muscle data) */`,
  '5: setLang -> renderRecMap');

/* ------------------------------------------------------------------ *
 * 6 — tab open: compute + render the map (fresh data)
 * ------------------------------------------------------------------ */
rep('client.html',
`        if (tab.dataset.tab === 'recovery') { try { renderRecovery(); } catch(e){} }`,
`        if (tab.dataset.tab === 'recovery') { try { renderRecovery(); } catch(e){} try { renderRecMap(); } catch(e){} } /* c98: the map recomputes on every tab open */`,
  '6: tab open -> renderRecMap');

/* ------------------------------------------------------------------ *
 * 7 — the map module itself (after the c96 recovery slots module)
 * ------------------------------------------------------------------ */
rep('client.html',
`  window.dkPortalRecovery = { render: renderRecovery, auto: recvAutoTick };`,
`  window.dkPortalRecovery = { render: renderRecovery, auto: recvAutoTick };

  /* ===== c98: THE REAL RECOVERY MAP — identical to the trainer CRM's
   * recoveryMap (fitness-crm.html): same 11 muscle groups, same 6-day
   * exponential decay (recovery = 100·(1−e^(−days/3))), same status buckets
   * (fresh ≥85 / recovering ≥50 / fatigued), same done-sets-only volume,
   * same 30% synergist credit and the SAME SVG body (src/muscle-map.js).
   * Data = the portal workout history, which already contains the trainer's
   * sessions through the shared ps_hist doc (c93/c94) — so both maps show
   * the SAME percentages (identical & interconnected). The 10 save slots
   * from c96 stay below under their own header. ===== */
  const RECP_GROUPS = ['chest', 'back', 'shoulders', 'elbow_flexors', 'triceps', 'forearms', 'abdominals', 'legs', 'stretching', 'warmup', 'calisthenics'];
  const RECP_LABELS = {
    chest:         { en: 'Chest',        ru: 'Грудь',       he: 'חזה' },
    back:          { en: 'Back',         ru: 'Спина',       he: 'גב' },
    shoulders:     { en: 'Shoulders',    ru: 'Плечи',       he: 'כתפיים' },
    elbow_flexors: { en: 'Biceps',       ru: 'Бицепс',      he: 'ביצפס' },
    triceps:       { en: 'Triceps',      ru: 'Трицепс',     he: 'תלת ראשי' },
    forearms:      { en: 'Forearms',     ru: 'Предплечья',  he: 'אמות' },
    abdominals:    { en: 'Abs',          ru: 'Пресс',       he: 'בטן' },
    legs:          { en: 'Legs',         ru: 'Ноги',        he: 'רגליים' },
    stretching:    { en: 'Stretching',   ru: 'Растяжка',    he: 'מתיחות' },
    warmup:        { en: 'Warm-up',      ru: 'Разминка',    he: 'חימום' },
    calisthenics:  { en: 'Calisthenics', ru: 'Калистеника', he: 'משקל גוף' }
  };
  const RECP_TAU_DAYS = 3.0, RECP_SYN_CREDIT = 0.30, RECP_MS_DAY = 86400000;
  let _recpData = null, _recpCount = 0, _recpMode = 'recovery', _recpView = 'front';
  function recpCanonical(name) {
    if (!name) return null;
    const s = String(name).trim();
    if (!s) return null;
    if (RECP_GROUPS.indexOf(s) !== -1) return s;
    try { const SC = window.SYNERGIST_CANONICAL; const hit = SC && SC[s.toLowerCase()]; if (hit) return hit; } catch (e) {}
    return mgKeyOf(s) || null;
  }
  function recpPct(days) {
    if (days == null || !isFinite(days)) return 100;
    if (days < 0) days = 0;
    return Math.round(100 * (1 - Math.exp(-days / RECP_TAU_DAYS)));
  }
  function recpBucket(recovery, days) {
    if (days == null || !isFinite(days)) return 'untrained';
    if (recovery >= 85) return 'fresh';
    if (recovery >= 50) return 'recovering';
    return 'fatigued';
  }
  /* exercise → {group, synergists}: the share payload's exercise map first,
     then the record's own canonical g/syn (c98-enriched CRM backfills and
     new portal saves), then the record's group string */
  function recpExInfo(key, ex) {
    const exd = exerciseDB[key] || exerciseDB[String(key)] || null;
    if (exd && exd.group) {
      const g = recpCanonical(exd.group);
      if (g) return { group: g, synergists: (exd.synergists || []).map(recpCanonical).filter(Boolean) };
    }
    if (ex) {
      if (Array.isArray(ex.syn) && ex.syn.length) return { group: recpCanonical(ex.g || ex.group) || ex.g || null, synergists: ex.syn.filter(Boolean) };
      const g2 = recpCanonical(ex.group);
      if (g2) return { group: g2, synergists: [] };
    }
    return null;
  }
  function recpCompute() {
    const hist = loadHistory();
    _recpCount = hist.length;
    const now = Date.now(), dayNow = Math.floor(now / RECP_MS_DAY);
    const vol = {}, st = {};
    RECP_GROUPS.forEach(g => { vol[g] = {}; st[g] = {}; });
    (hist || []).forEach(w => {
      if (!w || !Array.isArray(w.exercises)) return;
      const bucket = Math.floor((Number(w.ts) || Date.parse(w.date) || 0) / RECP_MS_DAY);
      if (!(bucket > 0)) return;
      w.exercises.forEach(ex => {
        if (!ex) return;
        const info = recpExInfo(ex.key, ex);
        if (!info || !info.group || RECP_GROUPS.indexOf(info.group) === -1) return;
        let v = 0, n = 0;
        (ex.sets || []).forEach(s => {
          if (!s || s.done === false) return;
          const wv = parseFloat(s.weight) || 0;
          const rv = typeof s.reps === 'number' ? s.reps : (parseInt(s.reps, 10) || 0);
          v += wv * rv; n++;
        });
        if (!n) return;
        vol[info.group][bucket] = (vol[info.group][bucket] || 0) + v;
        st[info.group][bucket] = (st[info.group][bucket] || 0) + n;
        (info.synergists || []).forEach(sn => {
          if (RECP_GROUPS.indexOf(sn) === -1) return;
          vol[sn][bucket] = (vol[sn][bucket] || 0) + v * RECP_SYN_CREDIT;
          st[sn][bucket] = (st[sn][bucket] || 0) + n;
        });
      });
    });
    const out = {};
    RECP_GROUPS.forEach(g => {
      const dm = vol[g], sm = st[g];
      const buckets = Object.keys(dm).map(Number).filter(b => dm[b] > 0);
      let last = null; buckets.forEach(b => { if (last === null || b > last) last = b; });
      const lastMs = last !== null ? last * RECP_MS_DAY : null;
      const daysAgo = lastMs !== null ? (now - lastMs) / RECP_MS_DAY : null;
      const recovery = daysAgo !== null ? recpPct(daysAgo) : 100;
      let v7 = 0, v30 = 0, s7 = 0, s30 = 0;
      buckets.forEach(b => {
        const d = dayNow - b;
        if (d >= 0 && d < 7) { v7 += dm[b]; s7 += sm[b] || 0; }
        if (d >= 0 && d < 30) { v30 += dm[b]; s30 += sm[b] || 0; }
      });
      out[g] = { recovery: recovery, lastTrainedDaysAgo: daysAgo, lastTrainedMs: lastMs, volume7d: Math.round(v7), volume30d: Math.round(v30), sets7d: s7, sets30d: s30, status: recpBucket(recovery, daysAgo) };
    });
    return out;
  }
  function recpFillColor(recovery, days) {
    if (days == null || !isFinite(days)) return 'rgba(120,120,120,0.25)';
    if (recovery >= 85) return 'rgba(34,197,94,0.65)';
    if (recovery >= 50) return 'rgba(245,158,11,0.65)';
    return 'rgba(239,68,68,0.75)';
  }
  function recpVolColor(v, max) {
    if (!v || v <= 0 || !max || max <= 0) return 'rgba(120,120,120,0.2)';
    return 'rgba(59,130,246,' + (0.25 + Math.min(1, v / max) * 0.6).toFixed(2) + ')';
  }
  function recpDaysStr(days) {
    const n = Math.max(0, Math.round(days));
    if (currentLang === 'he') return t('mapAgo') + ' ' + n + ' ' + t('daysShort');
    return n + t('daysShort') + ' ' + t('mapAgo');
  }
  function recpRenderBody() {
    const box = document.getElementById('recp-svg-container');
    if (!box) return;
    box.innerHTML = _recpView === 'front' ? (window.BM_SVG_FRONT || '') : _recpView === 'back' ? (window.BM_SVG_BACK || '') : (window.BM_SVG_SIDE || '');
    if (!_recpData) return;
    let maxV = 0;
    if (_recpMode === '7d') RECP_GROUPS.forEach(g => { if (_recpData[g].volume7d > maxV) maxV = _recpData[g].volume7d; });
    else if (_recpMode === '30d') RECP_GROUPS.forEach(g => { if (_recpData[g].volume30d > maxV) maxV = _recpData[g].volume30d; });
    box.querySelectorAll('.bm-muscle').forEach(path => {
      const g = path.getAttribute('data-group');
      if (!g || !_recpData[g]) return;
      const info = _recpData[g];
      let fill;
      if (_recpMode === 'recovery') fill = recpFillColor(info.recovery, info.lastTrainedDaysAgo);
      else if (_recpMode === '7d') fill = recpVolColor(info.volume7d, maxV);
      else fill = recpVolColor(info.volume30d, maxV);
      path.setAttribute('fill', fill);
      path.setAttribute('stroke', 'rgba(0,0,0,0.4)');
      path.setAttribute('stroke-width', '0.8');
      const lbl = (RECP_LABELS[g] && RECP_LABELS[g][currentLang]) || g;
      let tip = lbl;
      if (_recpMode === 'recovery') {
        tip += '\\n' + t('mapRecLabel') + ': ' + info.recovery + '%';
        tip += '\\n' + (info.lastTrainedDaysAgo !== null ? t('mapLastTrained') + ': ' + recpDaysStr(info.lastTrainedDaysAgo) : t('mapUntrained'));
      } else if (_recpMode === '7d') tip += '\\n' + t('mapLegend7d') + ': ' + info.volume7d + ' · ' + info.sets7d;
      else tip += '\\n' + t('mapLegend30d') + ': ' + info.volume30d + ' · ' + info.sets30d;
      const ti = document.createElementNS('http://www.w3.org/2000/svg', 'title');
      ti.textContent = tip;
      path.appendChild(ti);
    });
  }
  function recpRenderList() {
    const list = document.getElementById('recp-muscle-list');
    if (!list || !_recpData) return;
    const sorted = RECP_GROUPS.slice().sort((a, b) => {
      const da = _recpData[a].lastTrainedDaysAgo, db = _recpData[b].lastTrainedDaysAgo;
      if (da == null && db == null) return 0;
      if (da == null) return 1;
      if (db == null) return -1;
      return da - db;
    });
    let maxVal = 0;
    sorted.forEach(g => {
      const v = _recpMode === 'recovery' ? _recpData[g].recovery : _recpMode === '7d' ? _recpData[g].volume7d : _recpData[g].volume30d;
      if (v > maxVal) maxVal = v;
    });
    let html = '';
    sorted.forEach(g => {
      const info = _recpData[g];
      const lbl = (RECP_LABELS[g] && RECP_LABELS[g][currentLang]) || g;
      let valLabel, barPct, barColor;
      if (_recpMode === 'recovery') {
        valLabel = info.recovery + '%';
        barPct = info.recovery;
        barColor = info.status === 'fresh' ? 'rgb(var(--c-success))' : info.status === 'recovering' ? 'rgb(var(--c-warning))' : info.status === 'fatigued' ? 'rgb(var(--c-danger))' : 'rgb(var(--c-muted))';
      } else {
        const vol = _recpMode === '7d' ? info.volume7d : info.volume30d;
        const sets = _recpMode === '7d' ? info.sets7d : info.sets30d;
        valLabel = vol + ' · ' + sets;
        barPct = maxVal > 0 ? Math.round((vol / maxVal) * 100) : 0;
        barColor = 'rgb(var(--c-primary))';
      }
      let when;
      if (info.lastTrainedDaysAgo === null) when = t('mapUntrained');
      else if (info.lastTrainedDaysAgo < 1) when = t('mapToday');
      else when = recpDaysStr(info.lastTrainedDaysAgo);
      html += '<div class="recp-muscle-row recp-st-' + info.status + '">' +
        '<div class="flex items-center gap-2 mb-1">' +
          '<span class="text-xs font-bold flex-1 truncate text-text">' + esc(lbl) + '</span>' +
          '<span class="text-[10px] text-muted shrink-0">' + esc(when) + '</span>' +
          '<span class="text-xs font-mono font-bold shrink-0 text-text" style="min-width:64px;text-align:end">' + esc(valLabel) + '</span>' +
        '</div>' +
        '<div class="recp-bar"><div class="recp-bar-fill" style="width:' + barPct + '%;background:' + barColor + '"></div></div>' +
      '</div>';
    });
    list.innerHTML = html;
  }
  function recpRenderLegend() {
    const el = document.getElementById('recp-legend');
    if (el) el.innerHTML = esc(_recpMode === 'recovery' ? t('mapLegendRec') : _recpMode === '7d' ? t('mapLegend7d') : t('mapLegend30d'));
    const hint = document.getElementById('recp-hint');
    if (hint) hint.textContent = t('mapHint');
  }
  function recpUpdateTabs() {
    document.querySelectorAll('#recp-mode-tabs [data-recp-mode]').forEach(b => b.classList.toggle('recp-on', b.getAttribute('data-recp-mode') === _recpMode));
    document.querySelectorAll('#recp-view-tabs [data-recp-view]').forEach(b => b.classList.toggle('recp-on', b.getAttribute('data-recp-view') === _recpView));
  }
  function recpRenderAll() { recpUpdateTabs(); recpRenderBody(); recpRenderList(); recpRenderLegend(); }
  function renderRecMap(useCache) {
    const probe = document.getElementById('recp-muscle-list');
    if (!probe) return;
    if (useCache && _recpData) { recpRenderAll(); return; }
    const sub = document.getElementById('txt-recovery-sub');
    if (sub && !_recpData) sub.textContent = t('mapLoading');
    _recpData = recpCompute();
    let nm = ''; try { nm = (currentClient && (currentClient.full_name || currentClient.name)) || ''; } catch (e) {}
    const trained = RECP_GROUPS.filter(g => _recpData[g].lastTrainedDaysAgo !== null).length;
    if (sub) sub.textContent = (nm ? nm + ' · ' : '') + _recpCount + ' ' + t('mapWorkouts') + ' · ' + trained + '/' + RECP_GROUPS.length + ' ' + t('mapMuscles');
    recpRenderAll();
  }
  (function recpWire() {
    document.querySelectorAll('#recp-mode-tabs [data-recp-mode]').forEach(b => b.addEventListener('click', () => { _recpMode = b.getAttribute('data-recp-mode'); recpRenderAll(); }));
    document.querySelectorAll('#recp-view-tabs [data-recp-view]').forEach(b => b.addEventListener('click', () => { _recpView = b.getAttribute('data-recp-view'); recpUpdateTabs(); recpRenderBody(); }));
  })();
  window.dkPortalRecMap = { render: renderRecMap };`,
  '7: portal recMap module');

/* ------------------------------------------------------------------ *
 * 8 — finishWorkout: records carry canonical group + synergists
 * ------------------------------------------------------------------ */
rep('client.html',
`        return {
          key: lex.exercise_id,
          name: exData ? (exData['name_' + currentLang] || exData.name_en || dayEx.name) : (dayEx['name_' + currentLang] || dayEx.name_en || dayEx.name || lex.exercise_id),
          unit: (lex.unit === 'lb') ? 'lb' : 'kg',
          sets: (lex.sets || []).map(s => ({ weight: s.weight, reps: s.reps, time: s.time != null ? s.time : null, dist: s.dist != null ? s.dist : null, rpe: s.rpe, type: s.type, done: !!s.done }))
        };`,
`        return {
          key: lex.exercise_id,
          name: exData ? (exData['name_' + currentLang] || exData.name_en || dayEx.name) : (dayEx['name_' + currentLang] || dayEx.name_en || dayEx.name || lex.exercise_id),
          unit: (lex.unit === 'lb') ? 'lb' : 'kg',
          g: exData ? (recpCanonical(exData.group) || '') : '', /* c98: canonical group for the recovery map */
          syn: exData ? (exData.synergists || []).map(recpCanonical).filter(Boolean) : [], /* c98: canonical synergists (30% credit) */
          sets: (lex.sets || []).map(s => ({ weight: s.weight, reps: s.reps, time: s.time != null ? s.time : null, dist: s.dist != null ? s.dist : null, rpe: s.rpe, type: s.type, done: !!s.done }))
        };`,
  '8: finishWorkout g/syn');

/* ------------------------------------------------------------------ *
 * 9 — CRM: recoveryMap.computeForClient merges the portal's ps_hist
 * ------------------------------------------------------------------ */
rep('fitness-crm.html',
`      // Load all workouts for this client
      const workouts = await db.find('workout_history', 'by_clientId', clientId);
      if (!workouts || workouts.length === 0) {`,
`      // Load all workouts for this client
      let workouts = await db.find('workout_history', 'by_clientId', clientId);
      /* c98: merge the trainee portal's cloud history (ps_hist_<hash>) so the
         trainer's map includes portal-logged sessions — identical &
         interconnected with the portal's own map (4s offline guard,
         in-memory only, dedupe by date ts — the analytics pattern) */
      try {
        if (typeof window.dkFetchClientHistory === 'function') {
          const remote98 = await Promise.race([
            window.dkFetchClientHistory(clientId),
            new Promise(res => setTimeout(res, 4000))
          ]);
          if (remote98 && remote98.length) {
            const seen98 = new Set((workouts || []).map(w => Number(w.date || w.created_at) || 0));
            workouts = (workouts || []).concat(remote98.filter(r => !seen98.has(Number(r.date) || 0)));
          }
        }
      } catch (_) {}
      if (!workouts || workouts.length === 0) {`,
  '9: CRM computeForClient remote merge');

/* ------------------------------------------------------------------ *
 * 10 — CRM: synCanonical98 helper before dkPushClientHistory
 * ------------------------------------------------------------------ */
rep('fitness-crm.html',
`    window.dkPushClientHistory = async function (clientId, rec) {`,
`    /* c98: synergist string → canonical group (alias map from muscle-map.js) */
    function synCanonical98(s) {
      const k = String(s || '').trim().toLowerCase();
      if (!k) return '';
      try { const SC = window.SYNERGIST_CANONICAL; if (SC && SC[k]) return SC[k]; } catch (_) {}
      return ['chest', 'back', 'shoulders', 'elbow_flexors', 'triceps', 'forearms', 'abdominals', 'legs', 'stretching', 'warmup', 'calisthenics'].indexOf(k) !== -1 ? k : '';
    }
    window.dkPushClientHistory = async function (clientId, rec) {`,
  '10: synCanonical98 helper');

/* ------------------------------------------------------------------ *
 * 11 — CRM: dkPushClientHistory enriches the mirrored record with g/syn
 * ------------------------------------------------------------------ */
rep('fitness-crm.html',
`        recs = recs.filter(r => r && Number(r.ts) !== Number(rec.ts));
        recs.push(rec);`,
`        /* c98: enrich the mirrored workout with canonical group + synergists
           (the portal's recovery map uses them for the 30% synergist credit) */
        try {
          const _ids98 = new Set();
          (rec.exercises || []).forEach(ex => { if (ex && ex.key) _ids98.add(ex.key); });
          for (const id98 of _ids98) {
            if (!id98) continue;
            let ex98 = null;
            try { ex98 = await db.get('exercise_base', id98); } catch (_) {}
            if (!ex98) continue;
            const g98 = ex98.group_canonical || ex98.group_en || '';
            const syn98 = (ex98.synergist_muscles || []).map(synCanonical98).filter(Boolean);
            (rec.exercises || []).forEach(ex => { if (ex && ex.key === id98) { ex.g = g98; ex.syn = syn98; } });
          }
        } catch (_) {}
        recs = recs.filter(r => r && Number(r.ts) !== Number(rec.ts));
        recs.push(rec);`,
  '11: dkPushClientHistory g/syn');

/* ------------------------------------------------------------------ *
 * 12 — CRM: crmToPortalRec94 accepts the exercise info map + carries g/syn
 * ------------------------------------------------------------------ */
rep('fitness-crm.html',
`    /* c94: convert a CRM workout_history record to the portal schema */
    function crmToPortalRec94(record) {`,
`    /* c94: convert a CRM workout_history record to the portal schema
       (c98: exInfo = { exercise_id → {g, syn} } — canonical group +
       synergists so the portal's recovery map computes EXACTLY like the
       trainer's, including the 30% synergist credit) */
    function crmToPortalRec94(record, exInfo) {`,
  '12a: crmToPortalRec94 signature');

rep('fitness-crm.html',
`          exercises: exs.map(ex => ({
            key: ex.exercise_id,
            name: ex.name,
            group: ex.group || ex.muscle_group || '',
            unit: ex.unit === 'lb' ? 'lb' : 'kg',`,
`          exercises: exs.map(ex => ({
            key: ex.exercise_id,
            name: ex.name,
            group: ex.group || ex.muscle_group || '',
            g: (exInfo && exInfo[ex.exercise_id] && exInfo[ex.exercise_id].g) || '',
            syn: (exInfo && exInfo[ex.exercise_id] && exInfo[ex.exercise_id].syn) || [],
            unit: ex.unit === 'lb' ? 'lb' : 'kg',`,
  '12b: crmToPortalRec94 g/syn fields');

/* ------------------------------------------------------------------ *
 * 13 — CRM: dkSyncClientHistory builds the exercise info map
 * ------------------------------------------------------------------ */
rep('fitness-crm.html',
`        if (!clientId || !Array.isArray(crmRecs) || !crmRecs.length) return false;
        const recs = crmRecs.map(crmToPortalRec94).filter(Boolean);`,
`        if (!clientId || !Array.isArray(crmRecs) || !crmRecs.length) return false;
        /* c98: attach canonical group + synergists (from exercise_base) so the
           portal's recovery map credits synergists EXACTLY like the trainer's */
        const _ids98 = new Set();
        crmRecs.forEach(r => (r.exercises || []).forEach(ex => { if (ex && ex.exercise_id) _ids98.add(ex.exercise_id); }));
        const _exInfo98 = {};
        await Promise.all(Array.from(_ids98).map(async id => {
          try {
            const ex = await db.get('exercise_base', id);
            if (ex) _exInfo98[id] = { g: ex.group_canonical || ex.group_en || '', syn: (ex.synergist_muscles || []).map(synCanonical98).filter(Boolean) };
          } catch (_) {}
        }));
        const recs = crmRecs.map(r => crmToPortalRec94(r, _exInfo98)).filter(Boolean);`,
  '13: dkSyncClientHistory exInfo map');

/* ------------------------------------------------------------------ *
 * 14 — versions: c98 / RUNNING=98 / sw v125
 * ------------------------------------------------------------------ */
rep('fitness-crm.html',
`<meta name="dk-build" content="c97" />`,
`<meta name="dk-build" content="c98" />`,
  '14a: meta dk-build c98');

rep('fitness-crm.html',
`  var RUNNING = 97; /* numeric part of dk-build c97 */`,
`  var RUNNING = 98; /* numeric part of dk-build c98 */`,
  '14b: RUNNING = 98');

rep('sw.js',
`const CACHE_NAME = 'dk-gym-v124'; // c97`,
`const CACHE_NAME = 'dk-gym-v125'; // c98`,
  '14c: sw cache v125');

rep('sw.js',
`// v124: c97 — portal UX polish: (1) the recovery map re-translates INSTANTLY on a language switch (setLang now re-renders the 10 slot rows — before, only the static title/subtitle changed and the rows kept the old language until the tab was re-opened); (2) the per-exercise weight-unit header (кг/фт) and the cardio time/distance headers became REAL buttons with a visible outline in BOTH apps — tapping them opens only the unit sheet, never the whole exercise card anymore (the c96 header was a plain span whose tap bubbled to the card-open handler); (3) «Техника» became a real expand/collapse button that shows the technique in place — it used to be a <details><summary> whose tap opened the exercise card first, with the technique expanding only after the card was closed; (4) per-exercise unit header tooltips now say «unit of THIS exercise».`,
`// v124: c97 — portal UX polish: (1) the recovery map re-translates INSTANTLY on a language switch (setLang now re-renders the 10 slot rows — before, only the static title/subtitle changed and the rows kept the old language until the tab was re-opened); (2) the per-exercise weight-unit header (кг/фт) and the cardio time/distance headers became REAL buttons with a visible outline in BOTH apps — tapping them opens only the unit sheet, never the whole exercise card anymore (the c96 header was a plain span whose tap bubbled to the card-open handler); (3) «Техника» became a real expand/collapse button that shows the technique in place — it used to be a <details><summary> whose tap opened the exercise card first, with the technique expanding only after the card was closed; (4) per-exercise unit header tooltips now say «unit of THIS exercise».
// v125: c98 — the portal's «Карта восстановления» is now the REAL recovery map, identical to the trainer CRM's (recoveryMap): same SVG body (front/back/side) with per-muscle heat colors, same 6-day exponential decay (100·(1−e^(−days/3))), same status buckets (fresh ≥85 / recovering ≥50 / fatigued), same done-sets-only volume and 30% synergist credit, mode tabs Recovery/7d/30d; data = the shared ps_hist workout history, and the trainer's map now ALSO merges the portal's cloud history (in-memory, 4s guard) — identical & interconnected in BOTH directions; portal workout records + CRM backfills carry canonical group + synergists (g/syn) so the credit matches exactly; the 10 save slots stay under «Ячейки сохранения» below the map.`,
  '14d: sw history line');

console.log(fails ? `\n${fails} FAILURES` : '\nAll c98 patches applied ✓');
process.exit(fails ? 1 : 0);
