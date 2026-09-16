#!/usr/bin/env node
/* c95 — 10 SAVE SLOTS («ячейки сохранения») + lost-profile orphan scanner.
 *
 * User request (after the SECOND profile clobber, «אסי בורג» 2026-09-16):
 * «сделай в нашей программе 10 строк сохранения… Буквально как 10 ячеек
 * сохранения, которые я могу отдельно перезапускать, чтобы каждая была
 * пронумерована и на каждом сохранении была дата сохранения… Одна из этих
 * ячеек пускай будет только для автоматического сохранения. Все остальные
 * для ручного».
 *
 * What this ships:
 *  1. IndexedDB v10: new store `snapshots` (keyPath 'slot').
 *  2. dkSlots module inside the cloud IIFE (needs _fs/_user/db/applyPayload):
 *     - slot 1 = AUTO-only: 25 s after boot, every 15 min while open, on
 *       every cloud saveNow success, and FORCE before every slot restore;
 *     - slots 2–10 = manual save/load/clear with dates;
 *     - local store + Firestore mirror users/{uid}/snapshots/slot_{n}
 *       (+ parts subcollection, content-addressed chunks like the cloud dump)
 *       → a slot saved on the desktop loads on the phone;
 *     - restore replaces ONLY user stores (clients, client_programs,
 *       workout_history, nutrition_plans, nutrition_history,
 *       workout_templates, nutrition_templates) — settings and reference
 *       stores are never touched (LASTSYNC/ai_config survive);
 *     - empty-device guard: an empty DB can never overwrite a filled slot;
 *     - orphan scanner: user records whose client_id is gone from `clients`
 *       (the «אסי בורג» signature) are listed in the modal with one-click
 *       client revival under the ORIGINAL id (programs/history/portal
 *       share links stay connected).
 *  3. Settings → Backup & restore: prominent «Ячейки сохранения (10)» button
 *     + full-screen modal (10 rows, dates, counts, cloud badges, orphans).
 *  4. i18n RU/EN/HE (settings.snapshots.*).
 *  5. Versions: meta c95, RUNNING=95, login tag c95, sw dk-gym-v122.
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

let fails = 0;
function rep(file, from, to, label) {
  const p = path.join(ROOT, file);
  let s = fs.readFileSync(p, 'utf8');
  const n = s.split(from).length - 1;
  if (n !== 1) {
    console.error(`FAIL [${label || file}]: expected 1 occurrence, found ${n}`);
    fails++;
    return;
  }
  s = s.replace(from, to);
  fs.writeFileSync(p, s);
  console.log(`ok  ${label || file}`);
}

/* ------------------------------------------------------------------ *
 * 1) DB v10 + snapshots store
 * ------------------------------------------------------------------ */
rep('fitness-crm.html',
  `const DB_NAME    = 'fitness_crm_db';\n  const DB_VERSION = 9;`,
  `const DB_NAME    = 'fitness_crm_db';\n  const DB_VERSION = 10; /* c95: + snapshots store (save slots) */`,
  'db version 10');

rep('fitness-crm.html',
  `    {
      name: 'nutrition_templates',
      keyPath: 'id',
      indexes: [
        { name: 'name', keyPath: 'name', unique: false }
      ]
    }
  ];`,
  `    {
      name: 'nutrition_templates',
      keyPath: 'id',
      indexes: [
        { name: 'name', keyPath: 'name', unique: false }
      ]
    },
    {
      /* c95 SAVE SLOTS: one record per slot (slot: 1..10) holding a full
       * user-data snapshot: { slot, ts, auto, counts, total_bytes, data } */
      name: 'snapshots',
      keyPath: 'slot'
    }
  ];`,
  'snapshots store');

/* ------------------------------------------------------------------ *
 * 2) Settings → Backup panel: open-slot modal button (top of the panel)
 * ------------------------------------------------------------------ */
rep('fitness-crm.html',
  `              <p class="text-xs text-muted mb-3 leading-relaxed" data-i18n="settings.backupDesc">Export the entire database (clients, photos, documents, exercises, settings) into a single JSON file. Restore on any device.</p>
              <div class="flex flex-wrap gap-2">`,
  `              <p class="text-xs text-muted mb-3 leading-relaxed" data-i18n="settings.backupDesc">Export the entire database (clients, photos, documents, exercises, settings) into a single JSON file. Restore on any device.</p>
              <button id="settings-btn-slots" class="w-full mb-3 flex items-center gap-3 bg-accent/15 hover:bg-accent/25 text-accent border border-accent/30 rounded-xl px-3.5 py-3 text-start transition" aria-label="Save slots">
                <svg class="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8M7 3v5h8"/></svg>
                <span class="min-w-0">
                  <span class="block text-sm font-semibold" data-i18n="settings.snapshots.open">Save slots (10)</span>
                  <span class="block text-[11px] opacity-80 leading-snug" data-i18n="settings.snapshots.openDesc">Like game saves: 10 slots with a date. #1 auto · #2–10 manual.</span>
                </span>
              </button>
              <div class="flex flex-wrap gap-2">`,
  'settings slots button');

