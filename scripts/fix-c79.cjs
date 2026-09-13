#!/usr/bin/env node
/* c79 — Texture Effects 2.0
   - 22 tiles: none + glass/plastic/gloss/metal (rebuilt) + wood/parquet/marble/tile/brick/mosaic/pebbles/asphalt + water/swamp/grass/hay/snow/bubbles + film/vhs/church-window
   - Professional panel: live pattern preview swatches, category sections, active badge, opacity % readout + Reset-to-default
   - Opacity slider FIXED (two root causes):
       (1) per-effect body rules overrode the html-inline --texture-opacity → now per-effect --texture-opacity-def + body-scoped user override
       (2) texture lived on body::after which dozens of themes override with their own decorations → dedicated #dk-tex-overlay div
   - Version: RUNNING=79, sw dk-gym-v106 */
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const FILE = path.join(ROOT, 'fitness-crm.html');

let html = fs.readFileSync(FILE, 'utf8');
let fails = [];

function count(sub) { let n = 0, i = 0; while ((i = html.indexOf(sub, i)) !== -1) { n++; i += sub.length; } return n; }

function sliceReplace(name, startAnchor, endAnchor, replacement) {
  const s = html.indexOf(startAnchor);
  if (s === -1) { fails.push(name + ': START anchor not found'); return; }
  if (html.indexOf(startAnchor, s + 1) !== -1) { fails.push(name + ': START anchor not unique'); return; }
  const e = html.indexOf(endAnchor, s + startAnchor.length);
  if (e === -1) { fails.push(name + ': END anchor not found'); return; }
  if (html.indexOf(endAnchor, e + 1) !== -1) { fails.push(name + ': END anchor not unique'); return; }
  html = html.slice(0, s) + replacement + html.slice(e);
  console.log('OK  ' + name + ' (replaced ' + (e - s) + ' chars)');
}

/* ---------- SVG data-URI helper (quoted url, encode whitespace < > #) ---------- */
function svg(s) {
  const enc = s
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/ {2,}/g, ' ')
    .replace(/</g, '%3C').replace(/>/g, '%3E').replace(/#/g, '%23')
    .replace(/ /g, '%20');
  return 'url("data:image/svg+xml,' + enc + '")';
}
const A = "xmlns='http://www.w3.org/2000/svg'";

/* ---------- 21 effect patterns ---------- */

const SVG_WOOD = `<svg ${A} width='120' height='120'>
<g fill-opacity='.14'><rect width='40' height='120' fill='#8a5a2e'/><rect x='40' width='40' height='120' fill='#a06a36'/><rect x='80' width='40' height='120' fill='#7c4f28'/></g>
<g fill='none' stroke-linecap='round'>
<path d='M8 0Q12 30 7 60T10 120' stroke='#5e3c1c' stroke-opacity='.5' stroke-width='1.1'/>
<path d='M20 0Q16 40 22 70T18 120' stroke='#6b4522' stroke-opacity='.45' stroke-width='.8'/>
<path d='M32 0Q35 25 30 55T33 120' stroke='#5e3c1c' stroke-opacity='.4' stroke-width='.7'/>
<path d='M48 0Q44 35 50 65T46 120' stroke='#6b4522' stroke-opacity='.45' stroke-width='1'/>
<path d='M62 0Q66 28 60 58T64 120' stroke='#5e3c1c' stroke-opacity='.5' stroke-width='.8'/>
<path d='M74 0Q70 42 76 72T72 120' stroke='#6b4522' stroke-opacity='.4' stroke-width='.7'/>
<path d='M88 0Q92 30 86 60T90 120' stroke='#5e3c1c' stroke-opacity='.5' stroke-width='1'/>
<path d='M102 0Q98 36 104 66T100 120' stroke='#6b4522' stroke-opacity='.45' stroke-width='.8'/>
<path d='M114 0Q117 26 112 56T115 120' stroke='#5e3c1c' stroke-opacity='.4' stroke-width='.7'/></g>
<path d='M40 0V120M80 0V120' stroke='#3f2a12' stroke-opacity='.45' stroke-width='1.6'/>
</svg>`;

const SVG_PARQUET = `<svg ${A} width='80' height='80'>
<g fill-opacity='.16'><rect width='40' height='40' fill='#a5713d'/><rect x='40' y='40' width='40' height='40' fill='#a5713d'/><rect x='40' width='40' height='40' fill='#8a5a2e'/><rect y='40' width='40' height='40' fill='#8a5a2e'/></g>
<g stroke='#5e3c1c' stroke-opacity='.4' stroke-width='1'>
<path d='M10 0V40M20 0V40M30 0V40'/><path d='M50 40V80M60 40V80M70 40V80'/>
<path d='M0 50H40M0 60H40M0 70H40'/><path d='M40 10H80M40 20H80M40 30H80'/></g>
<path d='M40 0V80M0 40H80' stroke='#3f2a12' stroke-opacity='.5' stroke-width='1.4'/>
</svg>`;

const SVG_MARBLE = `<svg ${A} width='200' height='200'>
<g fill='none' stroke='#7d8894'>
<path d='M-10 30Q40 20 70 45T140 60T215 50' stroke-width='2.4' stroke-opacity='.38'/>
<path d='M-10 34Q42 26 72 50T142 66T215 58' stroke-width='1' stroke-opacity='.22'/>
<path d='M-10 120Q50 100 90 128T170 140T215 128' stroke-width='2' stroke-opacity='.32'/>
<path d='M20 215Q35 160 70 150T120 110' stroke-width='1.4' stroke-opacity='.26'/>
<path d='M100 -10Q110 40 150 55T210 90' stroke-width='1.6' stroke-opacity='.3'/>
<path d='M-10 180Q60 170 110 190T210 185' stroke-width='1' stroke-opacity='.2'/>
<path d='M150 215Q160 170 190 150' stroke-width='1.2' stroke-opacity='.24'/></g>
<g fill='none' stroke='#b8c2cc'>
<path d='M70 45Q85 70 75 95' stroke-width='.8' stroke-opacity='.3'/>
<path d='M90 128Q105 145 100 165' stroke-width='.7' stroke-opacity='.26'/>
<path d='M150 55Q165 70 160 85' stroke-width='.7' stroke-opacity='.24'/></g>
</svg>`;

