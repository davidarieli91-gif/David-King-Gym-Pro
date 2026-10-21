/* c185 taxonomy corrections.
   Only unambiguous primary/synergist inversions found by the 5,623-exercise
   audit are listed here. Ambiguous compounds (side-lying abduction, hip
   adduction, prone glute kicks, rows/dips, loaded carries) are deliberately
   NOT changed.

   `cat` is only for the audit report: abs = an abdominal exercise that was
   filed under legs/chest/back; other = a clear inversion outside the abs
   family found by the same name-vs-primary check. */

const GROUPS = {
  abdominals: { g: 'abdominals', gE: 'Abdominals', gR: 'Мышцы кора', gH: 'בטן' },
  legs:       { g: 'legs',       gE: 'Legs',       gR: 'Ноги',       gH: 'רגליים' },
  chest:      { g: 'chest',      gE: 'Chest',      gR: 'Грудь',      gH: 'חזה' },
  back:       { g: 'back',       gE: 'Back',       gR: 'Спина',      gH: 'גב' },
  shoulders:  { g: 'shoulders',  gE: 'Shoulders',  gR: 'Плечи',      gH: 'כתפיים' }
};

const SUBGROUPS = {
  Upper:      { s: 'Upper',      sE: 'Upper',      sR: 'Верхний',      sH: 'עליון' },
  Lower:      { s: 'Lower',      sE: 'Lower',      sR: 'Нижний',       sH: 'תחתון' },
  Obliques:   { s: 'Obliques',   sE: 'Obliques',   sR: 'Obliques',     sH: 'Obliques' },
  Quadriceps: { s: 'Quadriceps', sE: 'Quadriceps', sR: 'Квадрицепс',   sH: 'ארבע ראשי' },
  Middle:     { s: 'Middle',     sE: 'Middle',     sR: 'Средний',      sH: 'אמצעי' },
  Front:      { s: 'Front',      sE: 'Front',      sR: 'Передний',     sH: 'קדמי' },
  Lats:       { s: 'Lats',       sE: 'Lats',       sR: 'Широчайшие',   sH: 'רחבת גב' }
};

