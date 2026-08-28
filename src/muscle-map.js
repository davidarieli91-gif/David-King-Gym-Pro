// Muscle map SVGs + PG vector illustrations (extracted from monolith)
// Загружается как ES-модуль (deferred): экспортирует window.BM_SVG_*, window.GROUP_COLORS,
// window.PGIllustration, window.exerciseVectorIllustration, window.getExerciseMuscleGroups.
// Используется ТОЛЬКО в рантайме (клики/рендеры), поэтому deferred-тайминг безопасен.
const esc = (v) => String(v == null ? '' : v)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

    // Muscle group colors (matching exercise tree)
    const GROUP_COLORS = {
      legs: '#f97316', chest: '#ef4444', back: '#3b82f6', shoulders: '#f59e0b',
      elbow_flexors: '#8b5cf6', triceps: '#06b6d4', forearms: '#10b981',
      abdominals: '#a855f7', stretching: '#d946ef', warmup: '#fbbf24',
      calisthenics: '#64748b', other: '#64748b'
    };
    const AUX_HIGHLIGHT_COLOR = '#22d3ee'; // cyan for auxiliary muscles
    const AUX_OPACITY = 0.42;

    // 74 raw synergist aliases → 11 canonical groups (case-insensitive)
    const SYNERGIST_CANONICAL = {
      // chest
      'chest': 'chest', 'upper chest': 'chest', 'upper_chest': 'chest', 'upper_chest ': 'chest',
      // back
      'back': 'back', 'lats': 'back', 'lat': 'back', 'middle back': 'back', 'middle_back': 'back',
      'lower back': 'back', 'lower_back': 'back', 'upper back': 'back', 'upper_back': 'back',
      'trapezius': 'back', 'traps': 'back', 'rhomboids': 'back', 'teres minor': 'back',
      'infraspinatus': 'back', 'levator scapulae': 'back', 'levator_scapulae': 'back',
      'spinal erectors': 'back', 'spinal_erectors': 'back', 'spine': 'back',
      'rotator cuff': 'back', 'rotator_cuff': 'back', 'rear deltoids': 'back', 'rear_deltoids': 'back',
      // shoulders
      'shoulders': 'shoulders', 'deltoids': 'shoulders', 'front deltoids': 'shoulders',
      'front_deltoids': 'shoulders', 'front delts': 'shoulders', 'front_delts': 'shoulders',
      'front shoulders': 'shoulders', 'rear deltoids': 'shoulders', 'rear_delts': 'shoulders',
      'rear shoulders': 'shoulders', 'rear_delt': 'shoulders', 'rear_delts': 'shoulders',
      // elbow flexors (biceps)
      'biceps': 'elbow_flexors', 'brachialis': 'elbow_flexors', 'brachioradialis': 'elbow_flexors',
      'elbow flexors': 'elbow_flexors', 'elbow_flexors': 'elbow_flexors', 'arms': 'elbow_flexors',
      // triceps
      'triceps': 'triceps', 'anconeus': 'triceps',
      // forearms / grip
      'forearms': 'forearms', 'forearm': 'forearms', 'grip': 'forearms', 'wrists': 'forearms',
      // abdominals / core
      'abdominals': 'abdominals', 'abdominals ': 'abdominals', 'abs': 'abdominals',
      'core': 'abdominals', 'obliques': 'abdominals', 'rectus abdominis': 'abdominals',
      'rectus_abdominis': 'abdominals', 'upper_abs': 'abdominals', 'upper abs': 'abdominals',
      // legs
      'legs': 'legs', 'quadriceps': 'legs', 'hamstrings': 'legs', 'glutes': 'legs',
      'calves': 'legs', 'calf': 'legs', 'adductors': 'legs', 'abductors': 'legs',
      'gastrocnemius': 'legs', 'soleus': 'legs', 'hip flexors': 'legs', 'hip_flexors': 'legs',
      'hip abductors': 'legs', 'hips': 'legs', 'shins': 'legs', 'tibialis anterior': 'legs',
      'quadriceps ': 'legs',
      // other
      'stretching': 'stretching', 'warmup': 'warmup', 'calisthenics': 'calisthenics',
      'cardiovascular': 'other', 'stabilizers': 'other', 'ankles': 'other', 'elbows': 'other'
    };
    function canonicalGroup(name) {
      if (!name) return null;
      const key = String(name).trim().toLowerCase();
      if (SYNERGIST_CANONICAL[key]) return SYNERGIST_CANONICAL[key];
      if (GROUP_COLORS[key]) return key;
      const direct = key.replace(/\s+/g, '_');
      if (GROUP_COLORS[direct]) return direct;
      return null;
    }
    function getExerciseMuscleGroups(ex) {
      const primary = canonicalGroup(ex.g || ex.group_canonical || ex.group || ex.group_en || ex.gE) || 'other';
      const rawSyn = ex.synergists || ex.synergist_muscles || ex.synergist || [];
      const auxSet = new Set();
      (Array.isArray(rawSyn) ? rawSyn : []).forEach(s => {
        const c = canonicalGroup(s);
        if (c && c !== primary) auxSet.add(c);
      });
      return { primary, aux: Array.from(auxSet) };
    }

    /* =====================================================================
       PG VECTOR ILLUSTRATIONS — pose-based technique drawings.
       For every exercise without a photo we render a schematic athlete in
       the CORRECT working vector (lying bench / seated machine / standing
       cable / hanging bar ...) with the equipment drawn in-hands and the
       working muscles glowing: PRIMARY = group color, AUXILIARY = cyan.
       ===================================================================== */
    const PGI = (function () {
      const SKIN = '#8b9bb0', SKIN_FAR = '#66788e', OUTLINE = 'rgba(10,12,18,.55)';
      const FLOOR = 'rgba(255,255,255,.07)';
      const STEEL = '#aab4c4', STEEL_DARK = '#5d6a7d';

      /* ---------- geometry helpers ---------- */
      const V = (x, y) => ({ x, y });
      const add = (a, b) => V(a.x + b.x, a.y + b.y);
      const mul = (a, k) => V(a.x * k, a.y * k);
      // direction: angle deg from straight-DOWN; side=1 right/+x, -1 left
      const dir = (deg, side) => { const r = deg * Math.PI / 180; return V(Math.sin(r) * side, Math.cos(r)); };
      const lerp = (a, b, t) => V(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t);

      function seg(a, b, w, color, extra) {
        return `<line x1="${a.x.toFixed(1)}" y1="${a.y.toFixed(1)}" x2="${b.x.toFixed(1)}" y2="${b.y.toFixed(1)}" stroke="${color}" stroke-width="${w}" stroke-linecap="round"${extra || ''}/>`;
      }
      function circle(c, r, fill, extra) { return `<circle cx="${c.x.toFixed(1)}" cy="${c.y.toFixed(1)}" r="${r}" fill="${fill}"${extra || ''}/>`; }

      /* ---------- glow layers ---------- */
      let GLOW_DEFS = `<defs><filter id="pgGlow" x="-60%" y="-60%" width="220%" height="220%">
        <feGaussianBlur stdDeviation="2.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>`;
      function glowSeg(a, b, color, primary) {
        return seg(a, b, primary ? 9 : 6.5, color,
          ` opacity="${primary ? .92 : .5}" filter="url(#pgGlow)"${primary ? '' : ' stroke-dasharray="5 3"'}`);
      }
      function glowShape(svg, color, primary) {
        return svg.replace('@GLOW@', `fill="${color}" opacity="${primary ? .9 : .48}" filter="url(#pgGlow)"${primary ? '' : ' stroke-dasharray="4 3"'} stroke="${color}" stroke-width="1"`);
      }
      const ell = (c, rx, ry, rot) => `<ellipse cx="${c.x.toFixed(1)}" cy="${c.y.toFixed(1)}" rx="${rx}" ry="${ry}" transform="rotate(${rot || 0} ${c.x.toFixed(1)} ${c.y.toFixed(1)})" @GLOW@/>`;
      const rrect = (c, w, h) => `<rect x="${(c.x - w / 2).toFixed(1)}" y="${(c.y - h / 2).toFixed(1)}" width="${w}" height="${h}" rx="4" @GLOW@/>`;

      /* ---------- equipment ---------- */
      function barbell(hL, hR, plateR) {
        const axis = V(hR.x - hL.x, hR.y - hL.y); const len = Math.hypot(axis.x, axis.y);
        const u = V(axis.x / len, axis.y / len); const p = V(-u.y, u.x); const R = plateR || 11;
        const e1 = add(hL, mul(u, -14)), e2 = add(hR, mul(u, 14));
        let s = seg(e1, e2, 3.4, STEEL);
        [e1, e2].forEach(e => {
          s += seg(add(e, mul(p, -R)), add(e, mul(p, R)), R * 1.7, STEEL_DARK, ` opacity=".95"`);
          s += circle(add(e, mul(p, -R)), 1.6, STEEL) + circle(add(e, mul(p, R)), 1.6, STEEL);
        });
        return s;
      }
      function dumbbell(hand, foreDir) {
        const p = V(-foreDir.y, foreDir.x);
        const a = add(hand, mul(p, -9)), b = add(hand, mul(p, 9));
        return seg(a, b, 3, STEEL)
          + seg(add(a, mul(p, -2)), add(a, mul(p, 2)), 7, STEEL_DARK)
          + seg(add(b, mul(p, -2)), add(b, mul(p, 2)), 7, STEEL_DARK);
      }
      function kettlebell(hand) {
        return circle(V(hand.x, hand.y + 8), 7.5, STEEL_DARK, ` stroke="${STEEL}" stroke-width="2"`)
          + `<path d="M ${hand.x - 4} ${hand.y + 2} q 4 -7 8 0" fill="none" stroke="${STEEL}" stroke-width="2.4"/>`;
      }
      function cable(anchor, hand) {
        return seg(anchor, hand, 1.8, STEEL, ` opacity=".9"`)
          + circle(anchor, 3.4, STEEL_DARK, ` stroke="${STEEL}" stroke-width="1.2"`)
          + seg(add(hand, V(-4, 0)), add(hand, V(4, 0)), 3, STEEL);
      }
      function bandBetween(a, b) {
        const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2 + 10;
        return `<path d="M ${a.x} ${a.y} Q ${mx} ${my} ${b.x} ${b.y}" fill="none" stroke="#f59e0b" stroke-width="3" opacity=".85" stroke-linecap="round"/>`;
      }
      function bench(cx, cy, w, ang) {
        const r = ang || 0;
        return `<g transform="rotate(${r} ${cx} ${cy})">
          <rect x="${cx - w / 2}" y="${cy - 4}" width="${w}" height="9" rx="4" fill="${STEEL_DARK}" stroke="${STEEL}" stroke-width="1"/>
          <rect x="${cx - w / 2 + 6}" y="${cy + 5}" width="4" height="16" fill="${STEEL_DARK}"/>
          <rect x="${cx + w / 2 - 10}" y="${cy + 5}" width="4" height="16" fill="${STEEL_DARK}"/></g>`;
      }
      function seat(cx, cy) {
        return `<rect x="${cx - 16}" y="${cy - 4}" width="32" height="8" rx="3" fill="${STEEL_DARK}" stroke="${STEEL}" stroke-width="1"/>
          <rect x="${cx - 2}" y="${cy + 4}" width="4" height="20" fill="${STEEL_DARK}"/>
          <rect x="${cx - 19}" y="${cy - 30}" width="6" height="28" rx="3" fill="${STEEL_DARK}" stroke="${STEEL}" stroke-width="1"/>`;
      }
      const floorLine = (y, x1, x2) => `<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="${FLOOR}" stroke-width="3" stroke-linecap="round"/>`;
      const pullupBar = (y) => `<line x1="30" y1="${y}" x2="150" y2="${y}" stroke="${STEEL}" stroke-width="4" stroke-linecap="round"/><rect x="42" y="${y - 8}" width="5" height="8" fill="${STEEL_DARK}"/><rect x="133" y="${y - 8}" width="5" height="8" fill="${STEEL_DARK}"/>`;
      const dipBars = (y, xl, xr) => seg(V(xl, y - 14), V(xl, y), 4, STEEL) + seg(V(xl - 8, y), V(xl + 8, y), 4, STEEL)
        + seg(V(xr, y - 14), V(xr, y), 4, STEEL) + seg(V(xr - 8, y), V(xr + 8, y), 4, STEEL);

      /* ---------- body parts ---------- */
      function head(c, far) { return circle(c, 9.5, far ? SKIN_FAR : SKIN, ` stroke="${OUTLINE}" stroke-width="1"`); }
      function torsoPath(top, bot, hwTop, hwBot) {
        return `<path d="M ${top.x - hwTop} ${top.y} Q ${top.x} ${top.y - 7} ${top.x + hwTop} ${top.y}
          L ${bot.x + hwBot} ${bot.y} Q ${bot.x} ${bot.y + 6} ${bot.x - hwBot} ${bot.y} Z"
          fill="${SKIN}" stroke="${OUTLINE}" stroke-width="1"/>`;
      }

      /* Build an athlete. cfg joints are absolute points. */
      function athlete(o) {
        let s = '';
        const limbW = 7.5;
        // far limbs first (side view depth)
        if (o.farArm) s += seg(o.farArm.s, o.farArm.e, limbW, SKIN_FAR) + seg(o.farArm.e, o.farArm.h, limbW - 1, SKIN_FAR);
        if (o.farLeg) s += seg(o.farLeg.h, o.farLeg.k, limbW, SKIN_FAR) + seg(o.farLeg.k, o.farLeg.a, limbW - 1, SKIN_FAR);
        // legs (near)
        if (o.legN) s += seg(o.legN.h, o.legN.k, limbW, SKIN) + seg(o.legN.k, o.legN.a, limbW - 1, SKIN);
        // torso
        s += o.torso;
        // near arm over torso
        if (o.armN) s += seg(o.armN.s, o.armN.e, limbW, SKIN) + seg(o.armN.e, o.armN.h, limbW - 1, SKIN);
        // neck+head last
        if (o.neck) s += seg(o.neck.a, o.neck.b, 6, SKIN);
        if (o.headC) s += head(o.headC);
        return s;
      }

      /* glow placement derived from joints */
      function glowsFor(g, J) {
        const out = [];
        const P = g.primary, A = new Set(g.aux);
        const col = (grp) => grp === P ? (GROUP_COLORS[grp] || '#ef4444') : AUX_HIGHLIGHT_COLOR;
        const put = (grp, placeholderSvg) => { if (grp === P || A.has(grp)) out.push(glowShape(placeholderSvg, col(grp), grp === P)); };
        const capOn = (a, b, grp) => { if (grp === P || A.has(grp)) out.push(glowSeg(a, b, col(grp), grp === P)); };
        // torso-attached
        if (J.chestC && (P === 'chest' || A.has('chest'))) {
          const c = GROUP_COLORS.chest;
          put('chest', ell(V(J.chestC.x - 6, J.chestC.y), 6.5, 8, 8));
          put('chest', ell(V(J.chestC.x + 6, J.chestC.y), 6.5, 8, 8));
        }
        if (J.absC) put('abdominals', rrect(J.absC, 15, 22));
        if (J.shoulderL) {
          put('shoulders', ell(J.shoulderL, 5.5, 5.5, 0));
          if (J.shoulderR) put('shoulders', ell(J.shoulderR, 5.5, 5.5, 0));
        }
        // limb-attached
        if (J.armN) { capOn(J.armN.s, J.armN.e, 'elbow_flexors'); capOn(J.armN.s, J.armN.e, 'triceps'); capOn(J.armN.e, J.armN.h, 'forearms'); }
        if (J.farArm) { capOn(J.farArm.s, J.farArm.e, 'elbow_flexors'); capOn(J.farArm.e, J.farArm.h, 'forearms'); }
        if (J.legN) {
          capOn(J.legN.h, J.legN.k, 'legs');
          capOn(J.legN.k, J.legN.a, 'calves');
        }
        if (J.farLeg) { capOn(J.farLeg.h, J.farLeg.k, 'legs'); capOn(J.farLeg.k, J.farLeg.a, 'calves'); }
        if (J.gluteC) put('legs', ell(J.gluteC, 8, 6, 0));
        if (J.trapC) put('back', rrect(J.trapC, 26, 7));
        if (J.latC) { put('back', ell(V(J.latC.x - 11, J.latC.y), 4.5, 10, 12)); put('back', ell(V(J.latC.x + 11, J.latC.y), 4.5, 10, -12)); }
        return out.join('');
      }

      /* ---------- POSES ---------- */
      // Each pose fn(ex, g) -> {svg, facing}
      function standBase() {
        const S = V(90, 56), P = V(90, 100);
        const arm = (side) => { const s = V(S.x + 15 * side, S.y + 2); const e = add(s, mul(dir(14, side), 26)); const h = add(e, mul(dir(8, side), 24)); return { s, e, h }; };
        const leg = (side) => { const h = V(P.x + 7 * side, P.y + 2); const k = add(h, mul(dir(3, side), 36)); const a = add(k, mul(dir(1, side), 32)); return { h, k, a }; };
        return { S, P, armL: arm(-1), armR: arm(1), legL: leg(-1), legR: leg(1) };
      }

      const POSES = {
        stand(ex, g) {
          const b = standBase();
          return { facing: 'front', J: { shoulderL: b.armL.s, shoulderR: b.armR.s, chestC: V(90, 68), absC: V(90, 86), trapC: V(90, 55), latC: V(90, 64), gluteC: V(90, 100), armN: b.armR, farArm: b.armL, legN: b.legR, farLeg: b.legL }, art: '' };
        },
        overheadPress(ex, g) {
          const b = standBase();
          const arm = (side) => { const s = V(b.S.x + 15 * side, b.S.y + 2); const e = add(s, mul(dir(150, side), 26)); const h = add(e, mul(dir(168, side), 24)); return { s, e, h }; };
          const aL = arm(-1), aR = arm(1);
          return { facing: 'front', J: { shoulderL: aL.s, shoulderR: aR.s, chestC: V(90, 68), absC: V(90, 86), trapC: V(90, 55), latC: V(90, 64), gluteC: V(90, 100), armN: aR, farArm: aL, legN: b.legR, farLeg: b.legL }, art: barbell(aL.h, aR.h, 10) };
        },
        lateralRaise(ex, g) {
          const b = standBase();
          const arm = (side) => { const s = V(b.S.x + 15 * side, b.S.y + 2); const e = add(s, mul(dir(82, side), 26)); const h = add(e, mul(dir(84, side), 22)); return { s, e, h }; };
          const aL = arm(-1), aR = arm(1);
          return { facing: 'front', J: { shoulderL: aL.s, shoulderR: aR.s, chestC: V(90, 68), absC: V(90, 86), trapC: V(90, 55), latC: V(90, 64), gluteC: V(90, 100), armN: aR, farArm: aL, legN: b.legR, farLeg: b.legL }, art: dumbbell(aL.h, V(-1, .1)) + dumbbell(aR.h, V(1, .1)) };
        },
        frontRaise(ex, g) {
          const b = standBase();
          const arm = (side) => { const s = V(b.S.x + 13 * side, b.S.y + 2); const e = add(s, mul(dir(70, side), 26)); const h = add(e, mul(dir(72, side), 22)); return { s, e, h }; };
          const aL = arm(-1), aR = arm(1);
          return { facing: 'front', J: { shoulderL: aL.s, shoulderR: aR.s, chestC: V(90, 68), absC: V(90, 86), trapC: V(90, 55), latC: V(90, 64), gluteC: V(90, 100), armN: aR, farArm: aL, legN: b.legR, farLeg: b.legL }, art: barbell(aL.h, aR.h, 9) };
        },
        uprightRow(ex, g) {
          const b = standBase();
          const arm = (side) => { const s = V(b.S.x + 14 * side, b.S.y + 2); const e = add(s, mul(dir(40, side), 26)); const h = add(e, mul(dir(30, side), 22)); return { s, e, h }; };
          const aL = arm(-1), aR = arm(1);
          return { facing: 'front', J: { shoulderL: aL.s, shoulderR: aR.s, chestC: V(90, 68), absC: V(90, 86), trapC: V(90, 55), latC: V(90, 64), gluteC: V(90, 100), armN: aR, farArm: aL, legN: b.legR, farLeg: b.legL }, art: barbell(aL.h, aR.h, 9) };
        },
        shrug(ex, g) {
          const b = standBase();
          return { facing: 'front', J: { shoulderL: b.armL.s, shoulderR: b.armR.s, chestC: V(90, 68), absC: V(90, 86), trapC: V(90, 53), latC: V(90, 64), gluteC: V(90, 100), armN: b.armR, farArm: b.armL, legN: b.legR, farLeg: b.legL }, art: barbell(b.armL.h, b.armR.h, 11) };
        },
        curl(ex, g) {
          const b = standBase();
          const arm = (side) => { const s = V(b.S.x + 15 * side, b.S.y + 2); const e = add(s, mul(dir(18, side), 26)); const h = add(e, mul(dir(125, side), 22)); return { s, e, h }; };
          const aL = arm(-1), aR = arm(1);
          const eq = /ez/.test(ex.e || '') ? barbell(aL.h, aR.h, 8) : (/dumbbell|гантел/.test(ex.e || '') ? dumbbell(aL.h, V(0, -1)) + dumbbell(aR.h, V(0, -1)) : barbell(aL.h, aR.h, 9));
          return { facing: 'front', J: { shoulderL: aL.s, shoulderR: aR.s, chestC: V(90, 68), absC: V(90, 86), trapC: V(90, 55), latC: V(90, 64), gluteC: V(90, 100), armN: aR, farArm: aL, legN: b.legR, farLeg: b.legL }, art: eq };
        },
        pushdown(ex, g) {
          const b = standBase();
          const arm = (side) => { const s = V(b.S.x + 13 * side, b.S.y + 2); const e = add(s, mul(dir(30, side), 26)); const h = add(e, mul(dir(-25, side), 22)); return { s, e, h }; };
          const aL = arm(-1), aR = arm(1);
          const anchorL = V(60, 8), anchorR = V(120, 8);
          return { facing: 'front', J: { shoulderL: aL.s, shoulderR: aR.s, chestC: V(90, 68), absC: V(90, 86), trapC: V(90, 55), latC: V(90, 64), gluteC: V(90, 100), armN: aR, farArm: aL, legN: b.legR, farLeg: b.legL }, art: cable(anchorL, aL.h) + cable(anchorR, aR.h) };
        },
        cableCross(ex, g) {
          const b = standBase();
          const arm = (side) => { const s = V(b.S.x + 14 * side, b.S.y + 2); const e = add(s, mul(dir(55, side), 26)); const h = V(90 + 4 * side, 78); return { s, e, h }; };
          const aL = arm(-1), aR = arm(1);
          return { facing: 'front', J: { shoulderL: aL.s, shoulderR: aR.s, chestC: V(90, 68), absC: V(90, 86), trapC: V(90, 55), latC: V(90, 64), gluteC: V(90, 100), armN: aR, farArm: aL, legN: b.legR, farLeg: b.legL }, art: cable(V(28, 14), aL.h) + cable(V(152, 14), aR.h) };
        },
        squat(ex, g) {
          const S = V(90, 74), P = V(90, 112);
          const arm = (side) => { const s = V(S.x + 15 * side, S.y + 2); const e = add(s, mul(dir(95, side), 20)); const h = add(e, mul(dir(120, side), 18)); return { s, e, h }; };
          const leg = (side) => { const h = V(P.x + 8 * side, P.y + 2); const k = add(h, mul(dir(38, side), 30)); const a = add(k, mul(dir(-15, side), 30)); return { h, k, a }; };
          const aL = arm(-1), aR = arm(1), lL = leg(-1), lR = leg(1);
          const rack = seg(V(52, 40), V(52, 140), 4, STEEL_DARK) + seg(V(128, 40), V(128, 140), 4, STEEL_DARK);
          return { facing: 'front', J: { shoulderL: aL.s, shoulderR: aR.s, chestC: V(90, 86), absC: V(90, 100), trapC: V(90, 73), latC: V(90, 80), gluteC: V(90, 112), armN: aR, farArm: aL, legN: lR, farLeg: lL, torso: torsoPath(V(90, 74), V(90, 112), 15, 12) }, art: rack + barbell(aL.h, aR.h, 10) + floorLine(142, 30, 150) };
        },
        deadlift(ex, g) {
          // side view, torso leaned ~60° forward (to +x)
          const hip = V(74, 108), sh = V(112, 132);
          const armS = V(sh.x, sh.y + 2), el = V(116, 118), hand = V(114, 142);
          const legH = V(hip.x, hip.y + 2), knee = V(92, 134), ank = V(90, 152);
          const farKnee = V(86, 136), farAnk = V(84, 153);
          const torso = torsoPath(sh, hip, 9, 8);
          return { facing: 'side', J: { shoulderL: armS, chestC: lerp(sh, hip, .3), absC: lerp(sh, hip, .62), trapC: lerp(sh, hip, .12), latC: lerp(sh, hip, .35), gluteC: V(hip.x - 4, hip.y), armN: { s: armS, e: el, h: hand }, legN: { h: legH, k: knee, a: ank }, farLeg: { h: legH, k: farKnee, a: farAnk }, torso }, art: barbell(V(96, 143), V(134, 143), 11) + floorLine(154, 30, 155) };
        },
        bentRow(ex, g) {
          const hip = V(70, 106), sh = V(110, 126);
          const armS = V(sh.x, sh.y + 2), el = V(122, 112), hand = V(124, 124);
          const legH = V(hip.x, hip.y + 2), knee = V(88, 132), ank = V(86, 152);
          const torso = torsoPath(sh, hip, 9, 8);
          return { facing: 'side', J: { shoulderL: armS, chestC: lerp(sh, hip, .3), absC: lerp(sh, hip, .62), trapC: lerp(sh, hip, .12), latC: lerp(sh, hip, .35), gluteC: V(hip.x - 4, hip.y), armN: { s: armS, e: el, h: hand }, legN: { h: legH, k: knee, a: ank }, torso }, art: barbell(V(112, 125), V(140, 125), 10) + floorLine(154, 30, 155) };
        },
        benchFlat(ex, g, tilt) {
          const ang = tilt || 0; // -18 incline (head up), +14 decline
          const cx = 90, cy = 96;
          const rot = (p) => { const r = ang * Math.PI / 180; const dx = p.x - cx, dy = p.y - cy; return V(cx + dx * Math.cos(r) - dy * Math.sin(r), cy + dx * Math.sin(r) + dy * Math.cos(r)); };
          // unrotated supine layout: head LEFT, feet RIGHT, bench under torso
          const headC = rot(V(46, 84)), neckA = rot(V(56, 88)), neckB = rot(V(64, 90));
          const shL = rot(V(66, 92)), shR = rot(V(66, 100)); // near/far shoulders (y offsets)
          const hip = rot(V(104, 96));
          const chestC = rot(V(76, 96)), absC = rot(V(94, 96)), trapC = rot(V(64, 96)), latC = rot(V(72, 96)), gluteC = rot(V(104, 96));
          const armN = (() => { const s = shL; const e = rot(V(78, 74)); const h = rot(V(84, 62)); return { s, e, h }; })();
          const farArm = (() => { const s = shR; const e = rot(V(80, 118)); const h = rot(V(86, 130)); return { s, e, h }; })();
          const legN = (() => { const h = hip; const k = rot(V(126, 96)); const a = rot(V(146, 96)); return { h, k, a }; })();
          const farLeg = (() => { const h = hip; const k = rot(V(126, 102)); const a = rot(V(146, 103)); return { h, k, a }; })();
          const torso = torsoPath(rot(V(66, 96)), rot(V(104, 96)), 8, 8);
          const benchSvg = bench(cx, cy + 6, 86, ang);
          const bar = barbell(rot(V(84, 58)), rot(V(88, 134)), 10);
          return { facing: 'side', J: { shoulderL: shL, shoulderR: shR, chestC, absC, trapC, latC, gluteC, armN, farArm, legN, farLeg, torso, headC, neck: { a: neckA, b: neckB } }, art: benchSvg + bar };
        },
        floorPress(ex, g) {
          const p = POSES.benchFlat(ex, g, 0);
          return Object.assign(p, { art: p.art.replace(/<g transform="rotate[^"]*">[\s\S]*?<\/g>/, '') + floorLine(104, 26, 156) });
        },
        pushup(ex, g) {
          const sh = V(52, 96), hip = V(104, 104);
          const armN = { s: sh, e: V(48, 122), h: V(46, 140) };
          const legN = { h: hip, k: V(132, 122), a: V(148, 140) };
          const torso = torsoPath(sh, hip, 9, 8);
          return { facing: 'side', J: { shoulderL: sh, chestC: lerp(sh, hip, .28), absC: lerp(sh, hip, .6), trapC: lerp(sh, hip, .1), latC: lerp(sh, hip, .34), gluteC: V(hip.x, hip.y - 4), armN, legN, torso, headC: V(40, 92), neck: { a: V(46, 94), b: V(50, 95) } }, art: floorLine(146, 24, 158) };
        },
        plank(ex, g) {
          const p = POSES.pushup(ex, g);
          const armN = { s: V(52, 96), e: V(58, 116), h: V(70, 118) }; // on forearm
          return Object.assign(p, { J: Object.assign({}, p.J, { armN }), art: p.art });
        },
        crunch(ex, g) {
          const sh = V(58, 92), hip = V(102, 98);
          const armN = { s: sh, e: V(66, 78), h: V(52, 80) }; // hands behind head
          const legN = { h: hip, k: V(126, 78), a: V(130, 104) };
          const torso = torsoPath(sh, hip, 9, 8);
          return { facing: 'side', J: { shoulderL: sh, chestC: lerp(sh, hip, .3), absC: lerp(sh, hip, .62), trapC: lerp(sh, hip, .12), latC: lerp(sh, hip, .36), gluteC: V(hip.x, hip.y - 3), armN, legN, torso, headC: V(48, 84), neck: { a: V(52, 88), b: V(56, 90) } }, art: floorLine(106, 26, 156) };
        },
        legCurl(ex, g) {
          const sh = V(48, 96), hip = V(96, 98);
          const armN = { s: sh, e: V(56, 112), h: V(62, 122) };
          const legN = { h: hip, k: V(126, 98), a: V(140, 78) }; // prone: heel curls UP toward glutes
          const torso = torsoPath(sh, hip, 9, 8);
          const pad = seg(V(118, 106), V(132, 102), 6, STEEL_DARK) + seg(V(125, 109), V(125, 130), 4, STEEL_DARK);
          return { facing: 'side', J: { shoulderL: sh, chestC: lerp(sh, hip, .3), absC: lerp(sh, hip, .62), trapC: lerp(sh, hip, .12), latC: lerp(sh, hip, .36), gluteC: V(hip.x, hip.y - 3), armN, legN, torso, headC: V(38, 94), neck: { a: V(43, 95), b: V(47, 96) } }, art: pad + floorLine(106, 24, 156) };
        },
        legExtension(ex, g) {
          const hip = V(78, 92), sh = V(74, 52);
          const armN = { s: sh, e: V(88, 66), h: V(96, 80) };
          const legN = { h: hip, k: V(112, 94), a: V(140, 88) }; // extended forward
          const torso = torsoPath(sh, hip, 9, 8);
          const seatSvg = seat(hip.x - 2, hip.y + 6);
          const pad = seg(V(116, 96), V(128, 92), 6, STEEL_DARK) + seg(V(122, 99), V(122, 124), 4, STEEL_DARK);
          return { facing: 'side', J: { shoulderL: sh, chestC: lerp(sh, hip, .3), absC: lerp(sh, hip, .62), trapC: lerp(sh, hip, .12), latC: lerp(sh, hip, .36), gluteC: V(hip.x - 4, hip.y), armN, legN, torso, headC: V(76, 34), neck: { a: V(75, 42), b: V(75, 48) } }, art: seatSvg + pad + floorLine(126, 30, 156) };
        },
        seatedRow(ex, g) {
          const hip = V(70, 96), sh = V(88, 58);
          const armN = { s: sh, e: V(112, 70), h: V(126, 80) };
          const legN = { h: hip, k: V(116, 108), a: V(142, 106) };
          const torso = torsoPath(sh, hip, 9, 8);
          const seatSvg = seat(hip.x - 4, hip.y + 8);
          const anchor = V(160, 60);
          return { facing: 'side', J: { shoulderL: sh, chestC: lerp(sh, hip, .3), absC: lerp(sh, hip, .62), trapC: lerp(sh, hip, .12), latC: lerp(sh, hip, .36), gluteC: V(hip.x - 4, hip.y), armN, legN, torso, headC: V(92, 40), neck: { a: V(89, 48), b: V(89, 54) } }, art: seatSvg + cable(anchor, armN.h) + floorLine(126, 30, 166) };
        },
        latPulldown(ex, g) {
          const b = standBase(); const P = V(90, 100);
          const seatY = 118;
          const arm = (side) => { const s = V(b.S.x + 15 * side, b.S.y); const e = add(s, mul(dir(135, side), 24)); const h = add(e, mul(dir(115, side), 20)); return { s, e, h }; };
          const leg = (side) => { const h = V(P.x + 7 * side, P.y + 4); const k = add(h, mul(dir(80, side), 30)); const a = add(k, mul(dir(-8, side), 28)); return { h, k, a }; };
          const aL = arm(-1), aR = arm(1), lL = leg(-1), lR = leg(1);
          const bar = barbell(V(74, 34), V(106, 34), 8);
          const cables = seg(V(74, 30), V(74, 10), 2, STEEL) + seg(V(106, 30), V(106, 10), 2, STEEL);
          return { facing: 'front', J: { shoulderL: aL.s, shoulderR: aR.s, chestC: V(90, 68), absC: V(90, 86), trapC: V(90, 55), latC: V(90, 64), gluteC: V(90, 104), armN: aR, farArm: aL, legN: lR, farLeg: lL }, art: cables + bar + seat(90, seatY) };
        },
        pullup(ex, g) {
          const b = standBase();
          const arm = (side) => { const s = V(b.S.x + 14 * side, b.S.y + 2); const e = add(s, mul(dir(160, side), 24)); const h = V(90 + 12 * side, 22); return { s, e, h }; };
          const leg = (side) => { const h = V(b.P.x + 7 * side, b.P.y + 2); const k = add(h, mul(dir(20, side), 32)); const a = add(k, mul(dir(-14, side), 28)); return { h, k, a }; };
          const aL = arm(-1), aR = arm(1), lL = leg(-1), lR = leg(1);
          return { facing: 'front', J: { shoulderL: aL.s, shoulderR: aR.s, chestC: V(90, 68), absC: V(90, 86), trapC: V(90, 55), latC: V(90, 64), gluteC: V(90, 100), armN: aR, farArm: aL, legN: lR, farLeg: lL }, art: pullupBar(20) };
        },
        hangingLegRaise(ex, g) {
          const p = POSES.pullup(ex, g);
          const leg = (side) => { const h = V(90 + 7 * side, 102); const k = V(90 + 10 * side, 74); const a = V(90 + 8 * side, 52); return { h, k, a }; };
          return Object.assign(p, { J: Object.assign({}, p.J, { legN: leg(1), farLeg: leg(-1), absC: V(90, 84) }) });
        },
        dip(ex, g) {
          const S = V(90, 66), P = V(90, 108);
          const arm = (side) => { const s = V(S.x + 14 * side, S.y); const e = add(s, mul(dir(30, side), 22)); const h = V(90 + 26 * side, 44); return { s, e, h }; };
          const leg = (side) => { const h = V(P.x + 7 * side, P.y + 2); const k = add(h, mul(dir(25, side), 30)); const a = add(k, mul(dir(-20, side), 26)); return { h, k, a }; };
          const aL = arm(-1), aR = arm(1), lL = leg(-1), lR = leg(1);
          return { facing: 'front', J: { shoulderL: aL.s, shoulderR: aR.s, chestC: V(90, 80), absC: V(90, 96), trapC: V(90, 65), latC: V(90, 72), gluteC: V(90, 108), armN: aR, farArm: aL, legN: lR, farLeg: lL, torso: torsoPath(V(90, 66), V(90, 108), 14, 11) }, art: dipBars(44, 58, 122) };
        },
        lunge(ex, g) {
          const S = V(90, 60), P = V(90, 102);
          const arm = (side) => { const s = V(S.x + 15 * side, S.y + 2); const e = add(s, mul(dir(10, side), 26)); const h = add(e, mul(dir(6, side), 24)); return { s, e, h }; };
          const legF = { h: V(P.x + 6, P.y + 2), k: V(104, 128), a: V(104, 152) };
          const legB = { h: V(P.x - 6, P.y + 2), k: V(72, 124), a: V(58, 144) };
          const aL = arm(-1), aR = arm(1);
          const eq = /dumbbell|гантел/.test(ex.e || '') ? dumbbell(aL.h, V(0, 1)) + dumbbell(aR.h, V(0, 1)) : barbell(aL.h, aR.h, 9);
          return { facing: 'front', J: { shoulderL: aL.s, shoulderR: aR.s, chestC: V(90, 72), absC: V(90, 88), trapC: V(90, 59), latC: V(90, 66), gluteC: V(90, 102), armN: aR, farArm: aL, legN: legF, farLeg: legB }, art: eq + floorLine(154, 30, 152) };
        },
        calfRaise(ex, g) {
          const b = standBase();
          const leg = (side) => { const h = V(b.P.x + 7 * side, b.P.y + 2); const k = add(h, mul(dir(2, side), 36)); const a = add(k, mul(dir(0, side), 26)); return { h, k, a }; };
          return { facing: 'front', J: { shoulderL: b.armL.s, shoulderR: b.armR.s, chestC: V(90, 68), absC: V(90, 86), trapC: V(90, 55), latC: V(90, 64), gluteC: V(90, 100), armN: b.armR, farArm: b.armL, legN: leg(1), farLeg: leg(-1) }, art: seg(V(74, 156), V(106, 156), 5, STEEL_DARK) };
        },
        seated(ex, g) {
          const S = V(88, 58), P = V(86, 98);
          const arm = (side) => { const s = V(S.x + 14 * side, S.y + 2); const e = add(s, mul(dir(20, side), 24)); const h = add(e, mul(dir(12, side), 22)); return { s, e, h }; };
          const leg = (side) => { const h = V(P.x + 6 * side, P.y + 4); const k = add(h, mul(dir(84, side), 30)); const a = add(k, mul(dir(-4, side), 28)); return { h, k, a }; };
          const aL = arm(-1), aR = arm(1), lL = leg(-1), lR = leg(1);
          return { facing: 'front', J: { shoulderL: aL.s, shoulderR: aR.s, chestC: V(88, 70), absC: V(87, 86), trapC: V(88, 57), latC: V(88, 64), gluteC: V(86, 98), armN: aR, farArm: aL, legN: lR, farLeg: lL }, art: seat(86, 102) + floorLine(132, 40, 150) };
        },
        stretch(ex, g) {
          const b = standBase();
          const arm = (side) => { const s = V(b.S.x + 15 * side, b.S.y + 2); const e = add(s, mul(dir(120, side), 26)); const h = add(e, mul(dir(140, side), 22)); return { s, e, h }; };
          const aL = arm(-1), aR = arm(1);
          return { facing: 'front', J: { shoulderL: aL.s, shoulderR: aR.s, chestC: V(90, 68), absC: V(90, 86), trapC: V(90, 55), latC: V(90, 64), gluteC: V(90, 100), armN: aR, farArm: aL, legN: b.legR, farLeg: b.legL }, art: '' };
        },
        /* === poses driven by pg-tech-gen specs === */
        legPress() { // side view: reclined in sled, feet on angled platform
          const sh = V(46, 74), hip = V(80, 106);
          const torso = torsoPath(sh, hip, 9, 8);
          const armN = { s: sh, e: V(58, 90), h: V(66, 100) };
          const legN = { h: hip, k: V(112, 98), a: V(128, 84) };
          const farLeg = { h: hip, k: V(116, 104), a: V(132, 92) };
          const art = seg(V(28, 56), V(94, 130), 9, STEEL_DARK)
            + `<g transform="rotate(-38 134 78)"><rect x="126" y="52" width="13" height="54" rx="4" fill="${STEEL_DARK}" stroke="${STEEL}" stroke-width="1"/></g>`
            + seg(V(118, 142), V(150, 114), 3, STEEL);
          return { facing: 'side', J: { shoulderL: sh, chestC: lerp(sh, hip, .3), absC: lerp(sh, hip, .6), trapC: lerp(sh, hip, .12), latC: lerp(sh, hip, .34), gluteC: V(hip.x - 3, hip.y + 2), armN, legN, farLeg, torso, headC: V(37, 66), neck: { a: V(41, 70), b: V(44, 72) } }, art };
        },
        hipThrust() { // side view: shoulders on bench, hips up, bar on hips
          const sh = V(58, 112), hip = V(100, 94);
          const torso = torsoPath(sh, hip, 9, 8);
          const armN = { s: sh, e: V(62, 124), h: V(64, 136) };
          const legN = { h: hip, k: V(130, 116), a: V(140, 140) };
          const art = bench(50, 122, 40)
            + barbell(V(92, 86), V(108, 88), 8)
            + floorLine(146, 26, 158);
          return { facing: 'side', J: { shoulderL: sh, chestC: lerp(sh, hip, .3), absC: lerp(sh, hip, .6), trapC: lerp(sh, hip, .12), latC: lerp(sh, hip, .34), gluteC: V(hip.x, hip.y - 4), armN, legN, torso, headC: V(48, 120), neck: { a: V(52, 117), b: V(55, 115) } }, art };
        },
        backExt() { // side view: roman chair, torso hinged down
          const hip = V(86, 102), top = V(52, 130);
          const torso = torsoPath(top, hip, 9, 8);
          const legN = { h: hip, k: V(116, 114), a: V(132, 126) };
          const farLeg = { h: hip, k: V(118, 119), a: V(133, 130) };
          const armN = { s: V(56, 122), e: V(48, 118), h: V(44, 126) }; // crossed on chest
          const art = seg(V(84, 106), V(84, 148), 9, STEEL_DARK)
            + `<ellipse cx="108" cy="118" rx="16" ry="5" fill="${STEEL_DARK}" transform="rotate(12 108 118)"/>`
            + seg(V(126, 128), V(142, 122), 6, STEEL);
          return { facing: 'side', J: { shoulderL: top, chestC: lerp(top, hip, .35), absC: lerp(top, hip, .65), trapC: lerp(top, hip, .14), latC: lerp(top, hip, .38), gluteC: V(hip.x, hip.y - 4), armN, legN, farLeg, torso, headC: V(42, 144), neck: { a: V(47, 137), b: V(50, 133) } }, art };
        },
        twist() { // front seated floor, rotation arc
          const P = V(90, 114);
          const legR = { h: V(97, 116), k: V(118, 100), a: V(112, 126) };
          const legL = { h: V(83, 116), k: V(62, 100), a: V(68, 126) };
          const armR = { s: V(105, 72), e: V(101, 82), h: V(94, 88) };
          const armL = { s: V(75, 72), e: V(79, 82), h: V(94, 88) };
          const art = `<path d="M 58 44 A 34 30 0 0 1 122 44" fill="none" stroke="${AUX_HIGHLIGHT_COLOR}" stroke-width="2.4" stroke-dasharray="6 4" opacity=".85"/>`
            + `<path d="M 122 44 l -7 -2 m 7 2 l -2 7" stroke="${AUX_HIGHLIGHT_COLOR}" stroke-width="2.4" fill="none" opacity=".85"/>`
            + floorLine(130, 40, 142);
          return { facing: 'front', J: { shoulderL: armL.s, shoulderR: armR.s, chestC: V(90, 76), absC: V(90, 92), trapC: V(90, 60), latC: V(90, 67), gluteC: P, armN: armR, farArm: armL, legN: legR, farLeg: legL, torso: torsoPath(V(90, 68), P, 14, 11), headC: V(90, 52), neck: { a: V(90, 60), b: V(90, 66) } }, art };
        },
        facePull(ex, g) {
          const b = standBase();
          const armR = { s: b.S.x + 15, y: 0 }; // placeholder replaced below
          const sr = V(b.S.x + 15, b.S.y + 2), sl = V(b.S.x - 15, b.S.y + 2);
          const aR = { s: sr, e: V(124, 76), h: V(112, 66) };
          const aL = { s: sl, e: V(56, 76), h: V(68, 66) };
          return { facing: 'front', J: { shoulderL: sl, shoulderR: sr, chestC: V(90, 68), absC: V(90, 86), trapC: V(90, 55), latC: V(90, 64), gluteC: V(90, 100), armN: aR, farArm: aL, legN: b.legR, farLeg: b.legL }, art: cable(V(28, 16), aL.h) + cable(V(152, 16), aR.h) };
        },
        kickback() { // quadruped side: one leg extends back-up
          const S = V(60, 116), H = V(90, 120);
          const torso = torsoPath(S, H, 9, 8);
          const armN = { s: S, e: V(61, 129), h: V(62, 141) };
          const legN = { h: H, k: V(124, 110), a: V(146, 100) };
          const farLeg = { h: H, k: V(96, 134), a: V(99, 142) };
          return { facing: 'side', J: { shoulderL: S, chestC: lerp(S, H, .3), absC: lerp(S, H, .62), trapC: lerp(S, H, .12), latC: lerp(S, H, .35), gluteC: V(93, 117), armN, legN, farLeg, torso, headC: V(50, 110), neck: { a: V(53, 113), b: V(56, 115) } }, art: floorLine(146, 24, 158) };
        },
        hipAbd() { // standing side leg lift with band
          const S = V(90, 56), P = V(90, 100);
          const armDn = (side) => { const s = V(S.x + 15 * side, S.y + 2); const e = add(s, mul(dir(10, side), 26)); const h = add(e, mul(dir(6, side), 24)); return { s, e, h }; };
          const aL = armDn(-1), aR = armDn(1);
          const standLeg = { h: V(P.x + 7, P.y + 2), k: add(V(P.x + 7, P.y + 2), mul(dir(2, 1), 34)), a: add(add(V(P.x + 7, P.y + 2), mul(dir(2, 1), 34)), mul(dir(0, 1), 30)) };
          const liftLeg = { h: V(P.x - 7, P.y + 2), k: V(64, 92), a: V(48, 86) };
          const ankleStand = standLeg.a, ankleLift = liftLeg.a;
          return { facing: 'front', J: { shoulderL: aL.s, shoulderR: aR.s, chestC: V(90, 68), absC: V(90, 86), trapC: V(90, 55), latC: V(90, 64), gluteC: V(P.x - 6, P.y + 1), armN: aR, farArm: aL, legN: standLeg, farLeg: null }, art: bandBetween(ankleLift, ankleStand) };
        }
      };

      /* ---------- pose detection ---------- */
      function detectPose(ex) {
        // 1) кураторская спецификация из pg-tech-gen (приоритет)
        if (ex && ex.pg && ex.pg.pose && POSES[ex.pg.pose]) return ex.pg.pose;
        const n = ((ex.nE || ex.name_en || '') + ' ' + (ex.nR || ex.name_ru || '')).toLowerCase();
        const eq = String(ex.e || ex.equipment_type || '').toLowerCase();
        const sub = String(ex.sE || ex.subgroup_en || '').toLowerCase();
        const g = getExerciseMuscleGroups(ex).primary;
        const has = (...ws) => ws.some(w => n.includes(w));

        if (has('plank', 'планк')) return 'plank';
        if (has('push-up', 'pushup', 'отжимани', 'mountain climber', 'горизонтальн', 'burpee', 'берпи')) return 'pushup';
        if (has('pull-up', 'pullup', 'подтягиван', 'chin-up', 'chinup', 'muscle-up', 'muscle up', 'planche')) return 'pullup';
        if (has('hanging leg', 'подъем ног в висе', 'raise в висе', 'leg raise', 'подъём ног')) return 'hangingLegRaise';
        if (has('dip', 'брусья')) return 'dip';
        if (has('lunge', 'выпад')) return 'lunge';
        if (has('crunch', 'sit-up', 'situp', 'скручив', 'пресс', 'подъем туловищ', 'подъём туловищ')) return 'crunch';
        if (has('leg curl', 'сгибание ног', 'сгибани ног')) return 'legCurl';
        if (has('leg extension', 'разгибание ног', 'разгибани ног')) return 'legExtension';
        if (has('lat pulldown', 'pulldown', 'тяга верхнего блока', 'тяга к груди')) return 'latPulldown';
        if (has('seated row', 'тяга нижнего блока', 'row сидя')) return 'seatedRow';
        if (has('crossover', 'кроссовер')) return 'cableCross';
        if (has('deadlift', 'станов', 'тяга румынск')) return 'deadlift';
        if (has('bent-over row', 'bent over row', 'тяга в наклоне', 'наклоне')) return 'bentRow';
        if (has('squat', 'присед')) return 'squat';
        if (has('calf', 'голен', 'икр')) return 'calfRaise';
        if (has('shrug', 'шраг')) return 'shrug';
        if (has('upright row', 'к подбородку')) return 'uprightRow';
        if (has('lateral raise', 'в стороны', 'side raise', 'махи в сторон')) return 'lateralRaise';
        if (has('front raise', 'перед собой', 'forward raise')) return 'frontRaise';
        if (has('curl', 'сгибание рук', 'бицепс')) return 'curl';
        if (has('pushdown', 'triceps extension', 'разгибание', 'франц', 'kickback', 'overhead ext')) return 'pushdown';
        if (has('incline')) return 'benchFlatIncline';
        if (has('decline')) return 'benchFlatDecline';
        if (has('bench', 'скамь', 'лёжа', 'лежа', 'lying', 'floor', 'полу')) {
          if (has('fly', 'разводк', 'press', 'жим', 'pullover')) return has('floor', 'полу') ? 'floorPress' : 'benchFlat';
        }
        if (has('seated', 'сидя', 'сидя ', 'sit')) {
          if (g === 'shoulders' || has('press', 'жим')) return 'seatedOverhead';
          return 'seated';
        }
        if (has('stretch', 'растяжк', 'разминк', 'warmup', 'мобилит')) return 'stretch';
        if (g === 'warmup' || g === 'stretching') return 'stretch';
        // group defaults
        if (g === 'abdominals') return 'crunch';
        if (g === 'legs') return eq === 'barbell' || eq === 'smith' ? 'squat' : 'lunge';
        if (g === 'chest') return (eq === 'barbell' || eq === 'dumbbell' || eq === 'smith') ? 'benchFlat' : 'cableCross';
        if (g === 'back') return 'bentRow';
        if (g === 'shoulders') return 'overheadPress';
        if (g === 'elbow_flexors') return 'curl';
        if (g === 'triceps') return 'pushdown';
        if (g === 'forearms') return 'curl';
        return 'stand';
      }

      function renderTechnique(ex, g) {
        let key = detectPose(ex);
        let tilt = 0;
        if (key === 'benchFlatIncline') { key = 'benchFlat'; tilt = -18; }
        if (key === 'benchFlatDecline') { key = 'benchFlat'; tilt = 14; }
        const fn = POSES[key] || POSES.stand;
        let b;
        try { b = fn(ex, g, tilt); } catch (e) { b = POSES.stand(ex, g); }
        if (key === 'seatedOverhead') {
          const base = POSES.overheadPress(ex, g);
          b = Object.assign({}, base, { art: base.art + seat(90, 104) });
        }
        // derive head/neck when a pose didn't specify them
        if (!b.J.headC) {
          const top = (b.J.shoulderL && b.J.shoulderR) ? lerp(b.J.shoulderL, b.J.shoulderR, .5) : (b.J.armN ? b.J.armN.s : V(90, 56));
          if (b.J.torso && b.J.gluteC) {
            const dx = top.x - b.J.gluteC.x, dy = top.y - b.J.gluteC.y;
            const L = Math.hypot(dx, dy) || 1;
            b.J.headC = V(top.x + dx / L * 17, top.y + dy / L * 17);
            b.J.neck = { a: V(top.x + dx / L * 6, top.y + dy / L * 6), b: top };
          } else {
            b.J.headC = V(top.x, top.y - 16);
            b.J.neck = { a: V(top.x, top.y - 8), b: top };
          }
        }
        const fig = athlete({
          farArm: b.J.farArm, farLeg: b.J.farLeg, armN: b.J.armN, legN: b.J.legN,
          torso: b.J.torso || torsoPath(V(90, 56), V(90, 100), 15, 12),
          headC: b.J.headC, neck: b.J.neck || null,
          facing: b.facing
        });
        const glows = glowsFor(g, b.J);
        return GLOW_DEFS + b.art + fig + glows;
      }

      /* muscle map panel (anatomical front/back with highlights) */
      function buildMapSvg(ex, view) {
        const { primary, aux } = getExerciseMuscleGroups(ex);
        const tpl = view === 'back' ? SVG_BACK : view === 'side' ? SVG_SIDE : SVG_FRONT;
        return tpl.replace(/class="bm-muscle"([^>]*?)data-group="([^"]+)"([^>]*?)fill="[^"]*"/g, (m, pre, grp, post) => {
          const cg = canonicalGroup(grp) || grp;
          const isP = cg === primary, isA = aux.includes(cg);
          const fill = isP ? (GROUP_COLORS[primary] || '#ef4444') : isA ? AUX_HIGHLIGHT_COLOR : 'rgba(120,120,120,0.18)';
          const op = isP ? '.9' : isA ? String(AUX_OPACITY) : '.18';
          const extra = isP ? ` style="filter:drop-shadow(0 0 5px ${GROUP_COLORS[primary]})"` : isA ? ' stroke-dasharray="4 2"' : '';
          return `class="bm-muscle"${pre}data-group="${grp}"${post}fill="${fill}" fill-opacity="${op}"${extra}`;
        });
      }

      function mapViewFor(ex) {
        const { primary } = getExerciseMuscleGroups(ex);
        const sub = String(ex.sE || ex.subgroup_en || '').toLowerCase();
        if (['back', 'triceps'].includes(primary)) return 'back';
        if (primary === 'legs' && /hamstring|glute|calf| posterior/.test(sub)) return 'back';
        return 'front';
      }

      const RU_GROUP = { chest: 'Грудь', back: 'Спина', shoulders: 'Плечи', elbow_flexors: 'Бицепс', triceps: 'Трицепс', forearms: 'Предплечья', abdominals: 'Пресс', legs: 'Ноги', stretching: 'Растяжка', warmup: 'Разминка', calisthenics: 'Калистеника', other: 'Другое' };

      function chipsInner(ex) {
        const { primary, aux } = getExerciseMuscleGroups(ex);
        const pc = GROUP_COLORS[primary] || '#ef4444';
        const pl = RU_GROUP[primary] || primary;
        const auxChips = aux.slice(0, 3).map(a => `<span style="background:${AUX_HIGHLIGHT_COLOR};color:#062a30;padding:1px 5px;border-radius:999px;font-weight:700;font-size:9px;white-space:nowrap;">+ ${esc(RU_GROUP[a] || a)}</span>`).join('');
        return `<span style="background:${pc};color:#fff;padding:1px 6px;border-radius:999px;font-weight:800;font-size:10px;box-shadow:0 0 6px ${pc};">${esc(pl)}</span>${auxChips}`;
      }
      function chips(ex) {
        return `<div style="position:absolute;left:4px;bottom:4px;right:4px;display:flex;gap:3px;align-items:center;flex-wrap:wrap;">
          ${chipsInner(ex)}</div>`;
      }
      // Легенда «целевая / вспомогательные» — для развёрнутого вида
      function legend(primaryColor) {
        return `<div style="display:flex;gap:8px;align-items:center;justify-content:center;font-size:7px;color:rgba(255,255,255,.55);margin-top:3px;">
          <span style="display:inline-flex;align-items:center;gap:3px;"><span style="width:7px;height:7px;border-radius:50%;background:${primaryColor};"></span>целевая</span>
          <span style="display:inline-flex;align-items:center;gap:3px;"><span style="width:7px;height:7px;border-radius:50%;background:${AUX_HIGHLIGHT_COLOR};"></span>вспомогательные</span>
        </div>`;
      }
      function equipChip(ex) {
        const eq = ex.eR || ex.equipment_ru || ex.eE || ex.equipment_en || ex.e || '';
        if (!eq) return '';
        const icon = { 'Штанга': '🏋️', 'Гантели': '💪', 'Трос': '🔗', 'Тренажер': '🏟️', 'Вес тела': '🤸', 'Гири': '🔔', 'Резина': '➰', 'Блины': '⭕', 'EZ-штанга': '🏋️‍♂️', 'Смит': '🏟️' }[eq] || '•';
        return `<div style="position:absolute;top:3px;right:3px;background:rgba(0,0,0,.55);border:1px solid rgba(255,255,255,.12);border-radius:6px;padding:1px 5px;font-size:8px;color:#dbe4ee;">${icon} ${esc(eq)}</div>`;
      }

      function frame(inner, label) {
        return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;min-width:0;">
          <div style="width:100%;display:grid;place-items:center;">${inner}</div>
          <span style="font-size:7px;color:rgba(255,255,255,.45);letter-spacing:.12em;margin-top:2px;">${label}</span></div>`;
      }

      /* Рендер: анатомическая карта мышц (целевые — цвет группы,
         вспомогательные — голубой пунктир). Одна карта: фронт/тыл авто. */
      function render(ex, opts) {
        opts = opts || {};
        const big = opts.both !== false; // модалка — крупная карта
        const g = getExerciseMuscleGroups(ex);
        const mv = mapViewFor(ex);
        const pc = GROUP_COLORS[g.primary] || '#ef4444';
        // Одиночный svg, явная высота — без двойной вложенности
        const svgStyle = big
          ? 'height:min(52vh,420px);width:auto;max-width:100%;'
          : 'height:100%;width:auto;max-width:100%;max-height:100%;';
        const map = `<svg viewBox="0 0 160 360" xmlns="http://www.w3.org/2000/svg" style="${svgStyle}">${buildMapSvg(ex, mv)}</svg>`;
        const chipsRow = `<div style="position:absolute;left:8px;top:8px;right:8px;display:flex;gap:4px;flex-wrap:wrap;">${chipsInner(ex)}</div>`;
        const legend = `<div style="display:flex;gap:10px;align-items:center;justify-content:center;font-size:8px;color:rgba(255,255,255,.6);margin-top:6px;">
          <span style="display:inline-flex;align-items:center;gap:4px;"><span style="width:8px;height:8px;border-radius:50%;background:${pc};box-shadow:0 0 5px ${pc};"></span>${esc('целевая')}</span>
          <span style="display:inline-flex;align-items:center;gap:4px;"><span style="width:8px;height:8px;border-radius:50%;background:${AUX_HIGHLIGHT_COLOR};"></span>${esc('вспомогательные')}</span>
        </div>`;
        if (!big) {
          return `<div style="position:relative;width:100%;height:100%;min-height:120px;background:radial-gradient(ellipse at 50% 12%, rgba(99,102,241,.10), transparent 55%), linear-gradient(180deg,#171a24,#0c0e14);border-radius:10px;overflow:hidden;">
            <div style="position:absolute;inset:0;display:grid;place-items:center;padding:4px;">${map}</div>
            ${chips(ex)}${equipChip(ex)}</div>`;
        }
        return `<div style="position:relative;width:100%;background:linear-gradient(180deg,#171a24,#0c0e14);border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:10px;">
          ${chipsRow}
          <div style="display:grid;place-items:center;margin-top:6px;">${map}</div>
          ${legend}
        </div>`;
      }

            /* Компактные чипсы мышц для карточек любого источника (MM/BF/PG) */
      function muscleChips(ex) {
        const { primary, aux } = getExerciseMuscleGroups(ex);
        const pc = GROUP_COLORS[primary] || '#ef4444';
        const pl = RU_GROUP[primary] || primary;
        const auxChips = aux.slice(0, 2).map(a => `<span style="background:${AUX_HIGHLIGHT_COLOR};color:#062a30;padding:0 4px;border-radius:999px;font-weight:700;font-size:9px;white-space:nowrap;">+ ${esc(RU_GROUP[a] || a)}</span>`).join('');
        return `<div style="display:flex;gap:3px;align-items:center;flex-wrap:wrap;margin-top:2px;overflow:hidden;">
          <span style="background:${pc};color:#fff;padding:0 5px;border-radius:999px;font-weight:800;font-size:10px;white-space:nowrap;">${esc(pl)}</span>${auxChips}</div>`;
      }

      return { render, detectPose, getExerciseMuscleGroups, muscleChips };
    })();
    window.PGIllustration = PGI;
    window.getExerciseMuscleGroups = PGI.getExerciseMuscleGroups;
    window.exerciseMuscleChips = (ex) => PGI.muscleChips(ex);

    function exerciseVectorIllustration(ex, opts) {
      if (window.PGIllustration) return window.PGIllustration.render(ex, opts);
      return '';
    }
    window.exerciseVectorIllustration = exerciseVectorIllustration;
    // 3D-like SVG body — detailed anatomical figure with gradient shading,
    // depth highlights, and clickable muscle zones. Each muscle has:
    //   - A gradient fill for 3D depth (lighter top, darker bottom)
    //   - A highlight overlay for specular reflection
    //   - A drop shadow for depth
    //   - data-group attribute for click filtering
    // ============================================================
    // BODY MAP SVGs — front, back, and side (profile) views
    // Each muscle zone has data-group AND data-subgroup so clicking
    // filters exercises to that exact sub-muscle.
    // ============================================================

    const SVG_FRONT = `<svg viewBox="0 0 160 360" class="bm-body-svg" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3));">
      <defs>
        <linearGradient id="skinG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="rgb(var(--c-surface-2))" stop-opacity="0.9"/>
          <stop offset="100%" stop-color="rgb(var(--c-border))" stop-opacity="0.4"/>
        </linearGradient>
        <radialGradient id="muscleG" cx="50%" cy="35%" r="65%">
          <stop offset="0%" stop-color="rgb(var(--c-primary))" stop-opacity="0.55"/>
          <stop offset="100%" stop-color="rgb(var(--c-primary-2))" stop-opacity="0.35"/>
        </radialGradient>
      </defs>
      <!-- Head -->
      <ellipse cx="80" cy="28" rx="20" ry="24" fill="url(#skinG)" stroke="rgb(var(--c-border))" stroke-width="1"/>
      <!-- Neck -->
      <path d="M70,48 Q80,52 90,48 L88,62 Q80,64 72,62 Z" fill="url(#skinG)" stroke="rgb(var(--c-border))" stroke-width="1"/>
      <!-- Neck (Sternocleidomastoid) -->
      <path class="bm-muscle" data-group="back" data-subgroup="Neck" d="M72,52 Q76,58 78,62 L74,62 Z" fill="url(#muscleG)" stroke="rgb(var(--c-border))" stroke-width="0.5"/>
      <path class="bm-muscle" data-group="back" data-subgroup="Neck" d="M88,52 Q84,58 82,62 L86,62 Z" fill="url(#muscleG)" stroke="rgb(var(--c-border))" stroke-width="0.5"/>
      <!-- Upper Trapezius (visible from front) -->
      <path class="bm-muscle" data-group="back" data-subgroup="Trapezius" d="M44,62 Q80,54 116,62 L106,72 Q80,68 54,72 Z" fill="url(#muscleG)" stroke="rgb(var(--c-border))" stroke-width="0.5"/>
      <!-- Left Front Deltoid -->
      <path class="bm-muscle" data-group="shoulders" data-subgroup="Front" d="M42,68 Q34,72 36,86 Q40,90 48,86 Q44,76 44,68 Z" fill="url(#muscleG)" stroke="rgb(var(--c-border))" stroke-width="1"/>
      <!-- Right Front Deltoid -->
      <path class="bm-muscle" data-group="shoulders" data-subgroup="Front" d="M118,68 Q126,72 124,86 Q120,90 112,86 Q116,76 116,68 Z" fill="url(#muscleG)" stroke="rgb(var(--c-border))" stroke-width="1"/>
      <!-- Left Middle Deltoid (side of shoulder) -->
      <ellipse class="bm-muscle" data-group="shoulders" data-subgroup="Middle" cx="36" cy="76" rx="8" ry="10" fill="url(#muscleG)" stroke="rgb(var(--c-border))" stroke-width="1"/>
      <!-- Right Middle Deltoid -->
      <ellipse class="bm-muscle" data-group="shoulders" data-subgroup="Middle" cx="124" cy="76" rx="8" ry="10" fill="url(#muscleG)" stroke="rgb(var(--c-border))" stroke-width="1"/>
      <!-- Left Upper Pec (clavicular head) -->
      <path class="bm-muscle" data-group="chest" data-subgroup="Upper" d="M52,68 Q80,62 76,78 L72,86 Q60,86 52,80 Z" fill="url(#muscleG)" stroke="rgb(var(--c-border))" stroke-width="1"/>
      <!-- Right Upper Pec -->
      <path class="bm-muscle" data-group="chest" data-subgroup="Upper" d="M108,68 Q80,62 84,78 L88,86 Q100,86 108,80 Z" fill="url(#muscleG)" stroke="rgb(var(--c-border))" stroke-width="1"/>
      <!-- Left Middle/Lower Pec -->
      <path class="bm-muscle" data-group="chest" data-subgroup="Middle" d="M52,82 Q60,86 72,86 L72,100 Q62,102 54,96 Z" fill="url(#muscleG)" stroke="rgb(var(--c-border))" stroke-width="1"/>
      <path class="bm-muscle" data-group="chest" data-subgroup="Lower" d="M54,98 Q62,102 72,100 L72,108 Q62,108 56,104 Z" fill="url(#muscleG)" stroke="rgb(var(--c-border))" stroke-width="1"/>
      <!-- Right Middle/Lower Pec -->
      <path class="bm-muscle" data-group="chest" data-subgroup="Middle" d="M108,82 Q100,86 88,86 L88,100 Q98,102 106,96 Z" fill="url(#muscleG)" stroke="rgb(var(--c-border))" stroke-width="1"/>
      <path class="bm-muscle" data-group="chest" data-subgroup="Lower" d="M106,98 Q98,102 88,100 L88,108 Q98,108 104,104 Z" fill="url(#muscleG)" stroke="rgb(var(--c-border))" stroke-width="1"/>
      <!-- Sternum line -->
      <line x1="80" y1="68" x2="80" y2="108" stroke="rgb(var(--c-border))" stroke-width="0.5" opacity="0.3"/>
      <!-- Left Bicep -->
      <path class="bm-muscle" data-group="elbow_flexors" data-subgroup="Biceps" d="M34,90 Q28,96 30,112 Q34,118 42,114 Q44,102 42,92 Z" fill="url(#muscleG)" stroke="rgb(var(--c-border))" stroke-width="1"/>
      <!-- Right Bicep -->
      <path class="bm-muscle" data-group="elbow_flexors" data-subgroup="Biceps" d="M126,90 Q132,96 130,112 Q126,118 118,114 Q116,102 118,92 Z" fill="url(#muscleG)" stroke="rgb(var(--c-border))" stroke-width="1"/>
      <!-- Left Brachialis (between bicep and tricep) -->
      <path class="bm-muscle" data-group="elbow_flexors" data-subgroup="Brachialis" d="M28,100 Q26,108 28,116 L32,116 Q30,108 30,100 Z" fill="url(#muscleG)" stroke="rgb(var(--c-border))" stroke-width="0.5"/>
      <path class="bm-muscle" data-group="elbow_flexors" data-subgroup="Brachialis" d="M132,100 Q134,108 132,116 L128,116 Q130,108 130,100 Z" fill="url(#muscleG)" stroke="rgb(var(--c-border))" stroke-width="0.5"/>
      <!-- Left Forearm (flexors) -->
      <path class="bm-muscle" data-group="forearms" data-subgroup="Wrist Curls" d="M24,118 Q18,124 20,142 Q24,148 30,144 Q32,128 30,118 Z" fill="url(#muscleG)" stroke="rgb(var(--c-border))" stroke-width="1"/>
      <!-- Right Forearm -->
      <path class="bm-muscle" data-group="forearms" data-subgroup="Wrist Curls" d="M136,118 Q142,124 140,142 Q136,148 130,144 Q128,128 130,118 Z" fill="url(#muscleG)" stroke="rgb(var(--c-border))" stroke-width="1"/>
      <!-- Upper Abs (Rectus Abdominis — upper portion) -->
      <path class="bm-muscle" data-group="abdominals" data-subgroup="Upper" d="M58,108 L102,108 L102,124 Q80,128 58,124 Z" fill="url(#muscleG)" stroke="rgb(var(--c-border))" stroke-width="1"/>
      <!-- Middle Abs -->
      <path class="bm-muscle" data-group="abdominals" data-subgroup="Upper" d="M58,124 L102,124 L102,140 Q80,144 58,140 Z" fill="url(#muscleG)" stroke="rgb(var(--c-border))" stroke-width="1"/>
      <!-- Lower Abs -->
      <path class="bm-muscle" data-group="abdominals" data-subgroup="Lower" d="M58,140 L102,140 L100,158 Q80,162 60,158 Z" fill="url(#muscleG)" stroke="rgb(var(--c-border))" stroke-width="1"/>
      <!-- Ab lines (6-pack definition) -->
      <line x1="80" y1="108" x2="80" y2="158" stroke="rgb(var(--c-border))" stroke-width="0.5" opacity="0.3"/>
      <line x1="58" y1="124" x2="102" y2="124" stroke="rgb(var(--c-border))" stroke-width="0.4" opacity="0.25"/>
      <line x1="58" y1="140" x2="102" y2="140" stroke="rgb(var(--c-border))" stroke-width="0.4" opacity="0.25"/>
      <!-- Left Oblique -->
      <path class="bm-muscle" data-group="abdominals" data-subgroup="Obliques" d="M52,108 Q48,124 52,156 L58,156 L58,108 Z" fill="url(#muscleG)" stroke="rgb(var(--c-border))" stroke-width="0.5"/>
      <!-- Right Oblique -->
      <path class="bm-muscle" data-group="abdominals" data-subgroup="Obliques" d="M108,108 Q112,124 108,156 L102,156 L102,108 Z" fill="url(#muscleG)" stroke="rgb(var(--c-border))" stroke-width="0.5"/>
      <!-- Serratus Anterior (left, finger-like muscles on side of ribs) -->
      <path class="bm-muscle" data-group="back" data-subgroup="Lats" d="M48,110 L52,118 M48,118 L52,126 M48,126 L52,134" stroke="url(#muscleG)" stroke-width="2" fill="none"/>
      <path class="bm-muscle" data-group="back" data-subgroup="Lats" d="M112,110 L108,118 M112,118 L108,126 M112,126 L108,134" stroke="url(#muscleG)" stroke-width="2" fill="none"/>
      <!-- Left Quad (Rectus Femoris + Vastus Lateralis) -->
      <path class="bm-muscle" data-group="legs" data-subgroup="Quadriceps" d="M56,158 Q50,164 52,196 Q56,220 64,222 Q68,220 66,196 Q66,168 64,158 Z" fill="url(#muscleG)" stroke="rgb(var(--c-border))" stroke-width="1"/>
      <!-- Right Quad -->
      <path class="bm-muscle" data-group="legs" data-subgroup="Quadriceps" d="M104,158 Q110,164 108,196 Q104,220 96,222 Q92,220 94,196 Q94,168 96,158 Z" fill="url(#muscleG)" stroke="rgb(var(--c-border))" stroke-width="1"/>
      <!-- Left Vastus Lateralis (outer quad) -->
      <path class="bm-muscle" data-group="legs" data-subgroup="Quadriceps" d="M50,170 Q48,190 52,210 L56,210 Q54,190 54,170 Z" fill="url(#muscleG)" stroke="rgb(var(--c-border))" stroke-width="0.5"/>
      <path class="bm-muscle" data-group="legs" data-subgroup="Quadriceps" d="M110,170 Q112,190 108,210 L104,210 Q106,190 106,170 Z" fill="url(#muscleG)" stroke="rgb(var(--c-border))" stroke-width="0.5"/>
      <!-- Left Adductor (inner thigh) -->
      <path class="bm-muscle" data-group="legs" data-subgroup="Adductors" d="M66,162 Q68,180 66,206 Q64,214 70,214 Q72,200 72,176 Q72,166 70,160 Z" fill="url(#muscleG)" stroke="rgb(var(--c-border))" stroke-width="0.5"/>
      <!-- Right Adductor -->
      <path class="bm-muscle" data-group="legs" data-subgroup="Adductors" d="M94,162 Q92,180 94,206 Q96,214 90,214 Q88,200 88,176 Q88,166 90,160 Z" fill="url(#muscleG)" stroke="rgb(var(--c-border))" stroke-width="0.5"/>
      <!-- Left Tibialis Anterior (shin) -->
      <path class="bm-muscle" data-group="legs" data-subgroup="Calves" d="M58,228 Q54,232 56,256 Q60,262 64,258 Q62,240 62,228 Z" fill="url(#muscleG)" stroke="rgb(var(--c-border))" stroke-width="1"/>
      <!-- Right Tibialis -->
      <path class="bm-muscle" data-group="legs" data-subgroup="Calves" d="M102,228 Q106,232 104,256 Q100,262 96,258 Q98,240 98,228 Z" fill="url(#muscleG)" stroke="rgb(var(--c-border))" stroke-width="1"/>
      <!-- Feet -->
      <ellipse cx="60" cy="270" rx="10" ry="6" fill="url(#skinG)" stroke="rgb(var(--c-border))" stroke-width="1"/>
      <ellipse cx="100" cy="270" rx="10" ry="6" fill="url(#skinG)" stroke="rgb(var(--c-border))" stroke-width="1"/>
      <!-- Hip Flexors (lower abs area) -->
      <path class="bm-muscle" data-group="legs" data-subgroup="Hip Flexors" d="M60,156 L76,156 L76,164 Q68,166 60,164 Z" fill="url(#muscleG)" stroke="rgb(var(--c-border))" stroke-width="0.5"/>
      <path class="bm-muscle" data-group="legs" data-subgroup="Hip Flexors" d="M100,156 L84,156 L84,164 Q92,166 100,164 Z" fill="url(#muscleG)" stroke="rgb(var(--c-border))" stroke-width="0.5"/>
    </svg>`;

    const SVG_BACK = `<svg viewBox="0 0 160 360" class="bm-body-svg" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3));">
      <defs>
        <linearGradient id="skinGB" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="rgb(var(--c-surface-2))" stop-opacity="0.9"/>
          <stop offset="100%" stop-color="rgb(var(--c-border))" stop-opacity="0.4"/>
        </linearGradient>
        <radialGradient id="muscleGB" cx="50%" cy="35%" r="65%">
          <stop offset="0%" stop-color="rgb(var(--c-primary))" stop-opacity="0.55"/>
          <stop offset="100%" stop-color="rgb(var(--c-primary-2))" stop-opacity="0.35"/>
        </radialGradient>
      </defs>
      <!-- Head (back) -->
      <ellipse cx="80" cy="28" rx="20" ry="24" fill="url(#skinGB)" stroke="rgb(var(--c-border))" stroke-width="1"/>
      <!-- Neck -->
      <path d="M70,48 Q80,52 90,48 L88,62 Q80,64 72,62 Z" fill="url(#skinGB)" stroke="rgb(var(--c-border))" stroke-width="1"/>
      <!-- Upper Trapezius (neck to shoulders) -->
      <path class="bm-muscle" data-group="back" data-subgroup="Trapezius" d="M44,62 Q80,52 116,62 L108,76 Q80,70 52,76 Z" fill="url(#muscleGB)" stroke="rgb(var(--c-border))" stroke-width="1"/>
      <!-- Middle Trapezius (between shoulder blades) -->
      <path class="bm-muscle" data-group="back" data-subgroup="Trapezius" d="M52,80 Q80,76 108,80 L100,96 Q80,92 60,96 Z" fill="url(#muscleGB)" stroke="rgb(var(--c-border))" stroke-width="0.5"/>
      <!-- Lower Trapezius (V-shape to lower back) -->
      <path class="bm-muscle" data-group="back" data-subgroup="Trapezius" d="M60,98 Q80,94 100,98 L84,118 Q80,116 76,118 Z" fill="url(#muscleGB)" stroke="rgb(var(--c-border))" stroke-width="0.5"/>
      <!-- Left Rear Deltoid -->
      <path class="bm-muscle" data-group="shoulders" data-subgroup="Rear" d="M42,68 Q34,72 36,86 Q40,90 48,86 Q44,76 44,68 Z" fill="url(#muscleGB)" stroke="rgb(var(--c-border))" stroke-width="1"/>
      <!-- Right Rear Deltoid -->
      <path class="bm-muscle" data-group="shoulders" data-subgroup="Rear" d="M118,68 Q126,72 124,86 Q120,90 112,86 Q116,76 116,68 Z" fill="url(#muscleGB)" stroke="rgb(var(--c-border))" stroke-width="1"/>
      <!-- Left Lat (Latissimus Dorsi) -->
      <path class="bm-muscle" data-group="back" data-subgroup="Lats" d="M44,82 Q80,76 76,98 L72,128 Q60,130 50,118 Q42,100 44,82 Z" fill="url(#muscleGB)" stroke="rgb(var(--c-border))" stroke-width="1"/>
      <!-- Right Lat -->
      <path class="bm-muscle" data-group="back" data-subgroup="Lats" d="M116,82 Q80,76 84,98 L88,128 Q100,130 110,118 Q118,100 116,82 Z" fill="url(#muscleGB)" stroke="rgb(var(--c-border))" stroke-width="1"/>
      <!-- Rhomboids (between shoulder blades, hidden under trap) -->
      <path class="bm-muscle" data-group="back" data-subgroup="Middle Back" d="M62,84 Q80,82 98,84 L92,98 Q80,96 68,98 Z" fill="url(#muscleGB)" stroke="rgb(var(--c-border))" stroke-width="0.5"/>
      <!-- Left Infraspinatus/Teres (rotator cuff area) -->
      <path class="bm-muscle" data-group="shoulders" data-subgroup="Rotator Cuff" d="M46,86 Q42,94 46,102 L54,100 Q52,92 52,86 Z" fill="url(#muscleGB)" stroke="rgb(var(--c-border))" stroke-width="0.5"/>
      <path class="bm-muscle" data-group="shoulders" data-subgroup="Rotator Cuff" d="M114,86 Q118,94 114,102 L106,100 Q108,92 108,86 Z" fill="url(#muscleGB)" stroke="rgb(var(--c-border))" stroke-width="0.5"/>
      <!-- Spine line -->
      <line x1="80" y1="82" x2="80" y2="132" stroke="rgb(var(--c-border))" stroke-width="0.5" opacity="0.3"/>
      <!-- Left Tricep (long head) -->
      <path class="bm-muscle" data-group="triceps" data-subgroup="Compound" d="M34,90 Q26,96 28,114 Q32,120 40,116 Q42,102 40,92 Z" fill="url(#muscleGB)" stroke="rgb(var(--c-border))" stroke-width="1"/>
      <!-- Right Tricep -->
      <path class="bm-muscle" data-group="triceps" data-subgroup="Compound" d="M126,90 Q134,96 132,114 Q128,120 120,116 Q118,102 120,92 Z" fill="url(#muscleGB)" stroke="rgb(var(--c-border))" stroke-width="1"/>
      <!-- Left Forearm (extensors) -->
      <path class="bm-muscle" data-group="forearms" data-subgroup="Wrist Curls" d="M24,122 Q18,128 20,146 Q24,152 30,148 Q32,132 30,122 Z" fill="url(#muscleGB)" stroke="rgb(var(--c-border))" stroke-width="1"/>
      <path class="bm-muscle" data-group="forearms" data-subgroup="Wrist Curls" d="M136,122 Q142,128 140,146 Q136,152 130,148 Q128,132 130,122 Z" fill="url(#muscleGB)" stroke="rgb(var(--c-border))" stroke-width="1"/>
      <!-- Lower Back (Erector Spinae) -->
      <path class="bm-muscle" data-group="back" data-subgroup="Lower Back" d="M58,128 L102,128 L100,152 Q80,156 60,152 Z" fill="url(#muscleGB)" stroke="rgb(var(--c-border))" stroke-width="1"/>
      <!-- Left Erector Spinae (column along spine) -->
      <path class="bm-muscle" data-group="back" data-subgroup="Lower Back" d="M68,130 Q66,144 70,156 L74,156 Q72,144 72,130 Z" fill="url(#muscleGB)" stroke="rgb(var(--c-border))" stroke-width="0.5"/>
      <path class="bm-muscle" data-group="back" data-subgroup="Lower Back" d="M92,130 Q94,144 90,156 L86,156 Q88,144 88,130 Z" fill="url(#muscleGB)" stroke="rgb(var(--c-border))" stroke-width="0.5"/>
      <!-- Left Gluteus Maximus -->
      <ellipse class="bm-muscle" data-group="legs" data-subgroup="Glutes" cx="62" cy="166" rx="18" ry="16" fill="url(#muscleGB)" stroke="rgb(var(--c-border))" stroke-width="1"/>
      <!-- Right Gluteus Maximus -->
      <ellipse class="bm-muscle" data-group="legs" data-subgroup="Glutes" cx="98" cy="166" rx="18" ry="16" fill="url(#muscleGB)" stroke="rgb(var(--c-border))" stroke-width="1"/>
      <!-- Glute crease -->
      <line x1="80" y1="156" x2="80" y2="180" stroke="rgb(var(--c-border))" stroke-width="0.5" opacity="0.3"/>
      <!-- Left Hamstring (Biceps Femoris) -->
      <path class="bm-muscle" data-group="legs" data-subgroup="Hamstrings" d="M54,184 Q46,190 48,216 Q52,236 60,238 Q66,236 64,216 Q64,194 62,184 Z" fill="url(#muscleGB)" stroke="rgb(var(--c-border))" stroke-width="1"/>
      <!-- Right Hamstring -->
      <path class="bm-muscle" data-group="legs" data-subgroup="Hamstrings" d="M106,184 Q114,190 112,216 Q108,236 100,238 Q94,236 96,216 Q96,194 98,184 Z" fill="url(#muscleGB)" stroke="rgb(var(--c-border))" stroke-width="1"/>
      <!-- Left Semitendinosus (inner hamstring) -->
      <path class="bm-muscle" data-group="legs" data-subgroup="Hamstrings" d="M64,186 Q66,210 62,232 L66,232 Q70,210 68,186 Z" fill="url(#muscleGB)" stroke="rgb(var(--c-border))" stroke-width="0.5"/>
      <path class="bm-muscle" data-group="legs" data-subgroup="Hamstrings" d="M96,186 Q94,210 98,232 L94,232 Q90,210 92,186 Z" fill="url(#muscleGB)" stroke="rgb(var(--c-border))" stroke-width="0.5"/>
      <!-- Left Calf (Gastrocnemius) -->
      <path class="bm-muscle" data-group="legs" data-subgroup="Calves" d="M54,242 Q46,248 48,272 Q52,288 60,290 Q66,288 64,272 Q62,250 62,242 Z" fill="url(#muscleGB)" stroke="rgb(var(--c-border))" stroke-width="1"/>
      <!-- Right Calf -->
      <path class="bm-muscle" data-group="legs" data-subgroup="Calves" d="M106,242 Q114,248 112,272 Q108,288 100,290 Q94,288 96,272 Q98,250 98,242 Z" fill="url(#muscleGB)" stroke="rgb(var(--c-border))" stroke-width="1"/>
      <!-- Soleus (deeper calf muscle, lower) -->
      <path class="bm-muscle" data-group="legs" data-subgroup="Calves" d="M52,272 Q50,282 54,288 L60,288 Q58,280 58,272 Z" fill="url(#muscleGB)" stroke="rgb(var(--c-border))" stroke-width="0.5"/>
      <path class="bm-muscle" data-group="legs" data-subgroup="Calves" d="M108,272 Q110,282 106,288 L100,288 Q102,280 102,272 Z" fill="url(#muscleGB)" stroke="rgb(var(--c-border))" stroke-width="0.5"/>
      <!-- Feet (back) -->
      <ellipse cx="58" cy="298" rx="10" ry="6" fill="url(#skinGB)" stroke="rgb(var(--c-border))" stroke-width="1"/>
      <ellipse cx="102" cy="298" rx="10" ry="6" fill="url(#skinGB)" stroke="rgb(var(--c-border))" stroke-width="1"/>
    </svg>`;

    // Side (profile) view — left-facing silhouette
    const SVG_SIDE = `<svg viewBox="0 0 200 360" class="bm-body-svg" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3));">
      <defs>
        <linearGradient id="skinGS" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="rgb(var(--c-surface-2))" stop-opacity="0.9"/>
          <stop offset="100%" stop-color="rgb(var(--c-border))" stop-opacity="0.4"/>
        </linearGradient>
        <radialGradient id="muscleGS" cx="50%" cy="35%" r="65%">
          <stop offset="0%" stop-color="rgb(var(--c-primary))" stop-opacity="0.55"/>
          <stop offset="100%" stop-color="rgb(var(--c-primary-2))" stop-opacity="0.35"/>
        </radialGradient>
      </defs>
      <!-- Head (profile, facing left) -->
      <ellipse cx="60" cy="32" rx="22" ry="26" fill="url(#skinGS)" stroke="rgb(var(--c-border))" stroke-width="1"/>
      <!-- Nose profile bump -->
      <path d="M40,30 Q36,32 38,36 L42,36 Z" fill="url(#skinGS)" stroke="rgb(var(--c-border))" stroke-width="0.5"/>
      <!-- Neck -->
      <path d="M56,56 Q62,60 70,56 L68,68 Q62,70 56,68 Z" fill="url(#skinGS)" stroke="rgb(var(--c-border))" stroke-width="1"/>
      <!-- Sternocleidomastoid (neck muscle) -->
      <path class="bm-muscle" data-group="back" data-subgroup="Neck" d="M58,58 Q60,66 64,68 L66,68 Q62,62 60,58 Z" fill="url(#muscleGS)" stroke="rgb(var(--c-border))" stroke-width="0.5"/>
      <!-- Upper Trapezius (side view — bulge between neck and shoulder) -->
      <path class="bm-muscle" data-group="back" data-subgroup="Trapezius" d="M68,58 Q82,62 92,72 L86,82 Q76,76 68,72 Z" fill="url(#muscleGS)" stroke="rgb(var(--c-border))" stroke-width="0.5"/>
      <!-- Side Deltoid (the round shoulder muscle visible from side) -->
      <ellipse class="bm-muscle" data-group="shoulders" data-subgroup="Middle" cx="92" cy="82" rx="12" ry="14" fill="url(#muscleGS)" stroke="rgb(var(--c-border))" stroke-width="1"/>
      <!-- Front Deltoid (front edge) -->
      <path class="bm-muscle" data-group="shoulders" data-subgroup="Front" d="M84,76 Q78,80 80,92 Q86,94 90,90 Z" fill="url(#muscleGS)" stroke="rgb(var(--c-border))" stroke-width="0.5"/>
      <!-- Rear Deltoid (back edge) -->
      <path class="bm-muscle" data-group="shoulders" data-subgroup="Rear" d="M100,76 Q106,80 104,92 Q98,94 94,90 Z" fill="url(#muscleGS)" stroke="rgb(var(--c-border))" stroke-width="0.5"/>
      <!-- Pec (chest, side view — front of upper torso) -->
      <path class="bm-muscle" data-group="chest" data-subgroup="Upper" d="M76,92 Q72,98 76,108 L84,106 Q82,98 82,92 Z" fill="url(#muscleGS)" stroke="rgb(var(--c-border))" stroke-width="1"/>
      <path class="bm-muscle" data-group="chest" data-subgroup="Middle" d="M76,108 Q74,116 78,124 L86,122 Q82,114 82,108 Z" fill="url(#muscleGS)" stroke="rgb(var(--c-border))" stroke-width="1"/>
      <path class="bm-muscle" data-group="chest" data-subgroup="Lower" d="M78,124 Q80,130 84,134 L90,130 Q86,126 86,122 Z" fill="url(#muscleGS)" stroke="rgb(var(--c-border))" stroke-width="1"/>
      <!-- Lat (side view — back of torso below shoulder) -->
      <path class="bm-muscle" data-group="back" data-subgroup="Lats" d="M96,98 Q104,108 104,128 L96,128 Q92,112 92,102 Z" fill="url(#muscleGS)" stroke="rgb(var(--c-border))" stroke-width="1"/>
      <!-- Bicep (front of upper arm) -->
      <path class="bm-muscle" data-group="elbow_flexors" data-subgroup="Biceps" d="M86,90 Q92,96 96,114 Q98,122 90,120 Q86,108 84,94 Z" fill="url(#muscleGS)" stroke="rgb(var(--c-border))" stroke-width="1"/>
      <!-- Tricep (back of upper arm) -->
      <path class="bm-muscle" data-group="triceps" data-subgroup="Compound" d="M100,90 Q108,98 110,116 Q108,124 100,122 Q98,108 98,94 Z" fill="url(#muscleGS)" stroke="rgb(var(--c-border))" stroke-width="1"/>
      <!-- Forearm -->
      <path class="bm-muscle" data-group="forearms" data-subgroup="Wrist Curls" d="M90,124 Q96,130 100,148 Q102,156 96,156 Q92,142 88,128 Z" fill="url(#muscleGS)" stroke="rgb(var(--c-border))" stroke-width="1"/>
      <!-- Abs (side view — front of torso) -->
      <path class="bm-muscle" data-group="abdominals" data-subgroup="Upper" d="M78,134 Q74,140 76,148 L84,148 Q82,140 82,134 Z" fill="url(#muscleGS)" stroke="rgb(var(--c-border))" stroke-width="1"/>
      <path class="bm-muscle" data-group="abdominals" data-subgroup="Lower" d="M76,148 Q74,156 78,164 L86,162 Q82,154 84,148 Z" fill="url(#muscleGS)" stroke="rgb(var(--c-border))" stroke-width="1"/>
      <!-- Oblique (side of abs) -->
      <path class="bm-muscle" data-group="abdominals" data-subgroup="Obliques" d="M86,134 Q92,142 92,158 L86,158 Q86,144 84,134 Z" fill="url(#muscleGS)" stroke="rgb(var(--c-border))" stroke-width="0.5"/>
      <!-- Lower Back (side view — lower curve) -->
      <path class="bm-muscle" data-group="back" data-subgroup="Lower Back" d="M92,148 Q98,154 98,164 L92,164 Q90,156 90,148 Z" fill="url(#muscleGS)" stroke="rgb(var(--c-border))" stroke-width="0.5"/>
      <!-- Glute (side view — buttock bulge) -->
      <ellipse class="bm-muscle" data-group="legs" data-subgroup="Glutes" cx="98" cy="174" rx="14" ry="14" fill="url(#muscleGS)" stroke="rgb(var(--c-border))" stroke-width="1"/>
      <!-- Hip Flexor (front of hip) -->
      <path class="bm-muscle" data-group="legs" data-subgroup="Hip Flexors" d="M78,164 Q74,172 78,180 L86,178 Q82,170 84,164 Z" fill="url(#muscleGS)" stroke="rgb(var(--c-border))" stroke-width="0.5"/>
      <!-- Quad (front of thigh) -->
      <path class="bm-muscle" data-group="legs" data-subgroup="Quadriceps" d="M82,180 Q74,190 76,220 Q82,232 90,228 Q92,210 90,184 Z" fill="url(#muscleGS)" stroke="rgb(var(--c-border))" stroke-width="1"/>
      <!-- Hamstring (back of thigh) -->
      <path class="bm-muscle" data-group="legs" data-subgroup="Hamstrings" d="M98,180 Q108,190 106,222 Q100,234 92,230 Q92,210 94,184 Z" fill="url(#muscleGS)" stroke="rgb(var(--c-border))" stroke-width="1"/>
      <!-- Calf (back of lower leg) -->
      <path class="bm-muscle" data-group="legs" data-subgroup="Calves" d="M98,234 Q108,244 104,272 Q98,284 92,282 Q90,260 92,236 Z" fill="url(#muscleGS)" stroke="rgb(var(--c-border))" stroke-width="1"/>
      <!-- Tibialis Anterior (shin, front of lower leg) -->
      <path class="bm-muscle" data-group="legs" data-subgroup="Calves" d="M82,234 Q76,244 78,270 Q84,282 90,280 Q88,258 88,236 Z" fill="url(#muscleGS)" stroke="rgb(var(--c-border))" stroke-width="1"/>
      <!-- Foot (profile) -->
      <path d="M76,282 Q70,288 70,294 L98,294 Q100,288 96,282 Z" fill="url(#skinGS)" stroke="rgb(var(--c-border))" stroke-width="1"/>
    </svg>`;

    // Expose SVGs globally so the Exercises tab can render its own body map
    window.BM_SVG_FRONT = SVG_FRONT;
    window.BM_SVG_BACK = SVG_BACK;
    window.BM_SVG_SIDE = SVG_SIDE;

// Экспорт палитры для bodyMapPicker/recoveryMap
window.GROUP_COLORS = GROUP_COLORS;
window.AUX_HIGHLIGHT_COLOR = AUX_HIGHLIGHT_COLOR;
