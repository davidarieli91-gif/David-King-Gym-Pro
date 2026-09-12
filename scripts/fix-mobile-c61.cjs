#!/usr/bin/env node
/* ============================================================
   c61 — MOBILE RESPONSIVE FIXES (fitness-crm.html + client.html)
   Только UI/CSS. Данные (exercise-db.json) не трогаем: seed/BUST не бампим.
   ============================================================ */
const fs = require('fs');

const CRM = '/home/z/David-King-Gym-Pro/fitness-crm.html';
const CLIENT = '/home/z/David-King-Gym-Pro/client.html';

let crm = fs.readFileSync(CRM, 'utf8');
const crm0 = crm;
let cli = fs.readFileSync(CLIENT, 'utf8');
const cli0 = cli;

const results = [];
let failed = false;

function rep(obj, name, from, to) {
  const i = obj.s.indexOf(from);
  if (i < 0) { results.push(`FAIL  ${name}: NOT FOUND`); failed = true; return; }
  if (obj.s.indexOf(from, i + 1) >= 0) { results.push(`FAIL  ${name}: NOT UNIQUE`); failed = true; return; }
  obj.s = obj.s.slice(0, i) + to + obj.s.slice(i + from.length);
  results.push(`OK    ${name}`);
}

const C = { get s() { return crm; }, set s(v) { crm = v; } };
const L = { get s() { return cli; }, set s(v) { cli = v; } };

/* ---------- fitness-crm.html ---------- */

// 1a. Bottom live actions: add id
rep(C, 'live bottom bar id',
  '<div class="flex gap-2 mt-6 pb-4">',
  '<div id="live-bottom-actions" class="flex gap-2 mt-6 pb-4">');

// 1b. CSS block after .lw-rpe-vol
const liveCssAnchor = '.lw-rpe-vol { margin-inline-start: auto; font-family: monospace; font-size: 10px; font-weight: 700; color: var(--muted); white-space: nowrap; }';
rep(C, 'live/rpe css block', liveCssAnchor, liveCssAnchor + `

    /* ===== c61 MOBILE RESPONSIVE FIXES =====
       1) Live set table must fit the card: number inputs shrink, columns compact. */
    #live-workout-exercises th, #live-workout-exercises td { padding-left: 4px; padding-right: 4px; }
    #live-workout-exercises td:first-child { padding-left: 6px; }
    #live-workout-exercises input[type="number"] { min-width: 0; width: 100%; }
    /* 2) Bottom actions: two buttons share the row, Finish gets a full row (mobile only). */
    #live-bottom-actions { flex-wrap: wrap; }
    @media (max-width: 640px) {
      #live-bottom-actions > button { flex: 1 1 40%; }
      #live-bottom-actions > #live-workout-finish { flex-basis: 100%; }
    }
    /* 3) RPE strip: keep 10 circles + volume inside the card on narrow screens. */
    @media (max-width: 430px) {
      .lw-rpe-btn { width: 20px; height: 20px; font-size: 8.5px; }
      .lw-rpe-row { gap: 2px; }
    }
    /* 4) Exercise picker toolbar (View + count): count wraps instead of overflow. */
    #bm-view-toolbar { flex-wrap: wrap; row-gap: 2px; }
    #bm-view-toolbar #bm-result-count { margin-inline-start: auto; }
    /* 5) Client Photos/Documents header: controls wrap to the next line. */
    #client-photos-header { flex-wrap: wrap; row-gap: 0.5rem; }
    /* 6) Recovery map header: tabs wrap below the title instead of overlapping it. */
    #recovery-map-modal .rm-head-row { flex-wrap: wrap; row-gap: 0.5rem; }`);

// 3. Food DB source group: wrap inside its frame
rep(C, 'food db source group wrap',
  '<div class="flex gap-1 bg-surface-2 border border-border rounded-lg p-1 shrink-0">',
  '<div id="food-db-source-group" class="flex flex-wrap gap-1 bg-surface-2 border border-border rounded-lg p-1 shrink-0 min-w-0">');

// 5. Client Photos header id — anchor is a JS template with newlines:
// find t('client.photos'), then the opening div right before its <h3>
{
  const ip = crm.indexOf("t('client.photos')");
  const A = '<div class="flex items-center gap-2 mb-4">';
  if (ip < 0) { results.push('FAIL  photos header id: photos template NOT FOUND'); failed = true; }
  else {
    const j = crm.lastIndexOf(A, ip);
    const between = j < 0 ? 'x' : crm.slice(j + A.length, ip);
    if (j < 0 || between.includes('<div') || between.length > 300) {
      results.push('FAIL  photos header id: anchor div not adjacent'); failed = true;
    } else {
      crm = crm.slice(0, j) + '<div id="client-photos-header" class="flex items-center gap-2 mb-4">' + crm.slice(j + A.length);
      results.push('OK    photos header id');
    }
  }
}

// 6. Recovery map header row: add rm-head-row class (first occurrence AFTER the modal opening)
{
  const im = crm.indexOf('id="recovery-map-modal"');
  const A = '<div class="p-4 border-b border-border flex items-center gap-3 shrink-0">';
  const ia = im < 0 ? -1 : crm.indexOf(A, im);
  if (im < 0 || ia < 0) { results.push('FAIL  recovery map header row: NOT FOUND'); failed = true; }
  else {
    crm = crm.slice(0, ia) + '<div class="rm-head-row p-4 border-b border-border flex items-center gap-3 shrink-0">' + crm.slice(ia + A.length);
    results.push('OK    recovery map header row');
  }
}

/* ---------- client.html ---------- */

rep(L, 'portal header wrap',
  '<header class="sticky top-0 z-40 glass-strong px-4 py-3 flex items-center justify-between">',
  '<header class="sticky top-0 z-40 glass-strong px-4 py-3 flex flex-wrap items-center justify-between gap-y-2">');
rep(L, 'portal header name width',
  'class="font-display font-bold text-sm leading-tight truncate max-w-[160px]"',
  'class="font-display font-bold text-sm leading-tight truncate max-w-[160px] max-[379px]:max-w-[110px]"');
rep(L, 'portal header goal width',
  'class="text-[11px] text-muted truncate max-w-[160px]"',
  'class="text-[11px] text-muted truncate max-w-[160px] max-[379px]:max-w-[110px]"');

/* ---------- report & write ---------- */
const report = results.join('\n');
fs.writeFileSync('/home/z/my-project/fix-mobile-c61-report.txt', report + '\n');
if (failed) {
  console.error(report);
  console.error('\n!!! FAILURES — files NOT written');
  process.exit(1);
}
fs.writeFileSync(CRM, crm);
fs.writeFileSync(CLIENT, cli);
console.log(report);
console.log('\nWROTE:', CRM, `(delta ${crm.length - crm0.length} chars)`);
console.log('WROTE:', CLIENT, `(delta ${cli.length - cli0.length} chars)`);
