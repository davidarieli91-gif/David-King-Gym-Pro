#!/usr/bin/env node
/* ============================================================================
 * fix-c92.cjs — personal analytics in the trainee portal («Аналитика» tab)
 *
 * USER REQUEST: «добавить личную аналитику в портал подопечного, вместо
 * кнопки прогресс, рядом с кнопкой питание на нижней панели».
 *
 * The portal's third bottom-nav tab («Прогресс») was only a morning check-in
 * form — no real analytics. This release REPLACES that tab with a full
 * personal analytics view (same visual language as the trainer CRM analytics
 * screen, but fed from the portal's own localStorage data):
 *   • range chips (Week / Month / All) + 4 metric cards:
 *     workouts in range (+total), active days, streak 🔥, volume kg (+minutes)
 *   • activity calendar heatmap (last 7 / 35 / 56 days, workout vs check-in)
 *   • volume per muscle group — canonical groups + 3-language labels
 *     (same dictionary as CRM c91; resolves exercise group from the share's
 *     exerciseDB → current program day → legacy-string reverse map → other)
 *   • body-weight SVG trend from dk_checkins (+ dashed target line, delta chip)
 *   • recent workouts list (date · program·day · kg · done/total · min)
 *   • the morning check-in form + measurement history are KEPT at the bottom
 *     (daily data entry is not lost — the tab is replaced, not the feature)
 *
 * Versions: meta dk-build c91→c92, login footer c91→c92, RUNNING 91→92,
 * sw dk-gym-v118→v119 (+history line).
 * ==========================================================================*/
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const FILE = path.join(ROOT, 'fitness-crm.html');
const CLIENT = path.join(ROOT, 'client.html');
const SW = path.join(ROOT, 'sw.js');
let html = fs.readFileSync(FILE, 'utf8');
let clientHtml = fs.readFileSync(CLIENT, 'utf8');
let sw = fs.readFileSync(SW, 'utf8');
const fails = [];
let patched = 0;

function repOnce(name, anchor, replacement) {
  const idx = html.indexOf(anchor);
  if (idx === -1) { fails.push(`[${name}] anchor NOT FOUND`); return; }
  if (html.indexOf(anchor, idx + 1) !== -1) { fails.push(`[${name}] anchor NOT UNIQUE`); return; }
  html = html.slice(0, idx) + replacement + html.slice(idx + anchor.length);
  patched++;
  console.log(`OK  ${name}`);
}
function repOnceClient(name, anchor, replacement) {
  const idx = clientHtml.indexOf(anchor);
  if (idx === -1) { fails.push(`[${name}] anchor NOT FOUND (client)`); return; }
  if (clientHtml.indexOf(anchor, idx + 1) !== -1) { fails.push(`[${name}] anchor NOT UNIQUE (client)`); return; }
  clientHtml = clientHtml.slice(0, idx) + replacement + clientHtml.slice(idx + anchor.length);
  patched++;
  console.log(`OK  ${name} (client)`);
}
function repOnceSw(name, anchor, replacement) {
  const idx = sw.indexOf(anchor);
  if (idx === -1) { fails.push(`[${name}] anchor NOT FOUND (sw)`); return; }
  if (sw.indexOf(anchor, idx + 1) !== -1) { fails.push(`[${name}] anchor NOT UNIQUE (sw)`); return; }
  sw = sw.slice(0, idx) + replacement + sw.slice(idx + anchor.length);
  patched++;
  console.log(`OK  ${name} (sw)`);
}
function includesClient(needle, label) {
  if (!clientHtml.includes(needle)) { fails.push(`[${label}] sanity needle missing: ${needle.slice(0, 60)}`); }
}

/* ============================================================
 * 1. Tab section: #tab-checkin → #tab-analytics with analytics cards
 *    on top; the check-in form + history stay at the bottom.
 * ============================================================ */
