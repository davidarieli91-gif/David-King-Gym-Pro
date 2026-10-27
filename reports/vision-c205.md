# c205 - live-workout parity for the trainer and the client portal

## Why this release

The trainer and the trainee were looking at two different live-workout
experiences: the trainer's cards were smaller, the portal's rest seconds were
clipped, a completed set had no visible green state in the portal, the same
exercise showed different «Prev.» values in the two apps, and a workout the
client finished in the portal never appeared in the trainer's dashboard or
Workouts › History.

The last point had a concrete cause: analytics and the recovery map merged the
portal's cloud history in memory, but the dashboard, client cards and History
read the trainer's local `workout_history` store. The workout was visible to
the recovery engine and invisible everywhere else.

## What changed

### Rest seconds are readable

- The live card rest input in **both** portals is now a shared
  `.rest-sec-input` field: 68 px wide, 11 px mono text, spinner hidden.
- The trainer's program-builder rest fields (per exercise and «rest for all»)
  use the same field, so a value like `180` is never clipped to `1` or `18`.

### Trainer cards match the portal

- The trainer's live cards get the portal's card rhythm: slightly larger
  padding, a larger exercise title and a 2.5 rem minimum set-row height.
- No layout/table change: the existing CSS-grid set rows and all trainer
  actions stay where they were.

### Green «set done» in the client portal

- The shared CSS now paints the done check in both portals:
  `background: success`, white ✓, success border and glow.
- The portal's check target is enlarged (1.9 × 1.8 rem) and no longer fades
  with the done row.
- Live sessions report a ticked set immediately. `setPerformed()` used to let
  the seeded `performed:false` flag override a freshly ticked set, which left
  the completion ring and live volume at zero until the workout was saved.

### One «Prev.» source for both portals

- The client's `dkPFindLastEx` no longer prefers an exact program/day match.
  It scans the whole history newest-first, exactly like the trainer's
  `fetchLastRef`.
- The done-only rule and same-set-number alignment are unchanged, so skipped
  prescriptions still stay out of the Previous column.

### Client supersets

- Every client exercise card has a ⚡ superset button.
- It uses the same `ss_link` chain model and the same group colours as the
  trainer: tap once to link this exercise with the next one, tap again (or tap
  the second partner) to split the pair.
- Partners are equalized to the same set count so the ✓ sync still works.

### Whole-workout completion + report graph

- The client live head now has the trainer's completion ring next to the
  progress bar; the ring, bar, percentage and `done / total` label all update
  from the same set count.
- The post-workout report has a six-week volume chart (seven-day buckets, the
  session that just ended included in «now»).

### Theme-aware exercise cards

- Shared selectors theme **both** live lists, including the inner set rows and
  set inputs:
  - dark themes → dark glass cards and dark rows;
  - light themes → light cards and light rows.
- The rules use the active `--v2-*` / `--c-*` variables, so all 13 themes are
  covered without per-theme copies.
- The done check stays green in every theme.

### Portal workouts reach the trainer

- New `window.dkPersistCrmHistory(clientId, rows)` writes portal-shaped
  records into IndexedDB `workout_history` (deduped by timestamp, with a stable
  `remote_<client>_<ts>` fallback id), advances the client's `last_active` and
  emits `dk-workout-history-updated`.
- `dkFetchClientHistory` now persists every mapped cloud record before
  returning it. The data still reaches analytics/recovery as before; now it
  also reaches the dashboard, client cards and History.
- The dashboard merges portal history for clients with a portal share
  (`portal_sk`) or a portal password (`portal_pass`) and refreshes when
  persisted records arrive.
- The client's save button waits briefly for the shared-doc write and tells
  the trainee when the workout is queued for the next sync.

## Verification

- `scripts/test-c205.cjs` covers the shared rest/CSS surface, the green done
  state, the immediate performed rule, the Prev unification, the client
  superset, the completion ring/report chart, and an executable
  `dkPersistCrmHistory` test (dedupe, ids, last_active, refresh event).
- All 63 `scripts/test-*.cjs` files pass.
- Puppeteer QA (`qa-c205.cjs`, 12/12):
  - 68 px rest fields showing `25` in both portals;
  - identical `75×13` previous set in both portals;
  - green done check in both;
  - portal workout persisted and visible in the dashboard KPI;
  - client ring updates, superset highlights two cards, report chart has
    six bars.
- Screenshots checked in dark and light for both portals, desktop and mobile.

## Preserved

- Accepted 3D skeleton overlay and anatomy atlas untouched.
- No muscle-role chips on closed exercise cards.
- Mobile drawer remains visible.
- c204 nutrition dashboard/catalog and its 13 themes are unchanged.

## Version

- Trainer build `c205`, `RUNNING = 205`.
- Service worker cache `dk-gym-v232`.
