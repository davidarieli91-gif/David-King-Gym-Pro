/* One-shot codegen for src/muscle-core.js: embeds the c185 taxonomy fixes so
   the client portal can correct OLD share payloads/history snapshots that were
   created before the exercise DB was fixed. Re-running is a no-op. */
const fs = require('fs');
const { GROUPS, SUBGROUPS, FIXES } = require('./taxonomy-fixes-c185.cjs');

const file = 'src/muscle-core.js';
let core = fs.readFileSync(file, 'utf8');

const q = v => JSON.stringify(v);
const entries = FIXES.map(f => {
  const g = GROUPS[f.group], s = SUBGROUPS[f.sub];
  return `  ${q(f.id)}: { group: ${q(g.g)}, groupEn: ${q(g.gE)}, groupRu: ${q(g.gR)}, groupHe: ${q(g.gH)}, ` +
    `subgroup: ${q(s.s)}, subgroupEn: ${q(s.sE)}, subgroupRu: ${q(s.sR)}, subgroupHe: ${q(s.sH)}, ` +
    `synergists: ${JSON.stringify(f.syn)} }`;
}).join(',\n');

const block = `  /* c185 taxonomy overrides */
  /* The exercise DB is corrected at the source + migrated into exercise_base.
     This map lets the portal correct OLD share snapshots and history records
     by exercise id, without waiting for a re-share. Keep in sync with
     scripts/taxonomy-fixes-c185.cjs (verified by test-c185-taxonomy.cjs). */
  var TAXONOMY_FIXES = {
${entries}
  };
  function taxonomyFix(id) {
    return TAXONOMY_FIXES[String(id == null ? '' : id)] || null;
  }

`;
const start = core.indexOf('  /* c185 taxonomy overrides */');
const apiAt = core.indexOf('  var api = {', start >= 0 ? start : 0);
if (start >= 0 && apiAt > start) {
  core = core.slice(0, start) + block + core.slice(apiAt);
} else {
  core = core.replace('  var api = {', block + '  var api = {');
}
if (!core.includes('    taxonomyFix: taxonomyFix,')) {
  core = core.replace('    clamp: clamp,', '    clamp: clamp,\n    taxonomyFix: taxonomyFix,');
}
fs.writeFileSync(file, core);
console.log('embedded', FIXES.length, 'taxonomy fixes in', file);
