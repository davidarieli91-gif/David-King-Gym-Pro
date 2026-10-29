/* c213 — server-first sync.
 *
 * The server is the source of truth. IndexedDB is a cache plus a durable
 * outbox. Every local write is queued in `sync_outbox`, pushed to
 * /api/sync, and remote changes are pulled into the cache. Clearing the
 * browser therefore never deletes client data.
 */
(function () {
  'use strict';

  var SYNCED_STORES = [
    'clients',
    'workout_templates',
    'workout_history',
    'nutrition_history',
    'client_programs',
    'settings',
    'food_database',
    'nutrition_plans',
    'nutrition_templates'
  ];

  var state = {
    started: false,
    applyingRemote: false,
    tenantId: null,
    lastRev: 0,
    flushTimer: null,
    flushing: false,
    pollTimer: null
  };

  function isSynced(store) {
    return SYNCED_STORES.indexOf(store) !== -1;
  }

  function recordId(store, value) {
    if (store === 'settings') {
      if (value && typeof value === 'object') return value.key || null;
      return value || null;
    }
    if (value && typeof value === 'object') return value.id || null;
    return value || null;
  }

  function skipSetting(record) {
    if (!record || typeof record.key !== 'string') return false;
    // Device-local flags describe what has been seeded on this browser. They
    // must never travel to another device, or a fresh cache would skip seeding.
    return /^(auth_|cloud|firebase|portal_share|dk_oauth|google_|seeded_|dk_food_cat|migrated_)/i.test(record.key);
  }

  function skipFood(record) {
    // The curated food catalogue is reference data shipped with the app.
    // Only custom products (manual/barcode additions) belong to a tenant.
    if (!record || typeof record.source !== 'string') return false;
    return /^(OpenFoodFacts|FoodsDictionary)/i.test(record.source);
  }

  function getCookie(name) {
    var parts = (document.cookie || '').split(';');
    for (var i = 0; i < parts.length; i++) {
      var part = parts[i].trim();
      if (part.indexOf(name + '=') === 0) return decodeURIComponent(part.slice(name.length + 1));
    }
    return '';
  }

  function csrf() {
    return getCookie('dkg_csrf');
  }

  function log() {
    try {
      var args = Array.prototype.slice.call(arguments);
      console.info.apply(console, ['[sync]'].concat(args));
    } catch (_) {}
  }

  function warn() {
    try {
      var args = Array.prototype.slice.call(arguments);
      console.warn.apply(console, ['[sync]'].concat(args));
    } catch (_) {}
  }

  function lastRevKey() {
    return 'dkg_last_rev_' + state.tenantId;
  }

  function loadLastRev() {
    try {
      var value = Number(localStorage.getItem(lastRevKey()) || 0);
      return Number.isFinite(value) && value > 0 ? value : 0;
    } catch (_) {
      return 0;
    }
  }

  function saveLastRev(rev) {
    state.lastRev = rev;
    try { localStorage.setItem(lastRevKey(), String(rev)); } catch (_) {}
  }

  function enqueueOutbox(item) {
    return db.put('sync_outbox', item).catch(function (error) {
      warn('outbox write failed', error);
    });
  }

  function onLocalChange(store, record) {
    if (!state.started || state.applyingRemote || !isSynced(store)) return;
    if (store === 'settings' && skipSetting(record)) return;
    if (store === 'food_database' && skipFood(record)) return;
    var id = recordId(store, record);
    if (!id) return;
    try {
      JSON.stringify(record);
    } catch (error) {
      warn('skipping non-JSON record', store, id, error);
      return;
    }
    enqueueOutbox({
      key: store + '/' + id,
      collection: store,
      id: id,
      data: record,
      deleted: false,
      ts: Date.now()
    });
    scheduleFlush();
  }

  function onLocalDelete(store, key) {
    if (!state.started || state.applyingRemote || !isSynced(store)) return;
    var id = recordId(store, key);
    if (!id) return;
    enqueueOutbox({
      key: store + '/' + id,
      collection: store,
      id: id,
      deleted: true,
      ts: Date.now()
    });
    scheduleFlush();
  }

  function scheduleFlush(delay) {
    clearTimeout(state.flushTimer);
    state.flushTimer = setTimeout(function () { flush(); }, delay || 900);
  }

  function payloadFor(item) {
    if (item.deleted) {
      return { collection: item.collection, id: item.id, deleted: true };
    }
    return { collection: item.collection, id: item.id, data: item.data };
  }

  async function pushBatch(items) {
    var changes = items.map(payloadFor);
    var response = await fetch('/api/sync', {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'content-type': 'application/json',
        'accept': 'application/json',
        'x-csrf-token': csrf()
      },
      body: JSON.stringify({ changes: changes })
    });

    if (response.status === 401 || response.status === 403) {
      throw new Error('auth');
    }
    if (!response.ok) {
      var body = await response.json().catch(function () { return {}; });
      var message = body && body.error && body.error.message ? body.error.message : ('HTTP ' + response.status);
      throw new Error(message);
    }
    return response.json();
  }

  async function flush() {
    if (state.flushing || !state.started) return;
    state.flushing = true;
    try {
      var pending = await db.all('sync_outbox');
      if (!pending.length) return;

      var batch = [];
      var size = 0;
      for (var i = 0; i < pending.length; i++) {
        var item = pending[i];
        var itemSize = 0;
        try { itemSize = JSON.stringify(item).length; } catch (_) { itemSize = 1024; }

        if (batch.length && (batch.length >= 100 || size + itemSize > 4 * 1024 * 1024)) {
          await pushAndClear(batch);
          batch = [];
          size = 0;
        }
        batch.push(item);
        size += itemSize;
      }
      if (batch.length) await pushAndClear(batch);

      // Reconcile with the server after a push so the local cache advances
      // past its own revisions without skipping other devices.
      await pull();
    } catch (error) {
      if (String(error && error.message) === 'auth') {
        warn('session expired; reloading gate');
        if (window.DKG_SERVER && window.DKG_SERVER.logout) window.DKG_SERVER.logout();
        return;
      }
      warn('push failed, retrying later', error);
      scheduleFlush(5000);
    } finally {
      state.flushing = false;
    }
  }

  async function pushAndClear(items) {
    await pushBatch(items);
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      var current = await db.get('sync_outbox', item.key).catch(function () { return null; });
      if (current && current.ts === item.ts) {
        await db.del('sync_outbox', item.key).catch(function () {});
      }
    }
  }

  async function pull() {
    if (!state.started) return;
    var guard = 0;
    while (guard++ < 1000) {
      var response = await fetch('/api/sync?since=' + encodeURIComponent(state.lastRev), {
        method: 'GET',
        credentials: 'same-origin',
        headers: { 'accept': 'application/json' }
      });

      if (response.status === 401 || response.status === 403) {
        throw new Error('auth');
      }
      if (!response.ok) throw new Error('HTTP ' + response.status);

      var data = await response.json();
      var records = data.records || [];
      var pending = await db.all('sync_outbox').catch(function () { return []; });
      var pendingKeys = {};
      for (var i = 0; i < pending.length; i++) pendingKeys[pending[i].key] = true;

      if (records.length) {
        state.applyingRemote = true;
        try {
          for (var j = 0; j < records.length; j++) {
            var record = records[j];
            if (!isSynced(record.collection)) continue;
            var key = record.collection + '/' + record.id;
            if (pendingKeys[key]) continue; // local edit wins until pushed
            try {
              if (record.deleted) {
                await db.del(record.collection, record.id);
              } else {
                var payload = record.data;
                /* Defense in depth: the server key is the ID. Without this,
                   db.put() would auto-generate a new UUID and duplicate a row
                   whose legacy data had no id field. */
                if (record.collection !== 'settings' && payload && typeof payload === 'object'
                    && !Array.isArray(payload) && !payload.id) {
                  payload = Object.assign({}, payload, { id: record.id });
                }
                await db.put(record.collection, payload);
              }
            } catch (error) {
              warn('apply failed', record.collection, record.id, error);
            }
          }
        } finally {
          state.applyingRemote = false;
        }
      }

      if (typeof data.nextSince === 'number') saveLastRev(data.nextSince);
      if (!data.hasMore) break;
    }
  }

  async function migrateLocal() {
    var flagKey = 'dkg_migrated_' + state.tenantId;
    try {
      if (localStorage.getItem(flagKey) === '1') return;
    } catch (_) {}

    var changes = [];
    for (var s = 0; s < SYNCED_STORES.length; s++) {
      var store = SYNCED_STORES[s];
      var rows = await db.all(store).catch(function () { return []; });
      for (var i = 0; i < rows.length; i++) {
        var row = rows[i];
        if (store === 'settings' && skipSetting(row)) continue;
        if (store === 'food_database' && skipFood(row)) continue;
        var id = recordId(store, row);
        if (!id) continue;
        changes.push({ collection: store, id: id, data: row });
      }
    }

    if (!changes.length) {
      try { localStorage.setItem(flagKey, '1'); } catch (_) {}
      return;
    }

    log('migrating local cache to server:', changes.length, 'records');
    for (var offset = 0; offset < changes.length; offset += 100) {
      await pushBatch(changes.slice(offset, offset + 100));
    }
    try { localStorage.setItem(flagKey, '1'); } catch (_) {}
    await pull();
    log('local migration complete');
  }

  async function start() {
    if (state.started) return;
    if (!window.DKG_SERVER || !window.DKG_SERVER.authenticated) return;

    state.tenantId = window.DKG_SERVER.tenantId;
    state.lastRev = loadLastRev();
    state.started = true;

    try {
      await pull();
    } catch (error) {
      warn('initial pull failed; using local cache', error);
    }

    if (window.DKG_SERVER.role === 'director') {
      try {
        await migrateLocal();
      } catch (error) {
        warn('local migration failed', error);
      }
    }

    try {
      await flush();
    } catch (error) {
      warn('initial flush failed', error);
    }

    clearInterval(state.pollTimer);
    state.pollTimer = setInterval(function () {
      if (document.visibilityState === 'visible' && navigator.onLine) {
        pull().catch(function (error) { warn('poll failed', error); });
      }
    }, 30000);

    window.addEventListener('online', function () { scheduleFlush(100); });
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) pull().catch(function () {});
    });

    log('started', { tenant: state.tenantId, role: window.DKG_SERVER.role, rev: state.lastRev });
  }

  function stop() {
    state.started = false;
    clearInterval(state.pollTimer);
    clearTimeout(state.flushTimer);
    state.pollTimer = null;
    state.flushTimer = null;
  }

  async function status() {
    var pending = 0;
    try { pending = await db.count('sync_outbox'); } catch (_) {}
    return {
      started: state.started,
      pending: pending,
      lastRev: state.lastRev,
      tenantId: state.tenantId,
      online: navigator.onLine,
      authenticated: !!(window.DKG_SERVER && window.DKG_SERVER.authenticated)
    };
  }

  async function syncNow() {
    await flush();
    await pull();
    return status();
  }

  window.DKG_SYNC = {
    start: start,
    stop: stop,
    pull: pull,
    flush: flush,
    syncNow: syncNow,
    status: status,
    migrateLocal: migrateLocal,
    onLocalChange: onLocalChange,
    onLocalDelete: onLocalDelete,
    get applyingRemote() { return state.applyingRemote; },
    set applyingRemote(value) { state.applyingRemote = !!value; }
  };
})();