const SVG_TILE = `<svg ${A} width='96' height='96'>
<g><rect x='3' y='3' width='42' height='42' fill='#e8f4f6' fill-opacity='.2'/><rect x='51' y='3' width='42' height='42' fill='#cfe8ec' fill-opacity='.16'/><rect x='3' y='51' width='42' height='42' fill='#cfe8ec' fill-opacity='.16'/><rect x='51' y='51' width='42' height='42' fill='#e8f4f6' fill-opacity='.2'/></g>
<g fill='none' stroke-width='2'>
<path d='M3 45V3H45' stroke='#ffffff' stroke-opacity='.5'/><path d='M45 3V45H3' stroke='#25505a' stroke-opacity='.35'/>
<path d='M51 45V3H93' stroke='#ffffff' stroke-opacity='.5'/><path d='M93 3V45H51' stroke='#25505a' stroke-opacity='.35'/>
<path d='M3 93V51H45' stroke='#ffffff' stroke-opacity='.5'/><path d='M45 51V93H3' stroke='#25505a' stroke-opacity='.35'/>
<path d='M51 93V51H93' stroke='#ffffff' stroke-opacity='.5'/><path d='M93 51V93H51' stroke='#25505a' stroke-opacity='.35'/></g>
<g fill='#ffffff' fill-opacity='.15'><path d='M6 6H20L6 20Z'/><path d='M54 6H68L54 20Z'/><path d='M6 54H20L6 68Z'/><path d='M54 54H68L54 68Z'/></g>
</svg>`;

const SVG_MOSAIC = `<svg ${A} width='80' height='80'>
<g stroke='#1c2430' stroke-opacity='.45' stroke-width='1'>
<rect x='1' y='1' width='16' height='12' fill='#c0392b' fill-opacity='.45' transform='rotate(-4 9 7)'/>
<rect x='20' y='1' width='16' height='12' fill='#e6a817' fill-opacity='.5' transform='rotate(3 28 7)'/>
<rect x='39' y='1' width='16' height='12' fill='#2e6db4' fill-opacity='.45' transform='rotate(-2 47 7)'/>
<rect x='58' y='1' width='16' height='12' fill='#2e8b57' fill-opacity='.45' transform='rotate(5 66 7)'/>
<rect x='1' y='17' width='16' height='12' fill='#2e6db4' fill-opacity='.42' transform='rotate(4 9 23)'/>
<rect x='20' y='17' width='16' height='12' fill='#8e44ad' fill-opacity='.4' transform='rotate(-3 28 23)'/>
<rect x='39' y='17' width='16' height='12' fill='#e6a817' fill-opacity='.48' transform='rotate(2 47 23)'/>
<rect x='58' y='17' width='16' height='12' fill='#c0392b' fill-opacity='.42' transform='rotate(-5 66 23)'/>
<rect x='1' y='33' width='16' height='12' fill='#2e8b57' fill-opacity='.45' transform='rotate(-2 9 39)'/>
<rect x='20' y='33' width='16' height='12' fill='#d35400' fill-opacity='.45' transform='rotate(4 28 39)'/>
<rect x='39' y='33' width='16' height='12' fill='#2e6db4' fill-opacity='.4' transform='rotate(-4 47 39)'/>
<rect x='58' y='33' width='16' height='12' fill='#e6a817' fill-opacity='.46' transform='rotate(3 66 39)'/>
<rect x='1' y='49' width='16' height='12' fill='#e6a817' fill-opacity='.44' transform='rotate(2 9 55)'/>
<rect x='20' y='49' width='16' height='12' fill='#2e8b57' fill-opacity='.42' transform='rotate(-3 28 55)'/>
<rect x='39' y='49' width='16' height='12' fill='#c0392b' fill-opacity='.45' transform='rotate(5 47 55)'/>
<rect x='58' y='49' width='16' height='12' fill='#2e6db4' fill-opacity='.44' transform='rotate(-2 66 55)'/>
<rect x='1' y='65' width='16' height='12' fill='#8e44ad' fill-opacity='.38' transform='rotate(-4 9 71)'/>
<rect x='20' y='65' width='16' height='12' fill='#e6a817' fill-opacity='.5' transform='rotate(3 28 71)'/>
<rect x='39' y='65' width='16' height='12' fill='#2e8b57' fill-opacity='.42' transform='rotate(-2 47 71)'/>
<rect x='58' y='65' width='16' height='12' fill='#c0392b' fill-opacity='.44' transform='rotate(4 66 71)'/></g>
</svg>`;

const SVG_PEBBLES = `<svg ${A} width='100' height='100'>
<g stroke-width='1'>
<ellipse cx='18' cy='16' rx='13' ry='9' fill='#9aa2a8' fill-opacity='.4' stroke='#5f6a72' transform='rotate(-12 18 16)'/>
<ellipse cx='55' cy='12' rx='10' ry='7' fill='#b8a89a' fill-opacity='.38' stroke='#6e6157' transform='rotate(8 55 12)'/>
<ellipse cx='86' cy='20' rx='12' ry='8' fill='#8f9aa3' fill-opacity='.4' stroke='#565f66' transform='rotate(-5 86 20)'/>
<ellipse cx='32' cy='42' rx='11' ry='8' fill='#aab3ba' fill-opacity='.36' stroke='#667077' transform='rotate(14 32 42)'/>
<ellipse cx='68' cy='45' rx='14' ry='10' fill='#9b8f83' fill-opacity='.38' stroke='#5c554d' transform='rotate(-8 68 45)'/>
<ellipse cx='8' cy='70' rx='10' ry='7' fill='#a39a8e' fill-opacity='.36' stroke='#615a51' transform='rotate(6 8 70)'/>
<ellipse cx='42' cy='75' rx='13' ry='9' fill='#93a1ab' fill-opacity='.4' stroke='#57636c' transform='rotate(-10 42 75)'/>
<ellipse cx='80' cy='78' rx='11' ry='8' fill='#b0a496' fill-opacity='.36' stroke='#6a6156' transform='rotate(12 80 78)'/></g>
<g stroke='#ffffff' stroke-opacity='.45' fill='none' stroke-width='1.2' stroke-linecap='round'>
<path d='M10 13Q17 9 25 12'/><path d='M48 9Q54 7 61 9'/><path d='M24 39Q31 35 40 38'/>
<path d='M58 41Q66 37 78 40'/><path d='M33 71Q41 67 52 70'/><path d='M72 74Q79 71 88 74'/></g>
</svg>`;

const SVG_ASPHALT = `<svg ${A} width='140' height='140'>
<filter id='r'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' seed='7' stitchTiles='stitch'/><feColorMatrix type='matrix' values='0 0 0 0 0.05  0 0 0 0 0.05  0 0 0 0 0.06  0.85 0 0 0 0'/></filter>
<rect width='140' height='140' filter='url(#r)'/>
<filter id='w'><feTurbulence type='fractalNoise' baseFrequency='0.5' numOctaves='2' seed='23' stitchTiles='stitch'/><feColorMatrix type='matrix' values='0 0 0 0 0.62  0 0 0 0 0.63  0 0 0 0 0.65  0.5 0 0 0 0'/></filter>
<rect width='140' height='140' filter='url(#w)' opacity='.5'/>
<g fill='#788088' fill-opacity='.4'><ellipse cx='22' cy='30' rx='3' ry='2'/><ellipse cx='90' cy='18' rx='2.4' ry='1.7'/><ellipse cx='120' cy='66' rx='3' ry='2'/><ellipse cx='48' cy='84' rx='2.6' ry='1.8'/><ellipse cx='14' cy='110' rx='2.8' ry='2'/><ellipse cx='104' cy='122' rx='3.2' ry='2.1'/></g>
</svg>`;

