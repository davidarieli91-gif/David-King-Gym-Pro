/* c207 test — routing regression: Settings, Analytics and Tools must be direct
   siblings of the other [data-screen] mounts, not nested inside the hidden
   Nutrition screen. Also guards the c207 build/cache bump. */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const crm = fs.readFileSync(path.join(root, 'fitness-crm.html'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
let pass = 0, fail = 0;
function ok(name, cond) { if (cond) { pass++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name); } }

/* Count div depth at the Tools screen opening. It must be 0: the Nutrition
   screen and all its modals have to be closed before Tools begins. */
function depthAt(src, needle) {
  const start = src.indexOf('<div data-screen="nutrition"');
  const end = src.indexOf(needle);
  if (start < 0 || end < 0 || end < start) return null;
  const seg = src.slice(start, end);
  let i = 0, depth = 0;
  while (i < seg.length) {
    if (seg.startsWith('<!--', i)) {
      const e = seg.indexOf('-->', i + 4);
      i = e < 0 ? seg.length : e + 3;
      continue;
    }
    if (/^<script\b/i.test(seg.slice(i, i + 8))) {
      const e = seg.toLowerCase().indexOf('</script>', i);
      i = e < 0 ? seg.length : e + 9;
      continue;
    }
    if (/^<style\b/i.test(seg.slice(i, i + 7))) {
      const e = seg.toLowerCase().indexOf('</style>', i);
      i = e < 0 ? seg.length : e + 8;
      continue;
    }
    if (seg.startsWith('<div', i) && /[\s>]/i.test(seg[i + 4] || '')) { depth++; i += 4; continue; }
    if (seg.startsWith('</div>', i)) { depth--; i += 6; continue; }
    i++;
  }
  return depth;
}

const toolsDepth = depthAt(crm, '<div data-screen="tools"');
ok('nutrition screen closes before Tools', toolsDepth === 0);
ok('Tools/analytics/settings mounts exist', ['tools', 'analytics', 'settings'].every(n => crm.indexOf('<div data-screen="' + n + '"') >= 0));
ok('Settings keeps all its panels', ['settings.appearance', 'settings.branding', 'settings-lang-select', 'branding-save', 'trem-enable', 'cloud-btn-connect', 'ui-size-reset'].every(k => crm.indexOf(k) >= 0));
ok('Analytics screen keeps its mount', crm.indexOf('data-screen="analytics"') >= 0 && crm.indexOf('screens.analytics = (function') >= 0);
ok('Tools screen keeps its mount', crm.indexOf('data-screen="tools"') >= 0 && crm.indexOf('screens.tools = (function') >= 0);
ok('router still shows every [data-screen] mount', crm.indexOf("document.querySelectorAll('[data-screen]').forEach") >= 0);

/* A cheap DOM balance check for the whole document would be too noisy because
   of inline <script> templates; the nutrition→tools boundary is the one that
   regressed and is covered above. The browser smoke test checks the rest. */

ok('trainer build c210', crm.indexOf('<meta name="dk-build" content="c210" />') >= 0);
ok('trainer RUNNING 210', crm.indexOf('var RUNNING = 210;') >= 0);
ok('sidebar + login show c207', crm.indexOf('id="v2-side-version">c210') >= 0 && crm.indexOf('3 languages · c210') >= 0);
ok('SW cache v237', sw.indexOf("CACHE_NAME = 'dk-gym-v237'") >= 0);

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
