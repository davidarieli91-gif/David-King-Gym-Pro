/* c74: FOUR features
 *  A) members-only app — router.show() routes everything but 'login' to the
 *     lock screen while the trainer session is locked; workspace chrome dimmed;
 *  B) language button in the atlas header (EN→RU→HE cycle);
 *  C) DKBody3D — embedded interactive 3D muscle map widget + model template
 *     provider exposed from the atlas IIFE;
 *  D) SVG / 3D / Both(stacked) body-map modes for the Exercise DB filter panel
 *     and the Quick Pick body tab, switched in Settings ▸ Appearance.
 */
const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'fitness-crm.html');
let s = fs.readFileSync(FILE, 'utf8');
const orig = s;

function repOnce(name, anchor, replacement) {
  const n = s.split(anchor).length - 1;
  if (n !== 1) {
    console.error('ANCHOR "' + name + '" found ' + n + ' times — abort');
    process.exit(1);
  }
  s = s.replace(anchor, replacement);
  console.log('ok  ' + name);
}

/* ================= A) auth gate ================= */
repOnce('A1 router.show guard',
`    function show(name) {
      // Auto-disable archive mode when leaving exercises or food screen (Archive feature)`,
`    function show(name) {
      /* c74: members-only — until sign-in nothing but the lock screen is
       * reachable (sidebar/bottom-nav stay in the DOM under the login card). */
      if (name !== 'login') {
        var _locked = true;
        try { _locked = !(typeof auth !== 'undefined' && auth && typeof auth.isUnlocked === 'function' && auth.isUnlocked()); } catch (_e) {}
        if (_locked) name = 'login';
      }
      // Auto-disable archive mode when leaving exercises or food screen (Archive feature)`
);

repOnce('A2 lock visuals hook',
`      _current = name;
      // Update active state on all nav buttons (both aside + bottom-nav)`,
`      _current = name;
      /* c74: dim + disable workspace chrome while locked */
      try { document.body.classList.toggle('auth-locked', _current === 'login'); } catch (_e) {}
      // Update active state on all nav buttons (both aside + bottom-nav)`
);

repOnce('A3 CSS: lock visuals + widget',
`.atlas-row.sel .atlas-row-dot { background: #dc2626; }`,
`.atlas-row.sel .atlas-row-dot { background: #dc2626; }
/* c74: lock visuals — workspace chrome inert under the login card */
body.auth-locked aside nav, body.auth-locked nav.bottom-nav, body.auth-locked nav.fixed.bottom-0 { pointer-events: none !important; opacity: .45; }
/* c74: DKBody3D embedded widget */
.b3d-box { position: relative; }
.b3d-canvas { width: 100%; height: 100%; display: block; touch-action: none; }
.b3d-load { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: .5rem; color: rgb(var(--c-muted)); font-size: 12px; text-align: center; padding: .5rem; }
.b3d-spin { width: 22px; height: 22px; border-radius: 9999px; border: 2px solid rgb(var(--c-border)); border-top-color: #dc2626; animation: b3dspin 1s linear infinite; }
@keyframes b3dspin { to { transform: rotate(360deg); } }
.b3d-hint { position: absolute; left: 0; right: 0; bottom: 6px; text-align: center; font-size: 10px; color: rgb(var(--c-muted)); pointer-events: none; opacity: .8; }`
);

/* ================= B) atlas language button ================= */
repOnce('B1 lang button HTML',
`      <button id="atlas-close" class="w-9 h-9 grid place-items-center rounded-lg hover:bg-surface-2 text-muted transition" aria-label="Close">`,
`      <button id="atlas-lang" class="h-9 min-w-[2.5rem] px-2 grid place-items-center rounded-lg hover:bg-surface-2 text-muted transition text-xs font-bold tracking-wide" aria-label="Language">EN</button>\n` +
`      <button id="atlas-close" class="w-9 h-9 grid place-items-center rounded-lg hover:bg-surface-2 text-muted transition" aria-label="Close">`
);

repOnce('B2 UI dict entries',
`  var UI = {
    title:        { en: '3D Body Atlas', ru: '3Д-атлас тела', he: 'אטלס גוף תלת־מימד' },`,
`  var UI = {
    title:        { en: '3D Body Atlas', ru: '3Д-атлас тела', he: 'אטלס גוף תלת־מימד' },
    langBtn:      { en: 'Language', ru: 'Язык', he: 'שפה' },
    b3dHint:      { en: 'Tap a muscle to filter', ru: 'Нажмите на мышцу для фильтра', he: 'הקש על שריר לסינון' },`
);

