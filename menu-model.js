import { MENU_ITEMS, MENU_ADDONS, BUILDER_SIDES } from './menu-data.js';
export const BOX_BASES = ['Lebanese Rice', 'Lebanese Bread', 'No base'];
export const WRAP_BASES = ['Lebanese Bread'];
const allowedIds = {
  fillings: MENU_ADDONS.map(item => item.id),
  addons: MENU_ADDONS.map(item => item.id),
  sides: BUILDER_SIDES.map(item => item.id),
};
export function clampQuantity(value, min = 1, max = 20) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(max, Math.max(min, Math.floor(number))) : min;
}
export function createConfig(item) {
  return { base: item.format === 'wrap' ? 'Lebanese Bread' : 'Lebanese Rice', fillings: {}, addons: {}, sides: {}, sauce: '', notes: '', quantity: 1, halloumiOnTop: false };
}
export function normalizeConfig(item, value = {}) {
  if (!value || typeof value !== 'object') value = {};
  const config = createConfig(item);
  if (item.builder) {
    const bases = item.format === 'wrap' ? WRAP_BASES : BOX_BASES;
    if (bases.includes(value.base)) config.base = value.base;
  }
  for (const key of Object.keys(allowedIds)) {
    if ((key === 'fillings' || key === 'sides') && !item.builder) continue;
    if (key === 'addons' && (item.builder || item.format === 'side')) continue;
    for (const id of allowedIds[key]) {
      const quantity = clampQuantity(value[key]?.[id] ?? 0, 0, 10);
      if (quantity > 0) config[key][id] = quantity;
    }
  }
  config.halloumiOnTop = needsHalloumiPrompt(item) && value.halloumiOnTop === true;
  config.quantity = clampQuantity(value.quantity ?? 1);
  config.sauce = typeof value.sauce === 'string' ? value.sauce.slice(0, 160) : '';
  config.notes = typeof value.notes === 'string' ? value.notes.slice(0, 500) : '';
  return config;
}
export function setChoice(config, group, id, quantity) {
  if (!allowedIds[group]?.includes(id)) return;
  const next = clampQuantity(quantity, 0, 10);
  if (next) config[group][id] = next;
  else delete config[group][id];
}
export function validateConfig(item, config) {
  if (item.builder && !Object.values(config.fillings).some(quantity => quantity > 0)) return 'Choose at least one filling for your custom ' + item.format + '.';
  return '';
}
export function describeConfig(item, config) {
  const parts = [];
  if (item.builder) parts.push(config.base);
  for (const [key, options] of [['fillings', MENU_ADDONS], ['addons', MENU_ADDONS], ['sides', BUILDER_SIDES]]) {
    const labels = options.filter(option => config[key][option.id]).map(option => `${config[key][option.id] > 1 ? config[key][option.id] + ' × ' : ''}${option.label}`);
    if (labels.length) parts.push((key === 'addons' ? 'Extra: ' : '') + labels.join(', '));
  }
  if (config.halloumiOnTop) parts.push('Grilled Halloumi Cheese on top');
  if (config.sauce.trim()) parts.push('Sauce: ' + config.sauce.trim());
  if (config.notes.trim()) parts.push('Notes: ' + config.notes.trim());
  return parts.join(' · ');
}
export function restoreSelections(value) {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 100).flatMap(entry => {
    if (!entry || typeof entry !== 'object') return [];
    const item = MENU_ITEMS.find(item => item.id === entry.itemId);
    if (!item) return [];
    const config = normalizeConfig(item, entry.config);
    if (validateConfig(item, config)) return [];
    return [{ id: typeof entry.id === 'string' ? entry.id : 'restored-' + item.id, itemId: item.id, config }];
  });
}

export function needsHalloumiPrompt(item) {
  return item.format === 'wrap' || item.format === 'box';
}
export function withHalloumiChoice(item, config, accepted) {
  const result = normalizeConfig(item, config);
  result.halloumiOnTop = needsHalloumiPrompt(item) && accepted === true;
  return result;
}