const SVG_WATER = `<svg ${A} width='160' height='90'>
<g fill='none' stroke-linecap='round'>
<path d='M0 18Q20 8 40 18T80 18T120 18T160 18' stroke='#8fd8ea' stroke-opacity='.5' stroke-width='2.2'/>
<path d='M0 24Q20 15 40 24T80 24T120 24T160 24' stroke='#5db8d4' stroke-opacity='.3' stroke-width='1.2'/>
<path d='M0 52Q20 42 40 52T80 52T120 52T160 52' stroke='#a8e4f2' stroke-opacity='.42' stroke-width='1.8'/>
<path d='M0 58Q20 49 40 58T80 58T120 58T160 58' stroke='#4da8c8' stroke-opacity='.26' stroke-width='1'/>
<path d='M0 82Q20 73 40 82T80 82T120 82T160 82' stroke='#8fd8ea' stroke-opacity='.45' stroke-width='2'/>
<path d='M-8 66Q2 62 12 66' stroke='#ffffff' stroke-opacity='.35' stroke-width='1.4'/>
<path d='M66 40Q76 36 86 40' stroke='#ffffff' stroke-opacity='.3' stroke-width='1.2'/>
<path d='M118 70Q128 66 138 70' stroke='#ffffff' stroke-opacity='.32' stroke-width='1.2'/></g>
</svg>`;

const SVG_SWAMP = `<svg ${A} width='120' height='120'>
<ellipse cx='25' cy='30' rx='20' ry='12' fill='#2f4a26' fill-opacity='.4'/>
<ellipse cx='80' cy='22' rx='24' ry='13' fill='#3a5c2e' fill-opacity='.35'/>
<ellipse cx='60' cy='62' rx='28' ry='15' fill='#26381e' fill-opacity='.42'/>
<ellipse cx='20' cy='90' rx='22' ry='13' fill='#33512a' fill-opacity='.38'/>
<ellipse cx='95' cy='95' rx='24' ry='14' fill='#2a4022' fill-opacity='.4'/>
<g stroke='#16240f' stroke-opacity='.45' fill='none' stroke-width='1.6' stroke-linecap='round'>
<path d='M18 22Q15 12 19 4'/><path d='M26 24Q27 14 24 6'/><path d='M84 16Q81 8 85 1'/>
<path d='M92 18Q94 9 91 3'/><path d='M55 55Q52 46 56 38'/><path d='M64 58Q66 48 62 40'/></g>
<g fill='#9ab84a' fill-opacity='.5'><circle cx='40' cy='70' r='1.4'/><circle cx='47' cy='66' r='1'/><circle cx='75' cy='80' r='1.3'/><circle cx='100' cy='60' r='1.1'/><circle cx='12' cy='52' r='1.2'/><circle cx='90' cy='40' r='1'/><circle cx='35' cy='105' r='1.3'/><circle cx='68' cy='100' r='1'/></g>
<g stroke='#c8e08a' stroke-opacity='.3' stroke-width='1' stroke-linecap='round' fill='none'>
<path d='M30 28Q40 24 50 27'/><path d='M70 60Q80 56 92 60'/></g>
</svg>`;

const SVG_CHURCH = `<svg ${A} width='130' height='170'>
<path d='M30 170V70Q30 26 65 22Q100 26 100 70V170Z' fill='#3b2a55' fill-opacity='.28'/>
<path d='M30 70Q30 26 65 22L65 60Z' fill='#2e6db4' fill-opacity='.4'/>
<path d='M65 22Q100 26 100 70L65 60Z' fill='#c0392b' fill-opacity='.4'/>
<circle cx='65' cy='52' r='13' fill='#e6a817' fill-opacity='.5'/>
<path d='M30 92H100L92 122H38Z' fill='#2e8b57' fill-opacity='.35'/>
<path d='M38 122H92L84 150H46Z' fill='#8e44ad' fill-opacity='.32'/>
<path d='M30 70L38 92H30Z' fill='#d35400' fill-opacity='.35'/>
<path d='M100 70L100 92L92 92Z' fill='#d35400' fill-opacity='.35'/>
<g fill='none' stroke='#26202e' stroke-width='3' stroke-opacity='.75' stroke-linejoin='round'>
<path d='M30 170V70Q30 26 65 22Q100 26 100 70V170'/>
<circle cx='65' cy='52' r='13'/>
<path d='M65 22V170'/>
<path d='M30 92H100M38 122H92M46 150H84'/>
<path d='M30 70Q48 82 65 92M100 70Q82 82 65 92'/>
<path d='M38 92Q52 106 65 122M92 92Q78 106 65 122'/></g>
<g stroke='#ffffff' stroke-opacity='.3' stroke-width='1.6' fill='none' stroke-linecap='round'>
<path d='M40 40Q47 30 58 27'/><path d='M36 100H56'/></g>
</svg>`;

const SVG_FILM = `<svg ${A} width='120' height='72'>
<filter id='g'><feTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' seed='4' stitchTiles='stitch'/><feColorMatrix type='matrix' values='0 0 0 0 0.1  0 0 0 0 0.09  0 0 0 0 0.08  0.5 0 0 0 0'/></filter>
<rect width='120' height='72' filter='url(#g)' opacity='.55'/>
<g fill='#141414' fill-opacity='.5'><rect width='120' height='9'/><rect y='63' width='120' height='9'/></g>
<g fill='#f5f2e8' fill-opacity='.55'>
<rect x='6' y='2.5' width='6' height='4' rx='1'/><rect x='26' y='2.5' width='6' height='4' rx='1'/><rect x='46' y='2.5' width='6' height='4' rx='1'/><rect x='66' y='2.5' width='6' height='4' rx='1'/><rect x='86' y='2.5' width='6' height='4' rx='1'/><rect x='106' y='2.5' width='6' height='4' rx='1'/>
<rect x='6' y='65.5' width='6' height='4' rx='1'/><rect x='26' y='65.5' width='6' height='4' rx='1'/><rect x='46' y='65.5' width='6' height='4' rx='1'/><rect x='66' y='65.5' width='6' height='4' rx='1'/><rect x='86' y='65.5' width='6' height='4' rx='1'/><rect x='106' y='65.5' width='6' height='4' rx='1'/></g>
<path d='M97 9V63' stroke='#ffffff' stroke-opacity='.14' stroke-width='1'/>
<path d='M31 9V63' stroke='#ffffff' stroke-opacity='.08' stroke-width='.8'/>
</svg>`;

const SVG_VHS_BAND = `<svg ${A} width='160' height='150'>
<filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.6' numOctaves='2' seed='9' stitchTiles='stitch'/><feColorMatrix type='matrix' values='0 0 0 0 0.9  0 0 0 0 0.92  0 0 0 0 0.95  0.65 0 0 0 0'/></filter>
<rect width='160' height='26' filter='url(#n)'/>
</svg>`;

