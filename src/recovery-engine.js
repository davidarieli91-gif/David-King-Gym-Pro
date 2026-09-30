/* ============================================================================
   c122 — RECOVERY ENGINE v2 (shared single source of truth)
   ----------------------------------------------------------------------------
   ONE recovery model for BOTH apps (trainer recoveryMap + portal recp map),
   loaded as an ES module by both HTML entries (bundled by vite) and exposed
   as window.dkRecoveryEngine. The two maps can no longer diverge.

   Why v2 (user request 2026-09-26): the old model was PURELY time-based —
   recovery = 100·(1−e^(−days/3)) from the muscle's last training day, so
   1 easy set and 20 heavy sets produced an identical curve, the per-set RPE
   («уровень тяжести», stored since c90/c121) was never read, bodyweight
   exercises (weight 0) were INVISIBLE (volume 0 → day bucket dropped → the
   muscle showed «не тренирован / 100% fresh» the day after 200 pull-ups),
   kg and lb tonnage were summed raw, and nothing was personal.

   The v2 model (per the user's spec):
     1. Per DONE set:  load = weightKg × reps × intensity / 100
        • weightKg — recorded weight (lb → kg ×0.45359237); bodyweight
          patterns (pull-up / dip / push-up / squat / plank / …) are valued
          as bodyWeight × patternFraction (+ added weight if any);
          NO weight at all → fallback chain, exactly as requested
          («если нету рабочего веса — брать средний»):
             a) the client's own average weight for THIS exercise (90d)
             b) the client's average weight for the muscle GROUP (90d)
             c) reps-only light credit when nothing is calculable
        • intensity — from the set's RPE when present (RPE10→1.0 …
          RPE4→0.15), otherwise estimated from the rep count.
     2. Personal capacity per muscle = 90th percentile of that muscle's own
        daily loads over the last 90 days («your hardest day»); a cold start
        (<3 load days) falls back to a sensible default so new clients see
        sane numbers from day one.
     3. Personal decay τ: 3.0 days baseline at ~2 sessions/week, modulated
        by the client's real training frequency over the last 28 days
        (regular 3+/week recovers faster; sparse training slower).
     4. fatigueNow = Σ days  min(dayLoad/capacity, 1.5) · e^(−Δdays/τ)
        recovery% = clamp(100 · (1 − fatigueNow), 0…100)
     5. Volume is now kg-NORMALIZED everywhere (no more kg+lb garbage) and
        bodyweight days COUNT (a day bucket is valid on DONE SETS, not on
        tonnage > 0 — the «invisible pull-ups» bug is fixed).

   BACK-COMPAT: the per-group result keeps EVERY field the old UI reads
   (recovery, lastTrainedDaysAgo, lastTrainedMs, volume7d, volume30d,
   sets7d, sets30d, status) and only ADDS load7d / load30d / capacity /
   tauDays / fatigueNow. The legacy inline accumulators stay in both apps
   as a fallback for the (unlikely) case this module failed to load.

   c125 — CHECK-IN WEIGHT + ENERGY: the trainer's map now uses the client's
   latest portal check-in weight (synced additively through the shared ps_hist
   cloud doc — ts/weight/energy ONLY, waist/hip/note stay local) and, when the
   user opts in («⚡ Энергия», default OFF), the latest check-in energy 1–10
   modulates the personal decay τ by ±10%: exhausted (1) → τ×1.1 (slower
   recovery), fresh (10) → τ×0.9 (faster). cfg.energy + cfg.energyTauMod;
   meta gains energy / tauMod (null when the modifier is off or unavailable).

   Public API:
     dkRecoveryEngine.compute({ workouts, resolveEx, bodyWeightKg, now,
                                energy, energyTauMod })
       → { groups: { chest: {...}, ... },
           meta: { bodyWeightKg, tauDays, capacitySource, groupsComputed,
                   energy, tauMod } }
       resolveEx(ex, workout) →
         { group, synergists[], names[], equipment? } | null   (sync)
   ============================================================================ */