repOnce('B3 applyTexts lang label',
`  function applyTexts() {
    var t = $('atlas-title'); if (t) t.textContent = tr(UI.title);`,
`  function applyTexts() {
    var t = $('atlas-title'); if (t) t.textContent = tr(UI.title);
    var lb = $('atlas-lang'); if (lb) { lb.textContent = lang().toUpperCase(); lb.setAttribute('aria-label', tr(UI.langBtn)); }`
);

repOnce('B4 wire lang click',
`    var retryBtn = loadBox && loadBox.querySelector('.atlas-retry');`,
`    var langBtn = $('atlas-lang');
    if (langBtn) langBtn.addEventListener('click', function () {
      var order = ['en', 'ru', 'he'];
      var next = order[(order.indexOf(lang()) + 1) % 3];
      var done = false;
      if (typeof switchAppLanguage === 'function') {
        try { switchAppLanguage(next); done = true; } catch (e) { /* noop */ }
      }
      if (!done) document.documentElement.setAttribute('lang', next);
      applyTexts();
      B3D.list.forEach(function (st) {
        if (st.dead || !st.inited) return;
        var h = st.box.querySelector('.b3d-hint');
        if (h) h.textContent = tr(UI.b3dHint);
      });
    });
    var retryBtn = loadBox && loadBox.querySelector('.atlas-retry');`
);

