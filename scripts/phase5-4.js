// DK Gym — Phase 5.4: inject client progress report module
const fs = require('fs');
let html = fs.readFileSync('fitness-crm.html', 'utf8');
const code = fs.readFileSync('scripts/p54-runtime.js', 'utf8');
const report = [];
const MARK = 'Phase 5.4 progress report';
if (html.includes(MARK)) { report.push('SKIP: already injected'); }
else {
  const snippet = '\n<script>\n// ' + MARK + '\n' + code + '\n</script>\n';
  const bodyEnd = html.lastIndexOf('</body>');
  if (bodyEnd === -1) { report.push('NOT FOUND </body>'); }
  else { html = html.slice(0, bodyEnd) + snippet + html.slice(bodyEnd); report.push('INJECTED progress report module'); }
}
fs.writeFileSync('fitness-crm.html', html);
fs.mkdirSync('reports', { recursive: true });
fs.writeFileSync('reports/phase5-4-report.md', '# Phase 5.4 Report\n\n**Generated:** ' + new Date().toISOString() + '\n\n' + report.map(r => '- ' + r).join('\n') + '\n');
console.log('=== PHASE 5.4 COMPLETE ===');
console.log(report.join('\n'));
