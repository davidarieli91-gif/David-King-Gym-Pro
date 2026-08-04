// DK Gym — Cleanup6: runtime removal of leftover auto-gen UI
const fs = require('fs');
let html = fs.readFileSync('fitness-crm.html', 'utf8');
const report = [];
const log = (m) => { console.log('[CLEANUP6]', m); report.push(m); };

const MARK = 'Phase 4 final runtime cleanup';
if (html.includes(MARK)) { log('SKIP: already injected'); }
else {
  const snippet = [
    '<script>',
    '// ' + MARK,
    '(function () {',
    '  var REMOVE_TRAINING_CARD = true;',
    '  var GEN_TEXTS = ["Сгенерировать программу", "Generate program", "Generate a program", "Smart generate", "Auto-generate program"];',
    '  var CARD_TEXTS = ["ПАРАМЕТРЫ ТРЕНИРОВОК", "TRAINING PARAMETERS", "TRAINING PARAMS"];',
    '  function norm(s) { return (s || "").replace(/\\s+/g, " ").trim(); }',
    '  function kill() {',
    '    try {',
    '      var btns = document.querySelectorAll("button");',
    '      for (var i = 0; i < btns.length; i++) {',
    '        if (GEN_TEXTS.indexOf(norm(btns[i].textContent)) !== -1 && btns[i].parentNode) btns[i].parentNode.removeChild(btns[i]);',
    '      }',
    '      if (REMOVE_TRAINING_CARD) {',
    '        var els = document.querySelectorAll("[data-i18n]");',
    '        for (var j = 0; j < els.length; j++) {',
    '          if (CARD_TEXTS.indexOf(norm(els[j].textContent).toUpperCase()) !== -1) {',
    '            var card = els[j].closest(".rounded-2xl") || els[j].closest(".bg-surface");',
    '            if (card && card.parentNode) card.parentNode.removeChild(card);',
    '          }',
    '        }',
    '      }',
    '    } catch (e) {}',
    '  }',
    '  var pending = false;',
    '  function schedule() { if (pending) return; pending = true; setTimeout(function () { pending = false; kill(); }, 60); }',
    '  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", schedule); else schedule();',
    '  new MutationObserver(schedule).observe(document.documentElement, { childList: true, subtree: true });',
    '})();',
    '</script>',
    ''
  ].join('\n');
  const bodyEnd = html.lastIndexOf('</body>');
  if (bodyEnd === -1) { log('NOT FOUND: </body>'); }
  else { html = html.slice(0, bodyEnd) + snippet + html.slice(bodyEnd); log('INJECTED runtime cleanup script'); }
}

fs.writeFileSync('fitness-crm.html', html);
fs.mkdirSync('reports', { recursive: true });
fs.writeFileSync('reports/cleanup6-report.md', '# Cleanup6 Report\n\n**Generated:** ' + new Date().toISOString() + '\n\n' + report.map(r => '- ' + r).join('\n') + '\n');
console.log('=== CLEANUP6 COMPLETE ===');