repOnceClient('1 tab section open', '    <section id="tab-checkin" class="hidden space-y-3 fade-in">', [
  '    <section id="tab-analytics" class="hidden space-y-3 fade-in">',
  '      <!-- ======== PERSONAL ANALYTICS (c92) ======== -->',
  '      <div class="glass rounded-2xl p-4 space-y-4">',
  '        <div class="flex items-center justify-between gap-2">',
  '          <h3 class="font-display font-bold text-sm text-text" id="txt-analytics-title">Личная аналитика</h3>',
  '          <div class="flex bg-[rgb(var(--c-surface-2))] rounded-xl p-0.5 gap-0.5 shrink-0" role="tablist" aria-label="Analytics range">',
  '            <button id="a-chip-week" data-range="week" class="a-chip text-[10px] font-bold px-2.5 py-1 rounded-lg transition text-muted">Неделя</button>',
  '            <button id="a-chip-month" data-range="month" class="a-chip text-[10px] font-bold px-2.5 py-1 rounded-lg transition text-muted">Месяц</button>',
  '            <button id="a-chip-all" data-range="all" class="a-chip text-[10px] font-bold px-2.5 py-1 rounded-lg transition text-muted">Всё</button>',
  '          </div>',
  '        </div>',
  '        <div class="grid grid-cols-2 gap-2" id="analytics-metrics"></div>',
  '        <div class="space-y-2">',
  '          <div class="flex items-center justify-between gap-2">',
  '            <h4 class="text-[11px] uppercase tracking-wider text-muted font-semibold" id="txt-analytics-activity">Активность</h4>',
  '            <div class="flex items-center gap-3 text-[10px] text-muted">',
  '              <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-sm bg-indigo-500 inline-block"></span><span id="a-lg-workout">тренировка</span></span>',
  '              <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-sm bg-cyan-400/40 inline-block"></span><span id="a-lg-checkin">чек-ин</span></span>',
  '            </div>',
  '          </div>',
  '          <div id="analytics-calendar"></div>',
  '        </div>',
  '      </div>',
  '      <div class="glass rounded-2xl p-4 space-y-2">',
  '        <h3 class="font-display font-bold text-sm text-text" id="txt-analytics-muscles">Объём по группам мышц</h3>',
  '        <div id="analytics-muscles" class="space-y-2.5"></div>',
  '      </div>',
  '      <div class="glass rounded-2xl p-4 space-y-2">',
  '        <div class="flex items-center justify-between gap-2">',
  '          <h3 class="font-display font-bold text-sm text-text" id="txt-analytics-weight">Динамика веса</h3>',
  '          <span id="weight-delta" class="font-mono text-xs font-bold shrink-0"></span>',
  '        </div>',
  '        <div id="analytics-weight-chart"></div>',
  '      </div>',
  '      <div class="glass rounded-2xl p-4 space-y-2">',
  '        <h3 class="font-display font-bold text-sm text-text" id="txt-analytics-recent">Последние тренировки</h3>',
  '        <div id="analytics-recent" class="space-y-1.5 max-h-72 overflow-y-auto"></div>',
  '      </div>',
  '      <!-- ======== /PERSONAL ANALYTICS ======== -->'
].join('\n'));

/* ============================================================
 * 2. Bottom nav button: «Прогресс» → «Аналитика» (bar-chart icon)
 * ============================================================ */
repOnceClient('2 nav button', [
  '    <button data-tab="checkin" class="nav-tab tab-btn flex flex-col items-center gap-0.5 text-muted py-1 px-3">',
  '      <svg class="tab-icon w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
  '      <span class="tab-label text-[9px] font-semibold" id="nav-checkin">Прогресс</span>',
  '    </button>'
].join('\n'), [
  '    <button data-tab="analytics" class="nav-tab tab-btn flex flex-col items-center gap-0.5 text-muted py-1 px-3">',
  '      <svg class="tab-icon w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
  '      <span class="tab-label text-[9px] font-semibold" id="nav-analytics">Аналитика</span>',
  '    </button>'
].join('\n'));

/* ============================================================
 * 3. i18n dictionaries — RU / EN / HE
 * ============================================================ */
repOnceClient('3a i18n ru', "      navWorkouts:'Тренировки',navNutrition:'Питание',navCheckin:'Прогресс',", [
  "      navWorkouts:'Тренировки',navNutrition:'Питание',navAnalytics:'Аналитика',",
  "      aTitle:'Личная аналитика',aRangeWeek:'Неделя',aRangeMonth:'Месяц',aRangeAll:'Всё',",
  "      mWorkouts:'Тренировки',mActiveDays:'Активные дни',mStreak:'Серия',mVolume:'Объём',",
  "      aTotal:'всего',aInRange:'за период',aDaysInRow:'дн. подряд',aNoStreak:'начните сегодня!',aMinutes:'мин',",
  "      aActivity:'Активность',aCalWorkout:'тренировка',aCalCheckin:'чек-ин',",
  "      aMuscles:'Объём по группам мышц',aWeightT:'Динамика веса',aWeightNeed:'Нужно ≥ 2 чек-ина с весом для графика',aTarget:'цель',",
  "      aRecent:'Последние тренировки',aNoWorkouts:'Пока нет тренировок — завершите первую!',aNoData:'Нет данных за период',",
  "      aWaist:'Талия (см)',aHip:'Бёдра (см)',aNote:'Заметка тренеру',"
].join('\n'));

