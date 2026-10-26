/* ============================================================
   DK ANATOMY SVG (c200)
   A second, fully vector muscle model next to the 3D atlas.
   Every muscle head is a real <g role="button"> — clickable,
   keyboard accessible, hoverable and synced between the front
   and back figure. No external images, no runtime dependencies.
   ============================================================ */
(function () {
  'use strict';

  const MUSCLES = {
    'scm':            { g: 'back', sub: 'Neck', view: 'front', en: 'Sternocleidomastoid', ru: 'Грудино-ключично-сосцевидная', he: 'שריר המסבן' },
    'traps-upper':    { g: 'back', sub: 'Trapezius', view: 'both', en: 'Upper trapezius', ru: 'Трапеция — верхние волокна', he: 'טרפז — סיבים עליונים' },
    'traps-mid':      { g: 'back', sub: 'Trapezius', view: 'back', en: 'Middle trapezius', ru: 'Трапеция — средние волокна', he: 'טרפז — סיבים אמצעיים' },
    'traps-low':      { g: 'back', sub: 'Trapezius', view: 'back', en: 'Lower trapezius', ru: 'Трапеция — нижние волокна', he: 'טרפז — סיבים תחתונים' },
    'rear-neck':      { g: 'back', sub: 'Neck', view: 'back', en: 'Splenius capitis', ru: 'Ременная мышца головы', he: 'שריר הוורד' },
    'deltoid':        { g: 'shoulders', sub: 'Front', view: 'front', en: 'Anterior deltoid', ru: 'Передний пучок дельтовидной', he: 'דלתואיד קדמי' },
    'rear-deltoid':   { g: 'shoulders', sub: 'Rear', view: 'back', en: 'Posterior deltoid', ru: 'Задний пучок дельтовидной', he: 'דלתואיד אחורי' },
    'pec':            { g: 'chest', sub: 'Upper', view: 'front', en: 'Pectoralis major', ru: 'Большая грудная мышца', he: 'שריר החזה הגדול' },
    'abs-upper':      { g: 'abdominals', sub: 'Upper', view: 'front', en: 'Rectus abdominis — upper', ru: 'Прямая мышца живота — верх', he: 'שריר הבטן הישר — עליון' },
    'abs-lower':      { g: 'abdominals', sub: 'Lower', view: 'front', en: 'Rectus abdominis — lower', ru: 'Прямая мышца живота — низ', he: 'שריר הבטן הישר — תחתון' },
    'obliques':       { g: 'abdominals', sub: 'Obliques', view: 'front', en: 'External obliques', ru: 'Наружная косая мышца', he: 'שריר אלכסוני חיצוני' },
    'serratus':       { g: 'back', sub: 'Lats', view: 'front', en: 'Serratus anterior', ru: 'Передняя зубчатая', he: 'שריר משור קדמי' },
    'biceps':         { g: 'elbow_flexors', sub: 'Biceps', view: 'front', en: 'Biceps brachii', ru: 'Двуглавая мышца плеча', he: 'שריר הזרוע הדו-ראשי' },
    'brachialis':     { g: 'elbow_flexors', sub: 'Brachialis', view: 'front', en: 'Brachialis', ru: 'Плечевая мышца', he: 'שריר הזרוע' },
    'brachioradialis':{ g: 'elbow_flexors', sub: 'Brachioradialis', view: 'both', en: 'Brachioradialis', ru: 'Плечелучевая мышца', he: 'שריר הזרוע־רדיאלי' },
    'forearm-flex':   { g: 'forearms', sub: 'Wrist Curls', view: 'front', en: 'Forearm flexors', ru: 'Сгибатели предплечья', he: 'כופפי אמה' },
    'forearm-ext':    { g: 'forearms', sub: 'Wrist Curls', view: 'back', en: 'Forearm extensors', ru: 'Разгибатели предплечья', he: 'פושטי אמה' },
    'hip-flexors':    { g: 'legs', sub: 'Hip Flexors', view: 'front', en: 'Hip flexors (iliopsoas)', ru: 'Подвздошно-поясничная мышца', he: 'כופפי הירך' },
    'quad-rf':        { g: 'legs', sub: 'Quadriceps', view: 'front', en: 'Rectus femoris', ru: 'Прямая мышца бедра', he: 'שריר הירך הישר' },
    'quad-vl':        { g: 'legs', sub: 'Quadriceps', view: 'front', en: 'Vastus lateralis', ru: 'Латеральная широкая мышца', he: 'תלת־ראשי הירך — חיצוני' },
    'quad-vm':        { g: 'legs', sub: 'Quadriceps', view: 'front', en: 'Vastus medialis', ru: 'Медиальная широкая мышца', he: 'תלת־ראשי הירך — פנימי' },
    'adductors':      { g: 'legs', sub: 'Adductors', view: 'front', en: 'Adductor group', ru: 'Приводящие мышцы бедра', he: 'מקרבי הירך' },
    'tibialis':       { g: 'legs', sub: 'Calves', view: 'front', en: 'Tibialis anterior', ru: 'Передняя большеберцовая', he: 'שריר השוקה הקדמי' },
    'calf-front':     { g: 'legs', sub: 'Calves', view: 'front', en: 'Lateral gastrocnemius', ru: 'Латеральная головка икроножной', he: 'תאומים — ראש חיצוני' },
    'lats':           { g: 'back', sub: 'Lats', view: 'back', en: 'Latissimus dorsi', ru: 'Широчайшая мышца спины', he: 'שריר הגב הרחב' },
    'teres':          { g: 'back', sub: 'Middle Back', view: 'back', en: 'Teres major & rhomboids', ru: 'Большая круглая и ромбовидные', he: 'טרז מז׳ור ומעוינים' },
    'triceps':        { g: 'triceps', sub: 'Triceps', view: 'back', en: 'Triceps brachii', ru: 'Трёхглавая мышца плеча', he: 'שריר הזרוע התלת־ראשי' },
    'erector':        { g: 'back', sub: 'Lower Back', view: 'back', en: 'Erector spinae', ru: 'Разгибатели спины', he: 'זוקפי הגו' },
    'glute-max':      { g: 'legs', sub: 'Glutes', view: 'back', en: 'Gluteus maximus', ru: 'Большая ягодичная', he: 'שריר העכוז הגדול' },
    'glute-med':      { g: 'legs', sub: 'Glutes', view: 'back', en: 'Gluteus medius', ru: 'Средняя ягодичная', he: 'שריר העכוז האמצעי' },
    'ham-outer':      { g: 'legs', sub: 'Hamstrings', view: 'back', en: 'Biceps femoris', ru: 'Двуглавая мышца бедра', he: 'שריר הירך הדו־ראשי' },
    'ham-inner':      { g: 'legs', sub: 'Hamstrings', view: 'back', en: 'Semitendinosus', ru: 'Полусухожильная мышца', he: 'שריר חצי־גידי' },
    'calf-medial':    { g: 'legs', sub: 'Calves', view: 'back', en: 'Medial gastrocnemius', ru: 'Медиальная головка икроножной', he: 'תאומים — ראש פנימי' },
    'calf-lateral':   { g: 'legs', sub: 'Calves', view: 'back', en: 'Lateral gastrocnemius', ru: 'Латеральная головка икроножной', he: 'תאומים — ראש חיצוני' }
  };

  const GROUPS = [
    { id: 'chest',      g: ['chest'] },
    { id: 'back',       g: ['back'] },
    { id: 'shoulders',  g: ['shoulders'] },
    { id: 'biceps',     g: ['elbow_flexors'] },
    { id: 'triceps',    g: ['triceps'] },
    { id: 'forearms',   g: ['forearms'] },
    { id: 'abs',        g: ['abdominals'] },
    { id: 'quads',      g: ['legs'], sub: 'Quadriceps' },
    { id: 'adductors',  g: ['legs'], sub: 'Adductors' },
    { id: 'hamstrings', g: ['legs'], sub: 'Hamstrings' },
    { id: 'glutes',     g: ['legs'], sub: 'Glutes' },
    { id: 'calves',     g: ['legs'], sub: 'Calves' }
  ];

  const GROUP_NAMES = {
    chest:     { en: 'Chest',      ru: 'Грудь',       he: 'חזה' },
    back:      { en: 'Back',       ru: 'Спина',       he: 'גב' },
    shoulders: { en: 'Shoulders',  ru: 'Плечи',       he: 'כתפיים' },
    biceps:    { en: 'Biceps',     ru: 'Бицепс',      he: 'יד קדמית' },
    triceps:   { en: 'Triceps',    ru: 'Трицепс',     he: 'יד אחורית' },
    forearms:  { en: 'Forearms',   ru: 'Предплечья',  he: 'אמות' },
    abs:       { en: 'Abs',        ru: 'Пресс',       he: 'בטן' },
    quads:     { en: 'Quads',      ru: 'Квадрицепс',  he: 'ארבע־ראשי' },
    adductors: { en: 'Adductors',  ru: 'Приводящие',  he: 'מקרבים' },
    hamstrings:{ en: 'Hamstrings', ru: 'Бицепс бедра',he: 'המסטרינג' },
    glutes:    { en: 'Glutes',     ru: 'Ягодицы',     he: 'עכוז' },
    calves:    { en: 'Calves',     ru: 'Икры',        he: 'תאומים' }
  };

  const FUNCTIONS = {
    chest:     { en: 'Pressing, adduction and horizontal flexion of the arm.', ru: 'Жим, приведение и горизонтальное сгибание руки.', he: 'לחיצה, קירוב וכיפוף אופקי של היד.' },
    back:      { en: 'Pulling, shoulder extension and scapular control.', ru: 'Тяга, разгибание плеча и контроль лопатки.', he: 'משיכה, פשיטת כתף ושליטה בשכמה.' },
    shoulders: { en: 'Raises the arm and stabilises the shoulder joint.', ru: 'Поднимает руку и стабилизирует плечевой сустав.', he: 'מרים את היד ומייצב את מפרק הכתף.' },
    biceps:    { en: 'Elbow flexion and forearm supination.', ru: 'Сгибание локтя и супинация предплечья.', he: 'כיפוף מרפק וסיבוב כף היד.' },
    triceps:   { en: 'Elbow extension — the main pushing muscle of the arm.', ru: 'Разгибание локтя — основная жимовая мышца руки.', he: 'פשיטת מרפק — שריר הדחיפה העיקרי של היד.' },
    forearms:  { en: 'Grip, wrist flexion and extension.', ru: 'Хват, сгибание и разгибание запястья.', he: 'אחיזה, כיפוף ופשיטת שורש כף היד.' },
    abs:       { en: 'Trunk flexion, bracing and rotation control.', ru: 'Сгибание корпуса, стабилизация и контроль ротации.', he: 'כיפוף הגו, ייצוב ושליטה בסיבוב.' },
    quads:     { en: 'Knee extension and hip flexion.', ru: 'Разгибание колена и сгибание бедра.', he: 'פשיטת ברך וכיפוף ירך.' },
    adductors: { en: 'Pulls the thigh toward the midline.', ru: 'Приводит бедро к средней линии.', he: 'מקרב את הירך לקו האמצע.' },
    hamstrings:{ en: 'Knee flexion and hip extension.', ru: 'Сгибание колена и разгибание бедра.', he: 'כיפוף ברך ופשיטת ירך.' },
    glutes:    { en: 'Hip extension, abduction and pelvic stability.', ru: 'Разгибание и отведение бедра, стабильность таза.', he: 'פשיטת ירך, הרחקה וייצוב האגן.' },
    calves:    { en: 'Plantar flexion — raises the heel and propels the step.', ru: 'Подошвенное сгибание — поднимает пятку и толкает шаг.', he: 'כפיפת כף רגל — מרים את העקב ודוחף את הצעד.' }
  };

  const UI = {
    title:      { en: 'Muscle map', ru: 'Карта мышц', he: 'מפת שרירים' },
    eyebrow:    { en: 'Anatomy lab', ru: 'Анатомическая лаборатория', he: 'מעבדת אנטומיה' },
    groups:     { en: 'Muscle groups', ru: 'Группы мышц', he: 'קבוצות שרירים' },
    front:      { en: 'Front', ru: 'Спереди', he: 'מלפנים' },
    back:       { en: 'Back', ru: 'Сзади', he: 'מאחור' },
    frontView:  { en: 'Front view', ru: 'Вид спереди', he: 'מבט קדמי' },
    backView:   { en: 'Back view', ru: 'Вид сзади', he: 'מבט אחורי' },
    hint:       { en: 'Every muscle is a button', ru: 'Каждая мышца — кнопка', he: 'כל שריר הוא כפתור' },
    showEx:     { en: 'Show exercises', ru: 'Показать упражнения', he: 'הצג תרגילים' },
    clear:      { en: 'Clear', ru: 'Сбросить', he: 'נקה' },
    selected:   { en: 'Selected muscle', ru: 'Выбранная мышца', he: 'שריר נבחר' },
    groupSel:   { en: 'Muscle group', ru: 'Группа мышц', he: 'קבוצת שרירים' },
    empty:      { en: 'Select a muscle', ru: 'Выберите мышцу', he: 'בחרו שריר' },
    emptySub:   { en: 'Tap the model or a group to inspect it.', ru: 'Нажмите на модель или группу, чтобы изучить её.', he: 'הקישו על המודל או על קבוצה כדי לבדוק אותה.' },
    muscles:    { en: 'muscles', ru: 'мышц', he: 'שרירים' },
    bothSides:  { en: 'both sides', ru: 'обе стороны', he: 'שני הצדדים' },
    center:     { en: 'centre', ru: 'центр', he: 'מרכז' },
    close:      { en: 'Close', ru: 'Закрыть', he: 'סגור' },
    openMap:    { en: 'Open muscle map', ru: 'Открыть карту мышц', he: 'פתח מפת שרירים' },
    live:       { en: 'Live anatomy', ru: 'Живая анатомия', he: 'אנטומיה חיה' }
  };

  let _state = { selected: null, group: null, view: 'front', mounted: false, bound: false };
  let _dom = null;

  function lang() {
    try { return (document.documentElement.getAttribute('lang') || 'en').slice(0, 2); } catch (e) { return 'en'; }
  }
  function tx(obj) { const l = lang(); return (obj && (obj[l] || obj.en)) || ''; }
  function esc(v) {
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function meta(id) { return MUSCLES[id] || null; }
  function groupOf(id) {
    const m = meta(id);
    if (!m) return null;
    if (m.g === 'legs') {
      if (m.sub === 'Quadriceps') return 'quads';
      if (m.sub === 'Adductors') return 'adductors';
      if (m.sub === 'Hamstrings') return 'hamstrings';
      if (m.sub === 'Glutes') return 'glutes';
      if (m.sub === 'Calves') return 'calves';
    }
    if (m.g === 'elbow_flexors') return 'biceps';
    if (m.g === 'abdominals') return 'abs';
    return { back: 'back', chest: 'chest', shoulders: 'shoulders', triceps: 'triceps', forearms: 'forearms' }[m.g] || 'back';
  }
  function groupFunction(id) {
    const g = groupOf(id);
    return FUNCTIONS[g] || FUNCTIONS.back;
  }
  function matchesGroup(m, grp) {
    if (!m || !grp) return false;
    if (grp.g && grp.g.indexOf(m.g) < 0) return false;
    if (grp.sub && grp.sub !== m.sub) return false;
    return true;
  }

  /* ---------------- SVG figure ---------------- */
  function body(d, p, tone) {
    return `<path class="dkm-body" fill="url(#${p}${tone || 'red'})" d="${d}"/>` +
           `<path class="dkm-gloss" fill="url(#${p}gloss)" d="${d}"/>` +
           `<path class="dkm-fib" d="${d}"/>`;
  }
  const mirror = (inner) => `<g transform="translate(300 0) scale(-1 1)">${inner}</g>`;
  function muscle(id, inner, opts) {
    opts = opts || {};
    const m = meta(id) || { g: '', sub: '', view: 'front' };
    return `<g class="dkm-m" data-m="${id}" data-g="${esc(m.g)}" data-sub="${esc(m.sub)}" role="button" tabindex="0" aria-label="${esc(m.en)}">` +
      inner + (opts.mirror === false ? '' : mirror(inner)) + '</g>';
  }

  function defs(p) {
    return `
      <defs>
        <radialGradient id="${p}red" cx="36%" cy="24%" r="84%">
          <stop offset="0" stop-color="#f18b74"/><stop offset=".42" stop-color="#d35a4e"/><stop offset=".78" stop-color="#a63a38"/><stop offset="1" stop-color="#792227"/>
        </radialGradient>
        <radialGradient id="${p}deep" cx="36%" cy="24%" r="84%">
          <stop offset="0" stop-color="#c85b4d"/><stop offset=".45" stop-color="#a63d3b"/><stop offset=".82" stop-color="#7d272d"/><stop offset="1" stop-color="#581820"/>
        </radialGradient>
        <radialGradient id="${p}orange" cx="36%" cy="24%" r="84%">
          <stop offset="0" stop-color="#f6a270"/><stop offset=".42" stop-color="#e17a48"/><stop offset=".78" stop-color="#bf5730"/><stop offset="1" stop-color="#8c3620"/>
        </radialGradient>
        <radialGradient id="${p}warm" cx="36%" cy="24%" r="84%">
          <stop offset="0" stop-color="#eda08a"/><stop offset=".45" stop-color="#d27057"/><stop offset=".8" stop-color="#a54a38"/><stop offset="1" stop-color="#7c2c27"/>
        </radialGradient>
        <radialGradient id="${p}gloss" cx="30%" cy="16%" r="78%">
          <stop offset="0" stop-color="#fff" stop-opacity=".6"/>
          <stop offset=".42" stop-color="#ffd9c8" stop-opacity=".2"/>
          <stop offset="1" stop-color="#fff" stop-opacity="0"/>
        </radialGradient>
        <linearGradient id="${p}skin" x1="0" y1="0" x2=".3" y2="1">
          <stop offset="0" stop-color="#bdc7d3"/><stop offset=".55" stop-color="#98a3b1"/><stop offset="1" stop-color="#65707f"/>
        </linearGradient>
        <linearGradient id="${p}shadow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#511a21"/><stop offset=".55" stop-color="#3d131a"/><stop offset="1" stop-color="#260c12"/>
        </linearGradient>
        <pattern id="${p}fib" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(24)">
          <path d="M0 0V5" stroke="#38090f" stroke-width=".6" opacity=".8"/>
        </pattern>
      </defs>`;
  }

  function headBase() {
    return `
      <path class="dkm-skin" d="M150 8c-16 0-28 12-29 28-1 12 3 23 10 30l-1 10c0 4 3 7 6 8l4 2c3 8 6 12 10 12s7-4 10-12l4-2c3-1 6-4 6-8l-1-10c7-7 11-18 10-30-1-16-13-28-29-28Z"/>
      <path d="M132 60c3 12 9 19 18 21 9-2 15-9 18-21-5 6-11 9-18 9s-13-3-18-9Z" fill="#77808d" opacity=".22"/>
      <path class="dkm-skin" d="M121 48c-5-1-8 3-8 9 0 6 4 11 9 12 2-4 2-14-1-21ZM179 48c5-1 8 3 8 9 0 6-4 11-9 12-2-4-2-14 1-21Z"/>
      <path class="dkm-skin" d="M132 90h36v22c0 9-7 15-18 15s-18-6-18-15V90Z"/>
    `;
  }
  function faceDetails() {
    return `
      <g class="dkm-face" fill="none" stroke="#67707e" stroke-width=".9" stroke-linecap="round" opacity=".5">
        <path d="M134 43c5-4 11-4 15-1M151 42c4-3 10-3 15 1"/>
        <path d="M150 48v13l-5 5 5 3 5-3-5-5"/>
        <path d="M143 74c4-2 10-2 14 0M143 77c4 2 10 2 14 0"/>
        <path d="M133 62c4 13 10 19 17 19s13-6 17-19"/>
        <path d="M127 53c3 1 5 3 6 6M173 53c-3 1-5 3-6 6"/>
      </g>
      <g fill="none" stroke="#5b6572" stroke-width=".9" stroke-linecap="round" opacity=".34">
        <path d="M135 51c3 1 6 1 9 0M156 51c3 1 6 1 9 0"/>
        <path d="M143 75c4-1 10-1 14 0"/>
      </g>
      <g class="dkm-face" fill="none" stroke="#87909d" stroke-width="1" opacity=".4">
        <path d="M136 58c3 2 6 3 9 3M155 61c3 0 6-1 9-3"/>
      </g>`;
  }
  function backHeadDetails() {
    return `<g class="dkm-face" fill="none" stroke="#67707e" stroke-width=".85" opacity=".32">
      <path d="M135 40c8-4 22-4 30 0M150 32v34M138 76c8 3 16 3 24 0"/>
      <path d="M127 56c3 4 4 9 4 14M173 56c-3 4-4 9-4 14"/>
    </g>`;
  }

  function torsoBase() {
    return `<path class="dkm-shadow" d="M150 100c-26 0-46 10-56 26-10 16-10 38-4 60 6 18 12 32 16 48 4 16 4 30 4 48 0 18-4 34 4 46 10 14 18 18 36 18s26-4 36-18c8-12 4-28 4-46 0-18 0-32 4-48 4-16 10-30 16-48 6-22 6-44-4-60-10-16-30-26-56-26Z"/>`;
  }
  function fascia(p) {
    const d = 'M150 104c-32 0-54 14-60 40-5 24-1 48 4 70 3 16 5 30 5 46 0 18-7 34 2 47 10 15 27 21 49 21s39-6 49-21c9-13 2-29 2-47 0-16 2-30 5-46 5-22 9-46 4-70-6-26-28-40-60-40Z';
    return `<path class="dkm-fascia" fill="url(#${p}deep)" opacity=".86" pointer-events="none" d="${d}"/>` +
      `<path class="dkm-fib" style="opacity:.19" pointer-events="none" d="${d}"/>`;
  }
  function limbFascia(p) {
    return mirror(
      `<path fill="url(#${p}deep)" opacity=".92" d="M118 124c-20 4-34 24-38 50-4 26-3 54 2 80l9 26c3 9 8 12 12 9 8-24 11-50 13-76 2-26 3-50 4-64 0-9-1-19-2-25Z"/>` +
      `<path fill="url(#${p}deep)" opacity=".92" d="M86 246c-12 20-18 46-19 72-1 24 4 46 11 58 5 5 10 2 14-8 6-24 7-52 5-78-1-18-4-32-6-44-1-2-3-2-5 0Z"/>` +
      `<path fill="url(#${p}deep)" opacity=".94" d="M106 340c-14 23-16 66-10 108 5 34 12 58 20 72 8 4 15-4 19-18 6-24 7-54 4-82-3-28-9-56-14-78-6-4-13-4-19-2Z"/>` +
      `<path fill="url(#${p}deep)" opacity=".92" d="M112 504c-10 24-11 60-5 90 5 22 11 36 18 38 8-6 13-24 15-46 2-26 0-54-5-76-7-6-16-8-23-6Z"/>` +
      `<path fill="url(#${p}deep)" opacity=".9" d="M110 490c-1 12 2 22 9 27 7 4 16 3 21-3 3-7 3-17 1-26-10 4-21 4-31 2Z"/>` +
      `<path fill="url(#${p}deep)" opacity=".9" d="M112 610c-1 9 2 16 9 18 8 2 16 0 20-5 3-5 2-12 0-18-10 5-19 5-29 5Z"/>`
    );
  }
  function armBase() {
    return `<path class="dkm-shadow" d="M116 124c-15 6-27 22-32 44-4 23-4 50 0 73l9 30c4 12 10 16 14 12 7-20 9-44 11-68 2-26 3-50 5-65 0-10-3-20-7-26Z"/>
      <path class="dkm-shadow" d="M84 246c-9 19-15 45-17 71-2 27 2 49 8 61 6 6 12 2 16-8 5-22 7-50 7-78 0-19-2-36-6-46-2-2-6-2-8 0Z"/>`;
  }
  function handBase() {
    return `<g transform="translate(15 69) scale(.8)">
      <ellipse class="dkm-skin" cx="82" cy="358" rx="10" ry="7"/>
      <path class="dkm-skin" d="M66 354c-6 8-10 19-10 30 0 12 5 21 12 25 6 3 11 1 14-4l2-6 3 18c1 5 4 7 7 5 2-2 2-5 2-9l-2-18 4 20c1 5 5 6 7 4 2-2 2-6 1-10l-4-18 5 13c2 5 6 5 7 2 1-3 0-8-2-13l-8-19c-5-11-11-18-18-22-9-5-20-3-26 3Z"/>
      <g class="dkm-face" fill="none" stroke="#68717e" stroke-width=".7" opacity=".4"><path d="M69 374l5 16M76 370l4 20M84 370l3 18M91 374l2 12"/></g>
    </g>`;
  }
  function legBase() {
    return `<path class="dkm-shadow" d="M106 340c-10 23-13 66-8 108 4 34 9 58 17 72 8 6 16 0 20-14 6-20 8-48 6-78-2-30-7-60-11-80-8-5-16-5-24-8Z"/>
      <path class="dkm-shadow" d="M112 504c-8 25-10 60-4 90 5 22 11 36 19 38 8-4 13-20 15-42 2-26 0-54-6-76-8-6-16-8-24-10Z"/>`;
  }
  function footBase() {
    return `<g transform="translate(24 124) scale(.8)">
      <path class="dkm-skin" d="M122 612c-4 0-7 4-7 9v8l-15-2c-7-1-11 3-11 8 0 6 5 10 13 12 10 2 22 0 27-6 4-5 3-11-2-15l-8-8v-4c0-5-3-8-7-8Z"/>
      <g class="dkm-face" fill="none" stroke="#68717e" stroke-width=".7" opacity=".38"><path d="M106 640h26M110 645h18M114 650h12"/></g>
    </g>`;
  }
  function kneeDetails() {
    return `<g class="dkm-joint"><ellipse cx="126" cy="505" rx="7" ry="6"/><ellipse cx="174" cy="505" rx="7" ry="6"/><path d="M119 515c5 3 10 3 15 0M166 515c5 3 10 3 15 0" fill="none"/></g>`;
  }

  function frontFigure() {
    const p = 'df';
    const limbs = armBase() + handBase() + legBase() + footBase();
    const base = headBase() + faceDetails() + torsoBase() + fascia(p) + limbFascia(p) + limbs + mirror(limbs);
    const m = [];
    m.push(muscle('scm', body('M150 88c-12 0-21 8-21 19 0 8 9 14 21 14s21-6 21-14c0-11-9-19-21-19z', p, 'deep') +
      body('M146 84c-8 10-9 25-3 38l6 8 5-4c-4-13-3-28 3-39z', p, 'red') +
      mirror(body('M146 84c-8 10-9 25-3 38l6 8 5-4c-4-13-3-28 3-39z', p, 'red')), { mirror: false }));
    m.push(muscle('traps-upper', body('M150 94c-15 0-30 8-46 24 14 9 31 12 46 8z', p, 'deep')));
    m.push(muscle('deltoid', body('M118 118c-18-2-34 8-40 26-6 16-2 35 13 46 11-9 18-23 20-38 1-12 3-24 7-34z', p, 'warm')));
    m.push(muscle('pec', body('M150 124c-17-7-36-5-46 5-6 18-1 40 12 56 11 11 24 15 34 11z', p, 'red')));
    m.push(muscle('abs-upper', body('M148 198c-8-2-15-1-18 5-3 7-1 16 4 20 5 2 10 2 14 0z', p, 'deep') + body('M148 226c-8-2-15-1-18 5-3 7-1 16 4 20 5 2 10 2 14 0z', p, 'deep')));
    m.push(muscle('abs-lower', body('M148 254c-7-2-13-1-15 5-2 6-1 13 3 17 4 2 9 2 12 0z', p, 'deep') + body('M148 278c-6-2-11-1-13 4-2 5-1 11 2 14 4 2 8 2 11 0z', p, 'deep')));
    m.push(muscle('obliques', body('M131 196c-10 0-18 7-21 19-3 16 0 39 1 57 1 13 3 21 8 25 4-3 5-12 5-25 0-22-1-44 0-58 1-9 3-14 7-18z', p, 'warm')));
    m.push(muscle('serratus', body('M129 190c-5 4-7 10-6 15 2 5 6 7 11 6l-2-13z', p, 'red') + body('M127 205c-5 4-7 10-5 16 2 5 6 7 11 4l-3-14z', p, 'red') + body('M125 221c-4 5-6 11-3 16 2 4 6 6 10 3l-3-13z', p, 'red')));
    m.push(muscle('biceps', body('M98 176c-10 15-15 36-14 58 1 18 7 30 13 34 8-10 12-29 11-50-1-19-5-33-7-42z', p, 'red')));
    m.push(muscle('brachialis', body('M109 182c-6 16-6 41 0 62 3 11 8 15 12 10-4-21-4-50-3-66z', p, 'warm')));
    m.push(muscle('brachioradialis', body('M85 248c-8 8-12 20-14 34 5 4 12 4 16 0 2-12 2-24 5-34z', p, 'warm')));
    m.push(muscle('forearm-flex', body('M86 250c-11 14-18 36-20 60-2 24 1 46 8 60 7 7 13 2 17-10 4-22 6-50 4-76-1-16-4-28-6-34z', p, 'warm')));
    m.push(muscle('hip-flexors', body('M132 286c-6 14-5 32 2 47 6 11 12 13 15 4-4-17-5-36-3-50z', p, 'deep')));
    m.push(muscle('quad-rf', body('M124 346c-10 19-12 52-10 88 1 31 7 58 13 75 7-2 11-21 11-44 0-31-1-75-5-111-2-8-5-12-9-8z', p, 'orange')));
    m.push(muscle('quad-vl', body('M104 350c-10 20-12 54-7 88 4 28 10 51 17 64 5-2 5-22 3-43-3-32-2-70 2-101-2-9-9-13-15-8z', p, 'orange')));
    m.push(muscle('quad-vm', body('M138 420c-5 18-5 43-1 62 2 11 7 18 11 13l0-61c-2-9-7-16-10-14z', p, 'orange')));
    m.push(muscle('adductors', body('M143 354c4 26 7 54 9 82l4 0-1-74c-1-8-3-14-5-16z', p, 'warm')));
    m.push(muscle('tibialis', body('M112 506c-6 21-6 51 0 77 3 16 9 28 14 30 5-8 6-26 4-52-1-28-5-51-9-60z', p, 'orange')));
    m.push(muscle('calf-front', body('M128 508c8 17 10 43 7 68-2 14-7 23-11 18l-1-19c2-21 1-45-1-64z', p, 'red')));
    const detail = `
      <g class="dkm-crease" fill="none" stroke="#36090f" stroke-width="1.05" stroke-linecap="round" opacity=".55">
        <path d="M150 122v174M150 304v28"/>
        <path d="M132 300c5 8 11 13 18 16M168 300c-5 8-11 13-18 16"/>
        <path d="M80 250c7 3 15 4 23 2M197 250c7 2 15 1 22-2"/>
        <path d="M84 360c6 2 13 2 19 0M197 360c6 2 13 2 19 0"/>
        <path d="M104 300c3 10 3 22 1 32M196 300c-3 10-3 22-1 32"/>
      </g>
      <g class="dkm-detail" fill="none" stroke="#ffd7c6" stroke-width=".72" stroke-linecap="round" opacity=".38">
        <path d="M150 110c-12 0-24 4-36 10M150 110c12 0 24 4 36 10"/>
        <path d="M150 136c-10 3-21 4-31 1M150 147c-12 3-25 3-36 1M150 177c-11 3-22 3-32 0"/>
        <path d="M139 194c4 2 8 2 11 0M139 204c4 2 8 2 11 0M139 222c4 2 8 2 11 0M139 232c4 2 8 2 11 0M139 250c4 2 8 2 11 0M139 260c4 2 8 2 11 0M139 276c4 2 8 2 11 0"/>
        <path d="M112 198c4 8 6 17 6 27M106 214c4 8 6 17 6 26M103 232c3 8 5 16 5 25"/>
        <path d="M136 286c5 10 10 15 14 17M164 286c-5 10-10 15-14 17"/>
        <path d="M145 334c3 8 4 16 4 24M155 334c-3 8-4 16-4 24"/>
        <path d="M118 360c-2 34 0 78 5 114M108 380c-1 28 2 62 7 88M138 434c0 20 0 42 2 56"/>
        <path d="M94 256c2 18 3 38 2 58M99 280c2 14 2 30 1 44"/>
        <path d="M116 520c2 20 3 46 1 70M124 520c1 16 0 38-2 58"/>
        <path d="M90 190c1 18 2 38 2 54"/>
        <path d="M121 470c3 4 7 6 11 6M168 470c-3 4-7 6-11 6"/>
        <path d="M120 552c4 18 4 38 2 56M138 552c-2 18-2 36 0 54"/>
      </g>
      ${kneeDetails()}`;
    return `<svg class="dkm-svg dkm-front" viewBox="0 0 300 720" xmlns="http://www.w3.org/2000/svg" data-dkm-view="front" role="group" aria-label="Front muscle map" style="--dkm-skin:url(#dfskin);--dkm-shadow:url(#dfshadow)">
      ${defs(p)}
      <g class="dkm-platform" aria-hidden="true">
        <ellipse cx="150" cy="666" rx="62" ry="10" fill="#22d3ee" opacity=".06"/>
        <ellipse cx="150" cy="666" rx="52" ry="7" fill="none" stroke="#22d3ee" stroke-opacity=".26" stroke-width=".8"/>
        <ellipse cx="150" cy="666" rx="38" ry="5" fill="none" stroke="#22d3ee" stroke-opacity=".12" stroke-width=".6"/>
      </g>
      <g class="dkm-base">${base}</g>
      <g class="dkm-muscles">${m.join('')}</g>
      <g class="dkm-overlay">${detail}</g>
    </svg>`;
  }

  function backFigure() {
    const p = 'db';
    const limbs = armBase() + handBase() + legBase() + footBase();
    const base = headBase() + backHeadDetails() + torsoBase() + fascia(p) + limbFascia(p) + limbs + mirror(limbs);
    const m = [];
    m.push(muscle('rear-neck', body('M150 82c-7 0-12 4-12 11v16c3 2 7 3 12 3s9-1 12-3V93c0-7-5-11-12-11z', p, 'deep'), { mirror: false }));
    m.push(muscle('traps-upper', body('M150 94c-15 0-30 8-46 24 14 9 31 12 46 8z', p, 'deep')));
    m.push(muscle('traps-mid', body('M150 124c-13 4-28 2-43-7 0 19 8 38 22 50 11-7 19-22 21-36z', p, 'deep')));
    m.push(muscle('traps-low', body('M150 164c-10 0-20 3-28 8 5 26 16 52 28 74 12-22 23-48 28-74-8-5-18-8-28-8z', p, 'deep'), { mirror: false }));
    m.push(muscle('rear-deltoid', body('M118 118c-18-2-34 8-40 26-6 16-2 35 13 46 11-9 18-23 20-38 1-12 3-24 7-34z', p, 'warm')));
    m.push(muscle('lats', body('M118 152c-20 7-34 28-31 58 3 32 17 62 42 85 12-15 17-39 17-65 0-35-10-67-28-78z', p, 'red')));
    m.push(muscle('teres', body('M130 144c-10 4-15 15-13 27 2 12 9 19 18 21 5-9 5-26 0-39-2-5-3-8-5-9z', p, 'warm')));
    m.push(muscle('triceps', body('M94 176c-14 17-19 44-16 69 2 19 10 28 18 28 8-17 10-43 9-68-1-15-6-25-11-29z', p, 'red')));
    m.push(muscle('forearm-ext', body('M86 250c-11 14-18 36-20 60-2 24 1 46 8 60 7 7 13 2 17-10 4-22 6-50 4-76-1-16-4-28-6-34z', p, 'warm')));
    m.push(muscle('erector', body('M137 214c-8 24-8 58 1 88 4 15 9 24 12 22l0-110z', p, 'deep')));
    m.push(muscle('glute-max', body('M150 300c-16-5-32 2-42 18-10 17-9 42 4 60 11 13 29 17 38 8 5-28 5-60 0-86z', p, 'orange')));
    m.push(muscle('glute-med', body('M121 296c-10 2-17 12-17 25 6 6 15 7 23 2 2-11-1-22-6-27z', p, 'warm')));
    m.push(muscle('ham-outer', body('M106 366c-11 21-11 56-3 90 6 22 13 37 20 39 6-22 6-55 4-85-3-22-9-42-14-50z', p, 'orange')));
    m.push(muscle('ham-inner', body('M136 368c-6 23-6 58 0 88 4 19 9 33 14 35l0-86c-2-18-5-31-9-37z', p, 'orange')));
    m.push(muscle('calf-medial', body('M134 504c8 15 10 41 7 68-3 18-9 31-14 31-5-20-5-51 0-76 1-13 5-21 7-23z', p, 'red')));
    m.push(muscle('calf-lateral', body('M116 504c-7 15-9 39-6 65 3 18 8 31 14 33 4-20 4-49 0-73-2-15-5-24-8-25z', p, 'red')));
    const detail = `
      <g class="dkm-crease" fill="none" stroke="#36090f" stroke-width="1.05" stroke-linecap="round" opacity=".52">
        <path d="M150 112v188M150 302v84"/>
        <path d="M80 250c7 3 15 4 23 2M197 250c7 2 15 1 22-2"/>
        <path d="M84 360c6 2 13 2 19 0M197 360c6 2 13 2 19 0"/>
      </g>
      <g class="dkm-detail" fill="none" stroke="#ffd7c6" stroke-width=".72" stroke-linecap="round" opacity=".36">
        <path d="M126 126c-8 14-8 34 0 48M174 126c8 14 8 34 0 48"/>
        <path d="M132 118c-14 5-25 13-32 23M168 118c14 5 25 13 32 23"/>
        <path d="M118 188c-8 22-6 48 6 70M182 188c8 22 6 48-6 70"/>
        <path d="M112 200c-4 24 0 50 10 72M188 200c4 24 0 50-10 72"/>
        <path d="M112 174c-5 10-7 22-6 34M188 174c5 10 7 22 6 34"/>
        <path d="M150 300v84"/>
        <path d="M130 306c-8 12-12 26-12 42M170 306c8 12 12 26 12 42"/>
        <path d="M120 382c2 24 4 48 1 70M138 384c2 22 2 44-1 64"/>
        <path d="M108 404c0 24 2 46 6 64M132 420c1 16 0 34-2 48"/>
        <path d="M120 516c3 20 4 44 2 66M138 516c2 16 0 40-2 58"/>
        <path d="M105 190c1 16 2 34 2 50M195 190c-1 16-2 34-2 50"/>
      </g>
      ${kneeDetails()}`;
    return `<svg class="dkm-svg dkm-back" viewBox="0 0 300 720" xmlns="http://www.w3.org/2000/svg" data-dkm-view="back" role="group" aria-label="Back muscle map" style="--dkm-skin:url(#dbskin);--dkm-shadow:url(#dbshadow)">
      ${defs(p)}
      <g class="dkm-platform" aria-hidden="true">
        <ellipse cx="150" cy="666" rx="62" ry="10" fill="#22d3ee" opacity=".06"/>
        <ellipse cx="150" cy="666" rx="52" ry="7" fill="none" stroke="#22d3ee" stroke-opacity=".26" stroke-width=".8"/>
        <ellipse cx="150" cy="666" rx="38" ry="5" fill="none" stroke="#22d3ee" stroke-opacity=".12" stroke-width=".6"/>
      </g>
      <g class="dkm-base">${base}</g>
      <g class="dkm-muscles">${m.join('')}</g>
      <g class="dkm-overlay">${detail}</g>
    </svg>`;
  }

  function renderSVG(view, opts) {
    opts = opts || {};
    const vb = opts.crop === 'torso' ? '48 12 204 388' : '0 0 300 720';
    let svg = view === 'back' ? backFigure() : frontFigure();
    if (vb !== '0 0 300 720') svg = svg.replace('viewBox="0 0 300 720"', `viewBox="${vb}"`);
    if (opts.mini) svg = svg.replace('class="dkm-svg ', 'class="dkm-svg dkm-mini ');
    return svg;
  }

  /* ---------------- DOM / interaction ---------------- */
  function $(id) { return document.getElementById(id); }
  function initDom() {
    if (_dom) return _dom;
    _dom = {
      modal: $('ana-modal'), front: $('ana-front'), back: $('ana-back'),
      stage: $('ana-stage'), rail: $('ana-groups'), count: $('ana-count'),
      hover: $('ana-hover'), inspector: $('ana-inspector'),
      empty: $('ana-empty'), detail: $('ana-detail'),
      name: $('ana-name'), meta: $('ana-meta'), desc: $('ana-desc'),
      showEx: $('ana-show-ex'), clear: $('ana-clear'),
      lang: $('ana-lang'), close: $('ana-close')
    };
    return _dom;
  }

  function localize() {
    const d = initDom();
    if (!d || !d.modal) return;
    const l = lang();
    const setTxt = (el, txt) => { if (el) el.textContent = txt; };
    setTxt($('ana-title'), tx(UI.title));
    setTxt($('ana-eyebrow'), tx(UI.eyebrow));
    setTxt($('ana-groups-title'), tx(UI.groups));
    setTxt($('ana-front-lbl'), tx(UI.frontView));
    setTxt($('ana-back-lbl'), tx(UI.backView));
    setTxt($('ana-hint'), tx(UI.hint));
    setTxt($('ana-empty-title'), tx(UI.empty));
    setTxt($('ana-empty-sub'), tx(UI.emptySub));
    setTxt($('ana-show-ex'), tx(UI.showEx));
    setTxt($('ana-clear'), tx(UI.clear));
    setTxt($('ana-selected-lbl'), tx(UI.selected));
    setTxt($('ana-foot-live'), tx(UI.live));
    if (d.lang) d.lang.textContent = l.toUpperCase();
    document.querySelectorAll('[data-ana-view]').forEach(b => {
      b.textContent = b.getAttribute('data-ana-view') === 'back' ? tx(UI.back) : tx(UI.front);
    });
    document.querySelectorAll('[data-ana-i18n]').forEach(el => {
      const k = el.getAttribute('data-ana-i18n');
      if (UI[k]) setTxt(el, tx(UI[k]));
    });
    document.querySelectorAll('.dkm-m').forEach(g => {
      const m = meta(g.getAttribute('data-m'));
      if (m) g.setAttribute('aria-label', tx(m));
    });
    if (d.rail) renderRail();
    if (_state.selected) renderSelection(_state.selected);
    else if (_state.group) renderGroup(_state.group);
    d.modal.setAttribute('aria-label', tx(UI.title));
    refreshMiniLabels();
  }

  function countMuscles(grp) {
    return Object.keys(MUSCLES).filter(id => matchesGroup(MUSCLES[id], grp)).length;
  }

  function renderRail() {
    const d = initDom();
    if (!d || !d.rail) return;
    d.rail.innerHTML = GROUPS.map(grp => {
      return `<button type="button" class="ana-group" data-ana-group="${grp.id}" aria-pressed="${_state.group === grp.id ? 'true' : 'false'}">
        <span class="ana-group-dot" data-g="${grp.id}" aria-hidden="true"></span>
        <span class="ana-group-name">${esc(tx(GROUP_NAMES[grp.id]))}</span>
        <span class="ana-group-n">${countMuscles(grp)}</span>
      </button>`;
    }).join('');
    if (d.count) d.count.textContent = Object.keys(MUSCLES).length;
    d.rail.querySelectorAll('[data-ana-group]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-ana-group');
        selectGroup(id);
      });
    });
  }

  function mountFigures() {
    const d = initDom();
    if (!d || !d.front || !d.back) return;
    if (_state.mounted) return;
    d.front.innerHTML = renderSVG('front');
    d.back.innerHTML = renderSVG('back');
    [d.front, d.back].forEach(host => {
      host.addEventListener('click', e => {
        const g = e.target.closest ? e.target.closest('.dkm-m') : null;
        if (g) select(g.getAttribute('data-m'));
      });
      host.addEventListener('keydown', e => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        const g = e.target.closest ? e.target.closest('.dkm-m') : null;
        if (!g) return;
        e.preventDefault();
        select(g.getAttribute('data-m'));
      });
    });
    _state.mounted = true;
  }

  function clearClasses() {
    document.querySelectorAll('.dkm-m.sel').forEach(el => el.classList.remove('sel'));
  }

  function select(id, opts) {
    opts = opts || {};
    const m = meta(id);
    if (!m) return;
    mountFigures();
    clearClasses();
    _state.selected = id;
    _state.group = null;
    document.querySelectorAll('.dkm-m[data-m="' + id + '"]').forEach(el => el.classList.add('sel'));
    document.querySelectorAll('.ana-group.active').forEach(el => el.classList.remove('active'));
    const railGroup = groupOf(id);
    const railBtn = document.querySelector('.ana-group[data-ana-group="' + railGroup + '"]');
    if (railBtn) railBtn.classList.add('active');
    renderSelection(id);
    if (opts.view) setView(opts.view);
    else if (window.matchMedia && window.matchMedia('(max-width: 760px)').matches) {
      if (m.view === 'back') setView('back');
      else if (m.view === 'front') setView('front');
    }
  }

  function renderSelection(id) {
    const d = initDom();
    const m = meta(id);
    if (!d || !m) return;
    if (d.empty) d.empty.classList.add('hidden');
    if (d.detail) d.detail.classList.remove('hidden');
    if (d.name) d.name.textContent = tx(m);
    const grp = groupOf(id);
    const sides = m.view === 'both' ? tx(UI.bothSides) : tx(UI.bothSides);
    if (d.meta) {
      d.meta.innerHTML =
        '<span class="ana-chip">' + esc(tx(GROUP_NAMES[grp])) + '</span>' +
        '<span class="ana-chip side">' + esc(sides) + '</span>' +
        '<span class="ana-chip muted">' + esc(m.sub) + '</span>';
    }
    if (d.desc) d.desc.textContent = tx(groupFunction(id));
    if (d.showEx) {
      d.showEx.dataset.g = m.g;
      d.showEx.dataset.sub = m.sub;
      d.showEx.disabled = false;
    }
    if (d.clear) d.clear.classList.remove('hidden');
    const selLbl = $('ana-selected-lbl');
    if (selLbl) selLbl.textContent = tx(UI.selected);
  }

  function renderGroup(id) {
    const d = initDom();
    const grp = GROUPS.find(x => x.id === id);
    if (!d || !grp) return;
    if (d.empty) d.empty.classList.add('hidden');
    if (d.detail) d.detail.classList.remove('hidden');
    if (d.name) d.name.textContent = tx(GROUP_NAMES[id]);
    const n = countMuscles(grp);
    if (d.meta) {
      d.meta.innerHTML = '<span class="ana-chip">' + esc(n + ' ' + tx(UI.muscles)) + '</span>' +
        '<span class="ana-chip muted">' + esc(tx(UI.groupSel)) + '</span>';
    }
    const fn = FUNCTIONS[id] || FUNCTIONS.back;
    if (d.desc) d.desc.textContent = tx(fn);
    if (d.showEx) {
      d.showEx.dataset.g = grp.g[0];
      d.showEx.dataset.sub = grp.sub || '';
      d.showEx.disabled = false;
    }
    if (d.clear) d.clear.classList.remove('hidden');
  }

  function selectGroup(id) {
    const grp = GROUPS.find(x => x.id === id);
    if (!grp) return;
    mountFigures();
    clearClasses();
    _state.selected = null;
    _state.group = id;
    let firstView = '';
    document.querySelectorAll('.dkm-m').forEach(el => {
      const m = meta(el.getAttribute('data-m'));
      if (matchesGroup(m, grp)) {
        el.classList.add('sel');
        if (!firstView && m.view) firstView = m.view;
      }
    });
    document.querySelectorAll('.ana-group').forEach(b => {
      const on = b.getAttribute('data-ana-group') === id;
      b.classList.toggle('active', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    renderGroup(id);
    if (window.matchMedia && window.matchMedia('(max-width: 760px)').matches) {
      if (firstView === 'back') setView('back');
      else if (firstView === 'front') setView('front');
    }
  }

  function clearAll() {
    clearClasses();
    _state.selected = null;
    _state.group = null;
    const d = initDom();
    if (d) {
      if (d.detail) d.detail.classList.add('hidden');
      if (d.empty) d.empty.classList.remove('hidden');
      if (d.clear) d.clear.classList.add('hidden');
    }
    document.querySelectorAll('.ana-group').forEach(b => { b.classList.remove('active'); b.setAttribute('aria-pressed', 'false'); });
  }

  function setView(view) {
    if (view !== 'front' && view !== 'back') return;
    _state.view = view;
    const stage = $('ana-stage');
    if (stage) stage.setAttribute('data-view', view);
    document.querySelectorAll('[data-ana-view]').forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-ana-view') === view);
    });
  }

  function showExercises() {
    const d = initDom();
    if (!d || !d.showEx) return;
    const g = d.showEx.dataset.g;
    const sub = d.showEx.dataset.sub || '';
    if (!g) return;
    close();
    if (window.DKAtlas && typeof window.DKAtlas.showExercisesFor === 'function') {
      window.DKAtlas.showExercisesFor(g, sub);
      return;
    }
    try {
      if (window.router && router.show) router.show('workouts');
      const tab = document.querySelector('[data-workout-tab="exercises"]');
      if (tab && !tab.classList.contains('active')) tab.click();
      if (window.screens && screens.exercises && screens.exercises.setBodyMapFilter) {
        screens.exercises.setBodyMapFilter(g, sub || null);
      }
    } catch (e) { console.warn('[anatomy] show exercises', e); }
  }

  function open(opts) {
    opts = opts || {};
    if (typeof auth !== 'undefined' && auth && typeof auth.isUnlocked === 'function' && !auth.isUnlocked()) {
      try { router.show('login'); } catch (e) {}
      return;
    }
    const d = initDom();
    if (!d || !d.modal) return;
    try {
      if (window.DKAtlas && document.getElementById('atlas-modal') && !document.getElementById('atlas-modal').classList.contains('hidden')) {
        window.DKAtlas.close();
      }
    } catch (e) {}
    mountFigures();
    d.modal.classList.remove('hidden');
    document.documentElement.classList.add('ana-lock');
    localize();
    setView(opts.view || _state.view || 'front');
    if (opts.muscle && meta(opts.muscle)) select(opts.muscle, { view: opts.view });
    else if (opts.group) selectGroup(opts.group);
    else if (!_state.selected && !_state.group) clearAll();
    else if (_state.selected) renderSelection(_state.selected);
    else if (_state.group) renderGroup(_state.group);
    setTimeout(() => { try { d.close && d.close.focus(); } catch (e) {} }, 40);
  }

  function close() {
    const d = initDom();
    if (!d || !d.modal) return;
    d.modal.classList.add('hidden');
    document.documentElement.classList.remove('ana-lock');
    if (d.hover) d.hover.classList.add('hidden');
  }

  function bind() {
    if (_state.bound) return;
    _state.bound = true;
    const d = initDom();
    if (!d || !d.modal) return;
    if (d.close) d.close.addEventListener('click', close);
    if (d.clear) d.clear.addEventListener('click', clearAll);
    if (d.showEx) d.showEx.addEventListener('click', showExercises);
    if (d.lang) d.lang.addEventListener('click', () => {
      const order = ['en', 'ru', 'he'];
      const next = order[(order.indexOf(lang()) + 1) % 3];
      let done = false;
      if (typeof switchAppLanguage === 'function') {
        try { switchAppLanguage(next); done = true; } catch (e) {}
      }
      if (!done) document.documentElement.setAttribute('lang', next);
      localize();
    });
    const atlasSvgBtn = $('atlas-svg-btn');
    if (atlasSvgBtn) atlasSvgBtn.addEventListener('click', () => open());
    const open3d = $('ana-open-3d');
    if (open3d) open3d.addEventListener('click', () => {
      close();
      if (window.DKAtlas && window.DKAtlas.open) window.DKAtlas.open();
    });
    document.querySelectorAll('[data-ana-view]').forEach(btn => {
      btn.addEventListener('click', () => setView(btn.getAttribute('data-ana-view')));
    });
    if (d.modal) d.modal.addEventListener('keydown', e => {
      if (e.key === 'Escape') close();
    });
    if (d.stage) {
      d.stage.addEventListener('pointermove', e => {
        const g = e.target.closest ? e.target.closest('.dkm-m') : null;
        if (!g || !d.hover) { if (d.hover) d.hover.classList.add('hidden'); return; }
        const m = meta(g.getAttribute('data-m'));
        if (!m) return;
        const sr = d.stage.getBoundingClientRect();
        d.hover.textContent = tx(m);
        d.hover.classList.remove('hidden');
        const x = e.clientX - sr.left, y = e.clientY - sr.top;
        const tw = d.hover.offsetWidth || 150;
        d.hover.style.left = Math.max(8, Math.min(sr.width - tw - 8, x + 14)) + 'px';
        d.hover.style.top = Math.max(8, Math.min(sr.height - 34, y + 14)) + 'px';
      });
      d.stage.addEventListener('pointerleave', () => { if (d.hover) d.hover.classList.add('hidden'); });
    }
    document.addEventListener('dk-lang', localize);
    try {
      new MutationObserver(() => localize()).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
    } catch (e) {}
  }

  /* ---------------- profile mini ---------------- */
  function mountMini(host, opts) {
    if (!host) return;
    opts = opts || {};
    host.innerHTML = renderSVG('front', { crop: 'torso', mini: true });
    host.classList.add('dkm-mini-host');
    const openFor = (id) => open({ muscle: id || undefined });
    host.querySelectorAll('.dkm-m').forEach(g => {
      const m = meta(g.getAttribute('data-m'));
      if (m) g.setAttribute('aria-label', tx(m) + ' — ' + tx(UI.openMap));
    });
    host.addEventListener('click', e => {
      const g = e.target.closest ? e.target.closest('.dkm-m') : null;
      if (g) { e.preventDefault(); openFor(g.getAttribute('data-m')); return; }
      openFor(null);
    });
    host.addEventListener('keydown', e => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const g = e.target.closest ? e.target.closest('.dkm-m') : null;
      if (!g) return;
      e.preventDefault();
      openFor(g.getAttribute('data-m'));
    });
  }

  function refreshMiniLabels() {
    document.querySelectorAll('.dkm-mini-host .dkm-m').forEach(g => {
      const m = meta(g.getAttribute('data-m'));
      if (m) g.setAttribute('aria-label', tx(m) + ' — ' + tx(UI.openMap));
    });
  }

  function init() {
    bind();
    localize();
  }

  window.DKAnatomy = {
    open: open,
    close: close,
    select: select,
    selectGroup: selectGroup,
    setView: setView,
    mountMini: mountMini,
    renderSVG: renderSVG,
    refreshLang: () => { localize(); refreshMiniLabels(); },
    get isOpen() { return !!(_dom && _dom.modal && !_dom.modal.classList.contains('hidden')); },
    get selected() { return _state.selected; },
    MUSCLES: MUSCLES,
    GROUPS: GROUPS,
    UI: UI
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