const SVG_GRASS = `<svg ${A} width='90' height='90'>
<g fill='none' stroke-linecap='round'>
<path d='M6 92Q2 45 8 -2' stroke='#3e7d32' stroke-opacity='.55' stroke-width='2'/>
<path d='M15 92Q19 48 14 0' stroke='#57a33e' stroke-opacity='.5' stroke-width='1.6'/>
<path d='M24 92Q20 44 26 -2' stroke='#2f6627' stroke-opacity='.55' stroke-width='2'/>
<path d='M33 92Q37 50 32 0' stroke='#6dbb4a' stroke-opacity='.45' stroke-width='1.4'/>
<path d='M43 92Q39 46 45 -2' stroke='#3e7d32' stroke-opacity='.5' stroke-width='2'/>
<path d='M52 92Q56 48 51 0' stroke='#57a33e' stroke-opacity='.5' stroke-width='1.6'/>
<path d='M62 92Q58 42 64 -2' stroke='#2f6627' stroke-opacity='.5' stroke-width='2'/>
<path d='M71 92Q75 50 70 0' stroke='#6dbb4a' stroke-opacity='.42' stroke-width='1.4'/>
<path d='M81 92Q77 46 83 -2' stroke='#3e7d32' stroke-opacity='.5' stroke-width='1.8'/>
<path d='M88 92Q91 52 87 2' stroke='#57a33e' stroke-opacity='.45' stroke-width='1.4'/></g>
<g fill='#a8d878' fill-opacity='.5'><ellipse cx='8' cy='3' rx='1.1' ry='2.4'/><ellipse cx='26' cy='2' rx='1.1' ry='2.4'/><ellipse cx='45' cy='3' rx='1.1' ry='2.4'/><ellipse cx='64' cy='2' rx='1.1' ry='2.4'/><ellipse cx='83' cy='3' rx='1' ry='2.2'/></g>
</svg>`;

const SVG_HAY = `<svg ${A} width='90' height='90'>
<g stroke-linecap='round' fill='none'>
<path d='M6 12L22 8' stroke='#d9b45c' stroke-opacity='.6' stroke-width='1.6'/>
<path d='M40 4L52 14' stroke='#c9a24a' stroke-opacity='.55' stroke-width='1.3'/>
<path d='M70 10L86 6' stroke='#e6c878' stroke-opacity='.6' stroke-width='1.5'/>
<path d='M12 28L28 34' stroke='#b08d3e' stroke-opacity='.5' stroke-width='1.2'/>
<path d='M48 26L60 20' stroke='#d9b45c' stroke-opacity='.6' stroke-width='1.6'/>
<path d='M74 30L88 36' stroke='#c9a24a' stroke-opacity='.5' stroke-width='1.2'/>
<path d='M2 48L18 44' stroke='#e6c878' stroke-opacity='.55' stroke-width='1.4'/>
<path d='M34 46L50 52' stroke='#d9b45c' stroke-opacity='.6' stroke-width='1.5'/>
<path d='M64 52L80 46' stroke='#b08d3e' stroke-opacity='.5' stroke-width='1.2'/>
<path d='M10 68L24 74' stroke='#c9a24a' stroke-opacity='.55' stroke-width='1.3'/>
<path d='M42 70L58 64' stroke='#e6c878' stroke-opacity='.6' stroke-width='1.5'/>
<path d='M70 72L86 78' stroke='#d9b45c' stroke-opacity='.55' stroke-width='1.4'/>
<path d='M20 86L36 82' stroke='#b08d3e' stroke-opacity='.5' stroke-width='1.2'/>
<path d='M52 88L66 82' stroke='#c9a24a' stroke-opacity='.5' stroke-width='1.3'/>
<path d='M80 88L90 84' stroke='#e6c878' stroke-opacity='.55' stroke-width='1.3'/>
<path d='M30 16L34 30' stroke='#d9b45c' stroke-opacity='.5' stroke-width='1.2'/>
<path d='M58 34L62 48' stroke='#b08d3e' stroke-opacity='.45' stroke-width='1.2'/>
<path d='M24 56L28 70' stroke='#e6c878' stroke-opacity='.5' stroke-width='1.2'/>
<path d='M76 58L80 70' stroke='#c9a24a' stroke-opacity='.45' stroke-width='1.2'/></g>
<g fill='#8a6d2f' fill-opacity='.5'><ellipse cx='22' cy='8' rx='1.2' ry='.8'/><ellipse cx='60' cy='20' rx='1.1' ry='.8'/><ellipse cx='50' cy='52' rx='1.2' ry='.8'/><ellipse cx='58' cy='64' rx='1.1' ry='.8'/><ellipse cx='36' cy='82' rx='1.1' ry='.8'/></g>
</svg>`;

const SVG_SNOW = `<svg ${A} width='110' height='110'>
<g fill='#ffffff'><circle cx='14' cy='16' r='2.6' fill-opacity='.85'/><circle cx='52' cy='8' r='1.8' fill-opacity='.7'/><circle cx='88' cy='20' r='3' fill-opacity='.8'/><circle cx='30' cy='46' r='1.6' fill-opacity='.65'/><circle cx='70' cy='40' r='2.2' fill-opacity='.75'/><circle cx='102' cy='58' r='1.7' fill-opacity='.6'/><circle cx='8' cy='72' r='2' fill-opacity='.7'/><circle cx='46' cy='66' r='2.8' fill-opacity='.8'/><circle cx='86' cy='84' r='2' fill-opacity='.7'/><circle cx='24' cy='96' r='1.6' fill-opacity='.6'/><circle cx='62' cy='100' r='2.4' fill-opacity='.75'/></g>
<g stroke='#dceeff' stroke-opacity='.8' stroke-width='1.1' stroke-linecap='round' fill='none'>
<g transform='translate(36 26)'><path d='M0 -6V6M-6 0H6M-4.2 -4.2L4.2 4.2M-4.2 4.2L4.2 -4.2'/></g>
<g transform='translate(94 96)'><path d='M0 -5.5V5.5M-5.5 0H5.5M-3.9 -3.9L3.9 3.9M-3.9 3.9L3.9 -3.9'/></g>
<g transform='translate(60 76)'><path d='M0 -4.5V4.5M-4.5 0H4.5M-3.2 -3.2L3.2 3.2M-3.2 3.2L3.2 -3.2'/></g></g>
<g fill='#eaf4ff' fill-opacity='.1'><circle cx='80' cy='14' r='9'/><circle cx='20' cy='60' r='11'/><circle cx='100' cy='40' r='8'/></g>
</svg>`;

