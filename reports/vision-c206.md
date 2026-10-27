# c206 - one dark glass image plate for every exercise source

## What was wrong

The card shells already followed the theme, but the **image plates inside
them** did not:

- Burnfit and Gym Visual turned into neon x-ray plates in dark themes.
- RepDB kept its light-blue flat-art background, so the card still looked
  light.
- GymImpulse renders kept their own black plate instead of the shared glass.
- The client portal only covered **animated pairs**; a single-image
  thumbnail (the common case) had no dark plate at all.
- The pre-workout day preview and the trainer's builder rows used the same
  white-background thumbnails outside the live-workout card.
- The rest field picked up the gradient `bg-surface-2` panel instead of the
  solid input plate, which could render as a light patch in some themes.

## What changed

### One treatment for all four databases

The shared stylesheet now matches images by source path and source class, so
**every renderer** in both portals gets the same result:

- **Burnfit / Gym Visual** - white-background line art is inverted, brightened
  and screened onto the dark plate (the original x-ray look).
- **RepDB** - flat art is inverted with a 180° hue rotation, so the light-blue
  plate becomes deep navy glass while the illustration stays readable.
- **GymImpulse** - the black background is screened away, leaving the white
  anatomy render floating on the glass plate.
- Every picker card gets the same dark radial stage, so the four source tabs
  now share one card language. The card shell itself remains the themed
  `--v2-surface` glass with the same border and shadow.

The rules use both `src*="/images/..."` and the `.v2-src-*` classes, so they
cover:

- the exercise picker modal (all four tabs);
- the Exercise DB tab grid and tree/search thumbnails;
- trainer live-workout cards;
- the pre-workout day preview and program-builder rows;
- the large exercise modal media;
- client live-workout thumbnails, both animated pairs and single images.

Only dark themes are affected. Light themes keep the original artwork on
light cards.

### Rest field

- `.rest-sec-input` now uses the solid `--v2-input-bg` plate instead of the
  gradient panel, with themed text.
- A 3-digit value such as `180` is visible in the 68 px field on both
  portals and in the trainer's program builder.

## Verification

- `scripts/test-c206.cjs`: 20/20 checks (all four source filters, dark-only
  scope, card shells, every renderer, rest plate, versions).
- Puppeteer visual checks in `v2-honey` dark:
  - Burnfit, Gym Visual, GymImpulse and RepDB tabs all show the same dark
    glass card;
  - computed filters: BF/GV invert+screen, RepDB invert+hue+screen,
    GymImpulse screen;
  - trainer day-preview thumbnails and client live thumbnails are dark;
  - the client rest field renders `180` on a solid dark plate;
  - light theme keeps the original images and light cards.
- Full test suite stays green.

## Version

- Trainer build `c206`, `RUNNING = 206`.
- Service worker cache `dk-gym-v233`.