/* ------------------------------------------------------------------ *
 * 3) Move snapshots-modal to <body> with the other full-screen modals
 * ------------------------------------------------------------------ */
rep('fitness-crm.html',
  `  ['bodymap-picker-modal', 'exercise-modal', 'viewer-modal'].forEach((mid) => {`,
  `  ['bodymap-picker-modal', 'exercise-modal', 'viewer-modal', 'snapshots-modal'].forEach((mid) => {`,
  'modal move list');

/* ------------------------------------------------------------------ *
 * 4) dkSlots module (inside the cloud IIFE, before window.cloudSync)
 * ------------------------------------------------------------------ */
const SLOTS_MODULE = `
    /* ===================================================================
       c95 SAVE SLOTS (dkSlots) — 10 numbered «game save» slots over ALL
       user data. Slot 1 = AUTO-only (boot + 25 s, every 15 min, on every
       cloud saveNow success, and FORCED before every slot restore);
       slots 2–10 = manual. Local in IndexedDB 'snapshots' (DB v10) and
       mirrored to Firestore users/{uid}/snapshots/slot_{n} (+ parts
       subcollection, content-addressed chunks like the cloud dump), so a
       slot saved on the desktop can be loaded on the phone.
       Restore replaces ONLY user stores; settings + reference stores are
       untouched, and the CURRENT state is force-saved into the AUTO slot
       first — restoring can never lose the present data. Built after the
       second profile clobber («אסי בורג», 2026-09-16): even if everything
       is lost again, the trainer reloads any slot like a game save. */
    var SNAP_SLOTS = 10;
    var SNAP_AUTO_MIN_MS = 30 * 60 * 1000; /* AUTO slot throttle */
    var SNAP_UPLOAD_MAX_OPS = 400, SNAP_UPLOAD_MAX_CHARS = 600000;
    var _snapBusy = false;

    function snapUserStores() { return USER_STORES.slice(); }
    function snapHasData(data) {
      if (!data) return false;
      var k = Object.keys(data), t = 0;
      for (var i = 0; i < k.length; i++) t += (data[k[i]] || []).length;
      return t > 0;
    }
    function snapFmtDate(ts) {
      try { return new Date(ts).toLocaleString(); } catch (e) { return String(ts); }
    }
    function snapEsc(s) {
      return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
    async function snapCapture() {
      var names = snapUserStores(), data = {}, counts = {}, total = 0;
      for (var i = 0; i < names.length; i++) {
        var recs = [];
        try { recs = await db.all(names[i]); } catch (e) { recs = []; }
        data[names[i]] = recs;
        counts[names[i]] = recs.length;
        try { total += JSON.stringify(recs).length; } catch (e2) {}
      }
      return { slot: 0, ts: Date.now(), auto: false, counts: counts, total_bytes: total, data: data };
    }
    async function snapSaveSlot(n, opts) {
      opts = opts || {};
      if (_snapBusy) return { ok: false, error: 'busy' };
      if (_busy && !opts.auto) return { ok: false, error: 'cloud_busy' };
      _snapBusy = true;
      try {
        var rec = await snapCapture();
        rec.slot = n; rec.auto = !!opts.auto;
        var empty = !snapHasData(rec.data);
        var prev = null;
        try { prev = await db.get('snapshots', n); } catch (e0) {}
        /* empty-device guard: never let an empty DB overwrite a filled slot */
        if (empty && prev && snapHasData(prev.data) && !opts.force) {
          log('snap empty-guard: slot', n, 'kept (local db is empty)');
          return { ok: false, error: 'empty_local' };
        }
        await db.put('snapshots', rec);
        var cloud = false;
        if (_user && _fs) {
          try { await snapCloudUpload(n, rec); cloud = true; }
          catch (eC) { log('snap cloud upload failed (slot kept locally):', eC); }
        }
        return { ok: true, ts: rec.ts, cloud: cloud, empty: empty };
      } finally { _snapBusy = false; }
    }
    async function snapAutoSave(force) {
      try {
        var prev = await db.get('snapshots', 1);
        if (!force && prev && prev.ts && (Date.now() - prev.ts) < SNAP_AUTO_MIN_MS) return { ok: false, error: 'fresh' };
        var r = await snapSaveSlot(1, { auto: true, force: !!force });
        if (r.ok) log('AUTO slot refreshed:', new Date(r.ts).toLocaleString(), r.cloud ? '(local+cloud)' : '(local)');
        return r;
      } catch (e) { log('snap autoSave failed', e); return { ok: false, error: String(e) }; }
    }
    async function snapCloudUpload(n, rec) {
      var sRef = _fs.collection('users').doc(_user.uid).collection('snapshots').doc('slot_' + n);
      var pCol = sRef.collection('parts');
      var parts = {}, hashes = {}, total = 0;
      var names = snapUserStores();
      /* old parts out first — keeps dead chunks from piling up */
      try {
        var old = await pCol.get();
        if (!old.empty) {
          var delB = _fs.batch(), delOps = 0;
          old.forEach(function (d) { delB.delete(d.ref); delOps++; });
          if (delOps) await delB.commit();
        }
      } catch (eDel) { log('snap old-parts cleanup (non-fatal)', eDel); }
      var batch = _fs.batch(), ops = 0, chars = 0, batches = [batch];
      for (var i = 0; i < names.length; i++) {
        var name = names[i];
        var s = JSON.stringify(rec.data[name] || []);
        total += s.length;
        var h = await sha256Hex(s);
        hashes[name] = h;
        var nn = Math.max(1, Math.ceil(s.length / CHUNK_CHARS));
        parts[name] = { h: h, n: nn };
        for (var p = 0; p < nn; p++) {
          var chunk = s.slice(p * CHUNK_CHARS, (p + 1) * CHUNK_CHARS);
          batch.set(pCol.doc(name + '__' + h.slice(0, 24) + '_' + p), { h: h, i: p, d: chunk });
          ops++; chars += chunk.length;
          if (ops >= SNAP_UPLOAD_MAX_OPS || chars >= SNAP_UPLOAD_MAX_CHARS) {
            batch = _fs.batch(); batches.push(batch); ops = 0; chars = 0;
          }
        }
      }
      for (var bi = 0; bi < batches.length; bi++) await batches[bi].commit();
      await sRef.set({
        slot: n, app: 'dk-gym-pro', fmt: 1, ts: rec.ts, auto: !!rec.auto,
        counts: rec.counts || {}, total_bytes: total,
        store_hashes: hashes, store_parts: parts,
        email: _user.email || ''
      });
      return true;
    }
    async function snapCloudFetch(n) {
      if (!_user || !_fs) return null;
      var sRef = _fs.collection('users').doc(_user.uid).collection('snapshots').doc('slot_' + n);
      var snap = await sRef.get();
      if (!snap.exists) return null;
      var meta = snap.data() || {};
      var pCol = sRef.collection('parts');
      var data = {};
      var names = Object.keys(meta.store_parts || {});
      for (var i = 0; i < names.length; i++) {
        var name = names[i];
        var pi = meta.store_parts[name] || {};
        var q = await pCol.where('h', '==', pi.h).get();
        var chunks = [];
        q.forEach(function (d) { chunks.push(d.data()); });
        chunks.sort(function (a, b) { return (a.i || 0) - (b.i || 0); });
        var text = '';
        for (var c = 0; c < chunks.length; c++) text += chunks[c].d || '';
        try { data[name] = text ? JSON.parse(text) : []; }
        catch (e) { throw new Error('slot_part_corrupt:' + name); }
      }
      return { meta: meta, data: data };
    }
    async function snapCloudDelete(n) {
      if (!_user || !_fs) return false;
      var sRef = _fs.collection('users').doc(_user.uid).collection('snapshots').doc('slot_' + n);
      try {
        var parts = await sRef.collection('parts').get();
        if (!parts.empty) {
          var b = _fs.batch(), ops = 0;
          parts.forEach(function (d) { b.delete(d.ref); ops++; });
          if (ops) await b.commit();
        }
        await sRef.delete();
      } catch (e) { log('snap cloud delete (non-fatal)', e); }
      return true;
    }
    async function snapLoadSlot(n) {
      var rec = null;
      try { rec = await db.get('snapshots', n); } catch (e0) {}
      var haveLocal = !!(rec && snapHasData(rec.data));
      var when = (rec && rec.ts) || 0;
      if (!haveLocal && _user && _fs) {
        try {
          var cloud = await snapCloudFetch(n);
          if (cloud && snapHasData(cloud.data)) {
            rec = { slot: n, ts: cloud.meta.ts || Date.now(), auto: !!cloud.meta.auto, counts: cloud.meta.counts || {}, data: cloud.data };
            haveLocal = true; when = rec.ts;
          }
        } catch (eC) { log('snap cloud fetch failed', eC); }
      }
      if (!haveLocal) return { ok: false, error: 'empty' };
      var msg = (T('settings.snapshots.loadConfirm') || 'Load data from slot {n}? Current data will be REPLACED.')
        .replace('{n}', String(n)).replace('{d}', snapFmtDate(when));
      if (!confirm(msg)) return { ok: false, error: 'cancelled' };
      await snapAutoSave(true); /* safety: current state -> AUTO slot first */
      var prevBusy = _busy; _busy = true;
      var imported = 0;
      try { imported = await applyPayload({ data: rec.data }); }
      finally { _busy = prevBusy; }
      toastMsg((T('settings.snapshots.loadDone') || 'Data restored from slot {n}').replace('{n}', String(n)), 'success', 3500);
      setTimeout(function () { location.reload(); }, 900);
      return { ok: true, imported: imported };
    }
    async function snapClearSlot(n) {
      var msg = (T('settings.snapshots.clearConfirm') || 'Clear slot {n}?').replace('{n}', String(n));
      if (!confirm(msg)) return { ok: false, error: 'cancelled' };
      await db.del('snapshots', n);
      await snapCloudDelete(n);
      toastMsg((T('settings.snapshots.cleared') || 'Slot {n} cleared').replace('{n}', String(n)), 'info', 2500);
      return { ok: true };
    }
    /* Orphan scan: user records whose client_id is gone from the clients store —
     * the exact signature of the «אסי בורג» clobber (the client record is
     * replaced by a stale dump, but its programs/history/plans survive in
     * IndexedDB). One click revives the client under the ORIGINAL id, so
     * programs, history and the portal share link all stay connected. */
    async function snapScanOrphans() {
      var clients = [], progs = [], hist = [], plans = [], nhist = [];
      try { clients = await db.all('clients'); } catch (e) {}
      try { progs = await db.all('client_programs'); } catch (e1) {}
      try { hist = await db.all('workout_history'); } catch (e2) {}
      try { plans = await db.all('nutrition_plans'); } catch (e3) {}
      try { nhist = await db.all('nutrition_history'); } catch (e4) {}
      var alive = {};
      clients.forEach(function (c) { if (c && c.id) alive[c.id] = true; });
      var out = {};
      function note(key, rec) {
        var cid = rec && rec.client_id;
        if (!cid || alive[cid]) return;
        var o = out[cid] = out[cid] || { id: cid, programs: 0, history: 0, plans: 0, nhistory: 0, name: '', ts: 0 };
        o[key]++;
        if (!o.name && (rec.client_name || rec.clientName)) o.name = rec.client_name || rec.clientName;
        var t = rec.updated_at || rec.created_at || rec.ts || rec.date || 0;
        if (typeof t === 'number' && t > o.ts) o.ts = t;
      }
      progs.forEach(function (r) { note('programs', r); });
      hist.forEach(function (r) { note('history', r); });
      plans.forEach(function (r) { note('plans', r); });
      nhist.forEach(function (r) { note('nhistory', r); });
      return Object.keys(out).map(function (k) { return out[k]; });
    }
    async function snapRestoreOrphan(id, name) {
      if (!id) return { ok: false };
      var exists = null;
      try { exists = await db.get('clients', id); } catch (e) {}
      if (exists) return { ok: true, existing: true };
      await db.put('clients', {
        id: id,
        full_name: name || (T('settings.snapshots.orphanDefaultName') || 'Restored client'),
        last_active: Date.now()
      });
      return { ok: true, created: true };
    }

    /* ---------- slots modal UI ---------- */
    async function dkSnapRender() {
      var rowsEl = document.getElementById('snapshots-rows');
      if (!rowsEl) return;
      var local = {};
      var recs = [];
      try { recs = await db.all('snapshots'); } catch (e) {}
      recs.forEach(function (r) { if (r && r.slot) local[r.slot] = r; });
      var html = '';
      for (var n = 1; n <= SNAP_SLOTS; n++) {
        var loc = local[n] || null;
        var isAuto = n === 1;
        var when = (loc && loc.ts) ? snapEsc(snapFmtDate(loc.ts)) : snapEsc(T('settings.snapshots.empty') || 'empty');
        var c = (loc && loc.counts) || {};
        var counts = (T('settings.snapshots.counts') || 'Clients {c} · Programs {p} · History {h}')
          .replace('{c}', String(c.clients || 0))
          .replace('{p}', String(c.client_programs || 0))
          .replace('{pl}', String(c.nutrition_plans || 0))
          .replace('{h}', String(c.workout_history || 0));
        var badge = isAuto
          ? '<div class="w-10 h-10 shrink-0 rounded-lg grid place-items-center text-[10px] font-bold bg-accent/20 text-accent border border-accent/40">' + snapEsc(T('settings.snapshots.auto') || 'AUTO') + '</div>'
          : '<div class="w-10 h-10 shrink-0 rounded-lg grid place-items-center text-sm font-bold bg-surface border border-border text-muted">' + n + '</div>';
        html += '<div class="flex items-center gap-2.5 bg-surface-2 border border-border rounded-xl p-2.5" data-slot-row="' + n + '">' +
          badge +
          '<div class="flex-1 min-w-0">' +
            '<div class="text-[13px] font-semibold truncate">' + when + '<span data-cloud class="hidden ml-1.5 text-[10px] text-success font-normal"></span></div>' +
            '<div class="text-[11px] text-muted truncate">' + snapEsc(counts) + '</div>' +
          '</div>' +
          '<div class="flex gap-1.5 shrink-0">' +
            (isAuto ? '' : '<button data-act="save" data-slot="' + n + '" class="bg-primary/15 hover:bg-primary/25 text-primary-2 border border-primary/30 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg transition">' + snapEsc(T('settings.snapshots.save') || 'Save') + '</button>') +
            '<button data-act="load" data-slot="' + n + '" class="bg-success/15 hover:bg-success/25 text-success border border-success/30 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg transition">' + snapEsc(T('settings.snapshots.load') || 'Load') + '</button>' +
            (isAuto ? '' : '<button data-act="clear" data-slot="' + n + '" title="✕" aria-label="✕" class="bg-danger/10 hover:bg-danger/20 text-danger border border-danger/30 text-[11px] font-semibold px-2 py-1.5 rounded-lg transition">✕</button>') +
          '</div>' +
        '</div>';
      }
      rowsEl.innerHTML = html;
    }
    function dkSnapWire() {
      var rowsEl = document.getElementById('snapshots-rows');
      if (rowsEl && !rowsEl.dataset.dkSnapWired) {
        rowsEl.dataset.dkSnapWired = '1';
        rowsEl.addEventListener('click', async function (e) {
          var b = e.target && e.target.closest ? e.target.closest('button[data-act]') : null;
          if (!b) return;
          var n = parseInt(b.getAttribute('data-slot'), 10);
          var act = b.getAttribute('data-act');
          if (act === 'save') {
            var prev = null;
            try { prev = await db.get('snapshots', n); } catch (eP) {}
            if (prev && prev.ts) {
              var om = (T('settings.snapshots.overwriteConfirm') || 'Slot {n} already holds a save from {d}. Overwrite?')
                .replace('{n}', String(n)).replace('{d}', snapFmtDate(prev.ts));
              if (!confirm(om)) return;
            }
            b.disabled = true;
            var r = await snapSaveSlot(n, {});
            b.disabled = false;
            if (r.ok) {
              var tail = r.cloud ? (T('settings.snapshots.savedCloud') || '') : (T('settings.snapshots.savedLocal') || '');
              toastMsg((T('settings.snapshots.savedOk') || 'Slot {n} saved').replace('{n}', String(n)) + tail, 'success', r.cloud ? 3500 : 7000);
            } else if (r.error !== 'empty_local') {
              toastMsg((T('settings.snapshots.saveFail') || 'Save failed') + (r.error ? ': ' + r.error : ''), 'danger', 5000);
            }
            await dkSnapRender();
            dkSnapCloudBadges();
          } else if (act === 'load') {
            b.disabled = true;
            var lr = await snapLoadSlot(n);
            b.disabled = false;
            if (!lr.ok && lr.error !== 'cancelled') {
              toastMsg(T('settings.snapshots.emptyRefuse') || 'Slot is empty', 'warning', 3000);
            }
          } else if (act === 'clear') {
            var cr = await snapClearSlot(n);
            if (cr.ok) { await dkSnapRender(); dkSnapCloudBadges(); }
          }
        });
      }
      var box = document.getElementById('snapshots-orphan');
      if (box && !box.dataset.dkSnapWired) {
        box.dataset.dkSnapWired = '1';
        box.addEventListener('click', async function (e) {
          var b = e.target && e.target.closest ? e.target.closest('button[data-orphan]') : null;
          if (!b) return;
          b.disabled = true;
          var r = await snapRestoreOrphan(b.getAttribute('data-orphan'), b.getAttribute('data-orphan-name'));
          if (r.ok) {
            toastMsg(T('settings.snapshots.orphanRestored') || 'Client restored', 'success', 5000);
            setTimeout(function () { location.reload(); }, 1100);
          } else { b.disabled = false; }
        });
      }
    }
    async function dkSnapCloudBadges() {
      if (!_user || !_fs) return;
      try {
        var q = await _fs.collection('users').doc(_user.uid).collection('snapshots').get();
        q.forEach(function (d) {
          var meta = d.data() || {};
          var n = Number(meta.slot);
          if (!n) return;
          var row = document.querySelector('[data-slot-row="' + n + '"] [data-cloud]');
          if (!row) return;
          row.textContent = '☁ ' + snapFmtDate(meta.ts);
          row.classList.remove('hidden');
        });
      } catch (e) { log('snap cloud badges (non-fatal)', e); }
    }
    async function dkSnapOrphansRender() {
      var box = document.getElementById('snapshots-orphan');
      if (!box) return;
      var list = [];
      try { list = await snapScanOrphans(); } catch (e) { list = []; }
      if (!list.length) { box.classList.add('hidden'); box.innerHTML = ''; return; }
      var html = '<div class="text-[11px] font-bold text-warning mb-1.5">' + snapEsc(T('settings.snapshots.orphanTitle') || 'Found data of lost clients') + '</div>';
      list.forEach(function (o) {
        var nm = o.name || (T('settings.snapshots.orphanDefaultName') || 'Restored client');
        var line = (T('settings.snapshots.orphanItem') || '{name}: programs {p} · workouts {h} · plans {pl}')
          .replace('{name}', nm).replace('{p}', String(o.programs)).replace('{h}', String(o.history)).replace('{pl}', String(o.plans));
        html += '<div class="flex items-center gap-2 bg-warning/10 border border-warning/30 rounded-lg p-2 mb-1.5">' +
          '<div class="flex-1 min-w-0 text-[11px] leading-snug">' + snapEsc(line) + '</div>' +
          '<button data-orphan="' + snapEsc(o.id) + '" data-orphan-name="' + snapEsc(o.name || '') + '" class="shrink-0 bg-warning/20 hover:bg-warning/30 text-warning border border-warning/40 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg transition">' + snapEsc(T('settings.snapshots.orphanRestore') || 'Restore client') + '</button></div>';
      });
      box.classList.remove('hidden');
      box.innerHTML = html;
    }
    async function dkSnapOpen() {
      var m = document.getElementById('snapshots-modal');
      if (!m) return;
      m.classList.remove('hidden');
      dkSnapWire();
      await dkSnapRender();
      var noteEl = document.getElementById('snapshots-cloud-note');
      if (noteEl) {
        noteEl.textContent = (_user && _user.email)
          ? (T('settings.snapshots.cloudNoteIn') || '').replace('{email}', _user.email)
          : (T('settings.snapshots.cloudNoteOut') || '');
      }
      dkSnapCloudBadges();
      dkSnapOrphansRender();
    }
    window.dkSlots = {
      open: dkSnapOpen,
      save: snapSaveSlot, load: snapLoadSlot, clear: snapClearSlot,
      autoSave: snapAutoSave, orphans: snapScanOrphans, restoreOrphan: snapRestoreOrphan,
      version: 1
    };
    /* AUTO slot cadence: 25 s after boot, then every 15 min while open */
    setTimeout(function () { snapAutoSave(false); }, 25000);
    setInterval(function () { snapAutoSave(false); }, 15 * 60 * 1000);
`;

