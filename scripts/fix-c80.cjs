#!/usr/bin/env node
/* ============================================================================
 * fix-c80.cjs — «Инструменты» (Tools) screen with 3 MuscleWiki-style calculators
 *  - Sidebar button data-nav="tools" AFTER «Питание» (nutrition) + bottom nav (6 cols)
 *  - New [data-screen="tools"]: tool switcher tabs (calorie / macro / 1rm)
 *    • Calorie calculator — revised Harris-Benedict BMR, activity multipliers,
 *      goal (lose/maintain/gain) + weekly-change slider (7700 kcal ≙ 1 kg),
 *      Lose(−10%)/Maintain/Gain(+10%) cards, metric/imperial, live hero result
 *    • Macro calculator — calories/day → C/P/F grams via preset splits
 *      (Balanced 40/30/30, Low carb 20/40/40, High protein 30/40/30, Keto
 *      5/25/70), meals/day, per-meal strip, "use calorie target" bridge, copy
 *    • 1RM calculator — Brzycki formula (reps 1–12), estimated 1RM hero,
 *      training-load zone table (Warm-up/Volume/Strength/Peak), copy chart
 *  - State persists to localStorage (dk_tools_v1); refresh hook in router
 *  - i18n: nav.tools + tools.* (~70 keys) × en/ru/he
 *  - Versions: meta c78→c80 (also fixes c79's missed meta bump), RUNNING 79→80,
 *    login footer c71→c80, sw dk-gym-v106→v107
 * ==========================================================================*/
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const FILE = path.join(ROOT, 'fitness-crm.html');
const SW = path.join(ROOT, 'sw.js');
let html = fs.readFileSync(FILE, 'utf8');
const fails = [];
let patched = 0;

function repOnce(name, anchor, replacement) {
  const idx = html.indexOf(anchor);
  if (idx === -1) { fails.push(`[${name}] anchor NOT FOUND`); return; }
  if (html.indexOf(anchor, idx + 1) !== -1) { fails.push(`[${name}] anchor NOT UNIQUE`); return; }
  html = html.slice(0, idx) + replacement + html.slice(idx + anchor.length);
  patched++;
  console.log(`OK  ${name}`);
}

/* ---------- icon (shared calculator glyph) ---------- */
const CALC_ICON = '<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2.5" width="14" height="19" rx="2.5"/><path d="M9 6.5h6"/><path d="M9 11h.01M12 11h.01M15 11h.01M9 14h.01M12 14h.01M15 14h.01M9 17h.01M12 17h.01M15 17h.01"/></svg>';

/* ============================================================
 * 1) Sidebar (desktop) — Tools button right AFTER nutrition
 * ============================================================ */
repOnce(
  'sidebar tools button',
  `            <span data-i18n="nav.nutrition">Nutrition</span>
          </button>`,
  `            <span data-i18n="nav.nutrition">Nutrition</span>
          </button>
          <button data-nav="tools" class="nav-pill w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-surface-2 transition">
            <span class="w-8 h-8 grid place-items-center rounded-lg bg-primary/15 text-primary">
              ${CALC_ICON}
            </span>
            <span data-i18n="nav.tools">Tools</span>
          </button>`
);

/* ============================================================
 * 2) Bottom nav — 6 columns + Tools after nutrition
 * ============================================================ */
repOnce(
  'bottom nav cols 5→6',
  `<div class="grid grid-cols-5 h-[var(--space-nav-h)]">`,
  `<div class="grid grid-cols-6 h-[var(--space-nav-h)]">`
);
repOnce(
  'bottom nav tools button',
  `          <span data-i18n="nav.nutrition">Nutrition</span>
        </button>`,
  `          <span data-i18n="nav.nutrition">Nutrition</span>
        </button>
        <button data-nav="tools" class="nav-pill flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold text-muted">
          <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2.5" width="14" height="19" rx="2.5"/><path d="M9 6.5h6"/><path d="M9 11h.01M12 11h.01M15 11h.01M9 14h.01M12 14h.01M15 14h.01M9 17h.01M12 17h.01M15 17h.01"/></svg>
          <span data-i18n="nav.tools">Tools</span>
        </button>`
);

/* ============================================================
 * 3) CSS — bottom nav labels ellipsis (6 items get tight on 375px)
 * ============================================================ */
repOnce(
  'bottom-nav ellipsis css',
  `    input[type="range"] {`,
  `    /* c80: 6-item bottom nav — keep labels on one line (RU «Инструменты» is long) */
    #bottom-nav .nav-pill span[data-i18n] {
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    input[type="range"] {`
);

/* ============================================================
 * 4) Tools screen HTML — before analytics screen
 * ============================================================ */
