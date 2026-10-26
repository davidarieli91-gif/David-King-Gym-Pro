# c201 — cleanup, atlas language menu, exercise cards and mobile drawer

## Removed the experimental SVG anatomy lab

- Deleted `src/anatomy-svg.js` and every reference:
  - the anatomy modal markup, its CSS, the `.dkm-*` / `.ana-*` styles;
  - the SVG button in the 3D atlas header;
  - the profile hero mini model and its `DKAnatomy` registration/wiring;
  - copy-assets entry, c200 report and c200 regression test;
  - `client.muscleMap` i18n keys.
- The accepted **Z-Anatomy 3D atlas remains exactly as before**. The original
  small SVG body map used by the exercise picker was not touched.
- The profile hero itself (identity, live status, goal, portal, real stats)
  is kept; only the failed SVG preview/action was removed.

## 3D atlas language picker

- Replaced the old cycling `EN → RU → HE` button with a proper compact
  `<select>` in the 3D atlas header, styled like the app-header language
  control, with a chevron and all three options.
- Selecting a language updates `switchAppLanguage`, the atlas labels, the
  document language, the embedded body-map hints and the RTL layout.

## Exercise cards

- Closed exercise cards in both the Exercise DB grid and the Quick Pick
  cards no longer render target / synergist / stabilizer chips. The cards
  stay compact and readable on phones.
- The full role breakdown is still rendered **only in the opened exercise
  modal** (`getExerciseMuscleChips(..., { detailed: true })`), together with
  the body map.

## Mobile hamburger drawer

- Root cause: the backdrop was appended to `<body>` at z-index 75 while the
  drawer lives inside the `#app` stacking context (z-index 1). The backdrop
  painted above the drawer, blurring the whole screen.
- Backdrop now lives inside `#app`, below the z-80 drawer, so the drawer is
  fully visible.
- Added a visible close X in the drawer header, `aria-expanded` /
  `aria-controls` on the hamburger, Escape-to-close and page-scroll lock.
- Drawer surface is now near-opaque for readable navigation; active nav item
  keeps the Vision gradient highlight.

## 3D body model research (options to connect next)

These were checked online and, where downloadable, the GLB was inspected
locally. The app can keep the current Z-Anatomy body and add a new one in a
model picker.

| Candidate | License | Format / size | Per-muscle meshes? | Notes |
|---|---|---|---|---|
| **Innerscene — Full-body muscular system, superficial layer** | **CC0 1.0** (personal + commercial, no attribution) | GLB **15.2 MB**, 1.75 m real scale | **Yes — 157 named meshes / 239,224 tris / 3 materials** | Best candidate for an interactive high-detail second body. Already inspected locally. |
| **Grab3D — Human Muscles** | **CC0 1.0** (no attribution) | GLB light **8.9 MB**, full **23 MB**, 4K textures, rigged 13 MB | **No — one mesh / one material** (verified) | Visually the most realistic écorché (300k light / 601k full tris). Great cinematic showcase, but not directly clickable per muscle. |
| **Z-Anatomy full** (current source) | **CC BY-SA 4.0** (attribution + share-alike) | Blender template / OBJ export / optimized GLB | **Yes — hundreds of separate structures** | Current muscular GLB is a subset. Upgrading to the full template adds skeleton/organs and higher-detail muscles. Needs Blender → GLB optimization. |
| **BodyParts3D / Anatomography** | **CC BY-SA 2.1 Japan** (attribution + share-alike) | OBJ/STL per part; conversion needed | **Yes — FMA/TA part-level** | Most granular and accurate naming, older visual style. Excellent base for exact muscle filtering. |
| **Open Anatomy Project (SPL atlases)** | 3D Slicer BSD-style open license | SPL / mesh atlases | Partly | Medical, mostly head/neck/neuro; not a full-body gym atlas. |
| **Sketchfab CC0 / CC-BY muscular models** | Per model (filter CC0/CC-BY) | GLB/FBX | Varies | Huge choice; must vet topology, rig and license. Many are single-mesh. |

**Recommendation:** connect **Innerscene** as the optional “HD Anatomy”
segmented body (CC0, 157 muscles), keep the existing Z-Anatomy body as the
lightweight default, and optionally add **Grab3D** as a cinematic, non-
interactive showcase. If anatomical naming is more important than looks,
**BodyParts3D** is the best source of individual muscle parts.

Links:
- https://www.innerscene.com/tools/library/3d-parts/full-body-muscular-system-superficial-layer-8e9b43f6
- https://grab3d.com/models/anatomy/human-muscles/
- https://github.com/Z-Anatomy/Models-of-human-anatomy
- https://lifesciencedb.jp/bp3d/?lng=en
- https://www.openanatomy.org/
- https://sketchfab.com/tags/muscularsystem

## Verification

- Build **c201**, SW cache **dk-gym-v228**.
- **59 test files — 0 failures** (new `test-c201.cjs` covers the cleanup,
  language select, exercise-card chips, drawer stacking and versions).
- Mobile drawer opened/closed by X and backdrop; aria state/scroll lock
  verified.
- Atlas language `<select>` tested with HE: title and `html.lang` switch.
- Exercise DB cards verified with 200 rendered cards and **0 role chips**;
  open exercise modal still shows detailed chips.
- Profile hero desktop verified after removing the SVG preview.
