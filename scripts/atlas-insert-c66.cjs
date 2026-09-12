/* atlas-insert-c66.cjs — insert 3D Body Atlas into fitness-crm.html (c66)
 * Idempotency: refuses to run twice (marker check).
 * Every anchor must match exactly once, otherwise aborts without writing.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const FILE = path.join(ROOT, 'fitness-crm.html');
const APP_JS = path.join(__dirname, 'atlas-app-c66.js');

let s = fs.readFileSync(FILE, 'utf8');
const origLen = s.length;

function mustUnique(needle, label) {
  const n = s.split(needle).length - 1;
  if (n !== 1) throw new Error('anchor not unique (' + label + '): count=' + n);
}

if (s.includes('id="atlas-modal"')) { console.log('ALREADY PATCHED — abort'); process.exit(0); }

/* ---------- 1) CSS into <head> ---------- */
const CSS = `
<style id="atlas-style">
/* ===== DK 3D Body Atlas (c66) ===== */
html.atlas-lock { overflow: hidden; }
#atlas-canvas { display: block; width: 100%; height: 100%; touch-action: none; outline: none; }
#atlas-panel { display: none; }
@media (min-width: 640px) { #atlas-panel { display: flex; } }
#atlas-panel.atlas-panel-open {
  display: flex; position: absolute; top: 0; bottom: 0; inset-inline-start: 0;
  width: 17rem; max-width: 80%; z-index: 20;
  box-shadow: 0 8px 32px rgba(0,0,0,.45);
}
@media (min-width: 640px) { #atlas-panel-toggle { display: none; } }
.atlas-region-btn {
  display: flex; width: 100%; align-items: center; justify-content: space-between; gap: .5rem;
  padding: .45rem .6rem; border-radius: .6rem; font-size: 10.5px; font-weight: 700;
  letter-spacing: .04em; text-transform: uppercase; color: rgb(var(--c-muted));
  background: transparent; border: 0; cursor: pointer; text-align: start;
}
.atlas-region-btn:hover { background: rgb(var(--c-surface-2)); }
.atlas-region-c { transition: transform .15s ease; }
.atlas-region-body { display: none; padding: .05rem 0 .35rem; }
.atlas-region-body.open { display: block; }
.atlas-row {
  display: flex; width: 100%; align-items: center; gap: .5rem;
  padding: .42rem .6rem; border-radius: .6rem; font-size: 12.5px;
  color: rgb(var(--c-text)); background: transparent; border: 0; cursor: pointer; text-align: start;
}
.atlas-row:hover { background: rgb(var(--c-surface-2)); }
.atlas-row.sel { background: rgb(var(--c-primary) / .15); color: rgb(var(--c-primary-2)); }
.atlas-row-dot { width: 6px; height: 6px; border-radius: 9999px; background: rgb(var(--c-border)); flex: none; }
.atlas-row.sel .atlas-row-dot { background: #dc2626; }
.atlas-chip-g {
  display: inline-block; margin-top: .2rem; font-size: 10px; font-weight: 700;
  padding: .1rem .5rem; border-radius: 9999px;
  background: rgb(var(--c-primary) / .15); color: rgb(var(--c-primary-2));
}
.atlas-btn {
  display: inline-flex; align-items: center; gap: .35rem; pointer-events: auto;
  padding: .45rem .7rem; border-radius: .8rem;
  background: rgb(var(--c-surface) / .92); border: 1px solid rgb(var(--c-border));
  color: rgb(var(--c-text)); font-size: 12px; font-weight: 600; cursor: pointer;
  backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
}
.atlas-btn:hover { background: rgb(var(--c-surface-2)); }
.atlas-btn.on { background: rgb(var(--c-primary) / .2); color: rgb(var(--c-primary-2)); border-color: rgb(var(--c-primary) / .5); }
#atlas-list { scrollbar-width: thin; }
#atlas-list::-webkit-scrollbar { width: 6px; }
#atlas-list::-webkit-scrollbar-thumb { background: rgb(var(--c-border)); border-radius: 9999px; }
.atlas-spinner {
  width: 34px; height: 34px; border-radius: 9999px;
  border: 3px solid rgb(var(--c-border)); border-top-color: rgb(var(--c-primary-2));
  animation: atlas-spin 1s linear infinite;
}
@keyframes atlas-spin { to { transform: rotate(360deg); } }
</style>
</head>`;

// insert before the FIRST </head> (the real document head; other matches live inside JS print-templates)
const headIdx = s.indexOf('</head>');
if (headIdx < 0 || headIdx > 300000) throw new Error('real </head> not found at expected position: ' + headIdx);
s = s.slice(0, headIdx) + CSS.slice(0, CSS.length - '</head>'.length) + '</head>' + s.slice(headIdx + '</head>'.length);

/* ---------- 2) sidebar button (desktop) ---------- */
const NAV_ANCHOR = '\n        </nav>\n\n        <div class="p-3 border-t border-border">';
mustUnique(NAV_ANCHOR, 'sidebar </nav>');
const NAV_BTN = `
          <button id="nav-atlas" class="nav-pill w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-surface-2 transition" aria-label="3D Body Atlas">
            <span class="w-8 h-8 grid place-items-center rounded-lg bg-danger/15 text-danger">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="4.5" r="2"/><path d="M12 7v6M12 13l-4 7M12 13l4 7M8 9.5h8"/></svg>
            </span>
            <span data-i18n="nav.atlas">3D Body Atlas</span>
          </button>`;
s = s.replace(NAV_ANCHOR, NAV_BTN + NAV_ANCHOR);