repOnceClient('3b i18n en', "      navWorkouts:'Workouts',navNutrition:'Nutrition',navCheckin:'Progress',", [
  "      navWorkouts:'Workouts',navNutrition:'Nutrition',navAnalytics:'Analytics',",
  "      aTitle:'My Analytics',aRangeWeek:'Week',aRangeMonth:'Month',aRangeAll:'All',",
  "      mWorkouts:'Workouts',mActiveDays:'Active days',mStreak:'Streak',mVolume:'Volume',",
  "      aTotal:'total',aInRange:'in range',aDaysInRow:'days streak',aNoStreak:'start today!',aMinutes:'min',",
  "      aActivity:'Activity',aCalWorkout:'workout',aCalCheckin:'check-in',",
  "      aMuscles:'Volume by Muscle Group',aWeightT:'Body Weight Trend',aWeightNeed:'Need at least 2 weight check-ins for the chart',aTarget:'target',",
  "      aRecent:'Recent Workouts',aNoWorkouts:'No workouts yet — finish your first one!',aNoData:'No data for this period',",
  "      aWaist:'Waist (cm)',aHip:'Hips (cm)',aNote:'Note to coach',"
].join('\n'));

repOnceClient('3c i18n he', "      navWorkouts:'אימונים',navNutrition:'תזונה',navCheckin:'התקדמות',", [
  "      navWorkouts:'אימונים',navNutrition:'תזונה',navAnalytics:'אנליטיקה',",
  "      aTitle:'האנליטיקה שלי',aRangeWeek:'שבוע',aRangeMonth:'חודש',aRangeAll:'הכול',",
  "      mWorkouts:'אימונים',mActiveDays:'ימים פעילים',mStreak:'רצף',mVolume:'נפח',",
  "      aTotal:'בסך הכול',aInRange:'בתקופה',aDaysInRow:'ימים ברצף',aNoStreak:'התחילו היום!',aMinutes:'דק׳',",
  "      aActivity:'פעילות',aCalWorkout:'אימון',aCalCheckin:'צ׳ק-אין',",
  "      aMuscles:'נפח לפי קבוצות שרירים',aWeightT:'מגמת משקל',aWeightNeed:'צריך לפחות 2 צ׳ק-אינים עם משקל לגרף',aTarget:'יעד',",
  "      aRecent:'אימונים אחרונים',aNoWorkouts:'עדיין אין אימונים — סיימו את הראשון!',aNoData:'אין נתונים לתקופה',",
  "      aWaist:'מותן (ס״מ)',aHip:'ירכיים (ס״מ)',aNote:'פתק למאמן',"
].join('\n'));

/* ============================================================
 * 4. Check-in card labels get ids + i18n (they were hard-coded RU)
 * ============================================================ */
repOnceClient('4a lbl waist', '<label class="block text-xs text-muted mb-1">Талия (см)</label>',
  '<label class="block text-xs text-muted mb-1" id="lbl-waist">Талия (см)</label>');
repOnceClient('4b lbl hip', '<label class="block text-xs text-muted mb-1">Бёдра (см)</label>',
  '<label class="block text-xs text-muted mb-1" id="lbl-hip">Бёдра (см)</label>');
repOnceClient('4c lbl energy', '<label class="text-xs text-muted">Энергия</label>',
  '<label class="text-xs text-muted" id="lbl-energy">Энергия</label>');
repOnceClient('4d lbl note', '<label class="block text-xs text-muted mb-1">Заметка тренеру</label>',
  '<label class="block text-xs text-muted mb-1" id="lbl-note">Заметка тренеру</label>');

/* ============================================================
 * 5. updateLabels() — nav label + all analytics static labels
 * ============================================================ */
repOnceClient('5 updateLabels', "    document.getElementById('nav-checkin').textContent = t('navCheckin');", [
  "    document.getElementById('nav-analytics').textContent = t('navAnalytics');",
  "    document.getElementById('txt-analytics-title').textContent = t('aTitle');",
  "    document.getElementById('a-chip-week').textContent = t('aRangeWeek');",
  "    document.getElementById('a-chip-month').textContent = t('aRangeMonth');",
  "    document.getElementById('a-chip-all').textContent = t('aRangeAll');",
  "    document.getElementById('txt-analytics-activity').textContent = t('aActivity');",
  "    document.getElementById('a-lg-workout').textContent = t('aCalWorkout');",
  "    document.getElementById('a-lg-checkin').textContent = t('aCalCheckin');",
  "    document.getElementById('txt-analytics-muscles').textContent = t('aMuscles');",
  "    document.getElementById('txt-analytics-weight').textContent = t('aWeightT');",
  "    document.getElementById('txt-analytics-recent').textContent = t('aRecent');",
  "    document.getElementById('lbl-waist').textContent = t('aWaist');",
  "    document.getElementById('lbl-hip').textContent = t('aHip');",
  "    document.getElementById('lbl-energy').textContent = t('reportEnergy');",
  "    document.getElementById('lbl-note').textContent = t('aNote');"
].join('\n'));

/* ============================================================
 * 6. Tab switch handler: analytics id + lazy render
 * ============================================================ */