const SVG_BUBBLES = `<svg ${A} width='110' height='110'>
<g fill='none'>
<circle cx='22' cy='22' r='12' stroke='#ffffff' stroke-opacity='.55' stroke-width='1.4' fill='#7fd4e8' fill-opacity='.1'/>
<path d='M14 18A10 10 0 0 1 22 10' stroke='#ffffff' stroke-opacity='.7' stroke-width='1.6'/>
<circle cx='70' cy='14' r='7' stroke='#ffffff' stroke-opacity='.5' stroke-width='1.2' fill='#f0a8d0' fill-opacity='.1'/>
<path d='M65 11A6 6 0 0 1 70 8' stroke='#ffffff' stroke-opacity='.65' stroke-width='1.3'/>
<circle cx='100' cy='40' r='9' stroke='#ffffff' stroke-opacity='.5' stroke-width='1.2' fill='#b8e88a' fill-opacity='.1'/>
<circle cx='42' cy='58' r='15' stroke='#ffffff' stroke-opacity='.5' stroke-width='1.5' fill='#c8b4f0' fill-opacity='.09'/>
<path d='M31 51A14 14 0 0 1 43 43' stroke='#ffffff' stroke-opacity='.6' stroke-width='1.7'/>
<circle cx='88' cy='76' r='6' stroke='#ffffff' stroke-opacity='.5' stroke-width='1.1' fill='#7fd4e8' fill-opacity='.12'/>
<circle cx='16' cy='88' r='9' stroke='#ffffff' stroke-opacity='.5' stroke-width='1.2' fill='#f0d8a0' fill-opacity='.1'/>
<path d='M10 84A8 8 0 0 1 17 79' stroke='#ffffff' stroke-opacity='.6' stroke-width='1.4'/>
<circle cx='60' cy='96' r='4' stroke='#ffffff' stroke-opacity='.5' stroke-width='1' fill='#b8e88a' fill-opacity='.12'/>
<circle cx='104' cy='104' r='3' stroke='#ffffff' stroke-opacity='.45' stroke-width='.9' fill='#f0a8d0' fill-opacity='.12'/></g>
</svg>`;

const SVG_BRICK = `<svg ${A} width='60' height='36'>
<g fill='#b5502e' fill-opacity='.32' stroke='#6e2a18' stroke-opacity='.45' stroke-width='1'>
<rect x='1' y='1' width='27' height='15'/><rect x='31' y='1' width='28' height='15'/>
<rect x='-14' y='19' width='27' height='15'/><rect x='16' y='19' width='27' height='15'/><rect x='46' y='19' width='27' height='15'/></g>
</svg>`;

/* ---------- effect registry (order = panel order) ---------- */
const FX = [
  // Basics
  { id: 'glass', key: 'textureGlass', en: 'Glass', def: 0.5,
    tex: 'linear-gradient(135deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.03) 45%, rgba(255,255,255,0.18) 100%)',
    size: '100% 100%', repeat: 'no-repeat' },
  { id: 'plastic', key: 'texturePlastic', en: 'Plastic', def: 0.55,
    tex: 'radial-gradient(ellipse 60% 40% at 28% 12%, rgba(255,255,255,0.22), transparent 60%), radial-gradient(ellipse 50% 35% at 75% 88%, rgba(255,255,255,0.13), transparent 55%), linear-gradient(180deg, rgba(255,255,255,0.05), rgba(0,0,0,0.04))',
    size: '100% 100%', repeat: 'no-repeat' },
  { id: 'gloss', key: 'textureGloss', en: 'Gloss', def: 0.55,
    tex: 'linear-gradient(180deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.04) 30%, transparent 55%, rgba(255,255,255,0.08) 100%)',
    size: '100% 100%', repeat: 'no-repeat' },
  { id: 'metal', key: 'textureMetal', en: 'Metal', def: 0.5,
    tex: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.1) 0px, rgba(120,130,150,0.11) 1px, rgba(255,255,255,0.05) 2px, rgba(90,100,120,0.1) 3px), linear-gradient(90deg, rgba(200,210,230,0.09), rgba(140,150,170,0.13) 30%, rgba(220,230,245,0.07) 55%, rgba(130,140,160,0.13) 80%, rgba(200,210,230,0.09))',
    size: '3px 100%, 100% 100%', repeat: 'repeat, no-repeat' },
  // Materials
  { id: 'wood', key: 'textureWood', en: 'Wood', def: 0.5, tex: svg(SVG_WOOD), size: '120px 120px', repeat: 'repeat' },
  { id: 'parquet', key: 'textureParquet', en: 'Parquet', def: 0.5, tex: svg(SVG_PARQUET), size: '80px 80px', repeat: 'repeat' },
  { id: 'marble', key: 'textureMarble', en: 'Marble', def: 0.42, tex: svg(SVG_MARBLE), size: '200px 200px', repeat: 'repeat' },
  { id: 'tile', key: 'textureTile', en: 'Ceramic tile', def: 0.5, tex: svg(SVG_TILE), size: '96px 96px', repeat: 'repeat' },
  { id: 'brick', key: 'textureBrick', en: 'Brick', def: 0.5, tex: svg(SVG_BRICK), size: '60px 36px', repeat: 'repeat' },
  { id: 'mosaic', key: 'textureMosaic', en: 'Mosaic', def: 0.5, tex: svg(SVG_MOSAIC), size: '80px 80px', repeat: 'repeat' },
  { id: 'pebbles', key: 'texturePebbles', en: 'Pebbles', def: 0.5, tex: svg(SVG_PEBBLES), size: '100px 100px', repeat: 'repeat' },
  { id: 'asphalt', key: 'textureAsphalt', en: 'Asphalt', def: 0.5, tex: svg(SVG_ASPHALT), size: '140px 140px', repeat: 'repeat' },
  // Nature
  { id: 'water', key: 'textureWater', en: 'Water', def: 0.5, tex: svg(SVG_WATER), size: '160px 90px', repeat: 'repeat' },
  { id: 'swamp', key: 'textureSwamp', en: 'Swamp', def: 0.48, tex: svg(SVG_SWAMP), size: '120px 120px', repeat: 'repeat' },
  { id: 'grass', key: 'textureGrass', en: 'Grass', def: 0.5, tex: svg(SVG_GRASS), size: '90px 90px', repeat: 'repeat' },
  { id: 'hay', key: 'textureHay', en: 'Hay', def: 0.5, tex: svg(SVG_HAY), size: '90px 90px', repeat: 'repeat' },
  { id: 'snow', key: 'textureSnow', en: 'Snow', def: 0.6, tex: svg(SVG_SNOW), size: '110px 110px', repeat: 'repeat' },
  { id: 'bubbles', key: 'textureBubbles', en: 'Bubbles', def: 0.55, tex: svg(SVG_BUBBLES), size: '110px 110px', repeat: 'repeat' },
  // Retro & special
  { id: 'film', key: 'textureFilm', en: 'Film camera', def: 0.55, tex: svg(SVG_FILM), size: '120px 72px', repeat: 'repeat' },
  { id: 'vhs', key: 'textureVhs', en: 'VHS tape', def: 0.6,
    tex: svg(SVG_VHS_BAND) + ', repeating-linear-gradient(0deg, rgba(8,10,14,0.3) 0px, rgba(8,10,14,0.3) 1px, transparent 1px, transparent 3px), linear-gradient(90deg, rgba(255,0,90,0.07) 0%, rgba(0,255,150,0.05) 33%, rgba(80,0,255,0.07) 66%, rgba(255,0,90,0.07) 100%)',
    size: '100% 150px, 100% 100%, 24px 100%', repeat: 'repeat, repeat, repeat' },
  { id: 'church', key: 'textureChurch', en: 'Church window', def: 0.5, tex: svg(SVG_CHURCH), size: '130px 170px', repeat: 'repeat' },
];
const FX_NONE = { id: 'none', key: 'textureNone', en: 'None' };
const GROUPS = [
  { catKey: 'texCatBasics', catEn: 'Basics', ids: ['none', 'glass', 'plastic', 'gloss', 'metal'] },
  { catKey: 'texCatMaterials', catEn: 'Materials', ids: ['wood', 'parquet', 'marble', 'tile', 'brick', 'mosaic', 'pebbles', 'asphalt'] },
  { catKey: 'texCatNature', catEn: 'Nature', ids: ['water', 'swamp', 'grass', 'hay', 'snow', 'bubbles'] },
  { catKey: 'texCatRetro', catEn: 'Retro & special', ids: ['film', 'vhs', 'church'] },
];
const byId = {}; [FX_NONE].concat(FX).forEach(f => { byId[f.id] = f; });

