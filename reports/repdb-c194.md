# c194 — RepDB modal image fills the card

## Root cause

The exercise modal media slot is a CSS grid with `place-items: center`:

```css
#exercise-gif-slot { display: grid; place-items: center; }
```

Percentage height on a grid item is resolved against the grid area, but with
centered items the media child (`.ex-anim-container` / `<img>`) kept its
intrinsic height. The slot was about 442 px, while the image rendered at about
225 px and was centered inside it. This looked like a “small image inside a big
card” and affected the RepDB modal cards even after the media slot was made
full width.

## Fix

- Added an explicit full-width media slot and removed viewport `max-height`
  shrinkage.
- Changed the slot to a column flex container and stretched its media child:
  - `.ex-anim-container`,
  - direct `<img>`,
  - the GIF wrapper `.relative`.
- The attribution line remains below the image and does not stretch.
- Added an inline fallback on `#exercise-gif-slot` so cached/older CSS cannot
  shrink it.

Measured result in the built app:

| Element | Before | After |
| --- | --- | --- |
| slot | 442 px | 442 px |
| animation/image | ~225 px high | ~423 px high |

The image now fills the card width and height, with only the attribution line
using the remaining space.

## Login version

The static login footer still said `c184`; it now says `c194`. The build meta
and update checker already used the current build.

## Verification

- Browser: Ab Wheel Rollout, Barbell Curl and 90/90 Hold modal images all fill
  the media card.
- `node scripts/test-c193-repdb.cjs` (now c194 checks): **46/46**.
- Full suite: **56 test files pass**.
- Build **c194**, SW **v221**.

## Still next

The 165 deep calisthenics 2.5D animations remain the next production phase.
c194 is the data/translations/card-fit layer; all 650 currently use the
two-frame/hold baseline animation.
