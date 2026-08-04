// DK Gym — Great Cleanup Phase 4 Step 2 (UI surgery)
const fs = require('fs');

let html = fs.readFileSync('fitness-crm.html', 'utf8');
const report = [];
const log = (msg) => { console.log('[CLEANUP3]', msg); report.push(msg); };

// Helper: replace a unique substring. Fail safe if missing.
function replaceOnce(label, old, nw) {
  if (!html.includes(old)) {
    log('NOT FOUND (skipped): ' + label);
    return false;
  }
  html = html.replace(old, nw);
  log('REPLACED: ' + label);
  return true;
}

// Helper: replace all occurrences
function replaceAll(label, old, nw) {
  const count = html.split(old).length - 1;
  if (count === 0) { log('NOT FOUND (skipped): ' + label); return 0; }
  html = html.split(old).join(nw);
  log('REPLACED ALL (' + count + 'x): ' + label);
  return count;
}

// Helper: remove block between two markers (inclusive of markers)
function removeBlock(label, startMarker, endMarker) {
  const s = html.indexOf(startMarker);
  if (s === -1) { log('NOT FOUND start (skipped): ' + label); return false; }
  const e = html.indexOf(endMarker, s + startMarker.length);
  if (e === -1) { log('NOT FOUND end (skipped): ' + label); return false; }
  html = html.slice(0, s) + html.slice(e + endMarker.length);
  log('REMOVED BLOCK: ' + label);
  return true;
}

// ============================================================
// 1. УДАЛЯЕМ КНОПКИ AUTO + AI PRO из Program Builder (строки ~2110-2117)
// ============================================================
replaceOnce('Remove Auto button',
  `                <button id="pb-autogen" class="bg-primary/15 hover:bg-primary/25 text-primary-2 border border-primary/30 text-xs font-semibold px-3 py-1.5 rounded-lg transition inline-flex items-center gap-1.5 shrink-0" title="Auto-generate program">
                  <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                  <span data-i18n="programs.autoGenerate">Auto</span>
                </button>
                <button id="pb-llm-gen" class="bg-accent/15 hover:bg-accent/25 text-accent border border-accent/30 text-xs font-semibold px-3 py-1.5 rounded-lg transition inline-flex items-center gap-1.5 shrink-0" title="AI Pro generate">
                  <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 2a8 8 0 1 1-8 8 8 8 0 0 1 8-8z"/><path d="M12 6v6l4 2"/></svg>
                  <span data-i18n="programs.aiPro">AI Pro</span>
                </button>
`,
  '');

// ============================================================
// 2. УДАЛЯЕМ SUGGEST FOODS КНОПКУ из Micronutrient Analysis
// ============================================================
replaceOnce('Remove Suggest foods button',
  `          <button id="micro-suggest" class="flex-1 bg-accent/15 hover:bg-accent/25 text-accent border border-accent/30 text-sm font-semibold py-2.5 rounded-xl transition inline-flex items-center justify-center gap-2" data-i18n="nutrition.suggestFoods">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
            Suggest foods to fill gaps
          </button>
`,
  '');

// ============================================================
// 3. УДАЛЯЕМ ПАНЕЛЬ AI CONFIGURATION из Settings
// ============================================================
removeBlock('AI Configuration panel',
  `            <!-- AI Configuration (collapsible) -->`,
  `            <!-- AI Configuration REMOVED -->`);

// ============================================================
// 4. УДАЛЯЕМ МОДАЛКУ SMART PROGRAM GENERATOR
// ============================================================
removeBlock('Generator modal',
  `          <!-- ============= GENERATOR PREVIEW MODAL (Phase 5) ============= -->`,
  `          <!-- Generator modal REMOVED -->`);

// ============================================================
// 5. ЗАМЕНЯЕМ FULL NAME НА FIRST NAME + LAST NAME в форме клиента
// ============================================================
replaceOnce('Full name -> First + Last (form)',
  `              <div class="flex-1">
                <label class="block text-xs font-semibold mb-1" data-i18n="client.fullName">Full name</label>
                <input name="full_name" required class="w-full bg-surface-2 border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60" />
              </div>`,
  `              <div class="flex-1 grid grid-cols-2 gap-2">
                <div>
                  <label class="block text-xs font-semibold mb-1" data-i18n="client.firstName">First name</label>
                  <input name="first_name" required class="w-full bg-surface-2 border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60" />
                </div>
                <div>
                  <label class="block text-xs font-semibold mb-1" data-i18n="client.lastName">Last name</label>
                  <input name="last_name" class="w-full bg-surface-2 border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60" />
                </div>
              </div>`);

// ============================================================
// 6. УДАЛЯЕМ БЛОК TRAINING из формы клиента
// ============================================================
removeBlock('Training section (client form)',
  `          <!-- Section: Training -->`,
  `          <!-- Training section REMOVED -->`);

// Если маркера нет, удалим по legend'у
if (html.includes(`<legend class="text-[11px] uppercase tracking-wider text-muted font-semibold mb-1" data-i18n="workouts.title">Training</legend>`)) {
  // найдём fieldset, в котором этот legend
  const idx = html.indexOf(`<legend class="text-[11px] uppercase tracking-wider text-muted font-semibold mb-1" data-i18n="workouts.title">Training</legend>`);
  // идём назад до <fieldset
  let start = html.lastIndexOf('<fieldset', idx);
  // ищем закрывающий </fieldset> после idx
  let end = html.indexOf('</fieldset>', idx);
  if (start !== -1 && end !== -1) {
    html = html.slice(0, start) + html.slice(end + '</fieldset>'.length);
    log('REMOVED Training fieldset (by legend match)');
  }
}