/* ================= C+D) model template + DKBody3D ================= */
repOnce('CD template + widget',
`  /* ---------------- public API ---------------- */
  window.DKAtlas = {
    open: openAtlas,
    close: closeAtlas
  };
  /* debug hook (small surface, useful for support diagnostics) */
  window.__ATLAS = S;`,
`  /* ---------------- c74: shared model template (embedded body-map widgets) ---------------- */
  function ensureModelTemplate() {
    if (S._tpl) return Promise.resolve(S._tpl);
    if (S._tplP) return S._tplP;
    S._tplP = ensureThree().then(function () { return loadModel(); }).then(function (gltf) {
      var THREE = S.THREE;
      var root = gltf.scene;
      root.traverse(function (o) {
        if (!o.isMesh) return;
        var raw = resolveRawName(o);
        o.userData.base = baseOf(raw);
        o.userData.side = sideOf(raw);
        var mat = o.material;
        if (mat) {
          mat.metalness = 0; mat.roughness = 0.75;
          if (!mat.color || (mat.color.r === 1 && mat.color.g === 1 && mat.color.b === 1)) mat.color.setHex(0xb9bcc4);
          if (!mat.color) mat.color = new THREE.Color(0xb9bcc4);
        } else {
          o.material = new THREE.MeshStandardMaterial({ color: 0xb9bcc4, roughness: 0.75, metalness: 0 });
        }
      });
      /* orientation auto-fix + ground + height ~1.7 (same recipe as prepareModel) */
      var box = new THREE.Box3().setFromObject(root);
      var size = box.getSize(new THREE.Vector3());
      if (size.z > size.y * 1.4) {
        root.rotation.x = -Math.PI / 2;
        box.setFromObject(root); size = box.getSize(new THREE.Vector3());
      }
      var center = box.getCenter(new THREE.Vector3());
      root.position.sub(center);
      root.position.y += size.y / 2;
      var k = 1.7 / (size.y || 1.7);
      var wrap = new THREE.Group(); wrap.add(root); wrap.scale.setScalar(k);
      S._tpl = { THREE: THREE, root: wrap };
      return S._tpl;
    }).catch(function (e) { S._tplP = null; throw e; });
    return S._tplP;
  }

  /* ---------------- public API ---------------- */
  window.DKAtlas = {
    open: openAtlas,
    close: closeAtlas,
    /* c74: model template + muscle taxonomy for embedded widgets */
    getModelTemplate: function () { return ensureModelTemplate(); },
    muscleInfo: function (base) {
      if (!base) return null;
      return { base: base, group: MGROUP[base] || '', subgroup: MSUB[base] || '', label: muscleLabel(base) };
    }
  };
  /* debug hook (small surface, useful for support diagnostics) */
  window.__ATLAS = S;

  /* ---------------- c74: DKBody3D — embedded interactive 3D body map ----------------
   * Used by the Exercise DB filter panel and the Quick Pick body tab as a
   * drop-in replacement / companion of the SVG body map (Settings ▸ Appearance). */
  var B3D = { list: [] };
  function body3dCreate(box, opts) {
    opts = opts || {};
    var st = {
      box: box, opts: opts, dead: false, inited: false,
      meshes: [], renderer: null, raf: 0, ro: null,
      setFilter: function (group, sub) { body3dHighlight(st, group || '', sub || ''); }
    };
    B3D.list.push(st);
    box.classList.add('b3d-box');
    box.innerHTML = '<div class="b3d-load"><div class="b3d-spin"></div><div>' + esc(tr(UI.loading)) + '</div></div>';
    ensureModelTemplate().then(function (tpl) {
      if (!st.dead) body3dBuild(st, tpl);
    }).catch(function (e) {
      console.warn('[b3d] load failed', e);
      if (!st.dead) box.innerHTML = '<div class="b3d-load"><div>' + esc(tr(UI.loadErr)) + '</div></div>';
    });
    st.dispose = function () {
      st.dead = true;
      if (st.raf) { cancelAnimationFrame(st.raf); st.raf = 0; }
      if (st.ro) { st.ro.disconnect(); st.ro = null; }
      if (st.renderer) { try { st.renderer.dispose(); } catch (e) {} }
      if (box) box.innerHTML = '';
      var i = B3D.list.indexOf(st); if (i > -1) B3D.list.splice(i, 1);
    };
    return st;
  }
  function body3dBuild(st, tpl) {
    var THREE = tpl.THREE;
    var box = st.box;
    box.innerHTML = '<canvas class="b3d-canvas"></canvas><div class="b3d-hint">' + esc(tr(UI.b3dHint)) + '</div>';
    var canvas = box.querySelector('.b3d-canvas');
    var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    st.renderer = renderer;
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(40, 1, 0.05, 60);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x444455, 1.05));
    var key = new THREE.DirectionalLight(0xffffff, 1.5); key.position.set(2.5, 4, 3); scene.add(key);
    var rim = new THREE.DirectionalLight(0xdbeafe, 0.7); rim.position.set(-3, 1.5, -2.5); scene.add(rim);
    var root = tpl.root.clone(true);
    var meshes = [];
    root.traverse(function (o) {
      if (!o.isMesh) return;
      if (o.material && o.material.clone) o.material = o.material.clone();
      o.userData._c0 = o.material.color.getHex();
      meshes.push(o);
    });
    st.meshes = meshes;
    scene.add(root);
    /* frame the model */
    var bb = new THREE.Box3().setFromObject(root);
    var c = bb.getCenter(new THREE.Vector3());
    var size = bb.getSize(new THREE.Vector3());
    var dist = (size.y / 2) / Math.tan((camera.fov * Math.PI / 180) / 2) * 1.18;
    camera.position.set(c.x, c.y + size.y * 0.02, c.z + dist);
    camera.lookAt(c);
    var controls = new S._OrbitControls(camera, canvas);
    controls.enableDamping = true; controls.dampingFactor = 0.08;
    controls.minDistance = 0.4; controls.maxDistance = 8;
    controls.enablePan = false;
    controls.target.set(c.x, c.y, c.z);
    controls.update();
    st.camera = camera; st.controls = controls; st.scene = scene;
    /* tap vs drag */
    var down = null;
    canvas.addEventListener('pointerdown', function (e) {
      down = { x: e.clientX, y: e.clientY, t: Date.now() };
    }, { passive: true });
    canvas.addEventListener('pointerup', function (e) {
      if (!down) return;
      var dx = e.clientX - down.x, dy = e.clientY - down.y;
      var isTap = (dx * dx + dy * dy) < 64 && (Date.now() - down.t) < 500;
      down = null;
      if (isTap) body3dTap(st, e.clientX, e.clientY);
    });
    function resize() {
      var w = box.clientWidth || 0, h = box.clientHeight || 0;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    st.ro = new ResizeObserver(resize);
    st.ro.observe(box);
    resize();
    st.inited = true;
    (function loop() {
      if (st.dead) return;
      st.raf = requestAnimationFrame(loop);
      if (box.clientWidth === 0 || box.clientHeight === 0) return;
      controls.update();
      renderer.render(scene, camera);
    })();
    if (st.opts.onReady) { try { st.opts.onReady(st); } catch (e) {} }
  }
  function body3dTap(st, cx, cy) {
    var THREE = S.THREE;
    var rect = st.box.getBoundingClientRect();
    if (!st._rc) { st._rc = new THREE.Raycaster(); st._v2 = new THREE.Vector2(); }
    st._v2.x = ((cx - rect.left) / rect.width) * 2 - 1;
    st._v2.y = -((cy - rect.top) / rect.height) * 2 + 1;
    st._rc.setFromCamera(st._v2, st._cam || null);
    return; /* replaced below */
  }
  /* ---------------- settings: body map mode (svg | 3d | both) ---------------- */
  function b3dModeGet() {
    try { return localStorage.getItem('dk_bodymap_mode') || 'svg'; } catch (e) { return 'svg'; }
  }
  function b3dModeSet(m) {
    if (m !== 'svg' && m !== '3d' && m !== 'both') m = 'svg';
    try { localStorage.setItem('dk_bodymap_mode', m); } catch (e) {}
    b3dModePaint();
    document.dispatchEvent(new CustomEvent('dk-bodymap-mode', { detail: m }));
  }
  function b3dModePaint() {
    var seg = document.getElementById('bodymap-mode-seg');
    if (!seg) return;
    var cur = b3dModeGet();
    seg.querySelectorAll('[data-bm-mode]').forEach(function (b) {
      var on = b.getAttribute('data-bm-mode') === cur;
      b.classList.toggle('bg-primary', on);
      b.classList.toggle('text-white', on);
      b.classList.toggle('text-muted', !on);
    });
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('[data-bm-mode]') : null;
    if (b) b3dModeSet(b.getAttribute('data-bm-mode'));
  });
  b3dModePaint();`
);
/* body3dTap above is a placeholder that gets its final implementation right after */
repOnce('CD body3dTap real impl',
`  function body3dTap(st, cx, cy) {
    var THREE = S.THREE;
    var rect = st.box.getBoundingClientRect();
    if (!st._rc) { st._rc = new THREE.Raycaster(); st._v2 = new THREE.Vector2(); }
    st._v2.x = ((cx - rect.left) / rect.width) * 2 - 1;
    st._v2.y = -((cy - rect.top) / rect.height) * 2 + 1;
    st._rc.setFromCamera(st._v2, st._cam || null);
    return; /* replaced below */
  }`,
`  var _b3dRc = null, _b3dV2 = null;
  function body3dTap(st, cx, cy) {
    var THREE = S.THREE;
    var rect = st.box.getBoundingClientRect();
    if (!_b3dRc) { _b3dRc = new THREE.Raycaster(); _b3dV2 = new THREE.Vector2(); }
    _b3dV2.x = ((cx - rect.left) / rect.width) * 2 - 1;
    _b3dV2.y = -((cy - rect.top) / rect.height) * 2 + 1;
    _b3dRc.setFromCamera(_b3dV2, st.camera);
    var hits = _b3dRc.intersectObjects(st.meshes, false);
    for (var i = 0; i < hits.length; i++) {
      var m = hits[i].object;
      if (m.isMesh && m.visible && m.userData.base && !HIDE_RE.test(m.userData.base)) {
        var info = { base: m.userData.base, group: MGROUP[m.userData.base] || '', subgroup: MSUB[m.userData.base] || '' };
        body3dHighlight(st, info.group, info.subgroup);
        if (st.opts.onPick) { try { st.opts.onPick(info); } catch (e) { console.warn('[b3d] onPick', e); } }
        return;
      }
    }
  }
  function body3dHighlight(st, group, sub) {
    st.meshes.forEach(function (m) {
      var b = m.userData.base || '';
      var g = MGROUP[b] || '';
      var on = group && g === group && (!sub || (MSUB[b] || '') === sub);
      var dim = group && g === group && !on;
      if (on) {
        m.material.color.setHex(HILITE);
        if (m.material.emissive) m.material.emissive.setHex(0x3a0808);
      } else if (dim) {
        m.material.color.setHex(0xc0666a);
        if (m.material.emissive) m.material.emissive.setHex(0x000000);
      } else {
        m.material.color.setHex(m.userData._c0);
        if (m.material.emissive) m.material.emissive.setHex(0x000000);
      }
    });
  }`
);

