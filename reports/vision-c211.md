# c211 - readable 21:9 workspace

## Problem

c210 filled the width but kept laptop-sized type. On a 2560×1080 panel the
trainer had to lean in to read card labels, the food-detail card was a narrow
phone sheet, and Settings looked like a checkerboard of different-height boxes.

## What changed

### Type scale for large monitors

At ≥1800px every trainer screen gets a fluid type scale:

- Tailwind's fixed `text-[8px] … text-[14px]`, `text-xs`, `text-sm`, headings
  scale with the viewport.
- Custom labels that are not Tailwind utilities (KPI labels, client status
  lines, goal rows, metrics, rail items, hero info, stat deltas, meal macros,
  nutrition labels) receive their own clamp scale.
- On 2560 the smallest working labels are now ~13–14px instead of 8–10px;
  on 3840 they cap at ~15–17px so lines do not become billboards.
- Controls (status chips, selects, quick-action rows) grow with the text.

### Settings

- No more grid of mismatched boxes: Settings now uses balanced CSS columns
  (2 at 21:9, 3 at 32:9), each panel kept intact with `break-inside: avoid`.
- This removes the checkerboard holes while keeping every panel full-width
  and readable.

### Nutrition technique cards

- Food-detail modal widens from a phone sheet to `clamp(960px, 52vw, 1400px)`.
- Its macro tiles, vitamin/mineral rows and labels now use the large-monitor
  type scale.
- Product names, energy, meal titles/sub-lines, allergen/brand chips, group
  labels and nutrient rows were all raised to readable sizes.
- The right-rail food grid stays three cards wide so product cards don't turn
  into giant single tiles.

### Other systems

- Workouts, live workout, analytics and tools inherit the same readable type
  scale; live workout still uses 2/3 columns on wide screens.
- Mobile rules are unchanged (scale applies only at ≥1800px).
- Client portal phone layout remains untouched.

## Verification

- Browser at 2560×1080: dashboard labels ~13–14px, quick actions ~14px,
  Settings 2 balanced columns, food-detail modal 1331px wide.
- Browser at 3840×1080: Settings 3 columns, dashboard 10 client cards,
  nutrition 3-up products, 3-up meals.
- 1920×1080 and 390×844 checks remain green.
- `scripts/test-c211.cjs`: 11/11.
- Full suite: 69 test files, all green.

## Version

- Trainer build `c211`, `RUNNING = 211`.
- Service worker cache `dk-gym-v238`.
