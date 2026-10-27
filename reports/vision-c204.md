# c204 - one food catalog + seven art themes

## One food catalog

The two product bases are now one system:

- `food_database` (the curated reference catalog) and `food_base` (custom
  products and cached OpenFoodFacts items) are merged by id, normalized and
  shown as **one catalog**.
- Recipes are excluded from the product catalog and stay in the Recipes tab.
- Archived items stay in Archive mode and can be restored from either store.
- Editing/deleting a custom item writes back to `food_base`; a reference item
  writes back to `food_database`. No duplicate shadow copies.

### 14 shared groups

Both the big Products screen and the right rail use the same 14 groups:

1. Vegetables & greens
2. Fruits & berries
3. Meat & poultry
4. Fish & seafood
5. Eggs
6. Dairy & cheese
7. Grains & bakery
8. Legumes
9. Nuts & seeds
10. Oils & fats
11. Drinks
12. Sweets
13. Sauces & condiments
14. Other

All + 14 group chips are visible. The hidden legacy category select is kept
only for compatibility.

### Products screen

- "All" is a grid of **14 equal group tiles** (no more hero/wide/small bento
  sizes). Each tile has a 2x2 photo collage with `object-contain`, so the
  complete product image is visible.
- Clicking a group immediately opens **all its product cards** - no extra
  sub-folder step and no 60-item pagination.
- Every product card is equal: square photo stage, full image (`object-contain`),
  name, calories and semantic P/C/F badges.
- Search, smart shelves, group chips and edit/archive modes still work.
- The group header has "All groups", the group name and the live count.

### Right rail catalog

- Rail width increased from 342 to **372 px** without changing the glass look.
- The rail now contains **All + 14 groups** and renders **every matching
  product**, in a scrollable 468 px product window.
- Cards are larger (3 columns) and use the same photo/name/kcal/macro
  language as the big catalog.
- Clicking a card opens the **same product detail modal** as the big catalog.
  The modal header now has an **Add to plan** action that opens the portion
  calculator with the exact product.
- Cards are draggable. Dropping one on any meal row adds the product to that
  meal (serving size when known, otherwise 100 g), saves the record and
  refreshes the totals. Drop target rows show a clear "Drop here" overlay.

### Picker and plans

- The meal-plan picker reuses the same 14 groups, equal photo cards and smart
  shelves. It no longer shows sub-folders or pagination.
- `nutritionPlans.loadFoods()` now merges both stores too, so custom products
  are available inside plan builders.

## Seven new themes

Added as full Vision presets (palette + glass + scene + charts + particles):

- **Honey Ember** - dark gold / amber (the dark-yellow reference)
- **Apricot Bloom** - light peach / orange (the light-orange reference)
- **Jade Empire** - dark emerald + gold
- **Plum Noir** - dark plum / rose gold
- **Blue Horizon** - dark navy / cyan / coral
- **Sandstone** - light warm sand / olive
- **Sky Blossom** - light sky blue / coral

The app now has **13 themes** (7 dark, 6 light), shared by the trainer and the
client portal.

### Visual upgrade

- Every theme scene now has a soft conic light-beam layer plus its existing
  radial/linear gradients; the seven new themes also have bespoke conic scenes.
- Glass surfaces use stronger blur/saturation and an inner highlight.
- Theme cards are larger, with a glossy top reflection, a conic sheen and a
  subtle preview zoom on hover.
- Theme hint and pickers now say 13 worlds.
- Portal CSS and portal theme registry receive the same seven presets.

## Verification

- Build **c204**, SW cache **dk-gym-v231**.
- **58 catalog regression files + 66 Vision checks** in the suite; `scripts/test-c204.cjs` adds 63 checks for the
  merged catalog, equal cards, all-product rail, drag/drop, detail add, themes,
  i18n and versions. `test-c162` was updated from the old bento/paging model to
  the 14-group model.
- Puppeteer QA (headless Chrome, 1440x1100 + 390x844):
  - 17/17 checks passed: 14 group tiles, 15 chips, full-photo group tiles,
    complete vegetable product grid, shared detail modal, Add to plan,
    drag-to-meal, full rail scroll, 15 rail groups, right-rail preview,
    portion calculator, recipes after the merge, 13-theme grid, theme registry dark/light.
  - Screenshots checked for dark/light plan, honey, apricot, jade, plum,
    horizon, sand, sky, the 13-theme gallery and mobile apricot.
- No changes to the c202 3D atlas or the accepted skeleton overlay.

## Files

- `fitness-crm.html` - merged catalog, 14 groups, right rail, drag/drop,
  detail add, 7 theme presets.
- `client.html` - same 7 presets in the portal.
- `src/nutrition-dashboard.css` - catalog cards, rail scroll, drop states,
  wider rail.
- `src/i18n/en.json`, `ru.json`, `he.json` - group labels, drag/drop,
  add-to-plan and 13-theme hint.
- `scripts/test-c204.cjs` - new c204 regression suite.
- `scripts/test-c162.cjs` - updated to the unified catalog.
- `sw.js` - cache v231.
