/* c204 test - nutrition rebuilt as a plan dashboard (markup, CSS, data flow, i18n). */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const crm = fs.readFileSync(path.join(root, 'fitness-crm.html'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'src', 'nutrition-dashboard.css'), 'utf8');
const copy = fs.readFileSync(path.join(root, 'scripts', 'copy-assets.js'), 'utf8');
let pass = 0, fail = 0;
function ok(name, cond) { if (cond) { pass++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name); } }

function extractFn(src, name) {
  let start = src.indexOf('function ' + name + '(');
  if (start < 0) throw new Error('function not found: ' + name);
  if (start >= 6 && src.slice(start - 6, start) === 'async ') start -= 6;
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

/* ---------- structure ---------- */
ok('nutrition screen uses the new dashboard width', crm.indexOf('<div data-screen="nutrition" class="hidden p-4 sm:p-6 lg:p-8 max-w-[1600px]') >= 0);
ok('two-column dashboard shell', crm.indexOf('class="nutri-dash"') >= 0 && crm.indexOf('class="nutri-main"') >= 0 && crm.indexOf('class="nutri-rail"') >= 0);
ok('glass shell + right rail cards', crm.indexOf('class="nutri-shell"') >= 0 && crm.indexOf('nutri-side-card nutri-day-card') >= 0 && crm.indexOf('nutri-side-card nutri-food-card') >= 0 && crm.indexOf('nutri-side-card nutri-progress-card') >= 0);
ok('header mark + title + eyebrow', crm.indexOf('nutri-head-mark') >= 0 && crm.indexOf('nutrition.osEyebrow') >= 0 && crm.indexOf('nutrition.dashboardTitle') >= 0 && crm.indexOf('nutrition.planSubtitle') >= 0);
ok('five tabs (plan/products/recipes/templates/history)', ['log', 'database', 'recipes', 'templates', 'history'].every(t => crm.indexOf('data-nutrition-tab="' + t + '"') >= 0) && (crm.match(/<button[^>]*data-nutrition-tab="/g) || []).length === 5);
ok('five matching panels', ['log', 'database', 'recipes', 'templates', 'history'].every(t => crm.indexOf('data-nutrition-panel="' + t + '"') >= 0));
ok('client selector + client summary card', crm.indexOf('id="nutrition-client-select"') >= 0 && crm.indexOf('id="nutri-client-name"') >= 0 && crm.indexOf('id="nutri-client-goal"') >= 0 && crm.indexOf('id="nutri-client-weight"') >= 0);
ok('week navigation + seven-day strip', crm.indexOf('id="nutri-week-prev"') >= 0 && crm.indexOf('id="nutri-week-next"') >= 0 && crm.indexOf('id="nutri-week-calendar"') >= 0 && crm.indexOf('id="nutri-week-today"') >= 0 && crm.indexOf('id="nutri-week-days"') >= 0);
ok('macro strip + compact meal list + total bar', crm.indexOf('id="nutri-macro-cards"') >= 0 && crm.indexOf('id="nutrition-meals"') >= 0 && crm.indexOf('id="total-cal"') >= 0 && crm.indexOf('id="nutri-total-fill"') >= 0);
ok('coach recommendations + popular recipes', crm.indexOf('nutrition.recommendations') >= 0 && crm.indexOf('id="nutri-popular-recipes"') >= 0);
ok('right rail: ring, chart, food preview, progress, quote', crm.indexOf('id="nutri-day-ring"') >= 0 && crm.indexOf('id="nutri-week-chart"') >= 0 && crm.indexOf('id="nutri-food-preview"') >= 0 && crm.indexOf('id="nutri-progress-metrics"') >= 0 && crm.indexOf('nutrition.quote') >= 0);
ok('recipes tab has create/search/grid/empty', crm.indexOf('id="nutrition-recipe-create"') >= 0 && crm.indexOf('id="nutrition-recipe-search"') >= 0 && crm.indexOf('id="nutrition-recipes-grid"') >= 0 && crm.indexOf('id="nutrition-recipes-empty"') >= 0);
ok('templates tab has header/add/list/empty', crm.indexOf('id="nutrition-template-add-btn"') >= 0 && crm.indexOf('id="nutrition-templates-list"') >= 0 && crm.indexOf('id="nutrition-templates-empty"') >= 0 && crm.indexOf('id="nutrition-template-empty-add"') >= 0);
ok('history tab has summary/list/empty', crm.indexOf('id="nutrition-history-summary"') >= 0 && crm.indexOf('id="nutrition-history-list"') >= 0 && crm.indexOf('id="nutrition-history-empty"') >= 0);
ok('old page-head / old tab bar removed from nutrition', crm.indexOf('<div data-screen="nutrition"') >= 0 && crm.slice(crm.indexOf('<div data-screen="nutrition"'), crm.indexOf('data-nutrition-panel="log"')).indexOf('v2-page-head') < 0 && crm.indexOf('class="nutrition-tab-btn') < 0);

/* ---------- styles ---------- */
ok('dashboard CSS exists and is linked', fs.existsSync(path.join(root, 'src', 'nutrition-dashboard.css')) && crm.indexOf('href="src/nutrition-dashboard.css"') >= 0);
ok('CSS ships in copy-assets', copy.indexOf("'src/nutrition-dashboard.css'") >= 0);
ok('two-column grid with a wider 372px rail', css.indexOf('.nutri-dash {') >= 0 && css.indexOf('grid-template-columns: minmax(0, 1fr) 372px') >= 0);
ok('light-mode shell overrides', css.indexOf('[data-mode="light"] .nutri-dash') >= 0 && css.indexOf('[data-mode="light"] .nutri-shell') >= 0);
ok('macro tones + rings', css.indexOf('--nutri-protein:') >= 0 && css.indexOf('--nutri-carbs:') >= 0 && css.indexOf('--nutri-fat:') >= 0 && css.indexOf('.nutri-macro-ring') >= 0 && css.indexOf('conic-gradient') >= 0);
ok('compact meal row grid + done state', css.indexOf('.nutri-meal-row') >= 0 && css.indexOf('grid-template-areas') >= 0 && css.indexOf('.nutri-meal-check.done') >= 0);
ok('right rail day ring + trend chart', css.indexOf('.nutri-day-ring') >= 0 && css.indexOf('.nutri-week-chart') >= 0 && css.indexOf('.nutri-progress-figure') >= 0);
ok('responsive rail stack + mobile meal layout', css.indexOf('@media (max-width: 1180px)') >= 0 && css.indexOf('@media (max-width: 720px)') >= 0 && css.indexOf('grid-template-areas: "thumb copy check" "thumb nutrition check"') >= 0);
ok('recipe/template grids sized for the shell', css.indexOf('repeat(auto-fill, minmax(210px, 1fr))') >= 0 && css.indexOf('repeat(auto-fill, minmax(230px, 1fr))') >= 0);
ok('reduced motion respected', css.indexOf('prefers-reduced-motion') >= 0);

/* ---------- data flow ---------- */
const loadFoods = extractFn(crm, 'loadFoodCatalog');
ok('food rail reads reference DB + local store', loadFoods.indexOf("db.all('food_base')") >= 0 && loadFoods.indexOf("db.all('food_database')") >= 0 && loadFoods.indexOf('dkNormalizeFood') >= 0);
ok('food rail does not leak recipes into products', extractFn(crm, 'renderFoodPreview').indexOf("f.source === 'recipe'") >= 0);
ok('history query uses the real by_clientId index', crm.indexOf("db.find('nutrition_history', 'by_clientId', _clientId)") >= 0 && crm.indexOf("'byClientId'") < 0);
const rendHist = extractFn(crm, 'renderHistory');
ok('history derives from loaded _history and real meal items', rendHist.indexOf('(_history || [])') >= 0 && rendHist.indexOf("(r.meals || []).some") >= 0 && rendHist.indexOf('historyTotals(r)') >= 0 && rendHist.indexOf('data-nutri-history') >= 0);
const rendRec = extractFn(crm, 'renderRecipes');
ok('recipes filtered by source=recipe + live search/count', rendRec.indexOf("f.source === 'recipe'") >= 0 && rendRec.indexOf('_recipeSearch') >= 0 && rendRec.indexOf('nutrition-recipes-count') >= 0);
const rendMacro = extractFn(crm, 'renderMacroCards');
ok('macro cards show consumed + of-target without clipping', rendMacro.indexOf('nutri-macro-copy') >= 0 && rendMacro.indexOf("t('nutrition.of')") >= 0 && rendMacro.indexOf('<em>') >= 0 && rendMacro.indexOf('nutri-macro-ring') >= 0);
const saveLog = extractFn(crm, 'saveLog');
ok('saveLog keeps the in-memory history fresh', saveLog.indexOf('_history[idx] = _log') >= 0 && saveLog.indexOf('_history.push(_log)') >= 0);
const addMeal = extractFn(crm, 'addCustomMeal');
ok('custom meals persist with done state', addMeal.indexOf('_log.meals.push') >= 0 && addMeal.indexOf('await saveLog()') >= 0 && crm.indexOf('meal.done = !meal.done') >= 0);
const addFood = extractFn(crm, 'addPendingToMeal');
ok('add-food targets the selected meal index', addFood.indexOf('parseInt(mealSel?.value, 10)') >= 0 && addFood.indexOf('_log.meals[mealIdx]') >= 0);
const rendWeek = extractFn(crm, 'renderWeek');
ok('week renderer uses weekN + local day keys + day buttons', rendWeek.indexOf("t('nutrition.weekN'") >= 0 && rendWeek.indexOf('nutri-daybtn') >= 0 && rendWeek.indexOf('logDateKey') >= 0);
const wire = extractFn(crm, 'wireDashboard');
ok('dashboard wiring: weeks, today, days, food rail, recipes, history', wire.indexOf('shiftWeek(-1)') >= 0 && wire.indexOf('shiftWeek(1)') >= 0 && wire.indexOf('gotoToday()') >= 0 && wire.indexOf('nutri-week-days') >= 0 && wire.indexOf('nutri-food-preview') >= 0 && wire.indexOf('nutrition-recipe-search') >= 0 && wire.indexOf('nutrition-history-list') >= 0);
const prog = extractFn(crm, 'renderBodyProgress');
ok('progress uses real client fields + adherence', prog.indexOf('target_weight') >= 0 && prog.indexOf('body_fat_pct') >= 0 && prog.indexOf('waist_cm') >= 0 && prog.indexOf('planAdherence') >= 0);
ok('food cache stays in sync after create/edit', crm.indexOf('function cacheFood(') >= 0 && crm.indexOf('cacheFood(Object.assign({}, item, savedRecipe || {}))') >= 0 && crm.indexOf('cacheFood(Object.assign({}, obj, saved || {}))') >= 0);
ok('tabs wired for all five panels + refresh hooks', crm.indexOf("document.querySelectorAll('.nutri-tab')") >= 0 && crm.indexOf("if (tab === 'recipes'") >= 0 && crm.indexOf("if (tab === 'history'") >= 0);

/* ---------- i18n ---------- */
const required = ['tabPlan', 'tabProducts', 'tabRecipes', 'tabHistory', 'tabTemplates', 'osEyebrow', 'dashboardTitle', 'planSubtitle', 'selectClientTitle', 'dailyPlan', 'balanced', 'needsBalance', 'dayTotal', 'adviceEyebrow', 'recommendations', 'recipesEyebrow', 'popularRecipes', 'seeAll', 'noRecipesTitle', 'historyEyebrow', 'noHistoryTitle', 'statsEyebrow', 'dailyStats', 'of', 'weeklyIntake', 'baseEyebrow', 'foodBase', 'searchProduct', 'progressEyebrow', 'progressTitle', 'details', 'quote', 'weekN', 'mealAdded', 'chooseClientFirst', 'noMeals', 'markDone', 'markPending', 'bodyFat', 'waist', 'planAdherence', 'targetWeight', 'catVegetables', 'catFruits', 'catMeat', 'catFish', 'catGrains', 'catDairy', 'recipeQuinoa', 'recipeSalmon', 'recipePancakes', 'minShort', 'daysLogged', 'avgCalories', 'avgProtein', 'templatesEyebrow', 'noTemplatesTitle'];
for (const lang of ['en', 'ru', 'he']) {
  const dict = JSON.parse(fs.readFileSync(path.join(root, 'src', 'i18n', lang + '.json'), 'utf8'));
  const miss = required.filter(k => !dict.nutrition || typeof dict.nutrition[k] !== 'string' || !dict.nutrition[k].length);
  const bad = required.filter(k => dict.nutrition && /\?{2,}/.test(dict.nutrition[k] || ''));
  ok(lang + ': all c204 keys present', miss.length === 0);
  ok(lang + ': no corrupted c204 values', bad.length === 0);
  ok(lang + ': client active label present', !!(dict.clients && dict.clients.active));
}
const ru = JSON.parse(fs.readFileSync(path.join(root, 'src', 'i18n', 'ru.json'), 'utf8'));
const he = JSON.parse(fs.readFileSync(path.join(root, 'src', 'i18n', 'he.json'), 'utf8'));
ok('Russian dashboard copy is Cyrillic', /[\u0400-\u04FF]/.test(ru.nutrition.tabPlan) && /[\u0400-\u04FF]/.test(ru.nutrition.weeklyIntake));
ok('Hebrew dashboard copy is Hebrew', /[\u0590-\u05FF]/.test(he.nutrition.tabPlan) && /[\u0590-\u05FF]/.test(he.nutrition.weeklyIntake));

/* ---------- versions ---------- */
ok('trainer build is c210', crm.indexOf('<meta name="dk-build" content="c210" />') >= 0);
ok('RUNNING is 203', crm.indexOf('var RUNNING = 210;') >= 0);
ok('sidebar/login show c205', crm.indexOf('id="v2-side-version">c210') >= 0 && crm.indexOf('3 languages · c210') >= 0);
ok('service worker cache is v232', sw.indexOf("CACHE_NAME = 'dk-gym-v237'") >= 0);
ok('service worker documents v232', sw.indexOf('// v232: c205') >= 0);
ok('service worker precaches the dashboard CSS', sw.indexOf("'./src/nutrition-dashboard.css'") >= 0);

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
