#!/usr/bin/env node
/* c65: muscle-icons round 2 — user-reviewed fixes
 * back-trapezius (was whole back), triceps (was lower back), legs-adductors
 * (was quad-head blobs), legs-abductors (was hip flexors), back-middle-back
 * (now mid trap + rhomboids + teres major + upper lats band)
 */
const fs = require('fs');
const path = require('path');
const ROOT = '/home/z/David-King-Gym-Pro';

function rep(file, name, from, to) {
  const p = path.join(ROOT, file);
  let s = fs.readFileSync(p, 'utf8');
  const n = s.split(from).length - 1;
  if (n === 0) { console.error(`FAIL:notfound ${name} in ${file}`); process.exit(1); }
  if (n > 1) { console.error(`FAIL:ambiguous(${n}) ${name} in ${file}`); process.exit(1); }
  s = s.replace(from, to);
  fs.writeFileSync(p, s);
  console.log(`OK ${name}`);
}

rep('fitness-crm.html', 'meta dk-build',
  '<meta name="dk-build" content="c64"',
  '<meta name="dk-build" content="c65"');
rep('fitness-crm.html', 'RUNNING',
  'var RUNNING = 64',
  'var RUNNING = 65');
rep('fitness-crm.html', 'footer',
  '3 languages · c64',
  '3 languages · c65');
rep('sw.js', 'cache name',
  "const CACHE_NAME = 'dk-gym-v91'; // v91: c64 muscle-icons audit fix (back/chest/abs/arms/legs set)",
  "const CACHE_NAME = 'dk-gym-v92'; // v92: c65 muscle-icons round 2 (trapezius/triceps/adductors/abductors/middle-back)");
console.log('ALL-OK');