repOnceClient('6 tab handler', [
  "        ['workouts','nutrition','checkin'].forEach(id=>{",
  "          const sec = document.getElementById('tab-'+id);",
  "          if (sec) { sec.classList.toggle('hidden', id!==tab.dataset.tab); if(!sec.classList.contains('hidden')) sec.classList.add('fade-in'); }",
  '        });'
].join('\n'), [
  "        ['workouts','nutrition','analytics'].forEach(id=>{",
  "          const sec = document.getElementById('tab-'+id);",
  "          if (sec) { sec.classList.toggle('hidden', id!==tab.dataset.tab); if(!sec.classList.contains('hidden')) sec.classList.add('fade-in'); }",
  '        });',
  "        if (tab.dataset.tab === 'analytics') renderAnalytics();"
].join('\n'));

/* ============================================================
 * 7. renderAll() + saveCheckin() refresh the analytics
 * ============================================================ */
repOnceClient('7a renderAll hook',
  '    updateLabels(); updateWaterUI(); prefillCheckin(); renderHistory(); refreshDone();',
  '    updateLabels(); updateWaterUI(); prefillCheckin(); renderHistory(); renderAnalytics(); refreshDone();');

repOnceClient('7b saveCheckin hook', [
  "    st.textContent = t('checkinSaved'); st.className = 'text-[11px] text-center text-emerald-400 min-h-[1rem]';",
  '    renderHistory();'
].join('\n'), [
  "    st.textContent = t('checkinSaved'); st.className = 'text-[11px] text-center text-emerald-400 min-h-[1rem]';",
  '    renderHistory();',
  '    renderAnalytics();'
].join('\n'));

/* ============================================================
 * 8. The analytics module (before the CHECK-IN section)
 * ============================================================ */