const TOOLS_SCREEN = `          <!-- =====================================================================
               TOOLS SCREEN (c80) — fitness calculators, modeled on MuscleWiki's
               tool set: Calorie calculator / Macro calculator / 1RM calculator
               ===================================================================== -->
          <div data-screen="tools" class="hidden p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full">
            <!-- Header -->
            <div class="flex items-center gap-2 mb-4">
              <h1 class="font-display font-extrabold text-xl tracking-tight" data-i18n="nav.tools">Tools</h1>
            </div>

            <!-- Tool switcher (3 tools — mirrors the MuscleWiki tools menu) -->
            <div class="flex gap-1 bg-surface-2 border border-border rounded-xl p-1 mb-4" role="tablist" aria-label="Fitness tools">
              <button type="button" data-tools-tab="calorie" role="tab" aria-selected="true" class="tools-tab flex-1 min-w-0 px-2 sm:px-3 py-2 rounded-lg text-[11px] sm:text-xs font-semibold transition truncate bg-primary text-white" data-i18n="tools.calorie">Calorie calculator</button>
              <button type="button" data-tools-tab="macro" role="tab" aria-selected="false" class="tools-tab flex-1 min-w-0 px-2 sm:px-3 py-2 rounded-lg text-[11px] sm:text-xs font-semibold transition truncate text-muted" data-i18n="tools.macro">Macro calculator</button>
              <button type="button" data-tools-tab="1rm" role="tab" aria-selected="false" class="tools-tab flex-1 min-w-0 px-2 sm:px-3 py-2 rounded-lg text-[11px] sm:text-xs font-semibold transition truncate" data-i18n="tools.oneRep">1RM calculator</button>
            </div>

            <!-- ============ Panel: Calorie calculator ============ -->
            <div data-tools-panel="calorie">
              <p class="text-sm text-muted mb-3" data-i18n="tools.calorieSubtitle">Find your daily target in under a minute.</p>

              <!-- Hero result -->
              <div class="bg-surface border border-border rounded-2xl p-4 sm:p-6 mb-4">
                <div class="flex flex-wrap items-end justify-between gap-3">
                  <div class="min-w-0">
                    <div class="text-[11px] uppercase tracking-wider text-muted font-bold mb-1" data-i18n="tools.dailyTarget">Daily target</div>
                    <div class="flex items-baseline gap-2 flex-wrap">
                      <span id="cal-hero-num" class="font-display text-4xl sm:text-5xl font-extrabold tracking-tight">2 882</span>
                      <span class="text-sm text-muted font-semibold" data-i18n="tools.kcalPerDay">kcal / day</span>
                    </div>
                  </div>
                  <span id="cal-hero-goal" class="shrink-0 px-3 py-1.5 rounded-full bg-success/15 text-success text-xs font-bold">Maintain</span>
                </div>

                <div class="grid sm:grid-cols-2 gap-2 sm:gap-3 mt-4">
                  <div class="bg-surface-2 border border-border rounded-xl px-4 py-3">
                    <div class="text-[11px] uppercase tracking-wider text-muted font-bold" data-i18n="tools.bmrLabel">BMR</div>
                    <div class="flex items-baseline gap-1.5 mt-0.5">
                      <span id="cal-bmr" class="text-xl font-extrabold">1 859</span>
                      <span class="text-[11px] text-muted" data-i18n="tools.kcalPerDay">kcal / day</span>
                    </div>
                  </div>
                  <div class="bg-surface-2 border border-border rounded-xl px-4 py-3">
                    <div class="flex items-center justify-between gap-2">
                      <div class="text-[11px] uppercase tracking-wider text-muted font-bold" data-i18n="tools.maintenanceLabel">Maintenance</div>
                      <div class="flex items-baseline gap-1">
                        <span id="cal-tdee" class="text-xl font-extrabold">2 882</span>
                        <span class="text-[11px] text-muted">kcal</span>
                      </div>
                    </div>
                    <div class="flex items-center gap-2 mt-2">
                      <span class="text-[10px] text-muted font-semibold whitespace-nowrap" data-i18n="tools.weeklyChange">Weekly change</span>
                      <input id="cal-weekly" type="range" min="0" max="1" step="0.05" value="0.25" class="flex-1 min-w-0 accent-primary" aria-label="Weekly change" />
                      <span id="cal-weekly-label" class="text-[10px] text-muted whitespace-nowrap">0.25 kg / wk</span>
                    </div>
                  </div>
                </div>

                <div class="grid grid-cols-3 gap-2 mt-3">
                  <button type="button" data-cal-quick="lose" class="bg-surface-2 hover:bg-border/40 border border-border rounded-xl px-2 py-2.5 text-center transition">
                    <div class="text-[10px] uppercase tracking-wide text-muted font-bold" data-i18n="tools.lose">Lose</div>
                    <div class="text-sm font-extrabold mt-0.5"><span id="cal-lose">2 594</span> <span class="text-[10px] text-muted font-semibold">kcal</span></div>
                  </button>
                  <button type="button" data-cal-quick="maintain" class="bg-surface-2 hover:bg-border/40 border border-border rounded-xl px-2 py-2.5 text-center transition">
                    <div class="text-[10px] uppercase tracking-wide text-muted font-bold" data-i18n="tools.maintain">Maintain</div>
                    <div class="text-sm font-extrabold mt-0.5"><span id="cal-maintain">2 882</span> <span class="text-[10px] text-muted font-semibold">kcal</span></div>
                  </button>
                  <button type="button" data-cal-quick="gain" class="bg-surface-2 hover:bg-border/40 border border-border rounded-xl px-2 py-2.5 text-center transition">
                    <div class="text-[10px] uppercase tracking-wide text-muted font-bold" data-i18n="tools.gain">Gain</div>
                    <div class="text-sm font-extrabold mt-0.5"><span id="cal-gain">3 170</span> <span class="text-[10px] text-muted font-semibold">kcal</span></div>
                  </button>
                </div>

                <p class="text-[11px] text-muted mt-3">
                  <span data-i18n="tools.basedOn">Based on</span> <b data-i18n="tools.formulaHB">Harris-Benedict</b> · <span data-i18n="tools.adjustNote">Adjust after 2–3 weeks</span>
                </p>

                <details class="mt-2">
                  <summary class="text-xs font-semibold text-primary cursor-pointer select-none" data-i18n="tools.howCalculated">How this is calculated</summary>
                  <p class="text-xs text-muted mt-2 leading-relaxed" data-i18n="tools.disclosure">We estimate your Basal Metabolic Rate (BMR) with the Harris-Benedict equation, multiply it by your activity level to get maintenance calories, then apply your goal to set the daily target.</p>
                </details>
              </div>

              <!-- Your details -->
              <div class="bg-surface border border-border rounded-2xl p-4 sm:p-6">
                <h3 class="font-display font-bold text-sm text-muted uppercase tracking-wider mb-3" data-i18n="tools.yourDetails">Your details</h3>
                <div class="grid sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label class="text-xs font-semibold text-muted block mb-1" data-i18n="tools.sex">Sex</label>
                    <div class="flex bg-surface-2 border border-border rounded-lg p-0.5" role="group">
                      <button type="button" data-cal-sex="male" class="cal-sex flex-1 px-3 py-1.5 rounded-md text-xs font-semibold transition bg-primary text-white" data-i18n="tools.male">Male</button>
                      <button type="button" data-cal-sex="female" class="cal-sex flex-1 px-3 py-1.5 rounded-md text-xs font-semibold transition text-muted" data-i18n="tools.female">Female</button>
                    </div>
                  </div>
                  <div>
                    <label class="text-xs font-semibold text-muted block mb-1" data-i18n="tools.units">Units</label>
                    <div class="flex bg-surface-2 border border-border rounded-lg p-0.5" role="group">
                      <button type="button" data-cal-units="metric" class="cal-units flex-1 px-3 py-1.5 rounded-md text-xs font-semibold transition bg-primary text-white" data-i18n="tools.metric">Metric</button>
                      <button type="button" data-cal-units="imperial" class="cal-units flex-1 px-3 py-1.5 rounded-md text-xs font-semibold transition text-muted" data-i18n="tools.imperial">Imperial</button>
                    </div>
                  </div>
                  <div>
                    <div class="flex items-center justify-between mb-1">
                      <label class="text-xs font-semibold text-muted" data-i18n="tools.age">Age</label>
                      <div class="flex items-center gap-1.5">
                        <input id="cal-age-n" type="number" min="13" max="80" step="1" value="32" class="w-16 bg-surface-2 border border-border rounded-lg px-2 py-1 text-sm text-right" />
                        <span class="text-[11px] text-muted" data-i18n="tools.years">yr</span>
                      </div>
                    </div>
                    <input id="cal-age-r" type="range" min="13" max="80" step="1" value="32" class="w-full accent-primary" aria-label="Age" />
                  </div>
                  <div>
                    <div class="flex items-center justify-between mb-1">
                      <label class="text-xs font-semibold text-muted" data-i18n="tools.height">Height</label>
                      <div class="flex items-center gap-1.5">
                        <input id="cal-height-n" type="number" min="120" max="220" step="1" value="178" class="w-16 bg-surface-2 border border-border rounded-lg px-2 py-1 text-sm text-right" />
                        <span id="cal-height-unit" class="text-[11px] text-muted w-7">cm</span>
                      </div>
                    </div>
                    <input id="cal-height-r" type="range" min="120" max="220" step="1" value="178" class="w-full accent-primary" aria-label="Height" />
                  </div>
                  <div>
                    <div class="flex items-center justify-between mb-1">
                      <label class="text-xs font-semibold text-muted" data-i18n="tools.weight">Weight</label>
                      <div class="flex items-center gap-1.5">
                        <input id="cal-weight-n" type="number" min="30" max="300" step="1" value="82" class="w-16 bg-surface-2 border border-border rounded-lg px-2 py-1 text-sm text-right" />
                        <span id="cal-weight-unit" class="text-[11px] text-muted w-7">kg</span>
                      </div>
                    </div>
                    <input id="cal-weight-r" type="range" min="30" max="300" step="1" value="82" class="w-full accent-primary" aria-label="Weight" />
                  </div>
                  <div>
                    <label class="text-xs font-semibold text-muted block mb-1" data-i18n="tools.activityLevel">Activity level</label>
                    <select id="cal-activity" class="w-full bg-surface-2 border border-border rounded-lg px-2 py-1.5 text-sm">
                      <option value="sedentary" data-i18n="tools.actSedentary">Sedentary — little or no exercise</option>
                      <option value="light" data-i18n="tools.actLight">Lightly active — exercise 1–3 days/week</option>
                      <option value="moderate" selected data-i18n="tools.actModerate">Moderately active — exercise 3–5 days/week</option>
                      <option value="active" data-i18n="tools.actActive">Very active — hard exercise 6–7 days/week</option>
                      <option value="very_active" data-i18n="tools.actVeryActive">Extra active — very hard exercise + physical job</option>
                    </select>
                  </div>
                </div>

                <div class="mt-4">
                  <label class="text-xs font-semibold text-muted block mb-1.5" data-i18n="tools.goal">Goal</label>
                  <div class="grid grid-cols-3 gap-2" role="group">
                    <button type="button" data-cal-goal="lose" class="cal-goal flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl border transition text-xs font-semibold bg-primary text-white">
                      <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 18l-9.5-9.5-5 5L1 6"/><path d="M17 18h6v-6"/></svg>
                      <span data-i18n="tools.goalLose">Lose fat</span>
                    </button>
                    <button type="button" data-cal-goal="maintain" class="cal-goal flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl border transition text-xs font-semibold bg-surface-2 border-border text-muted">
                      <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/></svg>
                      <span data-i18n="tools.goalMaintain">Maintain</span>
                    </button>
                    <button type="button" data-cal-goal="gain" class="cal-goal flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl border transition text-xs font-semibold bg-surface-2 border-border text-muted">
                      <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 6l-9.5 9.5-5-5L1 18"/><path d="M17 6h6v6"/></svg>
                      <span data-i18n="tools.goalGain">Build muscle</span>
                    </button>
                  </div>
                </div>

                <button id="cal-calc-btn" type="button" class="mt-4 w-full bg-primary hover:bg-primary-2 text-white font-semibold text-sm py-2.5 rounded-xl transition shadow-card" data-i18n="tools.calculateTarget">Calculate target</button>
              </div>
            </div>

            <!-- ============ Panel: Macro calculator ============ -->
            <div data-tools-panel="macro" class="hidden">
              <p class="text-sm text-muted mb-3" data-i18n="tools.macroSubtitle">Turn calories into a plan you can follow.</p>

              <!-- Hero: daily macro stack -->
              <div class="bg-surface border border-border rounded-2xl p-4 sm:p-6 mb-4">
                <div class="flex flex-wrap items-end justify-between gap-3">
                  <div class="min-w-0">
                    <div class="text-[11px] uppercase tracking-wider text-muted font-bold mb-1" data-i18n="tools.dailyMacroStack">Daily macro stack</div>
                    <div class="flex items-baseline gap-2">
                      <span id="mac-kcal" class="font-display text-4xl sm:text-5xl font-extrabold tracking-tight">2 000</span>
                      <span class="text-sm text-muted font-semibold" data-i18n="tools.unitKcal">kcal</span>
                    </div>
                  </div>
                  <button id="mac-copy" type="button" class="shrink-0 bg-surface-2 hover:bg-border/40 border border-border text-xs font-semibold px-3 py-2 rounded-lg transition inline-flex items-center gap-1.5">
                    <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                    <span data-i18n="tools.copyTargets">Copy targets</span>
                  </button>
                </div>

                <div class="mt-4 space-y-3">
                  <div>
                    <div class="flex items-center justify-between text-xs mb-1 gap-2">
                      <span class="font-bold whitespace-nowrap"><span class="inline-block w-2.5 h-2.5 rounded-full bg-warning mr-1.5 align-middle"></span><span data-i18n="tools.carbs">Carbs</span></span>
                      <span class="text-muted text-[11px] text-right"><b id="mac-carb-g">200 g</b> · <span id="mac-carb-kcal">800 kcal</span> · <span id="mac-carb-pct">40%</span></span>
                    </div>
                    <div class="h-2.5 bg-surface-2 rounded-full overflow-hidden"><div id="mac-carb-bar" class="h-full bg-warning rounded-full transition-all duration-300" style="width:40%"></div></div>
                    <div class="text-[10px] text-muted mt-0.5"><span data-i18n="tools.perMeal">per meal</span>: <span id="mac-carb-meal">67 g</span></div>
                  </div>
                  <div>
                    <div class="flex items-center justify-between text-xs mb-1 gap-2">
                      <span class="font-bold whitespace-nowrap"><span class="inline-block w-2.5 h-2.5 rounded-full bg-accent mr-1.5 align-middle"></span><span data-i18n="tools.protein">Protein</span></span>
                      <span class="text-muted text-[11px] text-right"><b id="mac-prot-g">150 g</b> · <span id="mac-prot-kcal">600 kcal</span> · <span id="mac-prot-pct">30%</span></span>
                    </div>
                    <div class="h-2.5 bg-surface-2 rounded-full overflow-hidden"><div id="mac-prot-bar" class="h-full bg-accent rounded-full transition-all duration-300" style="width:30%"></div></div>
                    <div class="text-[10px] text-muted mt-0.5"><span data-i18n="tools.perMeal">per meal</span>: <span id="mac-prot-meal">50 g</span></div>
                  </div>
                  <div>
                    <div class="flex items-center justify-between text-xs mb-1 gap-2">
                      <span class="font-bold whitespace-nowrap"><span class="inline-block w-2.5 h-2.5 rounded-full bg-danger mr-1.5 align-middle"></span><span data-i18n="tools.fat">Fat</span></span>
                      <span class="text-muted text-[11px] text-right"><b id="mac-fat-g">67 g</b> · <span id="mac-fat-kcal">600 kcal</span> · <span id="mac-fat-pct">30%</span></span>
                    </div>
                    <div class="h-2.5 bg-surface-2 rounded-full overflow-hidden"><div id="mac-fat-bar" class="h-full bg-danger rounded-full transition-all duration-300" style="width:30%"></div></div>
                    <div class="text-[10px] text-muted mt-0.5"><span data-i18n="tools.perMeal">per meal</span>: <span id="mac-fat-meal">22 g</span></div>
                  </div>
                </div>
              </div>

              <!-- Plan settings -->
              <div class="bg-surface border border-border rounded-2xl p-4 sm:p-6">
                <h3 class="font-display font-bold text-sm text-muted uppercase tracking-wider mb-3" data-i18n="tools.planSettings">Plan settings</h3>
                <div class="flex items-center gap-2 mb-4 flex-wrap">
                  <label class="text-xs font-semibold text-muted" data-i18n="tools.calPerDay">Calories per day</label>
                  <input id="mac-cal" type="number" min="800" max="6000" step="10" value="2000" class="w-24 bg-surface-2 border border-border rounded-lg px-2 py-1.5 text-sm text-right" />
                  <span class="text-[11px] text-muted" data-i18n="tools.unitKcal">kcal</span>
                  <button id="mac-use-target" type="button" class="text-[11px] font-semibold text-primary hover:underline" data-i18n="tools.useCalorieTarget">Use calorie target</button>
                </div>

                <label class="text-xs font-semibold text-muted block mb-1.5" data-i18n="tools.macroSplit">Macro split (C / P / F)</label>
                <div class="grid sm:grid-cols-2 gap-2 mb-4" role="group">
                  <button type="button" data-mac-split="balanced" class="mac-split px-3 py-2 rounded-lg border text-xs font-semibold transition text-left bg-primary text-white" data-i18n="tools.splitBalanced">Balanced · 40/30/30</button>
                  <button type="button" data-mac-split="low_carb" class="mac-split px-3 py-2 rounded-lg border text-xs font-semibold transition text-left bg-surface-2 border-border text-muted" data-i18n="tools.splitLowCarb">Low carb · 20/40/40</button>
                  <button type="button" data-mac-split="high_protein" class="mac-split px-3 py-2 rounded-lg border text-xs font-semibold transition text-left bg-surface-2 border-border text-muted" data-i18n="tools.splitHighProtein">High protein · 30/40/30</button>
                  <button type="button" data-mac-split="keto" class="mac-split px-3 py-2 rounded-lg border text-xs font-semibold transition text-left bg-surface-2 border-border text-muted" data-i18n="tools.splitKeto">Ketogenic · 5/25/70</button>
                </div>

                <div class="flex items-center gap-3">
                  <label class="text-xs font-semibold text-muted" data-i18n="tools.mealsPerDay">Meals per day</label>
                  <div class="flex items-center bg-surface-2 border border-border rounded-lg p-0.5" role="group">
                    <button id="mac-meals-minus" type="button" class="w-7 h-7 grid place-items-center rounded-md hover:bg-border/40 font-bold transition" aria-label="−">−</button>
                    <span id="mac-meals" class="w-8 text-center text-sm font-bold">3</span>
                    <button id="mac-meals-plus" type="button" class="w-7 h-7 grid place-items-center rounded-md hover:bg-border/40 font-bold transition" aria-label="+">+</button>
                  </div>
                </div>
              </div>
            </div>

            <!-- ============ Panel: 1RM calculator ============ -->
            <div data-tools-panel="1rm" class="hidden">
              <p class="text-sm text-muted mb-3" data-i18n="tools.rmSubtitle">Estimate your strength and choose smarter training loads.</p>

              <div class="bg-warning/10 border border-warning/30 text-warning rounded-xl px-4 py-3 text-xs font-semibold mb-4" data-i18n="tools.rmWarning">⚠️ Always warm up properly and use a spotter for heavy attempts.</div>

              <div class="grid lg:grid-cols-2 gap-4">
                <!-- Inputs + result -->
                <div class="bg-surface border border-border rounded-2xl p-4 sm:p-6">
                  <div class="flex bg-surface-2 border border-border rounded-lg p-0.5 mb-4 w-fit" role="group">
                    <button type="button" data-rm-units="metric" class="rm-units px-3 py-1.5 rounded-md text-xs font-bold transition bg-primary text-white">kg</button>
                    <button type="button" data-rm-units="imperial" class="rm-units px-3 py-1.5 rounded-md text-xs font-bold transition text-muted">lbs</button>
                  </div>

                  <div class="mb-3">
                    <div class="flex items-center justify-between mb-1">
                      <label class="text-xs font-semibold text-muted" data-i18n="tools.weightLifted">Weight lifted</label>
                      <span id="rm-weight-unit" class="text-[11px] text-muted">kg</span>
                    </div>
                    <input id="rm-weight-n" type="number" min="1" max="500" step="1" value="100" class="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-right" />
                  </div>
                  <div class="mb-4">
                    <div class="flex items-center justify-between mb-1">
                      <label class="text-xs font-semibold text-muted" data-i18n="tools.repsDone">Reps performed</label>
                      <input id="rm-reps-n" type="number" min="1" max="12" step="1" value="5" class="w-16 bg-surface-2 border border-border rounded-lg px-2 py-1 text-sm text-right" />
                    </div>
                    <input id="rm-reps-r" type="range" min="1" max="12" step="1" value="5" class="w-full accent-primary" aria-label="Reps" />
                  </div>

                  <div class="bg-surface-2 border border-border rounded-xl px-4 py-4 text-center">
                    <div class="text-[11px] uppercase tracking-wider text-muted font-bold" data-i18n="tools.rmResult">Your estimated 1RM</div>
                    <div class="flex items-baseline justify-center gap-1.5 mt-1">
                      <span id="rm-result" class="font-display text-4xl font-extrabold tracking-tight">120</span>
                      <span id="rm-unit" class="text-sm text-muted font-semibold">kg</span>
                    </div>
                  </div>
                  <p class="text-[10px] text-muted mt-2 text-center leading-relaxed" data-i18n="tools.brzyckiNote">Brzycki formula · estimate only — use a spotter for heavy attempts.</p>
                </div>

                <!-- Training zones -->
                <div class="bg-surface border border-border rounded-2xl p-4 sm:p-6">
                  <div class="flex items-center justify-between gap-2 mb-1">
                    <h3 class="font-display font-bold text-sm text-muted uppercase tracking-wider" data-i18n="tools.trainingZones">Training zones</h3>
                    <button id="rm-copy" type="button" class="bg-surface-2 hover:bg-border/40 border border-border text-[11px] font-semibold px-2.5 py-1.5 rounded-lg transition inline-flex items-center gap-1.5 shrink-0">
                      <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                      <span data-i18n="tools.copyChart">Copy chart</span>
                    </button>
                  </div>
                  <p class="text-[11px] text-muted mb-3" data-i18n="tools.zonesNote">Use these percentages to plan training loads based on your estimated 1RM.</p>
                  <div id="rm-zones" class="divide-y divide-border/60 max-h-[420px] overflow-y-auto"></div>
                </div>
              </div>
            </div>
          </div>

`;
repOnce(
  'tools screen html',
  `          <div data-screen="analytics" class="hidden p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full">`,
  TOOLS_SCREEN + `          <div data-screen="analytics" class="hidden p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full">`
);

