/* c101 part 2 — crop the exercise-picker SVG viewBox so the SVG figure fills
   its box exactly like the embedded 3D body (~94%): the raw viewBox
   «0 0 160 360» carries ~23% of empty space below the feet (measured content:
   front x19.5-140.5 y4-276, back y4-304, side x37.3-112 y6-294 in a 200-wide
   viewBox), which made the two figures look different-sized even in equal
   boxes. Crop windows keep the box's 160:360 ratio → no letterboxing, figure
   fills 96-97% of the box height. Hit-testing unaffected (viewBox scales,
   no transforms). Applied ONLY in the two exercise contexts (Quick Pick
   modal + Exercise DB panel) — the standalone Body map screen and the
   recovery maps keep the raw viewBox. Also: the panel's inline
   svg.style.maxWidth/height override is removed — the c101 CSS drives the
   box now (44vh cap). */
const fs = require('fs');

function patch(file, fn) {
  const before = fs.readFileSync(file, 'utf8');
  let s = before;
  const repOnce = (a, b, tag) => {
    if (!s.includes(a)) throw new Error(`[${file}] MISS ${tag || ''}: ${String(a).slice(0, 90)}`);
    s = s.replace(a, b);
  };
  fn(s, repOnce, (x) => { s = x; });
  if (s === before) throw new Error(`[${file}] no changes`);
  fs.writeFileSync(file, s);
  console.log(`[${file}] patched OK (${before.length} -> ${s.length} chars)`);
}

patch('fitness-crm.html', (s0, once, set) => {
  /* ---- Quick Pick modal: renderBodySVG ---- */
  once(
`        container.innerHTML = _view === 'front' ? window.BM_SVG_FRONT : _view === 'back' ? window.BM_SVG_BACK : window.BM_SVG_SIDE;`,
`        container.innerHTML = _view === 'front' ? window.BM_SVG_FRONT : _view === 'back' ? window.BM_SVG_BACK : window.BM_SVG_SIDE;
        /* c101: crop the viewBox to the figure — the raw «0 0 160 360» carries
           ~23% of empty space below the feet, so the SVG figure looked smaller
           than the 3D body inside an equal box. The windows keep the box's
           160:360 ratio, so the figure now fills its box like the 3D one. */
        try {
          if (!window.BM_VIEW_CROP) window.BM_VIEW_CROP = { front: '17.8 0 124.4 280', back: '10.7 -4 138.7 312', side: '8 0 133.3 300' };
          const _sv101 = container.querySelector('svg');
          const _cr101 = window.BM_VIEW_CROP[_view];
          if (_sv101 && _cr101) _sv101.setAttribute('viewBox', _cr101);
        } catch (_e101) {}`);

  /* ---- Exercise DB panel: _renderBmSvg (drop the inline size override + crop) ---- */
  once(
`      const svg = bmSvgContainer.querySelector('svg');
      if (svg) { svg.style.maxWidth = 'calc(160px * var(--ui-bodymap, 1))'; svg.style.height = 'auto'; }`,
`      const svg = bmSvgContainer.querySelector('svg');
      /* c101: the inline size override is gone — CSS drives the box now
         (height-capped at 44vh so both bodies fit the screen together); the
         viewBox is cropped to the figure like in the Quick Pick modal */
      try {
        if (!window.BM_VIEW_CROP) window.BM_VIEW_CROP = { front: '17.8 0 124.4 280', back: '10.7 -4 138.7 312', side: '8 0 133.3 300' };
        const _cr101 = window.BM_VIEW_CROP[view];
        if (svg && _cr101) svg.setAttribute('viewBox', _cr101);
      } catch (_e101) {}`);
});

console.log('c101 part-2 patch complete');
