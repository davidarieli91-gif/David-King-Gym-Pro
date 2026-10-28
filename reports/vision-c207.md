# c207 - restore Settings, Analytics and Tools

## Root cause

The c204 nutrition rebuild left the `[data-screen="nutrition"]` wrapper
unclosed. Tools, Analytics and Settings were parsed as **children of the
Nutrition screen** instead of direct mounts of the router:

```
[data-screen="nutrition"]
  ...
  [data-screen="tools"]
  [data-screen="analytics"]
  [data-screen="settings"]
```

The router correctly removed the `hidden` class from the selected screen, but
its ancestor (the hidden Nutrition screen) still had `display:none`. The result
was a visible nav item and a blank page. In the browser the selected screen
had `opacity:0`, `width:0`, `height:0`, and `getClientRects().length === 0`.

## Fix

Added the missing closing `</div>` immediately after the nutrition modals and
before the Tools screen. The three screens are now direct siblings of every
other `[data-screen]` mount.

No JS or data logic changed. Settings panels, Analytics selectors and all three
Tools calculators are untouched.

## Regression guard

`scripts/test-c207.cjs` walks the HTML div depth from the Nutrition opening to
the Tools opening (skipping comments/scripts/styles) and asserts depth `0` at
the Tools mount. It also checks that all three screens and the Settings panels
still exist.

## Verification

- Browser smoke test at 1800×1000, dark and light themes:
  - Settings renders its Appearance, Branding, Backup, Trainer Reminders,
    Cloud and AI panels;
  - Analytics renders the client selector and range tabs;
  - Tools renders the calorie calculator with its full form.
- `scripts/test-c207.cjs`: 10/10.
- Full suite: 65 test files, all green.
- `npm run build`: success.

## Version

- Trainer build `c207`, `RUNNING = 207`.
- Service worker cache `dk-gym-v234`.
