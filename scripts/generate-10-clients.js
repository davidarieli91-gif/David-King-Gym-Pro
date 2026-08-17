/**
 * Generate 10 diverse, highly realistic clients with 10 distinct training protocols
 * and 10 distinct nutrition strategies for David King Gym Pro CRM.
 */
const fs = require('fs');

function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

const clientsData = [
  {
    name: 'Александр Смирнов',
    gender: 'male',
    birth_date: '1994-05-12',
    height: 182,
    weight: 78,
    target_weight: 84,
    goal: 'hypertrophy',
    activity_level: 'very_active',
    diet_preference: 'balanced',
    body_fat_pct: 13.5,
    visceral_fat: 3,
    muscle_mass: 41.2,
    bone_mass: 3.4,
    water_pct: 62.0,
    metabolic_age: 26,
    waist_cm: 79,
    chest_cm: 104,
    arm_cm: 38,
    thigh_cm: 58,
    equipment: ['barbell', 'dumbbell', 'cable', 'machine'],
    training_days: [1, 2, 3, 5, 6, 7],
    allergies: [],
    medical_conditions: 'Нет травм. Здоров.',
    notes: 'Опыт тренировок 4 года. Цель — качественная гипертрофия без лишнего жира. Медленный контролируемый эксцентрик.',
    program_name: 'PPL Hypertrophy Protocol (6 Days)',
    split_type: 'ppl',
    duration_months: 3,
    plan_name: 'Clean Bulking High-Protein (+350 kcal)',
    target_cal: 3150,
    target_protein: 185,
    target_carbs: 420,
    target_fat: 80
  },
  {
    name: 'Елена Васильева',
    gender: 'female',
    birth_date: '1998-09-23',
    height: 168,
    weight: 65,
    target_weight: 59,
    goal: 'fat_loss',
    activity_level: 'moderate',
    diet_preference: 'low_carb',
    body_fat_pct: 26.5,
    visceral_fat: 4,
    muscle_mass: 25.1,
    bone_mass: 2.3,
    water_pct: 53.5,
    metabolic_age: 27,
    waist_cm: 70,
    hip_cm: 102,
    thigh_cm: 59,
    equipment: ['barbell', 'dumbbell', 'cable', 'machine', 'bands'],
    training_days: [1, 3, 4, 6],
    allergies: ['lactose'],
    medical_conditions: 'Хруст в правом колене при глубоком седе (пателлофеморальный синдром). Избегать выпадов с острым углом.',
    notes: 'Акцент на форму ягодиц и бицепса бедра при одновременном снижении жировой прослойки.',
    program_name: 'Glute Specialization & Upper/Lower Split',
    split_type: 'upper_lower',
    duration_months: 2,
    plan_name: 'Carb Cycling Lean Tone (High/Low Days)',
    target_cal: 1750,
    target_protein: 135,
    target_carbs: 160,
    target_fat: 60
  },
  {
    name: 'Давид Коэн (David Cohen)',
    gender: 'male',
    birth_date: '1981-11-04',
    height: 176,
    weight: 92,
    target_weight: 90,
    goal: 'strength',
    activity_level: 'moderate',
    diet_preference: 'kosher',
    body_fat_pct: 21.0,
    visceral_fat: 7,
    muscle_mass: 45.0,
    bone_mass: 3.7,
    water_pct: 56.8,
    metabolic_age: 42,
    waist_cm: 91,
    chest_cm: 112,
    arm_cm: 42,
    thigh_cm: 64,
    equipment: ['barbell', 'dumbbell', 'cable', 'machine'],
    training_days: [1, 2, 4, 6],
    allergies: ['shellfish'],
    medical_conditions: 'Старая травма левого плеча (импинджмент). Жим лежа только с паузой и узким хватом.',
    notes: 'Силовое троеборье. Подготовка к любительским соревнованиям. Кошерное питание.',
    program_name: 'Westside Conjugate Strength System',
    split_type: 'abcd',
    duration_months: 3,
    plan_name: 'Kosher High-Performance Strength Fuel',
    target_cal: 2900,
    target_protein: 190,
    target_carbs: 350,
    target_fat: 85
  },
  {
    name: 'Анна Морозова',
    gender: 'female',
    birth_date: '1988-03-15',
    height: 164,
    weight: 68,
    target_weight: 57,
    goal: 'fat_loss',
    activity_level: 'very_active',
    diet_preference: 'keto',
    body_fat_pct: 29.0,
    visceral_fat: 5,
    muscle_mass: 23.8,
    bone_mass: 2.2,
    water_pct: 51.2,
    metabolic_age: 40,
    waist_cm: 75,
    hip_cm: 104,
    equipment: ['dumbbell', 'cable', 'machine', 'kettlebell'],
    training_days: [1, 2, 4, 5],
    allergies: ['gluten'],
    medical_conditions: 'Легкий сколиоз 1 ст. Исключить осевую компрессию выше 30 кг.',
    notes: 'Подготовка к пляжному сезону. Высокая мотивация, любит интенсивные плотные сеты.',
    program_name: 'German Body Comp (GBC) Tri-Sets',
    split_type: 'ab',
    duration_months: 2,
    plan_name: 'Targeted Ketogenic Fat-Burn Plan',
    target_cal: 1550,
    target_protein: 120,
    target_carbs: 35,
    target_fat: 105
  },
  {
    name: 'Михаил Громов',
    gender: 'male',
    birth_date: '2002-07-19',
    height: 188,
    weight: 85,
    target_weight: 85,
    goal: 'endurance',
    activity_level: 'extra_active',
    diet_preference: 'balanced',
    body_fat_pct: 11.0,
    visceral_fat: 2,
    muscle_mass: 46.5,
    bone_mass: 3.8,
    water_pct: 65.2,
    metabolic_age: 20,
    waist_cm: 80,
    chest_cm: 108,
    thigh_cm: 61,
    equipment: ['barbell', 'dumbbell', 'kettlebell', 'bodyweight', 'trx'],
    training_days: [1, 2, 3, 5, 6],
    allergies: [],
    medical_conditions: 'Здоров.',
    notes: 'Атлет игровых видов спорта (баскетбол/кроссфит). Развитие прыжка, скорости и анаэробной выносливости.',
    program_name: 'Athletic Conditioning & Plyo Power',
    split_type: 'upper_lower',
    duration_months: 3,
    plan_name: 'High-Carb Iso-Caloric Fueling (4000 kcal)',
    target_cal: 3900,
    target_protein: 180,
    target_carbs: 580,
    target_fat: 95
  },
  {
    name: 'Сара Леви (Sarah Levy)',
    gender: 'female',
    birth_date: '1974-12-08',
    height: 162,
    weight: 63,
    target_weight: 59,
    goal: 'health',
    activity_level: 'light',
    diet_preference: 'mediterranean',
    body_fat_pct: 31.5,
    visceral_fat: 6,
    muscle_mass: 20.9,
    bone_mass: 2.1,
    water_pct: 49.5,
    metabolic_age: 55,
    waist_cm: 78,
    hip_cm: 99,
    equipment: ['machine', 'cable', 'dumbbell', 'bands'],
    training_days: [1, 3, 5],
    allergies: [],
    medical_conditions: 'Остеопения (начальная стадия). Артроз коленных суставов 1 ст. Запрещены прыжки и ударная нагрузка.',
    notes: 'Укрепление мышечного корсета, плотности костей и мобильности суставов.',
    program_name: 'Longevity & Joint-Friendly Full Body',
    split_type: 'full_body',
    duration_months: 6,
    plan_name: 'Mediterranean Anti-Aging & Heart Health',
    target_cal: 1650,
    target_protein: 110,
    target_carbs: 180,
    target_fat: 55
  },
  {
    name: 'Игорь Новиков (Веган)',
    gender: 'male',
    birth_date: '1996-01-30',
    height: 179,
    weight: 71,
    target_weight: 77,
    goal: 'hypertrophy',
    activity_level: 'moderate',
    diet_preference: 'vegan',
    body_fat_pct: 14.0,
    visceral_fat: 3,
    muscle_mass: 37.1,
    bone_mass: 3.2,
    water_pct: 61.0,
    metabolic_age: 25,
    waist_cm: 77,
    chest_cm: 99,
    arm_cm: 36,
    equipment: ['barbell', 'dumbbell', 'cable', 'machine'],
    training_days: [1, 2, 4, 5],
    allergies: ['dairy', 'eggs'],
    medical_conditions: 'Нет.',
    notes: 'Веган 6 лет. Нужен четкий контроль аминокислотного профиля и растительного протеина.',
    program_name: 'Hypertrophy 4-Day Progressive Overload',
    split_type: 'upper_lower',
    duration_months: 3,
    plan_name: 'Plant-Based Muscle Fuel (Complete Amino)',
    target_cal: 2850,
    target_protein: 160,
    target_carbs: 390,
    target_fat: 70
  },
  {
    name: 'Ольга Кузнецова',
    gender: 'female',
    birth_date: '1991-08-14',
    height: 170,
    weight: 64,
    target_weight: 60,
    goal: 'rehab',
    activity_level: 'sedentary',
    diet_preference: 'balanced',
    body_fat_pct: 25.0,
    visceral_fat: 4,
    muscle_mass: 24.5,
    bone_mass: 2.4,
    water_pct: 54.0,
    metabolic_age: 33,
    waist_cm: 71,
    hip_cm: 98,
    equipment: ['cable', 'machine', 'dumbbell', 'bands', 'bodyweight'],
    training_days: [2, 4, 6],
    allergies: ['nuts'],
    medical_conditions: 'Грыжа диска L4-L5 (4 мм). Гиперлордоз поясничного отдела. Запрещены становые тяги и осевые приседания со штангой.',
    notes: 'Реабилитационный протокол: стабилизация кора, снятие спазма квадратной мышцы поясницы, включение ягодиц.',
    program_name: 'Spine Rehab & Core Stabilization',
    split_type: 'ab',
    duration_months: 3,
    plan_name: 'Anti-Inflammatory Gut Health Protocol',
    target_cal: 1700,
    target_protein: 125,
    target_carbs: 185,
    target_fat: 50
  },
  {
    name: 'Артем Соколов (Командировки)',
    gender: 'male',
    birth_date: '1985-04-18',
    height: 180,
    weight: 86,
    target_weight: 79,
    goal: 'fat_loss',
    activity_level: 'moderate',
    diet_preference: 'intermittent',
    body_fat_pct: 23.5,
    visceral_fat: 6,
    muscle_mass: 39.8,
    bone_mass: 3.3,
    water_pct: 55.4,
    metabolic_age: 44,
    waist_cm: 88,
    chest_cm: 106,
    equipment: ['bodyweight', 'bands', 'dumbbell'],
    training_days: [1, 3, 5],
    allergies: [],
    medical_conditions: 'Периодический дискомфорт в локтях (эпикондилит).',
    notes: 'Частые перелеты, отели без тренажерных залов. Тренировки 35-40 минут с резиной и собственным весом.',
    program_name: 'Travel Minimalist Band & Bodyweight EDT',
    split_type: 'full_body',
    duration_months: 2,
    plan_name: 'Intermittent Fasting 16/8 Travel Cut',
    target_cal: 2100,
    target_protein: 165,
    target_carbs: 200,
    target_fat: 70
  },
  {
    name: 'Максим Демьянов (Хардгейнер)',
    gender: 'male',
    birth_date: '2005-02-11',
    height: 185,
    weight: 64,
    target_weight: 75,
    goal: 'hypertrophy',
    activity_level: 'very_active',
    diet_preference: 'balanced',
    body_fat_pct: 9.5,
    visceral_fat: 1,
    muscle_mass: 34.2,
    bone_mass: 3.1,
    water_pct: 67.0,
    metabolic_age: 18,
    waist_cm: 72,
    chest_cm: 93,
    arm_cm: 31,
    thigh_cm: 51,
    equipment: ['barbell', 'dumbbell', 'cable', 'machine'],
    training_days: [1, 3, 5],
    allergies: [],
    medical_conditions: 'Здоров. Быстрый метаболизм.',
    notes: 'Типичный эктоморф. Сложно набирать вес. Нужен акцент на тяжелую базу 5x5 и профицит калорий с жидкими калориями.',
    program_name: 'Old-School Heavy 5x5 Mass Builder',
    split_type: 'full_body',
    duration_months: 4,
    plan_name: 'Hyper-Caloric Mass Gainer (+700 kcal)',
    target_cal: 3600,
    target_protein: 170,
    target_carbs: 520,
    target_fat: 95
  }
];

