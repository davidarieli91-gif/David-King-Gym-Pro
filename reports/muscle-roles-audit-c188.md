# Muscle work model - c188 audit (2026-10-21)

## Scope

The shared model in `src/muscle-roles.js` was run over **all 5623 exercises**.
It combines the exercise's own group/subgroup/name/technique with its existing
synergist list, then fills only the missing helper/stabilizer roles from
conservative movement-pattern profiles.

## Result

- Profiles generated: **5623/5623**.
- Every profile: sums to **100%**, has a primary, at least one synergist and at least one stabilizer.
- Max listed muscles: **8** (primary + strongest helpers + stabilizers).
- Average listed muscles per exercise: **5.25**.
- Exercises whose DB synergist list was empty: **3467**.
  - Of those, **3467** now receive at least one inferred helper/stabilizer.
- Profiles missing a stabilizer: **0**.
- Profiles missing a helper: **0**.
- Profiles whose percentages did not sum to 100: **0**.
- Average primary share: **54.3%**.
- Helpers with ≥15% are displayed as **additional major muscles**
  ("Доп. главная / Major"), not as ordinary small synergists.
- Full-body exercises are split across real muscle groups (a burpee gets
  quads + chest as the two majors, plus glutes/hams/abs/delts/triceps/calves)
  instead of being swallowed by a single "full body" bucket.

Muscle-count distribution (listed muscles per exercise):

| muscles | exercises |
|---:|---:|
| 3 | 79 |
| 4 | 1604 |
| 5 | 1795 |
| 6 | 1463 |
| 7 | 316 |
| 8 | 366 |

## The user's screenshot exercise

**Barbell Bulgarian Split Squat**

Quadriceps 40% (primary) | Glutes 25% (synergist) | Hamstrings 10% (synergist) | Adductors 8% (synergist) | Calves 5% (synergist) | Core 12% (stabilizer)

This is the important change: quads are no longer the only working muscle,
and the card now shows glutes, hamstrings, adductors, calves and the core
stabilizer with approximate shares.

## Other examples

- **Barbell Bench Press**: Chest 48% (primary) | Triceps 21% (synergist) | Front Delts 14% (synergist) | Middle Back 5% (synergist) | Side Delts 4% (synergist) | Core 8% (stabilizer)
- **Dumbbell Romanian Deadlift**: Hamstrings 35% (primary) | Glutes 30% (synergist) | Lower Back 15% (synergist) | Quadriceps 8% (synergist) | Forearms 7% (synergist) | Core 5% (stabilizer)
- **Plank**: Upper Abs 33% (primary) | Lower Abs 19% (synergist) | Obliques 14% (synergist) | Glutes 10% (synergist) | Front Delts 8% (synergist) | Side Delts 4% (synergist) | Lower Back 7% (stabilizer) | Quadriceps 5% (stabilizer)
- **Running**: Quadriceps 30% (primary) | Calves 20% (synergist) | Glutes 20% (synergist) | Hamstrings 12% (synergist) | Hip Flexors 8% (synergist) | Core 10% (stabilizer)

## What is connected

1. **Trainer cards** - detailed panel on the exercise modal and compact
   percentage chips on the exercise-grid cards.
2. **Portal cards** - the same detailed panel on the client exercise modal.
3. **Analytics** - `volumeByMuscle` and `volumeWeekly` now use the
   per-muscle shares instead of a flat 100/30/10 split.
4. **Recovery map** - the same shares drive group and subgroup load: glutes,
   hamstrings, adductors, calves and stabilizers now receive their own fatigue
   and recovery, not only the primary group.
5. **Old snapshots** - the model derives from the exercise record, so old
   portal share payloads and old history rows get the same profile by ID/name.

## Caveats

- These are **approximate effort shares**, not EMG measurements. They are
  intentionally rounded and capped at 8 muscles.
- The role model is deterministic and conservative; exercises with unusual
  technique can still need a manual override. The override point is the
  exercise record's group/subgroup/synergist data plus the pattern profiles.
- The app's canonical groups stay broad for the main map (legs covers quads,
  glutes, hamstrings, calves, adductors). The new **subgroup** load carries the
  fine-grained view, so glutes/hamstrings are visible inside the legs group.
- Legacy custom records without a resolvable name/group keep the old
  100/30/10 fallback, so nothing crashes.

## Verification

- `node scripts/test-c188-muscle-roles.cjs` - 61 assertions, 0 failed.
- Existing suite: **53 test files**, all green.
- Browser check on the built app: Bulgarian split squat modal renders
  Quadriceps 40% / Glutes 25% / Hamstrings 10% / Adductors 8% / Calves 5% /
  Core 12%, with role labels and the "Muscle work" header.
- Browser check on the portal: `aResolveEx` and `recpResolveEx` pass all
  six contributions into analytics and recovery.
