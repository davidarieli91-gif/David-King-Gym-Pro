// DK Gym — Cleanup5: remove auto-generation buttons from profile cards
const fs = require('fs');
let html = fs.readFileSync('fitness-crm.html', 'utf8');
const report = [];
const log = (m) => { console.log('[CLEANUP5]', m); report.push(m); };

function removeAllButtonsContaining(label) {
  let removed = 0;
  let searchFrom = 0;
  while (true) {
    const mi = html.indexOf(label, searchFrom);
    if (mi === -1) break;
    const bs = html.lastIndexOf('<button', mi);
    const be = html.indexOf('</button>', mi);
    const okBounds = bs !== -1 && be !== -1 && be > mi &&
                     (mi - bs) < 1500 && (be - mi) < 1500;
    const okNoNest = okBounds && !html.slice(bs, mi).includes('</button>');
    if (okBounds && okNoNest) {
      html = html.slice(0, bs) + html.slice(be + '</button>'.length);
      removed++;
      searchFrom = bs;
      continue;
    }
    searchFrom = mi + label.length;
  }
  if (removed) log('REMOVED ' + removed + ' button(s): ' + label);
  else log('NOT FOUND button: ' + label);
}

['Generate program', 'Generate plan', 'Generate nutrition plan'].forEach(removeAllButtonsContaining);

fs.writeFileSync('fitness-crm.html', html);
fs.mkdirSync('reports', { recursive: true });
fs.writeFileSync('reports/cleanup5-report.md', '# Cleanup5 Report\n\n**Generated:** ' + new Date().toISOString() + '\n\n' + report.map(r => '- ' + r).join('\n') + '\n');
console.log('=== CLEANUP5 COMPLETE ===');