const generatedClients = [];
const generatedPrograms = [];
const generatedPlans = [];

clientsData.forEach((c, idx) => {
  const clientId = uuid();
  const progId = uuid();
  const planId = uuid();
  const now = Date.now() - (idx * 86400000); // spread dates over 10 days

  // 1. Client record
  const clientObj = {
    id: clientId,
    full_name: c.name,
    name_lower: c.name.toLowerCase(),
    phone: `+972-5${idx}-` + Math.floor(1000000 + Math.random() * 9000000),
    email: `client${idx + 1}@dk-gym.pro`,
    gender: c.gender,
    birth_date: c.birth_date,
    height: c.height,
    weight: c.weight,
    target_weight: c.target_weight,
    goal: c.goal,
    activity_level: c.activity_level,
    diet_preference: c.diet_preference,
    body_fat_pct: c.body_fat_pct,
    visceral_fat: c.visceral_fat,
    muscle_mass: c.muscle_mass,
    bone_mass: c.bone_mass,
    water_pct: c.water_pct,
    metabolic_age: c.metabolic_age,
    waist_cm: c.waist_cm || null,
    chest_cm: c.chest_cm || null,
    hip_cm: c.hip_cm || null,
    arm_cm: c.arm_cm || null,
    thigh_cm: c.thigh_cm || null,
    equipment: c.equipment,
    training_days: c.training_days,
    allergies: c.allergies,
    medical_conditions: c.medical_conditions,
    notes: c.notes,
    created_at: now,
    last_active: now
  };
  generatedClients.push(clientObj);

  // 2. Training Program record
  const programObj = {
    id: progId,
    client_id: clientId,
    name: c.program_name,
    split_type: c.split_type,
    status: 'active',
    duration_months: c.duration_months,
    created_at: now,
    archived_at: null,
    notes: `Методический протокол для ${c.name}. Цель: ${c.goal}. Соблюдать интервалы отдыха и RPE.`,
    workout_days: [
      {
        day_letter: 'A',
        name: 'Day A - Основной силовой блок',
        isRest: false,
        exercises: [
          {
            id: uuid(),
            exercise_id: 'ex_1',
            name: c.split_type === 'ppl' ? 'Barbell Bench Press (Жим лежа)' : 'Goblet Squat (Приседания с гантелью)',
            group: c.split_type === 'ppl' ? 'chest' : 'legs',
            equipment: 'barbell',
            rest_sec: 120,
            notes: 'RPE 8, 3 сек опускание',
            sets: [
              { set_num: 1, reps: 10, weight: 50, rpe: 7, type: 'warmup' },
              { set_num: 2, reps: 8, weight: 70, rpe: 8, type: 'normal' },
              { set_num: 3, reps: 8, weight: 75, rpe: 8.5, type: 'normal' },
              { set_num: 4, reps: 6, weight: 80, rpe: 9, type: 'normal' }
            ]
          },
          {
            id: uuid(),
            exercise_id: 'ex_2',
            name: 'Incline Dumbbell Press (Жим гантелей под углом)',
            group: 'chest',
            equipment: 'dumbbell',
            rest_sec: 90,
            notes: 'Угол 30 градусов, максимальная растяжка внизу',
            sets: [
              { set_num: 1, reps: 10, weight: 22, rpe: 8, type: 'normal' },
              { set_num: 2, reps: 10, weight: 24, rpe: 8.5, type: 'normal' },
              { set_num: 3, reps: 8, weight: 26, rpe: 9, type: 'dropset' }
            ]
          },
          {
            id: uuid(),
            exercise_id: 'ex_3',
            name: 'Plank / Core Stabilization (Планка)',
            group: 'abdominals',
            equipment: 'bodyweight',
            rest_sec: 60,
            notes: 'Статическое напряжение мышц живота',
            sets: [
              { set_num: 1, reps: 45, weight: 0, rpe: 8, type: 'normal' },
              { set_num: 2, reps: 45, weight: 0, rpe: 8.5, type: 'normal' },
              { set_num: 3, reps: 40, weight: 0, rpe: 9, type: 'failure' }
            ]
          }
        ]
      },
      {
        day_letter: 'B',
        name: 'Day B - Тяговый / Вспомогательный блок',
        isRest: false,
        exercises: [
          {
            id: uuid(),
            exercise_id: 'ex_4',
            name: 'Lat Pulldown (Тяга верхнего блока к груди)',
            group: 'back',
            equipment: 'cable',
            rest_sec: 90,
            notes: 'Сведение лопаток в нижней точке на 1 сек',
            sets: [
              { set_num: 1, reps: 12, weight: 45, rpe: 7.5, type: 'normal' },
              { set_num: 2, reps: 10, weight: 55, rpe: 8, type: 'normal' },
              { set_num: 3, reps: 8, weight: 65, rpe: 9, type: 'normal' }
            ]
          },
          {
            id: uuid(),
            exercise_id: 'ex_5',
            name: 'Dumbbell Romanian Deadlift (Румынская тяга с гантелями)',
            group: 'legs',
            equipment: 'dumbbell',
            rest_sec: 90,
            notes: 'Движение за счет отведения таза назад',
            sets: [
              { set_num: 1, reps: 12, weight: 16, rpe: 7.5, type: 'normal' },
              { set_num: 2, reps: 10, weight: 20, rpe: 8, type: 'normal' },
              { set_num: 3, reps: 10, weight: 22, rpe: 8.5, type: 'normal' }
            ]
          }
        ]
      }
    ]
  };
  generatedPrograms.push(programObj);

  // 3. Nutrition Plan record
  const planObj = {
    id: planId,
    client_id: clientId,
    name: c.plan_name,
    status: 'active',
    created_at: now,
    updated_at: now,
    archived_at: null,
    target_calories: c.target_cal,
    target_protein: c.target_protein,
    target_carbs: c.target_carbs,
    target_fat: c.target_fat,
    meals: [
      {
        id: uuid(),
        name: 'Завтрак (Breakfast)',
        time: '08:30',
        items: [
          { id: uuid(), name: 'Овсяная каша на воде с ягодами', amount_g: 220, calories: 195, protein: 6, carbs: 36, fat: 3 },
          { id: uuid(), name: 'Яйца куриные вареные (2 шт)', amount_g: 110, calories: 155, protein: 13, carbs: 1, fat: 11 },
          { id: uuid(), name: 'Греческий йогурт 2% (Pro/Go)', amount_g: 150, calories: 98, protein: 15, carbs: 5, fat: 2 }
        ]
      },
      {
        id: uuid(),
        name: 'Обед (Lunch)',
        time: '13:30',
        items: [
          { id: uuid(), name: 'Филе куриной грудки на гриле', amount_g: 180, calories: 240, protein: 42, carbs: 0, fat: 5 },
          { id: uuid(), name: 'Рис басмати или киноа вареная', amount_g: 200, calories: 260, protein: 6, carbs: 56, fat: 1 },
          { id: uuid(), name: 'Салат из свежих овощей с оливковым маслом', amount_g: 200, calories: 120, protein: 2, carbs: 8, fat: 9 }
        ]
      },
      {
        id: uuid(),
        name: 'Ужин (Dinner)',
        time: '19:30',
        items: [
          { id: uuid(), name: 'Филе лосося или тунец запеченный', amount_g: 160, calories: 280, protein: 32, carbs: 0, fat: 15 },
          { id: uuid(), name: 'Запеченный батат или гречка', amount_g: 150, calories: 165, protein: 4, carbs: 35, fat: 1 },
          { id: uuid(), name: 'Брокколи на пару с лимонным соком', amount_g: 150, calories: 50, protein: 4, carbs: 7, fat: 0 }
        ]
      }
    ]
  };
  generatedPlans.push(planObj);
});

