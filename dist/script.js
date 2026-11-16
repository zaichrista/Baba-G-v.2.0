const sectionButtons = [...document.querySelectorAll('.menu-category')];
const dishList = document.getElementById('dish-list');
const priceList = document.getElementById('dish-prices');
const dishArt = document.getElementById('dish-art');
const wrapArt = document.querySelector('.wrap-silhouette').outerHTML;
const bowlArt = document.querySelector('.bowl-silhouette').outerHTML;
const drinkArt = '<svg class="food-silhouette" viewBox="0 0 240 240" aria-hidden="true"><path d="M64 67h104l-12 121H78Z"/><ellipse cx="116" cy="67" rx="52" ry="14"/><path class="food-detail" d="M168 85h10c38 0 36 60-16 60M98 41q-13-13 0-28m25 28q-13-13 0-28M67 199h102"/></svg>';
function selectDish(id) {
  const item = MENU_ITEMS.find(dish => dish.id === id);
  if (!item) return;
  dishList.querySelectorAll('.dish-choice').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.item === id)));
  priceList.querySelectorAll('.dish-price').forEach(row => row.classList.toggle('is-selected', row.dataset.priceFor === id));
  document.getElementById('dish-name').textContent = item.name;
  document.getElementById('dish-section').textContent = item.section.toUpperCase();
  document.getElementById('menu-selection').textContent = `${item.section} / ${item.name}`.toUpperCase();
  dishArt.setAttribute('aria-label', `${item.name} photo placeholder`);
  dishArt.replaceChildren();
  if (item.image) {
    const photo = document.createElement('img');
    photo.src = item.image;
    photo.alt = item.name;
    dishArt.append(photo);
  } else {
    dishArt.innerHTML = item.category === 'Drinks' ? drinkArt : item.section === 'Wraps' ? wrapArt : bowlArt;
  }
  document.querySelector('.preview-photo-note').hidden = Boolean(item.image);
  document.getElementById('dish-description').textContent = item.description || 'A little space for a closer look. Image coming soon.';
}
function selectSection(section) {
  const items = MENU_ITEMS.filter(item => item.section === section);
  if (!items.length) return;
  sectionButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.section === section)));
  document.getElementById('current-menu-section').textContent = section;
  document.getElementById('menu-count').textContent = `${String(items.length).padStart(2, '0')} ${items.length === 1 ? 'ITEM' : 'ITEMS'}`;
  dishList.setAttribute('aria-label', `${section} items`);
  dishList.replaceChildren();
  priceList.replaceChildren();
  items.forEach((item, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'dish-choice';
    button.dataset.item = item.id;
    button.setAttribute('aria-pressed', 'false');
    const number = document.createElement('span');
    number.className = 'dish-number';
    number.textContent = String(index + 1).padStart(2, '0');
    const name = document.createElement('span');
    name.textContent = item.name;
    const arrow = document.createElement('span');
    arrow.className = 'dish-arrow';
    arrow.setAttribute('aria-hidden', 'true');
    arrow.textContent = '↗';
    button.append(number, name, arrow);
    button.addEventListener('click', () => selectDish(item.id));
    dishList.append(button);
    const priceRow = document.createElement('div');
    priceRow.className = 'dish-price';
    priceRow.dataset.priceFor = item.id;
    const priceName = document.createElement('span');
    priceName.className = 'price-item-name';
    priceName.textContent = `${item.name}: `;
    const price = document.createElement('span');
    price.textContent = item.price === null ? '—' : new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(item.price);
    if (item.price === null) price.setAttribute('aria-label', 'Price not yet available');
    priceRow.append(priceName, price);
    priceList.append(priceRow);
  });
  selectDish(items[0].id);
}
sectionButtons.forEach(button => button.addEventListener('click', () => selectSection(button.dataset.section)));
selectSection('Wraps');
