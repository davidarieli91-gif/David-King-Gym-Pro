// DK Gym — Cleanup4: form compatibility + finish generator removal
const fs = require('fs');
let html = fs.readFileSync('fitness-crm.html', 'utf8');
const report = [];
const log = (m) => { console.log('[CLEANUP4]', m); report.push(m); };

// 1. Hidden compatibility fields inside client form
const formAnchor = 'id="client-form"';
const idx = html.indexOf(formAnchor);
if (idx === -1) { log('NOT FOUND: client-form anchor'); }
else {
  const gt = html.indexOf('>', idx);
  const inject = '>\n' +
    '        <!-- Hidden compatibility fields (UI cleaned in Phase 4) -->\n' +
    '        <input type="hidden" name="full_name" />\n' +
    '        <input type="hidden" name="goal" value="hypertrophy" />\n' +
    '        <input type="hidden" name="split" value="ppl" />\n' +
    '        <input type="hidden" name="frequency" value="3" />\n' +
    '        <input type="hidden" name="fitness_level" value="beginner" />\n' +
    '        <span id="freq-display" class="hidden">3</span>';
  html = html.slice(0, gt) + inject + html.slice(gt + 1);
  log('INJECTED hidden compat fields into client-form');
}

// 2. Delegated First/Last -> hidden full_name sync
const syncScript = '\n<script>\n// Phase 4: keep hidden full_name in sync with First/Last inputs\ndocument.addEventListener(\'input\', function (e) {\n  var tg = e.target;\n  if (tg && (tg.name === \'first_name\' || tg.name === \'last_name\')) {\n    var f = tg.form;\n    if (f && f.elements.full_name) {\n      var fn = (f.elements.first_name && f.elements.first_name.value) || \'\';\n      var ln = (f.elements.last_name && f.elements.last_name.value) || \'\';\n      f.elements.full_name.value = (fn + \' \' + ln).replace(/\\s+/g, \' \').trim();\n    }\n  }\n});\n</script>\n';
if (html.includes('keep hidden full_name in sync')) { log('SKIP sync script (already present)'); }
else {
  const bodyEnd = html.lastIndexOf('</body>');
  if (bodyEnd === -1) { log('NOT FOUND: </body>'); }
  else { html = html.slice(0, bodyEnd) + syncScript + html.slice(bodyEnd); log('INJECTED name sync script'); }
}

// 3. openEdit: fill hidden full_name when opening existing client
const oldEditTail = "        if (form.elements.last_name) form.elements.last_name.value = parts.join(' ') || '';\n      }";
if (html.includes(oldEditTail)) {
  html = html.replace(oldEditTail, oldEditTail + "\n      if (form.elements.full_name) form.elements.full_name.value = c.full_name || c.name || '';");
  log('PATCHED openEdit full_name sync');
} else { log('NOT FOUND: openEdit tail'); }

// 4. Remove generator entry buttons by visible label
function removeButtonByLabel(label) {
  const marker = '>' + label + '</span>';
  const mi = html.indexOf(marker);
  if (mi === -1) { log('NOT FOUND button label: ' + label); return; }
  const bs = html.lastIndexOf('<button', mi);
  const be = html.indexOf('</button>', mi);
  if (bs === -1 || be === -1 || (mi - bs) > 2000) { log('BAD BOUNDS button: ' + label); return; }
  html = html.slice(0, bs) + html.slice(be + '</button>'.length);
  log('REMOVED button: ' + label);
}
removeButtonByLabel('Generate program');
removeButtonByLabel('Generate plan');

// 5. Depth-matched div removals (AI panel + generator modal)
function removeDivFrom(anchor) {
  const ai = html.indexOf(anchor);
  if (ai === -1) { log('NOT FOUND anchor: ' + anchor); return; }
  const di = html.indexOf('<div', ai);
  if (di === -1 || di - ai > 500) { log('NOT FOUND div after anchor: ' + anchor); return; }
  let i = di, depth = 0;
  while (i < html.length) {
    const no = html.indexOf('<div', i);
    const nc = html.indexOf('</div>', i);
    if (nc === -1) break;
    if (no !== -1 && no < nc) { depth++; i = no + 4; }
    else { depth--; i = nc + 6; if (depth === 0) { html = html.slice(0, di) + html.slice(nc + 6); log('REMOVED div block: ' + anchor); return; } }
  }
  log('UNBALANCED div for: ' + anchor);
}
removeDivFrom('<!-- AI Configuration (collapsible) -->');
removeDivFrom('<div id="generator-modal"');

fs.writeFileSync('fitness-crm.html', html);
fs.mkdirSync('reports', { recursive: true });
fs.writeFileSync('reports/cleanup4-report.md', '# Cleanup4 Report\n\n**Generated:** ' + new Date().toISOString() + '\n\n' + report.map(r => '- ' + r).join('\n') + '\n');
console.log('=== CLEANUP4 COMPLETE ===');
