const fs = require('fs');
const s = fs.readFileSync('fitness-crm.html', 'utf8');
const pats = [
  '+${day.exercises.length - 4}',
  'slice(0, 4).map(ex =>',
  'no-scrollbar',
  'scrollbar-width',
  'overflow-x-auto'
];
pats.forEach(k => {
  let i = s.indexOf(k), pos = [];
  while (i !== -1) { pos.push(i); i = s.indexOf(k, i + 1); }
  console.log(JSON.stringify(k.slice(0, 40)), '→ count:', pos.length, pos.length < 25 ? pos.join(', ') : '');
});
// noDay ru value
let i = s.indexOf('noDay');
let c = 0;
while (i !== -1 && c < 8) {
  const ctx = s.slice(Math.max(0, i - 10), i + 200);
  if (/ru\s*:/.test(ctx)) { console.log('noDay ctx:', JSON.stringify(ctx).slice(0, 320)); c++; }
  i = s.indexOf('noDay', i + 1);
}
// common.open dict
let j = s.indexOf("'common.open'");
while (j !== -1 && j < s.length) {
  console.log('common.open ref at', j, ':', JSON.stringify(s.slice(j - 60, j + 80)));
  j = s.indexOf("'common.open'", j + 1);
}
