# c209 - neon depth, dark food cards and complete workspace copy

## Visual depth

The c208 workspace now carries the reference's neon rim light:

- KPI tiles, roster, client cards, rail cards and the client hero get a
  gold/theme glow with stronger hover states.
- Stat tiles, meal cards and the active-program panel use the same inset
  highlight and outer glow.
- Dark themes keep the deep glass; light themes keep the light glass and only
  receive the warmer borders.

## Nutrition cards

- Product cards, meal rows, recipe cards, side cards and food tiles now
  explicitly use the themed `--v2-surface` glass in dark mode instead of
  floating on their previous light backing.
- Product/meal/food media get the same dark plate:
  - a dark radial stage;
  - a subtle bottom vignette;
  - slightly dimmed food photography.
- The right-rail product list, group tiles, product cards and meal cards now
  read as one system with the exercise cards.

## Translation

- Fixed the corrupted RU/HE copies introduced with the c208 workspace keys.
- Added missing workspace copy:
  - dynamics, every-client card, last activity, all groups, goal label,
    workouts label, weight/waist/body-fat labels;
  - hero quote, weeks/days, Message/Call/Note;
  - active-program/no-program;
  - weight trend;
  - 30-day workouts, `vs prev. 30d`, `30 days`;
  - New program / New nutrition plan hints.
- Dashboard status chips now use the shared `common.all` copy.
- Profile stats and deltas use localized keys instead of English literals.
- Verified no `??` runs remain in any RU/HE string.

## Verification

- `scripts/test-c209.cjs`: 18/18.
- Full suite: 67 test files, all green.
- Browser checks in EN/RU/HE: dashboard, client card, hero, stats, quick
  actions and status chips render translated; dark neon and glass checked.

## Version

- Trainer build `c209`, `RUNNING = 209`.
- Service worker cache `dk-gym-v236`.
