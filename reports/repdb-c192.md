# c192 — RepDB Free as the fourth exercise source

## What was added

- A **new, separate source**: `rdb` / `repdb`. The existing three bases
  (`bf` Burnfit, `gv` Gym Visual, `gi` GymImpulse) are untouched.
- **650 RepDB exercises**, imported from the official free RepDB snapshot.
- **1,147 local WebP images** in `images/rdb/` (start + peak poses; 153
  single-pose holds).
- A fourth picker tab **RepDB**, placed after GymImpulse:
  `All · Burnfit · Gym Visual · GymImpulse · RepDB · ★ · 🕐`.
- Separate JSON file `exercise-db-rdb.json`; it is fetched and seeded
  independently from `exercise-db.json`.
- Separate MIME/media handling: two-pose records use the existing two-frame
  CSS crossfade; single-pose records get a subtle RepDB breathing loop.
- Source badge **RDB** on cards and a RepDB root in the exercise trees.
- License attribution retained on every record:
  `Exercise data by RepDB (repdb.co)`, plus the source URL.

## Data mapping

- IDs: `rdb_<RepDB slug>` (no collisions with the existing 5,623 IDs).
- Equipment is preserved, including **Pull-up Bar (25)**, **Dip Station (3)**,
  **Rings (9)**, plus bodyweight and gym equipment.
- Groups/subgroups mapped to the app's canonical taxonomy.
- Technique = RepDB instructions + tips, pipe-delimited like the existing DB.
- RU/HE: existing translated records are reused where names match; the
  remaining records currently fall back to English and are marked as the next
  translation pass. No blank names/techniques.

## Verification

- RepDB records: **650/650**, all IDs unique, all images exist locally.
- Existing bases unchanged: **Burnfit 324 / Gym Visual 1,030 / GymImpulse 4,269**.
- All tab: **6,273**; RepDB tab: **650**.
- Browser check on the built app: each source tab shows the correct count and
  the RepDB cards load 512×512 WebP images with RDB badges.
- Single-pose card computes animation `rdb-breathe`; two-pose card computes
  `ex-crossfade`.
- Full suite: **56 test files pass**; new c192 test: **34/34**.

## Build

- Build **c192**
- Service-worker cache **v219**
- `EXERCISE_DB_BUST` **v55**
- `copy-assets.js` and SW APP_SHELL include `exercise-db-rdb.json`.

## Next phase: deep 165

The current c192 import gives the full RepDB collection a consistent baseline
(two-pose crossfade or hold breathing). The next phase is the deeper 2.5D
rig for the 165 calisthenics records:

1. Background/equipment separation.
2. Body-part layer segmentation + landmarks.
3. 2.5D rig (Rive/Spine or equivalent) using start/peak as key poses.
4. 12–24-frame loop, QA of joints and equipment.
5. Pilot on 12–15 exercises before scaling.

This is intentionally not claimed as finished in c192.
