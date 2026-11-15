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
    trophySingular: { en: 'trophy', ru: 'кубок', he: 'גביע' },
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
    fillStations: { en: 'Fill in every station before submitting.', ru: 'Заполни все станции перед отправкой.', he: 'מלא את כל התחנות לפני השליחה.' },
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
    exerciseCard: { en: 'Exercise card', ru: 'Карточка упражнения', he: 'כרטיס תרגיל' },
    openInDb: { en: 'Open in exercise database', ru: 'Открыть в базе упражнений', he: 'פתח במאגר התרגילים' },
    checkpoints: { en: 'Checkpoints', ru: 'Чек-поинты', he: 'נקודות ביקורת' },
    mistakes: { en: 'Common mistakes', ru: 'Частые ошибки', he: 'טעויות נפוצות' },
    sets: { en: 'Sets', ru: 'Подходы', he: 'סטים' },
    reps: { en: 'Reps', ru: 'Повторы', he: 'חזרות' },
    seconds: { en: 'Seconds', ru: 'Секунды', he: 'שניות' },
    time: { en: 'Time', ru: 'Время', he: 'זמן' },
    distance: { en: 'Distance', ru: 'Дистанция', he: 'מרחק' },
    metersShort: { en: 'm', ru: 'м', he: 'מ׳' },
    cmShort: { en: 'cm', ru: 'см', he: 'ס״מ' },
    secShort: { en: 's', ru: 'с', he: 'שנ׳' },
    timeHint: { en: 'mm:ss or seconds', ru: 'мм:сс или секунды', he: 'דקות:שניות או שניות' },
    manualHint: { en: 'I confirm the technique is clean.', ru: 'Подтверждаю чистую технику.', he: 'אני מאשר טכניקה נקייה.' },
    pathLocked: { en: 'Pass the previous tier first.', ru: 'Сначала пройди предыдущий тир.', he: 'עבור קודם את הדרגה הקודמת.' },
    openArena: { en: 'Open Arena', ru: 'Открыть Арену', he: 'פתח ארנה' },
    lastAttempt: { en: 'Last attempt', ru: 'Последняя попытка', he: 'ניסיון אחרון' },
    attemptHistory: { en: 'Attempt history', ru: 'История попыток', he: 'היסטוריית ניסיונות' },
    passed: { en: 'Passed', ru: 'Сдано', he: 'עבר' },
    failed: { en: 'Failed', ru: 'Не сдано', he: 'לא עבר' },
    goal: { en: 'Goal', ru: 'Цель', he: 'מטרה' },
    result: { en: 'Result', ru: 'Результат', he: 'תוצאה' },
    profileHint: { en: 'Lessons, exams and trophies', ru: 'Уроки, экзамены и кубки', he: 'שיעורים, מבחנים וגביעים' },
    notStarted: { en: 'Not started', ru: 'Не начато', he: 'לא התחיל' },
    level: { en: 'Tier', ru: 'Тир', he: 'דרגה' },
    close: { en: 'Close', ru: 'Закрыть', he: 'סגור' },
    resetProgress: { en: 'Reset progress', ru: 'Сбросить прогресс', he: 'אפס התקדמות' },
    resetConfirm: { en: 'Reset all lessons, exams and trophies for this path?', ru: 'Сбросить все уроки, экзамены и кубки этого пути?', he: 'לאפס את כל השיעורים, המבחנים והגביעים במסלול הזה?' },
    resetDone: { en: 'Progress reset', ru: 'Прогресс сброшен', he: 'ההתקדמות אופסה' },
    resetFailed: { en: 'Could not reset progress', ru: 'Не удалось сбросить прогресс', he: 'לא ניתן לאפס התקדמות' },
    share: { en: 'Share', ru: 'Поделиться', he: 'שתף' },
    copied: { en: 'Copied', ru: 'Скопировано', he: 'הועתק' },
    /* c245: trainer verification flow — no more honor-system trophies */
    reviewTab: { en: 'Review', ru: 'К проверке', he: 'לבדיקה' },
    reviewBadge: { en: 'to review', ru: 'к проверке', he: 'ממתינים' },
    reviewNone: { en: 'Nothing to review — no pending exam attempts.', ru: 'Нечего проверять — нет ожидающих экзаменов.', he: 'אין מה לבדוק — אין מבחנים בהמתנה.' },
    reviewStation: { en: 'Station', ru: 'Станция', he: 'עמדה' },
    reviewValues: { en: 'Your result', ru: 'Результат', he: 'תוצאה' },
    reviewRequired: { en: 'Required', ru: 'Норма', he: 'דרישה' },
    reviewVideo: { en: 'Exam video', ru: 'Видео экзамена', he: 'וידאו המבחן' },
    reviewApprove: { en: 'Approve and award trophy', ru: 'Подтвердить и выдать кубок', he: 'לאשר ולהעניק גביע' },
    reviewReject: { en: 'Reject', ru: 'Отклонить', he: 'לדחות' },
    reviewRejected: { en: 'Review rejected', ru: 'Проверка отклонена', he: 'הבדיקה נדחתה' },
    reviewApproved: { en: 'Exam approved — trophy awarded', ru: 'Экзамен подтверждён — кубок выдан', he: 'המבחן אושר — הגביע הוענק' },
    reviewRejectedToast: { en: 'Attempt rejected', ru: 'Попытка отклонена', he: 'הניסיון נדחה' },
    reviewRejectedByCoach: { en: 'Rejected by coach', ru: 'Отклонено тренером', he: 'נדחה על ידי המאמן' },
    reviewPendingForClient: { en: 'Awaiting coach review', ru: 'Ожидает проверки тренера', he: 'ממתין לבדיקת המאמן' },
    reviewRejectedForClient: { en: 'Rejected by coach', ru: 'Отклонено тренером', he: 'נדחה על ידי המאמן' },
    assignPath: { en: 'Assign to athlete', ru: 'Назначить клиенту', he: 'להקצות לספורטאי' },
    assignTitle: { en: 'Assign path', ru: 'Назначить путь', he: 'הקצאת מסלול' },
    assignDeadline: { en: 'Deadline (optional)', ru: 'Дедлайн (необязательно)', he: 'מועד אחרון (אופציונלי)' },
    assignNote: { en: 'Note for the athlete', ru: 'Комментарий клиенту', he: 'הערה לספורטאי' },
    assignSave: { en: 'Assign', ru: 'Назначить', he: 'הקצה' },
    assignDone: { en: 'Path assigned', ru: 'Путь назначен', he: 'המסלול הוקצה' },
    assignedByCoach: { en: 'Assigned by your coach', ru: 'Назначил тренер', he: 'הוקצה על ידי המאמן' },
    reviewHeader: { en: 'Exam review queue', ru: 'Очередь проверки экзаменов', he: 'תור בדיקת המבחנים' },
    videoAttach: { en: 'Exam video (optional, one file)', ru: 'Видео экзамена (по желанию, один файл)', he: 'וידאו המבחן (אופציונלי, קובץ אחד)' },
    uploadingVideo: { en: 'Uploading video…', ru: 'Загружаю видео…', he: 'מעלה וידאו…' },
    uploadVideoFailed: { en: 'Video upload failed', ru: 'Не удалось загрузить видео', he: 'העלאת הווידאו נכשלה' },
    lessonsLeft: { en: 'lessons to pass this tier', ru: 'до прохождения тира', he: 'שיעורים למעבר הדרגה' },
    hallTitle: { en: 'Hall of Athletes', ru: 'Арена зала', he: 'ארנת האולם' },
    hallPending: { en: 'exams to review', ru: 'экзаменов к проверке', he: 'מבחנים לבדיקה' },
    hallTrophies: { en: 'trophies', ru: 'кубки', he: 'גביעים' },
    hallLastExam: { en: 'last exam', ru: 'последний экзамен', he: 'מבחן אחרון' },
    openAthlete: { en: 'Open athlete', ru: 'Открыть атлета', he: 'פתח ספורטאי' },
    verifyTrophy: { en: 'Verification link', ru: 'Ссылка-проверка кубка', he: 'קישור אימות' },
    copiedLink: { en: 'Verification link copied', ru: 'Ссылка скопирована', he: 'הקישור הועתק' }
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
    renderSeq: 0,
    pendingReviews: []
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
  function pad2(n) { return String(n).padStart(2, '0'); }
  function fmtTime(value) {
    var sec = Math.round(Number(value) || 0);
    if (sec <= 0) return '';
    var h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
    return h ? h + ':' + pad2(m) + ':' + pad2(s) : m + ':' + pad2(s);
  }
  function fmtPerfTime(value) {
    var sec = Number(value) || 0;
    return sec > 0 && sec < 60 ? (Math.round(sec * 100) / 100) + ' ' + u('secShort') : fmtTime(sec);
  }
  function parseTime(value) {
    var raw = String(value == null ? '' : value).trim().replace(',', '.');
    if (!raw) return 0;
    if (raw.indexOf(':') !== -1) {
      var parts = raw.split(':');
      var mins = 0, secs = 0;
      if (parts.length >= 3) {
        mins = (Number(parts[0]) || 0) * 60 + (Number(parts[1]) || 0);
        secs = Number(parts[2]) || 0;
      } else {
        mins = Number(parts[0]) || 0;
        secs = Number(parts[1]) || 0;
      }
      return mins * 60 + secs;
    }
    var n = Number(raw);
    return isFinite(n) ? n : 0;
  }
  function tierInfo(tier) { return TIER[tier] || TIER.bronze; }
  /* c250: CSS custom properties need "r g b" triplets, not hex strings. */
  function rgbTriplet(hex) {
    var h = String(hex || '').replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var n = parseInt(h, 16);
    if (!isFinite(n)) return '139 92 246';
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255].join(' ');
  }
  /* c251: lesson art is used EXACTLY as the exercise database ships it — the
     original animated files, nothing re-encoded, nothing transcoded. The
     theme-aware rules in input.css (invert/screen/multiply by src path) make
     them look right in dark and light themes everywhere else in the app. */
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
    state.loading = fetch('arena-data.json?v=8', { cache: 'no-cache' })
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
    root.innerHTML = '<div class="arena-empty">'
      + '<div class="arena-empty-ic">' + trophySvg() + '</div>'
      + '<div class="arena-empty-title">' + esc(u('title')) + '</div>'
      + '<p class="arena-empty-text">Loading…</p>'
      + '</div>';
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
    state.pendingReviews = await allPendingReviews(state.clients);
    state.hallSummaries = (state.clientId === 'self' && state.view === 'games')
      ? await computeHallSummaries(state.clients) : [];

    var header = renderHeader();
    var body = state.view === 'trophies' ? renderTrophies() :
      (state.view === 'review' ? renderReview() : (state.view === 'path' ? renderPath() : renderGames()));
    root.innerHTML = header + renderFlash() + body;
    if (state.view === 'games') bindProfileSummary();
  }

  function renderHeader() {
    var clientOptions = ['<option value="self"' + (state.clientId === 'self' ? ' selected' : '') + '>' + esc(u('self')) + '</option>'];
    state.clients.forEach(function (c) {
      var id = String(c.id);
      clientOptions.push('<option value="' + esc(id) + '"' + (state.clientId === id ? ' selected' : '') + '>' + esc(clientName(c)) + '</option>');
    });
    var reviewBadge = state.pendingReviews.length
      ? '<span class="arena-tab-badge" aria-hidden="true">' + state.pendingReviews.length + '</span>'
      : '';
    return `
      <div class="arena-hero">
        <span class="arena-hero-mark" aria-hidden="true">${trophySvg()}</span>
        <div class="min-w-0">
          <div class="arena-hero-badge">DKG ARENA</div>
          <h1 class="arena-hero-title">${esc(u('title'))}</h1>
          <p class="arena-hero-sub">${esc(u('subtitle'))}</p>
        </div>
        <div class="arena-hero-side">
          <label for="arena-client-select">${esc(u('selectClient'))}</label>
          <select id="arena-client-select">
            ${clientOptions.join('')}
          </select>
        </div>
      </div>
      <div class="arena-stats">
        <div class="arena-stat" style="--sa:250 204 21">
          <span class="arena-stat-ic" aria-hidden="true">${trophySvg()}</span>
          <div class="arena-stat-body">
            <div class="arena-stat-label">${esc(u('trophies'))}</div>
            <div class="arena-stat-value">${state.summary.trophies}</div>
          </div>
        </div>
        <div class="arena-stat" style="--sa:34 211 238">
          <span class="arena-stat-ic" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2 4.5 13.5H11l-1 8.5 8.5-11.5H12l1-8.5z"/></svg></span>
          <div class="arena-stat-body">
            <div class="arena-stat-label">${esc(u('xp'))}</div>
            <div class="arena-stat-value">${state.summary.xp}</div>
          </div>
        </div>
        <div class="arena-stat" style="--sa:167 139 250">
          <span class="arena-stat-ic" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3 2.4 5.3 5.6.6-4.2 3.9 1.2 5.7L12 15.6 6.9 18.5l1.2-5.7L4 8.9l5.6-.6L12 3z"/></svg></span>
          <div class="arena-stat-body">
            <div class="arena-stat-label">${esc(u('progress'))}</div>
            <div class="arena-stat-value is-text">${esc(rankLabel(state.summary.rank))}</div>
          </div>
        </div>
      </div>
      <div class="arena-tabs" role="tablist">
        <button type="button" role="tab" aria-selected="${state.view !== 'trophies' && state.view !== 'review'}" data-arena-action="tab" data-tab="games" class="arena-tab ${state.view !== 'trophies' && state.view !== 'review' ? 'is-on' : ''}">${esc(u('games'))}</button>
        <button type="button" role="tab" aria-selected="${state.view === 'trophies'}" data-arena-action="tab" data-tab="trophies" class="arena-tab ${state.view === 'trophies' ? 'is-on' : ''}">${esc(u('trophies'))} <span class="arena-tab-count">${state.summary.trophies}</span></button>
        <button type="button" role="tab" aria-selected="${state.view === 'review'}" data-arena-action="tab" data-tab="review" class="arena-tab ${state.view === 'review' ? 'is-on' : ''}">${esc(u('reviewTab'))}${reviewBadge}</button>
      </div>`;
  }

  function renderFlash() {
    if (!state.flash) return '';
    var t = state.flash.trophy;
    return `
      <div class="arena-flash">
        <span class="arena-flash-ic" aria-hidden="true">${trophySvg()}</span>
        <div class="arena-flash-body">
          <div class="arena-flash-eyebrow">${esc(u('trophyEarned'))}</div>
          <div class="arena-flash-title">${esc(tr(t.name))}</div>
        </div>
        <button type="button" data-arena-action="close-flash" class="w-8 h-8 grid place-items-center rounded-lg text-muted hover:bg-surface-2" aria-label="${esc(u('close'))}">✕</button>
      </div>`;
  }

  function renderGames() {
    var games = (state.data && state.data.games) || [];
    return `<div class="arena-games">${games.map(function (game) {
      var paths = game.paths || [];
      var ga = rgbTriplet(game.color);
      var pathHtml = '';
      if (!game.available || !paths.length) {
        pathHtml = `<div class="arena-soon">${esc(u('comingSoon'))}</div>`;
      } else {
        pathHtml = `${paths.map(function (path) {
          var rec = state.records[path.id] || emptyRecord(state.clientId, path.id);
          var done = (rec.trophies || []).length;
          var total = (path.tiers || []).length;
          var pct = total ? Math.round(done / total * 100) : 0;
          return `<button type="button" data-arena-action="open-path" data-path="${esc(path.id)}" class="arena-path" style="--ga:${ga}">
            <span class="arena-path-top">
              <span class="arena-path-name">
                <b>${esc(tr(path.name))}</b>
                <small>${esc(tr(path.subtitle))}</small>
              </span>
              <span class="arena-path-count">${done}/${total}</span>
            </span>
            <span class="arena-path-bar"><i style="width:${pct}%"></i></span>
          </button>`;
        }).join('')}`;
      }
      return `<div class="arena-game" style="--ga:${ga}">
        <div class="arena-game-band">
          <span class="arena-game-mark" aria-hidden="true">${gameIcon(game.id)}</span>
          <div class="arena-game-title">
            <h3>${esc(tr(game.name))}</h3>
            <p>${esc(tr(game.description))}</p>
          </div>
          <span class="arena-game-watermark" aria-hidden="true">${gameIcon(game.id)}</span>
        </div>
        <div class="arena-game-body">${pathHtml}</div>
      </div>`;
    }).join('') + hallPanel()}</div>`;
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
      var tierLessons = tier.lessons || [];
      var completed = (rec.trophies || []).some(function (t) { return t.tier_id === tier.id; });
      var current = !completed && index === Number(rec.current_tier || 0);
      var locked = !completed && index > Number(rec.current_tier || 0);
      var checkedLessons = tierLessons.filter(function (lesson) {
        return completed || (rec.completed_lessons || []).indexOf(tier.id + '::' + lesson.id) !== -1;
      }).length;
      var lessonsDone = tierLessons.length > 0 && checkedLessons === tierLessons.length;
      var status = completed ? u('completed') : (current ? u('current') : (locked ? u('locked') : u('locked')));
      var tierColor = rgbTriplet(info.color);
      var lessonsHtml = tierLessons.map(function (lesson) {
        var key = tier.id + '::' + lesson.id;
        var checked = completed || (rec.completed_lessons || []).indexOf(key) !== -1;
        return `<div class="arena-lesson ${checked ? 'is-done' : ''} ${(!current && !completed) ? 'is-locked' : ''}" style="--ta:${tierColor}">
          <label class="arena-lesson-row">
            <input type="checkbox" class="arena-lesson-check" ${checked ? 'checked' : ''} ${(!current || completed) ? 'disabled' : ''} data-arena-action="toggle-lesson" data-tier="${esc(tier.id)}" data-lesson="${esc(lesson.id)}" />
            <span class="arena-lesson-body">
              <span class="arena-lesson-name">${esc(tr(lesson.name))}</span>
              <span class="arena-lesson-dose">${esc(tr(lesson.prescription))}</span>
            </span>
          </label>
          <details class="arena-lesson-more">
            <summary>${esc(u('exerciseCard'))}</summary>
            <div class="arena-lesson-card">
              ${lesson.image ? `<div class="arena-lesson-media"><img src="${esc(lesson.image)}" alt="${esc(tr(lesson.name))}" loading="lazy" /></div>` : ''}
              <div><b>${esc(u('technique'))}:</b><br>${lines(tr(lesson.technique)).map(esc).join('<br>')}</div>
              <div><b>${esc(u('checkpoints'))}:</b><br>${lines(tr(lesson.checkpoints)).map(esc).join('<br>')}</div>
              <div><b>${esc(u('mistakes'))}:</b><br>${lines(tr(lesson.mistakes)).map(esc).join('<br>')}</div>
              ${lesson.exerciseId ? `<button type="button" data-arena-action="open-exercise" data-exercise="${esc(lesson.exerciseId)}" class="arena-btn w-full">${esc(u('openInDb'))}</button>` : ''}
            </div>
          </details>
        </div>`;
      }).join('');
      var examHtml = '';
      if (completed) {
        var trophy = (rec.trophies || []).filter(function (t) { return t.tier_id === tier.id; })[0];
        examHtml = `<div class="arena-trophy-line" style="--ta:${tierColor}">
          <span class="arena-trophy-line-ic" aria-hidden="true">${trophySvg()}</span>
          <span class="min-w-0 flex-1">
            <b>${esc(trophy ? tr(trophy.name) : tr(tier.trophy.name))}</b>
            <small>${trophy ? esc(fmtDate(trophy.earned_at)) : ''}</small>
          </span>
        </div>`;
      } else if (locked) {
        examHtml = `<div class="arena-locked">${esc(u('pathLocked'))}</div>`;
      } else if (!lessonsDone) {
        examHtml = `<div class="arena-locked">${esc(u('examLocked'))}</div>`;
      } else {
        examHtml = renderExamForm(tier, rec);
      }
      var tierPct = tierLessons.length ? Math.round(checkedLessons / tierLessons.length * 100) : 0;
      return `<div class="arena-tier ${current ? 'is-current' : ''} ${locked ? 'is-locked' : ''}" style="--ta:${tierColor}">
        <div class="arena-tier-head">
          <span class="arena-tier-num">${index + 1}</span>
          <div class="arena-tier-main">
            <div class="arena-tier-title">
              <h4>${esc(tr(tier.name))}</h4>
              <span class="arena-tier-chip">${checkedLessons}/${tierLessons.length}</span>
              <span class="arena-tier-status">${esc(status)}</span>
            </div>
            <p class="arena-tier-goal">${esc(tr(tier.goal))}</p>
            ${!completed ? `<div class="arena-tier-left">${tierLessons.length - checkedLessons} ${esc(u('lessonsLeft'))}</div>` : ''}
          </div>
          <div class="arena-tier-progress" style="--p:${tierPct}" aria-hidden="true"><b>${tierPct}%</b></div>
        </div>
        <div class="arena-tier-body">${lessonsHtml}${examHtml}</div>
      </div>`;
    }).join('');

    var assignment = rec.assignment || null;
    var assignHtml = assignment
      ? '<div class="arena-assign-note"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8v4l2.5 2.5"/><circle cx="12" cy="12" r="9"/></svg><span>' + esc(u('assignedByCoach'))
        + (assignment.deadline ? ' · ' + esc(assignment.deadline) : '')
        + (assignment.note ? ' — ' + esc(assignment.note) : '')
        + '</span></div>'
      : '';
    var assignAction = state.clientId !== 'self'
      ? '<button type="button" data-arena-action="assign-open" data-path="' + esc(state.pathId) + '" class="arena-btn arena-btn-primary"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>' + esc(u('assignPath')) + '</button>'
      : '';
    return `
      <button type="button" data-arena-action="back" class="arena-back" style="--ga:${rgbTriplet(game.color)}"><span class="arena-back-ic" aria-hidden="true">←</span>${esc(u('back'))}</button>
      <div class="arena-path-hero" style="--ga:${rgbTriplet(game.color)}" data-path-head>
        <span class="arena-path-mark" aria-hidden="true">${gameIcon(game.id)}</span>
        <div class="arena-path-main">
          <h2>${esc(tr(path.name))}</h2>
          <p>${esc(tr(path.description))}</p>
          <div class="arena-path-meta">
            <span class="arena-pill">${trophySvg()}<span>${trophyCount}/${tiers.length}</span></span>
            <span class="arena-pill">${esc(tr(game.name))}</span>
          </div>
          ${assignHtml}
          ${assignAction ? '<div class="mt-2">' + assignAction + '</div>' : ''}
        </div>
      </div>
      <div class="arena-tiers" style="--ga:${rgbTriplet(game.color)}">${tierHtml}</div>
      <div class="mt-3 text-center">
        <button type="button" data-arena-action="reset-path" class="arena-btn arena-btn-danger">${esc(u('resetProgress'))}</button>
      </div>`;
  }

  function examResultRows(attempt) {
    return ((attempt && attempt.results) || []).map(function (r) {
      var ok = !!r.passed;
      return `<div class="arena-result-row">
        <span class="min-w-0 truncate ${ok ? 'text-muted' : 'text-danger font-semibold'}">${esc(r.label)}</span>
        <span class="flex items-center gap-1.5 shrink-0">
          <b class="${ok ? 'text-text' : 'text-danger'}">${esc(r.display)}</b>
          <span class="${ok ? 'text-success' : 'text-danger'} font-bold">${ok ? '✓' : '✕'}</span>
        </span>
      </div>`;
    }).join('');
  }

  function renderExamForm(tier, rec) {
    var bodyweight = rec.bodyweight;
    if (!bodyweight && state.clientId !== 'self') {
      var client = state.clients.filter(function (c) { return String(c.id) === String(state.clientId); })[0];
      if (client && client.weight) bodyweight = client.weight;
    }
    if (!bodyweight) bodyweight = 80;
    var stations = (tier.exam && tier.exam.stations) || [];
    var attempts = rec.exam_attempts || [];
    var last = attempts.slice(-1)[0];
    var fields = stations.map(function (station) {
      var lastResult = last && (last.results || []).filter(function (r) { return r.station_id === station.id; })[0];
      var lastValues = lastResult && lastResult.values;
      var unit = station.type === 'hold' ? u('seconds')
        : station.type === 'load_bw' ? '× BW'
        : station.type === 'time' ? u('timeHint')
        : station.type === 'distance' ? (station.unit === 'cm' ? u('cmShort') : u('metersShort'))
        : u('reps');
      var label = `<div class="arena-station-top"><b>${esc(tr(station.name))}</b>${station.type !== 'manual' ? `<span>${esc(unit)}</span>` : ''}</div>`;
      var input = '';
      if (station.type === 'reps' || station.type === 'hold') {
        var sets = Math.max(1, Number(station.sets) || 1);
        input = '<div class="grid gap-1.5 mt-1.5" style="grid-template-columns:repeat(' + sets + ',minmax(0,1fr))">' + Array.from({ length: sets }).map(function (_, i) {
          var prev = Array.isArray(lastValues) && lastValues[i] != null && lastValues[i] !== '' ? lastValues[i] : '';
          return `<input type="number" min="0" step="1" inputmode="numeric" data-arena-input="${esc(station.id)}:${i}" value="${prev !== '' ? esc(prev) : ''}" placeholder="${station.type === 'hold' ? esc(u('seconds')) : esc(u('reps'))}" class="arena-input" />`;
        }).join('') + '</div>';
      } else if (station.type === 'time') {
        var prevTime = lastValues != null && lastValues !== '' ? (Number(lastValues) < 60 ? String(lastValues) : fmtTime(lastValues)) : '';
        input = `<input type="text" inputmode="numeric" data-arena-input="${esc(station.id)}:time" value="${prevTime ? esc(prevTime) : ''}" placeholder="мм:сс" class="arena-input mt-1.5" />`;
      } else if (station.type === 'distance') {
        var prevDist = lastValues != null && lastValues !== '' ? lastValues : '';
        var distUnit = station.unit === 'cm' ? u('cmShort') : u('metersShort');
        input = `<input type="number" min="0" step="0.01" inputmode="decimal" data-arena-input="${esc(station.id)}:distance" value="${prevDist !== '' ? esc(prevDist) : ''}" placeholder="${esc(distUnit)}" class="arena-input mt-1.5" />`;
      } else if (station.type === 'load_bw') {
        var lv = lastValues || {};
        input = `<div class="grid grid-cols-2 gap-2 mt-1.5">
          <label class="text-[10px] text-muted">${esc(u('weightKg'))}<input type="number" min="0" step="0.5" inputmode="decimal" data-arena-input="${esc(station.id)}:weight" value="${lv.weight != null && lv.weight !== '' ? esc(lv.weight) : ''}" class="arena-input mt-1" /></label>
          <label class="text-[10px] text-muted">${esc(u('bodyweightKg'))}<input type="number" min="0" step="0.1" inputmode="decimal" data-arena-input="${esc(station.id)}:bodyweight" value="${lv.bodyweight != null && lv.bodyweight !== '' ? esc(lv.bodyweight) : esc(bodyweight)}" class="arena-input mt-1" /></label>
        </div>`;
      } else if (station.type === 'manual') {
        var wasChecked = !!(lastValues && lastValues.checked);
        input = `<label class="arena-station-hint flex items-center gap-2 mt-1.5"><input type="checkbox" data-arena-input="${esc(station.id)}:manual" ${wasChecked ? 'checked' : ''} class="w-4 h-4 rounded border-border text-primary focus:ring-primary/50" />${esc(u('manualHint'))}</label>`;
      }
      return `<div class="arena-station">${label}${input}${station.hint ? `<div class="arena-station-hint">${esc(tr(station.hint))}</div>` : ''}</div>`;
    }).join('');
    var weak = last ? (last.results || []).filter(function (r) { return !r.passed; }) : [];
    var lastHtml = last ? `<div data-arena-last-attempt class="arena-attempt ${last.passed ? 'is-pass' : 'is-fail'}">
      <div class="arena-attempt-head">
        <span>${esc(u('lastAttempt'))} · ${esc(last.passed ? u('passed') : u('failed'))}</span>
        <span class="text-[10px] font-medium text-muted">${esc(fmtDate(last.at))}</span>
      </div>
      <div class="mt-1.5">${examResultRows(last)}</div>
      ${weak.length ? `<div class="mt-2 text-[10px] font-semibold text-danger">${esc(u('weakStations'))}: ${weak.map(function (r) { return esc(r.label); }).join(', ')}</div>` : ''}
      ${last.video ? `<a href="${esc(last.video)}" target="_blank" rel="noopener" class="inline-flex items-center gap-1 text-[10px] font-semibold text-primary-2 mt-1.5">${esc(u('video'))} ↗</a>` : ''}
    </div>` : '';
    var historyHtml = attempts.length ? `<details class="mt-2">
      <summary class="cursor-pointer text-[10px] font-semibold text-muted select-none">${esc(u('attemptHistory'))} · ${attempts.length}</summary>
      <div class="mt-1.5 space-y-1">${attempts.slice(-10).reverse().map(function (a) {
        var fails = (a.results || []).filter(function (r) { return !r.passed; }).length;
        return `<div class="arena-result-row text-[10px]">
          <span class="text-muted">${esc(fmtDate(a.at))}</span>
          <span class="flex items-center gap-1.5"><b class="${a.passed ? 'text-success' : 'text-danger'}">${esc(a.passed ? u('passed') : u('failed'))}</b>${fails ? `<span class="text-muted">${fails} ✕</span>` : ''}</span>
        </div>`;
      }).join('')}</div>
    </details>` : '';
    return `<div class="arena-exam">
      <div class="arena-exam-head"><h5>${esc(u('exam'))}</h5><span>${esc(u('retake'))}</span></div>
      ${tier.exam && tier.exam.intro ? `<p class="arena-exam-intro">${esc(tr(tier.exam.intro))}</p>` : ''}
      <div class="grid gap-2">${fields}</div>
      <label class="block text-[10px] text-muted mt-2">${esc(u('videoAttach'))}<input type="file" accept="video/*,image/*" capture="environment" data-arena-input="video:file" class="arena-media-file mt-1" /></label>
      <label class="block text-[10px] text-muted mt-2">${esc(u('videoOptional'))}<input type="url" data-arena-input="video:url" placeholder="https://..." value="${last && last.video ? esc(last.video) : ''}" class="arena-input mt-1" /></label>
      <button type="button" data-arena-action="submit-exam" data-path="${esc(state.pathId)}" data-tier="${esc(tier.id)}" class="arena-btn arena-btn-primary w-full mt-3">${esc(u('submitExam'))}</button>
      ${lastHtml}
      ${historyHtml}
    </div>`;
  }

  /* c246: "Арена зала" — every athlete in the gym at a glance: trophies,
     exams waiting for review, last exam date. Only for the coach's own
     (self) view; replaced when the coach opens an athlete. */
  async function computeHallSummaries(clients) {
    var all = [];
    try { all = await db.all('arena_progress'); } catch (_) { return []; }
    var byClient = {};
    (all || []).forEach(function (rec) {
      var id = String((rec && rec.client_id) || '');
      if (!byClient[id]) byClient[id] = { id: id, trophies: 0, pending: 0, lastExamAt: 0 };
      byClient[id].trophies += ((rec && rec.trophies) || []).length;
      ((rec && rec.exam_attempts) || []).forEach(function (a) {
        if (!a) return;
        if (a.status === 'pending') byClient[id].pending += 1;
        else if (a.at) byClient[id].lastExamAt = Math.max(byClient[id].lastExamAt, a.at);
      });
    });
    var names = {};
    (clients || []).forEach(function (c) { names[String(c.id)] = clientName(c); });
    return Object.keys(byClient).map(function (id) {
      var s = byClient[id];
      return { id: id, name: names[id] || id, trophies: s.trophies, pending: s.pending, lastExamAt: s.lastExamAt };
    }).sort(function (a, b) { return (b.pending - a.pending) || (b.trophies - a.trophies); });
  }

  function hallPanel() {
    if (!state.hallSummaries.length) return '';
    var html = '<div class="arena-hall">'
      + '<div class="arena-hall-head"><span class="arena-hall-ic" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5z"/><path d="M3 20a9 9 0 0 1 18 0"/></svg></span>'
      + '<h3>' + esc(u('hallTitle')) + '</h3>'
      + '<span class="arena-hall-count">' + state.hallSummaries.length + '</span></div>'
      + '<div>';
    state.hallSummaries.forEach(function (s) {
      var initials = String(s.name || '?').trim().slice(0, 1).toUpperCase();
      html += '<button type="button" data-arena-action="open-athlete" data-client="' + esc(s.id) + '" class="arena-hall-row">'
        + '<span class="arena-hall-avatar" aria-hidden="true">' + esc(initials) + '</span>'
        + '<span class="arena-hall-name">' + esc(s.name) + '</span>'
        + '<span class="arena-hall-stat">' + s.trophies + ' ' + esc(u('hallTrophies')) + '</span>'
        + (s.pending ? '<span class="arena-hall-pending">' + s.pending + ' ' + esc(u('hallPending')) + '</span>' : '')
        + (s.lastExamAt ? '<span class="arena-hall-date">' + esc(fmtDate(s.lastExamAt)) + '</span>' : '')
        + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="arena-hall-chev"><path d="m9 6 6 6-6 6"/></svg></button>';
    });
    html += '</div></div>';
    return html;
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
      return `<div class="arena-empty">
        <div class="arena-empty-ic">${trophySvg()}</div>
        <div class="arena-empty-title">${esc(u('noTrophies'))}</div>
        <p class="arena-empty-text">${esc(u('noTrophiesHint'))}</p>
      </div>`;
    }
    return `<div class="arena-trophy-grid">${trophies.map(function (row) {
      var t = row.trophy;
      var tierColor = rgbTriplet(tierInfo(t.tier).color);
      var results = (t.results || []).map(function (r) {
        return `<div class="arena-result-row"><span class="text-muted truncate">${esc(r.label)}</span><b class="${r.passed ? 'text-success' : 'text-danger'}">${esc(r.display)}</b></div>`;
      }).join('');
      return `<div class="arena-trophy" style="--ta:${tierColor}">
        <div class="arena-trophy-top">
          <span class="arena-trophy-plate" aria-hidden="true">${trophySvg()}</span>
          <div class="arena-trophy-main">
            <div class="arena-trophy-tier">${esc(tr(t.tier ? (TIER[t.tier] && TIER[t.tier].label) : null) || '')}</div>
            <div class="arena-trophy-name">${esc(tr(t.name))}</div>
            <div class="arena-trophy-meta">${esc(row.game ? tr(row.game.name) : '')}${row.path ? ' · ' + esc(tr(row.path.name)) : ''} · ${esc(fmtDate(t.earned_at))}</div>
          </div>
        </div>
        ${results ? `<div class="arena-trophy-results">${results}</div>` : ''}
        <div class="arena-trophy-actions">
          ${t.video ? `<a href="${esc(t.video)}" target="_blank" rel="noopener">${esc(u('video'))} ↗</a>` : ''}
          ${t.verification_code ? `<button type="button" data-arena-action="copy-verify" data-code="${esc(t.verification_code)}">${esc(u('verifyTrophy'))}</button>` : ''}
          <button type="button" data-arena-action="share-trophy" data-path="${esc(t.path_id || '')}" data-tier="${esc(t.tier_id)}" class="is-muted">${esc(u('share'))}</button>
        </div>
      </div>`;
    }).join('')}</div>`;
  }

  /* c245: the coach's verification queue — pending exam attempts from every
     client in the gym, across every path. Sorted oldest first so nothing
     rots. Trainer self-attempts are never pending (auto-approved). */
  async function allPendingReviews(clients) {
    var out = [];
    try {
      var all = await db.all('arena_progress');
      var clientMap = {};
      (clients || []).forEach(function (c) { clientMap[String(c.id)] = clientName(c); });
      (all || []).forEach(function (rec) {
        var attempts = rec.exam_attempts || [];
        attempts.forEach(function (a) {
          if (a && a.status === 'pending') {
            out.push({
              clientId: String(rec.client_id || ''),
              clientName: clientMap[String(rec.client_id)] || String(rec.client_id || ''),
              pathId: rec.path_id,
              attempt: a
            });
          }
        });
      });
    } catch (_) {}
    return out.sort(function (a, b) { return (a.attempt.at || 0) - (b.attempt.at || 0); });
  }

  function renderReview() {
    if (!state.pendingReviews.length) {
      return `<div class="arena-empty">
        <div class="arena-empty-ic" style="color:rgb(var(--c-success));background:rgb(var(--c-success) / .12);border-color:rgb(var(--c-success) / .3)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></div>
        <div class="arena-empty-title">${esc(u('reviewNone'))}</div>
      </div>`;
    }
    var html = '<p class="arena-sec-label">' + esc(u('reviewHeader')) + ' (' + state.pendingReviews.length + ')</p><div class="arena-review">';
    state.pendingReviews.forEach(function (item) {
      var a = item.attempt;
      var found = findPath(item.pathId);
      var pathName = found ? tr(found.path.name) : item.pathId;
      var gameName = found ? tr(found.game.name) : '';
      var tierLabel2 = (a.tier_id || '').toUpperCase();
      var tierColor = found ? rgbTriplet(tierInfo(a.tier_id).color) : '239 68 68';
      html += '<div class="arena-review-card" style="--ta:' + tierColor + '" data-attempt-id="' + esc(a.id) + '" data-client-id="' + esc(item.clientId) + '" data-path-id="' + esc(item.pathId) + '">';
      html += '<div class="arena-review-head"><b>' + esc(item.clientName) + '</b><span>· ' + esc(gameName) + ' · ' + esc(pathName) + ' · ' + esc(tierLabel2) + '</span></div>';
      html += '<div class="arena-review-date">' + esc(fmtDate(a.at)) + '</div>';
      if (a.video_file_id) {
        html += '<div class="arena-review-video"><div class="arena-review-label">' + esc(u('reviewVideo')) + '</div><video controls preload="metadata" src="/api/files/' + esc(a.video_file_id) + '"></video></div>';
      } else if (a.video) {
        html += '<div class="arena-review-video"><div class="arena-review-label">' + esc(u('reviewVideo')) + '</div><a class="text-xs text-primary-2 underline break-all" href="' + esc(a.video) + '" target="_blank" rel="noopener">' + esc(a.video) + '</a></div>';
      }
      html += '<div class="arena-review-results">';
      (a.results || []).forEach(function (r) {
        html += '<div><span class="arena-result-dot ' + (r.passed ? 'ok' : 'no') + '">' + (r.passed ? '✓' : '✕') + '</span><span class="flex-1 min-w-0 truncate font-medium">' + esc(r.label || r.station_id) + '</span><span class="font-mono text-muted shrink-0">' + esc(r.display || '') + '</span></div>';
      });
      html += '</div>';
      html += '<div class="arena-review-actions">';
      html += '<button type="button" data-arena-action="approve-attempt" class="arena-approve">' + esc(u('reviewApprove')) + '</button>';
      html += '<button type="button" data-arena-action="reject-attempt" class="arena-reject">' + esc(u('reviewReject')) + '</button>';
      html += '</div></div>';
    });
    html += '</div>';
    return html;
  }

  async function approveAttempt(attemptId, clientId, pathId) {
    var rec = await db.get('arena_progress', progressId(clientId, pathId)).catch(function () { return null; });
    if (!rec) return;
    var attempts = rec.exam_attempts || [];
    var attempt = null;
    attempts.forEach(function (a) { if (String(a.id) === String(attemptId)) attempt = a; });
    if (!attempt || attempt.status !== 'pending') { await render(); return; }
    var found = findPath(pathId);
    if (!found) { await render(); return; }
    var tier = null, tierIndex = -1;
    (found.path.tiers || []).forEach(function (t, i) { if (t.id === attempt.tier_id) { tier = t; tierIndex = i; } });
    if (!tier) { await render(); return; }
    attempt.status = 'approved';
    attempt.reviewed_at = Date.now();
    attempt.reviewed_by = state.clientId === 'self' ? 'coach' : 'coach';
    rec.exam_attempts = attempts;
    var existing = (rec.trophies || []).some(function (t) { return t.tier_id === tier.id; });
    if (!existing) {
      var verifyCode = '';
      try { if (window.crypto && window.crypto.randomUUID) verifyCode = window.crypto.randomUUID().replace(/-/g, ''); } catch (_) {}
      if (!verifyCode) verifyCode = Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
      var snapshot = {
        id: tier.trophy.id || (pathId + '_' + tier.id),
        tier_id: tier.id,
        tier: tier.tier,
        path_id: pathId,
        game_id: found.game.id,
        name: tier.trophy.name,
        description: tier.trophy.description,
        earned_at: Date.now(),
        results: (attempt.results || []),
        video: attempt.video || '',
        attempt_id: attempt.id,
        verification_code: verifyCode,
        approved_by_coach: true
      };
      rec.trophies = (rec.trophies || []).concat(snapshot);
      rec.current_tier = Math.max(Number(rec.current_tier || 0), tierIndex + 1);
      toastSafe(u('reviewApproved'), 'success');
    } else {
      toastSafe(u('reviewApproved'), 'success');
    }
    await saveRecord(rec);
    state.records[pathId] = rec;
    await render();
    try { var all = await db.all('arena_progress'); } catch (_) {}
  }

  async function rejectAttempt(attemptId, clientId, pathId) {
    var reason = '';
    try { reason = window.prompt(u('reviewReject') + ' — ' + u('assignNote'), '') || ''; } catch (_) { reason = ''; }
    var rec = await db.get('arena_progress', progressId(clientId, pathId)).catch(function () { return null; });
    if (!rec) return;
    var attempts = rec.exam_attempts || [];
    attempts.forEach(function (a) {
      if (String(a.id) === String(attemptId)) {
        a.status = 'rejected';
        a.reviewed_at = Date.now();
        a.reviewed_by = 'coach';
        a.review_note = reason || u('reviewRejectedByCoach');
      }
    });
    rec.exam_attempts = attempts;
    await saveRecord(rec);
    state.records[pathId] = rec;
    await render();
    toastSafe(u('reviewRejectedToast'), 'info');
  }

  async function assignPath(pathId) {
    if (state.clientId === 'self') return;
    var found = findPath(pathId);
    if (!found) return;
    var root = document.getElementById('arena-root');
    if (root && root.querySelector('[data-assign-panel]')) return;
    var html = '<div class="mt-3 bg-surface border border-primary/40 rounded-2xl p-4" data-assign-panel>'
      + '<div class="text-xs font-extrabold uppercase tracking-wider text-primary-2 mb-2">' + esc(u('assignTitle')) + '</div>'
      + '<label class="text-[10px] font-bold text-muted block mb-1">' + esc(u('level')) + '</label>'
      + '<select class="w-full bg-surface-2 border border-border rounded-xl px-3 py-2 text-sm mb-2" data-assign-tier>'
      + (found.path.tiers || []).map(function (t) { return '<option value="' + esc(t.id) + '">' + esc(tr(t.name)) + '</option>'; }).join('')
      + '</select>'
      + '<label class="text-[10px] font-bold text-muted block mb-1">' + esc(u('assignDeadline')) + '</label>'
      + '<input type="date" class="w-full bg-surface-2 border border-border rounded-xl px-3 py-2 text-sm mb-2" data-assign-deadline />'
      + '<label class="text-[10px] font-bold text-muted block mb-1">' + esc(u('assignNote')) + '</label>'
      + '<textarea rows="2" class="w-full bg-surface-2 border border-border rounded-xl px-3 py-2 text-sm mb-2" data-assign-note></textarea>'
      + '<div class="flex items-center gap-2"><button type="button" data-arena-action="assign-save" data-path="' + esc(pathId) + '" class="bg-primary text-white text-xs font-bold px-4 py-2 rounded-xl">' + esc(u('assignSave')) + '</button>'
      + '<button type="button" data-arena-action="assign-cancel" class="text-xs text-muted px-3 py-2">' + esc(u('close')) + '</button></div>'
      + '</div>';
    if (root) {
      var pathHead = root.querySelector('[data-path-head]');
      if (pathHead) pathHead.insertAdjacentHTML('afterend', html);
      else root.insertAdjacentHTML('beforeend', html);
    }
  }

  async function saveAssignment(pathId, button) {
    if (state.clientId === 'self') return;
    var panel = button.closest('[data-assign-panel]');
    if (!panel) return;
    var tierSel = panel.querySelector('[data-assign-tier]');
    var deadlineEl = panel.querySelector('[data-assign-deadline]');
    var noteEl = panel.querySelector('[data-assign-note]');
    var rec = await getRecord(state.clientId, pathId);
    rec.assignment = {
      tier_id: tierSel ? tierSel.value : '',
      deadline: deadlineEl ? deadlineEl.value : '',
      note: noteEl ? noteEl.value : '',
      assigned_at: Date.now(),
      assigned_by: 'coach'
    };
    await saveRecord(rec);
    state.records[pathId] = rec;
    await render();
    toastSafe(u('assignDone'), 'success');
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
    var stations = (tier.exam && tier.exam.stations) || [];
    var missingStation = false;
    stations.forEach(function (station) {
      if (station.type === 'reps' || station.type === 'hold') {
        var sets = Math.max(1, Number(station.sets) || 1);
        for (var si = 0; si < sets; si++) {
          var siEl = form.querySelector('[data-arena-input="' + station.id + ':' + si + '"]');
          if (!siEl || String(siEl.value).trim() === '') missingStation = true;
        }
      } else if (station.type === 'time') {
        var tEl = form.querySelector('[data-arena-input="' + station.id + ':time"]');
        if (!tEl || parseTime(tEl.value) <= 0) missingStation = true;
      } else if (station.type === 'distance') {
        var dEl = form.querySelector('[data-arena-input="' + station.id + ':distance"]');
        if (!dEl || String(dEl.value).trim() === '') missingStation = true;
      } else if (station.type === 'load_bw') {
        var wEl = form.querySelector('[data-arena-input="' + station.id + ':weight"]');
        var bwEl = form.querySelector('[data-arena-input="' + station.id + ':bodyweight"]');
        if (!wEl || !bwEl || String(wEl.value).trim() === '' || String(bwEl.value).trim() === '') missingStation = true;
      }
    });
    if (missingStation) {
      toastSafe(u('fillStations'), 'warning');
      return;
    }
    stations.forEach(function (station) {
      var label = tr(station.name);
      var display = '', passed = false, values = null;
      if (station.type === 'reps' || station.type === 'hold') {
        var sets = Math.max(1, Number(station.sets) || 1);
        var setValues = [];
        for (var i = 0; i < sets; i++) {
          var input = form.querySelector('[data-arena-input="' + station.id + ':' + i + '"]');
          setValues.push(num(input ? input.value : 0));
        }
        values = setValues;
        passed = setValues.every(function (v) { return v >= Number(station.target || 0); });
        display = setValues.join(' / ') + (station.type === 'hold' ? ' ' + u('seconds') : ' ' + u('reps'));
      } else if (station.type === 'time') {
        var tInput = form.querySelector('[data-arena-input="' + station.id + ':time"]');
        var seconds = parseTime(tInput ? tInput.value : 0);
        values = seconds;
        passed = seconds > 0 && seconds <= Number(station.target || 0);
        display = fmtPerfTime(seconds);
      } else if (station.type === 'distance') {
        var dInput = form.querySelector('[data-arena-input="' + station.id + ':distance"]');
        var meters = num(dInput ? dInput.value : 0);
        values = meters;
        passed = meters >= Number(station.target || 0);
        display = meters + ' ' + (station.unit === 'cm' ? u('cmShort') : u('metersShort'));
      } else if (station.type === 'load_bw') {
        var w = form.querySelector('[data-arena-input="' + station.id + ':weight"]');
        var bw = form.querySelector('[data-arena-input="' + station.id + ':bodyweight"]');
        var weight = num(w ? w.value : 0);
        bodyweight = num(bw ? bw.value : 0);
        values = { weight: weight, bodyweight: bodyweight };
        var ratio = bodyweight > 0 ? weight / bodyweight : 0;
        passed = ratio >= Number(station.target || 0);
        display = weight + ' kg / ' + bodyweight + ' kg = ' + ratio.toFixed(2) + '×';
      } else if (station.type === 'manual') {
        var check = form.querySelector('[data-arena-input="' + station.id + ':manual"]');
        passed = !!(check && check.checked);
        values = { checked: passed };
        display = passed ? u('passed') : u('failed');
      }
      results.push({ station_id: station.id, label: label, display: display, passed: passed, values: values });
    });
    var passedAll = results.length > 0 && results.every(function (r) { return r.passed; });
    var fileEl = form.querySelector('[data-arena-input="video:file"]');
    var videoFile = fileEl && fileEl.files && fileEl.files[0] ? fileEl.files[0] : null;
    var prevBtnHtml = button ? button.innerHTML : '';
    if (videoFile && button) { button.disabled = true; button.innerHTML = '<span>' + esc(u('uploadingVideo')) + '</span>'; }
    var videoFileId = '';
    if (videoFile) {
      try {
        var up = await window.dkArenaUploadVideo(videoFile, state.clientId);
        videoFileId = (up && up.id) ? up.id : '';
        if (button) { button.disabled = false; button.innerHTML = prevBtnHtml; }
      } catch (uploadErr) {
        console.error('[arena] video upload failed', uploadErr);
        toastSafe(u('uploadVideoFailed'), 'danger');
        if (button) { button.disabled = false; button.innerHTML = prevBtnHtml; }
        return;
      }
    }
    var videoEl = form.querySelector('[data-arena-input="video:url"]');
    var video = videoFileId ? ('/api/files/' + videoFileId) : (videoEl ? String(videoEl.value || '').trim() : '');
    var attempt = { id: 'att_' + Date.now(), at: Date.now(), passed: passedAll, results: results, video: video, video_file_id: videoFileId || null, status: 'approved', reviewed_by: 'coach', reviewed_at: Date.now() };
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
    if (!passedAll) {
      try {
        var lastPanel = document.querySelector('[data-arena-last-attempt]');
        if (lastPanel && lastPanel.scrollIntoView) lastPanel.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } catch (_) {}
    }
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
      if (summary) summary.textContent = n + ' ' + (n === 1 ? u('trophySingular') : u('trophies'));
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

  document.addEventListener('click', async function (event) {
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
    } else if (action === 'approve-attempt') {
      var card = el.closest('[data-attempt-id]');
      if (card) approveAttempt(card.getAttribute('data-attempt-id'), card.getAttribute('data-client-id'), card.getAttribute('data-path-id'));
    } else if (action === 'reject-attempt') {
      var card2 = el.closest('[data-attempt-id]');
      if (card2) rejectAttempt(card2.getAttribute('data-attempt-id'), card2.getAttribute('data-client-id'), card2.getAttribute('data-path-id'));
    } else if (action === 'assign-open') {
      assignPath(el.getAttribute('data-path'));
    } else if (action === 'assign-save') {
      saveAssignment(el.getAttribute('data-path'), el);
    } else if (action === 'assign-cancel') {
      var panel2 = el.closest('[data-assign-panel]');
      if (panel2) panel2.remove();
    } else if (action === 'copy-verify') {
      var vcode = el.getAttribute('data-code');
      var vurl = window.location.origin + '/verify?code=' + encodeURIComponent(vcode || '');
      var copied = false;
      try { if (navigator.share) { navigator.share({ title: 'David King Gym Arena', text: vurl }).catch(function () {}); copied = true; } } catch (_) {}
      if (!copied) {
        try { navigator.clipboard.writeText(vurl).then(function () { toastSafe(u('copiedLink'), 'success'); }).catch(function () {}); } catch (_) { toastSafe(vurl, 'info'); }
      }
    } else if (action === 'open-athlete') {
      var cid = el.getAttribute('data-client');
      state.clientId = String(cid || 'self');
      state.view = 'games';
      state.pathId = null;
      state.flash = null;
      render();
    } else if (action === 'open-exercise') {
      var exerciseId = el.getAttribute('data-exercise');
      if (exerciseId && typeof openExerciseModal === 'function') openExerciseModal(exerciseId);
    } else if (action === 'share-trophy') {
      var sharePath = el.getAttribute('data-path');
      var shareTier = el.getAttribute('data-tier');
      var shareRec = state.records[sharePath];
      var shareTrophy = shareRec && (shareRec.trophies || []).filter(function (x) { return x.tier_id === shareTier; })[0];
      if (!shareTrophy) return;
      var shareText = tr(shareTrophy.name) + ' — David King Gym Arena · ' + fmtDate(shareTrophy.earned_at);
      if (navigator.share) {
        navigator.share({ title: 'David King Gym Arena', text: shareText }).catch(function () {});
      } else if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(shareText).then(function () { toastSafe(u('copied'), 'success'); }).catch(function () {});
      } else {
        toastSafe(shareText, 'info');
      }
    } else if (action === 'reset-path') {
      if (!confirm(u('resetConfirm'))) return;
      try {
        await db.del('arena_progress', progressId(state.clientId, state.pathId));
        delete state.records[state.pathId];
        state.flash = null;
        await render();
        toastSafe(u('resetDone'), 'success');
      } catch (e) {
        toastSafe(u('resetFailed'), 'danger');
      }
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
