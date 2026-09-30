/* ============================================================================
   c127 — ANALYTICS ENGINE (shared single source of truth)
   ----------------------------------------------------------------------------
   ONE honest analytics core for BOTH apps (trainer analytics + portal
   analytics), loaded as a module by both HTML entries and exposed as
   window.dkAnalyticsEngine. Same pattern as src/recovery-engine.js: pure
   functions, no DOM, no storage — the apps feed it records and render.

   Why (user request 2026-09-27, «аналитика выглядит липовой»): the volume
   panels counted EVERY stored set — including never-touched sets that only
   carry the program's PRESCRIBED weight/reps (done:false) — so prescriptions
   posed as lifted work; lb sets were summed verbatim into «kg·reps» (the
   c96 per-exercise units were ignored); warmups/drops weighted like working
   sets with no way to separate them; there was NO per-exercise time series,
   no e1RM, no intensity dynamics, no PR detection, no body-composition
   series — nothing that shows PROGRESS over time. This engine is the truth
   layer c128–c130 charts will be built on.

   Definitions (documented, no magic coefficients):
     • A set COUNTS iff it exists and s.done !== false (the same tolerant
       rule as the recovery engine: legacy records without the flag count,
       explicit undone prescriptions never do).
     • Tonnage kg = weight(kg) × reps. lb → kg ×0.45359237 (per-exercise
       `unit`, exactly as recorded since c96). Cardio rows (time/dist) add
       0 tonnage but still count as sets.
     • Volume per muscle: primary group 100% + each synergist 30% — the
       SAME credit the recovery map has always used, so the analytics bars
       and the map's 7d/30d volumes can no longer disagree.
     • e1RM (Epley) = w × (1 + reps/30) — computed per done set, the best
       set of the session becomes the session's e1RM.
     • RPE zones: light ≤6 · moderate 7–8 · hard ≥9 (inputs are integers).
     • Body series: raw points + ±3-day smoothing, least-squares weekly
       rate, waist/hip ratio — no invented «body fat %».
   ============================================================================ */
