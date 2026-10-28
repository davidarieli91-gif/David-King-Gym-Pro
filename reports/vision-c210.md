# c210 - adaptive workspace from phone to 32:9

## What changed

The trainer workspace no longer sits inside a fixed 1500px island.

### Fluid screens

- Dashboard, client card, workouts, nutrition, analytics and tools use the full
  available width with optical padding (`clamp`), not `max-width: 1500`.
- Settings keeps readable lines but expands to three columns on 32:9.
- The side rail keeps a sensible width and grows from ~320px to 450px instead
  of becoming a fixed strip.

### Dashboard

- Client grid uses `minmax(clamp(190px, 11.2vw, 300px), 1fr)`:
  - 5 cards across on 16:9 (1920);
  - 5–6 on 21:9 (2560);
  - 10 on 32:9 (3840).
- KPI strip stays five equal tiles; typography and tile height scale up on
  21:9/32:9.
- Right rail grows to 450px on ultra-wide so quick actions and activity have
  room.

### Client card

- Hero photo, copy and active-program panel use fluid `clamp` columns.
- Stats card switches at ≥1180px to the reference layout: four KPI tiles on
  the left, weight chart on the right. At 32:9 the chart gets the wide side.
- Meal cards grow with the panel; images get taller on 21:9/32:9.
- Profile rail grows with the monitor (up to 450px).

### Live workout

- The live screen uses the full width.
- At ≥1500px exercise cards become a two-column grid; at ≥3000px three
  columns. On phones it returns to one column.

### Nutrition / workouts / utilities

- Nutrition rail stays three food cards wide; meal rows become 2 columns at
  ≥2000px and 3 at ≥3000px.
- Nutrition product grids and exercise picker grid use fluid min card sizes.
- Workouts uses the full panel width; the picker tree/map columns grow on
  ultra-wide monitors.
- Analytics and tools use full width; tools forms become 3/4 columns on wide
  screens.
- Settings becomes a 2-column accordion at ≥1800 and 3-column at ≥2600.
- Hidden screens can never leak under another route (settings uses
  `:not(.hidden)` for its grid display).

### Mobile

- Two client columns, two KPI columns with the dynamics tile spanning the
  row, stacked hero, two-column stats, two-column meal cards and normal
  padded screens at 390px.
- Live workout returns to a single column.

## Verification

- Browser checks at 1920×1080 (16:9), 2560×1080 (21:9), 3840×1080 (32:9)
  and 390×844 (phone):
  - dashboard grid columns: 5 / 5 / 10 / 2;
  - settings: 2 cols at 21:9, 3 cols at 32:9;
  - nutrition rail: three product columns; meals 2-up at 21:9;
  - profile stats/chart split and full-width hero at 32:9;
  - no hidden Settings panel under the profile.
- `scripts/test-c210.cjs`: 18/18.
- Full suite: 68 test files, all green.

## Version

- Trainer build `c210`, `RUNNING = 210`.
- Service worker cache `dk-gym-v237`.
