#!/usr/bin/env node
/* c202 regression — Z-Anatomy skeleton overlay for the 3D atlas. */
const fs = require('fs');
const path = require('path');
let pass = 0, fail = 0;
const ok = (name, cond) => { if (cond) { pass++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name); } };
const read = (f) => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');

const crm = read('fitness-crm.html');
const sw = read('sw.js');
const skeletonPath = path.join(__dirname, '..', 'models/z-anatomy-skeleton-v1.glb');
const skeleton = fs.existsSync(skeletonPath) ? fs.readFileSync(skeletonPath) : Buffer.alloc(0);
let gltf = null;
if (skeleton.length) {
  const len = skeleton.readUInt32LE(8);
  let off = 12;
  while (off < len) {
    const clen = skeleton.readUInt32LE(off);
    const ct = skeleton.toString('utf8', off + 4, off + 8);
    if (ct.startsWith('JSON')) { gltf = JSON.parse(skeleton.toString('utf8', off + 8, off + 8 + clen)); break; }
    off += 8 + clen;
  }
}

ok('skeleton GLB exists and is small', skeleton.length > 300000 && skeleton.length < 2000000);
ok('skeleton GLB is valid Draco glTF', !!gltf && (gltf.extensionsUsed || []).indexOf('KHR_draco_mesh_compression') >= 0);
ok('skeleton is one joined mesh', !!gltf && gltf.meshes.length === 1 && gltf.nodes.length === 1);
ok('skeleton uses the bone material', !!gltf && (gltf.materials || []).some(m => m.name === 'ZAnatomy_Bone'));
ok('atlas has the skeleton control', crm.indexOf('id="atlas-skeleton"') >= 0 && crm.indexOf('data-atlas-skeleton') < 0);
ok('skeleton layer is lazy loaded', crm.indexOf("var SKELETON_URL = 'models/z-anatomy-skeleton-v1.glb'") >= 0 && crm.indexOf('function loadSkeletonModel') >= 0);
ok('skeleton toggle is wired', crm.indexOf("skel.addEventListener('click'") >= 0 && crm.indexOf('function setSkeleton') >= 0);
ok('skeleton normalises to the same 1.7 body height', crm.indexOf('var k = 1.7 / (size.y || 1.7)') >= 0);
ok('skeleton ghosts the muscle layer', crm.indexOf('var skeletonGhost = !!S.skeletonOn') >= 0 && crm.indexOf('softSkeleton') >= 0);
ok('HUD reports the active layer', crm.indexOf('id="atlas-layer-txt"') >= 0 && crm.indexOf('skeletonLayer') >= 0);
ok('skeleton labels exist in 3 languages', crm.indexOf('Скелет') >= 0 && crm.indexOf('שלד') >= 0 && crm.indexOf("en: 'Skeleton'") >= 0);
ok('skeleton is credited', crm.indexOf('Skeleton overlay') >= 0 && read('models/LICENSE-atlas.md').indexOf('z-anatomy-skeleton-v1.glb') >= 0);
ok('build is c209', crm.indexOf('<meta name="dk-build" content="c209" />') >= 0);
ok('SW cache is v232', sw.indexOf("const CACHE_NAME = 'dk-gym-v236'") >= 0);
ok('running build label is c205', crm.indexOf('var RUNNING = 209') >= 0);
ok('login/sidebar show c205', crm.indexOf('3 languages · c209') >= 0 && crm.indexOf('id="v2-side-version">c209') >= 0);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