(function () {
  'use strict';

  var KG_PER_LB = 0.45359237;
  var MS_PER_DAY = 86400000;
  var SYN_CREDIT = 0.30;            // synergist fatigue credit (unchanged from v1)
  var DEFAULT_BODY_WEIGHT = 75;     // kg, when nothing better is known (c125 adds check-in weight)
  var DEFAULT_CAPACITY = 40;        // load units/day, cold start (<3 load days)
  var CAPACITY_WINDOW_DAYS = 90;    // personal capacity window
  var CAPACITY_MIN_DAYS = 3;        // distinct load days before the personal capacity is trusted
  var FATIGUE_HORIZON_DAYS = 60;    // older days contribute ~0 (e^-20)
  var DAY_RATIO_CAP = 1.5;          // one day can never exceed 1.5 × capacity of fatigue
  var ENERGY_TAU_SPAN = 0.2;        // c125: energy 1→10 shifts τ by +10%…−10%

  /** c125: optional energy → τ modifier (default OFF — apps opt in).
   *  energy 1 (exhausted) → ×1.1 (slower decay), 10 (fresh) → ×0.9.
   *  @param {(number|null)} energy  check-in energy 1–10
   *  @param {boolean} enabled        the user's opt-in flag
   *  @returns {(number|null)} multiplier or null when disabled/unknown */
  function energyTauMod(energy, enabled) {
    if (!enabled) return null;
    var e = parseFloat(energy);
    if (!isFinite(e)) return null;
    e = clamp(e, 1, 10);
    return clamp(1.1 - (e - 1) * (ENERGY_TAU_SPAN / 9), 0.9, 1.1);
  }

  // All canonical muscle groups — MUST match the trainer's ALL_GROUPS and
  // the portal's RECP_GROUPS (13 entries, same keys).
  var GROUPS = ['chest', 'back', 'shoulders', 'elbow_flexors', 'triceps', 'forearms',
                'abdominals', 'legs', 'stretching', 'warmup', 'cardio', 'balance', 'calisthenics'];

  /* Bodyweight movement patterns → the fraction of body weight actually moved.
     Matched against the exercise name (EN/RU/HE keywords). Kept short and
     conservative — unknown patterns fall back to the weight-fallback chain. */
  var BW_PATTERNS = [
    { re: /pull[\s-]?up|chin[\s-]?up|подтяг|מתח/i,                f: 1.00 },
    { re: /muscle[\s-]?up|маскл[\s-]?ап/i,                        f: 1.00 },
    { re: /dip|брусь|מקבילים/i,                                   f: 0.95 },
    { re: /handstand|стойк[аи] на руках/i,                        f: 0.70 },
    { re: /inverted|australian|горизонтальн/i,                    f: 0.70 },
    { re: /squat|присед|סקוואט/i,                                 f: 0.65 },
    { re: /push[\s-]?up|pushup|отжим|שכיבות סמיכה/i,              f: 0.64 },
    { re: /calf[\s-]?raise|подъем[ы]? на носк|הרמות שוקיים/i,     f: 0.65 },
    { re: /lunge|выпад|לאנג/i,                                    f: 0.50 },
    { re: /step[\s-]?up|зашаг|עליית מדרגות/i,                     f: 0.50 },
    { re: /hyperextension|гиперэкстенз/i,                         f: 0.50 },
    { re: /plank|планк[аи]?|פלאנק/i,                              f: 0.40 },
    { re: /crunch|скручив|подъем[ы]? туловищ|כפיפות בטן/i,        f: 0.40 }
  ];

  function isNum(v) { return typeof v === 'number' && isFinite(v); }
  function clamp(v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); }

  function bwPatternFraction(names, equipment) {
    try {
      if (names && names.length) {
        for (var i = 0; i < names.length; i++) {
          var n = String(names[i] == null ? '' : names[i]);
          if (!n) continue;
          for (var p = 0; p < BW_PATTERNS.length; p++) {
            if (BW_PATTERNS[p].re.test(n)) return BW_PATTERNS[p].f;
          }
        }
      }
      /* weak signal: the exercise base flags the equipment as bodyweight */
      if (equipment && /bodyweight|вес тела|משקל גוף/i.test(String(equipment))) return 0.60;
    } catch (e) {}
    return 0;
  }

  function toKg(weight, unit) {
    var w = parseFloat(weight);
    if (!isFinite(w) || w <= 0) return 0;
    if (String(unit || '').toLowerCase() === 'lb') w *= KG_PER_LB;
    return w;
  }

  function parseReps(s) {
    if (isNum(s.reps)) return s.reps;
    var r = parseInt(s.reps, 10);
    return isFinite(r) ? r : 0;
  }

  /** Intensity 0.15…1.0 — RPE («уровень тяжести») first, rep count fallback. */
  function setIntensity(rpe, reps) {
    var r = parseFloat(rpe);
    if (isFinite(r) && r > 0) return clamp((r - 3) / 7, 0.15, 1.0);
    if (reps <= 5) return 0.85;
    if (reps <= 8) return 0.70;
    if (reps <= 12) return 0.50;
    if (reps <= 15) return 0.38;
    return 0.28;
  }

  function percentile90(sortedAsc) {
    if (!sortedAsc.length) return DEFAULT_CAPACITY;
    var idx = Math.ceil(0.9 * sortedAsc.length) - 1;
    if (idx < 0) idx = 0;
    return sortedAsc[idx];
  }

  function exKeyOf(ex) {
    return String((ex && ex.exercise_id) || '') ||
           String((ex && ex.name) || '').trim().toLowerCase().replace(/\s+/g, ' ');
  }

  /* ============================================================================
     c124 — TREND («Тренд»): per-muscle daily series + sparkline renderer
     ----------------------------------------------------------------------------
     trend(cfg) returns, for EACH of the last N days (14/30), the day's load and
     the recovery% as it stood at the END of that day — recomputed with the SAME
     personal capacity / τ / formula as compute() (both share accumulate(),
     so the sparkline and the map can never diverge):
       recovery(d) = clamp(100 · (1 − Σ_b min(load_b/capacity, 1.5) · e^(−(d−b)/τ)))
     sparkSVG(daily) renders that series as a tiny inline SVG — load BARS
     (normalized to the window max) + a recovery LINE colored by the map's own
     bands (green ≥85 / amber ≥50 / red below). No external chart library.
     ============================================================================ */
  /**
   * Shared accumulation core (passes A–C + the personal τ). Used by BOTH
   * compute() and trend() — the single source for the per-(group, day) data.
   * @param {{workouts:Array, resolveEx:Function, bodyWeightKg:(number|null), now:number}} cfg
   * @returns {{load:Object, vol:Object, sets:Object, dayNow:number, now:number, tau:number, bodyWeight:number}}
   */
  function accumulate(cfg) {
    var workouts = (cfg && cfg.workouts) || [];
    var resolveEx = (cfg && typeof cfg.resolveEx === 'function') ? cfg.resolveEx : function () { return null; };
    var now = isNum(cfg && cfg.now) ? cfg.now : Date.now();
    var bodyWeight = (cfg && isNum(cfg.bodyWeightKg) && cfg.bodyWeightKg > 30 && cfg.bodyWeightKg < 300)
      ? cfg.bodyWeightKg : DEFAULT_BODY_WEIGHT;
    var dayNow = Math.floor(now / MS_PER_DAY);

    /* ---- per-(group, day) accumulators ---- */
    var load = {}, vol = {}, sets = {};
    GROUPS.forEach(function (g) { load[g] = {}; vol[g] = {}; sets[g] = {}; });
    var anyTrainingDays = {};   // bucket → true (any group) — for the personal τ

    /* ---- PASS A: walk history → occurrences + per-exercise weight samples ---- */
    var perEx = {};             // exKey → { group, sum, n } (90d weight samples)
    var occurrences = [];       // { exKey, group, syn[], bucket, sets[], exAvg }
    workouts.forEach(function (w) {
      if (!w || !Array.isArray(w.exercises)) return;
      var ts = Number(w.date);
      if (!isFinite(ts) || ts <= 0) ts = Date.parse(w.date);
      if (!isFinite(ts) || ts <= 0) ts = Number(w.ts);
      if (!isFinite(ts) || ts <= 0) return;
      var bucket = Math.floor(ts / MS_PER_DAY);
      w.exercises.forEach(function (ex) {
        if (!ex) return;
        var info = null;
        try { info = resolveEx(ex, w); } catch (e) { info = null; }
        if (!info || !info.group || GROUPS.indexOf(info.group) === -1) return;
        var syn = (Array.isArray(info.synergists) ? info.synergists : [])
          .filter(function (s) { return s && GROUPS.indexOf(s) !== -1 && s !== info.group; });
        syn = syn.filter(function (s, i) { return syn.indexOf(s) === i; });
        var patternF = bwPatternFraction(info.names, info.equipment);
        var doneSets = [];
        (ex.sets || []).forEach(function (s) {
          if (!s || s.done === false) return;   /* live-undone sets are skipped (v1 rule) */
          doneSets.push({
            wKg: toKg(s.weight, ex.unit),       /* 0 when missing / bodyweight */
            reps: parseReps(s),
            rpe: s.rpe,
            time: (s.time != null ? s.time : null),
            dist: (s.dist != null ? s.dist : null),
            patternF: patternF
          });
        });
        if (!doneSets.length) return;
        var exKey = exKeyOf(ex);
        if (exKey) {
          var rec = perEx[exKey];
          if (!rec) { rec = perEx[exKey] = { group: info.group, sum: 0, n: 0 }; }
          doneSets.forEach(function (ds) {
            if (ds.wKg > 0 && (dayNow - bucket) <= CAPACITY_WINDOW_DAYS) { rec.sum += ds.wKg; rec.n++; }
          });
        }
        anyTrainingDays[bucket] = true;
        occurrences.push({ exKey: exKey, group: info.group, syn: syn, bucket: bucket, sets: doneSets, exAvg: 0 });
      });
    });

    /* ---- PASS B: exercise averages → group averages (90d window) ---- */
    var exAvg = {}, groupAvgSum = {}, groupAvgN = {};
    Object.keys(perEx).forEach(function (k) {
      var r = perEx[k];
      if (r.n > 0) {
        exAvg[k] = r.sum / r.n;
        groupAvgSum[r.group] = (groupAvgSum[r.group] || 0) + exAvg[k];
        groupAvgN[r.group] = (groupAvgN[r.group] || 0) + 1;
      }
    });
    var groupAvg = {};
    Object.keys(groupAvgSum).forEach(function (g) { groupAvg[g] = groupAvgSum[g] / groupAvgN[g]; });
    occurrences.forEach(function (occ) {
      if (occ.exKey && isNum(exAvg[occ.exKey])) occ.exAvg = exAvg[occ.exKey];
    });

    /* ---- PASS C: per-set load (kg-normalized, personal fallbacks) ---- */
    occurrences.forEach(function (occ) {
      occ.sets.forEach(function (ds) {
        var wKg = ds.wKg;
        if (wKg <= 0 && ds.patternF > 0) {
          /* bodyweight pattern: body weight × fraction (+ added external load) */
          wKg = bodyWeight * ds.patternF + (ds.wKg > 0 ? ds.wKg : 0);
        }
        var volKg = 0;
        var loadUnits;
        if (wKg > 0) {
          loadUnits = (wKg * ds.reps * setIntensity(ds.rpe, ds.reps)) / 100;
          volKg = wKg * ds.reps;
        } else if (ds.time != null || ds.dist != null) {
          loadUnits = 1.5;            /* cardio / time+dist set → light fixed credit */
        } else {
          /* «брать средний»: client's average for THIS exercise, then the
             group's average (90d); nothing calculable → small reps credit */
          if (isNum(occ.exAvg) && occ.exAvg > 0) {
            wKg = occ.exAvg;
            loadUnits = (wKg * ds.reps * setIntensity(ds.rpe, ds.reps)) / 100;
            volKg = wKg * ds.reps;
          } else if (isNum(groupAvg[occ.group])) {
            wKg = groupAvg[occ.group];
            loadUnits = (wKg * ds.reps * setIntensity(ds.rpe, ds.reps)) / 100;
            volKg = wKg * ds.reps;
          } else {
            loadUnits = ds.reps * 0.05;
          }
        }
        load[occ.group][occ.bucket] = (load[occ.group][occ.bucket] || 0) + loadUnits;
        vol[occ.group][occ.bucket] = (vol[occ.group][occ.bucket] || 0) + volKg;
        sets[occ.group][occ.bucket] = (sets[occ.group][occ.bucket] || 0) + 1;
        occ.syn.forEach(function (sn) {
          load[sn][occ.bucket] = (load[sn][occ.bucket] || 0) + loadUnits * SYN_CREDIT;
          vol[sn][occ.bucket] = (vol[sn][occ.bucket] || 0) + volKg * SYN_CREDIT;
          sets[sn][occ.bucket] = (sets[sn][occ.bucket] || 0) + 1;
        });
      });
    });

    /* personal τ from the last 28 days' real training frequency
       (c125: × the optional check-in-energy modifier, default OFF) */
    var recentDays = 0;
    Object.keys(anyTrainingDays).forEach(function (b) {
      var d = dayNow - Number(b);
      if (d >= 0 && d < 28) recentDays++;
    });
    var tau = clamp(3.4 - 0.2 * (recentDays / 4), 2.5, 3.5);
    var tauMod125 = energyTauMod(cfg && cfg.energy, cfg && cfg.energyTauMod);
    if (tauMod125) tau = clamp(tau * tauMod125, 2.25, 3.85);

    return { load: load, vol: vol, sets: sets, dayNow: dayNow, now: now, tau: tau, bodyWeight: bodyWeight,
             energy: (tauMod125 && isFinite(parseFloat(cfg.energy))) ? clamp(parseFloat(cfg.energy), 1, 10) : null,
             tauMod: tauMod125 };
  }

  /**
   * @param {{workouts:Array, resolveEx:Function, bodyWeightKg:(number|null), now:number}} cfg
   */
  function compute(cfg) {
    var acc = accumulate(cfg);
    var now = acc.now, dayNow = acc.dayNow, tau = acc.tau, bodyWeight = acc.bodyWeight;
    var load = acc.load, vol = acc.vol, sets = acc.sets;

    /* ---- PASS D: per-group summary (back-compatible + additive) ---- */
    var capacitySource = 'default';
    var out = {};
    GROUPS.forEach(function (g) {
      var lm = load[g], vm = vol[g], sm = sets[g];
      /* a bucket counts when the muscle got DONE SETS (v2 fix: not tonnage>0,
         so bodyweight sessions are no longer invisible) */
      var buckets = Object.keys(sm).map(Number).filter(function (b) { return (sm[b] || 0) > 0; });
      var last = null;
      buckets.forEach(function (b) { if (last === null || b > last) last = b; });
      var lastMs = last !== null ? last * MS_PER_DAY : null;
      var lastDaysAgo = lastMs !== null ? (now - lastMs) / MS_PER_DAY : null;

      var v7 = 0, v30 = 0, s7 = 0, s30 = 0, l7 = 0, l30 = 0;
      var dailyLoads90 = [];
      buckets.forEach(function (b) {
        var d = dayNow - b;
        if (d < 0) return;
        if (d < 7)  { v7 += vm[b] || 0; s7 += sm[b] || 0; l7 += lm[b] || 0; }
        if (d < 30) { v30 += vm[b] || 0; s30 += sm[b] || 0; l30 += lm[b] || 0; }
        if (d < CAPACITY_WINDOW_DAYS && (lm[b] || 0) > 0) dailyLoads90.push(lm[b]);
      });
      dailyLoads90.sort(function (a, b2) { return a - b2; });
      var capacity = DEFAULT_CAPACITY;
      if (dailyLoads90.length >= CAPACITY_MIN_DAYS) { capacity = percentile90(dailyLoads90); capacitySource = 'personal'; }
      if (!isFinite(capacity) || capacity <= 0) capacity = DEFAULT_CAPACITY;

      /* fatigue → recovery (v2 core) */
      var fatigue = 0;
      if (last !== null) {
        buckets.forEach(function (b) {
          var d = dayNow - b;
          if (d < 0 || d > FATIGUE_HORIZON_DAYS) return;
          fatigue += clamp((lm[b] || 0) / capacity, 0, DAY_RATIO_CAP) * Math.exp(-d / tau);
        });
      }
      var recovery = (lastDaysAgo === null) ? 100 : clamp(Math.round(100 * (1 - fatigue)), 0, 100);

      var status;
      if (lastDaysAgo === null) status = 'untrained';
      else if (recovery >= 85) status = 'fresh';
      else if (recovery >= 50) status = 'recovering';
      else status = 'fatigued';

      out[g] = {
        /* --- v1 fields (unchanged shape) --- */
        recovery: recovery,
        lastTrainedDaysAgo: lastDaysAgo,
        lastTrainedMs: lastMs,
        volume7d: Math.round(v7),
        volume30d: Math.round(v30),
        sets7d: s7,
        sets30d: s30,
        status: status,
        /* --- v2 additive --- */
        load7d: Math.round(l7 * 10) / 10,
        load30d: Math.round(l30 * 10) / 10,
        capacity: Math.round(capacity * 10) / 10,
        tauDays: Math.round(tau * 100) / 100,
        fatigueNow: Math.round(fatigue * 100) / 100
      };
    });

    return {
      groups: out,
      meta: {
        bodyWeightKg: bodyWeight,
        tauDays: Math.round(tau * 100) / 100,
        capacitySource: capacitySource,
        groupsComputed: GROUPS.length,
        /* c125 additive */
        energy: acc.energy,
        tauMod: acc.tauMod
      }
    };
  }

  /**
   * c124: per-muscle daily series for the «Тренд» sparklines.
   * @param {{workouts:Array, resolveEx:Function, bodyWeightKg:(number|null), now:number, days:number}} cfg
   * @returns {{groups:{g:{daily:Array<{t:number,load:number,sets:number,recovery:number}>, capacity:number}},
   *            meta:{bodyWeightKg:number, tauDays:number, days:number}}}
   */
  function trend(cfg) {
    var days = isNum(cfg && cfg.days) ? clamp(Math.round(cfg.days), 7, 60) : 14;
    var acc = accumulate(cfg);
    var out = {};
    GROUPS.forEach(function (g) {
      var lm = acc.load[g], sm = acc.sets[g];
      var buckets = Object.keys(sm).map(Number).filter(function (b) { return (sm[b] || 0) > 0; });
      /* personal capacity — the SAME p90-of-90d the map summary uses */
      var dailyLoads90 = [];
      buckets.forEach(function (b) {
        var d = acc.dayNow - b;
        if (d >= 0 && d < CAPACITY_WINDOW_DAYS && (lm[b] || 0) > 0) dailyLoads90.push(lm[b]);
      });
      dailyLoads90.sort(function (a, b2) { return a - b2; });
      var capacity = DEFAULT_CAPACITY;
      if (dailyLoads90.length >= CAPACITY_MIN_DAYS) capacity = percentile90(dailyLoads90);
      if (!isFinite(capacity) || capacity <= 0) capacity = DEFAULT_CAPACITY;
      var daily = [];
      for (var i = days - 1; i >= 0; i--) {
        var dNow = acc.dayNow - i;
        var fatigue = 0;
        for (var k = 0; k < buckets.length; k++) {
          var dd = dNow - buckets[k];
          if (dd < 0 || dd > FATIGUE_HORIZON_DAYS) continue;
          fatigue += clamp((lm[buckets[k]] || 0) / capacity, 0, DAY_RATIO_CAP) * Math.exp(-dd / acc.tau);
        }
        daily.push({
          t: dNow,
          load: Math.round((lm[dNow] || 0) * 10) / 10,
          sets: sm[dNow] || 0,
          recovery: clamp(Math.round(100 * (1 - fatigue)), 0, 100)
        });
      }
      out[g] = { daily: daily, capacity: Math.round(capacity * 10) / 10 };
    });
    return { groups: out, meta: { bodyWeightKg: acc.bodyWeight, tauDays: Math.round(acc.tau * 100) / 100, days: days,
                                  energy: acc.energy, tauMod: acc.tauMod } };
  }

  /**
   * c124: tiny inline SVG sparkline — load bars + recovery line (no libs).
   * The line is segment-colored with the map's own bands so the sparkline
   * reads in the same language as the heat-map: green ≥85 / amber ≥50 / red.
   * Stretched to the row width with preserveAspectRatio=none; strokes stay
   * crisp via vector-effect=non-scaling-stroke.
   * @param {Array<{load:number, recovery:number}>} daily — the trend() series
   * @param {{w?:number, h?:number}} [opts]
   * @returns {string} svg markup ('' when there is nothing to draw)
   */
  function sparkSVG(daily, opts) {
    var W = (opts && isNum(opts.w)) ? opts.w : 120;
    var H = (opts && isNum(opts.h)) ? opts.h : 32;
    var arr = Array.isArray(daily) ? daily : [];
    var n = arr.length;
    if (!n || !W || !H) return '';
    var maxLoad = 0;
    arr.forEach(function (p) { if (p && p.load > maxLoad) maxLoad = p.load; });
    var slot = W / n;
    var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" height="' + H + '" preserveAspectRatio="none" aria-hidden="true" focusable="false" style="display:block;direction:ltr">';
    /* baseline */
    s += '<line x1="0" y1="' + (H - 0.5) + '" x2="' + W + '" y2="' + (H - 0.5) + '" stroke="rgba(128,128,128,0.25)" stroke-width="1" vector-effect="non-scaling-stroke"/>';
    /* load bars (normalized to the window max) */
    if (maxLoad > 0) {
      var barW = Math.max(1.2, slot * 0.6);
      for (var i = 0; i < n; i++) {
        var p = arr[i];
        if (!p || !(p.load > 0)) continue;
        var bh = (p.load / maxLoad) * (H - 6);
        var x = i * slot + (slot - barW) / 2;
        s += '<rect x="' + x.toFixed(2) + '" y="' + (H - bh).toFixed(2) + '" width="' + barW.toFixed(2) + '" height="' + bh.toFixed(2) + '" fill="rgba(59,130,246,0.40)"/>';
      }
    }
    /* 50% guide — the fresh/recovering boundary */
    var gy = (H - 2 - 0.5 * (H - 6)).toFixed(2);
    s += '<line x1="0" y1="' + gy + '" x2="' + W + '" y2="' + gy + '" stroke="rgba(128,128,128,0.25)" stroke-width="1" stroke-dasharray="3 3" vector-effect="non-scaling-stroke"/>';
    /* recovery line, colored per segment by the map bands */
    var prev = null;
    for (var j = 0; j < n; j++) {
      var pj = arr[j];
      if (!pj || !isFinite(pj.recovery)) { prev = null; continue; }
      var px = j * slot + slot / 2;
      var py = H - 2 - (pj.recovery / 100) * (H - 6);
      if (prev) {
        var col = pj.recovery >= 85 ? 'rgba(34,197,94,0.95)' : pj.recovery >= 50 ? 'rgba(245,158,11,0.95)' : 'rgba(239,68,68,0.95)';
        s += '<line x1="' + prev.x.toFixed(2) + '" y1="' + prev.y.toFixed(2) + '" x2="' + px.toFixed(2) + '" y2="' + py.toFixed(2) + '" stroke="' + col + '" stroke-width="1.6" stroke-linecap="round" vector-effect="non-scaling-stroke"/>';
      }
      prev = { x: px, y: py };
    }
    s += '</svg>';
    return s;
  }

  var api = { compute: compute, GROUPS: GROUPS, KG_PER_LB: KG_PER_LB };

  /* ============================================================================
     c123 — ADVICE LAYER («что больше / что меньше включать»)
     ----------------------------------------------------------------------------
     Pure function over a compute() result — BOTH apps render the same
     recommendations from this single source (no divergence possible).

     Advice per muscle group (priority order):
       dormant  ⚪ — not trained for 14+ days (or ever) → «включи в план»
       rest     🔴 — recovery < 30% → «отдых»
       reduce   🟠 — this week's load ≥ 1.3 × the month's weekly average
                       (user spec: 7д ≥ 1.3× месячной средней) OR recovery < 45%
                       → «снизить объём»
       train    🟢 — recovery ≥ 75% → «можно грузить»
       moderate 🔵 — everything in between

     Weekly hard-set target band: 10–20 sets/week (evidence-based volume
     landmarks). setsBand per group: 'low' (<10) | 'ok' (10–20) | 'high' (>20),
     null when the muscle has no 30-day activity (the dormant chip covers it).

     readiness — one number for «как человек в целом»: average recovery of the
     8 MAIN muscle groups trained within the last 7 days (fallback: all trained
     main groups; null when nothing was trained at all).
     ============================================================================ */
  var DORMANT_DAYS = 14;
  var REST_RECOVERY = 30;
  var REDUCE_RECOVERY = 45;
  var TRAIN_RECOVERY = 75;
  var OVERLOAD_RATIO = 1.3;
  var OVERLOAD_MIN_MONTH = 30;   // load units — a 30d sum below this is too small to judge
  var SETS_LOW = 10;
  var SETS_HIGH = 20;
  var READINESS_WINDOW_DAYS = 7;
  var MAIN_GROUPS = ['chest', 'back', 'shoulders', 'elbow_flexors', 'triceps', 'forearms', 'abdominals', 'legs'];

  function adviceFor(r) {
    var days = r.lastTrainedDaysAgo;
    if (days === null || days === undefined || !isFinite(days) || days >= DORMANT_DAYS) return 'dormant';
    if (r.recovery < REST_RECOVERY) return 'rest';
    var weeklyAvg30 = ((r.load30d || 0) * 7) / 30;
    if ((r.load30d || 0) >= OVERLOAD_MIN_MONTH && (r.load7d || 0) >= OVERLOAD_RATIO * weeklyAvg30) return 'reduce';
    if (r.recovery < REDUCE_RECOVERY) return 'reduce';
    if (r.recovery >= TRAIN_RECOVERY) return 'train';
    return 'moderate';
  }

  function setsBandFor(r, advice) {
    if (advice === 'dormant' || !(r.sets30d > 0)) return null;
    var s7 = r.sets7d || 0;
    if (s7 < SETS_LOW) return 'low';
    if (s7 > SETS_HIGH) return 'high';
    return 'ok';
  }

  /** @param {{groups:Object}} result — the output of compute() (or {groups:_data}) */
  function advise(result) {
    var groups = (result && result.groups) || {};
    var per = {};
    var counts = { train: 0, moderate: 0, reduce: 0, rest: 0, dormant: 0 };
    var ready7 = [], readyAll = [];
    Object.keys(groups).forEach(function (g) {
      var r = groups[g];
      var a = adviceFor(r);
      per[g] = { advice: a, setsBand: setsBandFor(r, a) };
      counts[a]++;
      if (MAIN_GROUPS.indexOf(g) !== -1 && r.lastTrainedDaysAgo != null && isFinite(r.lastTrainedDaysAgo)) {
        readyAll.push(r.recovery);
        if (r.lastTrainedDaysAgo <= READINESS_WINDOW_DAYS) ready7.push(r.recovery);
      }
    });
    var vals = ready7.length ? ready7 : readyAll;
    var readiness = vals.length
      ? Math.round(vals.reduce(function (s, v) { return s + v; }, 0) / vals.length)
      : null;
    return { per: per, counts: counts, readiness: readiness };
  }

  api.advise = advise;
  api.MAIN_GROUPS = MAIN_GROUPS;
  /* c124 exports */
  api.trend = trend;
  api.sparkSVG = sparkSVG;
  if (typeof window !== 'undefined') window.dkRecoveryEngine = api;
  else if (typeof globalThis !== 'undefined') globalThis.dkRecoveryEngine = api;
})();
