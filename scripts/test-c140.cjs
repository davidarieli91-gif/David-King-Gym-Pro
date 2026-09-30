/* c140 unit test — superset LINK model (extracted from the real portal) +
   static checks on the trainer rewiring. */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'client.html'), 'utf8');
const trainer = fs.readFileSync(path.join(root, 'fitness-crm.html'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
let pass = 0, fail = 0;
function ok(name, cond) { if (cond) { pass++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name); } }
function eq(name, got, want) { const g = JSON.stringify(got), w = JSON.stringify(want); if (g === w) { pass++; console.log('PASS ' + name + ' = ' + g); } else { fail++; console.log('FAIL ' + name + ' got ' + g + ' want ' + w); } }
function count(s, needle) { return s.split(needle).length - 1; }

/* --- extract helper functions from client.html --- */
function extractFn(src, name) {
  const start = src.indexOf('function ' + name + '(');
  if (start < 0) throw new Error('function not found: ' + name);
  let depth = 0, i = src.indexOf('{', start);
  let inStr = null, inLine = false, inBlock = false, esc = false;
  for (; i < src.length; i++) {
    const c = src[i], n = src[i + 1];
    if (inLine) { if (c === '\n') inLine = false; continue; }
    if (inBlock) { if (c === '*' && n === '/') { inBlock = false; i++; } continue; }
    if (inStr) { if (esc) { esc = false; continue; } if (c === '\\') { esc = true; continue; } if (c === inStr) inStr = null; continue; }
    if (c === '/' && n === '/') { inLine = true; i++; continue; }
    if (c === '/' && n === '*') { inBlock = true; i++; continue; }
    if (c === '"' || c === "'" || c === '`') { inStr = c; continue; }
    if (c === '{') depth++;
    else if (c === '}') { depth--; if (!depth) return src.slice(start, i + 1); }
  }
  throw new Error('unbalanced: ' + name);
}
const palette = html.match(/const PS_SS_COLORS = \[[^\]]*\];/)[0];
const src = palette + '\n' + ['psNormalizeLinks', 'psSupChains', 'psSupGroup', 'psSSStyle', 'psSSColor'].map(n => extractFn(html, n)).join('\n');
new Function(src + '\n;globalThis.__PS = { psNormalizeLinks, psSupChains, psSupGroup, psSSStyle, psSSColor };')();
const PS = globalThis.__PS;

/* ---------- 1. legacy migration: a flag run becomes a link chain ---------- */
{
  const exs = [{ is_superset: true }, { is_superset: true }, { is_superset: true }, {}];
  PS.psNormalizeLinks(exs);
  eq('legacy run → links', exs.map(e => e.ss_link === true), [true, true, false, false]);
  eq('legacy run → one chain 0..2', [...PS.psSupChains(exs).keys()], [0, 1, 2]);
}

/* ---------- 2. two independent pairs stay TWO groups ---------- */
{
  const exs = [{ ss_link: true }, {}, { ss_link: true }, {}];
  const chains = PS.psSupChains(exs);
  eq('two pairs → chains on [0,1] and [2,3]', [...chains.keys()], [0, 1, 2, 3]);
  eq('two pairs → different group indexes', [chains.get(0).gi, chains.get(1).gi, chains.get(2).gi, chains.get(3).gi], [0, 0, 1, 1]);
  eq('psSupGroup(1) sees only its own pair', PS.psSupGroup(exs, 1), [0]);
  eq('psSupGroup(2) sees only its own pair', PS.psSupGroup(exs, 2), [3]);
}

/* ---------- 3. triple + pair ---------- */
{
  const exs = [{ ss_link: true }, { ss_link: true }, {}, { ss_link: true }, {}];
  const chains = PS.psSupChains(exs);
  eq('triple is one chain', [chains.get(0).a, chains.get(0).b, chains.get(2).b], [0, 2, 2]);
  eq('pair is the second group', [chains.get(3).gi, chains.get(4).gi], [1, 1]);
  eq('triple sync partners', PS.psSupGroup(exs, 1), [0, 2]);
}

/* ---------- 4. normalization rebuilds the legacy fields ---------- */
{
  const exs = [{ ss_link: true }, {}, {}];
  PS.psNormalizeLinks(exs);
  eq('members flagged', exs.map(e => e.is_superset === true), [true, true, false]);
  eq('partner fields normalized to strings', [typeof exs[0].superset_partner, typeof exs[1].superset_partner], ['string', 'string']);
  const dangling = [{ ss_link: true }];
  PS.psNormalizeLinks(dangling);
  eq('dangling link on the last exercise dropped', dangling[0].ss_link, undefined);
}

/* ---------- 5. colors ---------- */
ok('groups get different colors', PS.psSSColor(0) !== PS.psSSColor(1));
ok('style carries the palette color', PS.psSSStyle(1).indexOf(PS.psSSColor(1)) >= 0);
ok('palette has 6 colors', /const PS_SS_COLORS = \[[^\]]*\]/.test(palette) && (palette.match(/#/g) || []).length === 6);

/* ---------- 6. trainer rewiring (static) ---------- */
ok('trainer link model helpers exist', trainer.indexOf('window.dkNormalizeSupersets') >= 0 && trainer.indexOf('window.dkSupersetChains') >= 0 && trainer.indexOf('window.dkSSStyle') >= 0);
ok('trainer toggle uses link semantics', trainer.indexOf('delete ex.ss_link; /* split the chain after this exercise */') >= 0 && trainer.indexOf('delete prev.ss_link; /* the pair turns off from both sides */') >= 0 && trainer.indexOf('ex.ss_link = true; /* groups merge naturally when next leads a chain */') >= 0);
ok('live toggle link semantics', trainer.indexOf('delete ex.ss_link; /* split the chain after this exercise */') >= 0 && trainer.indexOf('lwEqualizeSupersets(exs); /* partners must share the set count for the ✓-sync */') >= 0);
ok('ss_link copied through every mapping', count(trainer, 'ss_link: ex.ss_link') >= 5 && count(trainer, 'ss_link: lx.ss_link') >= 1);
ok('reorder/auto-arrange/cross-day moves clear links', count(trainer, 'delete ex.ss_link;') >= 3);
ok('save-compare includes ss_link', trainer.indexOf("|| (o.ss_link === true) !== (lx.ss_link === true); /* c140") >= 0);
ok('trainer cards colored by chain (builder + live)', trainer.indexOf('window.dkSSStyle(c.gi)') >= 0 && trainer.indexOf('window.dkSSStyle(_liveChain.gi)') >= 0);
ok('no amber-only card class left in the trainer cards', trainer.indexOf("${ex.is_superset ? 'dk-superset-hl' : ''}") === -1);
ok('portal session copies ss_link', html.indexOf('ss_link: ex.ss_link === true, /* c140') >= 0);
ok('portal cards colored + ⚡ tinted by chain', html.indexOf('style="${psSSStyle(_ssChain.gi)}"') >= 0 && html.indexOf('psSSColor(_ssChain.gi)') >= 0);
ok('portal legacy migration auto-runs on chains query', html.indexOf('const chain = psSupChains(exs).get(idx);') >= 0);

/* ---------- 7. versions ---------- */
ok('sw cache at least v167', (function () { const m = sw.match(/CACHE_NAME = 'dk-gym-v(\d+)'/); return !!m && Number(m[1]) >= 167; })());
ok('RUNNING / dk-build at least c140', (function () {
  const r = trainer.match(/var RUNNING = (\d+)/), b = trainer.match(/content="c(\d+)"/);
  return !!r && !!b && Number(r[1]) >= 140 && Number(b[1]) >= 140;
})());

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