/* ---------- 1) CSS block ---------- */
let css = `/* ===== TEXTURE EFFECTS v2 (c79) — professional overlays on any theme =====
   Architecture: [data-tex] rules are shared by the body (live overlay) and by
   .tex-swatch preview tiles. Opacity = user override (set inline on body by the
   slider) falling back to a per-effect default. Lives on a dedicated
   #dk-tex-overlay div so theme body::before/::after decorations never clash. */
body {
  --texture: none;
  --texture-size: auto;
  --texture-repeat: repeat;
  --texture-opacity-def: 0.35;
  --texture-opacity: var(--texture-opacity-user, var(--texture-opacity-def, 0.35));
}
#dk-tex-overlay {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  pointer-events: none; z-index: 0;
  opacity: var(--texture-opacity);
  background-image: var(--texture, none);
  background-size: var(--texture-size, auto);
  background-repeat: var(--texture-repeat, repeat);
}
body[data-tex='none'] #dk-tex-overlay { display: none; }
/* Panel/card layer — textures also appear ON panels, not just behind them */
body[data-tex]:not([data-tex='none']) .bg-surface {
  background-image: var(--texture, none), linear-gradient(rgb(var(--c-surface)), rgb(var(--c-surface)));
  background-size: var(--texture-size, auto), 100% 100%;
  background-repeat: var(--texture-repeat, repeat), no-repeat;
  background-blend-mode: overlay, normal;
}
body[data-tex]:not([data-tex='none']) .bg-surface-2 {
  background-image: var(--texture, none), linear-gradient(rgb(var(--c-surface-2)), rgb(var(--c-surface-2)));
  background-size: var(--texture-size, auto), 100% 100%;
  background-repeat: var(--texture-repeat, repeat), no-repeat;
  background-blend-mode: overlay, normal;
}
`;
FX.forEach(f => {
  css += `/* ${f.en} */\n[data-tex='${f.id}'] {\n  --texture: ${f.tex};\n  --texture-size: ${f.size};\n  --texture-repeat: ${f.repeat};\n  --texture-opacity-def: ${f.def};\n}\n`;
});
css += `/* per-effect surface enhancements */
body[data-tex='glass'] .bg-surface,
body[data-tex='glass'] .bg-surface-2 { backdrop-filter: blur(6px) saturate(1.25); -webkit-backdrop-filter: blur(6px) saturate(1.25); }
body[data-tex='plastic'] .bg-surface,
body[data-tex='plastic'] .bg-surface-2 { box-shadow: inset 0 1px 0 rgba(255,255,255,0.09), inset 0 -1px 0 rgba(0,0,0,0.1); }
body[data-tex='metal'] .bg-surface,
body[data-tex='metal'] .bg-surface-2 { box-shadow: inset 0 1px 0 rgba(255,255,255,0.11); }
body[data-tex='wood'] .bg-surface,
body[data-tex='wood'] .bg-surface-2 { box-shadow: inset 0 1px 0 rgba(160,120,60,0.12); }
body[data-tex='gloss'] .bg-surface,
body[data-tex='gloss'] .bg-surface-2 { box-shadow: inset 0 2px 4px rgba(255,255,255,0.07); }
/* ----- Texture panel UI (c79) ----- */
.tex-cat { display:flex; align-items:center; gap:8px; font-size:10px; font-weight:800; letter-spacing:.14em; text-transform:uppercase; color:rgb(var(--c-muted)); margin:2px 0 8px; }
.tex-cat::after { content:''; flex:1; height:1px; background:rgb(var(--c-border) / .7); }
.texture-btn { position:relative; cursor:pointer; overflow:hidden; transition:transform .12s ease, box-shadow .12s ease, border-color .12s ease; }
.texture-btn:hover { transform:translateY(-1px); }
.texture-btn:active { transform:translateY(0) scale(.98); }
.texture-btn:focus-visible { outline:2px solid rgb(var(--c-accent)); outline-offset:2px; }
.tex-swatch { display:block; height:46px; background-color:var(--tex-swatch-bg, rgb(var(--c-surface-2))); background-image:var(--texture, none); background-size:var(--texture-size, auto); background-repeat:var(--texture-repeat, repeat); }
/* sheen-type patterns are white-based — give their preview tiles a darker backing so they stay visible on light themes */
[data-tex='glass'], [data-tex='plastic'], [data-tex='gloss'], [data-tex='metal'] { --tex-swatch-bg: rgb(var(--c-text) / .22); }
.tex-name { display:block; padding:5px 4px 6px; font-size:10px; font-weight:700; line-height:1.2; color:rgb(var(--c-text)); background:rgb(var(--c-surface-2)); border-top:1px solid rgb(var(--c-border) / .5); text-align:center; }
.texture-btn.active { border-color:rgb(var(--c-accent)) !important; box-shadow:0 0 0 2px rgb(var(--c-accent) / .5); }
.texture-btn.active .tex-check { opacity:1; transform:scale(1); }
.tex-check { position:absolute; top:5px; inset-inline-end:5px; width:17px; height:17px; border-radius:9999px; background:rgb(var(--c-accent)); color:rgb(var(--c-surface)); font-size:11px; font-weight:800; line-height:17px; text-align:center; opacity:0; transform:scale(.4); transition:opacity .15s ease, transform .15s ease; pointer-events:none; }
#tex-active-badge { font-size:10px; font-weight:800; padding:2px 8px; border-radius:9999px; background:rgb(var(--c-accent) / .14); color:rgb(var(--c-accent)); border:1px solid rgb(var(--c-accent) / .35); text-transform:none; letter-spacing:0; white-space:nowrap; }
#texture-opacity-val { font-size:10px; font-weight:800; padding:2px 6px; border-radius:6px; background:rgb(var(--c-accent) / .1); color:rgb(var(--c-accent)); border:1px solid rgb(var(--c-accent) / .25); font-variant-numeric:tabular-nums; }

`;
sliceReplace('CSS block', '/* ===== TEXTURE EFFECTS (overlay on any theme) — ENHANCED =====', '/* ===== COLLAPSIBLE SETTINGS PANELS ===== */', css);

