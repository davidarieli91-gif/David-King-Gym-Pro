#!/usr/bin/env node
/* c65: image-edit helper — z-ai SDK edit with local file (CLI cannot take local paths)
 * usage: node scripts/edit-c65.cjs <input.png> <output.png> "<edit prompt>"
 */
const fs = require('fs');
const path = require('path');
const ZAI = require('/home/z/my-project/node_modules/z-ai-web-dev-sdk').default;

async function main() {
  const [inPath, outPath, ...promptParts] = process.argv.slice(2);
  if (!inPath || !outPath || !promptParts.length) {
    console.error('usage: node edit-c65.cjs <in.png> <out.png> "<prompt>"');
    process.exit(2);
  }
  const prompt = promptParts.join(' ');
  const buf = fs.readFileSync(path.resolve(inPath));
  const dataUrl = `data:image/png;base64,${buf.toString('base64')}`;
  const zai = await ZAI.create();
  const resp = await zai.images.generations.edit({
    prompt,
    images: [{ url: dataUrl }],
    size: '1024x1024',
  });
  const b64 = resp?.data?.[0]?.base64;
  if (!b64) { console.error('FAIL: no base64 in response'); process.exit(1); }
  fs.writeFileSync(path.resolve(outPath), Buffer.from(b64, 'base64'));
  console.log('EDIT-OK', outPath);
}

main().catch((e) => { console.error('EDIT-ERR', e.message || e); process.exit(1); });
