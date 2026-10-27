# c203 - Nutrition dashboard rebuild

## What changed

The nutrition screen is no longer a daily-log bento. It is now a full plan
dashboard in the same visual language as the reference screens:

- **Two-column dashboard**: a glass plan shell plus a 342 px right rail.
- **Plan header**: nutrition mark, eyebrow, "Meal plan" title, subtitle and five
  pill tabs: Plan, Products, Recipes, Templates, History.
- **Client header**: client switcher, avatar/photo or initials, goal, weight,
  height, age and active status, all from the real client record.
- **Week navigation**: ISO week label, date range, previous/next week arrows and
  a native date picker and a Today shortcut. EN/RU weeks start Monday; Hebrew
  weeks start Sunday.
- **Seven-day strip**: real logged-day buttons, active/today states and the
  selected day drive the same `nutrition_history` record.
- **Macro strip**: calories, protein, carbs and fat with consumed value, target,
  percentage and compact conic ring. Macro tones stay stable in every theme:
  protein violet, carbs amber, fat blue; calories use the theme primary.
- **Compact meal rows**: time badge, dish photo, meal name, food chips with
  real product images and grams, calories + P/C/F, done toggle and add-food.
  Rows are editable: delete a chip, add food to that meal, or add a custom meal.
- **Day total bar**: calories, macros and a target progress bar.
- **Recommendations + popular recipes** panels under the plan.
- **Right rail**: daily stats ring and macro bars, weekly intake chart with the
  target line, curated product-base preview with category filter/search, body
  progress card (weight, body fat, waist, goal adherence, target weight) and a
  coach quote card.

The existing Products database and meal Templates panels were kept and
re-inserted as first-class tabs. The old daily log, food search, portion modal,
targets modal, custom foods, recipes and templates all remain functional.

## New systems / panels

- **Recipes tab** - lists `food_base` records with `source === 'recipe'`,
  search, create button, edit action and add-to-plan action.
- **History tab** - real saved `nutrition_history` days, summary (days logged,
  average calories, average protein), adherence bar and a click-through that
  opens that date on the Plan tab.
- **Custom meals** - `Add meal` appends a persisted meal to the selected day.
- **Meal completion** - a persisted `done` flag per meal, with a green row state.
- **Product rail** - combines the curated reference DB (`food_database`, 1,253
  rows) with the local/custom/recipe store (`food_base`) and keeps the cache in
  sync after creating or editing a food/recipe.
- **Weekly chart** - reads the same client history for the visible week, with a
  dashed calorie-target line and per-day values.
- **Body progress** - uses real `weight`, `target_weight`, `body_fat_pct` and
  `waist_cm` fields; the weight delta changes tone if it moves away from the
  client's goal.

## Theme / language support

- Built only from the six Vision theme variables, so Nebula, Aurora, Abyss,
  Solar, Arctic and Pearl all work in dark and light modes.
- Light-mode overrides for the shell, panels, rings, tracks and chips.
- Semantic macro colors do not change with the theme.
- Full EN / RU / HE copy, including all new tab, rail, meal, recipe, history and
  progress strings. The Hebrew week starts on Sunday and RTL arrows/rows mirror.
- Mobile layout: 2-column macro cards, full-width tabs, compact meal rows with
  the time badge over the dish photo, stacked right rail and no horizontal
  overflow.

## Fixes found during QA

- The first history query used `byClientId`; the IndexedDB index is
  `by_clientId`. This silently returned zero rows. Corrected and covered by a
  regression test.
- The right rail originally read only `food_base`, which is empty on a fresh
  install. It now merges `food_database` and flattens the nested `.nutrition`
  macros.
- Macro values were clipped in the four-up strip; the card now shows the
  consumed value on one line and the target on a second.
- Mobile meal rows were re-gridded (`thumb / copy / check` and
  `thumb / nutrition / check`) so the photo, name, chips, calories and check no
  longer compete for one row.
- The right rail's "All" duplicated the category chip; it is now "See all".
- RTL date eyebrow and week range follow the selected day instead of always
  saying "Today".
- Removed the extra "Today" pill from the day strip; the seven real days fit
  both desktop and mobile.

## Verification

- Build **c203**, SW cache **dk-gym-v230**, sidebar/login labels updated.
- **57 test files - 0 failures.** New `scripts/test-c203.cjs` has 55 checks for
  markup, CSS, data flow, i18n, assets and version.
- Updated `test-c162` / `test-c163` for the new markup and versioned assertions
  in the legacy suite.
- Puppeteer QA (1440x1100 desktop, 390x844 mobile):
  - 24/24 functional checks passed: add food, delete food, done toggle, custom
    meal, targets save, week navigation + Today shortcut, history click-through,
    products, recipes, templates, no runtime errors.
  - Visual checks passed in dark/light, all six themes, mobile and Hebrew RTL.
- `npm.cmd run build` completes; `src/nutrition-dashboard.css` is shipped by
  `scripts/copy-assets.js`.
- No changes to the c202 3D atlas or its skeleton overlay.

## Files

- `fitness-crm.html` - new nutrition markup, data flow, renderers and wiring.
- `src/nutrition-dashboard.css` - new theme-aware dashboard CSS.
- `scripts/copy-assets.js` - ships the new CSS.
- `src/i18n/en.json`, `src/i18n/ru.json`, `src/i18n/he.json` - new copy.
- `scripts/test-c203.cjs` - c203 regression suite.
- `sw.js` - cache v230.