/* ============================================================
 * 5) Router refresh hook
 * ============================================================ */
repOnce(
  'router refresh hook',
  `      if (name === 'settings') {
        safe('settings', () => {`,
  `      if (name === 'tools' && screens.tools) {
        safe('tools', () => screens.tools.refresh());
      }
      if (name === 'settings') {
        safe('settings', () => {`
);

/* ============================================================
 * 6) screens.tools JS module — before screens.nutrition
 * ============================================================ */
const TOOLS_JS = `  /* =====================================================================
     TOOLS SCREEN (c80) — MuscleWiki-style fitness calculators.
     • Calorie: revised Harris-Benedict BMR × activity multiplier; goal delta
       from a weekly-change slider (7700 kcal ≙ 1 kg of body mass);
       Lose/Maintain/Gain cards at ∓10% TDEE (MuscleWiki numbers).
     • Macro: calories/day → C/P/F grams via preset splits + meals/day.
     • 1RM: Brzycki (w × 36 / (37 − reps), reps 1–12) + load-zone table.
     State persists to localStorage (dk_tools_v1); router re-renders on
     language switch via refreshCurrent hook.
     ===================================================================== */
  screens.tools = (function () {
    var LS_KEY = 'dk_tools_v1';
    var SPLITS = { balanced: [40, 30, 30], low_carb: [20, 40, 40], high_protein: [30, 40, 30], keto: [5, 25, 70] };
    var ACTIVITY = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9 };
    var RM_ROWS = [
      [100, 1, 'peak'], [95, 2, 'peak'], [90, 4, 'strength'], [85, 6, 'strength'],
      [80, 8, 'strength'], [75, 10, 'volume'], [70, 12, 'volume'], [65, 15, 'volume'],
      [60, 18, 'warmup'], [55, 20, 'warmup'], [50, 24, 'warmup']
    ];
    var S = {
      tab: 'calorie',
      cal: { sex: 'male', units: 'metric', age: 32, h: 178, w: 82, activity: 'moderate', goal: 'maintain', weekly: 0.25 },
      macro: { cal: 2000, split: 'balanced', meals: 3 },
      rm: { units: 'metric', w: 100, reps: 5 }
    };
    var _wired = false;

    function $(id) { return document.getElementById(id); }
    function on(id, ev, fn) { var el = $(id); if (el) el.addEventListener(ev, fn); }
    function clamp(v, a, b) { v = Number(v); if (!isFinite(v)) v = a; return Math.min(b, Math.max(a, v)); }
    function fmt(n) {
      try { return Math.round(n).toLocaleString(currentLang() === 'he' ? 'he-IL' : (currentLang() === 'ru' ? 'ru-RU' : 'en-US')); }
      catch (e) { return String(Math.round(n)); }
    }
    function fmt1(n) {
      var v = Math.round(n * 100) / 100;
      try { return v.toLocaleString(currentLang() === 'he' ? 'he-IL' : (currentLang() === 'ru' ? 'ru-RU' : 'en-US')); }
      catch (e) { return String(v); }
    }
    /* localized string (global t()) */
    function t0(key) { return window.t ? window.t(key) : key; }

    /* ---------- persistence ---------- */
    function save() { try { localStorage.setItem(LS_KEY, JSON.stringify(S)); } catch (e) { /* private mode */ } }
    function deepMerge(dst, src) {
      Object.keys(src || {}).forEach(function (k) { if (k in dst) dst[k] = src[k]; });
    }
    function load() {
      try {
        var raw = localStorage.getItem(LS_KEY);
        if (!raw) return;
        var o = JSON.parse(raw) || {};
        if (o.cal) deepMerge(S.cal, o.cal);
        if (o.macro) deepMerge(S.macro, o.macro);
        if (o.rm) deepMerge(S.rm, o.rm);
        if (o.tab && ['calorie', 'macro', '1rm'].indexOf(o.tab) !== -1) S.tab = o.tab;
      } catch (e) { /* corrupted row → defaults */ }
    }

    /* ---------- calorie math (revised Harris-Benedict) ---------- */
    function calModel() {
      var c = S.cal;
      var kg = c.units === 'metric' ? c.w : c.w / 2.20462;
      var cm = c.units === 'metric' ? c.h : c.h * 2.54;
      var bmr = c.sex === 'male'
        ? 88.362 + 13.397 * kg + 4.799 * cm - 5.677 * c.age
        : 447.593 + 9.247 * kg + 3.098 * cm - 4.330 * c.age;
      bmr = Math.max(500, bmr);
      /* round only at TDEE (MuscleWiki parity: 1859.4 × 1.55 = 2882.07 → 2882) */
      var tdee = Math.round(bmr * (ACTIVITY[c.activity] || 1.55));
      var wk = c.goal === 'maintain' ? 0 : clamp(c.weekly || 0, 0, 1);
      var delta = Math.round(wk * 1100); /* 7700 kcal per kg ÷ 7 days */
      var target = c.goal === 'lose' ? tdee - delta : (c.goal === 'gain' ? tdee + delta : tdee);
      target = Math.max(1000, target);
      return { bmr: Math.round(bmr), tdee: tdee, target: target, lose: Math.round(tdee * 0.9), gain: Math.round(tdee * 1.1), wk: wk };
    }

    /* ---------- segmented control helper ---------- */
    function seg(sel, attr, val) {
      document.querySelectorAll(sel).forEach(function (b) {
        var active = b.getAttribute(attr) === val;
        b.classList.toggle('bg-primary', active);
        b.classList.toggle('text-white', active);
        b.classList.toggle('text-muted', !active);
      });
    }

    /* ---------- unit helpers ---------- */
    function hRange() { return S.cal.units === 'metric' ? [120, 220] : [47, 87]; }
    function wRange() { return S.cal.units === 'metric' ? [30, 300] : [66, 660]; }

    function switchUnits(to) {
      if (S.cal.units === to) return;
      var toImp = to === 'imperial';
      S.cal.h = Math.round(toImp ? S.cal.h / 2.54 : S.cal.h * 2.54);
      S.cal.w = Math.round(toImp ? S.cal.w * 2.20462 : S.cal.w / 2.20462);
      S.cal.units = to;
      S.cal.h = clamp(S.cal.h, hRange()[0], hRange()[1]);
      S.cal.w = clamp(S.cal.w, wRange()[0], wRange()[1]);
      save();
      renderCal();
    }

    /* ---------- calorie panel ---------- */
    function renderCal() {
      var m = calModel();
      var metric = S.cal.units === 'metric';
      $('cal-hero-num').textContent = fmt(m.target);
      $('cal-bmr').textContent = fmt(m.bmr);
      $('cal-tdee').textContent = fmt(m.tdee);
      $('cal-lose').textContent = fmt(m.lose);
      $('cal-maintain').textContent = fmt(m.tdee);
      $('cal-gain').textContent = fmt(m.gain);
      var goalKey = S.cal.goal === 'lose' ? 'tools.goalLose' : (S.cal.goal === 'gain' ? 'tools.goalGain' : 'tools.goalMaintain');
      $('cal-hero-goal').textContent = t0(goalKey);
      var wUnit = metric ? t0('tools.kg') : t0('tools.lbs');
      $('cal-height-unit').textContent = metric ? t0('tools.cm') : t0('tools.inch');
      $('cal-weight-unit').textContent = wUnit;
      var wkDisp = metric ? m.wk : m.wk * 2.20462;
      $('cal-weekly-label').textContent = S.cal.goal === 'maintain'
        ? '—'
        : '≈ ' + fmt1(wkDisp) + ' ' + wUnit + ' / ' + t0('tools.perWeek');
      /* inputs */
      var hs = $('cal-height-r'), ws = $('cal-weight-r');
      hs.min = hRange()[0]; hs.max = hRange()[1];
      ws.min = wRange()[0]; ws.max = wRange()[1];
      hs.value = Math.round(S.cal.h); ws.value = Math.round(S.cal.w);
      $('cal-height-n').value = Math.round(S.cal.h);
      $('cal-weight-n').value = Math.round(S.cal.w);
      $('cal-age-r').value = S.cal.age; $('cal-age-n').value = S.cal.age;
      $('cal-weekly').value = S.cal.weekly;
      $('cal-activity').value = S.cal.activity;
      seg('.cal-sex', 'data-cal-sex', S.cal.sex);
      seg('.cal-units', 'data-cal-units', S.cal.units);
      seg('.cal-goal', 'data-cal-goal', S.cal.goal);
    }

    /* ---------- macro panel ---------- */
    function setMacro(pre, g, kcal, pct, meals) {
      $('mac-' + pre + '-g').textContent = fmt(g) + ' g';
      $('mac-' + pre + '-kcal').textContent = fmt(kcal) + ' kcal';
      $('mac-' + pre + '-pct').textContent = Math.round(pct) + '%';
      $('mac-' + pre + '-meal').textContent = fmt(g / meals) + ' g';
      $('mac-' + pre + '-bar').style.width = pct + '%';
    }
    function renderMacro() {
      var mc = S.macro;
      var sp = SPLITS[mc.split] || SPLITS.balanced;
      var kcal = clamp(mc.cal, 800, 6000);
      var meals = clamp(mc.meals, 1, 8);
      var carbG = Math.round(kcal * sp[0] / 100 / 4);
      var protG = Math.round(kcal * sp[1] / 100 / 4);
      var fatG = Math.round(kcal * sp[2] / 100 / 9);
      $('mac-kcal').textContent = fmt(kcal);
      setMacro('carb', carbG, kcal * sp[0] / 100, sp[0], meals);
      setMacro('prot', protG, kcal * sp[1] / 100, sp[1], meals);
      setMacro('fat', fatG, kcal * sp[2] / 100, sp[2], meals);
      $('mac-cal').value = Math.round(kcal);
      $('mac-meals').textContent = meals;
      seg('.mac-split', 'data-mac-split', mc.split);
    }

    /* ---------- 1RM panel ---------- */
    function rm1() { return S.rm.w * 36 / (37 - clamp(S.rm.reps, 1, 12)); }
    function renderRM() {
      var metric = S.rm.units === 'metric';
      var unit = metric ? t0('tools.kg') : t0('tools.lbs');
      $('rm-unit').textContent = unit;
      $('rm-weight-unit').textContent = unit;
      $('rm-result').textContent = fmt(rm1());
      $('rm-reps-n').value = S.rm.reps;
      $('rm-reps-r').value = S.rm.reps;
      $('rm-weight-n').value = S.rm.w;
      $('rm-weight-n').min = metric ? 1 : 2;
      $('rm-weight-n').max = metric ? 500 : 1100;
      seg('.rm-units', 'data-rm-units', S.rm.units);
      var zoneCls = {
        warmup: 'text-muted bg-muted/15',
        volume: 'text-success bg-success/15',
        strength: 'text-warning bg-warning/15',
        peak: 'text-danger bg-danger/15'
      };
      var one = rm1();
      var rows = RM_ROWS.map(function (row) {
        var pct = row[0], reps = row[1], zone = row[2];
        var w = one * pct / 100;
        var wTxt = (Math.round(w * 10) / 10).toLocaleString(currentLang() === 'he' ? 'he-IL' : (currentLang() === 'ru' ? 'ru-RU' : 'en-US'));
        var repsTxt = reps + ' ' + (reps === 1 ? t0('tools.repUnit') : t0('tools.repsUnit'));
        return '<div class="flex items-center gap-2 px-1 py-1.5">' +
          '<span class="text-xs font-bold w-9 shrink-0">' + pct + '%</span>' +
          '<span class="text-sm font-semibold flex-1 min-w-0 truncate">' + wTxt + ' <span class="text-[10px] text-muted">' + unit + '</span></span>' +
          '<span class="text-[10px] text-muted whitespace-nowrap">' + repsTxt + '</span>' +
          '<span class="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full shrink-0 ' + zoneCls[zone] + '">' + t0('tools.zone_' + zone) + '</span>' +
          '</div>';
      }).join('');
      $('rm-zones').innerHTML = rows;
    }

    /* ---------- clipboard ---------- */
    function fallbackCopy(txt) {
      var ta = document.createElement('textarea');
      ta.value = txt;
      ta.style.cssText = 'position:fixed;opacity:0;left:-999px;top:0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch (e) { /* noop */ }
      document.body.removeChild(ta);
    }
    function copyText(txt, msg) {
      var done = function () { try { toast(msg, 'success'); } catch (e) { /* noop */ } };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(txt).then(done, function () { fallbackCopy(txt); done(); });
      } else { fallbackCopy(txt); done(); }
    }
    function macroText() {
      var mc = S.macro;
      var sp = SPLITS[mc.split] || SPLITS.balanced;
      var kcal = clamp(mc.cal, 800, 6000);
      var meals = clamp(mc.meals, 1, 8);
      var cG = Math.round(kcal * sp[0] / 100 / 4), pG = Math.round(kcal * sp[1] / 100 / 4), fG = Math.round(kcal * sp[2] / 100 / 9);
      return t0('tools.dailyMacroStack') + ' — ' + fmt(kcal) + ' ' + t0('tools.unitKcal') + '\\n' +
        t0('tools.carbs') + ': ' + cG + ' g (' + Math.round(kcal * sp[0] / 100) + ' kcal · ' + sp[0] + '%)\\n' +
        t0('tools.protein') + ': ' + pG + ' g (' + Math.round(kcal * sp[1] / 100) + ' kcal · ' + sp[1] + '%)\\n' +
        t0('tools.fat') + ': ' + fG + ' g (' + Math.round(kcal * sp[2] / 100) + ' kcal · ' + sp[2] + '%)\\n' +
        meals + ' × ' + t0('tools.perMeal') + ': ' + t0('tools.carbs') + ' ' + Math.round(cG / meals) + ' g · ' +
        t0('tools.protein') + ' ' + Math.round(pG / meals) + ' g · ' + t0('tools.fat') + ' ' + Math.round(fG / meals) + ' g';
    }
    function chartText() {
      var unit = S.rm.units === 'metric' ? t0('tools.kg') : t0('tools.lbs');
      var head = t0('tools.trainingZones') + ' (1RM = ' + fmt(rm1()) + ' ' + unit + ')';
      var lines = RM_ROWS.map(function (row) {
        return row[0] + '% — ' + (Math.round(rm1() * row[0] / 10) / 10) + ' ' + unit + ' — ' + row[1] + ' ' + t0('tools.repsUnit') + ' — ' + t0('tools.zone_' + row[2]);
      });
      return head + '\\n' + lines.join('\\n');
    }

    /* ---------- wheel guard (c77 parity: no silent self-changes) ---------- */
    function wheelGuard(id) {
      var el = $(id);
      if (!el) return;
      el.addEventListener('wheel', function (e) {
        if (document.activeElement === el) { e.preventDefault(); try { el.blur(); } catch (err) { /* noop */ } }
      }, { passive: false });
    }

    /* ---------- wiring ---------- */
    function bindNum(rid, nid, apply) {
      var r = $(rid), n = $(nid);
      if (r) r.addEventListener('input', function () { n.value = r.value; apply(Number(r.value)); });
      if (n) n.addEventListener('input', function () { var v = Number(n.value); if (isFinite(v)) { r.value = v; apply(v); } });
      if (n) n.addEventListener('change', function () {
        var v = Number(n.value);
        if (!isFinite(v)) { renderCal(); renderRM(); return; }
        n.value = v; apply(v);
      });
    }

    function wire() {
      if (_wired) return;
      _wired = true;
      /* tabs */
      document.querySelectorAll('[data-tools-tab]').forEach(function (b) {
        b.addEventListener('click', function () { S.tab = b.getAttribute('data-tools-tab'); save(); syncTabs(); });
      });
      /* calorie segmented controls */
      document.querySelectorAll('.cal-sex').forEach(function (b) {
        b.addEventListener('click', function () { S.cal.sex = b.getAttribute('data-cal-sex'); save(); renderCal(); });
      });
      document.querySelectorAll('.cal-units').forEach(function (b) {
        b.addEventListener('click', function () { switchUnits(b.getAttribute('data-cal-units')); });
      });
      document.querySelectorAll('.cal-goal').forEach(function (b) {
        b.addEventListener('click', function () { S.cal.goal = b.getAttribute('data-cal-goal'); save(); renderCal(); });
      });
      document.querySelectorAll('[data-cal-quick]').forEach(function (b) {
        b.addEventListener('click', function () { S.cal.goal = b.getAttribute('data-cal-quick'); save(); renderCal(); });
      });
      bindNum('cal-age-r', 'cal-age-n', function (v) {
        S.cal.age = clamp(v, 13, 80); save(); renderCal();
      });
      bindNum('cal-height-r', 'cal-height-n', function (v) {
        S.cal.h = clamp(v, hRange()[0], hRange()[1]); save(); renderCal();
      });
      bindNum('cal-weight-r', 'cal-weight-n', function (v) {
        S.cal.w = clamp(v, wRange()[0], wRange()[1]); save(); renderCal();
      });
      on('cal-weekly', 'input', function (e) { S.cal.weekly = Number(e.target.value); save(); renderCal(); });
      on('cal-activity', 'change', function (e) { S.cal.activity = e.target.value; save(); renderCal(); });
      on('cal-calc-btn', 'click', function () {
        renderCal();
        var hero = $('cal-hero-num');
        if (hero && hero.animate) { try { hero.animate([{ opacity: 0.35 }, { opacity: 1 }], { duration: 320 }); } catch (e) { /* noop */ } }
        try { toast(t0('tools.targetSet') + ' ' + fmt(calModel().target) + ' ' + t0('tools.unitKcal'), 'success'); } catch (e) { /* noop */ }
      });
      /* macro */
      on('mac-cal', 'input', function (e) { var v = Number(e.target.value); if (isFinite(v)) { S.macro.cal = v; save(); renderMacro(); } });
      on('mac-cal', 'change', function () { S.macro.cal = clamp(S.macro.cal, 800, 6000); save(); renderMacro(); });
      document.querySelectorAll('.mac-split').forEach(function (b) {
        b.addEventListener('click', function () { S.macro.split = b.getAttribute('data-mac-split'); save(); renderMacro(); });
      });
      on('mac-meals-minus', 'click', function () { S.macro.meals = clamp(S.macro.meals - 1, 1, 8); save(); renderMacro(); });
      on('mac-meals-plus', 'click', function () { S.macro.meals = clamp(S.macro.meals + 1, 1, 8); save(); renderMacro(); });
      on('mac-use-target', 'click', function () {
        S.macro.cal = calModel().target; save(); renderMacro();
        try { toast(t0('tools.targetSet') + ' ' + fmt(S.macro.cal) + ' ' + t0('tools.unitKcal'), 'success'); } catch (e) { /* noop */ }
      });
      on('mac-copy', 'click', function () { copyText(macroText(), t0('tools.copied')); });
      /* 1RM */
      document.querySelectorAll('.rm-units').forEach(function (b) {
        b.addEventListener('click', function () {
          var to = b.getAttribute('data-rm-units');
          if (S.rm.units === to) return;
          S.rm.w = Math.round(to === 'imperial' ? S.rm.w * 2.20462 : S.rm.w / 2.20462);
          S.rm.units = to;
          S.rm.w = clamp(S.rm.w, to === 'metric' ? 1 : 2, to === 'metric' ? 500 : 1100);
          save(); renderRM();
        });
      });
      on('rm-weight-n', 'input', function (e) { var v = Number(e.target.value); if (isFinite(v) && v > 0) { S.rm.w = v; save(); renderRM(); } });
      on('rm-weight-n', 'change', function () {
        var max = S.rm.units === 'metric' ? 500 : 1100;
        if (!isFinite(S.rm.w) || S.rm.w < 1) S.rm.w = 1;
        S.rm.w = clamp(S.rm.w, 1, max); save(); renderRM();
      });
      bindNum('rm-reps-r', 'rm-reps-n', function (v) { S.rm.reps = clamp(Math.round(v), 1, 12); save(); renderRM(); });
      on('rm-copy', 'click', function () { copyText(chartText(), t0('tools.chartCopied')); });
      /* wheel guards */
      ['cal-weekly', 'cal-age-r', 'cal-height-r', 'cal-weight-r', 'rm-reps-r'].forEach(wheelGuard);
    }

    function syncTabs() {
      document.querySelectorAll('[data-tools-tab]').forEach(function (b) {
        var active = b.getAttribute('data-tools-tab') === S.tab;
        b.classList.toggle('bg-primary', active);
        b.classList.toggle('text-white', active);
        b.classList.toggle('text-muted', !active);
        b.setAttribute('aria-selected', active ? 'true' : 'false');
      });
      document.querySelectorAll('[data-tools-panel]').forEach(function (p) {
        p.classList.toggle('hidden', p.getAttribute('data-tools-panel') !== S.tab);
      });
    }

    function refresh() {
      load();
      if (!_wired) wire();
      syncTabs();
      renderCal();
      renderMacro();
      renderRM();
    }

    return { refresh: refresh };
  })();

`;
repOnce(
  'screens.tools module',
  `  screens.nutrition = (function () {`,
  TOOLS_JS + `  screens.nutrition = (function () {`
);

