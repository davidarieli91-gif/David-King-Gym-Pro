# c191 — profile open hotfix (all client cards blank)

## Symptom

After the c190 deploy, opening any client showed a blank profile area: only the
back button and "Edit" remained. Client names, stats, programs, nutrition and
documents were missing for every client.

## Root cause

c190 introduced a shared `_renderSeq` used by both `screens.profile.load()` and
`screens.profile.render()`.

The real dashboard click path is:

```js
screens.profile.load(id);
router.show('profile');
```

`router.show('profile')` immediately calls `refreshCurrent()`, which calls
`screens.profile.render()` while `load()` is still awaiting `db.get()`. That
`render()` incremented `_renderSeq`. When `db.get()` returned, `load()` saw a
different token and correctly treated its own response as stale — but it had
already been superseded by a render that had no client data yet. The result:

- `_client` was never assigned;
- `renderAsync()` returned because `_client` was empty;
- `#profile-body` stayed blank;
- this happened deterministically for every card opened through the UI.

The c190 browser verification called `screens.profile.load()` directly instead
of the real UI click sequence, so it did not exercise the router refresh and
missed the regression. Artificial delay tests also bypassed that path.

## Fix (c191)

- Load and render now use **separate tokens**:
  - `_loadSeq` guards only `load()` responses; a router refresh cannot cancel
    the load that is currently fetching the client.
  - `_renderSeq` guards only render passes.
- When `load()` switches to a different client, it clears the previous
  `_client` immediately for the duration of `db.get()`, so a router refresh
  cannot paint the previous client in the gap.
- `renderAsync()` additionally requires `_client.id === _clientId` before
  painting.
- Build is `c191`; service-worker cache is `dk-gym-v218`, forcing devices that
  cached the broken c190 shell to update.

No database migration or data change is involved.

## Verification

Real UI flow against the built c191 app:

1. Seeded client A with a program and client B as a new, empty client.
2. Dashboard → click A: A profile renders, program `UI A PROGRAM` visible.
3. Back → dashboard → click B: B name renders, full profile body renders,
   programs section says `No active program`.

Delayed cross-client test through the real click handlers:

1. A's program query artificially delayed 1.6 s.
2. Click A, immediately go back and click new client B.
3. After A's old response resolves: profile remains B, body is rendered, B's
   program list is still empty. A's program does not leak.

Other checks:

- `node scripts/test-c191-profile-load.cjs` — 30/30.
- Full suite — all 55 `scripts/test-*.cjs` files pass.
- Build output: `c191`, `dk-gym-v218`.

## Deployment

The c191 deploy replaces c190. One hard refresh / app reopen is enough to load
the new service worker and the fixed profile. Existing data is untouched.
