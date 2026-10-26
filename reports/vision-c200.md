# c200 — SVG anatomy lab + Vision client hero

## New SVG anatomy model (additional, not a replacement)

- New zero-dependency vector asset: `src/anatomy-svg.js`.
- **34 muscles**, each a real `<g role="button" tabindex="0">` with
  `data-m`, `data-g` and `data-sub` — clickable, keyboard accessible and
  hoverable, mirrored correctly on both sides.
- Dedicated **front and back figures** with:
  - deep red/orange anatomical gradients, specular gloss and fiber striations;
  - muscle separations, tendon lines, central creases, patella/ankle joints;
  - head/jaw/neck anatomy, hands, feet and a holographic floor ring.
- Muscles covered: pecs, traps (upper/mid/lower), SCM, deltoid/rear deltoid,
  biceps, brachialis, brachioradialis, forearm flexors/extensors, abs,
  obliques, serratus, hip flexors, all quad heads, adductors, tibialis,
  lats, teres/rhomboids, triceps, erectors, glute max/med, hamstrings and
  both gastrocnemius heads.
- New **Anatomy Lab modal**:
  - left group rail with counts and active state;
  - center stage with both views, scan line and hover tooltip;
  - right inspector with real group/subgroup chips, function text,
    “Show exercises” bridge and clear;
  - language cycle (EN/RU/HE), mobile front/back tabs, and a 3D button that
    returns to the accepted 3D atlas.
- “Show exercises” uses the same exercise body-map filter and closes the
  modal; the 3D atlas remains untouched and reachable.
- The model is also embedded as a **compact interactive preview in the client
  profile hero**; tapping any muscle opens the modal with that muscle selected.
- Light themes keep the anatomy lab dark (same treatment as the 3D atlas),
  so the vector muscles never wash out on pearl/arctic glass.
- RTL and 390×844 mobile layouts verified; no horizontal overflow.

## Client profile hero

- Rebuilt hero with a Vision glass surface, grid/glow backdrop and status ring.
- Real client identity data: avatar/photo, name, since/last seen, live status,
  primary goal and portal readiness chips.
- Four real stat tiles: age, weight, height and BMI (icons + mono values).
- Quick actions: **Muscle map** (new SVG lab) and **Client portal** (existing
  QR/share flow).
- Side anatomy card uses the new interactive torso preview and an open-map
  button. On phones the preview is hidden so the hero stays compact and the
  stats/actions remain first-class.
- Existing programs, nutrition, documents, photos, recovery and all profile
  panel drag/order behaviour are untouched.

## Integration / build

- `fitness-crm.html` loads `src/anatomy-svg.js` before the app shell.
- `scripts/copy-assets.js` ships the new asset to `dist/src`.
- `window.DKAnatomy` API: `open/close/select/selectGroup/setView/mountMini`.
- `window.DKAtlas.showExercisesFor` is now exposed for the SVG bridge.
- Version **c200**, SW cache **dk-gym-v227**.

## Verification

- **59 test files — 0 failures** (new `test-c200.cjs` covers the model,
  modal, profile bridge, i18n, asset copy and build/SW version).
- Anatomy modal checked at 1440×1000, 390×844, light theme and RTL.
- Chest selection → inspector → Show exercises verified; the workout screen
  opens with the Chest / Upper filter applied.
- Profile mini-muscle tap opens the modal with the chosen muscle selected.
- Atlas header “SVG” opens the new lab and closes 3D; “3D” returns to the atlas.
- Mobile hero checked: 2×2 stats, wrapped actions, no overflow.
