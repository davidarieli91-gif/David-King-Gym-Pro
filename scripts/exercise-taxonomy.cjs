/* Canonical exercise taxonomy shared by the RepDB importer and the c195 checks.
   Keep this in sync with EQUIPMENT_TAXONOMY / canonicalEquipmentKey() in
   fitness-crm.html. The app ships the same rules inline because it is a
   single-file build; this module is the generator/test reference. */

const EQUIPMENT_TAXONOMY = {
  barbell: {
    en: 'Barbell', ru: 'Штанга', he: 'מוט',
    aliases: ['barbell', 'barbells']
  },
  ez_bar: {
    en: 'EZ-Bar', ru: 'EZ-гриф', he: 'מוט EZ',
    aliases: ['ez_bar', 'ezbar', 'ez']
  },
  trap_bar: {
    en: 'Trap Bar', ru: 'Трап-гриф', he: 'מוט טרפז',
    aliases: ['trap_bar', 'trapbar', 'hex_bar']
  },
  plate: {
    en: 'Plate', ru: 'Диски', he: 'דיסקיות',
    aliases: ['plate', 'plates', 'weight_plate']
  },
  dumbbell: {
    en: 'Dumbbell', ru: 'Гантели', he: 'משקולות',
    aliases: ['dumbbell', 'dumbbells', 'db']
  },
  kettlebell: {
    en: 'Kettlebell', ru: 'Гири', he: 'קטלבלים',
    aliases: ['kettlebell', 'kettlebells', 'kb']
  },
  cable: {
    en: 'Cable', ru: 'Кроссовер', he: 'כבלים',
    aliases: ['cable', 'cables', 'crossover', 'cable_machine', 'pulley']
  },
  machine: {
    en: 'Machine', ru: 'Тренажёр', he: 'מכשיר',
    aliases: [
      'machine', 'machines', 'smith', 'smith_machine', 'leg_press',
      'hack_squat', 'pec_deck', 'leg_curl', 'leg_extension',
      'glute_ham_developer', 'hip_abduction_machine', 'hip_adduction_machine',
      'hip_thrust_machine', 'standing_calf_raise_machine',
      'seated_calf_raise_machine', 'donkey_calf_raise_machine',
      'lat_pulldown_machine', 'seated_row_machine', 'assisted_pullup_machine',
      'dip_machine', 'chest_press_machine', 'chest_fly_machine',
      'shoulder_press_machine', 'reverse_fly_machine', 'bicep_curl_machine',
      'preacher_curl_machine', 'tricep_extension_machine',
      'back_extension_machine', 'ab_crunch_machine', 'shrug_machine',
      'plate_loaded_lateral_raise_machine', 'plate_loaded_dip_machine',
      'vibrate_plate', 'vibration_plate'
    ]
  },
  bench: {
    en: 'Bench', ru: 'Скамья', he: 'ספסל',
    aliases: ['bench', 'flat_bench']
  },
  box: {
    en: 'Box', ru: 'Тумба', he: 'ארגז',
    aliases: ['box', 'plyo_box']
  },
  bodyweight: {
    en: 'Bodyweight', ru: 'Вес тела', he: 'משקל גוף',
    aliases: ['bodyweight', 'body_weight', 'none', 'body_only']
  },
  weighted: {
    en: 'Weighted', ru: 'С доп. весом', he: 'עם משקל נוסף',
    aliases: ['weighted', 'weight', 'weighted_vest', 'vest']
  },
  assisted: {
    en: 'Assisted', ru: 'С поддержкой', he: 'בעזרה',
    aliases: ['assisted', 'assistance', 'partner_assisted']
  },
  pull_up_bar: {
    en: 'Pull-up Bar', ru: 'Турник', he: 'מתח',
    aliases: ['pull_up_bar', 'pullup_bar', 'pullupbar', 'dip_cage']
  },
  dip_station: {
    en: 'Dip Station', ru: 'Брусья', he: 'מקבילים',
    aliases: ['dip_station', 'dip_bars', 'parallel_bars']
  },
  rings: {
    en: 'Rings', ru: 'Кольца', he: 'טבעות',
    aliases: ['rings', 'ring']
  },
  band: {
    en: 'Band', ru: 'Резинки', he: 'גומיות',
    aliases: ['band', 'bands', 'resistance_band', 'resistance_bands', 'loop_band', 'bar_band']
  },
  suspension: {
    en: 'Suspension', ru: 'Петли', he: 'רצועות תלייה',
    aliases: ['suspension', 'suspension_trainer', 'suspender', 'trx']
  },
  medicine_ball: {
    en: 'Medicine Ball', ru: 'Медбол', he: 'כדור כוח',
    aliases: ['medicine_ball', 'med_ball', 'slam_ball', 'wall_ball']
  },
  stability_ball: {
    en: 'Stability Ball', ru: 'Фитбол', he: 'כדור יציבות',
    aliases: ['stability_ball', 'exercise_ball', 'fitball', 'swiss_ball']
  },
  bosu: {
    en: 'Bosu', ru: 'Босу', he: 'בוסו',
    aliases: ['bosu', 'bosu_ball', 'half_ball']
  },
  ab_wheel: {
    en: 'Ab Wheel', ru: 'Колесо для пресса', he: 'גלגלת בטן',
    aliases: ['ab_wheel', 'abwheel', 'wheel_roller', 'wheel']
  },
  rope: {
    en: 'Rope', ru: 'Канат', he: 'חבל',
    aliases: ['rope', 'climbing_rope', 'climb_rope']
  },
  battle_rope: {
    en: 'Battle Rope', ru: 'Боевой канат', he: 'חבל קרב',
    aliases: ['battle_rope', 'battling_rope', 'battling_ropes', 'battle_ropes']
  },
  jump_rope: {
    en: 'Jump Rope', ru: 'Скакалка', he: 'חבל קפיצה',
    aliases: ['jump_rope', 'skipping_rope']
  },
  cardio_machine: {
    en: 'Cardio Machine', ru: 'Кардиотренажёр', he: 'מכונה אירובית',
    aliases: [
      'cardio_machine', 'cardio', 'bicycle', 'air_bike', 'treadmill',
      'elliptical', 'rower', 'ski_erg', 'stair_climber', 'stationary_bike'
    ]
  },
  sled: {
    en: 'Sled', ru: 'Сани', he: 'מזחלת',
    aliases: ['sled', 'sled_machine', 'power_sled']
  },
  foam_roller: {
    en: 'Foam Roller', ru: 'Массажный ролл', he: 'רולר עיסוי',
    aliases: ['foam_roller', 'foam_roll', 'roller']
  },
  mobility_stick: {
    en: 'Mobility Stick', ru: 'Гимнастическая палка', he: 'מקל התעמלות',
    aliases: ['mobility_stick', 'stick', 'pvc', 'pvc_pipe']
  },
  strongman: {
    en: 'Strongman', ru: 'Стронгмен', he: 'סטרונגמן',
    aliases: ['strongman', 'strongman_implement', 'atlas_stone', 'yoke']
  },
  sandbag: {
    en: 'Sandbag', ru: 'Мешок с песком', he: 'שק חול',
    aliases: ['sandbag', 'sand_bag']
  },
  wrist_roller: {
    en: 'Wrist Roller', ru: 'Роллер для запястий', he: 'רולר פרקים',
    aliases: ['wrist_roller', 'wrist_rollerer']
  },
  other: {
    en: 'Other', ru: 'Другое', he: 'אחר',
    aliases: ['other', 'misc', 'unknown']
  }
};

