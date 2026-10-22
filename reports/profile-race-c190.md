# c190 — profile client-switch race (new client showing another client's programs)

## Symptom

A newly created client with no program could show another client's programs after the
trainer visited that other client and returned. The same card could show different
program sets on repeated visits. This was a UI data-isolation bug, not a database
corruption: the stored programs still belonged to their real clients.

## Root cause

`client_programs` were queried with the correct `client_id`, but the profile screen
had several unguarded asynchronous paths writing into global DOM nodes:

1. `screens.profile.load()` awaited `db.get('clients', id)` and then assigned the
   result to the shared `_client` variable. A slow response for client A could
   arrive after the trainer had already opened client B and overwrite B.
2. `renderAsync()` awaited the panel layout and then called `pfPaint()` without
   checking whether the profile had changed during the await. The old render could
   paint A's card after B was selected.
3. `loadPrograms()` awaited the program query, the exercise cache and rotation
   history, then wrote into the global `#programs-active-section`. A delayed query
   for A could therefore paint A's programs into B's profile. A new client has an
   empty section, so the stale write was especially visible there.
4. `nutritionPlans.loadPlans()` had the same pattern (`_all` + shared section), so
   nutrition plans could leak across clients in the same way.

The race existed in the async architecture; c188/c189 added more asynchronous work
and made the window easier to hit. It was not an intentional behavior and no code
was supposed to copy programs between clients.

## Fix (c190)

- Profile load/render tokens:
  - `screens.profile.load()` captures the requested client id and a `_renderSeq`.
    The `db.get` result is applied only if it is still the newest request.
  - `renderAsync(seq)` re-checks the token and client id before writing the header
    and again after `pfLoadLayout()` before `pfPaint()`.
  - Manual panel re-render uses the same token.
- Program-load isolation:
  - `loadPrograms(clientId)` refuses to run unless `clientId` is the currently
    selected profile client.
  - It captures `#programs-active-section` before any await and uses a separate
    `_programsSeq` plus a `still()` predicate after **every** await (program query,
    exercise cache, rotation history) and before painting the archived section.
  - A stale load exits without touching the DOM.
- Nutrition-load isolation:
  - `nutritionPlans.loadPlans()` uses `_plansSeq`; only the newest result updates
    `_all` and renders.
  - `renderPlansList()` also rejects a client id that does not match the loaded
    plan owner.

No IndexedDB migration, record rewrite or client-data deletion was required. The
fix changes only the timing/isolation of UI reads.

## Verification

- `node scripts/test-c190-profile-race.cjs` — 26/26 checks.
- Full suite — all 55 `scripts/test-*.cjs` files pass.
- Build — `dist/fitness-crm.html` is `c190`; `dist/sw.js` cache is `dk-gym-v217`.

Browser race simulations against the built app (artificial 900 ms delay for client A):

| Scenario | Result |
| --- | --- |
| A (client query delayed) → switch to B | B name stays; B profile empty |
| A (programs query delayed) → switch to B | B name stays; `No active program` |
| A (nutrition query delayed) → switch to B | B name stays; `No active nutrition plan` |

The delayed old response no longer writes into the newly selected client's card.

## Deployment note

After deployment, one hard refresh / app update is enough to pick up `c190` and the
`v217` service-worker cache. Existing clients and programs are untouched.
