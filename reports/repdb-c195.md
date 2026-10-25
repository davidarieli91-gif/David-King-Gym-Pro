# c195 — equipment taxonomy + RepDB subgroup cleanup

## Goal

Make the grouping above the exercise cards useful in all four separate bases
(Burnfit, Gym Visual, GymImpulse, RepDB Free):

- no group/chip without exercises;
- one sensible equipment order everywhere;
- correct RepDB leg subgroups;
- no mixing of the four sources.

Animations were deliberately left untouched.

## Canonical equipment taxonomy

`fitness-crm.html` now has a single `EQUIPMENT_TAXONOMY` with 33 keys,
EN/RU/HE labels and raw-label aliases. Every source is unpacked through
`canonicalEquipmentKey()`.

Display order (also used by the second exercise browser and the program
auto-generator):

1. Barbell
2. EZ-Bar
3. Trap Bar
4. Plate (“Диски”)
5. Dumbbell
6. Kettlebell
7. Cable / Crossover
8. Machine
9. Bench
10. Box
11. Bodyweight
12. Weighted
13. Assisted
14. Pull-up Bar
15. Dip Station
16. Rings
17. Band
18. Suspension
19. Medicine Ball
20. Stability Ball / Fitball
21. Bosu
22. Ab Wheel
23. Rope
24. Battle Rope
25. Jump Rope
26. Cardio Machine
27. Sled
28. Foam Roller
29. Mobility Stick
30. Strongman
31. Sandbag
32. Wrist Roller
33. Other

Raw aliases repaired include:

- `none` → Bodyweight
- `exercise_ball` → Stability Ball (was Bodyweight)
- `bosu` → Bosu (was Bodyweight)
- `foam_roll` / `roller` → Foam Roller (was Bodyweight)
- `wheel_roller` → Ab Wheel
- `sled_machine` → Sled
- `smith_machine` → Machine
- `plates` → Plate
- `assisted` / `weighted` kept as their own groups
- GI `other` split by name: bar bands → Band, battling ropes → Battle Rope,
  suspenders/suspension → Suspension, rings → Rings, sticks/PVC → Mobility
  Stick, vibration plate → Machine, Strongman/Sandbag/Plate/Sled → their groups.

Result: all 6,273 records map to a real canonical type; the “Other” chip is
not rendered because no record needs it.

## RepDB leg split

Previously 92 of 142 leg exercises were filed as “Glutes” because RepDB lists
`gluteus_maximus` first for squats and lunges. The movement name now decides:

| Subgroup | Count |
|---|---:|
| Quadriceps | 67 |
| Hamstrings | 21 |
| Glutes | 19 |
| Abductors | 15 |
| Calves | 13 |
| Adductors | 7 |
| **Total** | **142** |

Examples:

- squat / lunge / step-up / leg press / leg extension → Quadriceps
- RDL / deadlift / swing / pull-through / leg curl / good morning → Hamstrings
- glute bridge / hip thrust / kickback / glute drive → Glutes
- calf / tibialis / heel raise → Calves
- hip abduction / clamshell / lateral walk → Abductors
- hip adduction / Cossack / side lunge → Adductors

## UI changes

- Equipment chips are sorted by `EQUIPMENT_ORDER`, not alphabetically.
- Every chip and subgroup shows its real count.
- A chip is only rendered when at least one exercise is in the current
  source/group/subgroup scope.
- If a selected chip disappears after a group/subgroup/body-map/source change,
  the equipment filter resets to “All” instead of showing an empty grid.
- Group tree order is one shared `GROUP_ORDER` in every source and in the
  Exercises tree.
- Subgroup order is group-specific, e.g. legs:
  Quadriceps → Hamstrings → Glutes → Adductors → Abductors → Calves.
- The second exercise browser and the program auto-generator use the same
  canonical keys/labels/order.
- Custom exercises saved from the form get canonical equipment fields.
- “Grip” received RU/HE labels.

## Migration

`migrateExerciseTaxonomyC195()` runs once per device (`migrated_taxonomy_c195`):

- patches only equipment fields for all matched shipped records;
- patches subgroup + folder path for RepDB rows;
- preserves names, technique, media, archive state and trainer edits;
- normalises custom records from their current equipment value;
- `seedRepDBBase()` keeps syncing subgroup/folder/equipment on later boots.

Existing source counts are unchanged:

- Burnfit 324
- Gym Visual 1,030
- GymImpulse 4,269
- RepDB 650
- total 6,273

## Verification

- Build **c195**, SW cache **dk-gym-v222**, DB cache-bust **v57**, RUNNING 195.
- 57 test files pass, including `test-c195-groups.cjs` (66/66) and
  `test-c193-repdb.cjs` (46/46).
- Fresh-origin seed test: 6,273 rows, 650 RepDB, correct leg split.
- Browser check on all four tabs: every equipment chip has a count and every
  chip click returns at least one exercise; no empty group headers or
  subgroups.
- RepDB legs: 67 / 21 / 19 / 7 / 15 / 13.
- Stale-chip case: select “Колесо для пресса” → switch to Back → filter resets,
  “All” active, 94 Back exercises shown.

## Deploy

- Commit `73e622b` pushed to `main`; GitHub Actions run **40196549861** —
  success.
- Live page verified at
  `https://davidarieli91-gif.github.io/David-King-Gym-Pro/fitness-crm.html`:
  build **c195**, SW cache **dk-gym-v222**.
- Live browser check (RU): RepDB 25 equipment chips + “All”, all with counts
  and zero empty; 11 group folders with zero empty; leg subgroups
  67 / 21 / 19 / 7 / 15 / 13.
- Live source tabs: Burnfit 6 chips, Gym Visual 16, GymImpulse 26, RepDB 25 —
  no chip with zero exercises on any tab.