/* Display order used by every source tab. Free weights first, then cables and
   machines, bodyweight/gymnastics, accessories, cardio, and finally Other. */
const EQUIPMENT_ORDER = [
  'barbell', 'ez_bar', 'trap_bar', 'plate', 'dumbbell', 'kettlebell',
  'cable', 'machine', 'bench', 'box',
  'bodyweight', 'weighted', 'assisted',
  'pull_up_bar', 'dip_station', 'rings',
  'band', 'suspension',
  'medicine_ball', 'stability_ball', 'bosu', 'ab_wheel',
  'rope', 'battle_rope', 'jump_rope',
  'cardio_machine', 'sled', 'foam_roller',
  'mobility_stick', 'strongman', 'sandbag', 'wrist_roller',
  'other'
];

const EQUIPMENT_ALIASES = Object.create(null);
for (const key of Object.keys(EQUIPMENT_TAXONOMY)) {
  EQUIPMENT_ALIASES[key] = key;
  for (const alias of EQUIPMENT_TAXONOMY[key].aliases) EQUIPMENT_ALIASES[alias] = key;
}

function canonicalEquipment(raw, nameEn, isBodyweight) {
  const name = String(nameEn || '').toLowerCase();
  const norm = String(raw == null ? '' : raw).toLowerCase().trim()
    .replace(/[\s-]+/g, '_').replace(/[^a-z0-9_]/g, '');
  let key = EQUIPMENT_ALIASES[norm] || '';

  if (!key || key === 'other') {
    if (/\bbar band\b/.test(name)) key = 'band';
    else if (/battling ropes|battle ropes?/.test(name)) key = 'battle_rope';
    else if (/jump rope|skipping rope/.test(name)) key = 'jump_rope';
    else if (/^suspender\b|^suspension\b/.test(name)) key = 'suspension';
    else if (/^ring\b/.test(name)) key = 'rings';
    else if (/\bstick\b|\bpvc\b/.test(name)) key = 'mobility_stick';
    else if (/vibrat(e|ion) plate/.test(name)) key = 'machine';
    else if (/\bsled\b/.test(name)) key = 'sled';
    else if (/wrist roller/.test(name)) key = 'wrist_roller';
    else if (/wheel roller|wheel rollout|ab wheel/.test(name)) key = 'ab_wheel';
    else if (/strongman|sledge ?hammer/.test(name)) key = 'strongman';
    else if (/sandbag/.test(name)) key = 'sandbag';
    else if (/weighted plate|plate (press|pinch)|^plate /.test(name)) key = 'plate';
    else if (/^weighted\b/.test(name)) key = 'weighted';
    else key = isBodyweight ? 'bodyweight' : 'other';
  }

  if (key === 'rope') {
    if (/battling|battle ropes?/.test(name)) key = 'battle_rope';
    else if (/jump rope|skipping/.test(name)) key = 'jump_rope';
  }
  if (key === 'foam_roller' && /wheel roller|wheel rollout|ab wheel/.test(name)) key = 'ab_wheel';
  if (key === 'weighted') {
    if (/strongman|sledge ?hammer/.test(name)) key = 'strongman';
    else if (/sandbag/.test(name)) key = 'sandbag';
    else if (/kettlebell/.test(name)) key = 'kettlebell';
    else if (/resistance band|\bband\b/.test(name)) key = 'band';
    else if (/weighted ball|medicine ball/.test(name)) key = 'medicine_ball';
    else if (/weighted plate|plate (press|pinch)|standing plate/.test(name)) key = 'plate';
  }
  return key || (isBodyweight ? 'bodyweight' : 'other');
}