/* ---------- 2) HTML panel ---------- */
function btnHTML(id) {
  const f = byId[id];
  return `                  <button type="button" class="texture-btn text-center border border-border bg-surface-2 hover:bg-border/30 transition" data-tex="${f.id}" aria-pressed="false">
                    <span class="tex-swatch" data-tex="${f.id}" aria-hidden="true"></span>
                    <span class="tex-name" data-i18n="settings.${f.key}">${f.en}</span>
                    <span class="tex-check" aria-hidden="true">✓</span>
                  </button>`;
}
let panel = `            <!-- Texture Effects v2 (c79) -->
            <div class="bg-surface border border-accent/30 rounded-2xl shadow-card mb-4 settings-panel collapsed">
              <div class="settings-panel-header p-5 pb-3">
                <h3 class="font-display font-bold text-sm text-accent uppercase tracking-wider flex items-center gap-2 flex-1 min-w-0">
                  <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20"/></svg>
                  <span data-i18n="settings.textureEffects">Texture effects</span>
                  <span id="tex-active-badge" class="shrink-0">None</span>
                </h3>
                <svg class="w-4 h-4 text-muted settings-panel-chevron shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9l6 6 6-6"/></svg>
              </div>
              <div class="settings-panel-body p-5 pt-0">
                <p class="text-xs text-muted mb-4 leading-relaxed" data-i18n="settings.textureHint">Visual texture overlays on top of any theme — noticeable, meaningful, comfortable. Pick an effect and fine-tune its opacity.</p>
`;
GROUPS.forEach(g => {
  panel += `                <div class="tex-cat" data-i18n="settings.${g.catKey}">${g.catEn}</div>
                <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5 mb-4">
`;
  g.ids.forEach(id => { panel += btnHTML(id) + '\n'; });
  panel += `                </div>
`;
});
panel += `                <div class="mt-1 pt-3 border-t border-border/60">
                  <div class="flex items-center justify-between mb-1.5 gap-2 flex-wrap">
                    <label class="text-xs font-semibold text-muted" for="texture-opacity" data-i18n="settings.textureOpacity">Effect opacity</label>
                    <div class="flex items-center gap-2">
                      <span id="texture-opacity-val">35%</span>
                      <button type="button" id="texture-opacity-reset" class="text-[10px] font-semibold text-muted hover:text-accent border border-border rounded-md px-2 py-0.5 transition" data-i18n="settings.textureReset">Reset</button>
                    </div>
                  </div>
                  <input type="range" id="texture-opacity" min="0.05" max="1" step="0.05" value="0.35" class="w-full accent-accent" />
                  <div class="flex justify-between items-center text-[9px] text-muted mt-0.5 gap-2">
                    <span>5%</span>
                    <span class="text-center" data-i18n="settings.textureOpacityHint">Each effect has its own optimal level — Reset returns to it</span>
                    <span>100%</span>
                  </div>
                </div>
              </div>
            </div>

            `;
sliceReplace('HTML panel', '<!-- Texture Effects (collapsible) -->', '<!-- Branding (collapsible) -->', panel);

/* ---------- 3) JS block ---------- */
const fxIds = FX.map(f => f.id);
const labelMap = FX.map(f => f.id + ":'" + f.key + "'").join(', ');
const js = `// ---- Texture Effects v2 (c79) ----
const TEX_FX = ['none','${fxIds.join("','")}'];
const TEX_LABEL = { none:'textureNone', ${labelMap} };
function texEnsureOverlay() {
  let el = document.getElementById('dk-tex-overlay');
  if (!el) { el = document.createElement('div'); el.id = 'dk-tex-overlay'; el.setAttribute('aria-hidden', 'true'); document.body.prepend(el); }
  return el;
}
let texState = { name: 'none', opacity: null };
let texSaveTimer = null;
function texPersist() {
  clearTimeout(texSaveTimer);
  texSaveTimer = setTimeout(async () => {
    try { await db.put('settings', { key: 'texture', value: { name: texState.name, opacity: texState.opacity } }); } catch (e) {}
  }, 250);
}
function texBadge() {
  const b = document.getElementById('tex-active-badge');
  if (b) b.textContent = t('settings.' + (TEX_LABEL[texState.name] || 'textureNone')) || texState.name;
}
function texApply(name, opacity) {
  if (TEX_FX.indexOf(name) === -1) name = 'none';
  texState.name = name;
  texState.opacity = (typeof opacity === 'number' && isFinite(opacity)) ? Math.min(1, Math.max(0.05, opacity)) : null;
  texEnsureOverlay();
  document.body.setAttribute('data-tex', texState.name);
  if (texState.opacity == null) document.body.style.removeProperty('--texture-opacity-user');
  else document.body.style.setProperty('--texture-opacity-user', String(texState.opacity));
  let defV = parseFloat(getComputedStyle(document.body).getPropertyValue('--texture-opacity-def'));
  const shown = texState.opacity != null ? texState.opacity : (isFinite(defV) && defV > 0 ? defV : 0.35);
  const slider = document.getElementById('texture-opacity');
  if (slider) slider.value = String(shown);
  const valEl = document.getElementById('texture-opacity-val');
  if (valEl) valEl.textContent = Math.round(shown * 100) + '%';
  document.querySelectorAll('.texture-btn').forEach(btn => {
    const on = btn.getAttribute('data-tex') === texState.name;
    btn.classList.toggle('active', on);
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
  });
  texBadge();
}
async function loadTexture() {
  try {
    const row = await db.get('settings', 'texture');
    const v = row && row.value ? row.value : {};
    texApply(v.name || 'none', typeof v.opacity === 'number' && isFinite(v.opacity) ? v.opacity : null);
  } catch (e) { texApply('none', null); }
}
document.querySelectorAll('.texture-btn').forEach(btn => {
  btn.addEventListener('click', async () => {
    texApply(btn.getAttribute('data-tex'), texState.opacity);
    texPersist();
    toast(t('settings.textureApplied') || 'Texture applied', 'success', 1800);
  });
});
const texSlider = document.getElementById('texture-opacity');
if (texSlider) {
  texSlider.addEventListener('input', () => {
    const v = parseFloat(texSlider.value);
    if (!isFinite(v)) return;
    texState.opacity = v;
    document.body.style.setProperty('--texture-opacity-user', String(v));
    const valEl = document.getElementById('texture-opacity-val');
    if (valEl) valEl.textContent = Math.round(v * 100) + '%';
    texPersist();
  });
  texSlider.addEventListener('change', () => texPersist());
}
const texResetBtn = document.getElementById('texture-opacity-reset');
if (texResetBtn) texResetBtn.addEventListener('click', () => {
  texApply(texState.name, null);
  texPersist();
  toast(t('settings.textureResetDone') || 'Returned to effect default', 'success', 1600);
});
document.addEventListener('dk-lang', texBadge);
loadTexture();

`;
sliceReplace('JS block', '    // ---- Texture Effects ----', '    // ---- Branding ----', js);

