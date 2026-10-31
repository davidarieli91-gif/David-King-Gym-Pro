/* c215 — DKG Arena: games, lessons, exams and verified trophies.
 *
 * Content is static (arena-data.json). Progress is stored in the synced
 * `arena_progress` store: one record per client + path. Trophies are snapshots
 * of a passed exam, so the cabinet always shows exactly what was achieved.
 */
(function () {
  'use strict';

  var TIER = {
    bronze: { color: '#cd7f32', label: { en: 'Bronze', ru: 'Бронза', he: 'ארד' } },
    silver: { color: '#c0c0c0', label: { en: 'Silver', ru: 'Серебро', he: 'כסף' } },
    gold:   { color: '#f5c542', label: { en: 'Gold',   ru: 'Золото', he: 'זהב' } }
  };

  var UI = {
    nav: { en: 'Arena', ru: 'Арена', he: 'ארנה' },
    title: { en: 'Arena', ru: 'Арена', he: 'ארנה' },
    subtitle: {
      en: 'Real skills. Verified exams. Trophies that mean something.',
      ru: 'Реальные навыки. Сданные экзамены. Кубки, которые что-то значат.',
      he: 'כישורים אמיתיים. מבחנים מאומתים. גביעים עם משמעות.'
    },
    games: { en: 'Games', ru: 'Игры', he: 'משחקים' },
    trophies: { en: 'Trophies', ru: 'Кубки', he: 'גביעים' },
    selectClient: { en: 'Athlete', ru: 'Спортсмен', he: 'ספורטאי' },
    self: { en: 'Me', ru: 'Я', he: 'אני' },
    comingSoon: { en: 'Coming soon', ru: 'Скоро', he: 'בקרוב' },
    progress: { en: 'Progress', ru: 'Прогресс', he: 'התקדמות' },
    lessons: { en: 'Lessons', ru: 'Уроки', he: 'שיעורים' },
    exam: { en: 'Exam', ru: 'Экзамен', he: 'מבחן' },
    locked: { en: 'Locked', ru: 'Закрыто', he: 'נעול' },
    completed: { en: 'Completed', ru: 'Пройдено', he: 'הושלם' },
    current: { en: 'Current', ru: 'Текущий', he: 'נוכחי' },
    lessonsDone: { en: 'All lessons done', ru: 'Все уроки выполнены', he: 'כל השיעורים הושלמו' },
    examLocked: { en: 'The exam unlocks after all lessons.', ru: 'Экзамен откроется после всех уроков.', he: 'המבחן ייפתח לאחר כל השיעורים.' },
    submitExam: { en: 'Take the exam', ru: 'Сдать экзамен', he: 'בצע מבחן' },
    examPassed: { en: 'Exam passed', ru: 'Экзамен сдан', he: 'המבחן עבר' },
    examFailed: { en: 'Exam not passed', ru: 'Экзамен не сдан', he: 'המבחן לא עבר' },
    weakStations: { en: 'Work on these stations', ru: 'Доработай эти станции', he: 'עבוד על התחנות האלה' },
    back: { en: 'Back', ru: 'Назад', he: 'חזרה' },
    noTrophies: { en: 'No trophies yet', ru: 'Пока нет кубков', he: 'אין גביעים עדיין' },
    noTrophiesHint: {
      en: 'Complete the lessons, pass the exam and the trophy appears here.',
      ru: 'Пройди уроки, сдай экзамен — и кубок появится здесь.',
      he: 'השלם שיעורים, עבור מבחן והגביע יופיע כאן.'
    },
    total: { en: 'Total', ru: 'Всего', he: 'סה״כ' },
    xp: { en: 'XP', ru: 'XP', he: 'XP' },
    rankNovice: { en: 'Novice', ru: 'Новичок', he: 'מתחיל' },
    rankBronze: { en: 'Bronze rank', ru: 'Бронзовый ранг', he: 'דרגת ארד' },
    rankSilver: { en: 'Silver rank', ru: 'Серебряный ранг', he: 'דרגת כסף' },
    rankGold: { en: 'Gold rank', ru: 'Золотой ранг', he: 'דרגת זהב' },
    rankPlatinum: { en: 'Platinum rank', ru: 'Платиновый ранг', he: 'דרגת פלטינה' },
    trophyEarned: { en: 'New trophy', ru: 'Новый кубок', he: 'גביע חדש' },
    retake: { en: 'Retake anytime', ru: 'Пересдача в любое время', he: 'אפשר לחזור בכל זמן' },
    station: { en: 'Station', ru: 'Станция', he: 'תחנה' },
    weightKg: { en: 'Barbell weight, kg', ru: 'Вес штанги, кг', he: 'משקל מוט, ק״ג' },
    videoOptional: { en: 'Video link (optional)', ru: 'Ссылка на видео (необязательно)', he: 'קישור לווידאו (אופציונלי)' },
    video: { en: 'Video', ru: 'Видео', he: 'וידאו' },
    bodyweightKg: { en: 'Bodyweight, kg', ru: 'Вес тела, кг', he: 'משקל גוף, ק״ג' },
    technique: { en: 'Technique', ru: 'Техника', he: 'טכניקה' },
    checkpoints: { en: 'Checkpoints', ru: 'Чек-поинты', he: 'נקודות ביקורת' },
    mistakes: { en: 'Common mistakes', ru: 'Частые ошибки', he: 'טעויות נפוצות' },
    sets: { en: 'Sets', ru: 'Подходы', he: 'סטים' },
    reps: { en: 'Reps', ru: 'Повторы', he: 'חזרות' },
    seconds: { en: 'Seconds', ru: 'Секунды', he: 'שניות' },
    manualHint: { en: 'I confirm the technique is clean.', ru: 'Подтверждаю чистую технику.', he: 'אני מאשר טכניקה נקייה.' },
    pathLocked: { en: 'Pass the previous tier first.', ru: 'Сначала пройди предыдущий тир.', he: 'עבור קודם את הדרגה הקודמת.' },
    openArena: { en: 'Open Arena', ru: 'Открыть Арену', he: 'פתח ארנה' },
    lastAttempt: { en: 'Last attempt', ru: 'Последняя попытка', he: 'ניסיון אחרון' },
    passed: { en: 'Passed', ru: 'Сдано', he: 'עבר' },
    failed: { en: 'Failed', ru: 'Не сдано', he: 'לא עבר' },
    goal: { en: 'Goal', ru: 'Цель', he: 'מטרה' },
    result: { en: 'Result', ru: 'Результат', he: 'תוצאה' },
    profileHint: { en: 'Lessons, exams and trophies', ru: 'Уроки, экзамены и кубки', he: 'שיעורים, מבחנים וגביעים' },
    notStarted: { en: 'Not started', ru: 'Не начато', he: 'לא התחיל' },
    level: { en: 'Tier', ru: 'Тир', he: 'דרגה' },
    close: { en: 'Close', ru: 'Закрыть', he: 'סגור' }
  };

  var state = {
    data: null,
    loading: null,
    clientId: 'self',
    clients: [],
    view: 'games',
    pathId: null,
    records: {},
    summary: { xp: 0, trophies: 0, lessons: 0, rank: 'rankNovice' },
    flash: null,
    renderSeq: 0
  };

  function lang() {
    try { return (typeof currentLang === 'function' ? currentLang() : 'en') || 'en'; } catch (_) { return 'en'; }
  }
  function u(key) {
    var item = UI[key];
    if (!item) return key;
    return item[lang()] || item.en || key;
  }
  function tr(obj) {
    if (!obj) return '';
    if (typeof obj === 'string') return obj;
    return obj[lang()] || obj.en || obj.ru || obj.he || '';
  }
  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function lines(text) {
    return esc(text || '').split('|').map(function (line) {
      return line.trim();
    }).filter(Boolean);
  }
  function num(value) {
    var n = Number(String(value == null ? '' : value).replace(',', '.'));
    return Number.isFinite(n) ? n : 0;
  }
  function fmtDate(ts) {
    try {
      return new Date(ts).toLocaleDateString(lang() === 'he' ? 'he-IL' : (lang() === 'ru' ? 'ru-RU' : 'en-GB'), {
        day: '2-digit', month: 'short', year: 'numeric'
      });
    } catch (_) { return ''; }
  }
  function tierInfo(tier) { return TIER[tier] || TIER.bronze; }
  function toastSafe(message, type) {
    try { if (typeof toast === 'function') toast(message, type || 'info', 2600); } catch (_) {}
  }

  function gameIcon(id) {
    var icons = {
      street_workout: '<path d="M4 8v8M20 8v8M8 12h8M4 12H2M22 12h-2"/><path d="M8 6v12M16 6v12"/>',
      strength: '<path d="M6 7v10M18 7v10M3 9v6M21 9v6M6 12h12"/>',
      speed: '<path d="M13 2 4 14h7l-1 8 10-13h-7l1-7z"/>',
      endurance: '<path d="M3 12h4l2-6 4 12 2-6h6"/>',
      hypertrophy: '<path d="M7 6c4 0 7 3 7 7 0 4-3 7-7 7"/><path d="M7 6v14M7 13h5"/>',
      mobility: '<circle cx="12" cy="5" r="2"/><path d="M12 8v5M12 13l-4 7M12 13l4 7M8 10h8"/>',
      kettlebell: '<path d="M9 8a3 3 0 1 1 6 0"/><path d="M8 9h8l2 7a3 3 0 0 1-3 4H9a3 3 0 0 1-3-4z"/>',
      olympic: '<path d="M5 7v10M19 7v10M3 9v6M21 9v6M5 12h14"/><circle cx="12" cy="12" r="2"/>'
    };
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (icons[id] || icons.strength) + '</svg>';
  }

  function trophySvg() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 4h8v4a4 4 0 0 1-8 0V4z"/><path d="M8 5H4v2a4 4 0 0 0 4 4M16 5h4v2a4 4 0 0 1-4 4"/><path d="M12 12v5M8 21h8M9 17h6"/></svg>';
  }

  async function ensureData() {
    if (state.data) return state.data;
    if (state.loading) return state.loading;
    state.loading = fetch('arena-data.json?v=1', { cache: 'no-cache' })
      .then(function (res) {
        if (!res.ok) throw new Error('Arena data HTTP ' + res.status);
        return res.json();
      })
      .then(function (data) {
        state.data = data;
        state.loading = null;
        return data;
      })
      .catch(function (error) {
        state.loading = null;
        throw error;
      });
    return state.loading;
  }

  function findGame(gameId) {
    return ((state.data && state.data.games) || []).find(function (g) { return g.id === gameId; }) || null;
  }
  function findPath(pathId) {
    var games = (state.data && state.data.games) || [];
    for (var i = 0; i < games.length; i++) {
      var paths = games[i].paths || [];
      for (var j = 0; j < paths.length; j++) if (paths[j].id === pathId) return { game: games[i], path: paths[j] };
    }
    return null;
  }
  function progressId(clientId, pathId) { return String(clientId) + '::' + String(pathId); }

  function emptyRecord(clientId, pathId) {
    return {
      id: progressId(clientId, pathId),
      client_id: String(clientId),
      path_id: String(pathId),
      current_tier: 0,
      completed_lessons: [],
      exam_attempts: [],
      trophies: [],
      bodyweight: null,
      updated_at: Date.now()
    };
  }

  async function getRecord(clientId, pathId) {
    var rec = await db.get('arena_progress', progressId(clientId, pathId)).catch(function () { return null; });
    return rec || emptyRecord(clientId, pathId);
  }
  async function saveRecord(record) {
    record.updated_at = Date.now();
    await db.put('arena_progress', record);
  }
  async function allRecords(clientId) {
    var rows = [];
    try { rows = await db.find('arena_progress', 'by_clientId', String(clientId)); } catch (_) {}
    if (!rows || !rows.length) {
      try {
        var all = await db.all('arena_progress');
        rows = (all || []).filter(function (r) { return String(r.client_id) === String(clientId); });
      } catch (_) { rows = []; }
    }
    return rows || [];
  }

  function calcSummary(records) {
    var xp = 0, trophies = 0, lessons = 0;
    (records || []).forEach(function (r) {
      lessons += (r.completed_lessons || []).length;
      trophies += (r.trophies || []).length;
    });
    xp = lessons * 10 + trophies * 100;
    var rank = 'rankNovice';
    if (xp >= 3000) rank = 'rankPlatinum';
    else if (xp >= 1500) rank = 'rankGold';
    else if (xp >= 800) rank = 'rankSilver';
    else if (xp >= 300) rank = 'rankBronze';
    return { xp: xp, trophies: trophies, lessons: lessons, rank: rank };
  }

  function clientName(client) {
    if (!client) return u('self');
    return client.full_name || client.name ||
      [client.first_name, client.last_name].filter(Boolean).join(' ') ||
      client.phone || client.email || client.id;
  }

  async function loadClients() {
    try {
      var rows = await db.all('clients');
      return (rows || []).slice().sort(function (a, b) {
        return clientName(a).localeCompare(clientName(b));
      });
    } catch (_) { return []; }
  }

  function rankLabel(rank) { return u(rank); }

  function renderLoading(root) {
    root.innerHTML = '<div class="py-16 text-center text-sm text-muted">Loading Arena…</div>';
  }

  async function render() {
    var root = document.getElementById('arena-root');
    if (!root) return;
    var seq = ++state.renderSeq;
    if (!state.data) renderLoading(root);
    try {
      await ensureData();
    } catch (error) {
      root.innerHTML = '<div class="bg-danger/10 border border-danger/30 text-danger rounded-2xl p-4 text-sm">Arena data could not be loaded: ' + esc(error.message) + '</div>';
      return;
    }
    if (seq !== state.renderSeq) return;

    state.clients = await loadClients();
    if (state.clientId !== 'self' && !state.clients.some(function (c) { return String(c.id) === String(state.clientId); })) {
      state.clientId = 'self';
    }
    var records = await allRecords(state.clientId);
    state.records = {};
    records.forEach(function (r) { state.records[r.path_id] = r; });
    state.summary = calcSummary(records);

    var header = renderHeader();
    var body = state.view === 'trophies' ? renderTrophies() :
      (state.view === 'path' ? renderPath() : renderGames());
    root.innerHTML = header + renderFlash() + body;
    if (state.view === 'games') bindProfileSummary();
  }

  function renderHeader() {
    var clientOptions = ['<option value="self"' + (state.clientId === 'self' ? ' selected' : '') + '>' + esc(u('self')) + '</option>'];
    state.clients.forEach(function (c) {
      var id = String(c.id);
      clientOptions.push('<option value="' + esc(id) + '"' + (state.clientId === id ? ' selected' : '') + '>' + esc(clientName(c)) + '</option>');
    });
    return `
      <div class="v2-page-head">
        <div class="min-w-0">
          <div class="v2-eyebrow">DKG ARENA</div>
          <h1 class="v2-hero-title">${esc(u('title'))}</h1>
          <p class="v2-hero-sub">${esc(u('subtitle'))}</p>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <label class="text-[11px] font-semibold text-muted" for="arena-client-select">${esc(u('selectClient'))}</label>
          <select id="arena-client-select" class="bg-surface-2 border border-border rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/60 cursor-pointer">
            ${clientOptions.join('')}
          </select>
        </div>
      </div>
      <div class="grid grid-cols-3 gap-2 mb-4">
        <div class="bg-surface border border-border rounded-2xl p-3">
          <div class="text-[10px] uppercase tracking-wider text-muted font-bold">${esc(u('trophies'))}</div>
          <div class="font-display text-2xl font-extrabold mt-1">${state.summary.trophies}</div>
        </div>
        <div class="bg-surface border border-border rounded-2xl p-3">
          <div class="text-[10px] uppercase tracking-wider text-muted font-bold">${esc(u('xp'))}</div>
          <div class="font-display text-2xl font-extrabold mt-1">${state.summary.xp}</div>
        </div>
        <div class="bg-surface border border-border rounded-2xl p-3">
          <div class="text-[10px] uppercase tracking-wider text-muted font-bold">${esc(u('progress'))}</div>
          <div class="font-display text-lg font-extrabold mt-1 truncate">${esc(rankLabel(state.summary.rank))}</div>
        </div>
      </div>
      <div class="flex gap-1 bg-surface-2 border border-border rounded-xl p-1 mb-4">
        <button type="button" data-arena-action="tab" data-tab="games" class="flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition ${state.view !== 'trophies' ? 'bg-primary text-white' : 'text-muted'}">${esc(u('games'))}</button>
        <button type="button" data-arena-action="tab" data-tab="trophies" class="flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition ${state.view === 'trophies' ? 'bg-primary text-white' : 'text-muted'}">${esc(u('trophies'))} · ${state.summary.trophies}</button>
      </div>`;
  }

  function renderFlash() {
    if (!state.flash) return '';
    var t = state.flash.trophy;
    var color = tierInfo(t.tier).color;
    return `
      <div class="mb-4 rounded-2xl border p-4 flex items-center gap-3" style="border-color:${color}55;background:${color}14">
        <span class="w-11 h-11 rounded-xl grid place-items-center shrink-0" style="color:${color};background:${color}20">${trophySvg()}</span>
        <div class="min-w-0 flex-1">
          <div class="text-[10px] uppercase tracking-wider font-bold" style="color:${color}">${esc(u('trophyEarned'))}</div>
          <div class="font-display font-bold text-base truncate">${esc(tr(t.name))}</div>
        </div>
        <button type="button" data-arena-action="close-flash" class="w-8 h-8 grid place-items-center rounded-lg text-muted hover:bg-surface-2" aria-label="${esc(u('close'))}">✕</button>
      </div>`;
  }

  function renderGames() {
    var games = (state.data && state.data.games) || [];
    return `<div class="grid gap-3 sm:grid-cols-2">${games.map(function (game) {
      var paths = game.paths || [];
      var pathHtml = '';
      if (!game.available || !paths.length) {
        pathHtml = `<div class="mt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold text-muted bg-surface-2 border border-border rounded-full px-2.5 py-1">${esc(u('comingSoon'))}</div>`;
      } else {
        pathHtml = `<div class="mt-3 space-y-2">${paths.map(function (path) {
          var rec = state.records[path.id] || emptyRecord(state.clientId, path.id);
          var done = (rec.trophies || []).length;
          var total = (path.tiers || []).length;
          var pct = total ? Math.round(done / total * 100) : 0;
          return `<button type="button" data-arena-action="open-path" data-path="${esc(path.id)}" class="w-full text-start rounded-xl border border-border bg-surface-2/60 hover:bg-surface-2 transition p-3">
            <div class="flex items-center gap-2">
              <span class="min-w-0 flex-1">
                <span class="block font-semibold text-sm truncate">${esc(tr(path.name))}</span>
                <span class="block text-[11px] text-muted truncate">${esc(tr(path.subtitle))}</span>
              </span>
              <span class="text-[11px] font-bold tabular-nums" style="color:${game.color}">${done}/${total}</span>
            </div>
            <div class="h-1.5 rounded-full bg-border/40 overflow-hidden mt-2"><div class="h-full rounded-full" style="width:${pct}%;background:${game.color}"></div></div>
          </button>`;
        }).join('')}</div>`;
      }
      return `<div class="bg-surface border border-border rounded-2xl shadow-card p-4">
        <div class="flex items-start gap-3">
          <span class="w-11 h-11 rounded-xl grid place-items-center shrink-0" style="color:${game.color};background:${game.color}18">${gameIcon(game.id)}</span>
          <div class="min-w-0">
            <h3 class="font-display font-extrabold text-base leading-tight">${esc(tr(game.name))}</h3>
            <p class="text-[11px] text-muted leading-relaxed mt-1">${esc(tr(game.description))}</p>
          </div>
        </div>
        ${pathHtml}
      </div>`;
    }).join('')}</div>`;
  }

  async function refreshRecord(pathId) {
    var rec = await getRecord(state.clientId, pathId);
    state.records[pathId] = rec;
    return rec;
  }

  function renderPath() {
    var found = findPath(state.pathId);
    if (!found) { state.view = 'games'; return renderGames(); }
    var game = found.game, path = found.path;
    var rec = state.records[path.id] || emptyRecord(state.clientId, path.id);
    var tiers = path.tiers || [];
    var trophyCount = (rec.trophies || []).length;
    var tierHtml = tiers.map(function (tier, index) {
      var info = tierInfo(tier.tier);
      var completed = (rec.trophies || []).some(function (t) { return t.tier_id === tier.id; });
      var current = !completed && index === Number(rec.current_tier || 0);
      var locked = !completed && index > Number(rec.current_tier || 0);
      var lessonsDone = (tier.lessons || []).every(function (lesson) {
        return completed || (rec.completed_lessons || []).indexOf(tier.id + '::' + lesson.id) !== -1;
      });
      var status = completed ? u('completed') : (current ? u('current') : (locked ? u('locked') : u('locked')));
      var lessonsHtml = (tier.lessons || []).map(function (lesson) {
        var key = tier.id + '::' + lesson.id;
        var checked = completed || (rec.completed_lessons || []).indexOf(key) !== -1;
        return `<div class="rounded-xl border border-border bg-surface-2/50 p-3">
          <label class="flex items-start gap-2.5 cursor-pointer">
            <input type="checkbox" ${checked ? 'checked' : ''} ${(!current || completed) ? 'disabled' : ''} data-arena-action="toggle-lesson" data-tier="${esc(tier.id)}" data-lesson="${esc(lesson.id)}" class="mt-0.5 w-4 h-4 rounded border-border text-primary focus:ring-primary/50" />
            <span class="min-w-0 flex-1">
              <span class="block text-sm font-semibold">${esc(tr(lesson.name))}</span>
              <span class="block text-[11px] text-muted mt-0.5">${esc(tr(lesson.prescription))}</span>
            </span>
          </label>
          <details class="mt-2 group">
            <summary class="cursor-pointer text-[11px] font-semibold text-primary-2 select-none">${esc(u('technique'))} · ${esc(u('checkpoints'))} · ${esc(u('mistakes'))}</summary>
            <div class="mt-2 space-y-2 text-[11px] leading-relaxed text-muted border-t border-border pt-2">
              <div><b class="text-text">${esc(u('technique'))}:</b><br>${lines(tr(lesson.technique)).map(esc).join('<br>')}</div>
              <div><b class="text-text">${esc(u('checkpoints'))}:</b><br>${lines(tr(lesson.checkpoints)).map(esc).join('<br>')}</div>
              <div><b class="text-text">${esc(u('mistakes'))}:</b><br>${lines(tr(lesson.mistakes)).map(esc).join('<br>')}</div>
            </div>
          </details>
        </div>`;
      }).join('');
      var examHtml = '';
      if (completed) {
        var trophy = (rec.trophies || []).filter(function (t) { return t.tier_id === tier.id; })[0];
        examHtml = `<div class="rounded-xl border p-3 flex items-center gap-3" style="border-color:${info.color}55;background:${info.color}12">
          <span class="w-9 h-9 rounded-lg grid place-items-center shrink-0" style="color:${info.color};background:${info.color}1f">${trophySvg()}</span>
          <div class="min-w-0"><div class="text-xs font-bold" style="color:${info.color}">${esc(trophy ? tr(trophy.name) : tr(tier.trophy.name))}</div><div class="text-[10px] text-muted">${trophy ? esc(fmtDate(trophy.earned_at)) : ''}</div></div>
        </div>`;
      } else if (locked) {
        examHtml = `<div class="rounded-xl border border-border bg-surface-2/50 p-3 text-[11px] text-muted">${esc(u('pathLocked'))}</div>`;
      } else if (!lessonsDone) {
        examHtml = `<div class="rounded-xl border border-border bg-surface-2/50 p-3 text-[11px] text-muted">${esc(u('examLocked'))}</div>`;
      } else {
        examHtml = renderExamForm(tier, rec);
      }
      return `<div class="rounded-2xl border bg-surface shadow-card overflow-hidden ${current ? 'border-primary/50' : 'border-border'}">
        <div class="p-4 border-b border-border flex items-center gap-3" style="background:${info.color}0d">
          <span class="w-9 h-9 rounded-xl grid place-items-center font-display font-extrabold text-sm" style="color:${info.color};background:${info.color}1f">${index + 1}</span>
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2"><h4 class="font-display font-bold text-sm">${esc(tr(tier.name))}</h4><span class="text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded" style="color:${info.color};background:${info.color}18">${esc(status)}</span></div>
            <div class="text-[11px] text-muted mt-0.5">${esc(tr(tier.goal))}</div>
          </div>
        </div>
        <div class="p-3 space-y-2">${lessonsHtml}${examHtml}</div>
      </div>`;
    }).join('');

    return `
      <button type="button" data-arena-action="back" class="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-text"><span aria-hidden="true">←</span>${esc(u('back'))}</button>
      <div class="bg-surface border border-border rounded-2xl shadow-card p-4 mb-4">
        <div class="flex items-start gap-3">
          <span class="w-12 h-12 rounded-xl grid place-items-center shrink-0" style="color:${game.color};background:${game.color}18">${gameIcon(game.id)}</span>
          <div class="min-w-0">
            <h2 class="font-display font-extrabold text-xl">${esc(tr(path.name))}</h2>
            <p class="text-[11px] text-muted mt-1">${esc(tr(path.description))}</p>
            <div class="mt-2 inline-flex items-center gap-1.5 text-[11px] font-bold" style="color:${game.color}">${trophySvg()}<span>${trophyCount}/${tiers.length}</span></div>
          </div>
        </div>
      </div>
      <div class="space-y-3">${tierHtml}</div>`;
  }

  function renderExamForm(tier, rec) {
    var bodyweight = rec.bodyweight;
    if (!bodyweight && state.clientId !== 'self') {
      var client = state.clients.filter(function (c) { return String(c.id) === String(state.clientId); })[0];
      if (client && client.weight) bodyweight = client.weight;
    }
    if (!bodyweight) bodyweight = 80;
    var stations = (tier.exam && tier.exam.stations) || [];
    var fields = stations.map(function (station) {
      var label = `<div class="flex items-center justify-between gap-2"><span class="text-xs font-semibold">${esc(tr(station.name))}</span>${station.type !== 'manual' ? `<span class="text-[10px] text-muted">${station.type === 'hold' ? esc(u('seconds')) : (station.type === 'load_bw' ? '× BW' : esc(u('reps')))}</span>` : ''}</div>`;
      var input = '';
      if (station.type === 'reps' || station.type === 'hold') {
        var sets = Math.max(1, Number(station.sets) || 1);
        input = '<div class="grid gap-1.5 mt-1.5" style="grid-template-columns:repeat(' + sets + ',minmax(0,1fr))">' + Array.from({ length: sets }).map(function (_, i) {
          return `<input type="number" min="0" step="1" inputmode="numeric" data-arena-input="${esc(station.id)}:${i}" placeholder="${station.type === 'hold' ? esc(u('seconds')) : esc(u('reps'))}" class="w-full min-w-0 bg-surface border border-border rounded-lg px-2 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/60" />`;
        }).join('') + '</div>';
      } else if (station.type === 'load_bw') {
        input = `<div class="grid grid-cols-2 gap-2 mt-1.5">
          <label class="text-[10px] text-muted">${esc(u('weightKg'))}<input type="number" min="0" step="0.5" inputmode="decimal" data-arena-input="${esc(station.id)}:weight" class="w-full bg-surface border border-border rounded-lg px-2 py-2 text-sm font-mono mt-1" /></label>
          <label class="text-[10px] text-muted">${esc(u('bodyweightKg'))}<input type="number" min="0" step="0.1" inputmode="decimal" data-arena-input="${esc(station.id)}:bodyweight" value="${esc(bodyweight)}" class="w-full bg-surface border border-border rounded-lg px-2 py-2 text-sm font-mono mt-1" /></label>
        </div>`;
      } else if (station.type === 'manual') {
        input = `<label class="flex items-center gap-2 text-[11px] text-muted mt-1.5"><input type="checkbox" data-arena-input="${esc(station.id)}:manual" class="w-4 h-4 rounded border-border text-primary focus:ring-primary/50" />${esc(u('manualHint'))}</label>`;
      }
      return `<div class="rounded-xl border border-border bg-surface p-3">${label}${input}${station.hint ? `<div class="text-[10px] text-muted mt-1.5">${esc(tr(station.hint))}</div>` : ''}</div>`;
    }).join('');
    var last = (rec.exam_attempts || []).slice(-1)[0];
    var lastHtml = last ? `<div class="text-[10px] text-muted mt-2">${esc(u('lastAttempt'))}: <b class="${last.passed ? 'text-success' : 'text-danger'}">${esc(last.passed ? u('passed') : u('failed'))}</b> · ${esc(fmtDate(last.at))}</div>` : '';
    return `<div class="arena-exam-panel rounded-xl border border-primary/30 bg-primary/5 p-3 mt-1">
      <div class="flex items-center justify-between gap-2 mb-1"><h5 class="text-xs font-bold">${esc(u('exam'))}</h5><span class="text-[9px] text-muted">${esc(u('retake'))}</span></div>
      ${tier.exam && tier.exam.intro ? `<p class="text-[10px] text-muted mb-2">${esc(tr(tier.exam.intro))}</p>` : ''}
      <div class="space-y-2">${fields}</div>
      <label class="block text-[10px] text-muted mt-2">${esc(u('videoOptional'))}<input type="url" data-arena-input="video:url" placeholder="https://..." class="w-full bg-surface border border-border rounded-lg px-2 py-2 text-xs mt-1" /></label>
      <button type="button" data-arena-action="submit-exam" data-path="${esc(state.pathId)}" data-tier="${esc(tier.id)}" class="w-full mt-3 bg-primary hover:bg-primary-2 text-white text-xs font-bold py-2.5 rounded-xl transition">${esc(u('submitExam'))}</button>
      ${lastHtml}
    </div>`;
  }

  function renderTrophies() {
    var trophies = [];
    Object.keys(state.records).forEach(function (pathId) {
      var rec = state.records[pathId];
      (rec.trophies || []).forEach(function (t) {
        var found = findPath(t.path_id || pathId);
        trophies.push({ trophy: t, game: found ? found.game : null, path: found ? found.path : null });
      });
    });
    trophies.sort(function (a, b) { return (b.trophy.earned_at || 0) - (a.trophy.earned_at || 0); });
    if (!trophies.length) {
      return `<div class="bg-surface border border-border rounded-2xl shadow-card p-10 text-center">
        <div class="w-16 h-16 mx-auto rounded-2xl bg-surface-2 border border-border grid place-items-center text-muted mb-3">${trophySvg()}</div>
        <div class="font-display font-bold">${esc(u('noTrophies'))}</div>
        <p class="text-xs text-muted mt-1 max-w-sm mx-auto">${esc(u('noTrophiesHint'))}</p>
      </div>`;
    }
    return `<div class="grid gap-3 sm:grid-cols-2">${trophies.map(function (row) {
      var t = row.trophy;
      var color = tierInfo(t.tier).color;
      var results = (t.results || []).map(function (r) {
        return `<div class="flex items-center justify-between gap-2 text-[10px]"><span class="text-muted truncate">${esc(r.label)}</span><b class="tabular-nums ${r.passed ? 'text-success' : 'text-danger'}">${esc(r.display)}</b></div>`;
      }).join('');
      return `<div class="bg-surface border border-border rounded-2xl shadow-card p-4" style="border-color:${color}44">
        <div class="flex items-start gap-3">
          <span class="w-11 h-11 rounded-xl grid place-items-center shrink-0" style="color:${color};background:${color}1c">${trophySvg()}</span>
          <div class="min-w-0 flex-1">
            <div class="text-[9px] uppercase tracking-wider font-bold" style="color:${color}">${esc(tr(t.tier ? (TIER[t.tier] && TIER[t.tier].label) : null) || '')}</div>
            <div class="font-display font-bold text-sm leading-tight">${esc(tr(t.name))}</div>
            <div class="text-[10px] text-muted mt-0.5">${esc(row.game ? tr(row.game.name) : '')}${row.path ? ' · ' + esc(tr(row.path.name)) : ''} · ${esc(fmtDate(t.earned_at))}</div>
          </div>
        </div>
        ${results ? `<div class="mt-3 pt-2 border-t border-border space-y-1">${results}</div>` : ''}
        ${t.video ? `<a href="${esc(t.video)}" target="_blank" rel="noopener" class="inline-flex items-center gap-1 text-[10px] font-semibold text-primary-2 mt-2">${esc(u('video'))} ↗</a>` : ''}
      </div>`;
    }).join('')}</div>`;
  }

  async function toggleLesson(tierId, lessonId) {
    var found = findPath(state.pathId);
    if (!found) return;
    var rec = await getRecord(state.clientId, state.pathId);
    var key = tierId + '::' + lessonId;
    var pos = (rec.completed_lessons || []).indexOf(key);
    if (pos === -1) rec.completed_lessons = (rec.completed_lessons || []).concat(key);
    else rec.completed_lessons = rec.completed_lessons.filter(function (k) { return k !== key; });
    await saveRecord(rec);
    state.records[state.pathId] = rec;
    var all = await allRecords(state.clientId);
    state.summary = calcSummary(all);
    await render();
  }

  async function submitExam(pathId, tierId, button) {
    var found = findPath(pathId);
    if (!found) return;
    var tier = (found.path.tiers || []).filter(function (t) { return t.id === tierId; })[0];
    if (!tier) return;
    var form = button.closest('.arena-exam-panel') || button.parentElement || document;
    var rec = await getRecord(state.clientId, pathId);
    var results = [];
    var bodyweight = 0;
    ((tier.exam && tier.exam.stations) || []).forEach(function (station) {
      var label = tr(station.name);
      var display = '', passed = false;
      if (station.type === 'reps' || station.type === 'hold') {
        var sets = Math.max(1, Number(station.sets) || 1);
        var values = [];
        for (var i = 0; i < sets; i++) {
          var input = form.querySelector('[data-arena-input="' + station.id + ':' + i + '"]');
          values.push(num(input ? input.value : 0));
        }
        passed = values.every(function (v) { return v >= Number(station.target || 0); });
        display = values.join(' / ') + (station.type === 'hold' ? ' ' + u('seconds') : ' ' + u('reps'));
      } else if (station.type === 'load_bw') {
        var w = form.querySelector('[data-arena-input="' + station.id + ':weight"]');
        var bw = form.querySelector('[data-arena-input="' + station.id + ':bodyweight"]');
        var weight = num(w ? w.value : 0);
        bodyweight = num(bw ? bw.value : 0);
        var ratio = bodyweight > 0 ? weight / bodyweight : 0;
        passed = ratio >= Number(station.target || 0);
        display = weight + ' kg / ' + bodyweight + ' kg = ' + ratio.toFixed(2) + '×';
      } else if (station.type === 'manual') {
        var check = form.querySelector('[data-arena-input="' + station.id + ':manual"]');
        passed = !!(check && check.checked);
        display = passed ? u('passed') : u('failed');
      }
      results.push({ station_id: station.id, label: label, display: display, passed: passed });
    });
    var passedAll = results.length > 0 && results.every(function (r) { return r.passed; });
    var videoEl = form.querySelector('[data-arena-input="video:url"]');
    var video = videoEl ? String(videoEl.value || '').trim() : '';
    var attempt = { id: 'att_' + Date.now(), at: Date.now(), passed: passedAll, results: results, video: video };
    rec.exam_attempts = (rec.exam_attempts || []).concat(attempt).slice(-20);
    if (bodyweight) rec.bodyweight = bodyweight;
    if (passedAll) {
      var existing = (rec.trophies || []).some(function (t) { return t.tier_id === tier.id; });
      if (!existing) {
        var snapshot = {
          id: tier.trophy.id || (pathId + '_' + tier.id),
          tier_id: tier.id,
          tier: tier.tier,
          path_id: pathId,
          game_id: found.game.id,
          name: tier.trophy.name,
          description: tier.trophy.description,
          earned_at: Date.now(),
          results: results,
          video: video,
          attempt_id: attempt.id
        };
        rec.trophies = (rec.trophies || []).concat(snapshot);
        var idx = (found.path.tiers || []).findIndex(function (t) { return t.id === tier.id; });
        rec.current_tier = Math.max(Number(rec.current_tier || 0), idx + 1);
        state.flash = { trophy: snapshot };
        toastSafe(u('examPassed') + ' — ' + tr(snapshot.name), 'success');
      }
    } else {
      toastSafe(u('examFailed'), 'danger');
    }
    await saveRecord(rec);
    state.records[pathId] = rec;
    var all = await allRecords(state.clientId);
    state.summary = calcSummary(all);
    await render();
  }

  function bindProfileSummary() {
    // The profile screen fills its own trophy summary through fillProfileSummary.
  }

  async function fillProfileSummary(clientId) {
    try {
      var records = await allRecords(clientId || state.clientId);
      var n = 0;
      records.forEach(function (r) { n += (r.trophies || []).length; });
      var count = document.getElementById('profile-arena-count');
      if (count) count.textContent = String(n);
      var summary = document.getElementById('profile-arena-summary');
      if (summary) summary.textContent = n + ' ' + u('trophies');
      var chip = document.getElementById('profile-arena-chip');
      if (chip && !count) chip.textContent = '🏆 ' + n;
    } catch (_) {}
  }

  function open(clientId) {
    state.clientId = String(clientId || 'self');
    state.view = 'games';
    state.pathId = null;
    state.flash = null;
    try { if (typeof router !== 'undefined' && router.show) router.show('arena'); } catch (_) {}
    render();
  }

  async function refresh() {
    if (document.getElementById('arena-root')) await render();
  }

  document.addEventListener('click', function (event) {
    var el = event.target.closest && event.target.closest('[data-arena-action]');
    if (!el) return;
    var action = el.getAttribute('data-arena-action');
    if (action === 'tab') {
      state.view = el.getAttribute('data-tab') || 'games';
      state.flash = null;
      render();
    } else if (action === 'open-path') {
      state.pathId = el.getAttribute('data-path');
      state.view = 'path';
      state.flash = null;
      render();
    } else if (action === 'back') {
      state.view = 'games';
      state.pathId = null;
      state.flash = null;
      render();
    } else if (action === 'toggle-lesson') {
      event.preventDefault();
      toggleLesson(el.getAttribute('data-tier'), el.getAttribute('data-lesson'));
    } else if (action === 'submit-exam') {
      submitExam(el.getAttribute('data-path'), el.getAttribute('data-tier'), el);
    } else if (action === 'close-flash') {
      state.flash = null;
      render();
    }
  });

  document.addEventListener('change', function (event) {
    if (event.target && event.target.id === 'arena-client-select') {
      state.clientId = event.target.value || 'self';
      state.flash = null;
      render();
    }
  });

  window.DK_ARENA = { open: open, refresh: refresh, fillProfileSummary: fillProfileSummary };
  try { if (typeof screens !== 'undefined') screens.arena = { refresh: refresh }; } catch (_) {}

  /* Deep link used by the director console: /fitness-crm.html?screen=arena */
  try {
    if (new URLSearchParams(location.search || '').get('screen') === 'arena') {
      var startArena = function () {
        try { if (window.DKG_SERVER && window.DKG_SERVER.authenticated) open('self'); } catch (_) {}
      };
      if (window.DKG_SERVER && window.DKG_SERVER.ready) window.DKG_SERVER.ready.then(startArena);
      else setTimeout(startArena, 1800);
    }
  } catch (_) {}
})();