/* RepDB primary muscles are too coarse (squats/lunges list gluteus maximus
   first), so the movement name decides the leg split. */
function legSubgroup(nameEn, primaryMuscles) {
  const name = String(nameEn || '').toLowerCase();
  const primary = Array.isArray(primaryMuscles)
    ? primaryMuscles.join(' ').toLowerCase()
    : String(primaryMuscles || '').toLowerCase();

  if (/calf|tibialis|soleus|heel raise/.test(name)) return 'Calves';
  if (/heel-to-toe/.test(name)) return 'Calves';
  if (/adduction|adductor/.test(name)) return 'Adductors';
  if (/wide[- ]stance leg press|cossack|side lunge/.test(name)) return 'Adductors';
  if (/abduction|abductor|clamshell|fire hydrant|lateral walk|side[- ]lying hip|pilates kneeling side kick|tree pose|eagle pose|warrior\s+ii(?!i)/.test(name)) return 'Abductors';
  if (/glute bridge|hip bridge|bridge|hip thrust|glute drive|kickback|frog pump|reverse tabletop|sumo walk/.test(name)) return 'Glutes';
  if (/romanian|\brdl\b|deadlift|good morning|leg curl|nordic|hamstring|swing|pull[- ]through|hip hinge/.test(name)) return 'Hamstrings';
  if (/squat|lunge|step[- ]?up|leg press|leg extension|knee extension|pistol|wall sit|split squat|box jump|chair pose|crescent|dancer pose|warrior|zercher|hack/.test(name)) return 'Quadriceps';

  if (/adductor/.test(primary)) return 'Adductors';
  if (/abductor|gluteus_medius/.test(primary)) return 'Abductors';
  if (/gastrocnemius|soleus|tibialis/.test(primary)) return 'Calves';
  if (/hamstring/.test(primary)) return 'Hamstrings';
  if (/gluteus/.test(primary)) return 'Glutes';
  return 'Quadriceps';
}

module.exports = {
  EQUIPMENT_TAXONOMY,
  EQUIPMENT_ORDER,
  EQUIPMENT_ALIASES,
  canonicalEquipment,
  legSubgroup
};