/* ============================================================
 * 7) Version bumps
 * ============================================================ */
repOnce(
  'meta dk-build c78→c80',
  `<meta name="dk-build" content="c78" />`,
  `<meta name="dk-build" content="c80" />`
);
repOnce(
  'RUNNING 79→80',
  `  var RUNNING = 79; /* numeric part of dk-build c79 */`,
  `  var RUNNING = 80; /* numeric part of dk-build c80 */`
);
repOnce(
  'login footer c71→c80',
  `3 languages · c71</p>`,
  `3 languages · c80</p>`
);

/* ---------- sanity ---------- */
[
  'data-nav="tools"', 'data-screen="tools"', 'data-tools-tab="1rm"',
  "screens.tools = (function", "screens.tools.refresh()",
  'grid-cols-6 h-[var(--space-nav-h)]', 'id="cal-hero-num"', 'id="mac-kcal"',
  'id="rm-zones"', 'dk_tools_v1', 'Harris-Benedict', 'nav.tools',
  'content="c80"', 'var RUNNING = 80'
].forEach(s => { if (html.indexOf(s) === -1) fails.push('missing after patch: ' + s); });
if (count('data-nav="tools"') !== 2) fails.push('expected 2 data-nav="tools" (sidebar+bottom), got ' + count('data-nav="tools"'));

