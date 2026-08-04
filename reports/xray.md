

========== MARKER: AI Pro ==========

----- occurrence 1 at line 2114 -----
2100:                       <option value="1" data-i18n="programs.monthsOne">1 month</option>
2101:                       <option value="2" data-i18n="programs.monthsFew" data-i18n-vars="2">2 months</option>
2102:                       <option value="3" selected data-i18n="programs.monthsFew" data-i18n-vars="3">3 months</option>
2103:                       <option value="4" data-i18n="programs.monthsMany" data-i18n-vars="4">4 months</option>
2104:                       <option value="5" data-i18n="programs.monthsMany" data-i18n-vars="5">5 months</option>
2105:                       <option value="6" data-i18n="programs.monthsMany" data-i18n-vars="6">6 months</option>
2106:                     </select>
2107:                     <span id="pb-freq-hint" class="text-[10px] text-muted"></span>
2108:                   </div>
2109:                 </div>
2110:                 <button id="pb-autogen" class="bg-primary/15 hover:bg-primary/25 text-primary-2 border border-primary/30 text-xs font-semibold px-3 py-1.5 rounded-lg transition inline-flex items-center gap-1.5 shrink-0" title="Auto-generate program">
2111:                   <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
2112:                   <span data-i18n="programs.autoGenerate">Auto</span>
2113:                 </button>
2114:                 <button id="pb-llm-gen" class="bg-accent/15 hover:bg-accent/25 text-accent border border-accent/30 text-xs font-semibold px-3 py-1.5 rounded-lg transition inline-flex items-center gap-1.5 shrink-0" title="AI Pro generate">
2115:                   <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 2a8 8 0 1 1-8 8 8 8 0 0 1 8-8z"/><path d="M12 6v6l4 2"/></svg>
2116:                   <span data-i18n="programs.aiPro">AI Pro</span>
2117:                 </button>
2118:                 <button id="pb-close" class="w-8 h-8 grid place-items-center rounded-lg hover:bg-surface-2 text-muted shrink-0">
2119:                   <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
2120:                 </button>
2121:               </div>
2122:               <!-- Day tabs -->
2123:               <div id="pb-day-tabs" class="flex gap-1 p-2 border-b border-border overflow-x-auto no-scrollbar shrink-0"></div>
2124:               <!-- Day content -->
2125:               <div id="pb-day-content" class="flex-1 overflow-y-auto p-4 space-y-2"></div>
2126:               <!-- Footer (Sprint 3 #4: grouped into 3 rows for better mobile UX) -->
2127:               <div class="p-3 border-t border-border flex flex-col gap-2 shrink-0">
2128:                 <!-- Row 1: Workout adjustments -->
2129:                 <div class="flex gap-2">

----- occurrence 2 at line 2116 -----
2102:                       <option value="3" selected data-i18n="programs.monthsFew" data-i18n-vars="3">3 months</option>
2103:                       <option value="4" data-i18n="programs.monthsMany" data-i18n-vars="4">4 months</option>
2104:                       <option value="5" data-i18n="programs.monthsMany" data-i18n-vars="5">5 months</option>
2105:                       <option value="6" data-i18n="programs.monthsMany" data-i18n-vars="6">6 months</option>
2106:                     </select>
2107:                     <span id="pb-freq-hint" class="text-[10px] text-muted"></span>
2108:                   </div>
2109:                 </div>
2110:                 <button id="pb-autogen" class="bg-primary/15 hover:bg-primary/25 text-primary-2 border border-primary/30 text-xs font-semibold px-3 py-1.5 rounded-lg transition inline-flex items-center gap-1.5 shrink-0" title="Auto-generate program">
2111:                   <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
2112:                   <span data-i18n="programs.autoGenerate">Auto</span>
2113:                 </button>
2114:                 <button id="pb-llm-gen" class="bg-accent/15 hover:bg-accent/25 text-accent border border-accent/30 text-xs font-semibold px-3 py-1.5 rounded-lg transition inline-flex items-center gap-1.5 shrink-0" title="AI Pro generate">
2115:                   <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 2a8 8 0 1 1-8 8 8 8 0 0 1 8-8z"/><path d="M12 6v6l4 2"/></svg>
2116:                   <span data-i18n="programs.aiPro">AI Pro</span>
2117:                 </button>
2118:                 <button id="pb-close" class="w-8 h-8 grid place-items-center rounded-lg hover:bg-surface-2 text-muted shrink-0">
2119:                   <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
2120:                 </button>
2121:               </div>
2122:               <!-- Day tabs -->
2123:               <div id="pb-day-tabs" class="flex gap-1 p-2 border-b border-border overflow-x-auto no-scrollbar shrink-0"></div>
2124:               <!-- Day content -->
2125:               <div id="pb-day-content" class="flex-1 overflow-y-auto p-4 space-y-2"></div>
2126:               <!-- Footer (Sprint 3 #4: grouped into 3 rows for better mobile UX) -->
2127:               <div class="p-3 border-t border-border flex flex-col gap-2 shrink-0">
2128:                 <!-- Row 1: Workout adjustments -->
2129:                 <div class="flex gap-2">
2130:                 <button id="pb-easier" class="flex-1 min-w-[70px] bg-success/15 hover:bg-success/25 text-success border border-success/30 text-xs font-semibold px-2 py-2 rounded-xl transition inline-flex items-center justify-center gap-1.5" title="${t('programs.makeEasierHint') || 'Reduce intensity'}">
2131:                   <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12l7 7 7-7"/></svg>

----- occurrence 3 at line 3085 -----
3071:               </div>
3072:               </div>
3073:             </div>
3074: 
3075:             <!-- AI Configuration (collapsible) -->
3076:             <div class="bg-surface border border-accent/30 rounded-2xl shadow-card mb-4 settings-panel collapsed">
3077:               <div class="settings-panel-header p-5 pb-3">
3078:                 <h3 class="font-display font-bold text-sm text-accent uppercase tracking-wider flex items-center gap-2 flex-1">
3079:                 <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 2a8 8 0 1 1-8 8 8 8 0 0 1 8-8z"/><path d="M12 6v6l4 2"/></svg>
3080:                 <span data-i18n="settings.aiConfig">AI Configuration</span>
3081:                 </h3>
3082:                 <svg class="w-4 h-4 text-muted settings-panel-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9l6 6 6-6"/></svg>
3083:               </div>
3084:               <div class="settings-panel-body p-5 pt-0">
3085:               <p class="text-xs text-muted mb-3 leading-relaxed" data-i18n="settings.aiConfigDesc">Configure an OpenAI-compatible API endpoint to enable AI Pro generators (workout + nutrition plans) in the browser. Without this, AI Pro falls back to Auto rule-based generation.</p>
3086:               <div class="space-y-3">
3087:                 <div>
3088:                   <label class="text-xs font-semibold text-muted block mb-1" data-i18n="settings.aiEndpoint">API endpoint URL</label>
3089:                   <input type="text" id="settings-ai-endpoint" placeholder="https://api.openai.com/v1/chat/completions" class="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-accent/50" />
3090:                   <p class="text-[10px] text-muted mt-1" data-i18n="settings.aiEndpointHint">OpenAI-compatible: OpenAI, Azure, GLM, OpenRouter, Ollama, LM Studio, etc.</p>
3091:                 </div>
3092:                 <div>
3093:                   <label class="text-xs font-semibold text-muted block mb-1" data-i18n="settings.aiKey">API key</label>
3094:                   <input type="password" id="settings-ai-key" placeholder="sk-..." class="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-accent/50" />
3095:                   <p class="text-[10px] text-muted mt-1" data-i18n="settings.aiKeyHint">Stored locally in your browser. Never sent anywhere except the endpoint above.</p>
3096:                 </div>
3097:                 <div>
3098:                   <label class="text-xs font-semibold text-muted block mb-1" data-i18n="settings.aiModel">Model name</label>
3099:                   <input type="text" id="settings-ai-model" placeholder="gpt-4o-mini" class="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-accent/50" />
3100:                   <p class="text-[10px] text-muted mt-1" data-i18n="settings.aiModelHint">Examples: gpt-4o-mini, glm-4.6, claude-3-haiku-20240307, llama3.1:8b</p>

----- occurrence 4 at line 3085 -----
3071:               </div>
3072:               </div>
3073:             </div>
3074: 
3075:             <!-- AI Configuration (collapsible) -->
3076:             <div class="bg-surface border border-accent/30 rounded-2xl shadow-card mb-4 settings-panel collapsed">
3077:               <div class="settings-panel-header p-5 pb-3">
3078:                 <h3 class="font-display font-bold text-sm text-accent uppercase tracking-wider flex items-center gap-2 flex-1">
3079:                 <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 2a8 8 0 1 1-8 8 8 8 0 0 1 8-8z"/><path d="M12 6v6l4 2"/></svg>
3080:                 <span data-i18n="settings.aiConfig">AI Configuration</span>
3081:                 </h3>
3082:                 <svg class="w-4 h-4 text-muted settings-panel-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9l6 6 6-6"/></svg>
3083:               </div>
3084:               <div class="settings-panel-body p-5 pt-0">
3085:               <p class="text-xs text-muted mb-3 leading-relaxed" data-i18n="settings.aiConfigDesc">Configure an OpenAI-compatible API endpoint to enable AI Pro generators (workout + nutrition plans) in the browser. Without this, AI Pro falls back to Auto rule-based generation.</p>
3086:               <div class="space-y-3">
3087:                 <div>
3088:                   <label class="text-xs font-semibold text-muted block mb-1" data-i18n="settings.aiEndpoint">API endpoint URL</label>
3089:                   <input type="text" id="settings-ai-endpoint" placeholder="https://api.openai.com/v1/chat/completions" class="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-accent/50" />
3090:                   <p class="text-[10px] text-muted mt-1" data-i18n="settings.aiEndpointHint">OpenAI-compatible: OpenAI, Azure, GLM, OpenRouter, Ollama, LM Studio, etc.</p>
3091:                 </div>
3092:                 <div>
3093:                   <label class="text-xs font-semibold text-muted block mb-1" data-i18n="settings.aiKey">API key</label>
3094:                   <input type="password" id="settings-ai-key" placeholder="sk-..." class="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-accent/50" />
3095:                   <p class="text-[10px] text-muted mt-1" data-i18n="settings.aiKeyHint">Stored locally in your browser. Never sent anywhere except the endpoint above.</p>
3096:                 </div>
3097:                 <div>
3098:                   <label class="text-xs font-semibold text-muted block mb-1" data-i18n="settings.aiModel">Model name</label>
3099:                   <input type="text" id="settings-ai-model" placeholder="gpt-4o-mini" class="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-accent/50" />
3100:                   <p class="text-[10px] text-muted mt-1" data-i18n="settings.aiModelHint">Examples: gpt-4o-mini, glm-4.6, claude-3-haiku-20240307, llama3.1:8b</p>


========== MARKER: llmGenerateProgram ==========

----- occurrence 1 at line 8080 -----
8066:       // Generate program name
8067:       // Bug fix (2026-08 QA #5): strip underscores from goal/level before building i18n key
8068:       const goalCamel = goal.split('_').map((p, i) => i === 0 ? p.charAt(0).toUpperCase() + p.slice(1) : p.charAt(0).toUpperCase() + p.slice(1)).join('');
8069:       const levelCamel = level.split('_').map((p, i) => i === 0 ? p.charAt(0).toUpperCase() + p.slice(1) : p.charAt(0).toUpperCase() + p.slice(1)).join('');
8070:       const goalLabel = t('client.goal' + goalCamel) || goal;
8071:       const levelLabel = t('client.level' + levelCamel) || level;
8072:       const programName = `${client.full_name || t('clients.defaultName') || 'Client'} — ${goalLabel} (${levelLabel})`;
8073:       document.getElementById('pb-name').value = programName;
8074: 
8075:       renderBuilder();
8076:       toast(t('programs.autoGenerated') || 'Program auto-generated! Review and adjust as needed.', 'success', 4000);
8077:     }
8078: 
8079:     /** AI Pro generate: uses LLM to create a professional program with reasoning */
8080:     async function llmGenerateProgram(clientId) {
8081:       const client = await db.get('clients', clientId);
8082:       if (!client) { toast(t('clients.notFoundToast'), 'danger'); return; }
8083: 
8084:       // Load exercise cache
8085:       let allExercises = [];
8086:       try { allExercises = await db.all('exercise_base'); } catch(e) {}
8087:       if (!allExercises || allExercises.length === 0) {
8088:         toast(t('exercise.loadFailed') || 'No exercises loaded', 'danger');
8089:         return;
8090:       }
8091: 
8092:       // Show loading state
8093:       const btn = document.getElementById('pb-llm-gen');
8094:       if (btn) {
8095:         btn.disabled = true;

----- occurrence 2 at line 8248 -----
8234:         _pb.splitType = pbSplit;
8235:         document.getElementById('pb-split').value = pbSplit;
8236:         document.getElementById('pb-name').value = program.name || `${client.full_name} — AI Program`;
8237: 
8238:         renderBuilder();
8239: 
8240:         // Show reasoning as toast
8241:         if (program.reasoning) {
8242:           toast(program.reasoning, 'success', 8000);
8243:         } else {
8244:           toast(t('programs.aiGenerated') || 'AI program generated!', 'success', 4000);
8245:         }
8246: 
8247:       } catch (e) {
8248:         console.error('[llmGenerateProgram] error:', e);
8249:         if (e.message === 'NO_AI_BACKEND') {
8250:           // No LLM backend available — offer to use Auto or configure AI
8251:           const msg = (t('programs.aiNoBackend') || 'AI Pro is not configured. Open Settings → AI Configuration to set up an API endpoint, or use Auto instead.');
8252:           toast(msg, 'warning', 6000);
8253:           // Auto-fall back to Auto generator after a short delay
8254:           setTimeout(() => {
8255:             if (confirm(t('programs.aiFallbackToAuto') || 'Fall back to Auto rule-based generation?')) {
8256:               autoGenerateProgram(clientId);
8257:             }
8258:           }, 800);
8259:         } else {
8260:           toast(t('programs.aiError') || 'AI generation failed. Try Auto instead.', 'danger', 4000);
8261:         }
8262:       } finally {
8263:         if (btn) {

----- occurrence 3 at line 10293 -----
10279:     function closeViewer() {
10280:       const modal = document.getElementById('viewer-modal');
10281:       const img = document.getElementById('viewer-img');
10282:       modal.classList.add('hidden');
10283:       img.src = '';
10284:     }
10285: 
10286:     // avatarGradient / initials / goalBadgeClass are now global (deduplication 2026-08 QA Sprint 2 #5).
10287:     // Previously these 3 helpers were defined identically in both dashboard and profile IIFEs
10288:     // ("shared with dashboard but defined locally to avoid coupling" — comment was a red flag).
10289:     // Now they live at the top-level scope alongside escapeHTML / setText.
10290: 
10291:     return { load, render, closeViewer, get clientId() { return _clientId; }, get _client() { return _client; },
10292:              openProgramCreator, openProgramEditor, createProgram, archiveProgram, deleteProgram, duplicateProgram, loadPrograms, startWorkoutFromProgram, openProgramDayPreview,
10293:              pbOpenExercisePicker, pbSave, rebuildDays, renderBuilder, autoGenerateProgram, llmGenerateProgram, pbMakeEasier, pbMakeHarder, pbAutoArrange, pbMoveExercise,
10294:              printProgram, printNutritionPlan, printOnForm, printPrivateGym, PG_LAYOUT, pgTargetRow, pgGetLayout, pgEsc, loadPrintSettings, savePrintSettings, FORM_DEFAULTS,
10295:              get _pb() { return _pb; } };
10296:   })();
10297: 
10298:   /* =====================================================================
10299:      STEPS 14-15 — ANALYTICS SCREEN
10300:      Per-client activity calendar (heatmap of active days) + key metrics:
10301:      active days, workouts completed, current streak, avg adherence.
10302:      Data sources:
10303:        • workout_history store (Phase 3 will populate it; for now we
10304:          derive "active day" from client.last_active + a synthetic log
10305:          based on client.frequency for demo purposes)
10306:        • nutrition_history store (Phase 4 will populate macro adherence)
10307:      Range toggle: Day / Week / Month controls how many days the calendar
10308:      renders and how metrics are aggregated.

----- occurrence 4 at line 20858 -----
20844:     if (pbAutoGen) pbAutoGen.addEventListener('click', () => {
20845:       if (screens.profile && screens.profile._pb && screens.profile._pb.clientId) {
20846:         if (screens.profile.autoGenerateProgram) {
20847:           screens.profile.autoGenerateProgram(screens.profile._pb.clientId);
20848:         } else {
20849:           toast('Auto-generate not available', 'warning');
20850:         }
20851:       } else {
20852:         toast(t('programs.selectClientFirst') || 'Select a client first', 'warning');
20853:       }
20854:     });
20855:     const pbLlmGen = document.getElementById('pb-llm-gen');
20856:     if (pbLlmGen) pbLlmGen.addEventListener('click', () => {
20857:       if (screens.profile && screens.profile._pb && screens.profile._pb.clientId) {
20858:         if (screens.profile.llmGenerateProgram) {
20859:           screens.profile.llmGenerateProgram(screens.profile._pb.clientId);
20860:         } else {
20861:           toast('AI Pro not available', 'warning');
20862:         }
20863:       } else {
20864:         toast(t('programs.selectClientFirst') || 'Select a client first', 'warning');
20865:       }
20866:     });
20867:     const pbSplit = document.getElementById('pb-split');
20868:     if (pbSplit) pbSplit.addEventListener('change', (e) => {
20869:       if (screens.profile) { screens.profile.rebuildDays(e.target.value); screens.profile.renderBuilder(); }
20870:     });
20871:     const pbAddEx = document.getElementById('pb-add-exercise');
20872:     if (pbAddEx) pbAddEx.addEventListener('click', () => {
20873:       if (screens.profile) screens.profile.pbOpenExercisePicker();


========== MARKER: autoGenerateProgram ==========

----- occurrence 1 at line 7911 -----
7897:       abc: [['chest','shoulders','triceps'],['back','elbow_flexors'],['legs','abdominals']],
7898:       abcd: [['chest','triceps'],['back','elbow_flexors'],['legs','abdominals'],['shoulders','triceps']],
7899:       abcde: [['chest'],['back'],['legs'],['shoulders'],['elbow_flexors','triceps','abdominals']],
7900:     };
7901: 
7902:     /** Equipment → allowed equipment types */
7903:     const EQUIPMENT_MAP = {
7904:       gym: ['barbell','dumbbells','cable','machine','ez_bar','kettlebells','medicine_ball','exercise_ball','bands','foam_roll','other'],
7905:       home: ['dumbbells','bands','other','bodyweight'],
7906:       bodyweight: ['bodyweight','other'],
7907:       bands: ['bands','bodyweight','other'],
7908:     };
7909: 
7910:     /** Main auto-generate function */
7911:     async function autoGenerateProgram(clientId) {
7912:       const client = await db.get('clients', clientId);
7913:       if (!client) { toast(t('clients.notFoundToast'), 'danger'); return; }
7914: 
7915:       // Load exercise cache
7916:       let allExercises = [];
7917:       try { allExercises = await db.all('exercise_base'); } catch(e) {}
7918:       if (!allExercises || allExercises.length === 0) {
7919:         toast(t('exercise.loadFailed') || 'No exercises loaded', 'danger');
7920:         return;
7921:       }
7922: 
7923:       const goal = client.goal || 'hypertrophy';
7924:       const level = client.fitness_level || 'beginner';
7925:       const splitType = client.split || 'ppl';
7926:       const freq = client.frequency || 3;

----- occurrence 2 at line 8256 -----
8242:           toast(program.reasoning, 'success', 8000);
8243:         } else {
8244:           toast(t('programs.aiGenerated') || 'AI program generated!', 'success', 4000);
8245:         }
8246: 
8247:       } catch (e) {
8248:         console.error('[llmGenerateProgram] error:', e);
8249:         if (e.message === 'NO_AI_BACKEND') {
8250:           // No LLM backend available — offer to use Auto or configure AI
8251:           const msg = (t('programs.aiNoBackend') || 'AI Pro is not configured. Open Settings → AI Configuration to set up an API endpoint, or use Auto instead.');
8252:           toast(msg, 'warning', 6000);
8253:           // Auto-fall back to Auto generator after a short delay
8254:           setTimeout(() => {
8255:             if (confirm(t('programs.aiFallbackToAuto') || 'Fall back to Auto rule-based generation?')) {
8256:               autoGenerateProgram(clientId);
8257:             }
8258:           }, 800);
8259:         } else {
8260:           toast(t('programs.aiError') || 'AI generation failed. Try Auto instead.', 'danger', 4000);
8261:         }
8262:       } finally {
8263:         if (btn) {
8264:           btn.disabled = false;
8265:           btn.innerHTML = `<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 2a8 8 0 1 1-8 8 8 8 0 0 1 8-8z"/><path d="M12 6v6l4 2"/></svg><span>${t('programs.aiPro') || 'AI Pro'}</span>`;
8266:         }
8267:       }
8268:     }
8269: 
8270:     /** Build a single exercise entry with sets/reps/rest based on goal+level */
8271:     function buildExerciseEntry(ex, scheme, adjust, isFirstExercise) {

----- occurrence 3 at line 10293 -----
10279:     function closeViewer() {
10280:       const modal = document.getElementById('viewer-modal');
10281:       const img = document.getElementById('viewer-img');
10282:       modal.classList.add('hidden');
10283:       img.src = '';
10284:     }
10285: 
10286:     // avatarGradient / initials / goalBadgeClass are now global (deduplication 2026-08 QA Sprint 2 #5).
10287:     // Previously these 3 helpers were defined identically in both dashboard and profile IIFEs
10288:     // ("shared with dashboard but defined locally to avoid coupling" — comment was a red flag).
10289:     // Now they live at the top-level scope alongside escapeHTML / setText.
10290: 
10291:     return { load, render, closeViewer, get clientId() { return _clientId; }, get _client() { return _client; },
10292:              openProgramCreator, openProgramEditor, createProgram, archiveProgram, deleteProgram, duplicateProgram, loadPrograms, startWorkoutFromProgram, openProgramDayPreview,
10293:              pbOpenExercisePicker, pbSave, rebuildDays, renderBuilder, autoGenerateProgram, llmGenerateProgram, pbMakeEasier, pbMakeHarder, pbAutoArrange, pbMoveExercise,
10294:              printProgram, printNutritionPlan, printOnForm, printPrivateGym, PG_LAYOUT, pgTargetRow, pgGetLayout, pgEsc, loadPrintSettings, savePrintSettings, FORM_DEFAULTS,
10295:              get _pb() { return _pb; } };
10296:   })();
10297: 
10298:   /* =====================================================================
10299:      STEPS 14-15 — ANALYTICS SCREEN
10300:      Per-client activity calendar (heatmap of active days) + key metrics:
10301:      active days, workouts completed, current streak, avg adherence.
10302:      Data sources:
10303:        • workout_history store (Phase 3 will populate it; for now we
10304:          derive "active day" from client.last_active + a synthetic log
10305:          based on client.frequency for demo purposes)
10306:        • nutrition_history store (Phase 4 will populate macro adherence)
10307:      Range toggle: Day / Week / Month controls how many days the calendar
10308:      renders and how metrics are aggregated.

----- occurrence 4 at line 20846 -----
20832:     }
20833: 
20834:     // Program builder: close (with confirmation), split change, add exercise, save
20835:     const pbClose = document.getElementById('pb-close');
20836:     if (pbClose) pbClose.addEventListener('click', () => {
20837:       const totalEx = (screens.profile && screens.profile._pb) ? screens.profile._pb.days.reduce((s, d) => s + (d.exercises || []).length, 0) : 0;
20838:       if (totalEx > 0) {
20839:         if (!confirm(t('programs.closeConfirm'))) return;
20840:       }
20841:       document.getElementById('program-builder-modal').classList.add('hidden');
20842:     });
20843:     const pbAutoGen = document.getElementById('pb-autogen');
20844:     if (pbAutoGen) pbAutoGen.addEventListener('click', () => {
20845:       if (screens.profile && screens.profile._pb && screens.profile._pb.clientId) {
20846:         if (screens.profile.autoGenerateProgram) {
20847:           screens.profile.autoGenerateProgram(screens.profile._pb.clientId);
20848:         } else {
20849:           toast('Auto-generate not available', 'warning');
20850:         }
20851:       } else {
20852:         toast(t('programs.selectClientFirst') || 'Select a client first', 'warning');
20853:       }
20854:     });
20855:     const pbLlmGen = document.getElementById('pb-llm-gen');
20856:     if (pbLlmGen) pbLlmGen.addEventListener('click', () => {
20857:       if (screens.profile && screens.profile._pb && screens.profile._pb.clientId) {
20858:         if (screens.profile.llmGenerateProgram) {
20859:           screens.profile.llmGenerateProgram(screens.profile._pb.clientId);
20860:         } else {
20861:           toast('AI Pro not available', 'warning');


========== MARKER: AI Configuration ==========

----- occurrence 1 at line 3075 -----
3061:                 <div class="flex flex-wrap gap-2">
3062:                   <button id="settings-btn-gdrive-save" class="bg-accent/15 hover:bg-accent/25 text-accent border border-accent/30 text-sm font-medium px-3.5 py-2 rounded-lg transition inline-flex items-center gap-1.5">
3063:                     <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
3064:                     <span data-i18n="settings.gdriveSave">Save to Google Drive</span>
3065:                   </button>
3066:                   <button id="settings-btn-gdrive-load" class="bg-surface-2 hover:bg-border/40 border border-border text-sm font-medium px-3.5 py-2 rounded-lg transition inline-flex items-center gap-1.5">
3067:                     <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
3068:                     <span data-i18n="settings.gdriveLoad">Restore from Google Drive</span>
3069:                   </button>
3070:                 </div>
3071:               </div>
3072:               </div>
3073:             </div>
3074: 
3075:             <!-- AI Configuration (collapsible) -->
3076:             <div class="bg-surface border border-accent/30 rounded-2xl shadow-card mb-4 settings-panel collapsed">
3077:               <div class="settings-panel-header p-5 pb-3">
3078:                 <h3 class="font-display font-bold text-sm text-accent uppercase tracking-wider flex items-center gap-2 flex-1">
3079:                 <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 2a8 8 0 1 1-8 8 8 8 0 0 1 8-8z"/><path d="M12 6v6l4 2"/></svg>
3080:                 <span data-i18n="settings.aiConfig">AI Configuration</span>
3081:                 </h3>
3082:                 <svg class="w-4 h-4 text-muted settings-panel-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9l6 6 6-6"/></svg>
3083:               </div>
3084:               <div class="settings-panel-body p-5 pt-0">
3085:               <p class="text-xs text-muted mb-3 leading-relaxed" data-i18n="settings.aiConfigDesc">Configure an OpenAI-compatible API endpoint to enable AI Pro generators (workout + nutrition plans) in the browser. Without this, AI Pro falls back to Auto rule-based generation.</p>
3086:               <div class="space-y-3">
3087:                 <div>
3088:                   <label class="text-xs font-semibold text-muted block mb-1" data-i18n="settings.aiEndpoint">API endpoint URL</label>
3089:                   <input type="text" id="settings-ai-endpoint" placeholder="https://api.openai.com/v1/chat/completions" class="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-accent/50" />
3090:                   <p class="text-[10px] text-muted mt-1" data-i18n="settings.aiEndpointHint">OpenAI-compatible: OpenAI, Azure, GLM, OpenRouter, Ollama, LM Studio, etc.</p>

----- occurrence 2 at line 3080 -----
3066:                   <button id="settings-btn-gdrive-load" class="bg-surface-2 hover:bg-border/40 border border-border text-sm font-medium px-3.5 py-2 rounded-lg transition inline-flex items-center gap-1.5">
3067:                     <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
3068:                     <span data-i18n="settings.gdriveLoad">Restore from Google Drive</span>
3069:                   </button>
3070:                 </div>
3071:               </div>
3072:               </div>
3073:             </div>
3074: 
3075:             <!-- AI Configuration (collapsible) -->
3076:             <div class="bg-surface border border-accent/30 rounded-2xl shadow-card mb-4 settings-panel collapsed">
3077:               <div class="settings-panel-header p-5 pb-3">
3078:                 <h3 class="font-display font-bold text-sm text-accent uppercase tracking-wider flex items-center gap-2 flex-1">
3079:                 <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 2a8 8 0 1 1-8 8 8 8 0 0 1 8-8z"/><path d="M12 6v6l4 2"/></svg>
3080:                 <span data-i18n="settings.aiConfig">AI Configuration</span>
3081:                 </h3>
3082:                 <svg class="w-4 h-4 text-muted settings-panel-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9l6 6 6-6"/></svg>
3083:               </div>
3084:               <div class="settings-panel-body p-5 pt-0">
3085:               <p class="text-xs text-muted mb-3 leading-relaxed" data-i18n="settings.aiConfigDesc">Configure an OpenAI-compatible API endpoint to enable AI Pro generators (workout + nutrition plans) in the browser. Without this, AI Pro falls back to Auto rule-based generation.</p>
3086:               <div class="space-y-3">
3087:                 <div>
3088:                   <label class="text-xs font-semibold text-muted block mb-1" data-i18n="settings.aiEndpoint">API endpoint URL</label>
3089:                   <input type="text" id="settings-ai-endpoint" placeholder="https://api.openai.com/v1/chat/completions" class="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-accent/50" />
3090:                   <p class="text-[10px] text-muted mt-1" data-i18n="settings.aiEndpointHint">OpenAI-compatible: OpenAI, Azure, GLM, OpenRouter, Ollama, LM Studio, etc.</p>
3091:                 </div>
3092:                 <div>
3093:                   <label class="text-xs font-semibold text-muted block mb-1" data-i18n="settings.aiKey">API key</label>
3094:                   <input type="password" id="settings-ai-key" placeholder="sk-..." class="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-accent/50" />
3095:                   <p class="text-[10px] text-muted mt-1" data-i18n="settings.aiKeyHint">Stored locally in your browser. Never sent anywhere except the endpoint above.</p>

----- occurrence 3 at line 8251 -----
8237: 
8238:         renderBuilder();
8239: 
8240:         // Show reasoning as toast
8241:         if (program.reasoning) {
8242:           toast(program.reasoning, 'success', 8000);
8243:         } else {
8244:           toast(t('programs.aiGenerated') || 'AI program generated!', 'success', 4000);
8245:         }
8246: 
8247:       } catch (e) {
8248:         console.error('[llmGenerateProgram] error:', e);
8249:         if (e.message === 'NO_AI_BACKEND') {
8250:           // No LLM backend available — offer to use Auto or configure AI
8251:           const msg = (t('programs.aiNoBackend') || 'AI Pro is not configured. Open Settings → AI Configuration to set up an API endpoint, or use Auto instead.');
8252:           toast(msg, 'warning', 6000);
8253:           // Auto-fall back to Auto generator after a short delay
8254:           setTimeout(() => {
8255:             if (confirm(t('programs.aiFallbackToAuto') || 'Fall back to Auto rule-based generation?')) {
8256:               autoGenerateProgram(clientId);
8257:             }
8258:           }, 800);
8259:         } else {
8260:           toast(t('programs.aiError') || 'AI generation failed. Try Auto instead.', 'danger', 4000);
8261:         }
8262:       } finally {
8263:         if (btn) {
8264:           btn.disabled = false;
8265:           btn.innerHTML = `<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 2a8 8 0 1 1-8 8 8 8 0 0 1 8-8z"/><path d="M12 6v6l4 2"/></svg><span>${t('programs.aiPro') || 'AI Pro'}</span>`;
8266:         }

----- occurrence 4 at line 17368 -----
17354:             if (result.aiReasoning) {
17355:               toast(result.aiReasoning, 'success', 8000);
17356:             } else {
17357:               toast(t('programs.aiGenerated') || 'AI plan generated!', 'success', 4000);
17358:             }
17359: 
17360:             if (typeof nutritionPlans !== 'undefined' && nutritionPlans.applyGenerated) {
17361:               nutritionPlans.applyGenerated(client, result);
17362:             } else if (typeof nutritionPlans !== 'undefined' && nutritionPlans.openCreator) {
17363:               nutritionPlans.openCreator(client.id);
17364:             }
17365:           } catch (e) {
17366:             console.error('[nutrition-ai-gen] error:', e);
17367:             if (e.message === 'NO_AI_BACKEND') {
17368:               const msg = (t('programs.aiNoBackend') || 'AI Pro is not configured. Open Settings → AI Configuration to set up an API endpoint, or use regular Generate instead.');
17369:               toast(msg, 'warning', 6000);
17370:               // Auto-fall back to rule-based generator
17371:               setTimeout(async () => {
17372:                 if (confirm(t('programs.aiFallbackToAuto') || 'Fall back to rule-based generation?')) {
17373:                   try {
17374:                     const fallbackResult = await generatePlan(client, answers);
17375:                     _lastResult = fallbackResult;
17376:                     modal.classList.add('hidden');
17377:                     modal.removeAttribute('data-mode');
17378:                     q.classList.add('hidden');
17379:                     if (typeof nutritionPlans !== 'undefined' && nutritionPlans.applyGenerated) {
17380:                       nutritionPlans.applyGenerated(client, fallbackResult);
17381:                     }
17382:                   } catch (err2) {
17383:                     console.error('[nutrition-ai-gen] fallback failed:', err2);


========== MARKER: aiEndpoint ==========

----- occurrence 1 at line 3088 -----
3074: 
3075:             <!-- AI Configuration (collapsible) -->
3076:             <div class="bg-surface border border-accent/30 rounded-2xl shadow-card mb-4 settings-panel collapsed">
3077:               <div class="settings-panel-header p-5 pb-3">
3078:                 <h3 class="font-display font-bold text-sm text-accent uppercase tracking-wider flex items-center gap-2 flex-1">
3079:                 <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 2a8 8 0 1 1-8 8 8 8 0 0 1 8-8z"/><path d="M12 6v6l4 2"/></svg>
3080:                 <span data-i18n="settings.aiConfig">AI Configuration</span>
3081:                 </h3>
3082:                 <svg class="w-4 h-4 text-muted settings-panel-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9l6 6 6-6"/></svg>
3083:               </div>
3084:               <div class="settings-panel-body p-5 pt-0">
3085:               <p class="text-xs text-muted mb-3 leading-relaxed" data-i18n="settings.aiConfigDesc">Configure an OpenAI-compatible API endpoint to enable AI Pro generators (workout + nutrition plans) in the browser. Without this, AI Pro falls back to Auto rule-based generation.</p>
3086:               <div class="space-y-3">
3087:                 <div>
3088:                   <label class="text-xs font-semibold text-muted block mb-1" data-i18n="settings.aiEndpoint">API endpoint URL</label>
3089:                   <input type="text" id="settings-ai-endpoint" placeholder="https://api.openai.com/v1/chat/completions" class="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-accent/50" />
3090:                   <p class="text-[10px] text-muted mt-1" data-i18n="settings.aiEndpointHint">OpenAI-compatible: OpenAI, Azure, GLM, OpenRouter, Ollama, LM Studio, etc.</p>
3091:                 </div>
3092:                 <div>
3093:                   <label class="text-xs font-semibold text-muted block mb-1" data-i18n="settings.aiKey">API key</label>
3094:                   <input type="password" id="settings-ai-key" placeholder="sk-..." class="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-accent/50" />
3095:                   <p class="text-[10px] text-muted mt-1" data-i18n="settings.aiKeyHint">Stored locally in your browser. Never sent anywhere except the endpoint above.</p>
3096:                 </div>
3097:                 <div>
3098:                   <label class="text-xs font-semibold text-muted block mb-1" data-i18n="settings.aiModel">Model name</label>
3099:                   <input type="text" id="settings-ai-model" placeholder="gpt-4o-mini" class="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-accent/50" />
3100:                   <p class="text-[10px] text-muted mt-1" data-i18n="settings.aiModelHint">Examples: gpt-4o-mini, glm-4.6, claude-3-haiku-20240307, llama3.1:8b</p>
3101:                 </div>
3102:                 <div class="flex flex-wrap gap-2 pt-1">
3103:                   <button id="settings-ai-save" class="bg-accent/15 hover:bg-accent/25 text-accent border border-accent/30 text-sm font-semibold px-3.5 py-2 rounded-lg transition inline-flex items-center gap-1.5">

----- occurrence 2 at line 3090 -----
3076:             <div class="bg-surface border border-accent/30 rounded-2xl shadow-card mb-4 settings-panel collapsed">
3077:               <div class="settings-panel-header p-5 pb-3">
3078:                 <h3 class="font-display font-bold text-sm text-accent uppercase tracking-wider flex items-center gap-2 flex-1">
3079:                 <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 2a8 8 0 1 1-8 8 8 8 0 0 1 8-8z"/><path d="M12 6v6l4 2"/></svg>
3080:                 <span data-i18n="settings.aiConfig">AI Configuration</span>
3081:                 </h3>
3082:                 <svg class="w-4 h-4 text-muted settings-panel-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9l6 6 6-6"/></svg>
3083:               </div>
3084:               <div class="settings-panel-body p-5 pt-0">
3085:               <p class="text-xs text-muted mb-3 leading-relaxed" data-i18n="settings.aiConfigDesc">Configure an OpenAI-compatible API endpoint to enable AI Pro generators (workout + nutrition plans) in the browser. Without this, AI Pro falls back to Auto rule-based generation.</p>
3086:               <div class="space-y-3">
3087:                 <div>
3088:                   <label class="text-xs font-semibold text-muted block mb-1" data-i18n="settings.aiEndpoint">API endpoint URL</label>
3089:                   <input type="text" id="settings-ai-endpoint" placeholder="https://api.openai.com/v1/chat/completions" class="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-accent/50" />
3090:                   <p class="text-[10px] text-muted mt-1" data-i18n="settings.aiEndpointHint">OpenAI-compatible: OpenAI, Azure, GLM, OpenRouter, Ollama, LM Studio, etc.</p>
3091:                 </div>
3092:                 <div>
3093:                   <label class="text-xs font-semibold text-muted block mb-1" data-i18n="settings.aiKey">API key</label>
3094:                   <input type="password" id="settings-ai-key" placeholder="sk-..." class="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-accent/50" />
3095:                   <p class="text-[10px] text-muted mt-1" data-i18n="settings.aiKeyHint">Stored locally in your browser. Never sent anywhere except the endpoint above.</p>
3096:                 </div>
3097:                 <div>
3098:                   <label class="text-xs font-semibold text-muted block mb-1" data-i18n="settings.aiModel">Model name</label>
3099:                   <input type="text" id="settings-ai-model" placeholder="gpt-4o-mini" class="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-accent/50" />
3100:                   <p class="text-[10px] text-muted mt-1" data-i18n="settings.aiModelHint">Examples: gpt-4o-mini, glm-4.6, claude-3-haiku-20240307, llama3.1:8b</p>
3101:                 </div>
3102:                 <div class="flex flex-wrap gap-2 pt-1">
3103:                   <button id="settings-ai-save" class="bg-accent/15 hover:bg-accent/25 text-accent border border-accent/30 text-sm font-semibold px-3.5 py-2 rounded-lg transition inline-flex items-center gap-1.5">
3104:                     <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/></svg>
3105:                     <span data-i18n="settings.aiSave">Save</span>

----- occurrence 3 at line 24417 -----
24403:       settings: {
24404:         title: 'Settings',
24405:         language: 'Language',
24406:         theme: 'Theme',
24407:         themeDark: 'Dark',
24408:         themeLight: 'Light',
24409:         backup: 'Backup & restore',
24410:         exportData: 'Export full backup (.json)',
24411:         importData: 'Import backup (.json)',
24412:         dangerZone: 'Danger zone',
24413:         wipeDb: 'Wipe entire database',
24414:         // AI Configuration
24415:         aiConfig: 'AI Configuration',
24416:         aiConfigDesc: 'Configure an OpenAI-compatible API endpoint to enable AI Pro generators (workout + nutrition plans) in the browser. Without this, AI Pro falls back to Auto rule-based generation.',
24417:         aiEndpoint: 'API endpoint URL',
24418:         aiEndpointHint: 'OpenAI-compatible: OpenAI, Azure, GLM, OpenRouter, Ollama, LM Studio, etc.',
24419:         aiKey: 'API key',
24420:         aiKeyHint: 'Stored locally in your browser. Never sent anywhere except the endpoint above.',
24421:         aiModel: 'Model name',
24422:         aiModelHint: 'Examples: gpt-4o-mini, glm-4.6, claude-3-haiku-20240307, llama3.1:8b',
24423:         aiSave: 'Save',
24424:         aiTest: 'Test connection',
24425:         aiClear: 'Clear',
24426:         aiConfigured: 'Configured',
24427:         aiNotConfigured: 'Not configured — AI Pro will fall back to Auto',
24428:         aiNodeBackend: 'Node.js backend (z-ai CLI) available',
24429:         aiSaved: 'AI configuration saved',
24430:         aiTesting: 'Testing...',
24431:         aiTestOk: 'Connection OK',
24432:         aiTestFailed: 'Test failed',

----- occurrence 4 at line 24418 -----
24404:         title: 'Settings',
24405:         language: 'Language',
24406:         theme: 'Theme',
24407:         themeDark: 'Dark',
24408:         themeLight: 'Light',
24409:         backup: 'Backup & restore',
24410:         exportData: 'Export full backup (.json)',
24411:         importData: 'Import backup (.json)',
24412:         dangerZone: 'Danger zone',
24413:         wipeDb: 'Wipe entire database',
24414:         // AI Configuration
24415:         aiConfig: 'AI Configuration',
24416:         aiConfigDesc: 'Configure an OpenAI-compatible API endpoint to enable AI Pro generators (workout + nutrition plans) in the browser. Without this, AI Pro falls back to Auto rule-based generation.',
24417:         aiEndpoint: 'API endpoint URL',
24418:         aiEndpointHint: 'OpenAI-compatible: OpenAI, Azure, GLM, OpenRouter, Ollama, LM Studio, etc.',
24419:         aiKey: 'API key',
24420:         aiKeyHint: 'Stored locally in your browser. Never sent anywhere except the endpoint above.',
24421:         aiModel: 'Model name',
24422:         aiModelHint: 'Examples: gpt-4o-mini, glm-4.6, claude-3-haiku-20240307, llama3.1:8b',
24423:         aiSave: 'Save',
24424:         aiTest: 'Test connection',
24425:         aiClear: 'Clear',
24426:         aiConfigured: 'Configured',
24427:         aiNotConfigured: 'Not configured — AI Pro will fall back to Auto',
24428:         aiNodeBackend: 'Node.js backend (z-ai CLI) available',
24429:         aiSaved: 'AI configuration saved',
24430:         aiTesting: 'Testing...',
24431:         aiTestOk: 'Connection OK',
24432:         aiTestFailed: 'Test failed',
24433:         aiClearConfirm: 'Clear AI configuration?',


========== MARKER: Suggest foods ==========

----- occurrence 1 at line 3411 -----
3397:           <button id="micro-tab-vitamins" class="flex-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition bg-primary text-white" data-i18n="nutrition.vitamins">Vitamins</button>
3398:           <button id="micro-tab-minerals" class="flex-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition text-muted" data-i18n="nutrition.minerals">Minerals</button>
3399:           <button id="micro-tab-amino" class="flex-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition text-muted">Amino Acids</button>
3400:         </div>
3401:         <!-- Summary stats -->
3402:         <div id="micro-summary" class="p-3 border-b border-border grid grid-cols-3 gap-2 shrink-0"></div>
3403:         <!-- Nutrient list -->
3404:         <div id="micro-list" class="flex-1 overflow-y-auto p-3 space-y-2"></div>
3405:         <!-- Amino acid list (hidden by default) -->
3406:         <div id="micro-amino-list" class="hidden flex-1 overflow-y-auto p-3 space-y-2"></div>
3407:         <!-- Footer -->
3408:         <div class="p-3 border-t border-border flex gap-2 shrink-0">
3409:           <button id="micro-suggest" class="flex-1 bg-accent/15 hover:bg-accent/25 text-accent border border-accent/30 text-sm font-semibold py-2.5 rounded-xl transition inline-flex items-center justify-center gap-2" data-i18n="nutrition.suggestFoods">
3410:             <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
3411:             Suggest foods to fill gaps
3412:           </button>
3413:           <button id="micro-done" class="flex-1 bg-primary hover:bg-primary-2 text-white text-sm font-semibold py-2.5 rounded-xl transition shadow-card" data-i18n="common.done">Done</button>
3414:         </div>
3415:       </div>
3416:     </div>
3417: 
3418:     <!-- ============= IMAGE VIEWER MODAL (full-screen) ============= -->
3419:     <div id="viewer-modal" class="hidden fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4" role="dialog" aria-modal="true">
3420:       <button id="viewer-close" class="absolute top-4 end-4 w-10 h-10 grid place-items-center rounded-full bg-white/10 hover:bg-white/20 text-white transition" aria-label="Close" data-i18n-attr="aria-label:aria.close">
3421:         <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
3422:       </button>
3423:       <img id="viewer-img" src="" alt="" class="max-w-full max-h-full object-contain rounded-lg" />
3424:     </div>
3425: 
3426:     <!-- ============= EXERCISE CARD MODAL (Steps 17-18) ============= -->

----- occurrence 2 at line 22637 -----
22623:     },
22624:     {
22625:       id: 'nutrition',
22626:       icon: '🥗',
22627:       title: { en: 'Nutrition Plans', ru: 'Планы питания', he: 'תוכניות תזונה' },
22628:       sections: [
22629:         {
22630:           heading: { en: 'Creating a Nutrition Plan', ru: 'Создание плана питания', he: 'יצירת תוכנית תזונה' },
22631:           body: { en: 'Click "New nutrition plan" on the client profile. Set target calories and macros (protein/carbs/fat). Add foods via the Food Picker — foods are organized into 4 macro-groups: Proteins (🥩), Carbohydrates (🍞), Fats (🥜), Other (⭐). Each group expands to show food categories.',
22632:                   ru: 'Нажмите "Новый план питания" в профиле клиента. Установите целевые калории и макросы (белки/углеводы/жиры). Добавляйте продукты через Food Picker — продукты организованы в 4 макро-группы: Белки (🥩), Углеводы (🍞), Жиры (🥜), Другое (⭐). Каждая группа раскрывается, показывая категории продуктов.',
22633:                   he: 'לחץ "תוכנית תזונה חדשה" בפרופיל המתאמן. הגדר קלוריות יעד ומאקרו. הוסף מזונות דרך Food Picker — המזונות מאורגנים ב-4 קבוצות מאקרו: חלבונים (🥩), פחמימות (🍞), שומנים (🥜), אחר (⭐).' }
22634:         },
22635:         {
22636:           heading: { en: 'Micronutrient Analysis', ru: 'Анализ микронутриентов', he: 'ניתוח מיקרו-נוטריאנטים' },
22637:           body: { en: 'Click "Micronutrients" to see vitamin, mineral, and amino acid coverage for the plan. Each nutrient shows a progress bar with percentage of RDI. The "Suggest foods" button finds foods richest in the most deficient nutrients.',
22638:                   ru: 'Нажмите "Микронутриенты", чтобы увидеть покрытие витаминов, минералов и аминокислот в плане. Каждый нутриент показывает прогресс-бар с процентом от RDI. Кнопка "Подобрать продукты" находит продукты, богатые самыми дефицитными нутриентами.',
22639:                   he: 'לחץ "מיקרו-נוטריאנטים" כדי לראות כיסוי ויטמינים, מינרלים וחומצות אמינו. כל נוטריאנט מציג פס התקדמות עם אחוז מ-RDI.' }
22640:         }
22641:       ]
22642:     },
22643:     {
22644:       id: 'recovery',
22645:       icon: '📊',
22646:       title: { en: 'Recovery Map', ru: 'Карта восстановления', he: 'מפת התאוששות' },
22647:       sections: [
22648:         {
22649:           heading: { en: 'How Recovery Works', ru: 'Как работает восстановление', he: 'איך עובד ההתאוששות' },
22650:           body: { en: 'The Recovery Map shows per-muscle recovery percentage using a 6-day exponential decay model. After each workout, the exercised muscles start at 0% recovery and gradually recover: ~63% after 3 days, ~86% after 6 days. Synergist muscles (e.g. triceps during bench press) receive 30% fatigue credit.',
22651:                   ru: 'Карта восстановления показывает процент восстановления каждой мышцы по 6-дневной модели экспоненциального затухания. После каждой тренировки тренируемые мышцы начинают с 0% и постепенно восстанавливаются: ~63% через 3 дня, ~86% через 6 дней. Синергисты (например, трицепс при жиме лёжа) получают 30% усталости.',
22652:                   he: 'מפת ההתאוששות מציגה אחוז התאוששות לכל שריר במודל דעיכה מעריכית 6-יומי. לאחר כל אימון, השרירים מתחילים מ-0% ומתאוששים בהדרגה: ~63% לאחר 3 ימים, ~86% לאחר 6 ימים. שרירים סינרגיסטים מקבלים 30% עייפות.' }

----- occurrence 3 at line 23977 -----
23963:         macroAdjusted: 'adjusted',
23964:         caloriesAdjusted: 'calories adjusted',
23965:         // Micronutrient analysis
23966:         micros: 'Micros',
23967:         micronutrients: 'Micronutrients',
23968:         microAnalysis: 'Micronutrient analysis',
23969:         microGood: 'Good (≥80%)',
23970:         microFair: 'Fair (50-80%)',
23971:         microLow: 'Low / Over limit',
23972:         microVitamins: 'Vitamins',
23973:         microMinerals: 'Minerals',
23974:         microOther: 'Other',
23975:         foods: 'foods',
23976:         openPlanFirst: 'Open a plan first',
23977:         suggestFoods: 'Suggest foods to fill gaps',
23978:         noGaps: 'All micronutrients covered — no major gaps',
23979:         gapsFound: 'Gaps found — top foods to fill them:',
23980:         tapToAdd: 'Tap a food to add it to the plan',
23981:         currentlyAt: 'currently at',
23982:         rdi: 'RDI',
23983:         noFoodsFoundForNutrient: 'No foods found in the database rich in this nutrient.',
23984:         backToAnalysis: 'Back to full analysis',
23985:         foodAdded: 'Food added to plan',
23986:         serving: 'Serving',
23987:         grams: 'g',
23988:         ml: 'ml',
23989:         calories: 'Calories',
23990:         protein: 'Protein',
23991:         carbs: 'Carbs',
23992:         fat: 'Fat',


========== MARKER: suggestFoodsForGaps ==========

----- occurrence 1 at line 18803 -----
18789:      *  toggles visibility of #micro-list and #micro-amino-list, and re-applies
18790:      *  the group filter or renders the amino acid panel as needed. */
18791:     function switchMicroTab(tab) {
18792:       _currentMicroTab = tab;
18793:       _applyMicroTabStyling(tab);
18794:       var microList = document.getElementById('micro-list');
18795:       var aminoList = document.getElementById('micro-amino-list');
18796:       if (tab === 'amino') {
18797:         if (microList) microList.classList.add('hidden');
18798:         if (aminoList) aminoList.classList.remove('hidden');
18799:         renderAminoAcids();
18800:       } else {
18801:         if (microList) microList.classList.remove('hidden');
18802:         if (aminoList) aminoList.classList.add('hidden');
18803:         // If micro-list was overwritten (e.g. by suggestFoodsForGaps), re-render
18804:         var hasGroups = microList && microList.querySelector('[data-micro-group]');
18805:         if (!hasGroups) {
18806:           renderMicronutrientAnalysis();
18807:         } else {
18808:           applyMicroListFilter(tab);
18809:         }
18810:       }
18811:     }
18812: 
18813:     /** Render the essential amino acid panel into #micro-amino-list.
18814:      *  Uses AA_PROFILES + runtime calculator so we don't need precomputed amino data. */
18815:     function renderAminoAcids() {
18816:       var aminoList = document.getElementById('micro-amino-list');
18817:       if (!aminoList) return;
18818:       var lang = (typeof currentLang === 'function') ? currentLang() : 'en';

----- occurrence 2 at line 18961 -----
18947:       let fullHtml = '';
18948:       ['vitamin', 'mineral', 'other'].forEach(g => {
18949:         const groupHtml = renderNutrientGroup(g);
18950:         fullHtml += '<div data-micro-group="' + g + '" class="space-y-2">' + groupHtml + '</div>';
18951:       });
18952:       const listEl = document.getElementById('micro-list');
18953:       if (listEl) listEl.innerHTML = fullHtml;
18954:       // Re-apply the active tab filter so the correct group is visible after re-render
18955:       applyMicroListFilter(_currentMicroTab);
18956:     }
18957: 
18958:     /** Show suggestions for the top-3 most deficient nutrients.
18959:      *  Lists foods from the database richest in those nutrients.
18960:      *  Clicking a suggested food opens the food picker to confirm portion. */
18961:     function suggestFoodsForGaps() {
18962:       if (!_editing) return;
18963:       const lang = (typeof currentLang === 'function') ? currentLang() : 'en';
18964:       const result = calculateMicronutrients(_editing);
18965:       if (result.missing.length === 0) {
18966:         toast(t('nutrition.noGaps') || 'All micronutrients covered — no major gaps', 'success', 3000);
18967:         return;
18968:       }
18969:       // If user is on the amino tab, switch to vitamins first — suggestions
18970:       // are rendered into #micro-list which is hidden while on the amino tab.
18971:       if (_currentMicroTab === 'amino') {
18972:         switchMicroTab('vitamins');
18973:       }
18974:       // Top 3 most deficient
18975:       const top3 = result.missing.slice(0, 3);
18976:       // Collect already-used food IDs

----- occurrence 3 at line 19060 -----
19046:               search.value = name;
19047:               search.dispatchEvent(new Event('input'));
19048:             }
19049:           }
19050:         });
19051:       });
19052: 
19053:       // Wire back button
19054:       const backBtn = document.getElementById('micro-back');
19055:       if (backBtn) backBtn.addEventListener('click', () => renderMicronutrientAnalysis());
19056:     }
19057: 
19058:     return { loadFoods, loadPlans, openCreator, openEditor, savePlan, renderFoodResults,
19059:              applyGenerated, _openPickerForTemplate, adjustMacro, scaleAllPortions,
19060:              openMicronutrientAnalysis, renderMicronutrientAnalysis, suggestFoodsForGaps,
19061:              switchMicroTab, renderAminoAcids,
19062:              scanBarcode, lookupBarcode,
19063:              get _editing() { return _editing; }, get _foods() { return _foods; },
19064:              set _fpSource(v) { _fpSource = v; } };
19065:   })();
19066: 
19067:   /* =====================================================================
19068:      FOOD DATABASE SCREEN MODULE — tree view, search, source filter, edit.
19069:      Mirrors screens.exercises for the nutrition domain.
19070:      ===================================================================== */
19071: 
19072:   /** Global HTML-escape helper used by openFoodDetailModal, saveFoodDetail,
19073:    *  and other top-level (non-IIFE) functions in the nutrition domain.
19074: 
19075: 

----- occurrence 4 at line 20692 -----
20678:         return;
20679:       }
20680:       const plan = nutritionPlans._editing;
20681:       // Save the plan first so printNutritionPlan can load it by ID
20682:       if (!plan.id) plan.id = db.uuid();
20683:       plan.updated_at = Date.now();
20684:       try { await db.put('nutrition_plans', plan); } catch(e) {}
20685:       screens.profile.printNutritionPlan(plan.id);
20686:     });
20687:     const microClose = document.getElementById('micro-close');
20688:     if (microClose) microClose.addEventListener('click', () => document.getElementById('micronutrient-modal').classList.add('hidden'));
20689:     const microDone = document.getElementById('micro-done');
20690:     if (microDone) microDone.addEventListener('click', () => document.getElementById('micronutrient-modal').classList.add('hidden'));
20691:     const microSuggest = document.getElementById('micro-suggest');
20692:     if (microSuggest) microSuggest.addEventListener('click', () => nutritionPlans.suggestFoodsForGaps());
20693:     const microModal = document.getElementById('micronutrient-modal');
20694:     if (microModal) microModal.addEventListener('click', (e) => {
20695:       if (e.target === microModal) microModal.classList.add('hidden');
20696:     });
20697: 
20698:     // Food picker wiring
20699:     const fpClose = document.getElementById('fp-close');
20700:     if (fpClose) fpClose.addEventListener('click', () => document.getElementById('food-picker-modal').classList.add('hidden'));
20701:     const fpSearch = document.getElementById('fp-search');
20702:     if (fpSearch) {
20703:       let fpTimer;
20704:       fpSearch.addEventListener('input', () => {
20705:         clearTimeout(fpTimer);
20706:         fpTimer = setTimeout(() => nutritionPlans.renderFoodResults(fpSearch.value), 300);
20707:       });


========== MARKER: Smart program generator ==========

----- occurrence 1 at line 2280 -----
2266:                   </div>
2267:                 </button>
2268:                 <!-- Hint -->
2269:                 <div class="text-[10px] text-muted text-center pt-2" data-i18n="programs.autoArrangeHint">Reordering preserves sets, reps, and weights. Supersets may break.</div>
2270:               </div>
2271:             </div>
2272:           </div>
2273: 
2274:           <!-- ============= GENERATOR PREVIEW MODAL (Phase 5) ============= -->
2275:           <div id="generator-modal" class="hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true">
2276:             <div class="bg-surface w-full sm:max-w-lg max-h-[92vh] flex flex-col rounded-t-3xl sm:rounded-2xl border border-border shadow-float">
2277:               <!-- Header -->
2278:               <div class="p-4 border-b border-border flex items-center gap-3">
2279:                 <div class="flex-1 min-w-0">
2280:                   <h3 class="font-display font-bold text-base" data-i18n="generator.title">Smart program generator</h3>
2281:                   <p id="generator-subtitle" class="text-xs text-muted truncate"></p>
2282:                 </div>
2283:                 <button id="generator-close" class="w-8 h-8 grid place-items-center rounded-lg hover:bg-surface-2 text-muted" aria-label="Close" data-i18n-attr="aria-label:aria.close">
2284:                   <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
2285:                 </button>
2286:               </div>
2287: 
2288:               <!-- Loading state -->
2289:               <div id="generator-loading" class="hidden p-8 text-center">
2290:                 <svg class="w-8 h-8 mx-auto animate-spin text-primary-2 mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
2291:                 <p class="text-sm text-muted" data-i18n="generator.applyingRules">Applying expert rules…</p>
2292:               </div>
2293: 
2294:               <!-- Results -->
2295:               <div id="generator-results" class="hidden flex-1 overflow-y-auto p-4 space-y-4">

----- occurrence 2 at line 24228 -----
24214:         cat_vegan: 'Vegan Products',
24215:         cat_sauces: 'Sauces & Condiments',
24216:         cat_sweets: 'Sweets & Snacks',
24217:         cat_drinks: 'Beverages',
24218:         cat_israeli: 'Israeli Dishes',
24219:         cat_international: 'International Dishes',
24220:         cat_oils: 'Oils & Fats',
24221:         cat_eggs: 'Eggs',
24222:         cat_protein: 'Protein Supplements',
24223:         cat_baby: 'Baby Food',
24224:         cat_other: 'Other',
24225:       },
24226:       // ---- Phase 5: Generator ----
24227:       generator: {
24228:         title: 'Smart program generator',
24229:         generate: 'Generate program',
24230:         regenerate: 'Regenerate',
24231:         applyingRules: 'Applying expert rules…',
24232:         basedOn: 'Based on client profile',
24233:         daysPerWeek: '{n} days/week',
24234:         estimatedDuration: 'Estimated ~{n} min per session',
24235:         ruleMatched: 'Rule matched',
24236:         noSafeExercise: 'No safe exercise available for this constraint',
24237:         day: 'Day',
24238:         restDay: 'Rest day',
24239:         workoutDay: 'Workout day',
24240:         exercises: 'exercises',
24241:         sets: 'sets',
24242:         goal: 'Goal',
24243:         frequency: 'Frequency',


========== MARKER: full_name ==========

----- occurrence 1 at line 3864 -----
3850:           <fieldset class="space-y-3">
3851:             <legend class="text-[11px] uppercase tracking-wider text-muted font-semibold mb-1" data-i18n="clients.title">Client</legend>
3852:             <!-- Client photo (Sprint 3+) -->
3853:             <div class="flex items-center gap-3">
3854:               <div id="client-photo-preview" class="w-16 h-16 rounded-2xl shrink-0 overflow-hidden bg-surface-2 border border-border grid place-items-center cursor-pointer relative group" title="Click to upload photo">
3855:                 <div id="client-photo-placeholder" class="font-display font-bold text-2xl text-muted">?</div>
3856:                 <img id="client-photo-img" class="w-full h-full object-cover hidden" alt="" />
3857:                 <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition grid place-items-center">
3858:                   <svg class="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
3859:                 </div>
3860:               </div>
3861:               <input type="file" id="client-photo-input" accept="image/*" class="hidden" />
3862:               <div class="flex-1">
3863:                 <label class="block text-xs font-semibold mb-1" data-i18n="client.fullName">Full name</label>
3864:                 <input name="full_name" required class="w-full bg-surface-2 border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60" />
3865:               </div>
3866:             </div>
3867:             <div class="grid grid-cols-3 gap-2">
3868:               <div>
3869:                 <label class="block text-xs font-semibold mb-1" data-i18n="client.age">Age</label>
3870:                 <input name="age" type="number" min="10" max="100" class="w-full bg-surface-2 border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60" />
3871:               </div>
3872:               <div>
3873:                 <label class="block text-xs font-semibold mb-1" data-i18n="client.weight">Weight (kg)</label>
3874:                 <input name="weight" type="number" min="30" max="250" step="0.1" class="w-full bg-surface-2 border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60" />
3875:               </div>
3876:               <div>
3877:                 <label class="block text-xs font-semibold mb-1" data-i18n="client.height">Height (cm)</label>
3878:                 <input name="height" type="number" min="120" max="220" class="w-full bg-surface-2 border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60" />
3879:               </div>

----- occurrence 2 at line 4987 -----
4973:         const def = DB_SCHEMA.find(s => s.name === storeName);
4974:         const record = { ...obj };
4975:         if (def && def.keyPath === 'id') {
4976:           if (!record.id) record.id = uuid();
4977:           const now = Date.now();
4978:           if (!record.created_at) record.created_at = now;
4979:           record.updated_at = now;
4980:         }
4981: 
4982:         // Auto-maintain the case-insensitive name_lower index field
4983:         // when the record has a `name` string property.
4984:         if ('name' in record && typeof record.name === 'string') {
4985:           record.name_lower = record.name.toLowerCase();
4986:         }
4987:         // Also for clients: store name_lower derived from full_name if present
4988:         if (storeName === 'clients' && 'full_name' in record && typeof record.full_name === 'string') {
4989:           record.name_lower = record.full_name.toLowerCase();
4990:         }
4991: 
4992:         const putReq = store.put(record);
4993:         return Promise.all([req(putReq), txDone(tx)]).then(() => record);
4994:       });
4995:     }
4996: 
4997:     function bulkPut(storeName, arr) {
4998:       assertStore(storeName);
4999:       if (!Array.isArray(arr) || arr.length === 0) return Promise.resolve([]);
5000:       return open().then(idb => {
5001:         const tx = idb.transaction(storeName, 'readwrite');
5002:         const store = tx.objectStore(storeName);

----- occurrence 3 at line 4988 -----
4974:         const record = { ...obj };
4975:         if (def && def.keyPath === 'id') {
4976:           if (!record.id) record.id = uuid();
4977:           const now = Date.now();
4978:           if (!record.created_at) record.created_at = now;
4979:           record.updated_at = now;
4980:         }
4981: 
4982:         // Auto-maintain the case-insensitive name_lower index field
4983:         // when the record has a `name` string property.
4984:         if ('name' in record && typeof record.name === 'string') {
4985:           record.name_lower = record.name.toLowerCase();
4986:         }
4987:         // Also for clients: store name_lower derived from full_name if present
4988:         if (storeName === 'clients' && 'full_name' in record && typeof record.full_name === 'string') {
4989:           record.name_lower = record.full_name.toLowerCase();
4990:         }
4991: 
4992:         const putReq = store.put(record);
4993:         return Promise.all([req(putReq), txDone(tx)]).then(() => record);
4994:       });
4995:     }
4996: 
4997:     function bulkPut(storeName, arr) {
4998:       assertStore(storeName);
4999:       if (!Array.isArray(arr) || arr.length === 0) return Promise.resolve([]);
5000:       return open().then(idb => {
5001:         const tx = idb.transaction(storeName, 'readwrite');
5002:         const store = tx.objectStore(storeName);
5003:         const def = DB_SCHEMA.find(s => s.name === storeName);

----- occurrence 4 at line 4988 -----
4974:         const record = { ...obj };
4975:         if (def && def.keyPath === 'id') {
4976:           if (!record.id) record.id = uuid();
4977:           const now = Date.now();
4978:           if (!record.created_at) record.created_at = now;
4979:           record.updated_at = now;
4980:         }
4981: 
4982:         // Auto-maintain the case-insensitive name_lower index field
4983:         // when the record has a `name` string property.
4984:         if ('name' in record && typeof record.name === 'string') {
4985:           record.name_lower = record.name.toLowerCase();
4986:         }
4987:         // Also for clients: store name_lower derived from full_name if present
4988:         if (storeName === 'clients' && 'full_name' in record && typeof record.full_name === 'string') {
4989:           record.name_lower = record.full_name.toLowerCase();
4990:         }
4991: 
4992:         const putReq = store.put(record);
4993:         return Promise.all([req(putReq), txDone(tx)]).then(() => record);
4994:       });
4995:     }
4996: 
4997:     function bulkPut(storeName, arr) {
4998:       assertStore(storeName);
4999:       if (!Array.isArray(arr) || arr.length === 0) return Promise.resolve([]);
5000:       return open().then(idb => {
5001:         const tx = idb.transaction(storeName, 'readwrite');
5002:         const store = tx.objectStore(storeName);
5003:         const def = DB_SCHEMA.find(s => s.name === storeName);


========== MARKER: training_days ==========

----- occurrence 1 at line 3961 -----
3947:             </div>
3948:             <div>
3949:               <label class="block text-xs font-semibold mb-1" data-i18n="client.split">Split preference</label>
3950:               <select name="split" class="w-full bg-surface-2 border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60 cursor-pointer">
3951:                 <option value="ppl" data-i18n="client.splitPushPullLegs">Push / Pull / Legs</option>
3952:                 <option value="upper_lower" data-i18n="client.splitUpperLower">Upper / Lower</option>
3953:                 <option value="full_body" data-i18n="client.splitFullBody">Full body</option>
3954:                 <option value="bro" data-i18n="client.splitBro">Bro split (1 muscle/day)</option>
3955:               </select>
3956:             </div>
3957:             <div>
3958:               <label class="block text-xs font-semibold mb-1" data-i18n="client.trainingDays">Training days</label>
3959:               <div class="grid grid-cols-7 gap-1">
3960:                 <label class="flex flex-col items-center gap-0.5 bg-surface-2 border border-border rounded-lg py-1.5 text-[10px] cursor-pointer hover:bg-border/30 transition">
3961:                   <input type="checkbox" name="training_days" value="1" class="accent-primary w-3 h-3" />
3962:                   <span data-i18n="client.dayMon">Mon</span>
3963:                 </label>
3964:                 <label class="flex flex-col items-center gap-0.5 bg-surface-2 border border-border rounded-lg py-1.5 text-[10px] cursor-pointer hover:bg-border/30 transition">
3965:                   <input type="checkbox" name="training_days" value="2" class="accent-primary w-3 h-3" />
3966:                   <span data-i18n="client.dayTue">Tue</span>
3967:                 </label>
3968:                 <label class="flex flex-col items-center gap-0.5 bg-surface-2 border border-border rounded-lg py-1.5 text-[10px] cursor-pointer hover:bg-border/30 transition">
3969:                   <input type="checkbox" name="training_days" value="3" class="accent-primary w-3 h-3" />
3970:                   <span data-i18n="client.dayWed">Wed</span>
3971:                 </label>
3972:                 <label class="flex flex-col items-center gap-0.5 bg-surface-2 border border-border rounded-lg py-1.5 text-[10px] cursor-pointer hover:bg-border/30 transition">
3973:                   <input type="checkbox" name="training_days" value="4" class="accent-primary w-3 h-3" />
3974:                   <span data-i18n="client.dayThu">Thu</span>
3975:                 </label>
3976:                 <label class="flex flex-col items-center gap-0.5 bg-surface-2 border border-border rounded-lg py-1.5 text-[10px] cursor-pointer hover:bg-border/30 transition">

----- occurrence 2 at line 3965 -----
3951:                 <option value="ppl" data-i18n="client.splitPushPullLegs">Push / Pull / Legs</option>
3952:                 <option value="upper_lower" data-i18n="client.splitUpperLower">Upper / Lower</option>
3953:                 <option value="full_body" data-i18n="client.splitFullBody">Full body</option>
3954:                 <option value="bro" data-i18n="client.splitBro">Bro split (1 muscle/day)</option>
3955:               </select>
3956:             </div>
3957:             <div>
3958:               <label class="block text-xs font-semibold mb-1" data-i18n="client.trainingDays">Training days</label>
3959:               <div class="grid grid-cols-7 gap-1">
3960:                 <label class="flex flex-col items-center gap-0.5 bg-surface-2 border border-border rounded-lg py-1.5 text-[10px] cursor-pointer hover:bg-border/30 transition">
3961:                   <input type="checkbox" name="training_days" value="1" class="accent-primary w-3 h-3" />
3962:                   <span data-i18n="client.dayMon">Mon</span>
3963:                 </label>
3964:                 <label class="flex flex-col items-center gap-0.5 bg-surface-2 border border-border rounded-lg py-1.5 text-[10px] cursor-pointer hover:bg-border/30 transition">
3965:                   <input type="checkbox" name="training_days" value="2" class="accent-primary w-3 h-3" />
3966:                   <span data-i18n="client.dayTue">Tue</span>
3967:                 </label>
3968:                 <label class="flex flex-col items-center gap-0.5 bg-surface-2 border border-border rounded-lg py-1.5 text-[10px] cursor-pointer hover:bg-border/30 transition">
3969:                   <input type="checkbox" name="training_days" value="3" class="accent-primary w-3 h-3" />
3970:                   <span data-i18n="client.dayWed">Wed</span>
3971:                 </label>
3972:                 <label class="flex flex-col items-center gap-0.5 bg-surface-2 border border-border rounded-lg py-1.5 text-[10px] cursor-pointer hover:bg-border/30 transition">
3973:                   <input type="checkbox" name="training_days" value="4" class="accent-primary w-3 h-3" />
3974:                   <span data-i18n="client.dayThu">Thu</span>
3975:                 </label>
3976:                 <label class="flex flex-col items-center gap-0.5 bg-surface-2 border border-border rounded-lg py-1.5 text-[10px] cursor-pointer hover:bg-border/30 transition">
3977:                   <input type="checkbox" name="training_days" value="5" class="accent-primary w-3 h-3" />
3978:                   <span data-i18n="client.dayFri">Fri</span>
3979:                 </label>
3980:                 <label class="flex flex-col items-center gap-0.5 bg-surface-2 border border-border rounded-lg py-1.5 text-[10px] cursor-pointer hover:bg-border/30 transition">

----- occurrence 3 at line 3969 -----
3955:               </select>
3956:             </div>
3957:             <div>
3958:               <label class="block text-xs font-semibold mb-1" data-i18n="client.trainingDays">Training days</label>
3959:               <div class="grid grid-cols-7 gap-1">
3960:                 <label class="flex flex-col items-center gap-0.5 bg-surface-2 border border-border rounded-lg py-1.5 text-[10px] cursor-pointer hover:bg-border/30 transition">
3961:                   <input type="checkbox" name="training_days" value="1" class="accent-primary w-3 h-3" />
3962:                   <span data-i18n="client.dayMon">Mon</span>
3963:                 </label>
3964:                 <label class="flex flex-col items-center gap-0.5 bg-surface-2 border border-border rounded-lg py-1.5 text-[10px] cursor-pointer hover:bg-border/30 transition">
3965:                   <input type="checkbox" name="training_days" value="2" class="accent-primary w-3 h-3" />
3966:                   <span data-i18n="client.dayTue">Tue</span>
3967:                 </label>
3968:                 <label class="flex flex-col items-center gap-0.5 bg-surface-2 border border-border rounded-lg py-1.5 text-[10px] cursor-pointer hover:bg-border/30 transition">
3969:                   <input type="checkbox" name="training_days" value="3" class="accent-primary w-3 h-3" />
3970:                   <span data-i18n="client.dayWed">Wed</span>
3971:                 </label>
3972:                 <label class="flex flex-col items-center gap-0.5 bg-surface-2 border border-border rounded-lg py-1.5 text-[10px] cursor-pointer hover:bg-border/30 transition">
3973:                   <input type="checkbox" name="training_days" value="4" class="accent-primary w-3 h-3" />
3974:                   <span data-i18n="client.dayThu">Thu</span>
3975:                 </label>
3976:                 <label class="flex flex-col items-center gap-0.5 bg-surface-2 border border-border rounded-lg py-1.5 text-[10px] cursor-pointer hover:bg-border/30 transition">
3977:                   <input type="checkbox" name="training_days" value="5" class="accent-primary w-3 h-3" />
3978:                   <span data-i18n="client.dayFri">Fri</span>
3979:                 </label>
3980:                 <label class="flex flex-col items-center gap-0.5 bg-surface-2 border border-border rounded-lg py-1.5 text-[10px] cursor-pointer hover:bg-border/30 transition">
3981:                   <input type="checkbox" name="training_days" value="6" class="accent-primary w-3 h-3" />
3982:                   <span data-i18n="client.daySat">Sat</span>
3983:                 </label>
3984:                 <label class="flex flex-col items-center gap-0.5 bg-surface-2 border border-border rounded-lg py-1.5 text-[10px] cursor-pointer hover:bg-border/30 transition">

----- occurrence 4 at line 3973 -----
3959:               <div class="grid grid-cols-7 gap-1">
3960:                 <label class="flex flex-col items-center gap-0.5 bg-surface-2 border border-border rounded-lg py-1.5 text-[10px] cursor-pointer hover:bg-border/30 transition">
3961:                   <input type="checkbox" name="training_days" value="1" class="accent-primary w-3 h-3" />
3962:                   <span data-i18n="client.dayMon">Mon</span>
3963:                 </label>
3964:                 <label class="flex flex-col items-center gap-0.5 bg-surface-2 border border-border rounded-lg py-1.5 text-[10px] cursor-pointer hover:bg-border/30 transition">
3965:                   <input type="checkbox" name="training_days" value="2" class="accent-primary w-3 h-3" />
3966:                   <span data-i18n="client.dayTue">Tue</span>
3967:                 </label>
3968:                 <label class="flex flex-col items-center gap-0.5 bg-surface-2 border border-border rounded-lg py-1.5 text-[10px] cursor-pointer hover:bg-border/30 transition">
3969:                   <input type="checkbox" name="training_days" value="3" class="accent-primary w-3 h-3" />
3970:                   <span data-i18n="client.dayWed">Wed</span>
3971:                 </label>
3972:                 <label class="flex flex-col items-center gap-0.5 bg-surface-2 border border-border rounded-lg py-1.5 text-[10px] cursor-pointer hover:bg-border/30 transition">
3973:                   <input type="checkbox" name="training_days" value="4" class="accent-primary w-3 h-3" />
3974:                   <span data-i18n="client.dayThu">Thu</span>
3975:                 </label>
3976:                 <label class="flex flex-col items-center gap-0.5 bg-surface-2 border border-border rounded-lg py-1.5 text-[10px] cursor-pointer hover:bg-border/30 transition">
3977:                   <input type="checkbox" name="training_days" value="5" class="accent-primary w-3 h-3" />
3978:                   <span data-i18n="client.dayFri">Fri</span>
3979:                 </label>
3980:                 <label class="flex flex-col items-center gap-0.5 bg-surface-2 border border-border rounded-lg py-1.5 text-[10px] cursor-pointer hover:bg-border/30 transition">
3981:                   <input type="checkbox" name="training_days" value="6" class="accent-primary w-3 h-3" />
3982:                   <span data-i18n="client.daySat">Sat</span>
3983:                 </label>
3984:                 <label class="flex flex-col items-center gap-0.5 bg-surface-2 border border-border rounded-lg py-1.5 text-[10px] cursor-pointer hover:bg-border/30 transition">
3985:                   <input type="checkbox" name="training_days" value="0" class="accent-primary w-3 h-3" />
3986:                   <span data-i18n="client.daySun">Sun</span>
3987:                 </label>
3988:               </div>


========== MARKER: fitness_level ==========

----- occurrence 1 at line 3909 -----
3895:             <legend class="text-[11px] uppercase tracking-wider text-muted font-semibold mb-1" data-i18n="workouts.title">Training</legend>
3896:             <div>
3897:               <label class="block text-xs font-semibold mb-1" data-i18n="client.goal">Primary goal</label>
3898:               <select name="goal" class="w-full bg-surface-2 border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60 cursor-pointer">
3899:                 <option value="hypertrophy" data-i18n="client.goalHypertrophy">Hypertrophy</option>
3900:                 <option value="strength" data-i18n="client.goalStrength">Strength</option>
3901:                 <option value="fat_loss" data-i18n="client.goalFatLoss">Fat loss</option>
3902:                 <option value="endurance" data-i18n="client.goalEndurance">Endurance</option>
3903:                 <option value="rehab" data-i18n="client.goalRehab">Rehabilitation</option>
3904:               </select>
3905:             </div>
3906:             <div class="grid grid-cols-2 gap-2">
3907:               <div>
3908:                 <label class="block text-xs font-semibold mb-1" data-i18n="client.fitnessLevel">Fitness level</label>
3909:                 <select name="fitness_level" class="w-full bg-surface-2 border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60 cursor-pointer">
3910:                   <option value="beginner" data-i18n="client.levelBeginner">Beginner</option>
3911:                   <option value="intermediate" data-i18n="client.levelIntermediate">Intermediate</option>
3912:                   <option value="advanced" data-i18n="client.levelAdvanced">Advanced</option>
3913:                 </select>
3914:               </div>
3915:               <div>
3916:                 <label class="block text-xs font-semibold mb-1" data-i18n="client.trainingExperience">Experience (months)</label>
3917:                 <input name="training_experience" type="number" min="0" max="600" placeholder="0" class="w-full bg-surface-2 border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60" />
3918:               </div>
3919:             </div>
3920:             <div>
3921:               <label class="block text-xs font-semibold mb-1" data-i18n="client.equipment">Available equipment</label>
3922:               <div class="grid grid-cols-2 gap-1.5">
3923:                 <label class="flex items-center gap-2 bg-surface-2 border border-border rounded-lg px-3 py-2 text-xs cursor-pointer hover:bg-border/30 transition">
3924:                   <input type="checkbox" name="equipment" value="gym" class="accent-primary w-3.5 h-3.5" />

----- occurrence 2 at line 6705 -----
6691: 
6692: 
6693:     /** Open the modal in create mode (empty form). */
6694:     function openCreate() {
6695:       const modal = document.getElementById('client-modal');
6696:       const form  = document.getElementById('client-form');
6697:       form.reset();
6698:       form.elements.id.value = '';
6699:       // Reset default values (form.reset doesn't reset <select> to first option reliably)
6700:       form.elements.goal.value = 'hypertrophy';
6701:       form.elements.split.value = 'ppl';
6702:       form.elements.frequency.value = 3;
6703:       document.getElementById('freq-display').textContent = '3';
6704:       // Reset new fields
6705:       if (form.elements.fitness_level) form.elements.fitness_level.value = 'beginner';
6706:       if (form.elements.training_experience) form.elements.training_experience.value = '';
6707:       if (form.elements.cuisine_pref) form.elements.cuisine_pref.value = '';
6708:       if (form.elements.budget) form.elements.budget.value = '';
6709:       if (form.elements.cook_time) form.elements.cook_time.value = '';
6710:       if (form.elements.target_weight) form.elements.target_weight.value = '';
6711:       if (form.elements.goal_weeks) form.elements.goal_weeks.value = '';
6712:       if (form.elements.stress_level) form.elements.stress_level.value = '';
6713:       if (form.elements.sleep_quality) form.elements.sleep_quality.value = '';
6714:       if (form.elements.work_hours) form.elements.work_hours.value = '';
6715:       if (form.elements.liked_foods) form.elements.liked_foods.value = '';
6716:       if (form.elements.disliked_foods) form.elements.disliked_foods.value = '';
6717:       // Body composition fields
6718:       ['body_fat_pct','visceral_fat','muscle_mass','bone_mass','water_pct','metabolic_age',
6719:        'neck_cm','shoulder_cm','chest_cm','waist_cm','hip_cm','arm_cm','thigh_cm','calf_cm'].forEach(name => {
6720:         if (form.elements[name]) form.elements[name].value = '';

----- occurrence 3 at line 6705 -----
6691: 
6692: 
6693:     /** Open the modal in create mode (empty form). */
6694:     function openCreate() {
6695:       const modal = document.getElementById('client-modal');
6696:       const form  = document.getElementById('client-form');
6697:       form.reset();
6698:       form.elements.id.value = '';
6699:       // Reset default values (form.reset doesn't reset <select> to first option reliably)
6700:       form.elements.goal.value = 'hypertrophy';
6701:       form.elements.split.value = 'ppl';
6702:       form.elements.frequency.value = 3;
6703:       document.getElementById('freq-display').textContent = '3';
6704:       // Reset new fields
6705:       if (form.elements.fitness_level) form.elements.fitness_level.value = 'beginner';
6706:       if (form.elements.training_experience) form.elements.training_experience.value = '';
6707:       if (form.elements.cuisine_pref) form.elements.cuisine_pref.value = '';
6708:       if (form.elements.budget) form.elements.budget.value = '';
6709:       if (form.elements.cook_time) form.elements.cook_time.value = '';
6710:       if (form.elements.target_weight) form.elements.target_weight.value = '';
6711:       if (form.elements.goal_weeks) form.elements.goal_weeks.value = '';
6712:       if (form.elements.stress_level) form.elements.stress_level.value = '';
6713:       if (form.elements.sleep_quality) form.elements.sleep_quality.value = '';
6714:       if (form.elements.work_hours) form.elements.work_hours.value = '';
6715:       if (form.elements.liked_foods) form.elements.liked_foods.value = '';
6716:       if (form.elements.disliked_foods) form.elements.disliked_foods.value = '';
6717:       // Body composition fields
6718:       ['body_fat_pct','visceral_fat','muscle_mass','bone_mass','water_pct','metabolic_age',
6719:        'neck_cm','shoulder_cm','chest_cm','waist_cm','hip_cm','arm_cm','thigh_cm','calf_cm'].forEach(name => {
6720:         if (form.elements[name]) form.elements[name].value = '';

----- occurrence 4 at line 6757 -----
6743:       const modal = document.getElementById('client-modal');
6744:       const form  = document.getElementById('client-form');
6745:       form.elements.id.value     = c.id || '';
6746:       form.elements.full_name.value = c.full_name || c.name || '';
6747:       form.elements.age.value    = c.age || '';
6748:       form.elements.weight.value = c.weight || '';
6749:       form.elements.height.value = c.height || '';
6750:       form.elements.phone.value  = c.phone || '';
6751:       form.elements.email.value  = c.email || '';
6752:       form.elements.goal.value   = c.goal || 'hypertrophy';
6753:       form.elements.split.value  = c.split || 'ppl';
6754:       form.elements.frequency.value = c.frequency || 3;
6755:       document.getElementById('freq-display').textContent = c.frequency || 3;
6756:       // New training fields
6757:       if (form.elements.fitness_level) form.elements.fitness_level.value = c.fitness_level || 'beginner';
6758:       if (form.elements.training_experience) form.elements.training_experience.value = c.training_experience || '';
6759:       // Equipment checkboxes
6760:       form.querySelectorAll('input[name="equipment"]').forEach(cb => {
6761:         cb.checked = Array.isArray(c.equipment) && c.equipment.includes(cb.value);
6762:       });
6763:       // Training days checkboxes
6764:       form.querySelectorAll('input[name="training_days"]').forEach(cb => {
6765:         cb.checked = Array.isArray(c.training_days) && c.training_days.map(String).includes(cb.value);
6766:       });
6767:       // Nutrition fields
6768:       if (form.elements.cuisine_pref) form.elements.cuisine_pref.value = c.cuisine_pref || '';
6769:       if (form.elements.budget) form.elements.budget.value = c.budget || '';
6770:       if (form.elements.cook_time) form.elements.cook_time.value = c.cook_time || '';
6771:       if (form.elements.target_weight) form.elements.target_weight.value = c.target_weight || '';
6772:       if (form.elements.goal_weeks) form.elements.goal_weeks.value = c.goal_weeks || '';


========== MARKER: allergies ==========

----- occurrence 1 at line 3996 -----
3982:                   <span data-i18n="client.daySat">Sat</span>
3983:                 </label>
3984:                 <label class="flex flex-col items-center gap-0.5 bg-surface-2 border border-border rounded-lg py-1.5 text-[10px] cursor-pointer hover:bg-border/30 transition">
3985:                   <input type="checkbox" name="training_days" value="0" class="accent-primary w-3 h-3" />
3986:                   <span data-i18n="client.daySun">Sun</span>
3987:                 </label>
3988:               </div>
3989:             </div>
3990:           </fieldset>
3991: 
3992:           <!-- Section: Nutrition Profile -->
3993:           <fieldset class="space-y-3">
3994:             <legend class="text-[11px] uppercase tracking-wider text-muted font-semibold mb-1" data-i18n="client.nutritionProfile">Nutrition Profile</legend>
3995:             <div>
3996:               <label class="block text-xs font-semibold mb-1" data-i18n="client.foodAllergies">Food allergies / intolerances</label>
3997:               <div class="grid grid-cols-3 gap-1.5">
3998:                 <label class="flex items-center gap-1.5 bg-surface-2 border border-border rounded-lg px-2 py-1.5 text-[11px] cursor-pointer hover:bg-border/30 transition">
3999:                   <input type="checkbox" name="allergies" value="gluten" class="accent-danger w-3 h-3" />
4000:                   <span data-i18n="client.allergyGluten">Gluten</span>
4001:                 </label>
4002:                 <label class="flex items-center gap-1.5 bg-surface-2 border border-border rounded-lg px-2 py-1.5 text-[11px] cursor-pointer hover:bg-border/30 transition">
4003:                   <input type="checkbox" name="allergies" value="lactose" class="accent-danger w-3 h-3" />
4004:                   <span data-i18n="client.allergyLactose">Lactose</span>
4005:                 </label>
4006:                 <label class="flex items-center gap-1.5 bg-surface-2 border border-border rounded-lg px-2 py-1.5 text-[11px] cursor-pointer hover:bg-border/30 transition">
4007:                   <input type="checkbox" name="allergies" value="nuts" class="accent-danger w-3 h-3" />
4008:                   <span data-i18n="client.allergyNuts">Nuts</span>
4009:                 </label>
4010:                 <label class="flex items-center gap-1.5 bg-surface-2 border border-border rounded-lg px-2 py-1.5 text-[11px] cursor-pointer hover:bg-border/30 transition">
4011:                   <input type="checkbox" name="allergies" value="seafood" class="accent-danger w-3 h-3" />

----- occurrence 2 at line 3999 -----
3985:                   <input type="checkbox" name="training_days" value="0" class="accent-primary w-3 h-3" />
3986:                   <span data-i18n="client.daySun">Sun</span>
3987:                 </label>
3988:               </div>
3989:             </div>
3990:           </fieldset>
3991: 
3992:           <!-- Section: Nutrition Profile -->
3993:           <fieldset class="space-y-3">
3994:             <legend class="text-[11px] uppercase tracking-wider text-muted font-semibold mb-1" data-i18n="client.nutritionProfile">Nutrition Profile</legend>
3995:             <div>
3996:               <label class="block text-xs font-semibold mb-1" data-i18n="client.foodAllergies">Food allergies / intolerances</label>
3997:               <div class="grid grid-cols-3 gap-1.5">
3998:                 <label class="flex items-center gap-1.5 bg-surface-2 border border-border rounded-lg px-2 py-1.5 text-[11px] cursor-pointer hover:bg-border/30 transition">
3999:                   <input type="checkbox" name="allergies" value="gluten" class="accent-danger w-3 h-3" />
4000:                   <span data-i18n="client.allergyGluten">Gluten</span>
4001:                 </label>
4002:                 <label class="flex items-center gap-1.5 bg-surface-2 border border-border rounded-lg px-2 py-1.5 text-[11px] cursor-pointer hover:bg-border/30 transition">
4003:                   <input type="checkbox" name="allergies" value="lactose" class="accent-danger w-3 h-3" />
4004:                   <span data-i18n="client.allergyLactose">Lactose</span>
4005:                 </label>
4006:                 <label class="flex items-center gap-1.5 bg-surface-2 border border-border rounded-lg px-2 py-1.5 text-[11px] cursor-pointer hover:bg-border/30 transition">
4007:                   <input type="checkbox" name="allergies" value="nuts" class="accent-danger w-3 h-3" />
4008:                   <span data-i18n="client.allergyNuts">Nuts</span>
4009:                 </label>
4010:                 <label class="flex items-center gap-1.5 bg-surface-2 border border-border rounded-lg px-2 py-1.5 text-[11px] cursor-pointer hover:bg-border/30 transition">
4011:                   <input type="checkbox" name="allergies" value="seafood" class="accent-danger w-3 h-3" />
4012:                   <span data-i18n="client.allergySeafood">Seafood</span>
4013:                 </label>
4014:                 <label class="flex items-center gap-1.5 bg-surface-2 border border-border rounded-lg px-2 py-1.5 text-[11px] cursor-pointer hover:bg-border/30 transition">

----- occurrence 3 at line 4003 -----
3989:             </div>
3990:           </fieldset>
3991: 
3992:           <!-- Section: Nutrition Profile -->
3993:           <fieldset class="space-y-3">
3994:             <legend class="text-[11px] uppercase tracking-wider text-muted font-semibold mb-1" data-i18n="client.nutritionProfile">Nutrition Profile</legend>
3995:             <div>
3996:               <label class="block text-xs font-semibold mb-1" data-i18n="client.foodAllergies">Food allergies / intolerances</label>
3997:               <div class="grid grid-cols-3 gap-1.5">
3998:                 <label class="flex items-center gap-1.5 bg-surface-2 border border-border rounded-lg px-2 py-1.5 text-[11px] cursor-pointer hover:bg-border/30 transition">
3999:                   <input type="checkbox" name="allergies" value="gluten" class="accent-danger w-3 h-3" />
4000:                   <span data-i18n="client.allergyGluten">Gluten</span>
4001:                 </label>
4002:                 <label class="flex items-center gap-1.5 bg-surface-2 border border-border rounded-lg px-2 py-1.5 text-[11px] cursor-pointer hover:bg-border/30 transition">
4003:                   <input type="checkbox" name="allergies" value="lactose" class="accent-danger w-3 h-3" />
4004:                   <span data-i18n="client.allergyLactose">Lactose</span>
4005:                 </label>
4006:                 <label class="flex items-center gap-1.5 bg-surface-2 border border-border rounded-lg px-2 py-1.5 text-[11px] cursor-pointer hover:bg-border/30 transition">
4007:                   <input type="checkbox" name="allergies" value="nuts" class="accent-danger w-3 h-3" />
4008:                   <span data-i18n="client.allergyNuts">Nuts</span>
4009:                 </label>
4010:                 <label class="flex items-center gap-1.5 bg-surface-2 border border-border rounded-lg px-2 py-1.5 text-[11px] cursor-pointer hover:bg-border/30 transition">
4011:                   <input type="checkbox" name="allergies" value="seafood" class="accent-danger w-3 h-3" />
4012:                   <span data-i18n="client.allergySeafood">Seafood</span>
4013:                 </label>
4014:                 <label class="flex items-center gap-1.5 bg-surface-2 border border-border rounded-lg px-2 py-1.5 text-[11px] cursor-pointer hover:bg-border/30 transition">
4015:                   <input type="checkbox" name="allergies" value="eggs" class="accent-danger w-3 h-3" />
4016:                   <span data-i18n="client.allergyEggs">Eggs</span>
4017:                 </label>
4018:                 <label class="flex items-center gap-1.5 bg-surface-2 border border-border rounded-lg px-2 py-1.5 text-[11px] cursor-pointer hover:bg-border/30 transition">

----- occurrence 4 at line 4007 -----
3993:           <fieldset class="space-y-3">
3994:             <legend class="text-[11px] uppercase tracking-wider text-muted font-semibold mb-1" data-i18n="client.nutritionProfile">Nutrition Profile</legend>
3995:             <div>
3996:               <label class="block text-xs font-semibold mb-1" data-i18n="client.foodAllergies">Food allergies / intolerances</label>
3997:               <div class="grid grid-cols-3 gap-1.5">
3998:                 <label class="flex items-center gap-1.5 bg-surface-2 border border-border rounded-lg px-2 py-1.5 text-[11px] cursor-pointer hover:bg-border/30 transition">
3999:                   <input type="checkbox" name="allergies" value="gluten" class="accent-danger w-3 h-3" />
4000:                   <span data-i18n="client.allergyGluten">Gluten</span>
4001:                 </label>
4002:                 <label class="flex items-center gap-1.5 bg-surface-2 border border-border rounded-lg px-2 py-1.5 text-[11px] cursor-pointer hover:bg-border/30 transition">
4003:                   <input type="checkbox" name="allergies" value="lactose" class="accent-danger w-3 h-3" />
4004:                   <span data-i18n="client.allergyLactose">Lactose</span>
4005:                 </label>
4006:                 <label class="flex items-center gap-1.5 bg-surface-2 border border-border rounded-lg px-2 py-1.5 text-[11px] cursor-pointer hover:bg-border/30 transition">
4007:                   <input type="checkbox" name="allergies" value="nuts" class="accent-danger w-3 h-3" />
4008:                   <span data-i18n="client.allergyNuts">Nuts</span>
4009:                 </label>
4010:                 <label class="flex items-center gap-1.5 bg-surface-2 border border-border rounded-lg px-2 py-1.5 text-[11px] cursor-pointer hover:bg-border/30 transition">
4011:                   <input type="checkbox" name="allergies" value="seafood" class="accent-danger w-3 h-3" />
4012:                   <span data-i18n="client.allergySeafood">Seafood</span>
4013:                 </label>
4014:                 <label class="flex items-center gap-1.5 bg-surface-2 border border-border rounded-lg px-2 py-1.5 text-[11px] cursor-pointer hover:bg-border/30 transition">
4015:                   <input type="checkbox" name="allergies" value="eggs" class="accent-danger w-3 h-3" />
4016:                   <span data-i18n="client.allergyEggs">Eggs</span>
4017:                 </label>
4018:                 <label class="flex items-center gap-1.5 bg-surface-2 border border-border rounded-lg px-2 py-1.5 text-[11px] cursor-pointer hover:bg-border/30 transition">
4019:                   <input type="checkbox" name="allergies" value="soy" class="accent-danger w-3 h-3" />
4020:                   <span data-i18n="client.allergySoy">Soy</span>
4021:                 </label>
4022:               </div>


========== MARKER: frequency ==========

----- occurrence 1 at line 3943 -----
3929:                   <span data-i18n="client.equipmentHome">Home (dumbbells only)</span>
3930:                 </label>
3931:                 <label class="flex items-center gap-2 bg-surface-2 border border-border rounded-lg px-3 py-2 text-xs cursor-pointer hover:bg-border/30 transition">
3932:                   <input type="checkbox" name="equipment" value="bodyweight" class="accent-primary w-3.5 h-3.5" />
3933:                   <span data-i18n="client.equipmentBodyweight">Bodyweight only</span>
3934:                 </label>
3935:                 <label class="flex items-center gap-2 bg-surface-2 border border-border rounded-lg px-3 py-2 text-xs cursor-pointer hover:bg-border/30 transition">
3936:                   <input type="checkbox" name="equipment" value="bands" class="accent-primary w-3.5 h-3.5" />
3937:                   <span data-i18n="client.equipmentBands">Resistance bands</span>
3938:                 </label>
3939:               </div>
3940:             </div>
3941:             <div>
3942:               <label class="block text-xs font-semibold mb-1">
3943:                 <span data-i18n="client.frequency">Training frequency (days/week)</span>
3944:                 <span id="freq-display" class="float-end text-primary-2 font-mono font-bold">3</span>
3945:               </label>
3946:               <input name="frequency" type="range" min="1" max="7" value="3" class="w-full" />
3947:             </div>
3948:             <div>
3949:               <label class="block text-xs font-semibold mb-1" data-i18n="client.split">Split preference</label>
3950:               <select name="split" class="w-full bg-surface-2 border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60 cursor-pointer">
3951:                 <option value="ppl" data-i18n="client.splitPushPullLegs">Push / Pull / Legs</option>
3952:                 <option value="upper_lower" data-i18n="client.splitUpperLower">Upper / Lower</option>
3953:                 <option value="full_body" data-i18n="client.splitFullBody">Full body</option>
3954:                 <option value="bro" data-i18n="client.splitBro">Bro split (1 muscle/day)</option>
3955:               </select>
3956:             </div>
3957:             <div>
3958:               <label class="block text-xs font-semibold mb-1" data-i18n="client.trainingDays">Training days</label>

----- occurrence 2 at line 3943 -----
3929:                   <span data-i18n="client.equipmentHome">Home (dumbbells only)</span>
3930:                 </label>
3931:                 <label class="flex items-center gap-2 bg-surface-2 border border-border rounded-lg px-3 py-2 text-xs cursor-pointer hover:bg-border/30 transition">
3932:                   <input type="checkbox" name="equipment" value="bodyweight" class="accent-primary w-3.5 h-3.5" />
3933:                   <span data-i18n="client.equipmentBodyweight">Bodyweight only</span>
3934:                 </label>
3935:                 <label class="flex items-center gap-2 bg-surface-2 border border-border rounded-lg px-3 py-2 text-xs cursor-pointer hover:bg-border/30 transition">
3936:                   <input type="checkbox" name="equipment" value="bands" class="accent-primary w-3.5 h-3.5" />
3937:                   <span data-i18n="client.equipmentBands">Resistance bands</span>
3938:                 </label>
3939:               </div>
3940:             </div>
3941:             <div>
3942:               <label class="block text-xs font-semibold mb-1">
3943:                 <span data-i18n="client.frequency">Training frequency (days/week)</span>
3944:                 <span id="freq-display" class="float-end text-primary-2 font-mono font-bold">3</span>
3945:               </label>
3946:               <input name="frequency" type="range" min="1" max="7" value="3" class="w-full" />
3947:             </div>
3948:             <div>
3949:               <label class="block text-xs font-semibold mb-1" data-i18n="client.split">Split preference</label>
3950:               <select name="split" class="w-full bg-surface-2 border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60 cursor-pointer">
3951:                 <option value="ppl" data-i18n="client.splitPushPullLegs">Push / Pull / Legs</option>
3952:                 <option value="upper_lower" data-i18n="client.splitUpperLower">Upper / Lower</option>
3953:                 <option value="full_body" data-i18n="client.splitFullBody">Full body</option>
3954:                 <option value="bro" data-i18n="client.splitBro">Bro split (1 muscle/day)</option>
3955:               </select>
3956:             </div>
3957:             <div>
3958:               <label class="block text-xs font-semibold mb-1" data-i18n="client.trainingDays">Training days</label>

----- occurrence 3 at line 3946 -----
3932:                   <input type="checkbox" name="equipment" value="bodyweight" class="accent-primary w-3.5 h-3.5" />
3933:                   <span data-i18n="client.equipmentBodyweight">Bodyweight only</span>
3934:                 </label>
3935:                 <label class="flex items-center gap-2 bg-surface-2 border border-border rounded-lg px-3 py-2 text-xs cursor-pointer hover:bg-border/30 transition">
3936:                   <input type="checkbox" name="equipment" value="bands" class="accent-primary w-3.5 h-3.5" />
3937:                   <span data-i18n="client.equipmentBands">Resistance bands</span>
3938:                 </label>
3939:               </div>
3940:             </div>
3941:             <div>
3942:               <label class="block text-xs font-semibold mb-1">
3943:                 <span data-i18n="client.frequency">Training frequency (days/week)</span>
3944:                 <span id="freq-display" class="float-end text-primary-2 font-mono font-bold">3</span>
3945:               </label>
3946:               <input name="frequency" type="range" min="1" max="7" value="3" class="w-full" />
3947:             </div>
3948:             <div>
3949:               <label class="block text-xs font-semibold mb-1" data-i18n="client.split">Split preference</label>
3950:               <select name="split" class="w-full bg-surface-2 border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60 cursor-pointer">
3951:                 <option value="ppl" data-i18n="client.splitPushPullLegs">Push / Pull / Legs</option>
3952:                 <option value="upper_lower" data-i18n="client.splitUpperLower">Upper / Lower</option>
3953:                 <option value="full_body" data-i18n="client.splitFullBody">Full body</option>
3954:                 <option value="bro" data-i18n="client.splitBro">Bro split (1 muscle/day)</option>
3955:               </select>
3956:             </div>
3957:             <div>
3958:               <label class="block text-xs font-semibold mb-1" data-i18n="client.trainingDays">Training days</label>
3959:               <div class="grid grid-cols-7 gap-1">
3960:                 <label class="flex flex-col items-center gap-0.5 bg-surface-2 border border-border rounded-lg py-1.5 text-[10px] cursor-pointer hover:bg-border/30 transition">
3961:                   <input type="checkbox" name="training_days" value="1" class="accent-primary w-3 h-3" />

----- occurrence 4 at line 6702 -----
6688:     }
6689: 
6690:     // goalBadgeClass / avatarGradient / initials are now global (moved to top-level, 2026-08 QA Sprint 2 #5).
6691: 
6692: 
6693:     /** Open the modal in create mode (empty form). */
6694:     function openCreate() {
6695:       const modal = document.getElementById('client-modal');
6696:       const form  = document.getElementById('client-form');
6697:       form.reset();
6698:       form.elements.id.value = '';
6699:       // Reset default values (form.reset doesn't reset <select> to first option reliably)
6700:       form.elements.goal.value = 'hypertrophy';
6701:       form.elements.split.value = 'ppl';
6702:       form.elements.frequency.value = 3;
6703:       document.getElementById('freq-display').textContent = '3';
6704:       // Reset new fields
6705:       if (form.elements.fitness_level) form.elements.fitness_level.value = 'beginner';
6706:       if (form.elements.training_experience) form.elements.training_experience.value = '';
6707:       if (form.elements.cuisine_pref) form.elements.cuisine_pref.value = '';
6708:       if (form.elements.budget) form.elements.budget.value = '';
6709:       if (form.elements.cook_time) form.elements.cook_time.value = '';
6710:       if (form.elements.target_weight) form.elements.target_weight.value = '';
6711:       if (form.elements.goal_weeks) form.elements.goal_weeks.value = '';
6712:       if (form.elements.stress_level) form.elements.stress_level.value = '';
6713:       if (form.elements.sleep_quality) form.elements.sleep_quality.value = '';
6714:       if (form.elements.work_hours) form.elements.work_hours.value = '';
6715:       if (form.elements.liked_foods) form.elements.liked_foods.value = '';
6716:       if (form.elements.disliked_foods) form.elements.disliked_foods.value = '';
6717:       // Body composition fields


========== MARKER: training_experience ==========

----- occurrence 1 at line 3917 -----
3903:                 <option value="rehab" data-i18n="client.goalRehab">Rehabilitation</option>
3904:               </select>
3905:             </div>
3906:             <div class="grid grid-cols-2 gap-2">
3907:               <div>
3908:                 <label class="block text-xs font-semibold mb-1" data-i18n="client.fitnessLevel">Fitness level</label>
3909:                 <select name="fitness_level" class="w-full bg-surface-2 border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60 cursor-pointer">
3910:                   <option value="beginner" data-i18n="client.levelBeginner">Beginner</option>
3911:                   <option value="intermediate" data-i18n="client.levelIntermediate">Intermediate</option>
3912:                   <option value="advanced" data-i18n="client.levelAdvanced">Advanced</option>
3913:                 </select>
3914:               </div>
3915:               <div>
3916:                 <label class="block text-xs font-semibold mb-1" data-i18n="client.trainingExperience">Experience (months)</label>
3917:                 <input name="training_experience" type="number" min="0" max="600" placeholder="0" class="w-full bg-surface-2 border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60" />
3918:               </div>
3919:             </div>
3920:             <div>
3921:               <label class="block text-xs font-semibold mb-1" data-i18n="client.equipment">Available equipment</label>
3922:               <div class="grid grid-cols-2 gap-1.5">
3923:                 <label class="flex items-center gap-2 bg-surface-2 border border-border rounded-lg px-3 py-2 text-xs cursor-pointer hover:bg-border/30 transition">
3924:                   <input type="checkbox" name="equipment" value="gym" class="accent-primary w-3.5 h-3.5" />
3925:                   <span data-i18n="client.equipmentGym">Full gym</span>
3926:                 </label>
3927:                 <label class="flex items-center gap-2 bg-surface-2 border border-border rounded-lg px-3 py-2 text-xs cursor-pointer hover:bg-border/30 transition">
3928:                   <input type="checkbox" name="equipment" value="home" class="accent-primary w-3.5 h-3.5" />
3929:                   <span data-i18n="client.equipmentHome">Home (dumbbells only)</span>
3930:                 </label>
3931:                 <label class="flex items-center gap-2 bg-surface-2 border border-border rounded-lg px-3 py-2 text-xs cursor-pointer hover:bg-border/30 transition">
3932:                   <input type="checkbox" name="equipment" value="bodyweight" class="accent-primary w-3.5 h-3.5" />

----- occurrence 2 at line 6706 -----
6692: 
6693:     /** Open the modal in create mode (empty form). */
6694:     function openCreate() {
6695:       const modal = document.getElementById('client-modal');
6696:       const form  = document.getElementById('client-form');
6697:       form.reset();
6698:       form.elements.id.value = '';
6699:       // Reset default values (form.reset doesn't reset <select> to first option reliably)
6700:       form.elements.goal.value = 'hypertrophy';
6701:       form.elements.split.value = 'ppl';
6702:       form.elements.frequency.value = 3;
6703:       document.getElementById('freq-display').textContent = '3';
6704:       // Reset new fields
6705:       if (form.elements.fitness_level) form.elements.fitness_level.value = 'beginner';
6706:       if (form.elements.training_experience) form.elements.training_experience.value = '';
6707:       if (form.elements.cuisine_pref) form.elements.cuisine_pref.value = '';
6708:       if (form.elements.budget) form.elements.budget.value = '';
6709:       if (form.elements.cook_time) form.elements.cook_time.value = '';
6710:       if (form.elements.target_weight) form.elements.target_weight.value = '';
6711:       if (form.elements.goal_weeks) form.elements.goal_weeks.value = '';
6712:       if (form.elements.stress_level) form.elements.stress_level.value = '';
6713:       if (form.elements.sleep_quality) form.elements.sleep_quality.value = '';
6714:       if (form.elements.work_hours) form.elements.work_hours.value = '';
6715:       if (form.elements.liked_foods) form.elements.liked_foods.value = '';
6716:       if (form.elements.disliked_foods) form.elements.disliked_foods.value = '';
6717:       // Body composition fields
6718:       ['body_fat_pct','visceral_fat','muscle_mass','bone_mass','water_pct','metabolic_age',
6719:        'neck_cm','shoulder_cm','chest_cm','waist_cm','hip_cm','arm_cm','thigh_cm','calf_cm'].forEach(name => {
6720:         if (form.elements[name]) form.elements[name].value = '';
6721:       });

----- occurrence 3 at line 6706 -----
6692: 
6693:     /** Open the modal in create mode (empty form). */
6694:     function openCreate() {
6695:       const modal = document.getElementById('client-modal');
6696:       const form  = document.getElementById('client-form');
6697:       form.reset();
6698:       form.elements.id.value = '';
6699:       // Reset default values (form.reset doesn't reset <select> to first option reliably)
6700:       form.elements.goal.value = 'hypertrophy';
6701:       form.elements.split.value = 'ppl';
6702:       form.elements.frequency.value = 3;
6703:       document.getElementById('freq-display').textContent = '3';
6704:       // Reset new fields
6705:       if (form.elements.fitness_level) form.elements.fitness_level.value = 'beginner';
6706:       if (form.elements.training_experience) form.elements.training_experience.value = '';
6707:       if (form.elements.cuisine_pref) form.elements.cuisine_pref.value = '';
6708:       if (form.elements.budget) form.elements.budget.value = '';
6709:       if (form.elements.cook_time) form.elements.cook_time.value = '';
6710:       if (form.elements.target_weight) form.elements.target_weight.value = '';
6711:       if (form.elements.goal_weeks) form.elements.goal_weeks.value = '';
6712:       if (form.elements.stress_level) form.elements.stress_level.value = '';
6713:       if (form.elements.sleep_quality) form.elements.sleep_quality.value = '';
6714:       if (form.elements.work_hours) form.elements.work_hours.value = '';
6715:       if (form.elements.liked_foods) form.elements.liked_foods.value = '';
6716:       if (form.elements.disliked_foods) form.elements.disliked_foods.value = '';
6717:       // Body composition fields
6718:       ['body_fat_pct','visceral_fat','muscle_mass','bone_mass','water_pct','metabolic_age',
6719:        'neck_cm','shoulder_cm','chest_cm','waist_cm','hip_cm','arm_cm','thigh_cm','calf_cm'].forEach(name => {
6720:         if (form.elements[name]) form.elements[name].value = '';
6721:       });

----- occurrence 4 at line 6758 -----
6744:       const form  = document.getElementById('client-form');
6745:       form.elements.id.value     = c.id || '';
6746:       form.elements.full_name.value = c.full_name || c.name || '';
6747:       form.elements.age.value    = c.age || '';
6748:       form.elements.weight.value = c.weight || '';
6749:       form.elements.height.value = c.height || '';
6750:       form.elements.phone.value  = c.phone || '';
6751:       form.elements.email.value  = c.email || '';
6752:       form.elements.goal.value   = c.goal || 'hypertrophy';
6753:       form.elements.split.value  = c.split || 'ppl';
6754:       form.elements.frequency.value = c.frequency || 3;
6755:       document.getElementById('freq-display').textContent = c.frequency || 3;
6756:       // New training fields
6757:       if (form.elements.fitness_level) form.elements.fitness_level.value = c.fitness_level || 'beginner';
6758:       if (form.elements.training_experience) form.elements.training_experience.value = c.training_experience || '';
6759:       // Equipment checkboxes
6760:       form.querySelectorAll('input[name="equipment"]').forEach(cb => {
6761:         cb.checked = Array.isArray(c.equipment) && c.equipment.includes(cb.value);
6762:       });
6763:       // Training days checkboxes
6764:       form.querySelectorAll('input[name="training_days"]').forEach(cb => {
6765:         cb.checked = Array.isArray(c.training_days) && c.training_days.map(String).includes(cb.value);
6766:       });
6767:       // Nutrition fields
6768:       if (form.elements.cuisine_pref) form.elements.cuisine_pref.value = c.cuisine_pref || '';
6769:       if (form.elements.budget) form.elements.budget.value = c.budget || '';
6770:       if (form.elements.cook_time) form.elements.cook_time.value = c.cook_time || '';
6771:       if (form.elements.target_weight) form.elements.target_weight.value = c.target_weight || '';
6772:       if (form.elements.goal_weeks) form.elements.goal_weeks.value = c.goal_weeks || '';
6773:       if (form.elements.stress_level) form.elements.stress_level.value = c.stress_level || '';