const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const dist = path.join(__dirname, '..', 'dist');
const extensions = new Set(['.html', '.js', '.css', '.json', '.svg', '.txt', '.xml']);
let files = 0;
let saved = 0;

function newerThan(source, target) {
  try {
    return fs.statSync(target).mtimeMs >= fs.statSync(source).mtimeMs;
  } catch {
    return false;
  }
}

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
      continue;
    }
    if (!extensions.has(path.extname(entry.name).toLowerCase())) continue;

    const source = fs.readFileSync(full);
    const brPath = full + '.br';
    const gzPath = full + '.gz';

    if (!newerThan(full, brPath)) {
      fs.writeFileSync(brPath, zlib.brotliCompressSync(source, {
        params: {
          [zlib.constants.BROTLI_PARAM_QUALITY]: 6,
        },
      }));
    }
    if (!newerThan(full, gzPath)) {
      fs.writeFileSync(gzPath, zlib.gzipSync(source, { level: 9 }));
    }

    files += 1;
    saved += source.length;
  }
}

if (!fs.existsSync(dist)) {
  console.error('dist folder not found; run the build first');
  process.exit(1);
}

walk(dist);
console.log(`precompressed ${files} files (${(saved / 1048576).toFixed(1)} MB of sources)`);
