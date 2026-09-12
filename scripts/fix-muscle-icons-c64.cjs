#!/usr/bin/env node
/* c64: muscle-icons overhaul — audit & fix of group/subgroup anatomy icons */
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
  '<meta name="dk-build" content="c63"',
  '<meta name="dk-build" content="c64"');
rep('fitness-crm.html', 'RUNNING',
  'var RUNNING = 63',
  'var RUNNING = 64');
rep('fitness-crm.html', 'footer',
  '3 languages · c63',
  '3 languages · c64');
rep('sw.js', 'cache name',
  "const CACHE_NAME = 'dk-gym-v90'; // v90: c63 live language refresh for open dynamic modals (day preview, exercise card, builder)",
  "const CACHE_NAME = 'dk-gym-v91'; // v91: c64 muscle-icons audit fix (back/chest/abs/arms/legs set)");
console.log('ALL-OK');
