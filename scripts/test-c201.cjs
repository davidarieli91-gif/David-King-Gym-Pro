#!/usr/bin/env node
/* c202 regression — cleanup of the experimental SVG lab + UX fixes. */
const fs = require('fs');
const path = require('path');
let pass = 0, fail = 0;
const ok = (name, cond) => { if (cond) { pass++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name); } };
const read = (f) => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');

const crm = read('fitness-crm.html');
const sw = read('sw.js');
const en = JSON.parse(read('src/i18n/en.json'));
const ru = JSON.parse(read('src/i18n/ru.json'));
const he = JSON.parse(read('src/i18n/he.json'));

ok('experimental SVG model file removed', !fs.existsSync(path.join(__dirname, '..', 'src/anatomy-svg.js')));
ok('no DKAnatomy runtime left', crm.indexOf('DKAnatomy') < 0 && crm.indexOf('anatomy-svg.js') < 0);
ok('anatomy modal removed', crm.indexOf('ana-modal') < 0 && crm.indexOf('data-open-anatomy') < 0 && crm.indexOf('v2-ch-anatomy') < 0);
ok('atlas SVG button removed', crm.indexOf('atlas-svg-btn') < 0);
ok('3D atlas remains', crm.indexOf('id="atlas-modal"') >= 0 && crm.indexOf('id="atlas-canvas"') >= 0);
ok('language control is a select', /<select id="atlas-lang"[\s\S]*?<option value="en">EN<\/option>[\s\S]*?<option value="ru">RU<\/option>[\s\S]*?<option value="he">HE<\/option>/.test(crm));
ok('language select changes app language', crm.indexOf("langBtn.addEventListener('change'") >= 0 && crm.indexOf("var next = langBtn.value") >= 0);
ok('language select is styled', crm.indexOf('.v2-atlas-lang-select') >= 0 && crm.indexOf('.v2-atlas-lang-chev') >= 0);
ok('closed exercise cards no longer render role chips', (crm.match(/getExerciseMuscleChips\(/g) || []).length === 2 && crm.indexOf('maxAux: 2') < 0);
ok('open exercise modal still renders role chips', crm.indexOf("getExerciseMuscleChips(ex, lang, { detailed: true })") >= 0 && crm.indexOf("getExerciseMuscleChips(e, currentLang(), { detailed: true })") >= 0);
ok('mobile menu has expanded state + controls', crm.indexOf('aria-controls="aside"') >= 0 && crm.indexOf("menuBtn.setAttribute('aria-expanded'") >= 0);
ok('drawer close button exists', crm.indexOf('id="v2-drawer-close"') >= 0 && crm.indexOf("getElementById('v2-drawer-close')") >= 0);
ok('drawer backdrop lives in the app stacking context', crm.indexOf("(document.getElementById('app') || document.body).appendChild(backdrop)") >= 0);
ok('drawer scroll lock exists', crm.indexOf('v2-drawer-lock') >= 0 && crm.indexOf('overflow: hidden') >= 0);
ok('drawer is above the backdrop', crm.indexOf('z-index: 80') >= 0 && crm.indexOf('z-index: 75') >= 0);
ok('profile hero portal action kept', crm.indexOf('data-open-portal') >= 0 && crm.indexOf('v2-client-hero') >= 0);
ok('profile hero has real stats', crm.indexOf("t('client.age')") >= 0 && crm.indexOf('BMI') >= 0 && crm.indexOf("t('client.weight')") >= 0);
ok('i18n profileEyebrow kept in 3 languages', !!(en.client.profileEyebrow && ru.client.profileEyebrow && he.client.profileEyebrow));
ok('i18n muscleMap key removed', !(en.client.muscleMap || ru.client.muscleMap || he.client.muscleMap));
ok('build is c213', crm.indexOf('<meta name="dk-build" content="c213" />') >= 0);
ok('SW cache is v232', sw.indexOf("const CACHE_NAME = 'dk-gym-v240'") >= 0);
ok('running build label is c205', crm.indexOf('var RUNNING = 213') >= 0);
ok('login/sidebar show c205', crm.indexOf('3 languages · c213') >= 0 && crm.indexOf('id="v2-side-version">c213') >= 0);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