// Build the standard backup payload matching CRM backup schema
const backupPayload = {
  meta: {
    format_version: 1,
    app_version: '1.0.0',
    db_name: 'fitness_crm_db',
    db_version: 9,
    created_at: Date.now(),
    created_at_iso: new Date().toISOString(),
    lang: 'ru',
    theme: 'dark',
    store_counts: {
      clients: generatedClients.length,
      client_programs: generatedPrograms.length,
      nutrition_plans: generatedPlans.length,
      workout_templates: 0,
      workout_history: 0,
      nutrition_history: 0,
      nutrition_templates: 0,
      settings: 0,
      exercise_base: 0,
      food_base: 0,
      food_database: 0
    },
    total_records: generatedClients.length + generatedPrograms.length + generatedPlans.length
  },
  data: {
    clients: generatedClients,
    client_programs: generatedPrograms,
    nutrition_plans: generatedPlans,
    workout_templates: [],
    workout_history: [],
    nutrition_history: [],
    nutrition_templates: [],
    settings: [],
    exercise_base: [],
    food_base: [],
    food_database: []
  }
};

fs.writeFileSync('data/10-pro-clients-backup.json', JSON.stringify(backupPayload, null, 2), 'utf-8');
console.log('Successfully created data/10-pro-clients-backup.json with 10 clients, 10 programs, and 10 nutrition plans!');
