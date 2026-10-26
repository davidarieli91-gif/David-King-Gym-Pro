#!/usr/bin/env node
/* c200 regression — additional SVG anatomy lab + Vision client profile hero. */
const fs = require('fs');
const path = require('path');
let pass = 0, fail = 0;
const ok = (name, cond) => { if (cond) { pass++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name); } };
const read = (f) => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');

const crm = read('fitness-crm.html');
const anatomy = read('src/anatomy-svg.js');
const copy = read('scripts/copy-assets.js');
const sw = read('sw.js');
const en = JSON.parse(read('src/i18n/en.json'));
const ru = JSON.parse(read('src/i18n/ru.json'));
const he = JSON.parse(read('src/i18n/he.json'));

ok('anatomy-svg.js exists and exposes DKAnatomy', anatomy.indexOf('window.DKAnatomy') >= 0);
ok('anatomy model has 30+ clickable muscles', (anatomy.match(/^    '[a-z0-9-]+':\s+\{ g:/gm) || []).length >= 30);
ok('muscles are real buttons', anatomy.indexOf('role="button"') >= 0 && anatomy.indexOf('tabindex="0"') >= 0);
ok('front + back figures built', anatomy.indexOf('function frontFigure') >= 0 && anatomy.indexOf('function backFigure') >= 0 && anatomy.indexOf('data-dkm-view="front"') >= 0 && anatomy.indexOf('data-dkm-view="back"') >= 0);
ok('anatomy rail groups defined', anatomy.indexOf("id: 'chest'") >= 0 && anatomy.indexOf("id: 'calves'") >= 0 && anatomy.indexOf('selectGroup') >= 0);
ok('anatomy inspector + exercise bridge', anatomy.indexOf('showExercisesFor') >= 0 && anatomy.indexOf('renderSelection') >= 0);
ok('profile mini preview mounts', anatomy.indexOf('mountMini') >= 0 && anatomy.indexOf('dkm-mini') >= 0);
ok('anatomy script is loaded by the trainer app', crm.indexOf('<script src="src/anatomy-svg.js"></script>') >= 0);
ok('anatomy asset is copied to dist', copy.indexOf("'src/anatomy-svg.js'") >= 0);
ok('anatomy modal is present', crm.indexOf('id="ana-modal"') >= 0 && crm.indexOf('id="ana-front"') >= 0 && crm.indexOf('id="ana-back"') >= 0);
ok('atlas header opens the SVG map', crm.indexOf('id="atlas-svg-btn"') >= 0);
ok('3D atlas stays available', crm.indexOf('id="atlas-modal"') >= 0 && crm.indexOf('id="ana-open-3d"') >= 0);
ok('profile hero uses the Vision classes', crm.indexOf('v2-client-hero') >= 0 && crm.indexOf('v2-ch-anatomy') >= 0);
ok('profile hero exposes anatomy + portal actions', crm.indexOf('data-open-anatomy') >= 0 && crm.indexOf('data-open-portal') >= 0);
ok('profile hero mounts the mini model', crm.indexOf("DKAnatomy.mountMini(document.getElementById('profile-hero-anatomy'))") >= 0);
ok('hero keeps real client stats', crm.indexOf("t('client.age')") >= 0 && crm.indexOf('BMI') >= 0 && crm.indexOf("t('client.weight')") >= 0);
ok('i18n: profileEyebrow in 3 languages', !!(en.client.profileEyebrow && ru.client.profileEyebrow && he.client.profileEyebrow));
ok('i18n: muscleMap in 3 languages', !!(en.client.muscleMap && ru.client.muscleMap && he.client.muscleMap));
ok('build is c200', crm.indexOf('<meta name="dk-build" content="c200" />') >= 0);
ok('SW cache is v227', sw.indexOf("const CACHE_NAME = 'dk-gym-v227'") >= 0);
ok('running build label is c200', crm.indexOf('var RUNNING = 200') >= 0);
ok('login/sidebar show c200', crm.indexOf('3 languages · c200') >= 0 && crm.indexOf('id="v2-side-version">c200') >= 0);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
