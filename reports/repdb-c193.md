# c193 — RepDB translations + card fit

## Fixes

### 1. RepDB RU/HE data

- All **650** RepDB names now have non-English RU and HE values.
- All **650** technique/tip strings now have RU and HE values.
- Existing translated records were reused where possible; missing records were
  machine-translated and key exercises were manually corrected:
  - Pull-Up → Подтягивание / עליות מתח
  - Muscle-Up → Выходы на турнике / עליות כוח
  - Dips → Отжимания на брусьях / עליות מקבילים
  - Ab Wheel Rollout → Прокатка колеса для пресса / גלגול גלגלת בטן
  - Human Flag → Горизонтальный флаг / דגל אנושי
  - Planche, Front/Back Lever, Handstand Push-Up, TRX Y-Fly
- Existing RepDB rows are **updated in place on boot** (name/technique/group/
  equipment fields only), so devices that already seeded c192 receive the
  translations without losing trainer edits or archived state.

### 2. Corrupted equipment labels

The c192 insertion path turned several new equipment labels into literal
`??????`. Both equipment dictionaries were rewritten with proper UTF-8:

- Турник / מתח
- Брусья / מקבילים
- Кольца / טבעות
- Канат / חבל
- Скамья / ספסל
- Тумба / ארזג
- Колесо для пресса / גלגלת בטן
- Боевой канат / חבל קרב
- Медбол / כדור כוח
- Фитбол / כדור יציבות
- Петли / רצועות תלייה
- Трап-гриф / מוט טרפז
- Кардиотренажёр / מכונה אירובית

The re-seed settings label also now says 6,273 exercises instead of 1,660.

### 3. Card image fit

`#exercise-gif-slot` combined `aspect-ratio: 1/1` with viewport-based
`max-height`, which shrank the slot's **width** on shorter/mobile viewports and
left a small square image inside a large card. The slot now uses the full card
width with `max-height: none`; the modal already scrolls.

## Verification

- RepDB records: 650; RU fallback names: 0; HE fallback names: 0;
  RU fallback techniques: 0; HE fallback techniques: 0.
- Browser RU check: equipment chips are real Russian labels, no `??????`.
- Browser check: Ab Wheel Rollout card/title now in Russian; modal media slot
  and image both measure the full card width (≈441 px at the tested desktop
  viewport instead of a shrunken inner square).
- `node scripts/test-c193-repdb.cjs`: **42/42**.
- Full suite: all test files pass.
- Build **c193**, SW **v220**, DB cache-bust **v56**.

## Still next

The 165 calisthenics deep 2.5D animations are still the next production phase.
c193 is the complete RepDB data/translation/card-fit layer plus the baseline
two-frame/hold animations.
