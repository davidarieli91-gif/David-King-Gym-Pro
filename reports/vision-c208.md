# c208 - premium client workspace

## Goal

Bring the trainer's Clients dashboard and the client card closer to the two
reference images: photo-first client cards, a five-tile KPI strip, a live
activity rail, a cinematic client hero, a goal ring, stats + weight progress
and meal cards.

## Dashboard

- New gold-glass page head with a client mark, count pill and Add Client.
- Five KPI tiles: total clients, active this week, workouts / 7 days, new this
  month, and a six-week **workout dynamics** sparkline with growth.
- Client roster rebuilt as a responsive photo card grid:
  - photo or gradient initials;
  - active / recent / away status badge;
  - name, group, last activity and goal;
  - completion ring and workouts-to-date;
  - weight, waist and body-fat metrics (deltas when a starting value exists).
- Status chips (All / Active / Recent / Away), group select and a grid/list
  toggle. Search, sorting, drag-to-group and click-to-profile are unchanged.
- Right rail: "Every client is unique" add-client card, quick actions,
  **last activity** feed, daily quote and the existing coach insight.
- The old horizontal roster CSS is overridden; the existing IDs and data flow
  are preserved.

## Client card

- New cinematic hero: large photo/initials plate, name with a crown, quote,
  goal/portal chips, Message / Call / Note / History actions, four body tiles
  (age, height, weight, BMI), a goal ring, and a live **active program** panel
  with dates/progress/Open.
- New quick-actions rail with Workout / Program / Nutrition / Note actions and
  a recent-activity feed.
- New stats card: workouts (30 days), estimated kcal burn, current weight and
  body fat, plus a 30-day weight chart drawn from portal check-ins (flat
  fallback when there are no measurements yet).
- Nutrition panel now opens with four image meal cards (meal name, time, kcal,
  P/C/F) built from the active plan, followed by the existing plan controls.
- Profile panel order is versioned so old custom layouts do not hide the new
  stats/quick panels. Existing programs, documents, health, photos and personal
  info panels are retained.

## Safety

- No changes to IndexedDB schemas or sync logic.
- Client portal is untouched.
- Settings, Analytics and Tools remain direct router mounts (c207 regression
  guard).
- All new copy is localized in EN / RU / HE.

## Verification

- `scripts/test-c208.cjs`: 25/25.
- Full suite: 66 test files, all green.
- Browser QA at 1800×1100 in dark and light themes:
  - dashboard cards, status filter, grid/list toggle, dynamic sparkline and
    activity rail render;
  - client card hero, goal ring, active program, stats/chart and four meal
    cards render;
  - no `?` artifacts from non-ASCII glyphs.
- `settings`, `analytics`, `tools` smoke check still renders all three screens.

## Version

- Trainer build `c208`, `RUNNING = 208`.
- Service worker cache `dk-gym-v235`.