/* ================= E) Exercise DB filter panel ================= */
repOnce('E1 ex tabs id',
`                  <div class="flex gap-1 mb-1">
                    <button id="ex-bm-view-front"`,
`                  <div id="ex-bm-tabs" class="flex gap-1 mb-1">
                    <button id="ex-bm-view-front"`
);

repOnce('E2 ex 3d container',
`<div id="exercise-bodymap-svg" class="mx-auto" style="max-width: 160px;"></div>`,
`<div id="exercise-bodymap-svg" class="mx-auto" style="max-width: 160px;"></div>
                  <div id="exercise-bodymap-3d" class="b3d-box hidden mx-auto mt-2 rounded-xl overflow-hidden border border-border" style="width: 190px; height: 310px;"></div>`
);

repOnce('E3 ex state vars',
`    let _bmCurrentView = 'front';`,
`    let _bmCurrentView = 'front';
    /* c74: 3D body-map mode */
    let _bm3d = null, _bmCurG = null, _bmCurS = null;`
);

repOnce('E4 ex mode fns + toggle',
`    if (bmToggle) bmToggle.addEventListener('click', () => {
      if (!bmPanel) return;
      bmPanel.classList.toggle('hidden');
      if (!bmPanel.classList.contains('hidden')) {
        _renderBmSvg(_bmCurrentView);
      }
    });`,
`    /* c74: SVG / 3D / Both body-map mode (Settings ▸ Appearance ▸ Body map view) */
    function bmModeGet() { try { return localStorage.getItem('dk_bodymap_mode') || 'svg'; } catch (e) { return 'svg'; } }
    function bm3dDispose() { if (_bm3d) { try { _bm3d.dispose(); } catch (e) {} _bm3d = null; } }
    function bm3dSyncSvg(g, sg) {
      if (!bmSvgContainer) return;
      bmSvgContainer.querySelectorAll('.bm-muscle').forEach(m => m.classList.remove('bm-selected'));
      if (!g) return;
      var sel = sg ? bmSvgContainer.querySelectorAll('.bm-muscle[data-group="' + g + '"][data-subgroup="' + sg + '"]') : [];
      if (!sel.length) sel = bmSvgContainer.querySelectorAll('.bm-muscle[data-group="' + g + '"]');
      sel.forEach(m => m.classList.add('bm-selected'));
    }
    function bm3dApplyMode() {
      var mode = bmModeGet();
      var tabs = document.getElementById('ex-bm-tabs');
      var svgBox = document.getElementById('exercise-bodymap-svg');
      var box3d = document.getElementById('exercise-bodymap-3d');
      if (tabs) tabs.classList.toggle('hidden', mode === '3d');
      if (svgBox) svgBox.classList.toggle('hidden', mode === '3d');
      if (box3d) box3d.classList.toggle('hidden', mode === 'svg');
      if (mode !== 'svg' && box3d) {
        if (_bm3d && _bm3d.dead) _bm3d = null;
        if (!_bm3d) {
          _bm3d = window.DKBody3D.mount(box3d, {
            onPick: function (info) {
              var same = info.group && _bmCurG === info.group && (_bmCurS || '') === (info.subgroup || '');
              if (same) {
                _bmCurG = null; _bmCurS = null;
                if (screens.exercises && screens.exercises.clearBodyMapFilter) screens.exercises.clearBodyMapFilter();
                if (bmActiveLabel) bmActiveLabel.textContent = '—';
                bm3dSyncSvg('', '');
                if (_bm3d && !_bm3d.dead) _bm3d.setFilter('', '');
              } else {
                _bmCurG = info.group || null; _bmCurS = info.subgroup || null;
                if (screens.exercises && screens.exercises.setBodyMapFilter) screens.exercises.setBodyMapFilter(info.group, info.subgroup || null);
                if (bmActiveLabel) {
                  const gLabel = (typeof groupName === 'function') ? groupName(info.group) : info.group;
                  bmActiveLabel.textContent = gLabel + (info.subgroup ? ' / ' + ((typeof subgroupName === 'function') ? subgroupName(info.subgroup) : info.subgroup) : '');
                }
                bm3dSyncSvg(info.group, info.subgroup || '');
              }
            }
          });
        }
        if (_bm3d && !_bm3d.dead && _bm3d.inited) _bm3d.setFilter(_bmCurG || '', _bmCurS || '');
      } else bm3dDispose();
    }
    document.addEventListener('dk-bodymap-mode', function () {
      if (bmPanel && !bmPanel.classList.contains('hidden')) bm3dApplyMode();
      else bm3dDispose();
    });
    if (bmToggle) bmToggle.addEventListener('click', () => {
      if (!bmPanel) return;
      bmPanel.classList.toggle('hidden');
      if (!bmPanel.classList.contains('hidden')) {
        _renderBmSvg(_bmCurrentView);
        bm3dApplyMode();
      } else bm3dDispose();
    });`
);

