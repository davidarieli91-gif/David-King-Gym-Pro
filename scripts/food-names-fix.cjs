// Точечный фикс 14 продуктов с пустым name_en / битым name_ru
const fs = require('fs');
const DB = 'G:/Antigravity/DavidKingGym/food-db.json';
const fd = JSON.parse(fs.readFileSync(DB, 'utf8'));

const FIX = {
  off_il_7290100850916: { en: 'Doritos Sour & Spicy', ru: 'Доритос кисло-острые' },
  off_il_0856591000062: { en: 'Oriental Cookies',      ru: 'Восточное печенье' },
  off_il_7290000043814: { en: 'Whipping Cream 38%',    ru: 'Сливки взбитые 38%' },
  off_il_7290008750677: { en: 'Mamoul Cookies',        ru: 'Мамул (печенье)' },
  off_il_7613035622623: { en: 'Honey Fitness Granola', ru: 'Гранола медовая фитнес' },
  off_il_7290016877021: { en: 'Dark Soft Mountain Bread', ru: 'Хлеб горный тёмный мягкий' },
  off_il_7290006681553: { en: 'Krembo Vanilla',        ru: 'Крембо ваниль' },
  off_il_7290114311038: { en: 'Cream 32%',             ru: 'Сливки 32%' },
  off_il_7290114310239: { en: 'Milk 2%',               ru: 'Молоко 2%' },
  off_il_7290106658479: { en: 'Tortilla Wrap',         ru: 'Тортилья' },
  off_il_72917589:      { en: 'Folded Pastry',         ru: 'Сложенная выпечка' },
  off_il_7290112340276: { en: 'Nescafé Coffee Treats', ru: 'Кофейные конфеты Нескафе' },
  off_il_7290110324711: { en: 'Natural Soy Spread 9%', ru: 'Соевая паста натуральная 9%' },
  off_il_7296073442219: { en: 'Cereal Balls Choco & White Choco', ru: 'Злаковые шарики шоколад и белый шоколад' }
};

let fixed = 0;
for (const f of fd) {
  const fix = FIX[f.id];
  if (!fix) continue;
  f.name_en = fix.en;
  f.name_ru = fix.ru;
  fixed++;
}
fs.writeFileSync(DB, JSON.stringify(fd));
console.log('fixed:', fixed, '/', Object.keys(FIX).length);

// контроль: пустых больше нет
const emptyLeft = JSON.parse(fs.readFileSync(DB,'utf8')).filter(f=>!(f.name_en||'').trim()).length;
console.log('осталось пустых name_en:', emptyLeft);
