/* ============================================================================
   c184 — MUSCLE CORE (shared by analytics-engine and recovery-engine)
   ----------------------------------------------------------------------------
   ONE source for:
     • which sets count (performed: done OR touched; legacy fallback done);
     • kg normalization (lb → kg, per-exercise unit);
     • bodyweight / weighted-bodyweight effective load;
     • primary / synergist / stabilizer attribution credits;
     • local calendar-day helpers (no UTC midnight drift).
   Loaded as a classic script before both engines; exposes window.dkMuscleCore.
   ============================================================================ */
(function () {
  'use strict';

  var LB_TO_KG = 0.45359237;
  var DEFAULT_BW = 75;
  var CREDITS = {
    primary: 1.00,
    synergist: 0.30,
    stabilizer: 0.10      /* TOTAL for all stabilizers, split equally */
  };

  function isNum(v) { return typeof v === 'number' && isFinite(v); }
  function unique(list) {
    var out = [], seen = {};
    (list || []).forEach(function (v) {
      if (v == null || v === '') return;
      var k = String(v);
      if (seen[k]) return;
      seen[k] = 1; out.push(v);
    });
    return out;
  }
  function clamp(v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); }

  /* A set counts for analytics/recovery/Prev when it was actually performed:
     - new records carry performed = done || touched;
     - current sessions carry touched = true on any edit;
     - legacy records without flags fall back to done !== false. */
  function setPerformed(s) {
    if (!s) return false;
    if (s.performed != null) return !!s.performed;
    if (s.touched === true) return true;
    return s.done !== false;
  }
  function performedSets(sets) {
    return (sets || []).filter(setPerformed);
  }
  /* Progress metrics (PR / e1RM / top set) ignore warm-up sets. */
  function workingSets(sets) {
    return performedSets(sets).filter(function (s) { return s && s.type !== 'warmup'; });
  }
  function countSets(sets) { return performedSets(sets).length; }

  function toKg(weight, unit) {
    var w = Number(weight);
    if (!isFinite(w)) return 0;
    return String(unit || '').toLowerCase() === 'lb' ? w * LB_TO_KG : w;
  }

  function isCardioRow(s) {
    return s && (s.time != null || s.dist != null) && !Number(s.weight);
  }

  /* Bodyweight movement patterns → fraction of bodyweight actually moved.
     Matched against the exercise names (EN/RU/HE). Kept conservative. */
  var BW_PATTERNS = [
    { re: /pull[\s-]?up|chin[\s-]?up|подтяг|מתח/i,                f: 1.00 },
    { re: /muscle[\s-]?up|маскл[\s-]?ап/i,                        f: 1.00 },
    { re: /dip|брусь|מקבילים/i,                                   f: 0.95 },
    { re: /handstand|стойк[аи] на руках/i,                        f: 0.70 },
    { re: /inverted|australian|горизонтальн/i,                    f: 0.70 },
    { re: /squat|присед|סקוואט/i,                                 f: 0.65 },
    { re: /push[\s-]?up|pushup|отжим|שכיבות סמיכה/i,              f: 0.64 },
    { re: /calf[\s-]?raise|подъем[ы]? на носк|הרמות שוקיים/i,     f: 0.65 },
    { re: /lunge|выпад|לאנג/i,                                    f: 0.50 },
    { re: /step[\s-]?up|зашаг|עליית מדרגות/i,                     f: 0.50 },
    { re: /hyperextension|гиперэкстенз/i,                         f: 0.50 },
    { re: /plank|планк[аи]?|פלאנק/i,                              f: 0.40 },
    { re: /crunch|скручив|подъем[ы]? туловищ|כפיפות בטן/i,        f: 0.40 }
  ];
  function bodyweightPatternFraction(names, equipment) {
    try {
      var list = Array.isArray(names) ? names : (names ? [names] : []);
      for (var i = 0; i < list.length; i++) {
        var n = String(list[i] == null ? '' : list[i]);
        if (!n) continue;
        for (var p = 0; p < BW_PATTERNS.length; p++) {
          if (BW_PATTERNS[p].re.test(n)) return BW_PATTERNS[p].f;
        }
      }
      if (equipment && /bodyweight|body weight|вес тела|משקל גוף/i.test(String(equipment))) return 0.60;
    } catch (e) {}
    return 0;
  }
  function isBodyweightEquipment(equipment) {
    return !!(equipment && /bodyweight|body weight|вес тела|משקל גוף/i.test(String(equipment)));
  }
  function isMachineEquipment(equipment) {
    return !!(equipment && /machine|cable|smith|seated|supported|pec deck|leg press|hack|pulldown|pushdown/i.test(String(equipment)));
  }

  /* Effective load for a set: external kg, or bodyweight × pattern + added
     weight for bodyweight movements. Barbell squats with external weight stay
     external because their equipment is not bodyweight. */
  function setMetrics(ex, s, info, opts) {
    ex = ex || {};
    s = s || {};
    var externalKg = toKg(s.weight, ex.unit);
    var names = (info && info.names) ? info.names : [ex.name];
    var equipment = (info && info.equipment) || ex.equipment || '';
    var patternF = bodyweightPatternFraction(names, equipment);
    var bwEq = isBodyweightEquipment(equipment);
    var bw = (opts && isNum(opts.bodyWeightKg) && opts.bodyWeightKg > 30 && opts.bodyWeightKg < 300)
      ? opts.bodyWeightKg : DEFAULT_BW;
    var useBw = patternF > 0 && (externalKg <= 0 || bwEq);
    var effectiveKg = useBw ? (bw * patternF + externalKg) : externalKg;
    return {
      externalKg: externalKg,
      effectiveKg: effectiveKg,
      bodyweight: useBw,
      patternF: patternF,
      cardio: isCardioRow(s)
    };
  }

  /* Stabilizers are NOT stored in exercise-db.json. Until a curated field
     exists, infer a conservative, transparent set for compound/free-weight
     movements. Isolation and most machines get none. This is intentionally
     conservative (max 3 groups, 10% total credit split equally). */
  function inferStabilizers(info, ex) {
    if (info && Array.isArray(info.stabilizers) && info.stabilizers.length) {
      return unique(info.stabilizers);
    }
    var names = ((info && info.names) || []).concat(ex && ex.name ? [ex.name] : []).filter(Boolean).join(' ').toLowerCase();
    var eq = String((info && info.equipment) || (ex && ex.equipment) || '').toLowerCase();
    var syn = (info && info.synergists) || [];
    var compound = (info && info.mt === 'compound') || (syn && syn.length >= 2) ||
      /squat|deadlift|bench|press|row|pull|dip|lunge|clean|snatch|thrust|carry|plank|push[\s-]?up/i.test(names);
    if (!compound) return [];
    var machine = isMachineEquipment(eq);
    var free = !machine && (!eq || /barbell|dumbbell|kettlebell|bodyweight|body weight|вес тела|משקל גוף/i.test(eq));
    var lower = /squat|deadlift|hinge|lunge|clean|snatch|hip thrust|good morning|calf|leg press/i.test(names);
    var pull = /pull|row|curl|carry|shrug|deadlift|clean|snatch|lat|chin/i.test(names);
    var standing = /overhead|military|press|carry|lunge|squat|deadlift|clean|snatch/i.test(names);
    var out = ['abdominals'];
    if (free && pull) out.push('forearms');
    if (free && lower) out.push('back');
    if (free && standing && !lower) out.push('legs');
    if (machine) out = ['abdominals'];
    return unique(out).filter(function (g) {
      return g && g !== (info && info.group) && syn.indexOf(g) === -1;
    }).slice(0, 3);
  }

  /* One attribution model for both engines:
       primary   100%
       synergist  30% each (unchanged, map parity)
       stabilizer 10% TOTAL split equally
     The credits are additive (shared stress), not a partition of 100%. */
  function attribution(info, ex) {
    if (!info || !info.group) return null;
    var primary = info.group;
    var syn = unique(info.synergists || []).filter(function (g) {
      return g && g !== primary;
    });
    var stab = unique(info.stabilizers && info.stabilizers.length
      ? info.stabilizers
      : inferStabilizers(info, ex)).filter(function (g) {
        return g && g !== primary && syn.indexOf(g) === -1;
      });
    var stabCredit = stab.length ? (CREDITS.stabilizer / stab.length) : 0;
    return {
      primary: primary,
      synergists: syn.map(function (g) { return { group: g, credit: CREDITS.synergist }; }),
      stabilizers: stab.map(function (g) { return { group: g, credit: stabCredit }; }),
      credits: CREDITS
    };
  }

  /* Local calendar day helpers. The old recovery engine used UTC midnight
     (floor(ts / 86400000)), so a 01:00 workout in UTC+3 landed on the previous
     day. These helpers keep the user's local calendar. */
  function dayStart(ts) {
    var d = new Date(ts);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }
  function dayDiff(a, b) {
    return Math.round((dayStart(a) - dayStart(b)) / 86400000);
  }
  function addDays(ts, n) {
    var d = new Date(ts);
    d.setDate(d.getDate() + n);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }

  /* c185 taxonomy overrides */
  /* The exercise DB is corrected at the source + migrated into exercise_base.
     This map lets the portal correct OLD share snapshots and history records
     by exercise id, without waiting for a re-share. Keep in sync with
     scripts/taxonomy-fixes-c185.cjs (verified by test-c185-taxonomy.cjs). */
  var TAXONOMY_FIXES = {
  "bf_abdominal-hip-thrust": { group: "abdominals", groupEn: "Abdominals", groupRu: "Мышцы кора", groupHe: "בטן", subgroup: "Lower", subgroupEn: "Lower", subgroupRu: "Нижний", subgroupHe: "תחתון", synergists: ["hip flexors","glutes","hamstrings"] },
  "bf_weighted-abdominal-hip-thrust": { group: "abdominals", groupEn: "Abdominals", groupRu: "Мышцы кора", groupHe: "בטן", subgroup: "Lower", subgroupEn: "Lower", subgroupRu: "Нижний", subgroupHe: "תחתון", synergists: ["hip flexors","glutes","hamstrings"] },
  "gi_0103": { group: "abdominals", groupEn: "Abdominals", groupRu: "Мышцы кора", groupHe: "בטן", subgroup: "Upper", subgroupEn: "Upper", subgroupRu: "Верхний", subgroupHe: "עליון", synergists: ["Deltoid Posterior","Levator Scapulae","Teres Major"] },
  "gi_1193": { group: "abdominals", groupEn: "Abdominals", groupRu: "Мышцы кора", groupHe: "בטן", subgroup: "Obliques", subgroupEn: "Obliques", subgroupRu: "Obliques", subgroupHe: "Obliques", synergists: ["Gluteus Maximus","shoulders"] },
  "gi_1478": { group: "abdominals", groupEn: "Abdominals", groupRu: "Мышцы кора", groupHe: "בטן", subgroup: "Upper", subgroupEn: "Upper", subgroupRu: "Верхний", subgroupHe: "עליון", synergists: ["Deltoid Anterior","Gluteus Maximus","Tensor Fasciae Latae","Triceps Brachii","Gluteus Medius"] },
  "gi_2152": { group: "abdominals", groupEn: "Abdominals", groupRu: "Мышцы кора", groupHe: "בטן", subgroup: "Upper", subgroupEn: "Upper", subgroupRu: "Верхний", subgroupHe: "עליון", synergists: ["Deltoid Anterior","Hamstrings","Quadriceps","Tensor Fasciae Latae","Gluteus Maximus"] },
  "gi_2793": { group: "abdominals", groupEn: "Abdominals", groupRu: "Мышцы кора", groupHe: "בטן", subgroup: "Upper", subgroupEn: "Upper", subgroupRu: "Верхний", subgroupHe: "עליון", synergists: ["shoulders","triceps"] },
  "gi_3337": { group: "abdominals", groupEn: "Abdominals", groupRu: "Мышцы кора", groupHe: "בטן", subgroup: "Obliques", subgroupEn: "Obliques", subgroupRu: "Obliques", subgroupHe: "Obliques", synergists: ["shoulders"] },
  "gi_5047": { group: "abdominals", groupEn: "Abdominals", groupRu: "Мышцы кора", groupHe: "בטן", subgroup: "Obliques", subgroupEn: "Obliques", subgroupRu: "Obliques", subgroupHe: "Obliques", synergists: ["shoulders"] },
  "gi_5497": { group: "abdominals", groupEn: "Abdominals", groupRu: "Мышцы кора", groupHe: "בטן", subgroup: "Upper", subgroupEn: "Upper", subgroupRu: "Верхний", subgroupHe: "עליון", synergists: ["Deltoid Anterior","Deltoid Lateral","Deltoid Posterior","Gluteus Maximus","Gluteus Medius","Infraspinatus","Tensor Fasciae Latae","Teres Major","Teres Minor","Trapezius Middle Fibers","Triceps Brachii"] },
  "gi_0701": { group: "abdominals", groupEn: "Abdominals", groupRu: "Мышцы кора", groupHe: "בטן", subgroup: "Obliques", subgroupEn: "Obliques", subgroupRu: "Obliques", subgroupHe: "Obliques", synergists: ["shoulders"] },
  "gi_0702": { group: "abdominals", groupEn: "Abdominals", groupRu: "Мышцы кора", groupHe: "בטן", subgroup: "Obliques", subgroupEn: "Obliques", subgroupRu: "Obliques", subgroupHe: "Obliques", synergists: ["shoulders"] },
  "gi_1243": { group: "abdominals", groupEn: "Abdominals", groupRu: "Мышцы кора", groupHe: "בטן", subgroup: "Lower", subgroupEn: "Lower", subgroupRu: "Нижний", subgroupHe: "תחתון", synergists: ["hip flexors"] },
  "gi_1246": { group: "abdominals", groupEn: "Abdominals", groupRu: "Мышцы кора", groupHe: "בטן", subgroup: "Lower", subgroupEn: "Lower", subgroupRu: "Нижний", subgroupHe: "תחתון", synergists: ["hip flexors"] },
  "gi_2838": { group: "abdominals", groupEn: "Abdominals", groupRu: "Мышцы кора", groupHe: "בטן", subgroup: "Obliques", subgroupEn: "Obliques", subgroupRu: "Obliques", subgroupHe: "Obliques", synergists: ["hip flexors"] },
  "gi_3336": { group: "abdominals", groupEn: "Abdominals", groupRu: "Мышцы кора", groupHe: "בטן", subgroup: "Lower", subgroupEn: "Lower", subgroupRu: "Нижний", subgroupHe: "תחתון", synergists: ["hip flexors"] },
  "gi_3515": { group: "abdominals", groupEn: "Abdominals", groupRu: "Мышцы кора", groupHe: "בטן", subgroup: "Obliques", subgroupEn: "Obliques", subgroupRu: "Obliques", subgroupHe: "Obliques", synergists: ["hip flexors"] },
  "gi_4250": { group: "abdominals", groupEn: "Abdominals", groupRu: "Мышцы кора", groupHe: "בטן", subgroup: "Lower", subgroupEn: "Lower", subgroupRu: "Нижний", subgroupHe: "תחתון", synergists: ["hip flexors"] },
  "gi_4535": { group: "abdominals", groupEn: "Abdominals", groupRu: "Мышцы кора", groupHe: "בטן", subgroup: "Upper", subgroupEn: "Upper", subgroupRu: "Верхний", subgroupHe: "עליון", synergists: ["hip flexors","shoulders"] },
  "gi_4982": { group: "abdominals", groupEn: "Abdominals", groupRu: "Мышцы кора", groupHe: "בטן", subgroup: "Lower", subgroupEn: "Lower", subgroupRu: "Нижний", subgroupHe: "תחתון", synergists: ["hip flexors","glutes"] },
  "gi_3512": { group: "abdominals", groupEn: "Abdominals", groupRu: "Мышцы кора", groupHe: "בטן", subgroup: "Upper", subgroupEn: "Upper", subgroupRu: "Верхний", subgroupHe: "עליון", synergists: ["Deltoid Posterior","Latissimus Dorsi","Teres Major","Teres Minor","hip flexors"] },
  "gi_0622": { group: "abdominals", groupEn: "Abdominals", groupRu: "Мышцы кора", groupHe: "בטן", subgroup: "Lower", subgroupEn: "Lower", subgroupRu: "Нижний", subgroupHe: "תחתון", synergists: ["hip flexors"] },
  "gi_1244": { group: "abdominals", groupEn: "Abdominals", groupRu: "Мышцы кора", groupHe: "בטן", subgroup: "Lower", subgroupEn: "Lower", subgroupRu: "Нижний", subgroupHe: "תחתון", synergists: ["hip flexors"] },
  "gi_2891": { group: "abdominals", groupEn: "Abdominals", groupRu: "Мышцы кора", groupHe: "בטן", subgroup: "Lower", subgroupEn: "Lower", subgroupRu: "Нижний", subgroupHe: "תחתון", synergists: ["hip flexors"] },
  "gi_3890": { group: "abdominals", groupEn: "Abdominals", groupRu: "Мышцы кора", groupHe: "בטן", subgroup: "Lower", subgroupEn: "Lower", subgroupRu: "Нижний", subgroupHe: "תחתון", synergists: ["hip flexors","forearms"] },
  "gi_3891": { group: "abdominals", groupEn: "Abdominals", groupRu: "Мышцы кора", groupHe: "בטן", subgroup: "Lower", subgroupEn: "Lower", subgroupRu: "Нижний", subgroupHe: "תחתון", synergists: ["hip flexors","forearms"] },
  "gi_3962": { group: "abdominals", groupEn: "Abdominals", groupRu: "Мышцы кора", groupHe: "בטן", subgroup: "Lower", subgroupEn: "Lower", subgroupRu: "Нижний", subgroupHe: "תחתון", synergists: ["hip flexors"] },
  "gi_4373": { group: "abdominals", groupEn: "Abdominals", groupRu: "Мышцы кора", groupHe: "בטן", subgroup: "Lower", subgroupEn: "Lower", subgroupRu: "Нижний", subgroupHe: "תחתון", synergists: ["hip flexors","forearms"] },
  "gi_4766": { group: "abdominals", groupEn: "Abdominals", groupRu: "Мышцы кора", groupHe: "בטן", subgroup: "Lower", subgroupEn: "Lower", subgroupRu: "Нижний", subgroupHe: "תחתון", synergists: ["hip flexors","forearms"] },
  "gi_4767": { group: "abdominals", groupEn: "Abdominals", groupRu: "Мышцы кора", groupHe: "בטן", subgroup: "Lower", subgroupEn: "Lower", subgroupRu: "Нижний", subgroupHe: "תחתון", synergists: ["hip flexors","forearms"] },
  "gi_4768": { group: "abdominals", groupEn: "Abdominals", groupRu: "Мышцы кора", groupHe: "בטן", subgroup: "Lower", subgroupEn: "Lower", subgroupRu: "Нижний", subgroupHe: "תחתון", synergists: ["hip flexors"] },
  "gi_6810": { group: "abdominals", groupEn: "Abdominals", groupRu: "Мышцы кора", groupHe: "בטן", subgroup: "Lower", subgroupEn: "Lower", subgroupRu: "Нижний", subgroupHe: "תחתון", synergists: ["hip flexors"] },
  "gi_8873": { group: "abdominals", groupEn: "Abdominals", groupRu: "Мышцы кора", groupHe: "בטן", subgroup: "Lower", subgroupEn: "Lower", subgroupRu: "Нижний", subgroupHe: "תחתון", synergists: ["hip flexors"] },
  "gi_9321": { group: "abdominals", groupEn: "Abdominals", groupRu: "Мышцы кора", groupHe: "בטן", subgroup: "Lower", subgroupEn: "Lower", subgroupRu: "Нижний", subgroupHe: "תחתון", synergists: ["hip flexors"] },
  "gv_1688": { group: "legs", groupEn: "Legs", groupRu: "Ноги", groupHe: "רגליים", subgroup: "Quadriceps", subgroupEn: "Quadriceps", subgroupRu: "Квадрицепс", subgroupHe: "ארבע ראשי", synergists: ["glutes","hamstrings","obliques"] },
  "gi_10183": { group: "shoulders", groupEn: "Shoulders", groupRu: "Плечи", groupHe: "כתפיים", subgroup: "Front", subgroupEn: "Front", subgroupRu: "Передний", subgroupHe: "קדמי", synergists: ["abdominals"] },
  "gv_0778": { group: "chest", groupEn: "Chest", groupRu: "Грудь", groupHe: "חזה", subgroup: "Middle", subgroupEn: "Middle", subgroupRu: "Средний", subgroupHe: "אמצעי", synergists: ["triceps","shoulders","abdominals"] },
  "gi_4162": { group: "chest", groupEn: "Chest", groupRu: "Грудь", groupHe: "חזה", subgroup: "Middle", subgroupEn: "Middle", subgroupRu: "Средний", subgroupHe: "אמצעי", synergists: ["triceps","shoulders","abdominals"] },
  "gi_6017": { group: "back", groupEn: "Back", groupRu: "Спина", groupHe: "גב", subgroup: "Lats", subgroupEn: "Lats", subgroupRu: "Широчайшие", subgroupHe: "רחבת גב", synergists: ["biceps","shoulders","glutes"] }
  };
  function taxonomyFix(id) {
    return TAXONOMY_FIXES[String(id == null ? '' : id)] || null;
  }

  var api = {
    version: 'c185',
    LB_TO_KG: LB_TO_KG,
    DEFAULT_BW: DEFAULT_BW,
    CREDITS: CREDITS,
    setPerformed: setPerformed,
    performedSets: performedSets,
    workingSets: workingSets,
    countSets: countSets,
    toKg: toKg,
    isCardioRow: isCardioRow,
    bodyweightPatternFraction: bodyweightPatternFraction,
    isBodyweightEquipment: isBodyweightEquipment,
    isMachineEquipment: isMachineEquipment,
    setMetrics: setMetrics,
    inferStabilizers: inferStabilizers,
    attribution: attribution,
    dayStart: dayStart,
    dayDiff: dayDiff,
    addDays: addDays,
    clamp: clamp,
    taxonomyFix: taxonomyFix,
    unique: unique
  };
  if (typeof window !== 'undefined') window.dkMuscleCore = api;
  else if (typeof globalThis !== 'undefined') globalThis.dkMuscleCore = api;
})();
