/* re-inline atlas JS into fitness-crm.html (source) — replaces the block between
 * the ATLAS marker's <script> and its closing </script>. */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const FILE = path.join(ROOT, 'fitness-crm.html');
const APP = fs.readFileSync(path.join(__dirname, 'atlas-app-c66.js'), 'utf8');
if (APP.includes('</script')) throw new Error('app js contains </script');

const MARK = '<!-- ============= 3D BODY ATLAS (c66) ============= -->';
let s = fs.readFileSync(FILE, 'utf8');
const mi = s.indexOf(MARK);
if (mi < 0) throw new Error('marker not found');
const so = s.indexOf('<script>', mi);
const eo = s.indexOf('</script>', so);
if (so < 0 || eo < 0) throw new Error('script bounds not found');
s = s.slice(0, so) + '<script>\n' + APP + '\n' + s.slice(eo);
fs.writeFileSync(FILE, s);
console.log('re-inlined OK, size', s.length);
