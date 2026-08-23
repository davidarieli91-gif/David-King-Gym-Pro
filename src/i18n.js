// Загружается как ES-модуль до основного скрипта (deferred)
import en from './i18n/en.json';
import ru from './i18n/ru.json';
import he from './i18n/he.json';
window.__I18N__ = { en, ru, he };
import './muscle-map.js';