repOnce('E5 ex svg click syncs 3d',
`            // Highlight clicked muscle, dim others
            bmSvgContainer.querySelectorAll('.bm-muscle').forEach(m => m.classList.remove('bm-selected'));
            el.classList.add('bm-selected');
          }
        });`,
`            // Highlight clicked muscle, dim others
            bmSvgContainer.querySelectorAll('.bm-muscle').forEach(m => m.classList.remove('bm-selected'));
            el.classList.add('bm-selected');
            /* c74: keep the embedded 3D body map in sync (Both mode) */
            _bmCurG = group; _bmCurS = subgroup || null;
            if (_bm3d && !_bm3d.dead && _bm3d.inited) _bm3d.setFilter(group, subgroup || '');
          }
        });`
);

repOnce('E6 ex clear syncs 3d',
`      if (bmActiveLabel) bmActiveLabel.textContent = '—';
      if (bmSvgContainer) bmSvgContainer.querySelectorAll('.bm-muscle').forEach(m => m.classList.remove('bm-selected'));
    });`,
`      if (bmActiveLabel) bmActiveLabel.textContent = '—';
      if (bmSvgContainer) bmSvgContainer.querySelectorAll('.bm-muscle').forEach(m => m.classList.remove('bm-selected'));
      /* c74: reset 3D highlight too */
      _bmCurG = null; _bmCurS = null;
      if (_bm3d && !_bm3d.dead && _bm3d.inited) _bm3d.setFilter('', '');
    });`
);