/* ---------- 4) Version bumps ---------- */
if (html.indexOf('var RUNNING = 78; /* numeric part of dk-build c78 */') === -1) fails.push('RUNNING=78 marker not found');
else { html = html.replace('var RUNNING = 78; /* numeric part of dk-build c78 */', 'var RUNNING = 79; /* numeric part of dk-build c79 */'); console.log('OK  RUNNING 78 → 79'); }

/* ---------- sanity + write ---------- */
const mustHave = [
  "[data-tex='asphalt']", "[data-tex='church']", "[data-tex='vhs']",
  "'dk-tex-overlay'", '--texture-opacity-user', 'texture-opacity-reset', "getElementById('dk-tex-overlay')",
  'texCatRetro', 'data-tex="film"', 'id="tex-active-badge"',
];
mustHave.forEach(s => { if (html.indexOf(s) === -1) fails.push('missing after patch: ' + s); });
if (html.indexOf('data-texture') !== -1) fails.push('old data-texture attribute still referenced (' + (html.match(/data-texture/g) || []).length + 'x)');
FX.forEach(f => { if (count('data-tex="' + f.id + '"') !== 2) fails.push('tile ' + f.id + ': expected 2 data-tex attrs (btn+swatch), got ' + count('data-tex="' + f.id + '"')); });
if (count("class=\"texture-btn") !== 22) fails.push('expected 22 texture-btn tiles, got ' + count("class=\"texture-btn"));
if (fails.length) { console.error('FAILURES:\n' + fails.join('\n')); process.exit(1); }
fs.writeFileSync(FILE, html);
console.log('WROTE', FILE, '(' + html.length + ' chars)');

/* ---------- 5) sw.js ---------- */
const SW = path.join(ROOT, 'sw.js');
let sw = fs.readFileSync(SW, 'utf8');
const swLineRe = /const CACHE_NAME = 'dk-gym-v\d+';.*$/m;
if (!swLineRe.test(sw)) { console.error('sw.js: CACHE_NAME line not found'); process.exit(1); }
sw = sw.replace(swLineRe, "const CACHE_NAME = 'dk-gym-v106'; // v106: c79 — Texture Effects 2.0: 22 effects (asphalt, pebbles, water, church window, marble, ceramic tile, parquet, swamp, film, VHS, grass, hay, snow, bubbles + rebuilt basics), live preview swatches, working opacity slider (per-effect defaults + body-scoped user override), dedicated overlay div (no more theme body::after conflicts)");
fs.writeFileSync(SW, sw);
console.log('WROTE', SW, '(dk-gym-v106)');

/* ---------- 6) i18n JSONs ---------- */
const ADD = {
  en: {
    textureHint: 'Visual texture overlays on top of any theme — noticeable, meaningful, comfortable. Pick an effect and fine-tune its opacity.',
    textureParquet: 'Parquet', textureMarble: 'Marble', textureTile: 'Ceramic tile', texturePebbles: 'Pebbles',
    textureAsphalt: 'Asphalt', textureWater: 'Water', textureSwamp: 'Swamp', textureGrass: 'Grass',
    textureHay: 'Hay', textureSnow: 'Snow', textureBubbles: 'Bubbles', textureFilm: 'Film camera',
    textureVhs: 'VHS tape', textureChurch: 'Church window',
    texCatBasics: 'Basics', texCatMaterials: 'Materials', texCatNature: 'Nature', texCatRetro: 'Retro & special',
    textureReset: 'Reset', textureResetDone: 'Returned to effect default', textureCleared: 'Texture removed',
    textureOpacityHint: 'Each effect has its own optimal level',
  },
  ru: {
    textureHint: 'Визуальные текстуры поверх любой темы — заметные, осмысленные, комфортные. Выберите эффект и настройте прозрачность.',
    textureParquet: 'Паркет', textureMarble: 'Мрамор', textureTile: 'Кафель', texturePebbles: 'Камушки',
    textureAsphalt: 'Асфальт', textureWater: 'Вода', textureSwamp: 'Болото', textureGrass: 'Трава',
    textureHay: 'Сено', textureSnow: 'Снег', textureBubbles: 'Пузырьки', textureFilm: 'Плёнка фотоаппарата',
    textureVhs: 'Видеокассета', textureChurch: 'Церковное окно',
    texCatBasics: 'Базовые', texCatMaterials: 'Материалы', texCatNature: 'Природа', texCatRetro: 'Ретро и особые',
    textureReset: 'Сбросить', textureResetDone: 'Возвращён стандарт эффекта', textureCleared: 'Текстура снята',
    textureOpacityHint: 'У каждого эффекта свой оптимальный уровень',
  },
  he: {
    textureHint: 'שכבות מרקם ויזואליות מעל כל ערכת נושא — בולטות, משמעותיות ונוחות. בחרו אפקט וכוונו את עוצמתו.',
    textureParquet: 'פרקט', textureMarble: 'שיש', textureTile: 'אריחי קרמיקה', texturePebbles: 'חלוקי נחל',
    textureAsphalt: 'אספלט', textureWater: 'מים', textureSwamp: 'ביצה', textureGrass: 'דשא',
    textureHay: 'חציר', textureSnow: 'שלג', textureBubbles: 'בועות סבון', textureFilm: 'סרט צילום',
    textureVhs: 'קלטת וידאו', textureChurch: 'חלון כנסייה',
    texCatBasics: 'בסיסי', texCatMaterials: 'חומרים', texCatNature: 'טבע', texCatRetro: 'רטרו ומיוחדים',
    textureReset: 'איפוס', textureResetDone: 'חזרה לברירת המחדל של האפקט', textureCleared: 'המרקם הוסר',
    textureOpacityHint: 'לכל אפקט יש רמה אופטימלית משלו',
  },
};
Object.keys(ADD).forEach(lang => {
  const p = path.join(ROOT, 'src', 'i18n', lang + '.json');
  const d = JSON.parse(fs.readFileSync(p, 'utf8'));
  if (!d.settings) d.settings = {};
  Object.assign(d.settings, ADD[lang]);
  fs.writeFileSync(p, JSON.stringify(d, null, 2) + '\n');
  console.log('WROTE i18n', lang, '(+' + Object.keys(ADD[lang]).length + ' keys)');
});
console.log('\nc79 patch complete.');
