// Service Worker - David King Gym PWA
// v46: GI translations RU 90-91 + HE 55-56, seed v54 (c19)
// v47: GI translations RU 92-93 + HE 57-58, seed v55 (c20)
// v48: GI translations RU 94-95 + HE 59-60, seed v56 (c21)
// v49: GI translations RU 96-97 + HE 61-62, seed v57 (c22)
// v50: GI translations RU 98-99 + HE 63-64, seed v58 (c23)
// v51: GI translations RU 100-101 + HE 65-66, seed v59 (c24)
// v52: GI translations RU 102-103 + HE 67-68, seed v60 (c25)
// v53: short cloud portal link #c= (portal_shares), seed v61 (c26)
// v54: portal rules copy button visible when signed in (c27)
// v55: GI translations RU 104-105 + HE 69-70, seed v62 (c28)
// v56: GI translations RU 106-107 + HE 71-72, seed v63 (c29)
// v57: GI translations RU 108-109 + HE 73-74, seed v64 (c30)
// v58: GI translations RU 110-111 + HE 75-76, seed v65 (c31)
// v59: GI translations RU 112-113 + HE 77-78, seed v66 (c32)
// v60: GI translations RU 114-115 + HE 79-80, seed v67 (c33)
// v61: GI translations RU 116-117 + HE 81-82, seed v68 (c34)
// v62: GI translations RU 118-119 + HE 83-84, seed v69 (c35)
// v63: GI translations RU 120-121 RU COMPLETE 100% + HE 85-86, seed v70 (c36)
// v64: GI translations HE 87-88, seed v71 (c37)
// v65: GI translations HE 89-90, seed v72 (c38)
// v66: GI translations HE 91-92, seed v73 (c39)
// v67: GI translations HE 93-94, seed v74 (c40)
// v68: GI translations HE 95-96, seed v75 (c41)
// v69: GI translations HE 97-98, seed v76 (c42)
// v70: GI translations HE 99-100, seed v77 (c43)
// v71: GI translations HE 101-102, seed v79 (c44)
// v72: GI translations HE 103-104, seed v80 (c45)
// v73: GI translations HE 105-106, seed v81 (c46)
// v74: GI translations HE 107-108, seed v82 (c47)
// v75: GI translations HE 109-110, seed v83 (c48)
// v76: GI translations HE 111-112, seed v84 (c49)
// v77: GI translations HE 113-114, seed v85 (c50)
// v78: GI translations HE 115-116, seed v86 (c51)
// v79: GI translations HE 117-118, seed v87 (c52)
// v81: GI translations HE 121 — HE 100% (32385/32385), seed v89 (c54)
// v80: GI translations HE 119-120, seed v88 (c53)
// v82: i18n audit — trilingual render, RU tails, dict 1262 keys, seed v90 (c55)
// v83: i18n dict loader fixed for vite build (data:URI mangle killed dictionaries on Pages) + dicts precached, seed v91 (c56)
// v84: taxonomy order restored (208 group moves, explicit subgroups, seed v92, c57)
// v85: taxonomy v2 — 800+ group fixes, seed v93 (c58)
// v86: hinge-fix — RDL family → hamstrings, pull-through/hip-hinge family → glutes, seed v94 (c59)
// v87: subgroup pass — hammer→brachioradialis / reverse→brachialis + 35 fixes, muscle kept on source switch, seed v95 (c60)
// v108: c81 — mixed-cache blank labels fixed: i18n/*.json now NETWORK-FIRST, waiting SW auto-activates (SKIP_WAITING) + one guarded controllerchange reload, applyI18n keeps default text when a key is missing
// v109: c82 — mobile Exercise DB browse repaired: revealed body map = own full-width wrapped row (tree+cards no longer pushed off-screen, no stretch-to-list-height), .exb-map-open CSS fallback for :has-less WebViews, 3D widget/SVG capped to column width, Report button label follows language
// v110: c83 — header dumbbell button (left of the language selector): one-tap return to the live workout at the exercise the user is actually working on (last set touched → first unfinished → last), from any screen and from inside the live scroll itself; green pulse dot marks a running session
// v111: c84 — Workouts ▸ Exercise DB = THE SAME Quick Pick component as the «Выбор упражнений» modal (single shared #bm-root DOM, mounted inline in browse mode: cards never auto-add — a click opens details; title «Тренировки»); manage row keeps Edit-tree/Archive/Add-exercise; Add Client moved from the desktop aside into the Clients screen header (same as mobile)
// v112: c85 — trainer live workout: kg⇄lb weight-unit picker (tap any weight input or the header chip; the unit is displayed at the top of the live screen and on every weight column); client portal (client.html): header now matches the trainer app (dumbbell return-to-workout, A−/A+ font steps, theme quick menu with 33 themes, settings sheet with textures v2 + opacity + share), the full theme CSS pack ported 1:1, 16-step font scale, and the same kg⇄lb unit picker
// v113: c86 — textures: the portal's panels stay clean (no texture painted on .glass/.glass-strong; the texture lives on the background overlay and shows through the translucent glass, same as the trainer app); weight units: the picker moved OFF the weight inputs — it opens only from the top labels (header chip + weight column header) in both apps
// v114: c87 — profile-loss fix: a new service worker NO LONGER force-reloads the running app (user-gated «Обновить · Update» banner instead), and the cloud boot-sync refuses to silently wipe local records newer than the last completed sync (conflict banner instead — profile «אור וינקלר» report); portal: the «Вес» column label opens ONLY the unit sheet, never the exercise card (the whole-card tap-to-open delegation now excludes [data-wunit-col]/[data-wunit-chip])
// v115: c88 — cardio units: the cardio columns of a live workout (Время/Дистанция) open ONE unit sheet (minutes<->seconds, meters<->kilometers) in BOTH apps; a Category select in the custom exercise form marks cardio exercises; ALL units (weight + time + distance) now live in ONE cloud doc (portal_shares/ps_units_global_v1) — change in one app, both change
// v116: c89 — cloud-account fix: ONE shared Firebase-compat loader (window.dkFbEnsure) for the units-sync / portal-shares / cloud-account modules — the eager units loader booted app+firestore WITHOUT auth, the cloud loader's «firebase exists» early-return then skipped firebase-auth-compat and firebase.auth() threw «Ошибка облака: firebase.auth is not a function» on every boot (sign-in + cloud backup dead since c88)
// v117: c90 — previous working weights: the live workout's «Пред.» column now prefills from the LAST workout_history record of the selected client (weight×reps, cardio time×dist, + colored 1–10 effort badge — before it only chained set→set inside the current session, so the first set always showed «—»); orphan-history fallback for profiles restored under a new id; «Сделал всё» button marks every set done (live + portal); last-workout effort badge in the portal Prev cell (findPrev now returns rpe/time/dist); time/dist/type finally SAVED to workout_history in both apps (cardio history was silently dropped); recover.html re-links workout/nutrition history rows from the pre-restore client id
// v120: c93 — «Объём по группам мышц» identical + interconnected: the trainee portal's analytics now uses the EXACT trainer CRM formula (ALL sets × weight×reps, «kg·reps» — it used to sum DONE sets only in «кг», which is why the portal showed a single «Другое 200 кг» bar while the trainer saw Ноги 2352 / Грудь 1280 …); ONE shared cloud history doc per client (portal_shares/ps_hist_<16hex>, the same SHA-256 derivative as the portal share id): CRM live-workout finish pushes the record, portal workout save pushes the record, the portal merges via onSnapshot (dedupe by ts, last 60), the CRM analytics merges remote records in-memory (5s offline guard, not persisted) — both sides always show the same workouts; legacy #e= links / demo skip the sync.
// v119: c92 — personal analytics in the trainee portal: the third bottom-nav tab («Прогресс», which was only a morning check-in form) is now «Аналитика» — range chips (week/month/all) + 4 metric cards (workouts/active days/streak 🔥/volume+minutes), activity heatmap (workout vs check-in), volume per muscle group (canonical groups + 3-language labels, same dictionary as CRM c91 — resolves via share exerciseDB → program day → legacy reverse map), body-weight SVG trend from check-ins (dashed target line + delta chip), recent-workouts list; the check-in form + measurement history stay at the bottom of the tab; check-in card labels got ids + i18n (were hard-coded RU).
// v118: c91 — rest seconds finally survive every path: program day → live workout (startWorkoutFromProgram dropped rest_sec, always fell back to 90), program editor re-open (openProgramEditor dropped rest_sec/cardio/superset/set types — re-saving baked 90 into the stored program, which the portal then also showed), template save/start/apply, history reuse (finish() didn't store rest_sec) — and every reader is 0-safe now (a stored 0 no longer flips to 90). Analytics «התפלגות שרירים» muscle names follow the UI language (RU/HE/EN) instead of echoing the build-time frozen string; records built under different languages merge by canonical group.
// v122: c95 — 10 save slots («ячейки сохранения»): slot 1 AUTO (boot/15 min/before every restore + after cloud save), slots 2–10 manual save/load/clear with dates, local IndexedDB v10 'snapshots' store + Firestore mirror (users/{uid}/snapshots/slot_N + parts) so slots load cross-device, restore replaces ONLY user stores and force-saves the current state into the AUTO slot first, empty-device guard, plus a lost-profile orphan scanner (revives clients whose programs/history survived in IndexedDB — the «אסי בורג» case) under the ORIGINAL id
// v121: c94 — cloud-sync clobber fence (a stale device can no longer overwrite newer cloud data), portal analytics backfill (FULL trainer history → ps_hist doc, caps 60→200), recover.html cloud-account restore (Google sign-in, original ids + history) + on-device portal blob restore, portal picks up new releases via controllerchange
// v123: c96 — live workout polish: (1) the weight inputs got min-width — a two-digit working weight ("30") no longer gets squeezed out of the cell; (2) the weight unit became PER-EXERCISE (Hevy parity): the weight column header of an exercise opens the unit sheet for THAT exercise, switching converts its weights + prev-weights automatically (kg⇄lb calculator rounded to 0.5), optional «apply to all exercises» checkbox, the top chip now sets only the DEFAULT for new exercises; the per-exercise unit travels through templates, finish/history and the ps_hist portal mirror — and the trainee portal got the same system + a RECOVERY MAP tab (10 save slots, slot 1 AUTO + 9 manual, IDB + cloud mirror ps_slots_<16hex>) as the fourth bottom-nav button
// v124: c97 — portal UX polish: (1) the recovery map re-translates INSTANTLY on a language switch (setLang now re-renders the 10 slot rows — before, only the static title/subtitle changed and the rows kept the old language until the tab was re-opened); (2) the per-exercise weight-unit header (кг/фт) and the cardio time/distance headers became REAL buttons with a visible outline in BOTH apps — tapping them opens only the unit sheet, never the whole exercise card anymore (the c96 header was a plain span whose tap bubbled to the card-open handler); (3) «Техника» became a real expand/collapse button that shows the technique in place — it used to be a <details><summary> whose tap opened the exercise card first, with the technique expanding only after the card was closed; (4) per-exercise unit header tooltips now say «unit of THIS exercise».
// v125: c98 — the portal's «Карта восстановления» is now the REAL recovery map, identical to the trainer CRM's (recoveryMap): same SVG body (front/back/side) with per-muscle heat colors, same 6-day exponential decay (100·(1−e^(−days/3))), same status buckets (fresh ≥85 / recovering ≥50 / fatigued), same done-sets-only volume and 30% synergist credit, mode tabs Recovery/7d/30d; data = the shared ps_hist workout history, and the trainer's map now ALSO merges the portal's cloud history (in-memory, 4s guard) — identical & interconnected in BOTH directions; portal workout records + CRM backfills carry canonical group + synergists (g/syn) so the credit matches exactly; the 10 save slots stay under «Ячейки сохранения» below the map.
// v126: c99 — portal recovery tab polish: the 10 save slots moved into Settings, the recovery-map tabs/subtitle re-translate instantly on a language switch
// v127: c100 — «Выбор упражнений» body map: the embedded 3D body and the SVG body now render at the SAME box (same width source + the SVG's 160:360 ratio) in BOTH places they appear together (Quick Pick modal ≥1440px and the Exercise DB panel incl. the ≤1023px reveal) — before, the 3D box answered to the --ui-atlas slider, had no intrinsic height and was flex-crushed to a 142px sliver next to a 488px SVG in the modal, and sat at a fixed 19:31 box in the panel; the embedded camera now fits BOTH box dimensions at a fixed ~6% margin (no longer zoomed/cropped by the atlas slider — that slider keeps controlling the big standalone Atlas only)
// v128: c101 — (1) the trainee portal stopped mixing clients: all per-client localStorage data (workout history, check-ins, done days, diary, water) is namespaced by the portal share id, the old shared keys are quarantined (dk_legacy_*) — the recovery map and analytics of a client who never trained no longer show another client's workouts; (2) the 10 save slots are REMOVED from the portal (trainer-only feature, the trainee keeps visual settings); (3) the picker's SVG body + 3D body sit flush (4px gap) and share the column height 50/50 (panel: 44vh cap) — both always fully on screen, camera re-fits on resize
// v129: c102 — (1) stretching exercises became TIME-first: the live workout (trainer + portal) renders THREE inputs per set — hold time (highlighted, first), optional working weight, optional reps — the program builder also gets a time cell (before weight) and carries it through to the portal, the Prev cell chains time×weight×reps; (2) a back-swipe with the exercise card open now closes ONLY the card: the trainer's back-trap debounces double popstate dispatch and never leaves/ends a running live workout, the portal's guard closes the topmost overlay (card/viewer/settings/units/report) instead of asking «Закрыть портал?»; (3) every modal ✕ close button got a visible frame (border + surface chip) in BOTH apps
// v130: c103 — live workout cards are now IDENTICAL to the client portal (portal design is the base): glass cards, big animated thumbnails (w-20/24, crossfade), equipment chip, per-exercise mini progress, CSS-grid set rows (the <table> is gone) with the portal's set-input/set-check/type-badge styling, framed Add-set/Done-all buttons, inline «Техника» toggle; NEW trainer-only button «Заменить упражнение» on every live card (body-map picker, single pick swaps the exercise in place, sets reset, prev re-fetched by client history); the trainer's exercise-viewer modal now matches the portal's compact size (max-w-lg bottom sheet, single column); the portal's thumbnail grew to the same w-20/24
// v131: c104 — the program builder got per-exercise units: a kg/lb chip on every weighted exercise and a min/sec chip on every cardio machine & stretch (switching converts the set values ×60/÷60); cardio sets now render time/distance cells in the builder too (they were weight×reps only); a bulk «Отдых для всех упражнений» row applies one rest value to the whole program; exercises can move ACROSS days — drop them on a day letter (A–E) tab or use the ⇄ selector on the card; superset pairs are highlighted amber in the builder, live workout AND portal (the ⚡ flag now travels into live sessions and portal sessions, per-exercise weight unit + time unit travel through program → template → live/portal as well)
// v132: c105 — (1) the Clients page dropped the old goal groupings (hypertrophy/strength/fat-loss/endurance/rehab) and got REAL client groups: built-in Спортзал/Друзья/Семья + a «+» button that opens a groups manager (add any group, rename inline, delete with auto-move of its clients to the first remaining group); clients move between groups via the folder button on each card (floating menu) or by dragging a card onto a group chip; every client card shows its group badge, the sort dropdown has a Group option; (2) two NEW canonical exercise groups: «Кардио» (running, cardio machines, jump rope, treadmill, bike, rowing, elliptical, swimming, battling ropes, burpees — 52 exercises split OUT of «Разминка», category=cardio so they get time/distance cells everywhere) and «Устойчивость и баланс» (handstands, planches, balance boards, single-leg stands, bosu — 43 exercises gathered from other groups); an in-place boot migration re-maps existing devices without touching names/technique/trainer edits; (3) BOTH warm-up AND cardio exercises now account for work TIME: the remaining 88 warm-up drills render time-first rows (время·вес·повторы) in the builder, live workout and portal, chain hold times on «done», and get the time-unit chip — same as stretching
// v134: c107 — (1) SUPERSET ✓ SYNC: checking a set on one exercise now checks the SAME set index on its superset partners in BOTH the trainer live workout and the trainee portal (unchecking mirrors too, prev-chaining included), «Сделал всё» lands on the partners, add/remove set keep the pair at the same set count, and every session start equalizes a superset run to its max set count — the pair always finishes together, rest timer starts once; (2) FONT-SCALE ADAPTIVITY: flex/grid children may now shrink below their content minimum (min-width:0 — scroll strips keep the old behavior), the Workouts/Tools/Nutrition/Analytics tab bars, the screen header rows and the top bar (lang/A±/theme/lock) wrap instead of pushing buttons off-screen, and from A3+ (scale ≥1.3) whitespace-nowrap utilities are released and long words may break instead of bleeding out of their chip — the Tools MAINTENANCE card no longer crosses its parent card; (3) a template saved from a PROGRAM now also stores a flattened exercise list and every template reader (card counter, apply picker, start) falls back to flattening workout_days — «0 упражнения · 0 подходов» and empty apply fixed, old broken templates self-heal on read; (4) the obsolete «Гипертрофия» goal badge is gone from client cards, the profile hero, the exported PDF header, both generator previews and the portal header subtitle (groupings are Спортзал/Друзья/Семья since c105)
// v136: c109 — PANEL TEXTURE: new settings section «Текстура панели» under Texture effects — glass textures applied to panels INSIDE modal windows (frosted / clear / tinted / multicolor mosaic, each with its own shade palette + transparency scale + live preview). Scoped via body[data-ptex]: the modal dialog panel, inner cards (inputs excluded for readability), JS confirm dialogs and the preview tile; theme-aware base colors, trilingual UI, persisted in IndexedDB settings.panelTexture.
// v135: c108 — SAVE SLOTS cross-device fix: loading a slot saved on ANOTHER device failed with «Ячейка пуста» whenever the snapshot had empty stores (e.g. «Планы 0» + empty templates — two stores both serialize to '[]' → identical content hash → the old parts query matched the OTHER stores' chunks too → JSON got '[][][]' → parse error silently reported as empty slot; the cloud copy was FINE all along). The slot fetch now reads chunks by their deterministic doc id (name__hash_p — cannot collide), keeps a full-parts scan as self-heal (holes, stale pointers after an interrupted save, legacy metas without store_parts — already-broken slots load again WITHOUT re-saving), a truly missing chunk now reports a loud cloud error instead of the misleading «empty» toast, and a failed restore no longer pretends the slot was empty; new trilingual toasts fetchFailed/restoreFailed
// v137: c110 — PANEL TEXTURE × TEXTURE EFFECTS fixes (user report 2026-09-20): (1) enabling any «Текстура панели» option silently RESET «Текстурные эффекты» to «Нет» — the tex click handler was bound to ALL .texture-btn elements, so the 5 ptex buttons ran texApply(null) and persisted 'none'; binding is now scoped to .texture-btn[data-tex]; (2) the two systems CANCELED each other inside modal windows (ptex !important overrode the tex pattern) — a combined rule now STACKS the glass gradients over the material pattern over the translucent glass base on every modal panel, inner card, JS confirm dialog AND the settings preview tile, so both effects render together; (3) «Frosted glass» was indistinguishable from the app's default glass (surface @ .72 + blur 16px) — it now carries a white frost-grain signature layer (feTurbulence SVG) and a milkier band (0.97→0.64); «Clear glass» is now clearly more see-through at every slider position (0.42→0.12, was 0.8→0.26 which overlapped the default) with sharper diagonal reflection streaks and 9px blur; preview swatches updated
// v139: c112 — PANEL TEXTURE round 3 (user report 2026-09-21): (1) the transparency slider finally reshapes the REAL panels — alpha sweeps widened (frost 0.97→0.42, clear 0.40→0.08, tint 0.98→0.45, mosaic 0.90→0.32), blur now FOLLOWS the slider (a clearer pane is also a less-frosted one: frost 18→8px, tint 14→7px, mosaic 9→4px, clear 10→4px) and the decorative layers (frost grain, sheens, washes) fade as the glass clears; (2) READABILITY: every textured panel adds an inherited text-shadow halo in the page-background color (neutralizes busy cells + see-through bleed in both themes), muted text is lifted toward the theme text color while glass is on (--c-muted recomputed on theme switch), inner cards carry higher alpha floors (+0.10…+0.20) so the text carriers stay solid, mosaic cells softened (fill .55, fewer sparkles, lighter grout) and laid under a surface-colored veil so the pattern melts into a wash; (3) TINTED GLASS redesigned — deep uniform color wash + two polished diagonal sheens + crisp top gloss + soft bottom depth + lightened glass-rim border (was a murky black-bottom gradient); (4) the texture now covers the left «Рабочая область» aside (main material), the top header and the mobile bottom nav (inner material) — plain AND combined with texture effects; preview hint updated in RU/EN/HE (every app panel, not only modal windows)
// v140: c113 — PANEL TEXTURE comes to the CLIENT PORTAL (client.html) — the same engine as the trainer app (c109→c112): «Текстура панели» section in the portal settings sheet with 4 glass textures (frosted / clear / tinted / multicolor mosaic) × per-texture shade palettes × transparency scale (10–100%, default 55%) + live preview on a checkerboard demo backdrop; materials cover every portal panel — .glass cards, .glass-strong header / bottom nav / login card, .bg-surface-2 chips (inputs stay opaque), modal & unit-sheet roots (denser main material + tinted rim), theme menu and sticky modal headers; texture EFFECTS keep running through the glass (overlay shows through translucent panels; .bg-surface-2 chips stack the tex pattern beneath the ptex layers via a combined rule; click handlers scoped so neither system can wipe the other); readability halo + muted-text lift while glass is on; persisted in localStorage dk_portal_ptex; trilingual (38 new keys × ru/en/he)
// v145: c118 — POLISH & QA round (code audit, zero mechanic changes): (1) the workout REPORT modal (shown after every finished workout) was visually broken — its inline styles used var(--surface/--border/--text/--muted/--success), CSS variables that don't exist in the trainer app (only --c-*), so the panel was TRANSPARENT with a raw currentColor border and the green Share button invisible on light themes — everything now uses rgb(var(--c-*)); (2) iOS standalone top safety: the sticky header, the offline banner and the toast container respected viewport-fit=cover but not env(safe-area-inset-top) — header/banner/toasts painted under the notch; toasts also lived at z-50 INVISIBLE behind exercise-modal/viewer/body-map/program-changes overlays (now z-150; portal: toast 140, unlock 150 + bottom-sheet env-bottom for exercise/report modals); (3) XSS hardening: the food-detail image slot injected food.image_url unescaped (user-editable + OpenFoodFacts field); (4) trilingual sweeps: WhatsApp portal invite, AI-settings statuses (save/test/no-url/ok/no-response), QR-too-big hint, PWA install + Google Drive hints now use t() (9 new keys × ru/en/he — parity 1502/1502/1502), the two update banners gained their missing Hebrew line; (5) live-workout hit-slop: invisible +6px ring on the two smallest targets (✓ done-check 28×28, × remove-set 20×28) — taps during a sweaty set land instead of missing; (6) hygiene: 5 leftover console.log removed, the build-freshness banner no longer stacks on the SW-update banner, client.html got try/catch around the two bare JSON.parse in the finish flow, share texts use the UI locale instead of hardcoded ru-RU, the portal's exercise-modal «Искать на YouTube»/«Техника» labels + check-in placeholder finally localize (dead data-i18n attrs), plan chips use t('diaryKcal') (+missing space), manifest theme/background aligned to the real #0a0a0f + id field, index redirect keeps search+hash; update-banner texts got their missing Hebrew line
// v144: c117 — LIVE WORKOUT: superset apply/cancel + «save changes to the program?» (user request 2026-09-21: «в live-тренировке должно быть можно применить суперсет или отменить… изменение упражнения (замена, добавление, количество подходов) должно сохраняться, когда даёшь согласие»): (1) every live-workout exercise card gets a ⚡ toggle (same semantics as the program builder — marks THIS exercise + the NEXT one as superset partners, toggling off clears both; partners re-equalized to the same set count so the c107 ✓-sync keeps working; tapping ⚡ on the last exercise explains a superset needs the NEXT one); (2) structural edits during the session are tracked (exercises added/removed/replaced, set counts, superset toggles — logged weights/reps/RPE stay history-only); (3) on FINISH → report → «Сохранить», if the session was started FROM a client program day and the structure actually differs from it, a Да/Нет dialog asks «Сохранить изменения упражнений в программе?» with change chips — YES writes the new structure into that program day (exercise list + order + set counts + superset flags; prescriptions survive 1:1 for kept exercises, new/replaced ones get blank prescriptions with the live set count), NO leaves the program untouched; the workout is logged either way; trilingual UI (12 new keys)
// v143: c116 — «APPLY TEMPLATE» now produces the client's WORKING PROGRAM (user report 2026-09-21: «создал клиента и не могу применить к нему шаблон… Делаешь „применить шаблон“, он открывает его, но сохранить как рабочую программу этого человека ты не можешь»): the profile-screen «Apply template» picker no longer just starts a throwaway live-workout session (which saved nothing) — clicking a template now opens the PROGRAM BUILDER prefilled from that template and the trainer presses the existing «Save program» button to store it in client_programs as the client's active program; templates saved from a program restore 1:1 (workout_days + split_type + duration_months + rest days + supersets + per-exercise units), flat templates saved from a live workout land in Day A of a full-body split; new trilingual toast programs.fromTemplateLoaded; the generator's «start workout from generated day» and the Templates-tab quick-start flows are unchanged
// v142: c115 — PANEL TEXTURE reaches the trainer's LIVE WORKOUT (user report: «Текстура панели не применяется в live-тренировке в режиме тренера, хотя она применяется в портале подопечного»): since c103 the live-workout exercise cards are built on the .glass class (portal design base), but the trainer's ptex rules covered only .bg-surface / .bg-surface-2 / header.glass / #bottom-nav — so the dominant panels of the live-workout screen (every exercise card with its set grid) stayed flat while the portal's IDENTICAL .glass cards got the texture. .glass / .glass-2 are now INNER-material panels (same coverage the portal has had since c113), they join the text-contrast halo rule too; the superset amber highlight follows the portal's behavior (glass over the faint 7% accent wash, functional amber border + glow survive because the INNER material never repaints border-color); texture effects remain background-only (two separate systems, c114 untouched)
// v141: c114 — tex × ptex are now TWO SEPARATE SYSTEMS (user report 2026-09-21: «убрать текстурные эффекты из текстурных панелей… Панели не просто прозрачные или матовые стекла, как я просил, но у них подключены текстурные эффекты, которые там не должны быть»): (1) texture EFFECTS no longer paint ON panels — the c79 «panel/card layer» that blended var(--texture) into every .bg-surface / .bg-surface-2 card is removed from BOTH apps; effects live only on #dk-tex-overlay (the page background behind the panels), so a wood/marble/church-window effect never leaks INTO a card again; (2) the c110/c111/c113 «combine» rules that stacked the effect pattern BENEATH the panel glass (app-wide in the trainer, .bg-surface-2 chips in the portal) are removed — a panel with «Текстура панели» is now PURE glass (frosted / clear / tinted / mosaic), regardless of the page background effect; the two systems decorate different layers and never mix inside one element (click isolation from c110 kept: neither selection can wipe the other); (3) hints updated in RU/EN/HE (trainer settings.ptexHint via src/i18n, portal ptexHint): «Панели остаются чистым стеклом — текстурные эффекты живут только на фоне страницы» / «Panels stay pure glass — texture effects live only on the page background»
const CACHE_NAME = 'dk-gym-v145'; // c118
// v104: c77 — UI sizes can no longer change themselves (zoom-based gif/food/cards, wheel/touch slider guards) + hard pre-login lock (Add Client included) + header theme quick menu with all 33 themes
// v103: c76 — Exercise DB tab = exact Quick Pick copy (star/eye/+ cards, favorites/recent tabs, View grouping, localized map tabs)
// v102: c75 — 3D atlas 1.5x + Settings ▸ UI sizes (atlas slider, bodymap/exercise-panel fixes) + Exercise DB tab rebuilt as picker-style browse
// v100: c73 sidebar Atlas above Settings + atlas auth-gated (no open before login)
// v99: c72 atlas subgroup filter — MSUB muscle→sE (Upper/Lower chest, Lats, Rotator Cuff…) passed into Exercise DB body-map filter
// v98: c71 i18n race — plans badge t() at render + delayed applyI18n pass for async renders
// v96: c69 x-ray ghost = dark glass shell (colour dimming)
// v95: c68 atlas peeling — hide / x-ray ghost / isolate / restore-all
// v94: c67 atlas «Показать упражнения» + technical meshes off tap
// v93: c66 3D Body Atlas (Z-Anatomy model, lazy-loaded)
// v92: c65 muscle-icons round 2 (trapezius/triceps/adductors/abductors/middle-back)
const APP_SHELL = [
  './',
  './index.html',
  './fitness-crm.html',
  './client.html',
  './exercise-db.json',
  './food-db.json',
  './manifest.json',
  './assets/manifest.json',
  './vendor/qrcode.min.js',
  './icon-192.png',
  './icon-512.png',
  './logo-web.webp',
  './assets/logo-web.webp',
  './assets/icon-192.png',
  './assets/icon-512.png',
  './src/i18n/en.json',
  './src/i18n/ru.json',
  './src/i18n/he.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;
  if (url.origin !== self.location.origin) {
    event.respondWith(
      fetch(req).catch(() =>
        caches.match(req).then((cached) =>
          cached || new Response('', { status: 503 })
        )
      )
    );
    return;
  }

  // HTML / navigations: NETWORK-FIRST with cache fallback (offline support).
  const isHtml = req.mode === 'navigate'
    || (req.headers.get('accept') || '').includes('text/html')
    || /\.html?$/.test(url.pathname);

  if (isHtml) {
    event.respondWith(
      fetch(req).then((res) => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
        }
        return res;
      }).catch(() =>
        caches.match(req).then((cached) => cached || caches.match('./index.html'))
      )
    );
    return;
  }

  // c81: dictionaries / small JSON — NETWORK-FIRST. They gate the labels of
  // new screens; stale-while-revalidate kept serving an old dict against the
  // new HTML for a whole release cycle (every new label rendered blank until
  // the waiting SW finally activated).
  const isDict = /\.json($|\?)/i.test(url.pathname) || url.pathname.indexOf('/src/i18n/') !== -1;
  if (isDict) {
    event.respondWith(
      fetch(req).then((res) => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
        }
        return res;
      }).catch(() =>
        caches.match(req).then((cached) => cached || Response.error())
      )
    );
    return;
  }

  // Static assets: cache-first, refresh in background (stale-while-revalidate)
  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req).then((res) => {
        if (res.ok && res.type === 'basic') {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
        }
        return res;
      }).catch(() => cached);
      return cached || network;
    })
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