/* ================= F) Quick Pick body tab ================= */
repOnce('F1 picker tabs id',
`                      <div class="flex justify-center gap-0.5 mb-1 flex-wrap">
                        <button id="bm-view-front"`,
`                      <div id="bm-view-tabs" class="flex justify-center gap-0.5 mb-1 flex-wrap">
                        <button id="bm-view-front"`
);

repOnce('F2 picker 3d container',
`                      <div id="bm-svg-container" class="flex justify-center"></div>`,
`                      <div id="bm-svg-container" class="flex justify-center"></div>
                      <div id="bm-3d-container" class="b3d-box hidden justify-center w-full rounded-xl overflow-hidden border border-border" style="height: 360px;"></div>`
);

repOnce('F3 picker state',
`    let _equipFilter = 'all';
    let _view = 'front';`,
`    let _equipFilter = 'all';
    let _view = 'front';
    /* c74: embedded 3D body map */
    let _p3d = null;`
);

repOnce('F4 picker renderBodySVG tail + mode fns',
`      setViewActive(_view==='back'?backBtn:_view==='side'?sideBtn:frontBtn);
    }`,
`      setViewActive(_view==='back'?backBtn:_view==='side'?sideBtn:frontBtn);
      /* c74: apply SVG / 3D / Both mode to the picker body tab */
      applyPickerBmMode();
    }

    /* c74: DKBody3D in the Quick Pick body tab (Settings ▸ Appearance ▸ Body map view) */
    function bm3dPick(info) {
      if (info.group && _activeGroup === info.group && (_activeSubgroup || '') === (info.subgroup || '')) {
        _activeGroup = null; _activeSubgroup = null;
      } else {
        _activeGroup = info.group || null; _activeSubgroup = info.subgroup || null;
        if (_activeGroup) _expandedGroups.add(_activeGroup);
      }
      if (_p3d && !_p3d.dead && _p3d.inited) _p3d.setFilter(_activeGroup || '', _activeSubgroup || '');
      renderBodySVG(); renderGroupTree(); renderEquipChips(); renderClassChips(); renderExerciseGrid();
    }
    function applyPickerBmMode() {
      var mode = (function () { try { return localStorage.getItem('dk_bodymap_mode') || 'svg'; } catch (e) { return 'svg'; } })();
      var tabs = document.getElementById('bm-view-tabs');
      var svgBox = document.getElementById('bm-svg-container');
      var box3d = document.getElementById('bm-3d-container');
      var modal = document.getElementById('bodymap-picker-modal');
      var isOpen = modal && !modal.classList.contains('hidden');
      if (tabs) tabs.classList.toggle('hidden', mode === '3d');
      if (svgBox) svgBox.classList.toggle('hidden', mode === '3d');
      if (box3d) box3d.classList.toggle('hidden', mode === 'svg');
      if (mode !== 'svg' && box3d && isOpen) {
        if (_p3d && _p3d.dead) _p3d = null;
        if (!_p3d) _p3d = window.DKBody3D.mount(box3d, { onPick: bm3dPick });
        if (_p3d && !_p3d.dead && _p3d.inited) _p3d.setFilter(_activeGroup || '', _activeSubgroup || '');
      } else if (_p3d && mode === 'svg') { _p3d.dispose(); _p3d = null; }
    }
    document.addEventListener('dk-bodymap-mode', function () {
      var modal = document.getElementById('bodymap-picker-modal');
      if (modal && !modal.classList.contains('hidden')) applyPickerBmMode();
      else if (_p3d) { _p3d.dispose(); _p3d = null; }
    });`
);