rep('fitness-crm.html',
  `    window.cloudSync = { save: saveNow, restore: restoreFromCloud, signIn: signIn, signInGsi: signInGsi, ready: _ready, getState: getState, version: 1 };`,
  SLOTS_MODULE + `\n    window.cloudSync = { save: saveNow, restore: restoreFromCloud, signIn: signIn, signInGsi: signInGsi, ready: _ready, getState: getState, version: 1 };`,
  'dkSlots module');

/* ------------------------------------------------------------------ *
 * 5) AUTO slot also refreshes after every successful cloud saveNow
 * ------------------------------------------------------------------ */
rep('fitness-crm.html',
  `        _lastMeta = meta; _lastSync = gen; _dirty = {};`,
  `        _lastMeta = meta; _lastSync = gen; _dirty = {};
        /* c95: refresh the AUTO save slot after every completed cloud save */
        try { if (typeof snapAutoSave === 'function') snapAutoSave(false); } catch (eSnap95) {}`,
  'saveNow -> auto slot hook');

/* ------------------------------------------------------------------ *
 * 6) Modal HTML + wire script (before the AI Brain modal)
 * ------------------------------------------------------------------ */
const MODAL_HTML = `
  <!-- c95 Save slots modal (global) -->
  <div id="snapshots-modal" class="hidden fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true" aria-label="Save slots">
    <div class="bg-surface w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl border border-border shadow-float">
      <div class="sticky top-0 bg-surface border-b border-border p-4 flex items-center gap-3 z-10">
        <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 grid place-items-center text-white">💾</div>
        <div class="flex-1 min-w-0">
          <h3 class="font-display font-bold text-sm" data-i18n="settings.snapshots.title">Save slots</h3>
          <p class="text-xs text-muted" data-i18n="settings.snapshots.subtitle">#1 — AUTO · #2–10 — manual</p>
        </div>
        <button id="snapshots-close" class="w-8 h-8 grid place-items-center rounded-lg hover:bg-surface-2 text-muted" aria-label="Close"><svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
      </div>
      <div class="p-4 space-y-3">
        <div class="text-[11px] text-warning bg-warning/10 border border-warning/30 rounded-lg p-2.5 leading-relaxed" data-i18n="settings.snapshots.hint">Loading a slot REPLACES current data. The current state is auto-saved into slot #1 first.</div>
        <div id="snapshots-orphan" class="hidden bg-surface-2 border border-border rounded-xl p-2.5"></div>
        <div id="snapshots-rows" class="space-y-2"></div>
        <p id="snapshots-cloud-note" class="text-[11px] text-muted leading-relaxed"></p>
      </div>
    </div>
  </div>
  <script>
  (function () {
    function wire95() {
      var btn = document.getElementById('settings-btn-slots');
      if (btn && !btn.dataset.dkSnapWired) {
        btn.dataset.dkSnapWired = '1';
        btn.addEventListener('click', function () { if (window.dkSlots) window.dkSlots.open(); });
      }
      var m = document.getElementById('snapshots-modal');
      if (m && !m.dataset.dkSnapWired) {
        m.dataset.dkSnapWired = '1';
        m.addEventListener('click', function (e) { if (e.target === m) m.classList.add('hidden'); });
        var c = document.getElementById('snapshots-close');
        if (c) c.addEventListener('click', function () { m.classList.add('hidden'); });
      }
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire95);
    else wire95();
  })();
  </script>
`;

