# c212 - dark search + larger technique and food rails

## What changed

### Global search

- The top search now uses the themed `--v2-input-bg` plate instead of a
  native white field.
- Dark mode sets `color-scheme: dark`, so native search controls, date inputs
  and scrollbars no longer flash white.
- Input text, placeholder and the `Ctrl-K` hint follow the active theme.

### Client card right rail (training techniques)

- The right rail grows from a 450px cap to
  `clamp(380px, 28vw, 760px)`:
  - about 537px on 1920;
  - about 717px on 2560;
  - up to 760px on 32:9.
- This is roughly 1.6× the previous width on 21:9. Programs, day cards,
  quick actions and personal info are easier to read and click.

### Nutrition right rail (products)

- The food rail grows to `clamp(400px, 29vw, 780px)`:
  - ~557px on 1920;
  - ~742px on 2560;
  - up to 780px on 32:9.
- Product cards stay in three columns but each card is now ~232px wide on
  21:9 instead of ~138px, with larger food images and readable names/kcal.
- Meal rows use two columns on 21:9 and three on 32:9.

### Large-monitor typography

- The c211 type scale remains in force, including the food-detail modal
  (`clamp(960px, 52vw, 1400px)`), macro labels and nutrition rows.

## Verification

- 2560×1080: search background `rgba(8,16,36,.78)`; profile rail 717px;
  nutrition rail 742px; product cards 232px each.
- 3840×1080: profile rail 760px, nutrition rail 780px.
- 1920×1080 and phone checks unchanged.
- `scripts/test-c212.cjs`: 11/11.
- Full suite: 70 test files, all green.

## Version

- Trainer build `c212`, `RUNNING = 212`.
- Service worker cache `dk-gym-v239`.
