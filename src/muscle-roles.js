/* ============================================================================
   c188 - MUSCLE WORK MODEL (shared by trainer + portal + both engines)
   ----------------------------------------------------------------------------
   The DB stores ONE primary group/subgroup and a raw synergist list. That is
   not enough for the user-facing "how much does each muscle work?" panel or
   for crediting stabilizers in recovery. This module turns the existing data
   into a deterministic, approximate role profile:

       primary      the target muscle (largest share)
       synergist    muscles that materially assist the movement
       stabilizer   muscles that hold position / control the body

   Percentages are APPROXIMATE shares of the set's mechanical work and sum to
   100 for the listed muscles. They are intentionally coarse (integers, max 8
   listed muscles), not laboratory EMG data.

   The model is data-driven from the exercise name + group + subgroup + the
   existing synergist list, with conservative pattern profiles. It is cached
   per exercise id, so rendering a card or recomputing recovery never runs the
   regexes twice.

   Exposes window.dkMuscleRoles (and globalThis for Node tests).
   ============================================================================ */
(function () {
  'use strict';

  var VERSION = 'c188';

  /* muscle key -> canonical group + DB subgroup + trilingual label */
  var M = {
    Quads: {
      group: 'legs', sub: 'Quadriceps',
      en: 'Quadriceps', ru: 'Квадрицепс', he: 'ארבע ראשי'
    },
    Glutes: {
      group: 'legs', sub: 'Glutes',
      en: 'Glutes', ru: 'Ягодицы', he: 'ישבן'
    },
    Hams: {
      group: 'legs', sub: 'Hamstrings',
      en: 'Hamstrings', ru: 'Бицепс бедра', he: 'המסטרינג'
    },
    Calves: {
      group: 'legs', sub: 'Calves',
      en: 'Calves', ru: 'Икры', he: 'שוקיים'
    },
    Adductors: {
      group: 'legs', sub: 'Adductors',
      en: 'Adductors', ru: 'Приводящие', he: 'מקרבים'
    },
    Abductors: {
      group: 'legs', sub: 'Abductors',
      en: 'Abductors', ru: 'Отводящие', he: 'מרחיקים'
    },
    HipFlexors: {
      group: 'legs', sub: 'Hip Flexors',
      en: 'Hip Flexors', ru: 'Сгибатели бедра', he: 'כופפי ירך'
    },
    ChestUpper: {
      group: 'chest', sub: 'Upper',
      en: 'Upper Chest', ru: 'Грудь (верх)', he: 'חזה עליון'
    },
    ChestMid: {
      group: 'chest', sub: 'Middle',
      en: 'Chest', ru: 'Грудь', he: 'חזה'
    },
    ChestLower: {
      group: 'chest', sub: 'Lower',
      en: 'Lower Chest', ru: 'Грудь (низ)', he: 'חזה תחתון'
    },
    Lats: {
      group: 'back', sub: 'Lats',
      en: 'Lats', ru: 'Широчайшие', he: 'רחבות גב'
    },
    MidBack: {
      group: 'back', sub: 'Middle Back',
      en: 'Middle Back', ru: 'Середина спины', he: 'גב אמצעי'
    },
    Traps: {
      group: 'back', sub: 'Trapezius',
      en: 'Trapezius', ru: 'Трапеция', he: 'טרפז'
    },
    LowerBack: {
      group: 'back', sub: 'Lower Back',
      en: 'Lower Back', ru: 'Поясница', he: 'גב תחתון'
    },
    Neck: {
      group: 'back', sub: 'Neck',
      en: 'Neck', ru: 'Шея', he: 'צוואר'
    },
    ShouldersFront: {
      group: 'shoulders', sub: 'Front',
      en: 'Front Delts', ru: 'Передняя дельта', he: 'כתף קדמית'
    },
    ShouldersMid: {
      group: 'shoulders', sub: 'Middle',
      en: 'Side Delts', ru: 'Средняя дельта', he: 'כתף אמצעית'
    },
    ShouldersRear: {
      group: 'shoulders', sub: 'Rear',
      en: 'Rear Delts', ru: 'Задняя дельта', he: 'כתף אחורית'
    },
    Biceps: {
      group: 'elbow_flexors', sub: 'Biceps',
      en: 'Biceps', ru: 'Бицепс', he: 'דו-ראשי'
    },
    Brachialis: {
      group: 'elbow_flexors', sub: 'Brachialis',
      en: 'Brachialis', ru: 'Брахиалис', he: 'ברכיאליס'
    },
    Brachioradialis: {
      group: 'elbow_flexors', sub: 'Brachioradialis',
      en: 'Brachioradialis', ru: 'Брахиорадиалис', he: 'ברכיורדיאלי'
    },
    Triceps: {
      group: 'triceps', sub: '',
      en: 'Triceps', ru: 'Трицепс', he: 'תלת-ראשי'
    },
    Forearms: {
      group: 'forearms', sub: '',
      en: 'Forearms', ru: 'Предплечья', he: 'אמות'
    },
    AbsUpper: {
      group: 'abdominals', sub: 'Upper',
      en: 'Upper Abs', ru: 'Пресс (верх)', he: 'בטן עליונה'
    },
    AbsLower: {
      group: 'abdominals', sub: 'Lower',
      en: 'Lower Abs', ru: 'Пресс (низ)', he: 'בטן תחתונה'
    },
    Abs: {
      group: 'abdominals', sub: '',
      en: 'Core', ru: 'Кор', he: 'ליבה'
    },
    Obliques: {
      group: 'abdominals', sub: 'Obliques',
      en: 'Obliques', ru: 'Косые', he: 'אלכסונים'
    }
  };

  var GROUP_ALIASES = {
    'legs': 'legs', 'leg': 'legs', 'ноги': 'legs', 'רגליים': 'legs',
    'chest': 'chest', 'грудь': 'chest', 'חזה': 'chest',
    'back': 'back', 'спина': 'back', 'גב': 'back',
    'shoulders': 'shoulders', 'плечи': 'shoulders', 'כתפיים': 'shoulders',
    'biceps': 'elbow_flexors', 'elbow_flexors': 'elbow_flexors', 'elbow flexors': 'elbow_flexors',
    'triceps': 'triceps', 'forearms': 'forearms',
    'abdominals': 'abdominals', 'abs': 'abdominals', 'core': 'abdominals', 'пресс': 'abdominals',
    'fullbody': 'fullbody', 'full body': 'fullbody',
    'cardio': 'cardio', 'stretching': 'stretching', 'warmup': 'warmup',
    'warm-up': 'warmup', 'balance': 'balance', 'calisthenics': 'calisthenics'
  };

  var ALIAS = {
    'quadriceps': 'Quads', 'quads': 'Quads', 'quad': 'Quads',
    'rectus femoris': 'Quads', 'vastus lateralis': 'Quads',
    'vastus medialis': 'Quads', 'vastus intermedius': 'Quads',
    'hamstrings': 'Hams', 'hamstring': 'Hams', 'biceps femoris': 'Hams',
    'semitendinosus': 'Hams', 'semimembranosus': 'Hams',
    'glutes': 'Glutes', 'glute': 'Glutes', 'gluteus maximus': 'Glutes',
    'gluteus medius': 'Glutes', 'gluteus minimus': 'Glutes',
    'calves': 'Calves', 'calf': 'Calves', 'gastrocnemius': 'Calves',
    'soleus': 'Calves', 'tibialis anterior': 'Calves',
    'adductors': 'Adductors', 'adductor': 'Adductors',
    'adductor magnus': 'Adductors', 'adductor longus': 'Adductors',
    'adductor brevis': 'Adductors', 'gracilis': 'Adductors',
    'pectineus': 'Adductors', 'pectineous': 'Adductors',
    'abductors': 'Abductors', 'abductor': 'Abductors',
    'tensor fasciae latae': 'Abductors', 'tfl': 'Abductors',
    'hip flexors': 'HipFlexors', 'hip flexor': 'HipFlexors',
    'iliopsoas': 'HipFlexors', 'psoas': 'HipFlexors', 'sartorius': 'HipFlexors',
    'chest': 'ChestMid', 'pectorals': 'ChestMid', 'pecs': 'ChestMid',
    'pectoralis major': 'ChestMid', 'pectoralis major sternal head': 'ChestMid',
    'pectoralis major clavicular head': 'ChestUpper',
    'upper chest': 'ChestUpper', 'lower chest': 'ChestLower',
    'serratus anterior': 'ChestMid',
    'lats': 'Lats', 'lat': 'Lats', 'latissimus dorsi': 'Lats',
    'teres major': 'Lats',
    'middle back': 'MidBack', 'mid back': 'MidBack', 'rhomboids': 'MidBack',
    'trapezius middle fibers': 'MidBack', 'trapezius lower fibers': 'MidBack',
    'traps': 'Traps', 'trapezius': 'Traps', 'trapezius upper fibers': 'Traps',
    'levator scapulae': 'Traps',
    'lower back': 'LowerBack', 'spine': 'LowerBack', 'spine erectors': 'LowerBack',
    'spinal erectors': 'LowerBack', 'erector spinae': 'LowerBack',
    'quadratus lumborum': 'LowerBack',
    'neck': 'Neck',
    'shoulders': 'ShouldersMid', 'deltoids': 'ShouldersMid', 'delts': 'ShouldersMid',
    'deltoid anterior': 'ShouldersFront', 'front delts': 'ShouldersFront',
    'front deltoids': 'ShouldersFront', 'front shoulders': 'ShouldersFront',
    'deltoid lateral': 'ShouldersMid', 'side delts': 'ShouldersMid',
    'deltoid posterior': 'ShouldersRear', 'rear delts': 'ShouldersRear',
    'rear deltoids': 'ShouldersRear', 'rear shoulders': 'ShouldersRear',
    'rotator cuff': 'ShouldersRear', 'infraspinatus': 'ShouldersRear',
    'teres minor': 'ShouldersRear',
    'biceps': 'Biceps', 'biceps brachii': 'Biceps',
    'brachialis': 'Brachialis', 'brachioradialis': 'Brachioradialis',
    'triceps': 'Triceps', 'triceps brachii': 'Triceps', 'anconeus': 'Triceps',
    'forearms': 'Forearms', 'forearm': 'Forearms', 'grip': 'Forearms',
    'wrists': 'Forearms', 'wrist flexors': 'Forearms', 'wrist extensors': 'Forearms',
    'abdominals': 'Abs', 'abs': 'Abs', 'core': 'Abs',
    'rectus abdominis': 'Abs', 'transverse abdominis': 'Abs',
    'transverse abdominus': 'Abs', 'upper abs': 'AbsUpper',
    'lower abs': 'AbsLower', 'obliques': 'Obliques',
    'external obliques': 'Obliques', 'internal obliques': 'Obliques'
  };

  var SUBMAP = {
    legs: {
      'quadriceps': 'Quads', 'quads': 'Quads', 'glutes': 'Glutes',
      'hamstrings': 'Hams', 'calves': 'Calves', 'adductors': 'Adductors',
      'abductors': 'Abductors', 'hip flexors': 'HipFlexors',
      'hip flexor': 'HipFlexors'
    },
    chest: { upper: 'ChestUpper', middle: 'ChestMid', lower: 'ChestLower' },
    back: {
      lats: 'Lats', 'middle back': 'MidBack', trapezius: 'Traps',
      'lower back': 'LowerBack', neck: 'Neck'
    },
    shoulders: { front: 'ShouldersFront', middle: 'ShouldersMid', rear: 'ShouldersRear', trapezius: 'Traps' },
    abdominals: { upper: 'AbsUpper', lower: 'AbsLower', obliques: 'Obliques' },
    elbow_flexors: { biceps: 'Biceps', brachialis: 'Brachialis', brachioradialis: 'Brachioradialis' }
  };

  var ROLE_LABEL = {
    primary: { ru: 'Целевая', en: 'Primary', he: 'ראשי' },
    synergist: { ru: 'Вспомогательная', en: 'Synergist', he: 'מסייע' },
    major: { ru: 'Доп. главная', en: 'Major', he: 'עיקרי' },
    stabilizer: { ru: 'Стабилизатор', en: 'Stabilizer', he: 'מייצב' }
  };
  var WORK_LABEL = {
    ru: 'Работа мышц', en: 'Muscle work', he: 'עבודת שרירים'
  };
  var SHARE_LABEL = {
    ru: 'доля усилия', en: 'effort share', he: 'חלק מהמאמץ'
  };

  var GROUP_COLOR = {
    legs: '#f97316', chest: '#ef4444', back: '#3b82f6',
    shoulders: '#f59e0b', elbow_flexors: '#8b5cf6', triceps: '#06b6d4',
    forearms: '#10b981', abdominals: '#a855f7', fullbody: '#64748b',
    cardio: '#ec4899', stretching: '#d946ef', warmup: '#fbbf24',
    balance: '#14b8a6'
  };

  function norm(v) {
    return String(v == null ? '' : v)
      .toLowerCase()
      .replace(/[_\-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
  function langOf(v) {
    var l = String(v || 'en').slice(0, 2).toLowerCase();
    return (l === 'ru' || l === 'he') ? l : 'en';
  }
  function esc(v) {
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function groupOf(g) {
    var k = GROUP_ALIASES[norm(g)];
    return k || norm(g);
  }
  function keyFor(raw) {
    var k = norm(raw);
    if (!k) return '';
    return ALIAS[k] || '';
  }
  function label(key, lang) {
    var m = M[key];
    if (!m) return key || '';
    return m[langOf(lang)] || m.en || key;
  }
  function roleLabel(role, lang) {
    var r = ROLE_LABEL[role] || ROLE_LABEL.synergist;
    return r[langOf(lang)] || r.en;
  }
  function displayRole(x, lang) {
    return roleLabel((x.role === 'synergist' && x.major) ? 'major' : x.role, lang);
  }
  function colorOf(key) {
    var m = M[key];
    return (m && GROUP_COLOR[m.group]) || '#a855f7';
  }

  function exData(ex) {
    ex = ex || {};
    var names = [ex.nE, ex.name_en, ex.name, ex.nR, ex.name_ru, ex.nH, ex.name_he]
      .filter(function (v) { return v != null && String(v).trim() !== ''; });
    var name = names[0] || '';
    var group = groupOf(ex.group_canonical || ex.g || ex.group_en || ex.group || ex.gE || '');
    var sub = String(ex.subgroup_en || ex.sE || ex.subgroup || ex.subgroup || '').trim();
    var syn = ex.synergist_muscles || ex.synergists || ex.syn || [];
    var equip = ex.equipment_type || ex.equipment_en || ex.equipment || ex.eE || '';
    var mt = String(ex.movement_type || ex.mt || '').toLowerCase();
    return { ex: ex, names: names, name: name, n: norm(names.join(' ')), group: group, sub: sub, syn: syn, equip: equip, mt: mt };
  }

  function inferPrimary(d, group) {
    var n = d.n;
    if (group === 'legs') {
      if (/leg curl|hamstring curl|nordic/.test(n)) return 'Hams';
      if (/leg extension|knee extension/.test(n)) return 'Quads';
      if (/calf|toe raise|donkey|soleus/.test(n)) return 'Calves';
      if (/hip thrust|glute bridge|bridge|kickback|glute/.test(n)) return 'Glutes';
      if (/hip abduction|abductor|clamshell|side lying leg raise|side leg raise/.test(n)) return 'Abductors';
      if (/hip adduction|adductor/.test(n)) return 'Adductors';
      if (/hip flexor|knee raise|standing leg raise|hanging leg raise|leg raise/.test(n)) return 'HipFlexors';
      if (/squat|lunge|step|leg press|hack|wall sit/.test(n)) return 'Quads';
      return 'Quads';
    }
    if (group === 'chest') {
      if (/incline/.test(n)) return 'ChestUpper';
      if (/decline|dip/.test(n)) return 'ChestLower';
      return 'ChestMid';
    }
    if (group === 'back') {
      if (/shrug/.test(n)) return 'Traps';
      if (/deadlift|hyperextension|back extension|good morning|superman|erector/.test(n)) return 'LowerBack';
      if (/row/.test(n)) return 'MidBack';
      if (/pulldown|pull down|pull-up|pullup|chin/.test(n)) return 'Lats';
      return 'Lats';
    }
    if (group === 'shoulders') {
      if (/rear|reverse fly|face pull/.test(n)) return 'ShouldersRear';
      if (/lateral|side raise|side-lying/.test(n)) return 'ShouldersMid';
      if (/front raise/.test(n)) return 'ShouldersFront';
      return 'ShouldersFront';
    }
    if (group === 'elbow_flexors') {
      if (/hammer/.test(n)) return 'Brachialis';
      if (/reverse|zottman|pronat/.test(n)) return 'Brachioradialis';
      return 'Biceps';
    }
    if (group === 'triceps') return 'Triceps';
    if (group === 'forearms') return 'Forearms';
    if (group === 'abdominals') {
      if (/oblique|twist|side bend|russian|bicycle|wood chop|pallof/.test(n)) return 'Obliques';
      if (/leg raise|knee raise|hanging|toes to bar|reverse crunch|lower/.test(n)) return 'AbsLower';
      return 'AbsUpper';
    }
    if (group === 'fullbody') {
      if (/clean|snatch|thruster/.test(n)) return 'Quads';
      if (/burpee/.test(n)) return 'Quads';
      if (/mountain climber/.test(n)) return 'AbsLower';
      return 'Quads';
    }
    if (group === 'cardio') {
      if (/bike|cycle/.test(n)) return 'Quads';
      if (/row/.test(n)) return 'Lats';
      if (/jump rope|rope/.test(n)) return 'Calves';
      return 'Quads';
    }
    if (group === 'stretching' || group === 'warmup' || group === 'balance') {
      if (/hip flexor|psoas/.test(n)) return 'HipFlexors';
      if (/calf|achilles|heel|toe pull|plantar/.test(n)) return 'Calves';
      if (/hamstring/.test(n)) return 'Hams';
      if (/adductor|inner thigh|split/.test(n)) return 'Adductors';
      if (/quad|squat|lunge|skater|step|wall sit|high knee|leg press/.test(n)) return 'Quads';
      if (/glute|hip/.test(n)) return 'Glutes';
      if (/chest|pec/.test(n)) return 'ChestMid';
      if (/lat|back|spine|row/.test(n)) return 'Lats';
      if (/shoulder|delt|press|planche|handstand/.test(n)) return 'ShouldersFront';
      if (/neck|trap/.test(n)) return 'Traps';
      if (/tricep|elbow/.test(n)) return 'Triceps';
      if (/wrist|forearm|grip/.test(n)) return 'Forearms';
      if (/abs|core|twist|side bend/.test(n)) return 'Abs';
      return 'Abs';
    }
    return 'Abs';
  }

  function primaryKey(d) {
    var g = d.group;
    if (g === 'legs' || g === 'chest' || g === 'back' || g === 'shoulders' ||
        g === 'abdominals' || g === 'elbow_flexors') {
      var subKey = SUBMAP[g] && SUBMAP[g][norm(d.sub)];
      if (subKey) {
        /* a few names are stronger than a bad subgroup */
        if (g === 'legs' && /leg curl|nordic/.test(d.n)) return 'Hams';
        if (g === 'legs' && /leg extension/.test(d.n)) return 'Quads';
        if (g === 'legs' && /calf|toe raise|donkey/.test(d.n)) return 'Calves';
        if (g === 'legs' && /hip thrust|glute bridge|kickback/.test(d.n)) return 'Glutes';
        if (g === 'legs' && /hip abduction|clamshell/.test(d.n)) return 'Abductors';
        if (g === 'legs' && /hip adduction/.test(d.n)) return 'Adductors';
        if (g === 'legs' && /hip flexor|standing leg raise/.test(d.n)) return 'HipFlexors';
        return subKey;
      }
      return inferPrimary(d, g);
    }
    if (g === 'fullbody' || g === 'cardio' || g === 'stretching' || g === 'warmup' || g === 'balance') {
      return inferPrimary(d, g);
    }
    return inferPrimary(d, g || 'abdominals');
  }

  function P(key, weight, role) { return [key, weight, role || 'syn']; }

  function profileFor(pk, d) {
    var g = (d.group === 'fullbody' || d.group === 'cardio' ||
             d.group === 'stretching' || d.group === 'warmup' || d.group === 'balance')
      ? d.group : ((M[pk] && M[pk].group) || d.group);
    var n = d.n;
    if (g === 'legs') {
      if (/hip flexor|knee raise|standing leg raise|hanging leg raise/.test(n)) return [
        P('HipFlexors', 55, 'primary'), P('AbsLower', 18), P('Quads', 10),
        P('Glutes', 7), P('Calves', 5), P('LowerBack', 5, 'stab')
      ];
      if (/leg curl|nordic|hamstring curl/.test(n)) return [
        P('Hams', 78, 'primary'), P('Glutes', 8), P('Calves', 6), P('Abs', 8, 'stab')
      ];
      if (/leg extension|knee extension/.test(n)) return [
        P('Quads', 78, 'primary'), P('HipFlexors', 7), P('Abs', 10, 'stab'), P('Calves', 5, 'stab')
      ];
      if (/calf|toe raise|donkey|soleus/.test(n)) return [
        P('Calves', 80, 'primary'), P('Hams', 8), P('Abs', 7, 'stab'), P('Quads', 5)
      ];
      if (/hip thrust|glute bridge|bridge|kickback/.test(n)) return [
        P('Glutes', 55, 'primary'), P('Hams', 20), P('Quads', 15), P('Abs', 10, 'stab')
      ];
      if (/hip abduction|abductor|clamshell|side lying leg raise|side leg raise/.test(n)) return [
        P('Abductors', 70, 'primary'), P('Glutes', 15), P('Abs', 10, 'stab'), P('Quads', 5)
      ];
      if (/hip adduction|adductor/.test(n)) return [
        P('Adductors', 70, 'primary'), P('Glutes', 12), P('Quads', 10), P('Abs', 8, 'stab')
      ];
      if (/romanian|rdl|stiff|good morning/.test(n)) return [
        P('Hams', 35, 'primary'), P('Glutes', 30), P('LowerBack', 15), P('Quads', 8),
        P('Forearms', 7), P('Abs', 5, 'stab')
      ];
      if (/deadlift/.test(n)) return [
        P('Hams', 25, 'primary'), P('Glutes', 25), P('LowerBack', 20), P('Quads', 12),
        P('Forearms', 10), P('Abs', 8, 'stab')
      ];
      if (/split squat|bulgarian|lunge|step.?up/.test(n)) return [
        P('Quads', 40, 'primary'), P('Glutes', 25), P('Hams', 10), P('Adductors', 8),
        P('Calves', 5), P('Abs', 12, 'stab')
      ];
      if (/squat|leg press|hack|wall sit/.test(n)) return [
        P('Quads', 42, 'primary'), P('Glutes', 22), P('Hams', 12), P('Adductors', 8),
        P('Calves', 5), P('Abs', 11, 'stab')
      ];
      return [
        P(pk, 50, 'primary'), P('Glutes', 15), P('Hams', 10), P('Abs', 10, 'stab'), P('Calves', 5)
      ];
    }
    if (g === 'chest') {
      if (/incline/.test(n)) return [
        P('ChestUpper', 45, 'primary'), P('ShouldersFront', 20), P('Triceps', 20),
        P('Abs', 8, 'stab'), P('MidBack', 7)
      ];
      if (/decline|dip/.test(n)) return [
        P('ChestLower', 52, 'primary'), P('Triceps', 20), P('ShouldersFront', 13),
        P('Abs', 8, 'stab'), P('MidBack', 7)
      ];
      if (/fly|pec deck|crossover/.test(n)) return [
        P('ChestMid', 60, 'primary'), P('ShouldersFront', 15), P('Abs', 15, 'stab'), P('MidBack', 10)
      ];
      if (/push.?up/.test(n)) return [
        P('ChestMid', 45, 'primary'), P('Triceps', 20), P('ShouldersFront', 15),
        P('Abs', 12, 'stab'), P('MidBack', 8)
      ];
      return [
        P('ChestMid', 50, 'primary'), P('Triceps', 22), P('ShouldersFront', 15),
        P('Abs', 8, 'stab'), P('MidBack', 5)
      ];
    }
    if (g === 'back') {
      if (/shrug/.test(n)) return [
        P('Traps', 65, 'primary'), P('MidBack', 15), P('ShouldersRear', 10),
        P('Forearms', 5), P('Abs', 5, 'stab')
      ];
      if (/hyperextension|back extension|superman|good morning|erector/.test(n)) return [
        P('LowerBack', 60, 'primary'), P('Glutes', 20), P('Hams', 15), P('Abs', 5, 'stab')
      ];
      if (/deadlift/.test(n)) return [
        P('Hams', 25, 'primary'), P('Glutes', 25), P('LowerBack', 20), P('Quads', 12),
        P('Forearms', 10), P('Abs', 8, 'stab')
      ];
      if (/row/.test(n)) return [
        P('Lats', 35, 'primary'), P('MidBack', 25), P('Biceps', 18),
        P('ShouldersRear', 10), P('Forearms', 7), P('Abs', 5, 'stab')
      ];
      if (/pulldown|pull down|pull.?up|chin/.test(n)) return [
        P('Lats', 45, 'primary'), P('Biceps', 20), P('MidBack', 15),
        P('ShouldersRear', 8), P('Forearms', 7), P('Abs', 5, 'stab')
      ];
      return [
        P('Lats', 45, 'primary'), P('Biceps', 18), P('MidBack', 15),
        P('ShouldersRear', 10), P('Abs', 7, 'stab'), P('Forearms', 5)
      ];
    }
    if (g === 'shoulders') {
      if (/rear|reverse fly|face pull/.test(n)) return [
        P('ShouldersRear', 45, 'primary'), P('MidBack', 20), P('Traps', 15),
        P('Biceps', 5), P('Abs', 10, 'stab'), P('Forearms', 5)
      ];
      if (/lateral|side raise/.test(n)) return [
        P('ShouldersMid', 65, 'primary'), P('Traps', 12), P('ShouldersRear', 8),
        P('Abs', 10, 'stab'), P('Forearms', 5)
      ];
      if (/front raise/.test(n)) return [
        P('ShouldersFront', 62, 'primary'), P('ShouldersMid', 12), P('ChestUpper', 10),
        P('Abs', 10, 'stab'), P('Forearms', 6)
      ];
      if (/shrug/.test(n)) return [
        P('Traps', 65, 'primary'), P('MidBack', 15), P('ShouldersRear', 10),
        P('Forearms', 5), P('Abs', 5, 'stab')
      ];
      return [
        P('ShouldersFront', 45, 'primary'), P('Triceps', 25), P('Traps', 12),
        P('Abs', 10, 'stab'), P('Forearms', 8)
      ];
    }
    if (g === 'elbow_flexors') {
      if (/hammer/.test(n)) return [
        P('Brachialis', 68, 'primary'), P('Biceps', 15), P('Forearms', 10), P('Abs', 7, 'stab')
      ];
      if (/reverse|zottman|pronat/.test(n)) return [
        P('Brachioradialis', 60, 'primary'), P('Forearms', 20), P('Biceps', 12), P('Abs', 8, 'stab')
      ];
      return [
        P('Biceps', 72, 'primary'), P('Brachialis', 12), P('Forearms', 10), P('Abs', 6, 'stab')
      ];
    }
    if (g === 'triceps') return [
      P('Triceps', 78, 'primary'), P('Forearms', 10), P('ShouldersFront', 6), P('Abs', 6, 'stab')
    ];
    if (g === 'forearms') return [
      P('Forearms', 75, 'primary'), P('Biceps', 10), P('Brachioradialis', 5),
      P('Abs', 5, 'stab'), P('ShouldersMid', 5)
    ];
    if (g === 'abdominals') {
      if (/side plank|side bridge|iron cross|pallof|wood chop/.test(n)) return [
        P('Obliques', 45, 'primary'), P('AbsUpper', 15), P('AbsLower', 10),
        P('Glutes', 10), P('ShouldersMid', 10), P('LowerBack', 5, 'stab'), P('Quads', 5)
      ];
      if (/plank/.test(n)) return [
        P('AbsUpper', 35, 'primary'), P('AbsLower', 20), P('Obliques', 15),
        P('Glutes', 10), P('ShouldersFront', 8), P('LowerBack', 7, 'stab'), P('Quads', 5, 'stab')
      ];
      if (/leg raise|knee raise|hanging|toes to bar|reverse crunch/.test(n)) return [
        P('AbsLower', 45, 'primary'), P('HipFlexors', 25), P('AbsUpper', 12),
        P('Obliques', 8), P('LowerBack', 5, 'stab'), P('Glutes', 5)
      ];
      if (/twist|side bend|russian|bicycle|oblique/.test(n)) return [
        P('Obliques', 55, 'primary'), P('AbsUpper', 15), P('LowerBack', 15),
        P('HipFlexors', 5), P('ShouldersMid', 5, 'stab'), P('Forearms', 5)
      ];
      return [
        P('AbsUpper', 55, 'primary'), P('AbsLower', 15), P('Obliques', 15),
        P('HipFlexors', 10), P('LowerBack', 5, 'stab')
      ];
    }
    if (g === 'fullbody') {
      if (/clean|snatch|thruster/.test(n)) return [
        P('Quads', 25, 'primary'), P('Glutes', 20), P('Hams', 15), P('LowerBack', 15),
        P('Traps', 10), P('ShouldersFront', 5), P('Abs', 5, 'stab'), P('Forearms', 5)
      ];
      if (/burpee/.test(n)) return [
        P('Quads', 20, 'primary'), P('ChestMid', 20), P('Glutes', 12), P('Abs', 15, 'stab'),
        P('ShouldersFront', 10), P('Triceps', 10), P('Hams', 8), P('Calves', 5)
      ];
      if (/mountain climber/.test(n)) return [
        P('AbsLower', 30, 'primary'), P('HipFlexors', 20), P('ShouldersFront', 15),
        P('Quads', 15), P('Glutes', 10), P('Calves', 5), P('LowerBack', 5, 'stab')
      ];
      return [
        P('Quads', 25, 'primary'), P('Glutes', 20), P('Hams', 15), P('MidBack', 10),
        P('Abs', 10, 'stab'), P('ShouldersFront', 10), P('Calves', 5), P('Forearms', 5)
      ];
    }
    if (g === 'cardio') {
      if (/bike|cycle/.test(n)) return [
        P('Quads', 35, 'primary'), P('Glutes', 20), P('Calves', 15), P('Hams', 10),
        P('Abs', 10, 'stab'), P('HipFlexors', 10)
      ];
      if (/row/.test(n)) return [
        P('Lats', 30, 'primary'), P('Quads', 20), P('Glutes', 15), P('Hams', 10),
        P('Abs', 10, 'stab'), P('ShouldersRear', 5), P('Forearms', 5), P('Calves', 5)
      ];
      if (/jump rope|rope/.test(n)) return [
        P('Calves', 35, 'primary'), P('Quads', 20), P('Glutes', 15), P('Hams', 10),
        P('Abs', 10, 'stab'), P('HipFlexors', 10)
      ];
      return [
        P('Quads', 30, 'primary'), P('Calves', 20), P('Glutes', 20), P('Hams', 12),
        P('Abs', 10, 'stab'), P('HipFlexors', 8)
      ];
    }
    /* stretching / warmup / balance / unknown: keep the target visible but
       spread a little work to core and the nearest helper. These are not
       strength lifts - the target still dominates, helpers are secondary. */
    var second = defaultHelper(pk);
    if (!second || second === pk) second = (pk === 'Abs' ? 'HipFlexors' : 'Abs');
    var stab = (pk === 'Abs' ? 'LowerBack' : 'Abs');
    var list = [P(pk, 65, 'primary'), P(second, 15, 'syn'), P(stab, 15, 'stab')];
    if (M[pk] && M[pk].group === 'legs') list.push(P('Calves', 5, 'stab'));
    else list.push(P('Forearms', 5, 'syn'));
    return list;
  }

  function defaultHelper(pk) {
    var g = M[pk] && M[pk].group;
    if (g === 'legs') {
      if (pk === 'Quads') return 'Glutes';
      if (pk === 'Glutes') return 'Hams';
      if (pk === 'Hams') return 'Glutes';
      if (pk === 'Calves') return 'Hams';
      if (pk === 'Adductors') return 'Glutes';
      if (pk === 'Abductors') return 'Glutes';
      if (pk === 'HipFlexors') return 'AbsLower';
    }
    if (g === 'chest') return 'Triceps';
    if (g === 'back') return (pk === 'Lats' || pk === 'MidBack') ? 'Biceps' : 'MidBack';
    if (g === 'shoulders') return 'Triceps';
    if (g === 'elbow_flexors') return 'Forearms';
    if (g === 'triceps') return 'Forearms';
    if (g === 'forearms') return 'Biceps';
    if (g === 'abdominals') return (pk === 'AbsLower') ? 'HipFlexors' : 'AbsLower';
    return 'Abs';
  }

  function adaptProfile(list, pk, d) {
    var g = M[pk] && M[pk].group;
    var primaryIndex = -1;
    for (var i = 0; i < list.length; i++) {
      if (list[i][2] === 'primary' && M[list[i][0]] && M[list[i][0]].group === g) {
        primaryIndex = i; break;
      }
    }
    if (primaryIndex < 0) {
      list.unshift(P(pk, 45, 'primary'));
      return list;
    }
    if (list[primaryIndex][0] !== pk) {
      var existing = -1;
      for (var j = 0; j < list.length; j++) if (list[j][0] === pk) { existing = j; break; }
      var weight = list[primaryIndex][1];
      if (existing >= 0) weight = Math.max(weight, list[existing][1]);
      if (existing >= 0 && existing !== primaryIndex) list.splice(existing, 1);
      if (existing >= 0 && existing < primaryIndex) primaryIndex--;
      list[primaryIndex] = P(pk, Math.max(weight, 40), 'primary');
    }
    return list;
  }

  function addExistingSyn(list, d, pk) {
    var seen = {};
    list.forEach(function (x) { seen[x[0]] = 1; });
    (Array.isArray(d.syn) ? d.syn : []).forEach(function (raw) {
      var k = keyFor(raw);
      if (!k || k === pk || seen[k]) return;
      /* "core"/"abs" is a generic alias - if a specific abs region is already
         in the profile, do not add a second anonymous core row */
      if (k === 'Abs' && list.some(function (x) { return M[x[0]] && M[x[0]].group === 'abdominals'; })) return;
      /* a generic "chest"/"shoulders" alias is redundant when a specific
         region of that group is already in the profile */
      if (M[k] && (k === 'ChestMid' || k === 'ShouldersMid') &&
          list.some(function (x) { return M[x[0]] && M[x[0]].group === M[k].group; })) return;
      seen[k] = 1;
      list.push(P(k, 4, 'syn'));
    });
    return list;
  }

  function finalize(list, pk, d) {
    /* de-dupe and merge any accidental duplicate key */
    var by = {}, order = [];
    list.forEach(function (x) {
      var k = x[0];
      if (!k || !M[k]) return;
      if (!by[k]) { by[k] = { key: k, weight: 0, role: x[2] || 'syn' }; order.push(k); }
      by[k].weight += x[1] || 1;
      if (x[2] === 'stab') by[k].role = 'stab';
    });
    var arr = order.map(function (k) { return by[k]; });
    if (!arr.length) arr = [{ key: pk, weight: 60, role: 'primary' }];
    /* keep at most 8; primary + strongest helpers + at least one stabilizer */
    arr.sort(function (a, b) { return b.weight - a.weight; });
    if (arr.length > 8) {
      var stab = arr.filter(function (x) { return x.role === 'stab'; })[0];
      var cut = arr.slice(0, 8);
      if (stab && cut.indexOf(stab) < 0) cut[cut.length - 1] = stab;
      arr = cut;
    }
    var sum = arr.reduce(function (s, x) { return s + x.weight; }, 0) || 1;
    arr.forEach(function (x) { x.pct = Math.round(x.weight / sum * 100); });
    var diff = 100 - arr.reduce(function (s, x) { return s + x.pct; }, 0);
    var top = arr.reduce(function (a, b) { return b.pct > a.pct ? b : a; }, arr[0]);
    top.pct += diff;
    /* one primary only, and it must be the DB/name primary */
    var primary = arr.filter(function (x) { return x.key === pk; })[0];
    if (!primary) { primary = top; primary.key = pk; }
    primary.pct = Math.max(primary.pct, top.pct);
    arr.forEach(function (x) {
      if (x.key === primary.key) x.role = 'primary';
      else x.role = (x.role === 'stab') ? 'stabilizer' : 'synergist';
    });
    primary.role = 'primary';
    /* always show core stabilisation on compound/free-weight work */
    if (!arr.some(function (x) { return x.role === 'stabilizer'; })) {
      var cand = (pk === 'Abs') ? 'LowerBack' : 'Abs';
      if (!by[cand]) arr.push({ key: cand, weight: 5, pct: 5, role: 'stabilizer' });
    }
    /* ensure at least one helper on compound work */
    if (arr.length < 2) {
      var h = defaultHelper(pk);
      if (h !== pk) arr.push({ key: h, weight: 10, pct: 10, role: 'synergist' });
    }
    /* renormalise after stabilizer/helper additions and round */
    var sum2 = arr.reduce(function (s, x) { return s + (x.pct || x.weight || 1); }, 0) || 1;
    arr.forEach(function (x) { x.pct = Math.max(1, Math.round((x.pct || x.weight) / sum2 * 100)); });
    var diff2 = 100 - arr.reduce(function (s, x) { return s + x.pct; }, 0);
    arr[0].pct += diff2;
    /* final roles / order */
    arr.sort(function (a, b) {
      var ra = a.role === 'primary' ? 0 : (a.role === 'stabilizer' ? 2 : 1);
      var rb = b.role === 'primary' ? 0 : (b.role === 'stabilizer' ? 2 : 1);
      return ra - rb || b.pct - a.pct;
    });
    var out = arr.map(function (x) {
      var m = M[x.key];
      return {
        key: x.key,
        group: m.group,
        sub: m.sub,
        pct: x.pct,
        role: x.role,
        label: { en: m.en, ru: m.ru, he: m.he },
        major: x.pct >= 15
      };
    });
    var primaryOut = out.filter(function (x) { return x.role === 'primary'; })[0] || out[0];
    return {
      version: VERSION,
      id: d.ex.id || d.ex.name || '',
      name: d.name,
      primary: primaryOut,
      muscles: out,
      byGroup: out.reduce(function (o, x) { o[x.group] = (o[x.group] || 0) + x.pct; return o; }, {})
    };
  }

  var CACHE = {};
  function forExercise(ex, opts) {
    ex = ex || {};
    /* c185 taxonomy fixes also apply to old history snapshots that do not
       carry the corrected DB record (keeps the card and the engines aligned) */
    try {
      var core = (typeof window !== 'undefined' && window.dkMuscleCore) ||
                 (typeof globalThis !== 'undefined' && globalThis.dkMuscleCore) || null;
      var id = ex.id || ex.exercise_id || ex.key;
      var fix = core && typeof core.taxonomyFix === 'function' ? core.taxonomyFix(id) : null;
      if (fix) {
        ex = Object.assign({}, ex, {
          group_canonical: fix.group, subgroup_en: fix.subgroup,
          synergist_muscles: fix.synergists, g: fix.group, sE: fix.subgroup,
          synergists: fix.synergists
        });
      }
    } catch (eFix) {}
    var d = exData(ex);
    var cacheKey = String(
      d.ex.id || d.ex.exercise_id || d.ex.key || d.name || '?' ) + '|' +
      d.group + '|' + d.sub + '|' + d.n + '|' + (Array.isArray(d.syn) ? d.syn.join(',') : '') +
      '|' + d.equip + '|' + d.mt;
    if (CACHE[cacheKey]) return CACHE[cacheKey];
    var pk = primaryKey(d);
    if (!M[pk]) pk = 'Abs';
    var list = profileFor(pk, d);
    list = adaptProfile(list, pk, d);
    list = addExistingSyn(list, d, pk);
    var out = finalize(list, pk, d);
    CACHE[cacheKey] = out;
    return out;
  }

  function forInfo(info, ex) {
    info = info || {};
    var pseudo = {
      id: (ex && (ex.id || ex.exercise_id || ex.key)) || '',
      name_en: (info.names && info.names[0]) || info.name || '',
      group_canonical: info.group || '',
      subgroup_en: info.sub || '',
      synergist_muscles: info.synergists || [],
      equipment_type: info.equipment || '',
      movement_type: info.mt || ''
    };
    return forExercise(pseudo);
  }

  function renderChips(ex, lang, opts) {
    opts = opts || {};
    var L = langOf(lang);
    var r = forExercise(ex);
    var primary = r.primary;
    var muscles = r.muscles.slice();
    var detailed = !!opts.detailed;
    if (!detailed) {
      var maxAux = opts.maxAux != null ? Math.max(0, Number(opts.maxAux) || 0) : 4;
      var maxStab = opts.maxStab != null ? Math.max(0, Number(opts.maxStab) || 0) : 2;
      var syn = muscles.filter(function (x) { return x.role === 'synergist'; });
      var stab = muscles.filter(function (x) { return x.role === 'stabilizer'; });
      var shown = [primary].concat(syn.slice(0, maxAux), stab.slice(0, maxStab));
      var hidden = muscles.length - shown.length;
      var html = shown.map(function (x) { return chipHTML(x, L); }).join('');
      if (hidden > 0) html += '<span class="text-[10px] text-muted px-1 py-1">+' + hidden + '</span>';
      return html;
    }
    var rows = muscles.map(function (x) {
      var col = x.role === 'primary' ? colorOf(x.key) : (x.role === 'stabilizer' ? '#94a3b8' : '#22d3ee');
      var rl = displayRole(x, L);
      return '<div class="flex items-center gap-2 text-[11px] leading-tight">' +
        '<span class="w-1.5 h-1.5 rounded-full shrink-0" style="background:' + col + '"></span>' +
        '<span class="font-semibold text-text truncate" style="flex:1;min-width:0">' + esc(label(x.key, L)) + '</span>' +
        '<span class="text-[9px] uppercase tracking-wide text-muted shrink-0">' + esc(rl) + '</span>' +
        '<span class="font-mono font-bold text-text shrink-0" style="min-width:34px;text-align:right">' + x.pct + '%</span>' +
        '</div>';
    }).join('');
    var segments = muscles.map(function (x) {
      var col = x.role === 'primary' ? colorOf(x.key) : (x.role === 'stabilizer' ? '#94a3b8' : '#22d3ee');
      return '<span style="width:' + x.pct + '%;background:' + col + '"></span>';
    }).join('');
    return '<div class="w-full rounded-xl border border-border bg-surface-2/50 p-2.5">' +
      '<div class="flex items-center justify-between mb-1.5 gap-2">' +
      '<span class="text-[10px] font-bold uppercase tracking-wider text-muted">' + esc(WORK_LABEL[L] || WORK_LABEL.en) + '</span>' +
      '<span class="text-[9px] text-muted">≈ ' + esc(SHARE_LABEL[L] || SHARE_LABEL.en) + '</span>' +
      '</div>' +
      '<div class="flex h-1.5 rounded-full overflow-hidden mb-2" style="background:rgba(127,140,160,.18)">' + segments + '</div>' +
      '<div class="space-y-1">' + rows + '</div>' +
      '</div>';
  }

  function chipHTML(x, L) {
    var col = x.role === 'primary' ? colorOf(x.key) : (x.role === 'stabilizer' ? '#94a3b8' : '#22d3ee');
    var dot = x.role === 'primary' ? '◉' : (x.role === 'stabilizer' ? '○' : '◐');
    var role = displayRole(x, L);
    return '<span class="text-[11px] font-semibold px-2 py-1 rounded-md" ' +
      'style="background:' + col + '1f;color:inherit;border:1px solid ' + col + '55" ' +
      'title="' + esc(role) + ' · ≈' + x.pct + '%">' +
      '<span style="color:' + col + '">' + dot + '</span> ' + esc(label(x.key, L)) +
      ' <span class="font-mono opacity-80">' + x.pct + '%</span></span>';
  }

  var api = {
    version: VERSION,
    muscles: M,
    forExercise: forExercise,
    forInfo: forInfo,
    keyFor: keyFor,
    label: label,
    roleLabel: roleLabel,
    renderChips: renderChips,
    renderBreakdown: function (ex, lang) { return renderChips(ex, lang, { detailed: true }); }
  };
  if (typeof window !== 'undefined') window.dkMuscleRoles = api;
  if (typeof globalThis !== 'undefined') globalThis.dkMuscleRoles = api;
})();
