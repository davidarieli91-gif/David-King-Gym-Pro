# Exercise taxonomy audit - c185/c186 (2026-10-21)

> c185 corrected the 39 inversions. c186 added the six subgroup fixes, bumped
> the migration flag to `migrated_taxonomy_c186`, the DB cache-bust to v54 and
> the SW cache to v213 so already-updated devices receive the second pass too.

## Scope

The shipped database contains **5,623 exercises**. The audit checked the primary
group/subgroup and the synergist list against the exercise name and the
technique text, and cross-checked same-name records from different sources.

Two automated passes were used:

1. **Name vs primary conflict** - 229 candidates where an exercise name pointed
   at a different primary group than the stored one, or where the inferred
   target was listed only as a synergist.
2. **Cross-source duplicates** - same English name with different primary groups
   in the BurnFit / GymVisual / GymImpulse imports.

The 229 candidates are intentionally treated as a review queue, not as 229
automatic fixes: many are legitimate compound movements (close-grip push-ups,
bench dips, reverse curls, loaded carries, side-lying abduction, etc.).

## Result

- **34 unambiguous abdominal inversions** were corrected. These had an
  abdominal prime mover but were filed under legs / chest / back, with core
  (or obliques / rectus abdominis) in the synergist list. This is exactly the
  pattern in the reported screenshot.
- **5 opposite-direction inversions** were corrected where abs was stored as
  the primary group but the real prime mover is legs, shoulders, chest or back.
- **6 subgroup corrections** were made where the primary group (legs) was
  right but the target was filed under Quadriceps instead of the hip flexors
  or glutes named by the technique.
- **45 records total** were changed at the source in `exercise-db.json`.
- Ambiguous cases were left alone (see below).

## The reported exercise

`bf_weighted-abdominal-hip-thrust` (RU: "Тазовые подъемы с весом на пресс")
and its unweighted twin `bf_abdominal-hip-thrust` were:

- before: primary **Legs / Glutes**, synergists hamstrings + core
- after: primary **Abdominals / Lower**, synergists hip flexors + glutes + hamstrings

The technique text explicitly says to press down with the core and keep the
lower back from arching; the legs are stabilizers, not the target.

## Changed records

| id | exercise (EN) | new primary / subgroup | new synergists | class |
|---|---|---|---|---|
| `bf_abdominal-hip-thrust` | Abdominal Hip Thrust | Abdominals / Lower | hip flexors, glutes, hamstrings | abs inversion |
| `bf_weighted-abdominal-hip-thrust` | Weighted Abdominal Hip Thrust | Abdominals / Lower | hip flexors, glutes, hamstrings | abs inversion |
| `gi_0103` | Barbell Standing AB Rollout | Abdominals / Upper | Deltoid Posterior, Levator Scapulae, Teres Major | abs inversion |
| `gi_1193` | Iron Cross Plank | Abdominals / Obliques | Gluteus Maximus, shoulders | abs inversion |
| `gi_1478` | Jack Plank | Abdominals / Upper | Deltoid Anterior, Gluteus Maximus, Tensor Fasciae Latae, Triceps Brachii, Gluteus Medius | abs inversion |
| `gi_2152` | Resistance Band Front Plank With Kicked Leg | Abdominals / Upper | Deltoid Anterior, Hamstrings, Quadriceps, Tensor Fasciae Latae, Gluteus Maximus | abs inversion |
| `gi_2793` | Plank Walk-Up | Abdominals / Upper | shoulders, triceps | abs inversion |
| `gi_3337` | Dumbbell Side Bridge | Abdominals / Obliques | shoulders | abs inversion |
| `gi_5047` | Side Bridge with Bent Leg | Abdominals / Obliques | shoulders | abs inversion |
| `gi_5497` | Dumbbell Plank Pass Through | Abdominals / Upper | Deltoid Anterior, Deltoid Lateral, Deltoid Posterior, Gluteus Maximus, Gluteus Medius, Infraspinatus, Tensor Fasciae Latae, Teres Major, Teres Minor, Trapezius Middle Fibers, Triceps Brachii | abs inversion |
| `gi_0701` | Side Bridge (bent knee) | Abdominals / Obliques | shoulders | abs inversion |
| `gi_0702` | Side Bridge (knee tuck) | Abdominals / Obliques | shoulders | abs inversion |
| `gi_1243` | Dead Bug (version 2) | Abdominals / Lower | hip flexors | abs inversion |
| `gi_1246` | Hollow Hold | Abdominals / Lower | hip flexors | abs inversion |
| `gi_2838` | Bicycle | Abdominals / Obliques | hip flexors | abs inversion |
| `gi_3336` | Dumbbell V-up | Abdominals / Lower | hip flexors | abs inversion |
| `gi_3515` | Oblique V-up on Floor | Abdominals / Obliques | hip flexors | abs inversion |
| `gi_4250` | Dumbbell V-up (VERSION 2) | Abdominals / Lower | hip flexors | abs inversion |
| `gi_4535` | Kettlebell Single Arm Sit-Up | Abdominals / Upper | hip flexors, shoulders | abs inversion |
| `gi_4982` | Negative Dragon Flag | Abdominals / Lower | hip flexors, glutes | abs inversion |
| `gi_3512` | Resistance Band Upper Body Dead Bug | Abdominals / Upper | Deltoid Posterior, Latissimus Dorsi, Teres Major, Teres Minor, hip flexors | abs inversion |
| `gi_0622` | Lying Scissor Kick | Abdominals / Lower | hip flexors | abs inversion |
| `gi_1244` | Flutter Kicks (version 3) | Abdominals / Lower | hip flexors | abs inversion |
| `gi_2891` | Flutter Kicks (hands under - hips head up) | Abdominals / Lower | hip flexors | abs inversion |
| `gi_3890` | Hanging Knees to Elbows | Abdominals / Lower | hip flexors, forearms | abs inversion |
| `gi_3891` | Hanging Toes to Bar | Abdominals / Lower | hip flexors, forearms | abs inversion |
| `gi_3962` | Seated Flutter Kick | Abdominals / Lower | hip flexors | abs inversion |
| `gi_4373` | Hanging Deadbug | Abdominals / Lower | hip flexors, forearms | abs inversion |
| `gi_4766` | Hanging Flutter Kick | Abdominals / Lower | hip flexors, forearms | abs inversion |
| `gi_4767` | Hanging Knee Circle Raise | Abdominals / Lower | hip flexors, forearms | abs inversion |
| `gi_4768` | Incline Alternate Flutter Kicks | Abdominals / Lower | hip flexors | abs inversion |
| `gi_6810` | Resistance Band Lying Bent Knee Raise | Abdominals / Lower | hip flexors | abs inversion |
| `gi_8873` | Weighted Dumbbell Lying Knee Raise | Abdominals / Lower | hip flexors | abs inversion |
| `gi_9321` | Lying Floor Horizontal Flutter Kick | Abdominals / Lower | hip flexors | abs inversion |
| `gv_1688` | lunge with twist | Legs / Quadriceps | glutes, hamstrings, obliques | other inversion |
| `gi_10183` | Dumbbell Standing Front Raise Twist | Shoulders / Front | abdominals | other inversion |
| `gv_0778` | spider crawl push up | Chest / Middle | triceps, shoulders, abdominals | other inversion |
| `gi_4162` | Push up to Knee Tap | Chest / Middle | triceps, shoulders, abdominals | other inversion |
| `gi_6017` | Stepback Pulldown | Back / Lats | biceps, shoulders, glutes | other inversion |
| `gi_4287` | Knee Raise | Legs / Hip Flexors | abdominals | subgroup |
| `gi_10753` | Resistance Band Seated Knee Raise | Legs / Hip Flexors | abdominals | subgroup |
| `gi_0459` | Flutter Kicks | Legs / Glutes | hamstrings | subgroup |
| `gi_1179` | Flutter Kicks (version 2) | Legs / Glutes | hamstrings | subgroup |
| `gi_4779` | Reverse Flutter Kick on Floor (hand under head) | Legs / Glutes | hamstrings | subgroup |
| `gi_4980` | Reverse Flutter Kick on Floor (hand under head) | Legs / Glutes | hamstrings | subgroup |

