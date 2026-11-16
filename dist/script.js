import { MENU_ITEMS, MENU_SECTIONS, MENU_ADDONS, BUILDER_SIDES } from './menu-data.js';
import { BOX_BASES, WRAP_BASES, clampQuantity, createConfig, normalizeConfig, setChoice, validateConfig, describeConfig, restoreSelections, needsHalloumiPrompt, withHalloumiChoice } from './menu-model.js';
const byId = id => document.getElementById(id);
const sectionButtons = [...document.querySelectorAll('.menu-category')];
const wrapArt = document.querySelector('.wrap-silhouette').outerHTML;
const bowlArt = document.querySelector('.bowl-silhouette').outerHTML;
const configurations = new Map();
let selectedItem;
let pendingSelection = null;
const halloumiDialog = byId('halloumi-dialog');
let savedSelections = [];
let storageAvailable = true;
try { savedSelections = restoreSelections(JSON.parse(localStorage.getItem('baba-menu-selections-v1') || '[]')); } catch { storageAvailable = false; }
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}
function currentConfig() {
  if (!configurations.has(selectedItem.id)) configurations.set(selectedItem.id, createConfig(selectedItem));
  return configurations.get(selectedItem.id);
}
function updatePreview() {
  byId('preview-customisation').textContent = describeConfig(selectedItem, currentConfig());
  const quantity = currentConfig().quantity;
  byId('dish-quantity').textContent = quantity;
  byId('quantity-minus').disabled = quantity <= 1;
  byId('quantity-plus').disabled = quantity >= 20;
}
function clearStatus() { byId('selection-status').textContent = ''; }
function countGroup(title, group, options) {
  const fieldset = el('fieldset', 'custom-fieldset');
  fieldset.append(el('legend', '', title));
  options.forEach(option => {
    const row = el('div', 'custom-option' + (option.id === 'item-37' ? ' halloumi-option' : ''));
    const label = el('label', 'option-label');
    const input = el('input');
    input.type = 'checkbox';
    input.name = group;
    input.value = option.id;
    input.checked = Boolean(currentConfig()[group][option.id]);
    label.append(input, el('span', '', option.label));
    const stepper = el('div', 'option-stepper stepper');
    const minus = el('button', '', '−');
    minus.type = 'button';
    minus.setAttribute('aria-label', `Remove one ${option.label}`);
    const quantity = el('output');
    quantity.setAttribute('aria-live', 'polite');
    const plus = el('button', '', '+');
    plus.type = 'button';
    plus.setAttribute('aria-label', `Add one ${option.label}`);
    function refresh() {
      const count = currentConfig()[group][option.id] || 0;
      input.checked = count > 0;
      stepper.hidden = count === 0;
      quantity.textContent = count;
      plus.disabled = count >= 10;
      updatePreview();
    }
    input.addEventListener('change', () => { clearStatus(); setChoice(currentConfig(), group, option.id, input.checked ? 1 : 0); refresh(); });
    minus.addEventListener('click', () => { clearStatus(); setChoice(currentConfig(), group, option.id, (currentConfig()[group][option.id] || 0) - 1); refresh(); if (!input.checked) input.focus(); });
    plus.addEventListener('click', () => { clearStatus(); setChoice(currentConfig(), group, option.id, (currentConfig()[group][option.id] || 0) + 1); refresh(); });
    stepper.append(minus, quantity, plus);
    row.append(label, stepper);
    fieldset.append(row);
    refresh();
  });
  return fieldset;
}
function renderCustomiser() {
  const config = currentConfig();
  byId('custom-product-name').textContent = selectedItem.name;
  byId('customiser-title').textContent = selectedItem.builder ? 'BUILD YOUR OWN' : selectedItem.format === 'side' ? 'YOUR SELECTION' : 'CUSTOMISATION';
  byId('builder-options').replaceChildren();
  byId('addon-options').replaceChildren();
  if (selectedItem.builder) {
    const formatFieldset = el('fieldset', 'custom-fieldset');
    formatFieldset.append(el('legend', '', '01 / Choose your format'));
    const formats = el('div', 'format-switch');
    for (const format of ['box', 'wrap']) {
      const label = el('label');
      const radio = el('input');
      radio.type = 'radio'; radio.name = 'format'; radio.value = format; radio.checked = selectedItem.format === format;
      radio.addEventListener('change', () => selectDish('build-' + format));
      label.append(radio, el('span', '', format === 'box' ? 'A box' : 'A wrap'));
      formats.append(label);
    }
    formatFieldset.append(formats);
    const baseFieldset = el('fieldset', 'custom-fieldset');
    baseFieldset.append(el('legend', '', '02 / Choose your base'));
    for (const base of selectedItem.format === 'wrap' ? WRAP_BASES : BOX_BASES) {
      const label = el('label', 'base-choice');
      const input = el('input');
      input.type = 'radio'; input.name = 'base'; input.value = base; input.checked = config.base === base;
      input.addEventListener('change', () => { clearStatus(); currentConfig().base = base; updatePreview(); });
      label.append(input, el('span', '', base));
      baseFieldset.append(label);
    }
    byId('builder-options').append(formatFieldset, baseFieldset, countGroup('03 / Choose your fillings', 'fillings', MENU_ADDONS), countGroup('04 / Add your extras', 'sides', BUILDER_SIDES));
  } else if (selectedItem.format !== 'side') {
    byId('addon-options').append(countGroup('Add-ons / Optional', 'addons', MENU_ADDONS));
  }
  byId('preference-fields').hidden = selectedItem.format === 'side';
  byId('sauce-note').value = config.sauce;
  byId('dish-notes').value = config.notes;
  updatePreview();
}
function selectDish(id) {
  const item = MENU_ITEMS.find(dish => dish.id === id);
  if (!item) return;
  selectedItem = item;
  clearStatus();
  document.querySelectorAll('.dish-choice').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.item === id)));
  byId('dish-name').textContent = item.name;
  byId('dish-section').textContent = item.section.toUpperCase();
  byId('menu-selection').textContent = item.name.toUpperCase();
  byId('dish-art').setAttribute('aria-label', `${item.name} photo placeholder`);
  byId('dish-art').replaceChildren();
  if (item.image) {
    const photo = document.createElement('img'); photo.src = item.image; photo.alt = item.name;
    byId('dish-art').append(photo);
  } else byId('dish-art').innerHTML = item.format === 'wrap' ? wrapArt : bowlArt;
  document.querySelector('.preview-photo-note').hidden = Boolean(item.image);
  byId('dish-description').textContent = item.builder ? 'Start with a box or wrap, then choose every part on the right.' : item.format === 'side' ? 'Something on the side. Food photography coming soon.' : 'Choose your extras on the right. Food photography coming soon.';
  renderCustomiser();
}
function selectSection(section) {
  if (!MENU_SECTIONS.includes(section)) return;
  const items = MENU_ITEMS.filter(item => item.section === section);
  sectionButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.section === section)));
  byId('current-menu-section').textContent = section;
  byId('footer-category').textContent = section.toUpperCase();
  byId('menu-count').textContent = String(items.length).padStart(2, '0');
  byId('dish-list').setAttribute('aria-label', `${section} items`);
  byId('dish-list').replaceChildren();
  for (const item of items) {
    const button = el('button', 'dish-choice');
    button.type = 'button'; button.dataset.item = item.id; button.setAttribute('aria-pressed', 'false');
    const arrow = el('span', '', '↗'); arrow.setAttribute('aria-hidden', 'true');
    button.append(el('span', '', item.name), arrow);
    button.addEventListener('click', () => selectDish(item.id));
    byId('dish-list').append(button);
  }
  selectDish(items[0].id);
}
function persistSelections() {
  try { localStorage.setItem('baba-menu-selections-v1', JSON.stringify(savedSelections)); storageAvailable = true; } catch { storageAvailable = false; }
}
function renderSavedSelections() {
  const count = savedSelections.reduce((sum, entry) => sum + entry.config.quantity, 0);
  byId('selection-count').textContent = count;
  byId('saved-count').textContent = count;
  byId('saved-list').replaceChildren();
  if (!savedSelections.length) byId('saved-list').append(el('p', 'empty-selection', 'Your saved meals will appear here.'));
  for (const entry of savedSelections) {
    const item = MENU_ITEMS.find(item => item.id === entry.itemId);
    const row = el('article', 'saved-dish');
    row.append(el('h5', '', `${entry.config.quantity} × ${item.name}`));
    const description = describeConfig(item, entry.config);
    if (description) row.append(el('p', '', description));
    const remove = el('button', 'remove-selection', 'Remove');
    remove.type = 'button'; remove.setAttribute('aria-label', `Remove ${item.name} from saved selections`);
    remove.addEventListener('click', () => {
      savedSelections = savedSelections.filter(saved => saved.id !== entry.id);
      persistSelections(); renderSavedSelections();
      byId('selection-status').textContent = `${item.name} removed.`;
      byId('receipt-title').focus();
    });
    row.append(remove); byId('saved-list').append(row);
  }
  document.querySelector('.saved-note').textContent = storageAvailable ? 'Saved on this device. Ordering coming soon.' : 'Saved for this visit. Ordering coming soon.';
}
sectionButtons.forEach(button => button.addEventListener('click', () => selectSection(button.dataset.section)));
byId('quantity-minus').addEventListener('click', () => { clearStatus(); currentConfig().quantity = clampQuantity(currentConfig().quantity - 1); updatePreview(); });
byId('quantity-plus').addEventListener('click', () => { clearStatus(); currentConfig().quantity = clampQuantity(currentConfig().quantity + 1); updatePreview(); });
byId('sauce-note').addEventListener('input', event => { clearStatus(); currentConfig().sauce = event.target.value; updatePreview(); });
byId('dish-notes').addEventListener('input', event => { clearStatus(); currentConfig().notes = event.target.value; updatePreview(); });
function saveMeal(item, config) {
  savedSelections.push({ id: globalThis.crypto?.randomUUID?.() || String(Date.now()) + '-' + Math.random().toString(16).slice(2), itemId: item.id, config });
  configurations.set(item.id, normalizeConfig(item, config));
  persistSelections(); renderSavedSelections();
  if (selectedItem.id === item.id) updatePreview();
  byId('selection-status').textContent = `${config.quantity} × ${item.name} saved${storageAvailable ? ' on this device' : ' for this visit'}.`;
}
function finishHalloumiChoice(accepted) {
  if (!pendingSelection) return;
  const { item, config } = pendingSelection;
  pendingSelection = null;
  const finalConfig = withHalloumiChoice(item, config, accepted);
  halloumiDialog.close();
  saveMeal(item, finalConfig);
}
byId('halloumi-yes').addEventListener('click', () => finishHalloumiChoice(true));
byId('halloumi-next-time').addEventListener('click', () => finishHalloumiChoice(false));
halloumiDialog.addEventListener('cancel', () => { pendingSelection = null; });
halloumiDialog.addEventListener('close', () => { pendingSelection = null; });
byId('customisation-form').addEventListener('submit', event => {
  event.preventDefault();
  if (pendingSelection || halloumiDialog.open) return;
  const config = normalizeConfig(selectedItem, currentConfig());
  const error = validateConfig(selectedItem, config);
  if (error) { byId('selection-status').textContent = error; document.querySelector('input[name="fillings"]')?.focus(); return; }
  if (savedSelections.length >= 100) { byId('selection-status').textContent = 'Remove a saved selection before adding another.'; return; }
  if (needsHalloumiPrompt(selectedItem)) {
    pendingSelection = { item: selectedItem, config };
    byId('halloumi-dish-name').textContent = selectedItem.name;
    halloumiDialog.showModal();
    return;
  }
  saveMeal(selectedItem, config);
});
selectSection('Wraps');
renderSavedSelections();
