const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const root = path.join(__dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'images/arena/manifest.json'), 'utf8'));
const picks = JSON.parse(fs.readFileSync('C:/Users/Computer/AppData/Local/Temp/opencode/nas/picks.json', 'utf8'));

(async () => {
  const cell = 240, cols = 4;
  const rows = Math.ceil(picks.length / cols);
  const W = cols * cell, H = rows * cell * 2;
  const composite = [];
  for (let r = 0; r < 2; r++) {
    const bg = r === 0
      ? { r: 10, g: 16, b: 32, alpha: 1 }
      : { r: 240, g: 246, b: 255, alpha: 1 };
    composite.push({
      input: await sharp({ create: { width: W, height: cell * rows, channels: 4, background: bg } }).png().toBuffer(),
      left: 0, top: r * cell * rows
    });
  }
  for (let i = 0; i < picks.length; i++) {
    const src = path.join(root, 'images/arena', path.basename(manifest[picks[i]]));
    const buf = await sharp(src).resize(cell - 24, cell - 24, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
    const x = (i % cols) * cell + 12;
    for (let r = 0; r < 2; r++) {
      const y = r * cell * rows + Math.floor(i / cols) * cell + 12;
      composite.push({ input: buf, left: x, top: y });
    }
  }
  await sharp({ create: { width: W, height: H, channels: 4, background: { r: 10, g: 16, b: 32, alpha: 1 } } })
    .composite(composite)
    .png()
    .toFile(path.join(root, 'dist', 'arena-art-preview.png'));
  console.log('picks:', picks.join('\n'));
  console.log('wrote dist/arena-art-preview.png');
})();