// ============================================================
// 7. УДАЛЯЕМ БЛОК NUTRITION PROFILE из формы клиента
// ============================================================
if (html.includes(`<legend class="text-[11px] uppercase tracking-wider text-muted font-semibold mb-1" data-i18n="client.nutritionProfile">Nutrition Profile</legend>`)) {
  const idx = html.indexOf(`<legend class="text-[11px] uppercase tracking-wider text-muted font-semibold mb-1" data-i18n="client.nutritionProfile">Nutrition Profile</legend>`);
  let start = html.lastIndexOf('<fieldset', idx);
  let end = html.indexOf('</fieldset>', idx);
  if (start !== -1 && end !== -1) {
    html = html.slice(0, start) + html.slice(end + '</fieldset>'.length);
    log('REMOVED Nutrition Profile fieldset');
  }
}

// ============================================================
// 8. УДАЛЯЕМ JS-ПОДПИСКИ на Auto/AI Pro/Suggest buttons
// ============================================================
// pbAutoGen listener
removeBlock('pbAutoGen click listener',
  `    const pbAutoGen = document.getElementById('pb-autogen');`,
  `    // pbAutoGen listener REMOVED`);

removeBlock('pbLlmGen click listener',
  `    const pbLlmGen = document.getElementById('pb-llm-gen');`,
  `    // pbLlmGen listener REMOVED`);

removeBlock('microSuggest click listener',
  `    const microSuggest = document.getElementById('micro-suggest');`,
  `    // microSuggest listener REMOVED`);

// ============================================================
// 9. ОБНОВЛЯЕМ JS — openCreate/openEdit/openSave для first_name/last_name
// ============================================================

// В openCreate: сбросить first_name/last_name
replaceAll('openCreate: reset first_name/last_name',
  `form.elements.full_name.value = '';`,
  `if (form.elements.first_name) form.elements.first_name.value = '';
      if (form.elements.last_name) form.elements.last_name.value = '';`);

// В openEdit: загрузить first_name/last_name из full_name
replaceAll('openEdit: load full_name',
  `form.elements.full_name.value = c.full_name || c.name || '';`,
  `// Split full_name into first_name + last_name (backwards compatible)
      const fn = (c.first_name || '').trim();
      const ln = (c.last_name || '').trim();
      if (fn || ln) {
        if (form.elements.first_name) form.elements.first_name.value = fn;
        if (form.elements.last_name) form.elements.last_name.value = ln;
      } else {
        const parts = String(c.full_name || c.name || '').split(' ');
        if (form.elements.first_name) form.elements.first_name.value = parts.shift() || '';
        if (form.elements.last_name) form.elements.last_name.value = parts.join(' ') || '';
      }`);

// В openSave (handleSubmit): склеить first_name + last_name в full_name
// Ищем блок, где читаются поля формы перед сохранением. Добавим склейку.
// Безопасный патч: заменить любое чтение form.elements.full_name.value при сохранении
// Сделаем через inject: перед "const data = {" или "const payload = {" — вставим склейку
// Вместо этого — патчим имя формы напрямую:
const savePatch = `
    // Build full_name from first_name + last_name (backwards compatible)
    const _fn = (form.elements.first_name && form.elements.first_name.value) || '';
    const _ln = (form.elements.last_name && form.elements.last_name.value) || '';
    form.elements.full_name && (form.elements.full_name.value = (_fn + ' ' + _ln).trim() || _fn);
`;
// Вставляем этот патч сразу после form.reset или form.elements.id.value
// Простой подход: вставить перед любой строкой "const data = {" в client save function
// Найдем handleSubmit / save в clients IIFE
replaceAll('Inject first/last -> full_name patch in client save',
  `const data = {
      id: form.elements.id.value || db.uuid(),`,
  savePatch + `
    const data = {
      id: form.elements.id.value || db.uuid(),
      first_name: _fn,
      last_name: _ln,`);

// ============================================================
// 10. ОБНОВЛЯЕМ i18n — добавляем firstName/lastName
// ============================================================
replaceAll('Add firstName/lastName to EN i18n',
  `        fullName: 'Full name',`,
  `        fullName: 'Full name',
        firstName: 'First name',
        lastName: 'Last name',`);

// ============================================================
// 11. УБИРАЕМ авто-fallback на autoGenerateProgram в llmGenerateProgram
// ============================================================
replaceAll('Remove auto-fallback in llmGenerateProgram',
  `            if (confirm(t('programs.aiFallbackToAuto') || 'Fall back to Auto rule-based generation?')) {
              autoGenerateProgram(clientId);
            }`,
  `            // Auto-fallback disabled (Auto generator removed)`);

// ============================================================
// 12. СОХРАНЯЕМ
// ============================================================
fs.writeFileSync('fitness-crm.html', html);

fs.mkdirSync('reports', { recursive: true });
fs.writeFileSync('reports/cleanup3-report.md',
  '# Cleanup3 Report (Phase 4 Step 2)\n\n**Generated:** ' + new Date().toISOString() + '\n\n' +
  report.map(r => '- ' + r).join('\n') + '\n');

console.log('=== CLEANUP3 COMPLETE ===');
console.log('Total operations:', report.length);
console.log('Applied:', report.filter(r => !r.startsWith('NOT FOUND')).length);
console.log('Skipped:', report.filter(r => r.startsWith('NOT FOUND')).length);
