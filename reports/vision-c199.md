# c199 — Vision V2: nutrition bento + anatomy lab depth

## Nutrition

- The daily log is now a bento dashboard: remaining-calorie hero, conic goal
  orb, consumed/target/meals/foods chips, macro engine tiles, fuel gauge,
  macro split and a full meal timeline.
- Every macro tile has its own color rail, SVG ring, percentage badge and
  remaining/over line — calories, protein, carbs and fat all use real targets.
- The energy gauge shows consumed / target, remaining calories and the exact
  target; the macro split is calculated from real P/C/F calories.
- Meal cards are timeline nodes with a glass surface, meal-specific icon,
  calorie progress, per-meal macro rail (P/C/F grams + calories share) and
  item count.
- Meals with 1–2 foods switch to horizontal food-list rows with the photo on
  the inline-start side and the macro chips on the far side; 3+ foods use the
  photo-grid. Food names, grams, kcal and the existing delete overlay remain.
- Day stepper: previous / next arrow buttons and a Today shortcut, wired to
  the existing local-date loader.
- Empty/selected states, target editor button and the add-food workflow are
  unchanged and fully styled; all food modals now use the Vision glass.
- Light themes get dedicated track/orb/border colors so bars stay visible on
  pearl/arctic glass. Cards animate in with a short staggered rise.

## 3D anatomy lab

- New lab header: anatomy mark, ANATOMY LAB / Z-ANATOMY eyebrow, WEBGL chip,
  language and close controls.
- The canvas has a scanline HUD, LIVE SCAN indicator, model label and a
  pointer-follow muscle tooltip (throttled raycast) with a pointer cursor.
- The muscle rail has colored region dots, region counts, hover states, an
  accessible accordion arrow, a search icon, clear button, live match count
  and a no-results state.
- The inspector is a right-side glass panel on desktop and a bottom panel on
  phones: selected-muscle eyebrow, name, group/side/part chips, show
  exercises, hide and a close/deselect button.
- Selected muscles use the cyan emissive highlight; the previous close-up
  camera dive is softened to a half-shift so the whole silhouette stays in
  frame. On phones the camera is left untouched when picking from the list.
- The control dock is a compact glass pill. The atlas remains a dark lab in
  the light themes (local dark palette override), so the 3D stage never turns
  into a washed-out lightbox.
- Region data, labels, zoom, x-ray, isolate, hide/restore, front/back, reset,
  embedded body-map widgets and the exercise filter jump are unchanged.

## Verification

- Build **c199**, SW cache **dk-gym-v226**.
- **58 test files — 0 failures**; Vision suite **66/66**.
- Desktop RU/EN and mobile 390×844 nutrition checked; no horizontal overflow.
- RTL Hebrew nutrition checked (rail, badges, timeline and stepper mirror).
- Light theme Pearl checked; bars, orb and text remain readable.
- Atlas desktop, mobile and light-theme states checked: full body, selected
  biceps, inspector, hover tag, search counter and no-results state.
- Day stepper tested: next day → empty log, Today → original data restored.
- No app console errors.