repOnceClient('8 analytics module', '  /* ============ CHECK-IN ============ */', [
  '  /* ============ PERSONAL ANALYTICS (c92) ============ */',
  '  let analyticsRange = \'week\';',
  '  const A_LOCALE = { ru: \'ru-RU\', en: \'en-US\', he: \'he-IL\' };',
  '  function aLoc() { return A_LOCALE[currentLang] || \'en-US\'; }',
  '  function aNum(v) { try { return Math.round(v).toLocaleString(aLoc()); } catch (e) { return String(Math.round(v)); } }',
  '  function aDateKey(d) { const dt = new Date(d); return isNaN(dt) ? \'\' : dt.toISOString().slice(0, 10); }',
  '  /* One canonical key per muscle group + 3-language labels (same dictionary',
  '     as the trainer CRM analytics — c91), so volume from programs built under',
  '     different UI languages merges into ONE bar per muscle. */',
  '  const MG_I18N = {',
  "    abdominals: { en: 'Abdominals', ru: 'Мышцы кора', he: 'שרירי ליבה' },",
  "    back: { en: 'Back', ru: 'Спина', he: 'גב' },",
  "    chest: { en: 'Chest', ru: 'Грудь', he: 'חזה' },",
  "    elbow_flexors: { en: 'Elbow Flexors', ru: 'Сгибатели локтя', he: 'כופפי מרפק' },",
  "    forearms: { en: 'Forearms', ru: 'Предплечья', he: 'אמות' },",
  "    fullbody: { en: 'Full Body', ru: 'Всё тело', he: 'כל הגוף' },",
  "    legs: { en: 'Legs', ru: 'Ноги', he: 'רגליים' },",
  "    shoulders: { en: 'Shoulders', ru: 'Плечи', he: 'כתפיים' },",
  "    stretching: { en: 'Stretching', ru: 'Растяжка', he: 'מתיחות' },",
  "    triceps: { en: 'Triceps', ru: 'Разгибатели локтя', he: 'פושטי מרפק' },",
  "    warmup: { en: 'Warmup', ru: 'Разминка', he: 'חימום' },",
  "    other: { en: 'Other', ru: 'Другое', he: 'אחר' }",
  '  };',
  '  const MG_REVERSE = (function () {',
  '    const m = {};',
  "    Object.keys(MG_I18N).forEach(k => { m[k] = k; ['en', 'ru', 'he'].forEach(l => { m[String(MG_I18N[k][l]).toLowerCase()] = k; }); });",
  "    m['abs'] = 'abdominals'; m['пресс'] = 'abdominals'; m['core'] = 'abdominals';",
  "    m['трицепс'] = 'triceps'; m['бицепс'] = 'elbow_flexors'; m['biceps'] = 'elbow_flexors';",
  "    m['все тело'] = 'fullbody'; m['leg'] = 'legs'; m['shoulder'] = 'shoulders';",
  "    m['forearm'] = 'forearms'; m['warm up'] = 'warmup'; m['קדמי הזרוע'] = 'forearms';",
  '    return m;',
  '  })();',
  '  function mgKeyOf(name) {',
  "    if (!name) return '';",
  "    return MG_REVERSE[String(name).trim().toLowerCase()] || '';",
  '  }',
  '  function mgLabel(key) {',
  "    const g = MG_I18N[String(key || '').toLowerCase()];",
  "    return g ? (g[currentLang] || g.en) : (key || MG_I18N.other[currentLang]);",
  '  }',
  "  function aRangeDays() { return analyticsRange === 'week' ? 7 : analyticsRange === 'month' ? 30 : 100000; }",
  '  /* Resolve a history exercise → canonical muscle group:',
  "     exerciseDB[key].group (canonical from the trainer's share) →",
  "     ANY loaded program's day exercise group (history may reference an",
  '     older/other program — searching only the ACTIVE one left exercises',
  '     from other programs stuck in the «Other» bucket) →',
  '     reverse map over the exercise name → other */',
  '  function aGroupOf(ex) {',
  '    const exd = exerciseDB[ex.key] || exerciseDB[String(ex.key)] || null;',
  '    if (exd && exd.group) { const k = mgKeyOf(exd.group); if (k) return k; }',
  '    const progList = [];',
  '    if (currentProgram) progList.push(currentProgram);',
  '    (programs || []).forEach(p => { if (p && p !== currentProgram) progList.push(p); });',
  '    for (const prog of progList) {',
  '      const days = prog.workout_days || prog.days || [];',
  '      for (const d of days) {',
  "        const de = (d.exercises || []).find(x => String(x.exercise_id || x.id || '') === String(ex.key));",
  '        if (de && de.group) { const k = mgKeyOf(de.group); if (k) return k; }',
  '      }',
  '    }',
  "    return mgKeyOf(ex.name) || 'other';",
  '  }',
  '  function aAnalytics() {',
  '    const hist = loadHistory();',
  '    const checks = loadCheckins();',
  '    const days = aRangeDays();',
  "    const fromTs = analyticsRange === 'all' ? 0 : Date.now() - days * 86400000;",
  '    const wf = hist.filter(r => (r.ts || Date.parse(r.date) || 0) >= fromTs);',
  '    let volume = 0, minutes = 0;',
  '    wf.forEach(r => {',
  '      let v = Number(r.volume) || 0;',
  '      if (!v) (r.exercises || []).forEach(ex => { v += exDoneVolume(ex.sets).v; });',
  '      volume += v;',
  '      minutes += (Number(r.duration_sec) || 0) / 60;',
  '    });',
  '    const allDates = new Set();',
  '    hist.forEach(r => { const k = aDateKey(r.ts || r.date); if (k) allDates.add(k); });',
  '    checks.forEach(c => { const k = aDateKey(c.ts || c.date); if (k) allDates.add(k); });',
  '    const active = new Set();',
  '    allDates.forEach(k => { if (k >= aDateKey(Date.now() - days * 86400000)) active.add(k); });',
  '    let streak = 0;',
  '    const cur = new Date();',
  '    if (!allDates.has(aDateKey(cur.getTime()))) cur.setDate(cur.getDate() - 1);',
  '    if (allDates.has(aDateKey(cur.getTime()))) {',
  '      while (allDates.has(aDateKey(cur.getTime()))) { streak++; cur.setDate(cur.getDate() - 1); }',
  '    }',
  '    return { wf, volume, minutes: Math.round(minutes), activeDays: active.size, streak, total: hist.length };',
  '  }',
  '  function renderAnalytics() {',
  '    const a = aAnalytics();',
  '    renderAMetrics(a); renderACalendar(); renderAMuscles(a); renderAWeight(); renderARecent();',
  '  }',
  '  function renderAMetrics(a) {',
  "    const box = document.getElementById('analytics-metrics'); if (!box) return;",
  '    const cards = [',
  "      { v: String(a.wf.length), l: t('mWorkouts'), s: t('aTotal') + ': ' + a.total },",
  "      { v: String(a.activeDays), l: t('mActiveDays'), s: t('aInRange') },",
  "      { v: String(a.streak), l: t('mStreak'), s: a.streak > 0 ? (a.streak + ' ' + t('aDaysInRow')) : t('aNoStreak') },",
  "      { v: aNum(a.volume), l: t('mVolume'), s: a.minutes + ' ' + t('aMinutes') }",
  '    ];',
  '    box.innerHTML = cards.map(c => `',
  '      <div class="bg-[rgb(var(--c-surface-2))] border border-border rounded-2xl py-3 px-2 text-center">',
  '        <div class="font-mono font-extrabold text-lg text-text leading-tight">${esc(c.v)}</div>',
  '        <div class="text-[10px] font-semibold text-muted mt-0.5">${esc(c.l)}</div>',
  '        <div class="text-[10px] text-muted opacity-70 mt-0.5 truncate">${esc(c.s)}</div>',
  '      </div>`).join(\'\');',
  '  }',
  '  function renderACalendar() {',
  "    const box = document.getElementById('analytics-calendar'); if (!box) return;",
  "    const n = analyticsRange === 'week' ? 7 : analyticsRange === 'month' ? 35 : 56;",
  '    const wfKeys = new Set(loadHistory().map(r => aDateKey(r.ts || r.date)).filter(Boolean));',
  '    const ckKeys = new Set(loadCheckins().map(c => aDateKey(c.ts || c.date)).filter(Boolean));',
  '    const cells = [];',
  '    const today = new Date();',
  '    for (let i = n - 1; i >= 0; i--) {',
  '      const d = new Date(today); d.setDate(today.getDate() - i);',
  '      const k = aDateKey(d.getTime());',
  '      const hasW = wfKeys.has(k), hasC = ckKeys.has(k);',
  "      let cls, mark = '';",
  "      if (hasW) { cls = 'bg-indigo-500 text-white font-bold'; mark = '✓'; }",
  "      else if (hasC) { cls = 'bg-cyan-400/25 text-cyan-300'; mark = '·'; }",
  "      else cls = 'bg-[rgb(var(--c-surface-2))] text-muted';",
  "      const isToday = i === 0;",
  "      const wd = d.toLocaleDateString(aLoc(), { weekday: 'narrow' });",
  '      cells.push(`',
  '        <div class="flex flex-col items-center gap-0.5 min-w-0">',
  '          <span class="text-[8px] text-muted uppercase leading-none">${esc(wd)}</span>',
  '          <span class="text-[9px] text-muted leading-none">${d.getDate()}</span>',
  "          <span class=\"w-full h-7 rounded-md grid place-items-center text-[10px] ${cls} ${isToday ? 'ring-1 ring-cyan-400' : ''}\" title=\"${esc(k)}${hasW ? ' · ' + esc(t('aCalWorkout')) : ''}${hasC ? ' · ' + esc(t('aCalCheckin')) : ''}\">${mark}</span>",
  '        </div>`);',
  '    }',
  "    box.innerHTML = `<div class=\"grid grid-cols-7 gap-1\">${cells.join('')}</div>`;",
  '  }',
  '  function renderAMuscles(a) {',
  "    const box = document.getElementById('analytics-muscles'); if (!box) return;",
  '    const byGroup = new Map();',
  '    a.wf.forEach(r => (r.exercises || []).forEach(ex => {',
  '      const v = exDoneVolume(ex.sets).v;',
  '      if (!v) return;',
  '      const g = aGroupOf(ex);',
  '      byGroup.set(g, (byGroup.get(g) || 0) + v);',
  '    }));',
  "    if (!byGroup.size) { box.innerHTML = '<p class=\"text-xs text-muted text-center py-4\">' + esc(t('aNoData')) + '</p>'; return; }",
  '    const sorted = [...byGroup.entries()].sort((x, y) => y[1] - x[1]);',
  '    const max = sorted[0][1] || 1;',
  '    box.innerHTML = sorted.map(([g, v]) => `',
  '      <div>',
  '        <div class="flex justify-between text-[11px] mb-1">',
  '          <span class="font-semibold text-text">${esc(mgLabel(g))}</span>',
  "          <span class=\"font-mono text-muted\">${aNum(v)} ${esc(t('volumeKg'))}</span>",
  '        </div>',
  '        <div class="h-2 bg-[rgb(var(--c-surface-2))] rounded-full overflow-hidden">',
  '          <div class="h-full rounded-full" style="width:${Math.max(3, Math.round(v / max * 100))}%;background:linear-gradient(90deg,#6366f1,#22d3ee)"></div>',
  '        </div>',
  '      </div>`).join(\'\');',
  '  }',
  '  function renderAWeight() {',
  "    const box = document.getElementById('analytics-weight-chart'); if (!box) return;",
  "    const deltaBox = document.getElementById('weight-delta');",
  "    const pts = loadCheckins().filter(c => Number(c.weight) > 0).slice(-30);",
  '    if (pts.length < 2) {',
  "      box.innerHTML = '<p class=\"text-xs text-muted text-center py-4\">' + esc(t('aWeightNeed')) + '</p>';",
  "      if (deltaBox) deltaBox.innerHTML = '';",
  '      return;',
  '    }',
  '    const W = 320, H = 130, L = 34, R = 10, T = 14, B = 22;',
  '    const ws = pts.map(p => Number(p.weight));',
  '    let mn = Math.min.apply(null, ws), mx = Math.max.apply(null, ws);',
  '    const tw = currentClient ? Number(currentClient.target_weight) : 0;',
  '    if (tw > 0) { mn = Math.min(mn, tw); mx = Math.max(mx, tw); }',
  '    const pad = Math.max(0.8, (mx - mn) * 0.15); mn -= pad; mx += pad;',
  "    const X = i => L + (W - L - R) * (i / (pts.length - 1));",
  '    const Y = v => T + (H - T - B) * (1 - (v - mn) / (mx - mn));',
  "    const line = pts.map((p, i) => X(i).toFixed(1) + ',' + Y(ws[i]).toFixed(1)).join(' ');",
  '    const area = L + \',\' + (H - B) + \' \' + line + \' \' + (W - R) + \',\' + (H - B);',
  '    const dots = pts.map((p, i) => \'<circle cx="\' + X(i).toFixed(1) + \'" cy="\' + Y(ws[i]).toFixed(1) + \'" r="2.6" fill="#22d3ee" />\').join(\'\');',
  '    let target = \'\';',
  '    if (tw > 0 && tw >= mn && tw <= mx) {',
  '      target = \'<line x1="\' + L + \'" y1="\' + Y(tw).toFixed(1) + \'" x2="\' + (W - R) + \'" y2="\' + Y(tw).toFixed(1) + \'" stroke="#f59e0b" stroke-width="1" stroke-dasharray="4 3" opacity="0.8" /><text x="\' + (W - R) + \'" y="\' + (Y(tw) - 4).toFixed(1) + \'" text-anchor="end" font-size="9" fill="#f59e0b">\' + esc(t(\'aTarget\')) + \' \' + tw + \'</text>\';',
  '    }',
  '    const grid = [0.25, 0.5, 0.75].map(f => {',
  '      const y = (T + (H - T - B) * f).toFixed(1);',
  '      return \'<line x1="\' + L + \'" y1="\' + y + \'" x2="\' + (W - R) + \'" y2="\' + y + \'" stroke="rgba(255,255,255,0.06)" stroke-width="1" />\';',
  '    }).join(\'\');',
  '    box.innerHTML = \'<svg viewBox="0 0 \' + W + \' \' + H + \'" class="w-full h-auto" style="direction:ltr" role="img" aria-label="\' + esc(t(\'aWeightT\')) + \'">\' +',
  "      '<defs><linearGradient id=\"a-wg\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0%\" stop-color=\"#22d3ee\" stop-opacity=\"0.25\" /><stop offset=\"100%\" stop-color=\"#22d3ee\" stop-opacity=\"0\" /></linearGradient></defs>' +",
  "      grid + '<polygon points=\"' + area + '\" fill=\"url(#a-wg)\" />' +",
  "      '<polyline points=\"' + line + '\" fill=\"none\" stroke=\"#22d3ee\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\" />' +",
  '      target + dots +',
  '      \'<text x="\' + X(0).toFixed(1) + \'" y="\' + (H - 8).toFixed(1) + \'" font-size="9" fill="#94a3b8">\' + esc(pts[0].date.slice(5)) + \'</text>\' +',
  '      \'<text x="\' + X(pts.length - 1).toFixed(1) + \'" y="\' + (H - 8).toFixed(1) + \'" text-anchor="end" font-size="9" fill="#94a3b8">\' + esc(pts[pts.length - 1].date.slice(5)) + \'</text>\' +',
  '      \'<text x="\' + (L - 4) + \'" y="\' + (Y(ws[0]) + 3).toFixed(1) + \'" text-anchor="end" font-size="9" fill="#94a3b8">\' + ws[0] + \'</text>\' +',
  "      '</svg>';",
  '    const d = +(ws[ws.length - 1] - ws[0]).toFixed(1);',
  "    if (deltaBox) deltaBox.innerHTML = d === 0 ? '<span class=\"text-muted\">=</span>' : (d > 0 ? '<span class=\"text-amber-400\">▲ +' + d + '</span>' : '<span class=\"text-emerald-400\">▼ ' + d + '</span>');",
  '  }',
  '  function renderARecent() {',
  "    const box = document.getElementById('analytics-recent'); if (!box) return;",
  '    const list = loadHistory().slice(-5).reverse();',
  "    if (!list.length) { box.innerHTML = '<p class=\"text-xs text-muted text-center py-4\">' + esc(t('aNoWorkouts')) + '</p>'; return; }",
  '    box.innerHTML = list.map(r => {',
  '      let v = Number(r.volume) || 0; if (!v) (r.exercises || []).forEach(ex => { v += exDoneVolume(ex.sets).v; });',
  '      const mins = Math.round((Number(r.duration_sec) || 0) / 60);',
  "      const done = r.done_sets != null ? r.done_sets : (r.exercises || []).reduce((s, ex) => s + exDoneVolume(ex.sets).d, 0);",
  '      const tot = r.total_sets != null ? r.total_sets : (r.exercises || []).reduce((s, ex) => s + (ex.sets || []).length, 0);',
  '      return `<div class="flex items-center gap-2 bg-[rgb(var(--c-surface-2))]/60 px-3 py-2 rounded-xl text-xs">',
  '        <div class="flex-1 min-w-0">',
  "          <div class=\"text-text font-semibold truncate\">${esc((r.program || '') + (r.day_letter ? ' · ' + r.day_letter : ''))}</div>",
  '          <div class="text-[10px] text-muted mt-0.5">${esc(fmtDay(r.ts || r.date))}</div>',
  '        </div>',
  "        <span class=\"font-mono text-muted shrink-0 text-end\">${aNum(v)} ${esc(t('volumeKg'))} · ${done}/${tot} · ${mins} ${esc(t('aMinutes'))}</span>",
  '      </div>`;',
  '    }).join(\'\');',
  '  }',
  '',
  '  /* ============ CHECK-IN ============ */'
].join('\n'));

