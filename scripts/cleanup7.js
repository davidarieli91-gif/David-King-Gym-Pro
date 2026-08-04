// DK Gym — Cleanup7: final runtime cleanup + questionnaire safety net
const fs = require('fs');
let html = fs.readFileSync('fitness-crm.html', 'utf8');
const report = [];
const log = (m) => { console.log('[CLEANUP7]', m); report.push(m); };

const MARK = 'Phase 4 runtime cleanup v2';
if (html.includes(MARK)) { log('SKIP: already injected'); }
else {
  const L = [];
  L.push('<script>');
  L.push('// ' + MARK);
  L.push('(function () {');
  // --- 1) remove leftover auto-gen buttons + training params card ---
  L.push('  var GEN_TEXTS = ["Сгенерировать программу", "Generate program", "Generate a program", "Smart generate", "Auto-generate program"];');
  L.push('  var CARD_TEXTS = ["ПАРАМЕТРЫ ТРЕНИРОВОК", "TRAINING PARAMETERS", "TRAINING PARAMS"];');
  L.push('  function norm(s) { return (s || "").replace(/\\s+/g, " ").trim(); }');
  L.push('  function kill() {');
  L.push('    try {');
  L.push('      var btns = document.querySelectorAll("button");');
  L.push('      for (var i = 0; i < btns.length; i++) {');
  L.push('        if (GEN_TEXTS.indexOf(norm(btns[i].textContent)) !== -1 && btns[i].parentNode) btns[i].parentNode.removeChild(btns[i]);');
  L.push('      }');
  L.push('      var els = document.querySelectorAll("[data-i18n]");');
  L.push('      for (var j = 0; j < els.length; j++) {');
  L.push('        if (CARD_TEXTS.indexOf(norm(els[j].textContent).toUpperCase()) !== -1) {');
  L.push('          var card = els[j].closest(".rounded-2xl") || els[j].closest(".bg-surface");');
  L.push('          if (card && card.parentNode) card.parentNode.removeChild(card);');
  L.push('        }');
  L.push('      }');
  L.push('    } catch (e) {}');
  L.push('  }');
  L.push('  var pending = false;');
  L.push('  function schedule() { if (pending) return; pending = true; setTimeout(function () { pending = false; kill(); }, 60); }');
  L.push('  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", schedule); else schedule();');
  L.push('  new MutationObserver(schedule).observe(document.documentElement, { childList: true, subtree: true });');
  // --- 2) safety net: openQuestionnaire -> fallback to manual creator ---
  L.push('  try {');
  L.push('    if (typeof nutritionPlans !== "undefined" && nutritionPlans && typeof nutritionPlans.openQuestionnaire === "function") {');
  L.push('      var orig = nutritionPlans.openQuestionnaire;');
  L.push('      nutritionPlans.openQuestionnaire = function () {');
  L.push('        var args = arguments, self = this;');
  L.push('        function fb(e) {');
  L.push('          console.warn("[cleanup7] questionnaire unavailable -> manual creator", e);');
  L.push('          try { if (nutritionPlans.openCreator) nutritionPlans.openCreator(args[0]); } catch (e2) {}');
  L.push('          return Promise.resolve();');
  L.push('        }');
  L.push('        try {');
  L.push('          var r = orig.apply(self, args);');
  L.push('          if (r && typeof r.catch === "function") return r.catch(fb);');
  L.push('          return r;');
  L.push('        } catch (e) { return fb(e); }');
  L.push('      };');
  L.push('    }');
  L.push('  } catch (e) {}');
  // --- 3) RU/HE labels for First/Last name ---
  L.push('  try {');
  L.push('    I18N.ru.client.firstName = "Имя"; I18N.ru.client.lastName = "Фамилия";');
  L.push('    I18N.he.client.firstName = "שם פרטי"; I18N.he.client.lastName = "שם משפחה";');
  L.push('    if (typeof applyI18n === "function") applyI18n();');
  L.push('  } catch (e) {}');
  L.push('})();');
  L.push('</script>');
  L.push('');
  const snippet = L.join('\n');
  const bodyEnd = html.lastIndexOf('</body>');
  if (bodyEnd === -1) { log('NOT FOUND: </body>'); }
  else { html = html.slice(0, bodyEnd) + snippet + html.slice(bodyEnd); log('INJECTED runtime cleanup v2 + safety net'); }
}

fs.writeFileSync('fitness-crm.html', html);
fs.mkdirSync('reports', { recursive: true });
fs.writeFileSync('reports/cleanup7-report.md', '# Cleanup7 Report\n\n**Generated:** ' + new Date().toISOString() + '\n\n' + report.map(r => '- ' + r).join('\n') + '\n');
console.log('=== CLEANUP7 COMPLETE ===');