/* id, group, subgroup, synergists, category */
const FIXES = [
  /* --- the reported exercise + its unweighted twin --------------------- */
  { id: 'bf_abdominal-hip-thrust',          group: 'abdominals', sub: 'Lower',    cat: 'abs',
    syn: ['hip flexors', 'glutes', 'hamstrings'] },
  { id: 'bf_weighted-abdominal-hip-thrust', group: 'abdominals', sub: 'Lower',    cat: 'abs',
    syn: ['hip flexors', 'glutes', 'hamstrings'] },

  /* --- ab rollouts / planks / side bridges ----------------------------- */
  { id: 'gi_0103', group: 'abdominals', sub: 'Upper',    cat: 'abs',
    syn: ['Deltoid Posterior', 'Levator Scapulae', 'Teres Major'] },
  { id: 'gi_1193', group: 'abdominals', sub: 'Obliques', cat: 'abs',
    syn: ['Gluteus Maximus', 'shoulders'] },
  { id: 'gi_1478', group: 'abdominals', sub: 'Upper',    cat: 'abs',
    syn: ['Deltoid Anterior', 'Gluteus Maximus', 'Tensor Fasciae Latae', 'Triceps Brachii', 'Gluteus Medius'] },
  { id: 'gi_2152', group: 'abdominals', sub: 'Upper',    cat: 'abs',
    syn: ['Deltoid Anterior', 'Hamstrings', 'Quadriceps', 'Tensor Fasciae Latae', 'Gluteus Maximus'] },
  { id: 'gi_2793', group: 'abdominals', sub: 'Upper',    cat: 'abs',
    syn: ['shoulders', 'triceps'] },
  { id: 'gi_3337', group: 'abdominals', sub: 'Obliques', cat: 'abs',
    syn: ['shoulders'] },
  { id: 'gi_5047', group: 'abdominals', sub: 'Obliques', cat: 'abs',
    syn: ['shoulders'] },
  { id: 'gi_5497', group: 'abdominals', sub: 'Upper',    cat: 'abs',
    syn: ['Deltoid Anterior', 'Deltoid Lateral', 'Deltoid Posterior', 'Gluteus Maximus', 'Gluteus Medius',
          'Infraspinatus', 'Tensor Fasciae Latae', 'Teres Major', 'Teres Minor', 'Trapezius Middle Fibers',
          'Triceps Brachii'] },
  { id: 'gi_0701', group: 'abdominals', sub: 'Obliques', cat: 'abs', syn: ['shoulders'] },
  { id: 'gi_0702', group: 'abdominals', sub: 'Obliques', cat: 'abs', syn: ['shoulders'] },

  /* --- crunches / sit-ups / dead bugs / hollow / v-ups ------------------ */
  { id: 'gi_1243', group: 'abdominals', sub: 'Lower',    cat: 'abs', syn: ['hip flexors'] },
  { id: 'gi_1246', group: 'abdominals', sub: 'Lower',    cat: 'abs', syn: ['hip flexors'] },
  { id: 'gi_2838', group: 'abdominals', sub: 'Obliques', cat: 'abs', syn: ['hip flexors'] },
  { id: 'gi_3336', group: 'abdominals', sub: 'Lower',    cat: 'abs', syn: ['hip flexors'] },
  { id: 'gi_3515', group: 'abdominals', sub: 'Obliques', cat: 'abs', syn: ['hip flexors'] },
  { id: 'gi_4250', group: 'abdominals', sub: 'Lower',    cat: 'abs', syn: ['hip flexors'] },
  { id: 'gi_4535', group: 'abdominals', sub: 'Upper',    cat: 'abs', syn: ['hip flexors', 'shoulders'] },
  { id: 'gi_4982', group: 'abdominals', sub: 'Lower',    cat: 'abs', syn: ['hip flexors', 'glutes'] },
  { id: 'gi_3512', group: 'abdominals', sub: 'Upper',    cat: 'abs',
    syn: ['Deltoid Posterior', 'Latissimus Dorsi', 'Teres Major', 'Teres Minor', 'hip flexors'] },

  /* --- hanging / lying / seated lower-ab work --------------------------- */
  { id: 'gi_0622', group: 'abdominals', sub: 'Lower', cat: 'abs', syn: ['hip flexors'] },
  { id: 'gi_1244', group: 'abdominals', sub: 'Lower', cat: 'abs', syn: ['hip flexors'] },
  { id: 'gi_2891', group: 'abdominals', sub: 'Lower', cat: 'abs', syn: ['hip flexors'] },
  { id: 'gi_3890', group: 'abdominals', sub: 'Lower', cat: 'abs', syn: ['hip flexors', 'forearms'] },
  { id: 'gi_3891', group: 'abdominals', sub: 'Lower', cat: 'abs', syn: ['hip flexors', 'forearms'] },
  { id: 'gi_3962', group: 'abdominals', sub: 'Lower', cat: 'abs', syn: ['hip flexors'] },
  { id: 'gi_4373', group: 'abdominals', sub: 'Lower', cat: 'abs', syn: ['hip flexors', 'forearms'] },
  { id: 'gi_4766', group: 'abdominals', sub: 'Lower', cat: 'abs', syn: ['hip flexors', 'forearms'] },
  { id: 'gi_4767', group: 'abdominals', sub: 'Lower', cat: 'abs', syn: ['hip flexors', 'forearms'] },
  { id: 'gi_4768', group: 'abdominals', sub: 'Lower', cat: 'abs', syn: ['hip flexors'] },
  { id: 'gi_6810', group: 'abdominals', sub: 'Lower', cat: 'abs', syn: ['hip flexors'] },
  { id: 'gi_8873', group: 'abdominals', sub: 'Lower', cat: 'abs', syn: ['hip flexors'] },
  { id: 'gi_9321', group: 'abdominals', sub: 'Lower', cat: 'abs', syn: ['hip flexors'] },

  /* --- same audit, opposite direction: abs was primary but another group
         is the real prime mover ------------------------------------------ */
  { id: 'gv_1688', group: 'legs',      sub: 'Quadriceps', cat: 'other',
    syn: ['glutes', 'hamstrings', 'obliques'] },
  { id: 'gi_10183', group: 'shoulders', sub: 'Front',     cat: 'other',
    syn: ['abdominals'] },
  { id: 'gv_0778', group: 'chest',     sub: 'Middle',     cat: 'other',
    syn: ['triceps', 'shoulders', 'abdominals'] },
  { id: 'gi_4162', group: 'chest',     sub: 'Middle',     cat: 'other',
    syn: ['triceps', 'shoulders', 'abdominals'] },
  { id: 'gi_6017', group: 'back',      sub: 'Lats',       cat: 'other',
    syn: ['biceps', 'shoulders', 'glutes'] }
];

module.exports = { version: 'c185', GROUPS, SUBGROUPS, FIXES };
