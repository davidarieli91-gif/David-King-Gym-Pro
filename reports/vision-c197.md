# c197 — Vision V2 depth pass

## What changed

This pass goes deeper than the c196 skin:

### Exercise modal

- The open exercise card is now the same neon plate as the closed card:
  dark glass frame, bordered media slot, radial glow.
- BF/GymVisual white-background images and GIFs are inverted into a
  transparent-looking neon x-ray inside the modal (dark themes only).
- RepDB flat art keeps its original colours on a dark glass stage.
- The media is slightly scaled to fill the slot better.
- Neon tags, dark muscle-work panel, glass technique panel, glass close/edit
  buttons.

### Exercise cards

- Stronger glass: layered gradient surface, backdrop blur, inner highlight,
  rounded 17px.
- A slow light sheen sweeps across the image area.
- Two-pose cards show a small **ANIM** pill.
- Hover: lift, gradient glow, brighter border.

### Client cards

- Replaced the flat row with a rich Vision card:
  - large avatar/photo with an active/recent/away status dot;
  - name + group + status pill;
  - age / weight / height + last active;
  - real 30-day progress bar (`workouts / 12`);
  - a real 6-week sparkline from `workout_history`;
  - total workout count and group-move action.
- Empty client groups remain hidden from the filter row.
- The sidebar client search was removed — the global top search and the
  Clients screen search are the only search entry points now.

### Global polish

- KPI cards lift and glow on hover, with per-metric icon accents.
- Inputs/selects/radios/checkboxes/range sliders use the Vision accent colour
  and focus glow.
- Settings panels glow on hover.
- PWA install prompt restyled as a glass gradient button.
- Toast reminders are hidden before sign-in and move to the bottom on mobile.

## Verification

- Build **c197**, SW cache **dk-gym-v224**.
- **58 test files pass** (c197 Vision test: 65 checks).
- Desktop 1440: dashboard with rich cards and sparklines, live exercise modal
  in neon x-ray, 3D atlas, nutrition, tools, analytics, settings, login.
- Mobile 390×844: header, KPI grid, rich client cards, bottom nav.
- Theme migration and persistence still pass (`retro-1940 → v2-solar`).
- No console errors.

## Next depth targets

- Nutrition bento with macro rings and meal timeline.
- Live workout focus mode with progress ring and action dock.
- Atlas left region panel + right muscle/exercise inspector.
- Portal main cards recomposed around the new theme.
- Optional newer licensed 3D anatomy model.