function count(s) { let n = 0, i = 0; while ((i = html.indexOf(s, i)) !== -1) { n++; i += s.length; } return n; }

if (fails.length) { console.error('FAILURES:\n' + fails.join('\n')); process.exit(1); }
fs.writeFileSync(FILE, html);
console.log('WROTE', FILE, '(' + html.length + ' chars), edits:', patched);

/* ============================================================
 * 8) i18n dictionaries — nav.tools + tools.* × en/ru/he
 * ============================================================ */
const TOOLS_I18N = {
  en: {
    nav: { tools: 'Tools' },
    tools: {
      calorie: 'Calorie calculator', macro: 'Macro calculator', oneRep: '1RM calculator',
      calorieSubtitle: 'Find your daily target in under a minute.',
      dailyTarget: 'Daily target', kcalPerDay: 'kcal / day', unitKcal: 'kcal',
      bmrLabel: 'BMR', maintenanceLabel: 'Maintenance',
      weeklyChange: 'Weekly change', perWeek: 'week',
      lose: 'Lose', maintain: 'Maintain', gain: 'Gain',
      basedOn: 'Based on', formulaHB: 'Harris-Benedict', adjustNote: 'Adjust after 2–3 weeks',
      howCalculated: 'How this is calculated',
      disclosure: 'We estimate your Basal Metabolic Rate (BMR) with the Harris-Benedict equation, multiply it by your activity level to get maintenance calories, then apply your goal to set the daily target.',
      yourDetails: 'Your details',
      sex: 'Sex', male: 'Male', female: 'Female',
      units: 'Units', metric: 'Metric', imperial: 'Imperial',
      age: 'Age', years: 'yr', height: 'Height', weight: 'Weight',
      cm: 'cm', kg: 'kg', inch: 'in', lbs: 'lbs',
      activityLevel: 'Activity level',
      actSedentary: 'Sedentary — little or no exercise',
      actLight: 'Lightly active — exercise 1–3 days/week',
      actModerate: 'Moderately active — exercise 3–5 days/week',
      actActive: 'Very active — hard exercise 6–7 days/week',
      actVeryActive: 'Extra active — very hard exercise + physical job',
      goal: 'Goal', goalLose: 'Lose fat', goalMaintain: 'Maintain', goalGain: 'Build muscle',
      calculateTarget: 'Calculate target', targetSet: 'Daily target:',
      macroSubtitle: 'Turn calories into a plan you can follow.',
      dailyMacroStack: 'Daily macro stack',
      carbs: 'Carbs', protein: 'Protein', fat: 'Fat', perMeal: 'per meal',
      copyTargets: 'Copy targets', copied: 'Copied to clipboard',
      planSettings: 'Plan settings', calPerDay: 'Calories per day',
      useCalorieTarget: 'Use calorie target',
      macroSplit: 'Macro split (C / P / F)',
      splitBalanced: 'Balanced · 40/30/30', splitLowCarb: 'Low carb · 20/40/40',
      splitHighProtein: 'High protein · 30/40/30', splitKeto: 'Ketogenic · 5/25/70',
      mealsPerDay: 'Meals per day',
      rmSubtitle: 'Estimate your strength and choose smarter training loads.',
      rmWarning: '⚠️ Always warm up properly and use a spotter for heavy attempts.',
      weightLifted: 'Weight lifted', repsDone: 'Reps performed',
      rmResult: 'Your estimated 1RM',
      trainingZones: 'Training zones',
      zonesNote: 'Use these percentages to plan training loads based on your estimated 1RM.',
      zone_warmup: 'Warm-up', zone_volume: 'Volume', zone_strength: 'Strength', zone_peak: 'Peak',
      repUnit: 'rep', repsUnit: 'reps',
      copyChart: 'Copy chart', chartCopied: 'Load chart copied',
      brzyckiNote: 'Brzycki formula · estimate only — use a spotter for heavy attempts.'
    }
  },
  ru: {
    nav: { tools: 'Инструменты' },
    tools: {
      calorie: 'Калькулятор калорий', macro: 'Калькулятор макронутриентов', oneRep: 'Калькулятор 1RM',
      calorieSubtitle: 'Найдите дневную цель за одну минуту.',
      dailyTarget: 'Дневная цель', kcalPerDay: 'ккал / день', unitKcal: 'ккал',
      bmrLabel: 'BMR', maintenanceLabel: 'Поддержание',
      weeklyChange: 'Изменение в неделю', perWeek: 'нед.',
      lose: 'Похудение', maintain: 'Поддержание', gain: 'Набор',
      basedOn: 'На основе', formulaHB: 'Харриса-Бенедикта', adjustNote: 'Скорректируйте через 2–3 недели',
      howCalculated: 'Как это рассчитывается',
      disclosure: 'Мы оцениваем базовый метаболизм (BMR) по уравнению Харриса-Бенедикта, умножаем его на уровень активности и получаем калории поддержания, затем применяем вашу цель для расчёта дневной нормы.',
      yourDetails: 'Ваши данные',
      sex: 'Пол', male: 'Мужской', female: 'Женский',
      units: 'Единицы', metric: 'Метрическая', imperial: 'Имперская',
      age: 'Возраст', years: 'лет', height: 'Рост', weight: 'Вес',
      cm: 'см', kg: 'кг', inch: 'дюйм', lbs: 'фунт',
      activityLevel: 'Уровень активности',
      actSedentary: 'Малоподвижный — почти без нагрузок',
      actLight: 'Лёгкая активность — 1–3 дня в неделю',
      actModerate: 'Умеренная — нагрузки 3–5 дней в неделю',
      actActive: 'Высокая — интенсивные нагрузки 6–7 дней',
      actVeryActive: 'Экстрим — спорт + физическая работа',
      goal: 'Цель', goalLose: 'Сжечь жир', goalMaintain: 'Поддержание', goalGain: 'Набрать мышцы',
      calculateTarget: 'Рассчитать цель', targetSet: 'Дневная цель:',
      macroSubtitle: 'Превратите калории в план, которому легко следовать.',
      dailyMacroStack: 'Дневной набор макросов',
      carbs: 'Углеводы', protein: 'Белки', fat: 'Жиры', perMeal: 'за приём',
      copyTargets: 'Копировать цели', copied: 'Скопировано в буфер обмена',
      planSettings: 'Настройки плана', calPerDay: 'Калорий в день',
      useCalorieTarget: 'Взять цель по калориям',
      macroSplit: 'Распределение (У / Б / Ж)',
      splitBalanced: 'Сбалансированное · 40/30/30', splitLowCarb: 'Низкоуглеводное · 20/40/40',
      splitHighProtein: 'Высокобелковое · 30/40/30', splitKeto: 'Кетогенное · 5/25/70',
      mealsPerDay: 'Приёмов пищи в день',
      rmSubtitle: 'Оцените свою силу и подбирайте разумные рабочие веса.',
      rmWarning: '⚠️ Всегда делайте полноценную разминку и используйте страховку при тяжёлых подходах.',
      weightLifted: 'Поднятый вес', repsDone: 'Выполненные повторения',
      rmResult: 'Ваш предполагаемый 1RM',
      trainingZones: 'Тренировочные зоны',
      zonesNote: 'Используйте эти проценты для планирования нагрузок на основе предполагаемого 1RM.',
      zone_warmup: 'Разминка', zone_volume: 'Объём', zone_strength: 'Сила', zone_peak: 'Пик',
      repUnit: 'повт.', repsUnit: 'повт.',
      copyChart: 'Копировать таблицу', chartCopied: 'Таблица нагрузок скопирована',
      brzyckiNote: 'Формула Бржицкого · только оценка — используйте страховку при тяжёлых весах.'
    }
  },
  he: {
    nav: { tools: 'כלים' },
    tools: {
      calorie: 'מחשבון קלוריות', macro: 'מחשבון מקרו-נוטריאנטים', oneRep: 'מחשבון 1RM',
      calorieSubtitle: 'מצא את יעד היומי שלך בפחות מדקה.',
      dailyTarget: 'יעד יומי', kcalPerDay: 'קק״ל / יום', unitKcal: 'קק״ל',
      bmrLabel: 'BMR', maintenanceLabel: 'אחזקה',
      weeklyChange: 'שינוי שבועי', perWeek: 'שבוע',
      lose: 'ירידה', maintain: 'אחזקה', gain: 'עלייה',
      basedOn: 'מבוסס על', formulaHB: 'האריס-בנדיקט', adjustNote: 'כוונן לאחר 2–3 שבועות',
      howCalculated: 'איך זה מחושב',
      disclosure: 'אנו מעריכים את קצב חילוף החומרים הבזלי (BMR) באמצעות משוואת האריס-בנדיקט, מכפילים אותו ברמת הפעילות לקבלת קלוריות אחזקה, ומיישמים את המטרה שלך להגדרת היעד היומי.',
      yourDetails: 'הפרטים שלך',
      sex: 'מין', male: 'זכר', female: 'נקבה',
      units: 'יחידות', metric: 'מטרי', imperial: 'אימפריאלי',
      age: 'גיל', years: 'שנים', height: 'גובה', weight: 'משקל',
      cm: 'ס״מ', kg: 'ק״ג', inch: 'אינץ׳', lbs: 'פאונד',
      activityLevel: 'רמת פעילות',
      actSedentary: 'יושבת — כמעט ללא פעילות',
      actLight: 'פעילות קלה — 1–3 ימים בשבוע',
      actModerate: 'בינונית — אימונים 3–5 ימים בשבוע',
      actActive: 'גבוהה — אימונים אינטנסיביים 6–7 ימים',
      actVeryActive: 'אינטנסיבית מאוד — ספורט + עבודה פיזית',
      goal: 'מטרה', goalLose: 'שריפת שומן', goalMaintain: 'אחזקה', goalGain: 'בניית שריר',
      calculateTarget: 'חשב יעד', targetSet: 'יעד יומי:',
      macroSubtitle: 'הפוך קלוריות לתוכנית שקל לעקוב אחריה.',
      dailyMacroStack: 'סל המקרו היומי',
      carbs: 'פחמימות', protein: 'חלבון', fat: 'שומן', perMeal: 'לארוחה',
      copyTargets: 'העתק יעדים', copied: 'הועתק ללוח',
      planSettings: 'הגדרות תוכנית', calPerDay: 'קלוריות ביום',
      useCalorieTarget: 'השתמש ביעד הקלוריות',
      macroSplit: 'חלוקה (פ / ח / ש)',
      splitBalanced: 'מאוזן · 40/30/30', splitLowCarb: 'דל פחמימות · 20/40/40',
      splitHighProtein: 'עתיר חלבון · 30/40/30', splitKeto: 'קטוגני · 5/25/70',
      mealsPerDay: 'ארוחות ביום',
      rmSubtitle: 'העריך את הכוח שלך ובחר עומסים חכמים.',
      rmWarning: '⚠️ תמיד התחמם כראוי והשתמש בליווי בניסיונות משקל כבדים.',
      weightLifted: 'משקל שהורם', repsDone: 'חזרות שבוצעו',
      rmResult: 'ה-1RM המשוער שלך',
      trainingZones: 'אזורי אימון',
      zonesNote: 'השתמש באחוזים האלה לתכנון עומסי אימון על בסיס ה-1RM המשוער.',
      zone_warmup: 'חימום', zone_volume: 'נפח', zone_strength: 'כוח', zone_peak: 'שיא',
      repUnit: 'חזרה', repsUnit: 'חזרות',
      copyChart: 'העתק טבלה', chartCopied: 'טבלת העומסים הועתקה',
      brzyckiNote: 'נוסחת בז׳יצקי · הערכה בלבד — השתמש בליווי במשקלים כבדים.'
    }
  }
};

