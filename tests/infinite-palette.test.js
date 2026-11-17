import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

function page() {
  let lenis;
  const listeners = {};
  const makeElement = (top = 0) => ({
    dataset: {}, style: {}, offsetHeight: 860,
    classList: { add() {} },
    querySelectorAll: () => [],
    removeAttribute() {}, setAttribute() {}, insertAdjacentElement() {}, replaceChildren() {},
    cloneNode: () => makeElement(top),
    getBoundingClientRect: () => ({ top }),
  });
  const hero = makeElement();
  hero.nextElementSibling = makeElement();
  hero.cloneNode = () => makeElement(10000);
  const root = { dataset: {} };
  const context = {
    document: { documentElement: root, querySelector: () => ({ querySelector: () => hero, insertAdjacentElement() {} }), createElement: () => makeElement() },
    matchMedia: () => ({ matches: false }),
    Lenis: class { constructor() { lenis = this; this.dimensions = {}; this.animatedScroll = 0; } on(_, callback) { this.callback = callback; } resize() {} },
    ScrollTrigger: { update() {}, refresh() {} },
    gsap: { ticker: { add() {}, lagSmoothing() {} } },
    innerHeight: 1000, scrollY: 0,
    setTimeout() {}, clearTimeout() {},
    addEventListener: (event, callback) => { listeners[event] = callback; },
  };
  vm.runInNewContext(readFileSync(new URL('../infinite-scroll.js', import.meta.url), 'utf8'), context);
  return { root, context, listeners, scroll: value => { lenis.animatedScroll = value; lenis.callback(); } };
}

test('keeps the palette fixed across forward and reverse loops and resizing', () => {
  const p = page();
  for (const position of [0, 9430, 10000, 19430, 20000, 30000, -571, -10000]) {
    p.scroll(position);
    assert.equal(p.root.dataset.palette, undefined, `scroll ${position}`);
  }
  p.context.innerHeight = 800;
  p.listeners.resize();
  assert.equal(p.root.dataset.palette, undefined);
});