(function () {
  'use strict';

  var LB_TO_KG = 0.45359237;
  var SYNERGIST_CREDIT = 0.3;
  var DAY_MS = 86400000;

  /* ---------- primitives ---------- */

  function toKg(weight, unit) {
    var w = Number(weight);
    if (!isFinite(w)) return 0;
    return unit === 'lb' ? w * LB_TO_KG : w;
  }

  /* Tolerant done-only filter (recovery-engine parity): skip ONLY explicit
     done === false — pre-flag legacy records keep counting. */
  function doneSets(sets) {
    return (sets || []).filter(function (s) { return s && s.done !== false; });
  }

  function isCardioRow(s) {
    return s && (s.time != null || s.dist != null) && !Number(s.weight);
  }

  function tsOf(rec) {
    return Number(rec && rec.ts) || Number(rec && rec.date) || 0;
  }

  function normName(s) {
    return String(s == null ? '' : s).trim().toLowerCase().replace(/\s+/g, ' ');
  }

  function exKeyOf(ex) {
    if (ex && ex.exercise_id) return 'id:' + ex.exercise_id;
    if (ex && ex.key) return 'id:' + ex.key;
    var n = normName(ex && ex.name);
    return n ? 'nm:' + n : '';
  }

  function r1(x) { return isFinite(x) ? Math.round(x * 10) / 10 : 0; }

  /* ---------- volume (honest, kg-normalized) ---------- */

  /* Per-exercise stats over DONE sets: { volumeKg, setsDone, warmupKg }.
     Cardio rows contribute sets but zero tonnage. */
  function exStatsKg(ex) {
    var volumeKg = 0, setsDone = 0, warmupKg = 0;
    doneSets(ex && ex.sets).forEach(function (s) {
      setsDone++;
      var w = toKg(s.weight, ex && ex.unit), r = Number(s.reps) || 0;
      if (isCardioRow(s) || !w || !r) return; /* cardio / empty row */
      var v = w * r;
      volumeKg += v;
      if (s.type === 'warmup') warmupKg += v;
    });
    return { volumeKg: volumeKg, setsDone: setsDone, warmupKg: warmupKg };
  }

  /* Whole-record tonnage in kg (done sets only) — what a workout actually
     lifted. Replaces the old ALL-sets raw-unit sums. */
  function recVolumeKg(rec) {
    var v = 0;
    ((rec && rec.exercises) || []).forEach(function (ex) { v += exStatsKg(ex).volumeKg; });
    return Math.round(v);
  }

  function _addTo(map, g, volKg, sets, ts) {
    if (!map[g]) map[g] = { volumeKg: 0, sets: 0, lastTs: 0 };
    map[g].volumeKg += volKg;
    if (g && sets) map[g].sets += sets;
    if (ts && ts > map[g].lastTs) map[g].lastTs = ts;
  }

  /* Volume per muscle group over the given records.
     opts.resolveEx(ex, rec) → { group, synergists } | null  (the app keeps
     its own group resolver — engine stays UI-agnostic).
     opts.synergistFactor — default 0.3 (map parity), 0 disables.
     Returns { byGroup: {g: {volumeKg, sets, lastTs}}, totalKg, totalSets }.
     byGroup includes the synergist credit (bars/map consistency); totalKg /
     totalSets are the PURE primary tonnage / set count of the work done. */
  function volumeByMuscle(workouts, opts) {
    opts = opts || {};
    var synF = opts.synergistFactor == null ? SYNERGIST_CREDIT : opts.synergistFactor;
    var resolve = opts.resolveEx || function () { return null; };
    var byGroup = {}, totalKg = 0, totalSets = 0;
    (workouts || []).forEach(function (rec) {
      ((rec && rec.exercises) || []).forEach(function (ex) {
        var st = exStatsKg(ex);
        if (!st.setsDone && !st.volumeKg) return;
        var res = resolve(ex, rec) || {};
        var g = res.group || 'other';
        var ts = tsOf(rec);
        _addTo(byGroup, g, st.volumeKg, st.setsDone, ts);
        totalKg += st.volumeKg;
        totalSets += st.setsDone;
        if (synF > 0) {
          (res.synergists || []).forEach(function (syn) {
            if (!syn || syn === g) return;
            _addTo(byGroup, syn, st.volumeKg * synF, st.setsDone, ts); /* sets counted full — map parity */
          });
        }
      });
    });
    return { byGroup: byGroup, totalKg: totalKg, totalSets: totalSets };
  }

  /* Weekly buckets for trend charts (c128+). Returns the last `weeks`
     entries OLDEST-FIRST, zero-filled so charts never skip a week:
     [{ weekStart, groups: {g: kg}, totalKg, sets }] */
  function volumeWeekly(workouts, opts, weeks) {
    opts = opts || {};
    var res = volumeByMuscle(workouts, opts);
    var n = Math.max(1, Math.min(52, weeks || 8));
    var base = weekStartOf(opts.now || Date.now());
    var out = [];
    for (var i = n - 1; i >= 0; i--) {
      var ws = base - i * 7 * DAY_MS;
      out.push({ weekStart: ws, groups: {}, totalKg: 0, sets: 0 });
    }
    (workouts || []).forEach(function (rec) {
      var ts = tsOf(rec);
      if (!ts) return;
      var idx = out.findIndex(function (w) { return ts >= w.weekStart && ts < w.weekStart + 7 * DAY_MS; });
      if (idx < 0) return;
      ((rec && rec.exercises) || []).forEach(function (ex) {
        var st = exStatsKg(ex);
        var r = (opts.resolveEx || function () { return null; })(ex, rec) || {};
        var g = r.group || 'other';
        out[idx].groups[g] = (out[idx].groups[g] || 0) + st.volumeKg;
        out[idx].totalKg += st.volumeKg;
        out[idx].sets += st.setsDone;
      });
    });
    Object.keys(res.byGroup).forEach(function (g) { void g; }); /* byGroup available via volumeByMuscle */
    return out;
  }

  function weekStartOf(ts) {
    var d = new Date(ts);
    d.setHours(0, 0, 0, 0);
    var wd = (d.getDay() + 6) % 7; /* Monday = week start */
    d.setDate(d.getDate() - wd);
    return d.getTime();
  }

  /* ---------- per-exercise progress series (THE progress metrics) ---------- */

  /* opts.match(ex, rec) → bool. One point per workout occurrence that has at
     least one DONE working set (reps > 0). Sorted oldest → newest. */
  function exerciseSeries(workouts, opts) {
    var match = (opts && opts.match) || function () { return false; };
    var pts = [];
    (workouts || []).slice().sort(function (a, b) { return tsOf(a) - tsOf(b); }).forEach(function (rec) {
      ((rec && rec.exercises) || []).forEach(function (ex) {
        if (!match(ex, rec)) return;
        var sets = doneSets(ex && ex.sets).map(function (s) {
          return {
            w: toKg(s.weight, ex.unit),
            r: Number(s.reps) || 0,
            rpe: s.rpe != null && s.rpe !== '' ? Number(s.rpe) : null,
            type: s.type || 'normal'
          };
        }).filter(function (s) { return s.r > 0; });
        if (!sets.length) return;
        var top = sets.reduce(function (a, b) {
          return (b.w > a.w || (b.w === a.w && b.r > a.r)) ? b : a;
        }, sets[0]);
        var e1 = sets.reduce(function (m, s) { return Math.max(m, s.w * (1 + s.r / 30)); }, 0);
        var wsum = 0, rsum = 0, maxR = 0, rpeSum = 0, rpeN = 0, vol = 0;
        sets.forEach(function (s) {
          wsum += s.w * s.r; rsum += s.r; vol += s.w * s.r;
          if (s.r > maxR) maxR = s.r;
          if (s.rpe != null) { rpeSum += s.rpe; rpeN++; }
        });
        pts.push({
          ts: tsOf(rec), date: rec.date || '',
          topKg: r1(top.w), topReps: top.r, topRpe: top.rpe,
          e1rm: r1(e1),
          avgWorkKg: rsum ? r1(wsum / rsum) : 0,
          maxReps: maxR,
          rpeAvg: rpeN ? r1(rpeSum / rpeN) : null,
          volumeKg: Math.round(vol), setsDone: sets.length
        });
      });
    });
    return pts;
  }

  /* ---------- personal records ---------- */

  /* PRs per exercise key (exercise_id → normalized-name fallback), from
     DONE sets only. opts.now + opts.windowDays (default 30) select the
     «recent» feed (new bests achieved inside the window).
     Returns { byKey: {key: {name, count, bestWeight, bestE1rm, bestReps}},
               recent: [{key, name, type: 'weight'|'e1rm'|'reps', value, prev, ts}] } */
  function prs(workouts, opts) {
    opts = opts || {};
    var now = opts.now || Date.now();
    var win = opts.windowDays == null ? 30 : opts.windowDays;
    var byKey = {}, recent = [];
    (workouts || []).slice().sort(function (a, b) { return tsOf(a) - tsOf(b); }).forEach(function (rec) {
      var ts = tsOf(rec);
      ((rec && rec.exercises) || []).forEach(function (ex) {
        var key = exKeyOf(ex);
        if (!key) return;
        var sets = doneSets(ex && ex.sets).map(function (s) {
          return { w: toKg(s.weight, ex.unit), r: Number(s.reps) || 0 };
        }).filter(function (s) { return s.w > 0 && s.r > 0; });
        if (!sets.length) return;
        var topW = sets.reduce(function (m, s) { return Math.max(m, s.w); }, 0);
        var e1 = sets.reduce(function (m, s) { return Math.max(m, s.w * (1 + s.r / 30)); }, 0);
        var reps = sets.reduce(function (m, s) { return Math.max(m, s.r); }, 0);
        var e = byKey[key];
        if (!e) { e = byKey[key] = { name: ex.name || key, count: 0, bestWeight: null, bestE1rm: null, bestReps: null }; }
        e.count++;
        function beat(field, value, type) {
          if (!value) return;
          var prevBest = e[field];
          if (!prevBest || value > prevBest.v + 1e-9) {
            e[field] = { v: r1(value), ts: ts };
            if (prevBest && ts && now - ts <= win * DAY_MS) {
              recent.push({ key: key, name: e.name, type: type, value: r1(value), prev: prevBest.v, ts: ts });
            }
          }
        }
        beat('bestWeight', topW, 'weight');
        beat('bestE1rm', e1, 'e1rm');
        beat('bestReps', reps, 'reps');
      });
    });
    recent.sort(function (a, b) { return b.ts - a.ts; });
    return { byKey: byKey, recent: recent };
  }

  /* ---------- intensity (RPE) dynamics ---------- */

  /* Weekly RPE profile for the last `weeks` weeks (oldest-first, filled):
     [{ weekStart, rpeAvg, sets, zones: { light: {sets, volumeKg},
        moderate: {...}, hard: {...} } }] — light ≤6 · moderate 7–8 · hard ≥9. */
  function weeklyRpe(workouts, opts, weeks) {
    opts = opts || {};
    var n = Math.max(1, Math.min(52, weeks || 8));
    var base = weekStartOf(opts.now || Date.now());
    var out = [];
    for (var i = n - 1; i >= 0; i--) {
      var ws = base - i * 7 * DAY_MS;
      out.push({ weekStart: ws, rpeAvg: null, sets: 0, zones: { light: { sets: 0, volumeKg: 0 }, moderate: { sets: 0, volumeKg: 0 }, hard: { sets: 0, volumeKg: 0 } } });
    }
    (workouts || []).forEach(function (rec) {
      var ts = tsOf(rec);
      if (!ts) return;
      var idx = out.findIndex(function (w) { return ts >= w.weekStart && ts < w.weekStart + 7 * DAY_MS; });
      if (idx < 0) return;
      ((rec && rec.exercises) || []).forEach(function (ex) {
        doneSets(ex && ex.sets).forEach(function (s) {
          if (s.rpe == null || s.rpe === '') return;
          var rpe = Number(s.rpe);
          if (!isFinite(rpe)) return;
          var w = toKg(s.weight, ex.unit) * (Number(s.reps) || 0);
          var z = rpe <= 6 ? 'light' : rpe <= 8 ? 'moderate' : 'hard';
          out[idx].zones[z].sets++;
          out[idx].zones[z].volumeKg += w;
          out[idx].sets++;
        });
      });
    });
    /* exact per-set mean pass (keeps zones and the average from diverging) */
    out.forEach(function (w) {
      var sum = 0, cnt = 0;
      (workouts || []).forEach(function (rec) {
        var ts = tsOf(rec);
        if (!(ts >= w.weekStart && ts < w.weekStart + 7 * DAY_MS)) return;
        ((rec && rec.exercises) || []).forEach(function (ex) {
          doneSets(ex && ex.sets).forEach(function (s) {
            if (s.rpe == null || s.rpe === '') return;
            var rpe = Number(s.rpe);
            if (!isFinite(rpe)) return;
            sum += rpe; cnt++;
          });
        });
      });
      w.rpeAvg = cnt ? r1(sum / cnt) : null;
    });
    return out;
  }

  /* ---------- body composition (check-ins) ---------- */

  /* Raw + smoothed series and honest rates. NO invented body-fat %.
     opts.days (default 90) window. */
  function bodySeries(checks, opts) {
    opts = opts || {};
    var now = opts.now || Date.now();
    var days = opts.days == null ? 90 : opts.days;
    var from = now - days * DAY_MS;
    var pts = (checks || []).map(function (c) {
      return {
        ts: Number(c.ts) || Date.parse(c.date) || 0,
        date: c.date || '',
        weight: Number(c.weight) > 0 ? Number(c.weight) : null,
        waist: Number(c.waist) > 0 ? Number(c.waist) : null,
        hip: Number(c.hip) > 0 ? Number(c.hip) : null,
        energy: c.energy != null ? Number(c.energy) : null
      };
    }).filter(function (p) { return p.ts > 0 && p.ts >= from; })
      .sort(function (a, b) { return a.ts - b.ts; });

    function smooth(field, halfWindowDays) {
      var hw = halfWindowDays == null ? 3 : halfWindowDays;
      return pts.map(function (p) {
        var sum = 0, n = 0;
        pts.forEach(function (q) {
          if (q[field] == null) return;
          if (Math.abs(q.ts - p.ts) <= hw * DAY_MS) { sum += q[field]; n++; }
        });
        return n ? r1(sum / n) : null;
      });
    }
    var smoothW = smooth('weight'), smoothWaist = smooth('waist');

    /* least-squares slope over the window → per-week rate */
    function slope(field) {
      var xy = pts.filter(function (p) { return p[field] != null; });
      if (xy.length < 2) return null;
      var t0 = xy[0].ts, n = 0, sx = 0, sy = 0, sxx = 0, sxy = 0;
      xy.forEach(function (p) {
        var x = (p.ts - t0) / DAY_MS, y = p[field];
        n++; sx += x; sy += y; sxx += x * x; sxy += x * y;
      });
      var den = n * sxx - sx * sx;
      if (!den) return null;
      var perDay = (n * sxy - sx * sy) / den;
      return Math.round(perDay * 7 * 100) / 100;
    }

    var wPts = pts.filter(function (p) { return p.weight != null; });
    var lastW = wPts.length ? wPts[wPts.length - 1] : null;
    var firstW = wPts.length ? wPts[0] : null;
    var rateW = slope('weight'), rateWaist = slope('waist');
    var lastWaist = null, lastHip = null;
    for (var i = pts.length - 1; i >= 0; i--) {
      if (lastWaist == null && pts[i].waist != null) lastWaist = pts[i].waist;
      if (lastHip == null && pts[i].hip != null) lastHip = pts[i].hip;
      if (lastWaist != null && lastHip != null) break;
    }
    /* c129: hip fields mirror the waist ones — the trainer's body card
       shows both with the SAME math (no per-UI improvisation). */
    var rateHip = slope('hip');
    var hipDelta = rateHip == null ? null : (function () {
      var hp = pts.filter(function (p) { return p.hip != null; });
      return Math.round((hp[hp.length - 1].hip - hp[0].hip) * 10) / 10;
    })();
    return {
      points: pts, smoothWeight: smoothW, smoothWaist: smoothWaist,
      deltaKg: firstW && lastW ? Math.round((lastW.weight - firstW.weight) * 10) / 10 : null,
      ratePerWeekKg: rateW,
      waistDelta: rateWaist == null ? null : (function () {
        var wp = pts.filter(function (p) { return p.waist != null; });
        return Math.round((wp[wp.length - 1].waist - wp[0].waist) * 10) / 10;
      })(),
      waistRatePerWeek: rateWaist,
      hipDelta: hipDelta,
      hipRatePerWeek: rateHip,
      ratioWaistHip: lastWaist && lastHip ? Math.round(lastWaist / lastHip * 100) / 100 : null,
      first: firstW, last: lastW
    };
  }

  /* ---------- exports ---------- */
  var api = {
    version: 'c129',
    LB_TO_KG: LB_TO_KG,
    SYNERGIST_CREDIT: SYNERGIST_CREDIT,
    toKg: toKg,
    doneSets: doneSets,
    exStatsKg: exStatsKg,
    recVolumeKg: recVolumeKg,
    volumeByMuscle: volumeByMuscle,
    volumeWeekly: volumeWeekly,
    weekStartOf: weekStartOf,
    exerciseSeries: exerciseSeries,
    prs: prs,
    weeklyRpe: weeklyRpe,
    bodySeries: bodySeries,
    exKeyOf: exKeyOf
  };
  if (typeof window !== 'undefined') window.dkAnalyticsEngine = api;
  else if (typeof globalThis !== 'undefined') globalThis.dkAnalyticsEngine = api;
})();
