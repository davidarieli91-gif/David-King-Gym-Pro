# c196 — Vision V2: the futuristic skin

## Result

The app has moved from the old 33-theme pack + texture effects + panel
textures to **six complete visual worlds**. A theme now owns everything:
palette, glass material, background scene, particles, glow and chart accents.

Theme registry:

| ID | Name | Mode | Mood |
|---|---|---|---|
| v2-nebula | Nebula Blue | dark | deep space, violet → electric blue, cyan |
| v2-aurora | Violet Aurora | dark | violet / magenta aurora |
| v2-abyss | Abyss Teal | dark | underwater teal, mint and lime |
| v2-solar | Solar Ember | dark | warm sunset, orange → coral |
| v2-arctic | Arctic Glass | light | icy blue / white daylight |
| v2-pearl | Pearl Rose | light | soft pearl / lavender daylight |

Old theme IDs (`dark`, `ocean-deep`, `retro-1940`, …) are mapped automatically
on boot and backup restore. Theme choice persists.

## What was rebuilt

### Shell

- Cinematic fixed background layers: scene gradient, drifting orbs, grid and
  particles.
- New top bar: compact brand, global search with client results and Ctrl/⌘ K,
  status controls and a profile menu.
- Sidebar: logo lockup, online/version pills, nav with gradient active pill,
  Daily Focus card.
- Mobile drawer + glass bottom nav with responsive labels.
- Login screen: large logo, glass card, neon primary action.

### Dashboard

- Real KPI row: total clients, active this week, workouts / 7 days, new this
  month — all computed from IndexedDB, zero invented numbers.
- Client roster with group chips; **empty groups are hidden**.
- Right rail: quick actions, a real Coach insight generated from client
  activity, and the 3D Body Atlas entry.
- Localized RU/EN/HE, including the coach messages.

### Exercise DB

- Full-width 3-column Vision layout.
- Live 3D anatomy in the inline picker (with SVG fallback), themed stage,
  platform rings and cyan/violet rim lights.
- BF/GV line-art becomes a neon x-ray plate in dark themes; RepDB flat art
  keeps its original colours.
- Existing c195 equipment taxonomy and group order remain intact.

### 3D Body Atlas

- Camera now fits the whole body (head to feet) behind the bottom control
  dock; the size slider no longer crops it.
- Holographic lighting: cyan rim, violet fill, under-light and two platform
  rings.
- Glass control dock and themed stage.

### Theme settings

- The old Appearance grid of tiny colour dots is now six large live preview
  cards.
- The **Texture effects** and **Panel texture** sections were removed from the
  trainer and the portal.
- Legacy texture values are forced to `none` / `off` on every boot.
- The portal has the same six themes in its settings sheet.

### Portal

- Same theme registry, scene, glass and gradient primary buttons.
- Old portal texture sections are removed at runtime.
- Theme choice persists in `dk_portal_theme`.

### Recover page

- Updated to the same deep-space gradient, glass card and gradient primary
  button.

## Verification

- Build **c196**, SW cache **dk-gym-v223**, RUNNING 196.
- **58 test files pass**, including `test-c196-vision.cjs` (57 checks) and
  `test-c195-groups.cjs` (66 checks).
- Browser smoke test: all six themes switch, no console errors.
- Theme migration test: `retro-1940` → `v2-solar` persisted on reload;
  `v2-abyss` persisted on reload.
- Portal: six theme cards, theme persistence, no texture grids.
- Mobile 390×844: header, KPI grid, roster, bottom nav checked.
- Desktop 1440: dashboard, exercise DB, 3D atlas, nutrition, tools, analytics,
  settings, profile, login checked.

## Deploy

- Commit `4377fe3` pushed; GitHub Actions run **40213827758** — success.
- Small PWA install-prompt styling follow-up `dcc75c1`; run **40214208573** —
  success.
- Live page verified: build **c196**, SW **dk-gym-v223**, six Vision themes,
  live dashboard in Russian, mobile layout, portal theme cards, no console
  errors.

## Still to deepen in the next pass

The whole app now inherits Vision V2. The next visual pass can go further on:

- Nutrition: true bento composition with macro rings and a meal timeline.
- Live workout: focus-mode header with a progress ring and a bottom action
  dock.
- Atlas: richer left region panel and a right muscle/exercise inspector.
- Client portal: recompose the main content cards around the new theme rather
  than only reskinning them.
- Optional: a newer licensed 3D anatomy model (current model is Z-Anatomy
  CC BY-SA 4.0).