/* ---------- 3) dashboard card (mobile-first entry) ---------- */
const DASH_ANCHOR = '\n\n            <!-- Search + sort -->';
mustUnique(DASH_ANCHOR, 'dashboard search row');
const DASH_CARD = `
            <!-- 3D Body Atlas entry (c66) -->
            <button id="dash-atlas-card" class="w-full flex items-center gap-3 p-3 mb-3 rounded-xl bg-danger/10 border border-danger/25 text-start hover:bg-danger/15 transition shadow-card">
              <span class="w-10 h-10 grid place-items-center rounded-lg bg-danger/15 text-danger shrink-0">
                <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="4.5" r="2"/><path d="M12 7v6M12 13l-4 7M12 13l4 7M8 9.5h8"/></svg>
              </span>
              <span class="flex-1 min-w-0">
                <span class="block font-semibold text-sm" data-i18n="atlas.name">3D Body Atlas</span>
                <span class="block text-xs text-muted" data-i18n="atlas.desc">Interactive 3D muscle map</span>
              </span>
              <svg class="w-4 h-4 text-muted shrink-0 rtl:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
            </button>`;
s = s.replace(DASH_ANCHOR, DASH_CARD + DASH_ANCHOR);

/* ---------- 4) modal + app JS before last </body> ---------- */
const APP = fs.readFileSync(APP_JS, 'utf8');
if (APP.includes('</script')) throw new Error('app js contains </script — would break HTML');

const MODAL = `
<!-- ============= 3D BODY ATLAS (c66) ============= -->
<div id="atlas-modal" class="hidden fixed inset-0 z-[130] bg-surface" role="dialog" aria-modal="true" aria-label="3D Body Atlas">
  <div class="flex flex-col h-full">
    <div class="flex items-center gap-2 p-3 border-b border-border bg-surface shrink-0">
      <span class="w-8 h-8 grid place-items-center rounded-lg bg-danger/15 text-danger shrink-0">
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="4.5" r="2"/><path d="M12 7v6M12 13l-4 7M12 13l4 7M8 9.5h8"/></svg>
      </span>
      <h3 id="atlas-title" class="font-display font-bold text-base flex-1 min-w-0 truncate">3D Body Atlas</h3>
      <button id="atlas-close" class="w-9 h-9 grid place-items-center rounded-lg hover:bg-surface-2 text-muted transition" aria-label="Close">
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
      </button>
    </div>
    <div class="relative flex-1 flex min-h-0">
      <div id="atlas-panel" class="flex-col overflow-hidden border-e border-border bg-surface-2/40">
        <div class="p-2 border-b border-border shrink-0">
          <input type="search" id="atlas-search" class="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" placeholder="Search muscle…" aria-label="Search muscle">
        </div>
        <div id="atlas-list" class="flex-1 overflow-y-auto p-1.5"></div>
      </div>
      <div id="atlas-canvas-box" class="relative flex-1 min-w-0 overflow-hidden">
        <canvas id="atlas-canvas"></canvas>
        <div id="atlas-info" class="hidden absolute top-3 inset-x-3 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 glass border border-border rounded-xl px-3 py-2 shadow-card max-w-[92%] text-center z-10"></div>
        <div id="atlas-hint" class="absolute bottom-16 inset-x-0 text-center text-xs text-muted pointer-events-none px-4">Tap a muscle to highlight it</div>
        <div class="absolute bottom-3 inset-x-0 flex flex-wrap items-center justify-center gap-1.5 pointer-events-none px-2">
          <button id="atlas-reset" class="atlas-btn" aria-label="Reset view">
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg>
            <span class="atlas-btn-txt">Reset</span>
          </button>
          <button id="atlas-rot" class="atlas-btn" aria-label="Auto-rotate">
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-2.6-6.4"/><path d="M21 3v5h-5"/></svg>
          </button>
          <button id="atlas-front" class="atlas-btn"><span class="atlas-btn-txt">Front</span></button>
          <button id="atlas-back" class="atlas-btn"><span class="atlas-btn-txt">Back</span></button>
          <button id="atlas-panel-toggle" class="atlas-btn" aria-label="Muscle list">
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h10"/></svg>
            <span class="atlas-btn-txt">Muscles</span>
          </button>
        </div>
      </div>
    </div>
    <div id="atlas-credit" class="px-3 py-1.5 border-t border-border text-[10px] text-muted text-center shrink-0">Model: Z-Anatomy (CC BY-SA 4.0) · BodyParts3D (CC BY-SA 2.1 JP)</div>
    <div id="atlas-load" class="hidden absolute inset-0 z-30 grid place-items-center bg-surface/90">
      <div class="flex flex-col items-center gap-3 text-center px-6">
        <div class="atlas-spinner"></div>
        <div class="atlas-load-spin text-sm font-semibold" id="atlas-load-txt">Loading model…</div>
        <div id="atlas-load-sub" class="text-xs text-muted">First open downloads ~3 MB</div>
        <div class="atlas-load-err hidden flex flex-col items-center gap-2">
          <div class="atlas-err-txt text-sm text-danger">Failed to load the atlas.</div>
          <button type="button" class="atlas-btn atlas-retry"><span class="atlas-btn-txt">Retry</span></button>
        </div>
      </div>
    </div>
  </div>
</div>
<script>
${APP}
</script>
</body>`;

const lastBody = s.lastIndexOf('</body>');
if (lastBody < 0) throw new Error('no </body> found');
s = s.slice(0, lastBody) + MODAL.slice(0, MODAL.length - '</body>'.length) + '</body>' + s.slice(lastBody + '</body>'.length);

fs.writeFileSync(FILE, s);
console.log('PATCHED OK | size', origLen, '->', s.length, '(+' + (s.length - origLen) + ')');
