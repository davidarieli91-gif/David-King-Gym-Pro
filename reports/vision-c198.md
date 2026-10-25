# c198 — Vision V2: live workout, atlas and portal depth

## What changed

### Live workout

- The workout header now carries a **circular progress ring** that updates on
  every set check, next to the existing progress bar.
- The bottom actions are a **sticky glass action dock** (add exercise /
  save template / finish) instead of a flat row lost at the end of the page.
- Exercise cards in the live session use the same glass depth, rounded corners
  and hover glow as the picker cards.
- BF/GymVisual thumbnails become neon x-ray plates in dark themes, with a dark
  radial stage — no more white squares breaking the space.
- Rest timer banner is glass with rounded bottom corners.

### 3D atlas

- Camera fits the whole body head-to-feet behind the control dock; the size
  slider no longer crops the model.
- When a muscle is selected the info card works as a **right-side glass
  inspector** (mobile: bottom card).
- Left muscle list is a dedicated 232 px glass rail with themed search and
  hover rows.
- Holographic lighting, two platform rings, cyan/violet rim.

### Nutrition

- Macro rings sit in individual glass tiles with a soft glow.
- Existing real targets/consumption math is untouched.

### Client portal

- The hero workout card now has a gradient glass surface and a glowing
  progress bar.
- BF/GymVisual exercise thumbnails use the neon x-ray treatment in dark
  themes, matching the trainer app.
- Six Vision themes and the portal theme picker remain.

### Trainer client cards

- Real 6-week sparkline, 30-day progress bar, status dot/pill and workout
  count (from c197) are retained.

## Verification

- Build **c198**, SW cache **dk-gym-v225**.
- **58 test files — 0 failures.**
- Desktop live workout checked: 2 exercise cards, progress ring, sticky dock.
- Desktop atlas checked: full body + platform + right inspector.
- Nutrition, tools, analytics, settings, login, client profile rechecked.
- Mobile 390×844: header, KPI grid, rich client cards, bottom nav.
- Theme migration/persistence still pass.
- No console errors.