/* ============================================================
 * 9. Range chips wiring (before the Water listeners)
 * ============================================================ */
repOnceClient('9 chip wiring', [
  '    // Water',
  "    document.getElementById('btn-water-plus').addEventListener('click',()=>setWater(waterGlasses+1));"
].join('\n'), [
  '    // Analytics range chips (c92)',
  "    document.querySelectorAll('.a-chip').forEach(b=>b.addEventListener('click',()=>{",
  "      analyticsRange = b.dataset.range || 'week';",
  "      document.querySelectorAll('.a-chip').forEach(x=>{",
  '        const on = x===b;',
  "        x.classList.toggle('bg-indigo-500', on); x.classList.toggle('text-white', on);",
  "        x.classList.toggle('text-muted', !on);",
  '      });',
  '      renderAnalytics();',
  '    }));',
  "    const aDefChip = document.getElementById('a-chip-week');",
  "    if (aDefChip) { aDefChip.classList.add('bg-indigo-500','text-white'); aDefChip.classList.remove('text-muted'); }",
  '',
  '    // Water',
  "    document.getElementById('btn-water-plus').addEventListener('click',()=>setWater(waterGlasses+1));"
].join('\n'));

/* ============================================================
 * Sanity needles
 * ============================================================ */
includesClient("id=\"tab-analytics\"", 'sanity tab-analytics');
includesClient('renderAnalytics();', 'sanity renderAnalytics');
includesClient('navAnalytics', 'sanity navAnalytics');
includesClient("data-tab=\"analytics\"", 'sanity data-tab analytics');

