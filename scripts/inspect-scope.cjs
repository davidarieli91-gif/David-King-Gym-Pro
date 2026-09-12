const fs = require('fs');
const s = fs.readFileSync('fitness-crm.html', 'utf8');
// exposures
const w = [...s.matchAll(/window\.(screens|router|vault|bodyMapPicker|applyI18n|switchAppLanguage|currentLang|openExerciseModal|renderBuilder)\s*=/g)];
w.slice(0, 20).forEach(x => console.log('expose', x[1], '@', x.index, ':', JSON.stringify(s.slice(x.index - 70, x.index + 90))));
// IIFE closes between 1650000 and 1658100 (before i18n section)
const seg = s.slice(1640000, 1658200);
const m = [...seg.matchAll(/\}\)\(\);/g)];
m.forEach(x => console.log('IIFE close @', 1640000 + x.index));
// where does the i18n section header start
console.log('applyI18n header pos:', s.indexOf('applyI18n(lang)     → walks'));
console.log('use strict pos:', s.indexOf("'use strict';"));