/* ================= G) Settings segmented control ================= */
repOnce('G settings section',
`<div id="theme-grid" class="grid grid-cols-4 sm:grid-cols-5 gap-2 mt-3"></div>`,
`<div id="theme-grid" class="grid grid-cols-4 sm:grid-cols-5 gap-2 mt-3"></div>
                <!-- c74: Body map view (SVG / 3D / Both) -->
                <div class="mt-4 pt-4 border-t border-border">
                  <div class="mb-2">
                    <div class="text-sm font-medium" data-i18n="settings.bodymapView">Body map view</div>
                    <div class="text-xs text-muted" data-i18n="settings.bodymapHint">SVG map, 3D atlas or both stacked</div>
                  </div>
                  <div id="bodymap-mode-seg" class="flex flex-wrap gap-1 items-center">
                    <button data-bm-mode="svg" class="bm-seg-btn text-xs font-semibold min-w-[3.2rem] h-9 px-3 rounded-lg border border-border bg-surface-2 transition">SVG</button>
                    <button data-bm-mode="3d" class="bm-seg-btn text-xs font-semibold min-w-[3.2rem] h-9 px-3 rounded-lg border border-border bg-surface-2 transition">3D</button>
                    <button data-bm-mode="both" class="bm-seg-btn text-xs font-semibold min-w-[3.2rem] h-9 px-3 rounded-lg border border-border bg-surface-2 transition" data-i18n="settings.bmModeBoth">Both</button>
                  </div>
                </div>`
);

/* ================= versions ================= */
repOnce('dk-build meta',
  `<meta name="dk-build" content="c73" />`,
  `<meta name="dk-build" content="c74" />`
);
repOnce('RUNNING',
  `var RUNNING = 73; /* numeric part of dk-build c73 */`,
  `var RUNNING = 74; /* numeric part of dk-build c74 */`
);

fs.writeFileSync(FILE, s);
console.log('written, delta bytes:', s.length - orig.length);

/* ================= i18n JSON ================= */
const I18N = {
  en: { bodymapView: 'Body map view', bodymapHint: 'SVG map, 3D atlas or both stacked', bmModeBoth: 'Both' },
  ru: { bodymapView: 'Вид карты тела', bodymapHint: 'SVG-схема, 3D-атлас или обе друг над другом', bmModeBoth: 'Обе' },
  he: { bodymapView: 'תצוגת מפת גוף', bodymapHint: 'מפת SVG, אטלס תלת־מימד או שניהם אחד מעל השני', bmModeBoth: 'שניהם' }
};
['en', 'ru', 'he'].forEach(function (l) {
  const p = path.join(__dirname, '..', 'src', 'i18n', l + '.json');
  const j = JSON.parse(fs.readFileSync(p, 'utf8'));
  j.settings = j.settings || {};
  Object.assign(j.settings, I18N[l]);
  fs.writeFileSync(p, JSON.stringify(j, null, 2) + '\n');
  console.log('i18n ' + l + ' updated');
});

/* ================= sanity ================= */
const s2 = fs.readFileSync(FILE, 'utf8');
['DKBody3D', 'getModelTemplate', 'auth-locked', 'bodymap-mode-seg', 'bm-3d-container', 'exercise-bodymap-3d', 'atlas-lang'].forEach(k => {
  console.log(k, s2.includes(k) ? 'present ✓' : 'MISSING ✗');
});