/* ============================================================
 * Versions — c91 → c92, sw v118 → v119
 * ============================================================ */
repOnce('v meta', '<meta name="dk-build" content="c91" />', '<meta name="dk-build" content="c92" />');
repOnce('v footer', '3 languages · c91</p>', '3 languages · c92</p>');
repOnce('v RUNNING',
  'var RUNNING = 91; /* numeric part of dk-build c91 */',
  'var RUNNING = 92; /* numeric part of dk-build c92 */');

repOnceSw('v sw cache+history', [
  "// v118: c91 — rest seconds finally survive every path: program day → live workout (startWorkoutFromProgram dropped rest_sec, always fell back to 90), program editor re-open (openProgramEditor dropped rest_sec/cardio/superset/set types — re-saving baked 90 into the stored program, which the portal then also showed), template save/start/apply, history reuse (finish() didn't store rest_sec) — and every reader is 0-safe now (a stored 0 no longer flips to 90). Analytics «התפלגות שרירים» muscle names follow the UI language (RU/HE/EN) instead of echoing the build-time frozen string; records built under different languages merge by canonical group.",
  "const CACHE_NAME = 'dk-gym-v118';"
].join('\n'), [
  "// v119: c92 — personal analytics in the trainee portal: the third bottom-nav tab («Прогресс», which was only a morning check-in form) is now «Аналитика» — range chips (week/month/all) + 4 metric cards (workouts/active days/streak 🔥/volume+minutes), activity heatmap (workout vs check-in), volume per muscle group (canonical groups + 3-language labels, same dictionary as CRM c91 — resolves via share exerciseDB → program day → legacy reverse map), body-weight SVG trend from check-ins (dashed target line + delta chip), recent-workouts list; the check-in form + measurement history stay at the bottom of the tab; check-in card labels got ids + i18n (were hard-coded RU).",
  "// v118: c91 — rest seconds finally survive every path: program day → live workout (startWorkoutFromProgram dropped rest_sec, always fell back to 90), program editor re-open (openProgramEditor dropped rest_sec/cardio/superset/set types — re-saving baked 90 into the stored program, which the portal then also showed), template save/start/apply, history reuse (finish() didn't store rest_sec) — and every reader is 0-safe now (a stored 0 no longer flips to 90). Analytics «התפלגות שרירים» muscle names follow the UI language (RU/HE/EN) instead of echoing the build-time frozen string; records built under different languages merge by canonical group.",
  "const CACHE_NAME = 'dk-gym-v119';"
].join('\n'));

/* ============================================================
 * Report + write
 * ============================================================ */
if (fails.length) {
  console.error('\nFAILED PATCHES:');
  fails.forEach(f => console.error('  ' + f));
  process.exit(1);
}
fs.writeFileSync(FILE, html);
fs.writeFileSync(CLIENT, clientHtml);
fs.writeFileSync(SW, sw);
console.log(`\nPatched ${patched} anchors — fitness-crm.html, client.html, sw.js written.`);