['en', 'ru', 'he'].forEach(function (lang) {
  const p = path.join(ROOT, 'src', 'i18n', lang + '.json');
  const d = JSON.parse(fs.readFileSync(p, 'utf8'));
  Object.assign(d.nav, TOOLS_I18N[lang].nav);
  d.tools = TOOLS_I18N[lang].tools;
  fs.writeFileSync(p, JSON.stringify(d, null, 2) + '\n');
  console.log('OK  i18n ' + lang + '.json — nav.tools + tools.* (' + Object.keys(d.tools).length + ' keys)');
});

/* ============================================================
 * 9) sw.js — v106 → v107
 * ============================================================ */
let sw = fs.readFileSync(SW, 'utf8');
const swLineRe = /const CACHE_NAME = 'dk-gym-v\d+';.*$/m;
if (!swLineRe.test(sw)) { console.error('sw.js: CACHE_NAME line not found'); process.exit(1); }
sw = sw.replace(swLineRe, "const CACHE_NAME = 'dk-gym-v107'; // v107: c80 — Tools screen (sidebar+bottom nav after Nutrition): MuscleWiki-style Calorie calculator (Harris-Benedict, activity, goal+weekly slider, ∓10% cards, metric/imperial), Macro calculator (preset splits 40/30/30|20/40/40|30/40/30|5/25/70, meals/day, per-meal strip, copy, use-calorie-target bridge), 1RM calculator (Brzycki, load-zone table Warm-up/Volume/Strength/Peak, copy chart); localStorage persistence + i18n RU/HE/EN; meta dk-build repaired (c79 left c78)");
fs.writeFileSync(SW, sw);
console.log('WROTE', SW, '(dk-gym-v107)');

console.log('\nDONE — c80 patch applied cleanly.');
