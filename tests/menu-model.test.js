import test from 'node:test';
import assert from 'node:assert/strict';
import { MENU_ITEMS, MENU_SECTIONS, MENU_ADDONS, BUILDER_SIDES } from '../dist/menu-data.js';
import { createConfig, normalizeConfig, setChoice, validateConfig, describeConfig, restoreSelections, clampQuantity } from '../dist/menu-model.js';
const wrap = MENU_ITEMS.find(item => item.section === 'Wraps');
const box = MENU_ITEMS.find(item => item.section === 'Boxes');
const customBox = MENU_ITEMS.find(item => item.id === 'build-box');
const customWrap = MENU_ITEMS.find(item => item.id === 'build-wrap');
test('menu removals and add-on placement match the requested scope', () => {
  assert.deepEqual(MENU_SECTIONS, ['Wraps', 'Boxes', 'Mezze & sides', 'Build your own']);
  assert.equal(MENU_ITEMS.filter(item => item.section === 'Wraps').length, 8);
  assert.equal(MENU_ITEMS.filter(item => item.section === 'Boxes').length, 8);
  assert.equal(MENU_ADDONS.length, 7);
  for (const name of ['Rice Box', 'Salad Box', 'Baba Wrap', 'Prawn Cocktail', 'Fattoush', 'Tabbouleh']) assert.ok(!MENU_ITEMS.some(item => item.name === name));
  assert.ok(MENU_ITEMS.every(item => item.category === 'Food' && item.section !== 'Add-ons' && item.price === null));
});
test('every wrap and box accepts all seven optional add-ons', () => {
  for (const item of MENU_ITEMS.filter(item => !item.builder && item.format !== 'side')) {
    const draft = createConfig(item);
    for (const addon of MENU_ADDONS) setChoice(draft, 'addons', addon.id, 2);
    const config = normalizeConfig(item, draft);
    assert.equal(Object.keys(config.addons).length, 7);
    assert.ok(Object.values(config.addons).every(count => count === 2));
  }
});
test('dish customisations remain independent and saved snapshots do not mutate', () => {
  const first = createConfig(wrap), second = createConfig(box);
  setChoice(first, 'addons', MENU_ADDONS[0].id, 2);
  assert.deepEqual(second.addons, {});
  const saved = normalizeConfig(wrap, first);
  setChoice(first, 'addons', MENU_ADDONS[0].id, 3);
  assert.equal(saved.addons[MENU_ADDONS[0].id], 2);
  assert.equal(first.addons[MENU_ADDONS[0].id], 3);
});
test('build-your-own requires a filling and allows multiple fillings, extras and preparation choices', () => {
  for (const item of [customBox, customWrap]) {
    const config = createConfig(item);
    assert.match(validateConfig(item, config), /at least one filling/);
    setChoice(config, 'fillings', MENU_ADDONS[0].id, 1);
    setChoice(config, 'fillings', MENU_ADDONS[1].id, 2);
    setChoice(config, 'sides', BUILDER_SIDES[0].id, 1);
    config.base = item.format === 'wrap' ? 'Lebanese Bread' : 'No base';
    config.sauce = 'No sauce'; config.notes = 'Please pack extras separately'; config.quantity = 3;
    const normalized = normalizeConfig(item, config);
    assert.equal(validateConfig(item, normalized), '');
    assert.equal(Object.keys(normalized.fillings).length, 2);
    assert.equal(normalized.quantity, 3);
    const summary = describeConfig(item, normalized);
    assert.ok(summary.includes(config.base));
    assert.match(summary, /2 ×/); assert.match(summary, /No sauce/); assert.match(summary, /pack extras separately/);
  }
});
test('removing the final filling restores builder validation', () => {
  const config = createConfig(customBox);
  setChoice(config, 'fillings', MENU_ADDONS[0].id, 1);
  assert.equal(validateConfig(customBox, config), '');
  setChoice(config, 'fillings', MENU_ADDONS[0].id, 0);
  assert.notEqual(validateConfig(customBox, config), '');
});
test('quantity limits and unknown options are handled safely', () => {
  assert.equal(clampQuantity(-4), 1); assert.equal(clampQuantity(500), 20); assert.equal(clampQuantity(NaN), 1);
  const config = createConfig(wrap);
  setChoice(config, 'addons', 'unknown', 5); setChoice(config, 'unknown', MENU_ADDONS[0].id, 1);
  assert.deepEqual(config.addons, {});
  setChoice(config, 'addons', MENU_ADDONS[0].id, 100);
  assert.equal(config.addons[MENU_ADDONS[0].id], 10);
});
test('stored selections round-trip all options and discard removed dishes and invalid builders', () => {
  const config = createConfig(customBox);
  setChoice(config, 'fillings', MENU_ADDONS[2].id, 2);
  setChoice(config, 'sides', BUILDER_SIDES[1].id, 1);
  config.base = 'Lebanese Bread'; config.notes = 'No sauce'; config.quantity = 4;
  const saved = {id: 'example', itemId: customBox.id, config};
  const restored = restoreSelections(JSON.parse(JSON.stringify([saved])));
  assert.deepEqual(restored, [saved]);
  assert.deepEqual(restoreSelections([null, {itemId:'item-51'}, {itemId:customBox.id, config:{}}]), []);
  assert.deepEqual(restoreSelections({}), []);
});
test('malformed saved options cannot introduce ingredients, invalid bases or excess quantities', () => {
  const config = normalizeConfig(customWrap, {base:'Unknown', fillings:{[MENU_ADDONS[0].id]:99, unknown:1}, quantity:100, notes:'x'.repeat(600), sauce:7});
  assert.equal(config.base, 'Lebanese Bread'); assert.equal(config.quantity,20); assert.equal(config.fillings[MENU_ADDONS[0].id],10);
  assert.equal(config.fillings.unknown,undefined); assert.equal(config.notes.length,500); assert.equal(config.sauce,'');
  const side = MENU_ITEMS.find(item => item.format === 'side');
  assert.deepEqual(normalizeConfig(side,{addons:{[MENU_ADDONS[0].id]:1}}).addons,{});
});
