/* ============================================================
   DK 3D BODY ATLAS (c66)
   Self-contained classic script. No build-time module graph:
   three.js r170 is lazy-loaded on first open from jsDelivr
   (+esm bundles, absolute URLs — no importmap needed).
   Model: models/muscular-system-v1.glb (Z-Anatomy FBX → GLB,
   Draco). Source: Z-Anatomy CC BY-SA 4.0 / BodyParts3D CC BY-SA 2.1 JP.
   Exposes: window.DKAtlas.open() / .close()
   ============================================================ */
(function () {
  'use strict';

  /* ---------------- i18n ---------------- */
  var UI = {
    title:        { en: '3D Body Atlas', ru: '3Д-атлас тела', he: 'אטלס גוף תלת־מימד' },
    loading:      { en: 'Loading model…', ru: 'Загрузка модели…', he: 'טוען מודל…' },
    loadingSub:   { en: 'First open downloads ~3 MB', ru: 'При первом открытии загрузится ~3 МБ', he: 'בפתיחה הראשונה ייטענו ~3 MB' },
    loadErr:      { en: 'Failed to load the atlas. Check connection.', ru: 'Не удалось загрузить атлас. Проверьте соединение.', he: 'טעינת האטלס נכשלה. בדוק חיבור.' },
    retry:        { en: 'Retry', ru: 'Повторить', he: 'נסה שוב' },
    search:       { en: 'Search muscle…', ru: 'Поиск мышцы…', he: 'חיפוש שריר…' },
    tapHint:      { en: 'Tap a muscle to highlight it', ru: 'Нажмите на мышцу, чтобы подсветить её', he: 'הקש על שריר כדי להדגיש אותו' },
    reset:        { en: 'Reset view', ru: 'Сбросить вид', he: 'אפס תצוגה' },
    autoRotate:   { en: 'Auto-rotate', ru: 'Автовращение', he: 'סיבוב אוטומטי' },
    front:        { en: 'Front', ru: 'Спереди', he: 'קדמי' },
    back:         { en: 'Back', ru: 'Сзади', he: 'אחורי' },
    muscles:      { en: 'Muscles', ru: 'Мышцы', he: 'שרירים' },
    showList:     { en: 'Muscle list', ru: 'Список мышц', he: 'רשימת שרירים' },
    sideR:        { en: 'Right', ru: 'справа', he: 'ימין' },
    sideL:        { en: 'Left', ru: 'слева', he: 'שמאל' },
    sideBoth:     { en: 'both sides', ru: 'обе стороны', he: 'שני הצדדים' },
    credit:       { en: 'Model: Z-Anatomy (CC BY-SA 4.0) · BodyParts3D (CC BY-SA 2.1 JP)', ru: 'Модель: Z-Anatomy (CC BY-SA 4.0) · BodyParts3D (CC BY-SA 2.1 JP)', he: 'מודל: Z-Anatomy (CC BY-SA 4.0) · BodyParts3D (CC BY-SA 2.1 JP)' },
    close:        { en: 'Close', ru: 'Закрыть', he: 'סגור' },
    nothingSel:   { en: 'Nothing selected', ru: 'Ничего не выбрано', he: 'לא נבחר דבר' }
  };

  /* Region labels (keys = top-level GLB group node names) */
  var REGION_LABEL = {
    'Cranial part of muscular system.g':      { en: 'Head & face', ru: 'Голова и лицо', he: 'ראש ופנים' },
    'Cervical part of muscular system.g':     { en: 'Neck', ru: 'Шея', he: 'צוואר' },
    'Dorsal part of muscular system.g':       { en: 'Back', ru: 'Спина', he: 'גב' },
    'Thoracic part of muscular system.g':     { en: 'Chest', ru: 'Грудь', he: 'חזה' },
    'Abdominal part of muscular system.g':    { en: 'Abs', ru: 'Пресс', he: 'בטן' },
    'Pelvic part of muscular system.g':       { en: 'Pelvis', ru: 'Таз', he: 'אגן' },
    'Muscular system of upper limb.g':        { en: 'Arms', ru: 'Руки', he: 'ידיים' },
    'Muscular system of lower limb.g':        { en: 'Legs', ru: 'Ноги', he: 'רגליים' }
  };

  /* Muscle display-name translations (base names, EN → ru/he). Missing → English. */
  var MTR = {
    // ---- neck ----
    'Sternocleidomastoid':            { ru: 'Грудино-ключично-сосцевидная', he: 'שריר המסבן' },
    'Platysma':                       { ru: 'Подкожная мышца шеи', he: 'פלטיסמה' },
    'Scalenus anterior':              { ru: 'Передняя лестничная', he: 'מדורג קדמי' },
    'Scalenus medius':                { ru: 'Средняя лестничная', he: 'מדורג אמצעי' },
    'Scalenus posterior':             { ru: 'Задняя лестничная', he: 'מדורג אחורי' },
    'Longus capitis':                 { ru: 'Длинная мышца головы', he: 'הארוך של הראש' },
    'Longus colli':                   { ru: 'Длинная мышца шеи', he: 'הארוך של הצוואר' },
    // ---- back ----
    'Descending part of trapezius':   { ru: 'Трапеция — верхняя часть', he: 'טרפז — חלק עליון' },
    'Transverse part of trapezius':   { ru: 'Трапеция — средняя часть', he: 'טרפז — חלק אמצעי' },
    'Ascending part of trapezius':    { ru: 'Трапеция — нижняя часть', he: 'טרפז — חלק תחתון' },
    'Latissimus dorsi':               { ru: 'Широчайшая мышца спины', he: 'שריר הגב הרחב (לטיסימוס)' },
    'Rhomboid major':                 { ru: 'Большая ромбовидная', he: 'מעוין גדול' },
    'Rhomboid minor':                 { ru: 'Малая ромбовидная', he: 'מעוין קטן' },
    'Levator scapulae':               { ru: 'Мышца, поднимающая лопатку', he: 'מרים השכמה' },
    'Teres major':                    { ru: 'Большая круглая', he: 'טרז מז׳ור (עגול גדול)' },
    'Teres minor':                    { ru: 'Малая круглая', he: 'טרז מינור (עגול קטן)' },
    'Infraspinatus':                  { ru: 'Подостная', he: 'אינפרספינטוס' },
    'Supraspinatus':                  { ru: 'Надостная', he: 'סופרספינטוס' },
    'Iliocostalis lumborum':          { ru: 'Разгибатель спины — поясница', he: 'זוקף הגו — מותניים' },
    'Iliocostalis thoracis':          { ru: 'Разгибатель спины — грудной отдел', he: 'זוקף הגו — חזה' },
    'Iliocostalis colli':             { ru: 'Разгибатель спины — шейный отдел', he: 'זוקף הגו — צוואר' },
    'Longissimus thoracis':           { ru: 'Длиннейшая мышца груди', he: 'לונגיסימוס — חזה' },
    'Longissimus capitis':            { ru: 'Длиннейшая мышца головы', he: 'לונגיסימוס — ראש' },
    'Longissimus colli':              { ru: 'Длиннейшая мышца шеи', he: 'לונגיסימוס — צוואר' },
    'Spinalis thoracis':              { ru: 'Остистая мышца груди', he: 'ספינליס — חזה' },
    'Spinalis capitis':               { ru: 'Остистая мышца головы', he: 'ספינליס — ראש' },
    'Spinalis colli':                 { ru: 'Остистая мышца шеи', he: 'ספינליס — צוואר' },
    'Multifidus lumborum':            { ru: 'Многораздельные — поясница', he: 'מולטיפידוס — מותניים' },
    'Multifidus thoracis':            { ru: 'Многораздельные — грудной отдел', he: 'מולטיפידוס — חזה' },
    'Multifidus colli':               { ru: 'Многораздельные — шея', he: 'מולטיפידוס — צוואר' },
    'Semispinalis thoracis':          { ru: 'Полуостистая мышца груди', he: 'סמיספינליס — חזה' },
    'Semispinalis colli':             { ru: 'Полуостистая мышца шеи', he: 'סמיספינליס — צוואר' },
    'Splenius capitis':               { ru: 'Ременная мышца головы', he: 'ספלניוס — ראש' },
    'Splenius colli':                 { ru: 'Ременная мышца шеи', he: 'ספלניוס — צוואר' },
    'Serratus posterior superior':    { ru: 'Верхняя задняя зубчатая', he: 'המסור האחורי העליון' },
    'Serratus posterior inferior':    { ru: 'Нижняя задняя зубчатая', he: 'המסור האחורי התחתון' },
    'Rotatores':                      { ru: 'Вращательные мышцы', he: 'רוטטורס' },
    'Interspinales lumborum muscles': { ru: 'Межостистые — поясница', he: 'בין־עוקציות — מותניים' },
    // ---- chest ----
    'Clavicular head of pectoralis major':    { ru: 'Большая грудная — ключичная головка', he: 'החזה הגדול — ראש בריחי' },
    'Sternocostal head of pectoralis major':  { ru: 'Большая грудная — грудино-рёберная головка', he: 'החזה הגדול — ראש עצם-צלעות' },
    'Abdominal part of pectoralis major muscle': { ru: 'Большая грудная — брюшная часть', he: 'החזה הגדול — חלק בטני' },
    'Pectoralis minor':               { ru: 'Малая грудная', he: 'החזה הקטן' },
    'Serratus anterior':              { ru: 'Передняя зубчатая', he: 'המסור הקדמי' },
    'Subclavius':                     { ru: 'Подключичная', he: 'תת־בריחי' },
    'Diaphragm':                      { ru: 'Диафрагма', he: 'הסרעפת' },
    'External intercostal muscles':   { ru: 'Наружные межрёберные', he: 'בין־צלעיות חיצוניות' },
    'Internal intercostal muscles':   { ru: 'Внутренние межрёберные', he: 'בין־צלעיות פנימיות' },
    // ---- abs ----
    'Rectus abdominis':               { ru: 'Прямая мышца живота', he: 'שריר הבטן הישר' },
    'External abdominal oblique':     { ru: 'Наружная косая мышца живота', he: 'האלכסוני החיצוני' },
    'Internal abdominal oblique':     { ru: 'Внутренняя косая мышца живота', he: 'האלכסוני הפנימי' },
    'Transversus abdominis':          { ru: 'Поперечная мышца живота', he: 'הרוחבי של הבטן' },
    'Pyramidalis':                    { ru: 'Пирамидальная', he: 'פירמידליס' },
    'Quadratus lumborum':             { ru: 'Квадратная мышца поясницы', he: 'ריבועי המותניים' },
    // ---- shoulders / arms ----
    'Clavicular part of deltoid':     { ru: 'Дельта — передний пучок', he: 'דלטואיד קדמי' },
    'Acromial part of deltoid':       { ru: 'Дельта — средний пучок', he: 'דלטואיד אמצעי' },
    'Scapular spinal part of deltoid':{ ru: 'Дельта — задний пучок', he: 'דלטואיד אחורי' },
    'Long head of biceps brachii':    { ru: 'Бицепс — длинная головка', he: 'ביצפס — ראש ארוך' },
    'Short head of biceps brachii':   { ru: 'Бицепс — короткая головка', he: 'ביצפס — ראש קצר' },
    'Brachialis':                     { ru: 'Брахиалис (плечевая)', he: 'ברכיאליס' },
    'Brachioradialis':                { ru: 'Брахиорадиалис', he: 'ברכיו־רדיאליס' },
    'Coracobrachialis':               { ru: 'Клювовидно-плечевая', he: 'קורקו־ברכיאליס' },
    'Long head of triceps brachii':   { ru: 'Трицепс — длинная головка', he: 'טרייספס — ראש ארוך' },
    'Lateral head of triceps brachii':{ ru: 'Трицепс — латеральная головка', he: 'טרייספס — ראש צדי' },
    'Medial head of triceps brachii': { ru: 'Трицепс — медиальная головка', he: 'טרייספס — ראש תיכון' },
    'Anconeus':                       { ru: 'Локтевая', he: 'אנקונאוס' },
    'Flexor carpi radialis':          { ru: 'Лучевой сгибатель запястья', he: 'פלקסור קרפי רדיאליס' },
    'Humeral head of flexor carpi ulnaris': { ru: 'Локтевой сгибатель запястья', he: 'פלקסור קרפי אולנריס' },
    'Palmaris longus':                { ru: 'Длинная ладонная', he: 'פלמריס לונגוס' },
    'Humero-ulnar head of flexor digitorum superficialis': { ru: 'Поверхностный сгибатель пальцев', he: 'פלקסור דיגיטורום סופרפיציאליס' },
    'Radial head of flexor digitorum superficialis': { ru: 'Поверхностный сгибатель пальцев (лучевая часть)', he: 'פלקסור דיגיטורום סופרפיציאליס' },
    'Flexor digitorum profundus':     { ru: 'Глубокий сгибатель пальцев', he: 'פלקסור דיגיטורום פרופונדוס' },
    'Flexor pollicis longus':         { ru: 'Длинный сгибатель большого пальца', he: 'פלקסור פוליציס לונגוס' },
    'Extensor carpi radialis longus': { ru: 'Длинный лучевой разгибатель запястья', he: 'אקסטנסור קרפי רדיאליס לונגוס' },
    'Extensor carpi radialis brevis': { ru: 'Короткий лучевой разгибатель запястья', he: 'אקסטנסור קרפי רדיאליס ברוויס' },
    'Humeral head of extensor carpi ulnaris': { ru: 'Локтевой разгибатель запястья', he: 'אקסטנסור קרפי אולנריס' },
    'Extensor digitorum':             { ru: 'Разгибатель пальцев', he: 'אקסטנסור דיגיטורום' },
    'Extensor pollicis longus':       { ru: 'Длинный разгибатель большого пальца', he: 'אקסטנסור פוליציס לונגוס' },
    'Extensor pollicis brevis':       { ru: 'Короткий разгибатель большого пальца', he: 'אקסטנסור פוליציס ברוויס' },
    'Extensor indicis':               { ru: 'Разгибатель указательного пальца', he: 'אקסטנסור אינדיציס' },
    'Abductor pollicis longus':       { ru: 'Длинный отводящий большой палец', he: 'אבדוקטור פוליציס לונגוס' },
    'Deep head of pronator teres':    { ru: 'Круглый пронатор', he: 'פרונטור טרז' },
    'Superficial head of pronator teres': { ru: 'Круглый пронатор (поверхностная часть)', he: 'פרונטור טרז' },
    'Pronator quadratus':             { ru: 'Квадратный пронатор', he: 'פרונטור קוודרטוס' },
    'Supinator':                      { ru: 'Супинатор', he: 'סופינטור' },
    'Palmar interossei muscles':      { ru: 'Ладонные межкостные', he: 'בין־עצמיות כפיות' },
    'Dorsal interossei muscles of hand': { ru: 'Тыльные межкостные', he: 'בין־עצמיות גביות' },
    'Lumbrical muscles of hand':      { ru: 'Червеобразные мышцы', he: 'לומבריקלים' },
    // ---- legs ----
    'Gluteus maximus':                { ru: 'Большая ягодичная', he: 'הישבן הגדול' },
    'Gluteus medius':                 { ru: 'Средняя ягодичная', he: 'הישבן האמצעי' },
    'Gluteus minimus':                { ru: 'Малая ягодичная', he: 'הישבן הקטן' },
    'Tensor fasciae latae':           { ru: 'Напрягатель широкой фасции', he: 'מותח הרצועה הרחבה (TFL)' },
    'Rectus femoris':                 { ru: 'Квадрицепс — прямая мышца бедра', he: 'קוואדריצפס — ירך ישרה' },
    'Vastus lateralis':               { ru: 'Квадрицепс — латеральная широкая', he: 'קוואדריצפס — רחב צדי' },
    'Vastus medialis':                { ru: 'Квадрицепс — медиальная широкая', he: 'קוואדריצפס — רחב תיכון' },
    'Vastus intermedius':             { ru: 'Квадрицепс — промежуточная широкая', he: 'קוואדריצפס — רחב ביניימי' },
    'Adductor longus':                { ru: 'Приводящая — длинная', he: 'מקרב ארוך' },
    'Adductor brevis':                { ru: 'Приводящая — короткая', he: 'מקרב קצר' },
    'Adductor magnus':                { ru: 'Приводящая — большая', he: 'מקרב גדול' },
    'Adductor minimus':               { ru: 'Приводящая — малая', he: 'מקרב קטן' },
    'Gracilis':                       { ru: 'Тонкая', he: 'גרציליס' },
    'Pectineus':                      { ru: 'Гребешковая', he: 'פקטינאוס' },
    'Sartorius':                      { ru: 'Портняжная', he: 'החייט (סרטוריוס)' },
    'Long head of biceps femoris':    { ru: 'Бицепс бедра — длинная головка', he: 'ביצפס פמוריס — ראש ארוך' },
    'Short head of biceps femoris':   { ru: 'Бицепс бедра — короткая головка', he: 'ביצפס פמוריס — ראש קצר' },
    'Semitendinosus':                 { ru: 'Полусухожильная', he: 'סמיטנדינוסוס' },
    'Semimembranosus':                { ru: 'Полуперепончатая', he: 'סמיממברנוסוס' },
    'Medial head of gastrocnemius':   { ru: 'Икры — медиальная головка', he: 'תאומים — ראש תיכון' },
    'Lateral head of gastrocnemius':  { ru: 'Икры — латеральная головка', he: 'תאומים — ראש צדי' },
    'Soleus':                         { ru: 'Камбаловидная', he: 'סולאוס' },
    'Plantaris':                      { ru: 'Подошвенная', he: 'פלנטריס' },
    'Tibialis anterior':              { ru: 'Передняя большеберцовая', he: 'טיביאליס אנטריור' },
    'Tibialis posterior':             { ru: 'Задняя большеберцовая', he: 'טיביאליס פוסטריור' },
    'Fibularis longus':               { ru: 'Малоберцовая — длинная', he: 'פיבולריס לונגוס' },
    'Fibularis brevis':               { ru: 'Малоберцовая — короткая', he: 'פיבולריס ברוויס' },
    'Fibularis tertius':              { ru: 'Малоберцовая — третья', he: 'פיבולריס טרטיוס' },
    'Extensor digitorum longus':      { ru: 'Длинный разгибатель пальцев', he: 'אקסטנסור דיגיטורום לונגוס' },
    'Extensor hallucis longus':       { ru: 'Длинный разгибатель большого пальца стопы', he: 'אקסטנסור האלוציס לונגוס' },
    'Flexor digitorum longus':        { ru: 'Длинный сгибатель пальцев', he: 'פלקסור דיגיטורום לונגוס' },
    'Flexor hallucis longus':         { ru: 'Длинный сгибатель большого пальца стопы', he: 'פלקסור האלוציס לונגוס' },
    'Popliteus':                      { ru: 'Подколенная', he: 'פופליטאוס' },
    'Piriformis':                     { ru: 'Грушевидная', he: 'פיריפורמיס' },
    'Obturator internus':             { ru: 'Внутренняя запирательная', he: 'אובטורטור פנימי' },
    'Obturator externus':             { ru: 'Наружная запирательная', he: 'אובטורטור חיצוני' },
    'Superior gemellus':              { ru: 'Верхняя близнецовая', he: 'ג\'מלוס עליון' },
    'Inferior gemellus':              { ru: 'Нижняя близнецовая', he: 'ג\'מלוס תחתון' },
    'Quadratus femoris':              { ru: 'Квадратная мышца бедра', he: 'קוודרטוס פמוריס' },
    'Iliacus':                        { ru: 'Подвздошная (подвздошно-поясничная)', he: 'איליאקוס' },
    'Psoas major':                    { ru: 'Большая поясничная (подвздошно-поясничная)', he: 'פסואס גדול' },
    'Iliotibial tract':               { ru: 'Подвздошно-большеберцовый тракт', he: 'רצועת הירך הצדית (ITB)' },
    // ---- head (few) ----
    'Frontalis':                      { ru: 'Лобная', he: 'פרונטליס' },
    'Occipitalis':                    { ru: 'Затылочная', he: 'אוקציפיטליס' },
    'Temporalis':                     { ru: 'Височная', he: 'טמפורליס' },
    'Superficial part of masseter':   { ru: 'Жевательная (поверхностная часть)', he: 'מסטר' },
    'Deep part of masseter':          { ru: 'Жевательная (глубокая часть)', he: 'מסטר (עמוק)' },
    'Orbicularis oris':               { ru: 'Круговая мышца рта', he: 'עגול הפה' },
    'Orbital part of orbicularis oculi': { ru: 'Круговая мышца глаза', he: 'עגול העין' }
  };

  /* Muscle → canonical app group (for the info chip) */
  var MGROUP = {
    'Latissimus dorsi': 'back', 'Descending part of trapezius': 'back', 'Transverse part of trapezius': 'back',
    'Ascending part of trapezius': 'back', 'Rhomboid major': 'back', 'Rhomboid minor': 'back',
    'Levator scapulae': 'back', 'Teres major': 'back', 'Iliocostalis lumborum': 'back', 'Iliocostalis thoracis': 'back',
    'Iliocostalis colli': 'back', 'Longissimus thoracis': 'back', 'Longissimus capitis': 'back', 'Longissimus colli': 'back',
    'Spinalis thoracis': 'back', 'Spinalis capitis': 'back', 'Spinalis colli': 'back',
    'Multifidus lumborum': 'back', 'Multifidus thoracis': 'back', 'Multifidus colli': 'back',
    'Semispinalis thoracis': 'back', 'Semispinalis colli': 'back', 'Splenius capitis': 'back', 'Splenius colli': 'back',
    'Serratus posterior superior': 'back', 'Serratus posterior inferior': 'back', 'Rotatores': 'back',
    'Quadratus lumborum': 'back',
    'Clavicular head of pectoralis major': 'chest', 'Sternocostal head of pectoralis major': 'chest',
    'Abdominal part of pectoralis major muscle': 'chest', 'Pectoralis minor': 'chest', 'Serratus anterior': 'chest',
    'Subclavius': 'chest',
    'Clavicular part of deltoid': 'shoulders', 'Acromial part of deltoid': 'shoulders',
    'Scapular spinal part of deltoid': 'shoulders', 'Supraspinatus': 'shoulders', 'Infraspinatus': 'shoulders',
    'Subscapularis': 'shoulders', 'Teres minor': 'shoulders',
    'Long head of biceps brachii': 'elbow_flexors', 'Short head of biceps brachii': 'elbow_flexors',
    'Brachialis': 'elbow_flexors', 'Brachioradialis': 'elbow_flexors',
    'Long head of triceps brachii': 'triceps', 'Lateral head of triceps brachii': 'triceps',
    'Medial head of triceps brachii': 'triceps', 'Anconeus': 'triceps',
    'Rectus abdominis': 'abdominals', 'External abdominal oblique': 'abdominals',
    'Internal abdominal oblique': 'abdominals', 'Transversus abdominis': 'abdominals', 'Pyramidalis': 'abdominals',
    'Gluteus maximus': 'legs', 'Gluteus medius': 'legs', 'Gluteus minimus': 'legs', 'Tensor fasciae latae': 'legs',
    'Rectus femoris': 'legs', 'Vastus lateralis': 'legs', 'Vastus medialis': 'legs', 'Vastus intermedius': 'legs',
    'Adductor longus': 'legs', 'Adductor brevis': 'legs', 'Adductor magnus': 'legs', 'Adductor minimus': 'legs',
    'Gracilis': 'legs', 'Pectineus': 'legs', 'Sartorius': 'legs',
    'Long head of biceps femoris': 'legs', 'Short head of biceps femoris': 'legs',
    'Semitendinosus': 'legs', 'Semimembranosus': 'legs',
    'Medial head of gastrocnemius': 'legs', 'Lateral head of gastrocnemius': 'legs', 'Soleus': 'legs', 'Plantaris': 'legs',
    'Tibialis anterior': 'legs', 'Tibialis posterior': 'legs', 'Fibularis longus': 'legs', 'Fibularis brevis': 'legs',
    'Iliacus': 'legs', 'Psoas major': 'legs', 'Piriformis': 'legs'
  };
  var GROUP_LABEL = {
    chest:        { en: 'Chest', ru: 'Грудь', he: 'חזה' },
    back:         { en: 'Back', ru: 'Спина', he: 'גב' },
    shoulders:    { en: 'Shoulders', ru: 'Плечи', he: 'כתפיים' },
    elbow_flexors:{ en: 'Biceps', ru: 'Бицепс', he: 'יד קדמית' },
    triceps:      { en: 'Triceps', ru: 'Трицепс', he: 'יד אחורית' },
    forearms:     { en: 'Forearms', ru: 'Предплечья', he: 'כפות ידים' },
    abdominals:   { en: 'Abs', ru: 'Пресс', he: 'בטן' },
    legs:         { en: 'Legs', ru: 'Ноги', he: 'רגליים' }
  };

  /* Non-training entries hidden from the list (still rendered/tappable in 3D) */
  var HIDE_RE = /(bursa|bursae|tendon sheath|synovial sheath|retinaculum|aponeurosis|linea alba|tendinous arch|intermediate tendon|common tendinous|calcaneal tendon|inguinal ligament|patellar|tarsus|trochlea|epicranial|plantar tendon|cruciform part of fibrous)/i;
  var FOREARM_HINT_RE = /(flexor|extensor|pronator|supinator|palmaris|interossei|lumbrical|pollicis|digit minimi|indicis)/i;

  var MODEL_URL = 'models/muscular-system-v1.glb';
  var CDN = 'https://cdn.jsdelivr.net/npm/three@0.170.0';
  var HILITE = 0xdc2626; /* red-600 */

  /* ---------------- state ---------------- */
  var S = {
    inited: false, initing: false, open: false,
    THREE: null, renderer: null, scene: null, camera: null, controls: null,
    root: null, raf: 0, parts: [], groups: new Map(), selected: [],
    camBase: null, autoRot: false
  };

  /* ---------------- helpers ---------------- */
  function $(id) { return document.getElementById(id); }
  function lang() {
    var l = (document.documentElement.getAttribute('lang') || 'en').toLowerCase();
    return (l === 'ru' || l === 'he') ? l : 'en';
  }
  function tr(o) { return (o && (o[lang()] || o.en)) || ''; }
  function cleanName(raw) {
    var n = String(raw || '');
    n = n.replace(/__([LR])(_\d+)?$/, '');
    n = n.replace(/_\d+$/, '');
    n = n.replace(/_/g, ' ');
    n = n.replace(/^\((.*)\)$/, '$1');
    n = n.replace(/\s+muscle$/i, '').replace(/\s+muscles$/i, '');
    return n.trim();
  }
  function sideOf(raw) {
    var m = /__([LR])(_\d+)?$/.exec(String(raw || ''));
    return m ? m[1].toLowerCase() : '';
  }
  function normKey(v) { return String(v || '').toLowerCase().replace(/[^a-z]/g, ''); }
  var REGION_NORM = {};
  Object.keys(REGION_LABEL).forEach(function (k) { REGION_NORM[normKey(k)] = k; });
  function baseOf(raw) { return cleanName(raw); }
  function muscleLabel(base) {
    var m = MTR[base];
    if (!m) return base;
    if (lang() === 'he') return m.he || base;
    if (lang() === 'ru') return m.ru || base;
    return base; /* EN = canonical name */
  }
  function isRtl() { return lang() === 'he'; }

  /* ---------------- DOM refs ---------------- */
  var modal, canvasBox, canvasEl, infoChip, listEl, searchEl, panelEl, loadBox;

  function bindDom() {
    modal = $('atlas-modal'); canvasBox = $('atlas-canvas-box'); canvasEl = $('atlas-canvas');
    infoChip = $('atlas-info'); listEl = $('atlas-list'); searchEl = $('atlas-search');
    panelEl = $('atlas-panel'); loadBox = $('atlas-load');
  }

  /* ---------------- boot / lazy three.js ---------------- */
  function ensureThree() {
    if (S.THREE) return Promise.resolve();
    return Promise.all([
      import(CDN + '/+esm'),
      import(CDN + '/examples/jsm/controls/OrbitControls.js/+esm'),
      import(CDN + '/examples/jsm/loaders/GLTFLoader.js/+esm'),
      import(CDN + '/examples/jsm/loaders/DRACOLoader.js/+esm')
    ]).then(function (m) {
      var THREE = m[0];
      S.THREE = THREE;
      S._OrbitControls = m[1].OrbitControls;
      S._GLTFLoader = m[2].GLTFLoader;
      S._DRACOLoader = m[3].DRACOLoader;
    });
  }

  function initScene() {
    var THREE = S.THREE;
    var renderer = new THREE.WebGLRenderer({ canvas: canvasEl, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    S.renderer = renderer;

    S.scene = new THREE.Scene();
    S.scene.background = null;

    S.camera = new THREE.PerspectiveCamera(40, 1, 0.05, 60);
    S.camera.position.set(0, 0.15, 3.2);

    var hemi = new THREE.HemisphereLight(0xffffff, 0x444455, 1.05);
    S.scene.add(hemi);
    var key = new THREE.DirectionalLight(0xffffff, 1.5); key.position.set(2.5, 4, 3); S.scene.add(key);
    var rim = new THREE.DirectionalLight(0xdbeafe, 0.7); rim.position.set(-3, 1.5, -2.5); S.scene.add(rim);
    var fill = new THREE.DirectionalLight(0xffffff, 0.5); fill.position.set(0, -3, -2); S.scene.add(fill);

    var Controls = S._OrbitControls;
    var controls = new Controls(S.camera, canvasEl);
    controls.enableDamping = true; controls.dampingFactor = 0.08;
    controls.minDistance = 0.4; controls.maxDistance = 8;
    controls.autoRotateSpeed = 1.6;
    S.controls = controls;

    /* pointer: tap vs drag */
    var down = null;
    canvasEl.addEventListener('pointerdown', function (e) {
      down = { x: e.clientX, y: e.clientY, t: Date.now() };
    }, { passive: true });
    canvasEl.addEventListener('pointerup', function (e) {
      if (!down) return;
      var dx = e.clientX - down.x, dy = e.clientY - down.y;
      var isTap = (dx * dx + dy * dy) < 64 && (Date.now() - down.t) < 500;
      down = null;
      if (isTap) pickAt(e.clientX, e.clientY);
    }, { passive: true });

    /* resize */
    var ro = new ResizeObserver(function () { resize(); });
    ro.observe(canvasBox);
    resize();
  }

  function resize() {
    if (!S.renderer || !canvasBox) return;
    var w = canvasBox.clientWidth || 1, h = canvasBox.clientHeight || 1;
    S.renderer.setSize(w, h, false);
    S.camera.aspect = w / h;
    S.camera.updateProjectionMatrix();
  }

  function loop() {
    S.raf = requestAnimationFrame(loop);
    if (S.controls) S.controls.update();
    if (S.renderer) S.renderer.render(S.scene, S.camera);
  }

  /* ---------------- model loading ---------------- */
  function loadModel() {
    var THREE = S.THREE;
    return new Promise(function (resolve, reject) {
      var loader = new S._GLTFLoader();
      var draco = new S._DRACOLoader();
      draco.setDecoderPath(CDN + '/examples/jsm/libs/draco/gltf/');
      loader.setDRACOLoader(draco);
      loader.load(MODEL_URL + '?v=3', function (gltf) { resolve(gltf); }, undefined, reject);
    });
  }

  function prepareModel(gltf) {
    var THREE = S.THREE;
    var root = gltf.scene;
    /* unify look */
    root.traverse(function (o) {
      if (o.isMesh) {
        o.castShadow = false; o.receiveShadow = false;
        var mat = o.material;
        if (mat) {
          mat.metalness = 0; mat.roughness = 0.75;
          if (!mat.color || (mat.color.r === 1 && mat.color.g === 1 && mat.color.b === 1)) mat.color.setHex(0xb9bcc4);
          if (!mat.color) mat.color = new THREE.Color(0xb9bcc4);
        } else {
          o.material = new THREE.MeshStandardMaterial({ color: 0xb9bcc4, roughness: 0.75, metalness: 0 });
        }
      }
    });

    /* orientation auto-fix: Z-up models lie down */
    var box = new THREE.Box3().setFromObject(root);
    var size = box.getSize(new THREE.Vector3());
    if (size.z > size.y * 1.4) {
      root.rotation.x = -Math.PI / 2;
      box.setFromObject(root); size = box.getSize(new THREE.Vector3());
    }
    /* center at origin, feet at y=0 */
    var center = box.getCenter(new THREE.Vector3());
    root.position.sub(center);
    root.position.y += size.y / 2;
    /* normalize height to ~1.7 units */
    var h = size.y || 1.7;
    var k = 1.7 / h;
    var wrap = new THREE.Group(); wrap.add(root); wrap.scale.setScalar(k);
    S.scene.add(wrap);
    S.root = wrap;

    /* collect parts — the node name is carried by the HIGHEST object whose
     * name matches the __L/__R pattern: for multi-primitive meshes the direct
     * child keeps the (shared, possibly side-wrong) meshDef name, while the
     * parent Group carries the true per-side node name. Take the last match. */
    function resolveRawName(o) {
      var p = o, last = '', depth = 0;
      while (p && depth < 12) {
        if (p.name && /__[LR](_\d+)?$/.test(p.name)) last = p.name;
        p = p.parent; depth++;
      }
      return last || o.name || 'part';
    }
    var parts = [];
    root.traverse(function (o) {
      if (o.isMesh) {
        var raw = resolveRawName(o);
        o.userData.origMat = o.material;
        o.userData.raw = raw;
        o.userData.base = baseOf(raw);
        o.userData.side = sideOf(raw);
        o.userData.region = findRegion(o);
        parts.push(o);
      }
    });
    S.parts = parts;
    fitCamera();
  }

  function findRegion(mesh) {
    var p = mesh;
    while (p) {
      var hit = REGION_NORM[normKey(p.name)];
      if (hit) return hit;
      p = p.parent;
    }
    return '';
  }

  function fitCamera() {
    var THREE = S.THREE;
    var box = new THREE.Box3().setFromObject(S.root);
    var c = box.getCenter(new THREE.Vector3());
    var size = box.getSize(new THREE.Vector3());
    var dist = (size.y / 2) / Math.tan((S.camera.fov * Math.PI / 180) / 2) * 1.15;
    S.camBase = { cx: c.x, cy: c.y, cz: c.z, dist: dist };
    S.camera.position.set(c.x, c.y + size.y * 0.02, c.z + dist);
    S.camera.lookAt(c);
    S.controls.target.set(c.x, c.y, c.z);
    S.controls.update();
  }

  /* ---------------- selection ---------------- */
  function clearHighlight() {
    S.selected.forEach(function (m) { m.material = m.userData.origMat; });
    S.selected = [];
  }
  function highlightMeshes(meshes) {
    clearHighlight();
    var THREE = S.THREE;
    var mat = highlightMeshes._m;
    if (!mat) {
      mat = new THREE.MeshStandardMaterial({ color: HILITE, roughness: 0.6, metalness: 0, emissive: 0x450a0a });
      highlightMeshes._m = mat;
    }
    meshes.forEach(function (m) { m.material = mat; });
    S.selected = meshes;
  }

  function selectMuscle(mesh, scrollList) {
    var base = mesh.userData.base;
    var group = S.groups.get(base) || [];
    highlightMeshes(group);
    showChip(base);
    if (scrollList) scrollToRow(base);
  }

  function showChip(base) {
    var meshes = S.groups.get(base) || [];
    var sides = meshes.map(function (m) { return m.userData.side; });
    var hasR = sides.indexOf('r') > -1, hasL = sides.indexOf('l') > -1;
    var sideTxt = hasR && hasL ? tr(UI.sideBoth) : (hasR ? tr(UI.sideR) : (hasL ? tr(UI.sideL) : ''));
    var gkey = MGROUP[base];
    var gTxt = gkey ? tr(GROUP_LABEL[gkey]) : '';
    var gHtml = gTxt ? '<span class="atlas-chip-g">' + esc(gTxt) + '</span>' : '';
    infoChip.innerHTML = '<div class="font-semibold text-sm leading-tight">' + esc(muscleLabel(base)) +
      (sideTxt ? ' <span class="text-muted font-normal text-xs">· ' + esc(sideTxt) + '</span>' : '') + '</div>' + gHtml;
    infoChip.classList.remove('hidden');
  }

  function esc(v) {
    return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  var _rc = null, _v2 = null;
  function pickAt(cx, cy) {
    var THREE = S.THREE;
    var rect = canvasEl.getBoundingClientRect();
    if (!_rc) { _rc = new THREE.Raycaster(); _v2 = new THREE.Vector2(); }
    _v2.x = ((cx - rect.left) / rect.width) * 2 - 1;
    _v2.y = -((cy - rect.top) / rect.height) * 2 + 1;
    _rc.setFromCamera(_v2, S.camera);
    var hits = _rc.intersectObjects(S.root.children, true);
    for (var i = 0; i < hits.length; i++) {
      var m = hits[i].object;
      if (m.isMesh && m.userData.base) { selectMuscle(m, true); return; }
    }
  }

  /* ---------------- list UI ---------------- */
  function buildList() {
    S.groups = new Map();
    var regions = new Map();
    S.parts.forEach(function (m) {
      var base = m.userData.base;
      if (!S.groups.has(base)) S.groups.set(base, []);
      S.groups.get(base).push(m);
      var reg = m.userData.region || '';
      if (!regions.has(reg)) regions.set(reg, new Map());
      var rmap = regions.get(reg);
      if (!rmap.has(base)) rmap.set(base, []);
      rmap.get(base).push(m);
    });

    var order = Object.keys(REGION_LABEL);
    var html = '';
    order.forEach(function (regKey) {
      var rmap = regions.get(regKey);
      if (!rmap || !rmap.size) return;
      var bases = Array.from(rmap.keys()).filter(function (b) { return !HIDE_RE.test(b); });
      if (!bases.length) return;
      bases.sort(function (a, b) { return muscleLabel(a).localeCompare(muscleLabel(b), lang() === 'he' ? 'he' : (lang() === 'ru' ? 'ru' : 'en')); });
      html += '<div class="atlas-region" data-region="' + esc(regKey) + '">' +
        '<button type="button" class="atlas-region-btn" data-region-toggle="' + esc(regKey) + '">' +
        '<span class="truncate">' + esc(tr(REGION_LABEL[regKey])) + '</span>' +
        '<span class="atlas-region-c">▾</span></button>' +
        '<div class="atlas-region-body" data-region-body="' + esc(regKey) + '">';
      bases.forEach(function (b) {
        var parts = rmap.get(b);
        var sides = parts.map(function (m) { return m.userData.side; });
        var both = sides.indexOf('r') > -1 && sides.indexOf('l') > -1;
        html += '<button type="button" class="atlas-row" data-base="' + esc(b) + '">' +
          '<span class="atlas-row-dot"></span><span class="flex-1 min-w-0 truncate text-start">' + esc(muscleLabel(b)) + '</span>' +
          (both ? '<span class="text-[9px] text-muted font-mono">R/L</span>' : '') +
          '</button>';
      });
      html += '</div></div>';
    });
    listEl.innerHTML = html;

    listEl.querySelectorAll('[data-base]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var base = btn.getAttribute('data-base');
        var group = S.groups.get(base) || [];
        if (!group.length) return;
        highlightMeshes(group);
        showChip(base);
        listEl.querySelectorAll('.atlas-row.sel').forEach(function (r) { r.classList.remove('sel'); });
        listEl.querySelectorAll('.atlas-row[data-base="' + cssEsc(base) + '"]').forEach(function (r) { r.classList.add('sel'); });
        /* focus camera slightly toward the muscle */
        focusOn(group);
      });
    });
    listEl.querySelectorAll('[data-region-toggle]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var key = btn.getAttribute('data-region-toggle');
        var body = listEl.querySelector('[data-region-body="' + cssEsc(key) + '"]');
        if (!body) return;
        body.classList.toggle('open');
      });
    });
  }

  function cssEsc(v) {
    return (window.CSS && CSS.escape) ? CSS.escape(v) : String(v).replace(/["\\]/g, '\\$&');
  }

  function scrollToRow(base) {
    openAllRegions();
    var rows = listEl.querySelectorAll('.atlas-row[data-base="' + cssEsc(base) + '"]');
    if (rows.length) {
      rows.forEach(function (r) { r.classList.add('sel'); });
      rows[0].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }

  function openAllRegions() {
    listEl.querySelectorAll('.atlas-region-body').forEach(function (b) { b.classList.add('open'); });
  }

  function focusOn(meshes) {
    if (!meshes.length) return;
    var THREE = S.THREE;
    var box = new THREE.Box3();
    meshes.forEach(function (m) {
      if (m.geometry && m.geometry.boundingSphere === null) m.geometry.computeBoundingSphere();
      box.expandByObject(m);
    });
    if (box.isEmpty()) return;
    var c = box.getCenter(new THREE.Vector3());
    var size = box.getSize(new THREE.Vector3());
    var r = Math.max(size.x, size.y, size.z);
    var dist = THREE.MathUtils.clamp(r * 2.2, 0.5, 6);
    var dir = new THREE.Vector3().subVectors(S.camera.position, S.controls.target).normalize();
    if (dir.lengthSq() < 0.01) dir.set(0, 0, 1);
    S.controls.target.copy(c);
    S.camera.position.copy(c).addScaledVector(dir, dist);
    S.controls.update();
  }

  /* ---------------- language refresh ---------------- */
  function applyTexts() {
    var t = $('atlas-title'); if (t) t.textContent = tr(UI.title);
    var s = searchEl; if (s) s.placeholder = tr(UI.search);
    var cr = $('atlas-credit'); if (cr) cr.textContent = tr(UI.credit);
    var lg = $('atlas-load-sub'); if (lg) lg.textContent = tr(UI.loadingSub);
    var lt = $('atlas-load-txt'); if (lt) lt.textContent = tr(UI.loading);
    var er = document.querySelector('#atlas-load .atlas-err-txt'); if (er) er.textContent = tr(UI.loadErr);
    var ry = document.querySelector('#atlas-load .atlas-retry .atlas-btn-txt'); if (ry) ry.textContent = tr(UI.retry);
    var hint = $('atlas-hint'); if (hint) hint.textContent = tr(UI.tapHint);
    ['atlas-reset', 'atlas-rot', 'atlas-front', 'atlas-back', 'atlas-panel-toggle'].forEach(function (id) {
      var b = $(id); if (!b) return;
      var key = { 'atlas-reset': 'reset', 'atlas-rot': 'autoRotate', 'atlas-front': 'front', 'atlas-back': 'back', 'atlas-panel-toggle': 'showList' }[id];
      var lbl = b.querySelector('.atlas-btn-txt');
      if (lbl) lbl.textContent = tr(UI[key]);
      b.setAttribute('aria-label', tr(UI[key]));
    });
    if (S.open && listEl && listEl.childElementCount) buildList();
    if (S.selected && S.selected.length) showChip(S.selected[0].userData.base);
  }

  /* ---------------- open / close ---------------- */
  function openAtlas() {
    if (!bindDom.done) { bindDom(); bindDom.done = true; }
    if (!modal) return;
    S.open = true;
    modal.classList.remove('hidden');
    document.documentElement.classList.add('atlas-lock');
    applyTexts();
    if (!S.inited && !S.initing) boot();
    else if (S.inited) { resize(); if (!S.raf) loop(); }
  }

  function closeAtlas() {
    S.open = false;
    if (modal) modal.classList.add('hidden');
    document.documentElement.classList.remove('atlas-lock');
    if (S.raf) { cancelAnimationFrame(S.raf); S.raf = 0; }
    S.controls && (S.controls.autoRotate = false);
    var rb = $('atlas-rot'); if (rb) rb.classList.remove('on');
    S.autoRot = false;
  }

  function boot() {
    S.initing = true;
    loadBox.classList.remove('hidden');
    loadBox.querySelector('.atlas-load-err').classList.add('hidden');
    loadBox.querySelector('.atlas-load-spin').classList.remove('hidden');
    ensureThree().then(function () {
      initScene();
      return loadModel();
    }).then(function (gltf) {
      prepareModel(gltf);
      buildList();
      S.inited = true; S.initing = false;
      loadBox.classList.add('hidden');
      loop();
    }).catch(function (e) {
      console.error('[atlas]', e);
      S.initing = false;
      loadBox.querySelector('.atlas-load-spin').classList.add('hidden');
      var err = loadBox.querySelector('.atlas-load-err');
      err.classList.remove('hidden');
      err.querySelector('.atlas-err-txt').textContent = tr(UI.loadErr);
    });
  }

  /* ---------------- public API ---------------- */
  window.DKAtlas = {
    open: openAtlas,
    close: closeAtlas
  };
  /* debug hook (small surface, useful for support diagnostics) */
  window.__ATLAS = S;

  /* ---------------- wiring ---------------- */
  function wire() {
    bindDom(); bindDom.done = true;
    ['#nav-atlas', '#dash-atlas-card'].forEach(function (sel) {
      var b = document.querySelector(sel);
      if (b) b.addEventListener('click', function (e) { e.preventDefault(); openAtlas(); });
    });
    var retryBtn = loadBox && loadBox.querySelector('.atlas-retry');
    if (retryBtn) retryBtn.addEventListener('click', function () { if (!S.inited && !S.initing) boot(); });
    var closeBtn = $('atlas-close');
    if (closeBtn) closeBtn.addEventListener('click', closeAtlas);
    if (modal) {
      modal.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeAtlas(); });
      /* click on backdrop area (canvas box outside canvas) does nothing; keep explicit close */
    }
    var rb = $('atlas-reset');
    if (rb) rb.addEventListener('click', function () {
      if (!S.camBase) return;
      S.controls.target.set(S.camBase.cx, S.camBase.cy, S.camBase.cz);
      S.camera.position.set(S.camBase.cx, S.camBase.cy + 0.05, S.camBase.cz + S.camBase.dist);
      S.controls.update();
    });
    var rot = $('atlas-rot');
    if (rot) rot.addEventListener('click', function () {
      S.autoRot = !S.autoRot;
      if (S.controls) S.controls.autoRotate = S.autoRot;
      rot.classList.toggle('on', S.autoRot);
    });
    var fr = $('atlas-front'), bk = $('atlas-back');
    function view(front) {
      if (!S.camBase) return;
      var d = S.camBase.dist;
      S.camera.position.set(S.camBase.cx, S.camBase.cy + 0.05, S.camBase.cz + (front ? d : -d));
      S.camera.lookAt(S.camBase.cx, S.camBase.cy, S.camBase.cz);
      S.controls.target.set(S.camBase.cx, S.camBase.cy, S.camBase.cz);
      S.controls.update();
    }
    if (fr) fr.addEventListener('click', function () { view(true); });
    if (bk) bk.addEventListener('click', function () { view(false); });
    var pt = $('atlas-panel-toggle');
    if (pt) pt.addEventListener('click', function () {
      if (panelEl) panelEl.classList.toggle('atlas-panel-open');
    });
    if (searchEl) searchEl.addEventListener('input', function () {
      var q = searchEl.value.trim().toLowerCase();
      listEl.querySelectorAll('.atlas-row').forEach(function (row) {
        var base = row.getAttribute('data-base') || '';
        var hit = !q || muscleLabel(base).toLowerCase().indexOf(q) > -1 || base.toLowerCase().indexOf(q) > -1;
        row.classList.toggle('hidden', !hit);
      });
      listEl.querySelectorAll('.atlas-region').forEach(function (reg) {
        var anyVisible = reg.querySelector('.atlas-row:not(.hidden)');
        reg.classList.toggle('hidden', !anyVisible);
        if (q && anyVisible) reg.querySelector('.atlas-region-body').classList.add('open');
      });
    });
    /* re-apply texts when app language changes (applyI18n sets <html lang>) */
    var lastLang = lang();
    new MutationObserver(function () {
      var l = lang();
      if (l !== lastLang) { lastLang = l; applyTexts(); }
    }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wire);
  } else {
    wire();
  }
})();
