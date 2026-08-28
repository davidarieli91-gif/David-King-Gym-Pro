// Замена логотипа: logo-main.png -> APP_LOGO_DATA_URI в fitness-crm.html
// Использование: node scripts/update-logo.cjs [путь-к-картинке]
const fs = require('fs');
const path = require('path');

const root = 'G:/Antigravity/DavidKingGym';
const candidates = [
  process.argv[2],
  path.join(root, 'logo-main.png'),
  path.join(root, 'logo-main.jpg'),
  path.join(root, 'logo.png'),
  path.join(root, 'logo-main.webp'),
  path.join(root, 'LOGO/logo-web.webp'),
].filter(Boolean);

const file = candidates.find(p => fs.existsSync(p));
if (!file) {
  console.error('Не найдена картинка логотипа. Сохраните её как logo-main.png в корне проекта');
  console.error('Или передайте путь: node scripts/update-logo.cjs путь/к/картинке.png');
  process.exit(1);
}

const ext = path.extname(file).toLowerCase().replace('.', '');
const mime = ext === 'jpg' ? 'jpeg' : ext;
const b64 = fs.readFileSync(file).toString('base64');
const dataUri = `data:image/${mime};base64,${b64}`;

const F = path.join(root, 'fitness-crm.html');
let s = fs.readFileSync(F, 'utf8');

const marker = 'APP_LOGO_DATA_URI = "';
const i = s.indexOf(marker);
if (i < 0) throw new Error('APP_LOGO_DATA_URI not found');
const start = i + marker.length;
const end = s.indexOf('"', start);
const oldLen = end - start;
s = s.slice(0, start) + dataUri + s.slice(end);

fs.writeFileSync(F, s);
console.log(`Логотип заменён: ${path.basename(file)} (${(b64.length * 0.75 / 1024).toFixed(0)} KB)`);
console.log(`Старый data URI: ${(oldLen * 0.75 / 1024).toFixed(0)} KB -> Новый: ${(dataUri.length * 0.75 / 1024).toFixed(0)} KB`);