rep('fitness-crm.html',
  `  <!-- AI Brain Settings Modal (global) -->`,
  MODAL_HTML + `\n  <!-- AI Brain Settings Modal (global) -->`,
  'modal html');

/* ------------------------------------------------------------------ *
 * 7) Version markers
 * ------------------------------------------------------------------ */
rep('fitness-crm.html',
  `<meta name="dk-build" content="c94" />`,
  `<meta name="dk-build" content="c95" />`,
  'meta c95');
rep('fitness-crm.html',
  `  var RUNNING = 94; /* numeric part of dk-build c94 */`,
  `  var RUNNING = 95; /* numeric part of dk-build c95 */`,
  'RUNNING 95');
rep('fitness-crm.html',
  `v<span id="login-version">—</span> · IndexedDB · 3 languages · c94`,
  `v<span id="login-version">—</span> · IndexedDB · 3 languages · c95`,
  'login tag');

/* ------------------------------------------------------------------ *
 * 8) sw.js cache bump
 * ------------------------------------------------------------------ */
rep('sw.js',
  `const CACHE_NAME = 'dk-gym-v121'; // c94`,
  `const CACHE_NAME = 'dk-gym-v122'; // c95`,
  'sw cache name');
rep('sw.js',
  `// v121: c94 — cloud-sync clobber fence`,
  `// v122: c95 — 10 save slots («ячейки сохранения»): slot 1 AUTO (boot/15 min/before every restore + after cloud save), slots 2–10 manual save/load/clear with dates, local IndexedDB v10 'snapshots' store + Firestore mirror (users/{uid}/snapshots/slot_N + parts) so slots load cross-device, restore replaces ONLY user stores and force-saves the current state into the AUTO slot first, empty-device guard, plus a lost-profile orphan scanner (revives clients whose programs/history survived in IndexedDB — the «אסי בורג» case) under the ORIGINAL id
// v121: c94 — cloud-sync clobber fence`,
  'sw history line');