## Deliberately not changed (examples)

These were flagged by the broad name heuristic but are not inversions, so the
audit left their taxonomy intact:

- `gi_4051` Side Lying Leg Raise, `gi_3929` Standing Side Leg Raise,
  `gi_3264` Side Plank Leg raise, `gi_3268` Lying Leg Raise to Side,
  `gi_9849` Side Plank Clamshell - abduction work, not abs.
- `gi_3460` / `gv_1775` Side Plank Hip Adduction - adductors, not abs.
- `gi_0459`, `gi_1179`, `gi_4779`, `gi_4980` prone flutter kicks were not
  abdominal exercises; their group stayed legs, but their target was corrected
  from Quadriceps to Glutes (subgroup fix).
- `gi_6423` Bodyweight Triceps Extension from Plank - triceps.
- `gi_3266` Elbow Push up - actually a forearm plank hold; abs is correct.
- `gi_10097` Weighted Plate Side-up Squat - the technique is a side crunch;
  abs/obliques is correct despite the word "squat".
- `gi_3479`, `gi_3494`, `gi_3774`-`gi_3776`, `gi_3524` - real squats /
  step work with a Pallof or heel-touch component; legs remain primary.
- `gi_0762`, `gi_1120` - rows deliberately emphasizing rear delts; the
  technique says so, so shoulders/rear is correct.

## Remaining caveats

- The app's canonical groups are intentionally broad: **legs** covers glutes,
  quads, hamstrings, calves, adductors and hip flexors. A group-level engine
  cannot show a 10% leg stabilizer separately from a 30% leg synergist; the
  primary/secondary inversion is fixed, but sub-group credit is still coarse.
- Some `gi_` imports remain suspicious outside the audited 45 (for example
  exercise-name mismatches in compound carries/throws). They were not changed
  without a clear technique/label match. The full candidate list is in
  `reports/taxonomy-candidates.txt`.
- Existing trainer installs are healed in place by the c185 migration; old
  client share snapshots are corrected by exercise id at render/analytics time,
  so a re-share is not required for the fixed records.

## Verification

- `node scripts/test-c185-taxonomy.cjs` - 220 assertions, 0 failed.
- Existing unit/static suite re-run; all 52 test files green.
- `exercise-db.json` still parses and `JSON.stringify(parsed)` is byte-identical
  to the written file.
- Built app checked in a browser: the trainer migration turned
  `bf_weighted-abdominal-hip-thrust` into **Abdominals / Lower** with
  hip flexors + glutes + hamstrings, and its card chips now render
  **"Пресс" as primary** and **"Ноги" as auxiliary**.
- The portal was checked with an OLD synthetic snapshot (`g: legs`,
  `syn: hamstrings + core`): `aGroupOf()` now returns `abdominals`,
  `recpExInfo()` returns one deduped `legs` synergist, and `aResolveEx()`
  returns the corrected synergist list.