/* ------------------------------------------------------------------ *
 * 9) i18n dicts (settings.snapshots.*) — RU / EN / HE
 * ------------------------------------------------------------------ */
const SNAP_I18N = {
  ru: {
    open: 'Ячейки сохранения (10)',
    openDesc: 'Как сохранения в играх: 10 слотов с датой. №1 — автосохранение, №2–10 — вручную.',
    title: 'Ячейки сохранения',
    subtitle: '№1 — АВТО · №2–10 — ручные',
    hint: 'Загрузка ячейки ЗАМЕНЯЕТ текущие данные (клиенты, программы, история, планы питания) на сохранённые. Перед заменой текущее состояние автоматически сохраняется в ячейку №1 (АВТО) — ничего не теряется.',
    auto: 'АВТО',
    empty: 'пусто',
    counts: 'Клиенты {c} · Программы {p} · Планы {pl} · История {h}',
    save: 'Сохранить',
    load: 'Загрузить',
    savedOk: 'Ячейка {n} сохранена',
    savedCloud: ' · копия в облаке',
    savedLocal: ' (только на этом устройстве — войдите в облако для копии)',
    overwriteConfirm: 'В ячейке {n} уже есть сохранение от {d}.\n\nПерезаписать его?',
    loadConfirm: 'Загрузить данные из ячейки {n} (сохранение от {d})?\n\nТекущие данные (клиенты, программы, история, планы) будут ЗАМЕНЕНЫ на сохранённые в ячейке.\nПеред заменой текущее состояние автоматически сохранится в ячейку №1 (АВТО).',
    loadDone: 'Данные восстановлены из ячейки {n}',
    clearConfirm: 'Очистить ячейку {n}? Записанные в ней данные будут удалены.',
    cleared: 'Ячейка {n} очищена',
    emptyRefuse: 'Ячейка пуста — сначала сохраните в неё данные',
    saveFail: 'Не удалось сохранить',
    cloudNoteOut: 'Облачный аккаунт не подключён: ячейки хранятся только на этом устройстве. Подключите его (Настройки → Онлайн-аккаунт), чтобы загружать их на любом устройстве.',
    cloudNoteIn: 'Ячейки хранятся на устройстве + в облаке ({email}) — доступны с любого устройства.',
    orphanTitle: '⚠ Найдены данные клиентов, которых нет в списке (потерянные профили)',
    orphanItem: '{name}: программ {p} · тренировок {h} · планов {pl}',
    orphanRestore: 'Вернуть клиента',
    orphanRestored: 'Клиент возвращён в список (имя можно изменить в его карточке).',
    orphanDefaultName: 'Восстановленный клиент'
  },
  en: {
    open: 'Save slots (10)',
    openDesc: 'Like game saves: 10 slots with a date. #1 — auto-save, #2–10 — manual.',
    title: 'Save slots',
    subtitle: '#1 — AUTO · #2–10 — manual',
    hint: 'Loading a slot REPLACES current data (clients, programs, history, nutrition plans) with the saved one. Before replacing, the current state is auto-saved into slot #1 (AUTO) — nothing is ever lost.',
    auto: 'AUTO',
    empty: 'empty',
    counts: 'Clients {c} · Programs {p} · Plans {pl} · History {h}',
    save: 'Save',
    load: 'Load',
    savedOk: 'Slot {n} saved',
    savedCloud: ' · cloud copy',
    savedLocal: ' (this device only — sign in to cloud for a copy)',
    overwriteConfirm: 'Slot {n} already holds a save from {d}.\n\nOverwrite it?',
    loadConfirm: 'Load data from slot {n} (saved {d})?\n\nCurrent data (clients, programs, history, plans) will be REPLACED with the saved one.\nBefore replacing, the current state is auto-saved into slot #1 (AUTO).',
    loadDone: 'Data restored from slot {n}',
    clearConfirm: 'Clear slot {n}? Its saved data will be deleted.',
    cleared: 'Slot {n} cleared',
    emptyRefuse: 'Slot is empty — save something into it first',
    saveFail: 'Save failed',
    cloudNoteOut: 'Cloud account is not connected: slots live on this device only. Connect it (Settings → Online account) to load them on any device.',
    cloudNoteIn: 'Slots are stored on this device + in the cloud ({email}) — available from any device.',
    orphanTitle: '⚠ Found data of clients missing from the list (lost profiles)',
    orphanItem: '{name}: programs {p} · workouts {h} · plans {pl}',
    orphanRestore: 'Restore client',
    orphanRestored: 'Client is back in the list (rename them in their card).',
    orphanDefaultName: 'Restored client'
  },
  he: {
    open: 'משבצות שמירה (10)',
    openDesc: 'כמו שמירות במשחק: 10 משבצות עם תאריך. מס׳ 1 — שמירה אוטומטית, מס׳ 2–10 — ידנית.',
    title: 'משבצות שמירה',
    subtitle: 'מס׳ 1 — אוטומטי · מס׳ 2–10 — ידני',
    hint: 'טעינת משבצת מחליפה את הנתונים הנוכחיים (מתאמנים, תוכניות, היסטוריה, תפריטים) בנתונים השמורים. לפני ההחלפה המצב הנוכחי נשמר אוטומטית במשבצת מס׳ 1 — שום דבר לא הולך לאיבוד.',
    auto: 'אוטומטי',
    empty: 'ריק',
    counts: 'מתאמנים {c} · תוכניות {p} · תפריטים {pl} · היסטוריה {h}',
    save: 'שמור',
    load: 'טען',
    savedOk: 'משבצת {n} נשמרה',
    savedCloud: ' · עותק בענן',
    savedLocal: ' (רק במכשיר זה — התחברו לענן לעותק)',
    overwriteConfirm: 'במשבצת {n} כבר יש שמירה מ־{d}.\n\nלהחליף אותה?',
    loadConfirm: 'לטעון נתונים ממשבצת {n} (שמירה מ־{d})?\n\nהנתונים הנוכחיים (מתאמנים, תוכניות, היסטוריה, תפריטים) יוחלפו בנתונים השמורים.\nלפני ההחלפה המצב הנוכחי יישמר אוטומטית במשבצת מס׳ 1.',
    loadDone: 'הנתונים שוחזרו ממשבצת {n}',
    clearConfirm: 'לנקות את משבצת {n}? הנתונים שבה יימחקו.',
    cleared: 'משבצת {n} נוקתה',
    emptyRefuse: 'המשבצת ריקה — קודם שמרו בה נתונים',
    saveFail: 'השמירה נכשלה',
    cloudNoteOut: 'חשבון הענן אינו מחובר: המשבצות נשמרות רק במכשיר זה. חברו אותו (הגדרות → חשבון מקוון) כדי לטעון אותן בכל מכשיר.',
    cloudNoteIn: 'המשבצות נשמרות במכשיר + בענן ({email}) — זמינות מכל מכשיר.',
    orphanTitle: '⚠ נמצאו נתוני מתאמנים שאינם ברשימה (פרופילים שאבדו)',
    orphanItem: '{name}: תוכניות {p} · אימונים {h} · תפריטים {pl}',
    orphanRestore: 'שחזר מתאמן',
    orphanRestored: 'המתאמן הוחזר לרשימה (ניתן לשנות את השם בכרטיס שלו).',
    orphanDefaultName: 'מתאמן משוחזר'
  }
};
for (const lang of Object.keys(SNAP_I18N)) {
  const p = path.join(ROOT, 'src', 'i18n', lang + '.json');
  const j = JSON.parse(fs.readFileSync(p, 'utf8'));
  j.settings = j.settings || {};
  if (j.settings.snapshots) { console.error(`FAIL: ${lang} already has settings.snapshots`); fails++; continue; }
  j.settings.snapshots = SNAP_I18N[lang];
  fs.writeFileSync(p, JSON.stringify(j, null, 2) + '\n');
  console.log(`ok  i18n ${lang}.json (+settings.snapshots)`);
}

console.log(fails ? `\n${fails} FAILURES` : '\nALL PATCHES APPLIED');
process.exit(fails ? 1 : 0);
