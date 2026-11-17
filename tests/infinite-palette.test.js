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
  vm.runInNewContext(readFileSync(new URL('../dist/infinite-scroll.js', import.meta.url), 'utf8'), context);
  return { root, context, listeners, scroll: value => { lenis.animatedScroll = value; lenis.callback(); } };
}

test('changes when half the returning hero is visible and remains stable at the seam', () => {
  const p = page();
  for (const [position, palette] of [[0,'gold'],[9429,'gold'],[9430,'red'],[9999,'red'],[10000,'red'],[19429,'red'],[19430,'green'],[20000,'green'],[29430,'gold'],[30000,'gold']]) {
    p.scroll(position);
    assert.equal(p.root.dataset.palette, palette, `scroll ${position}`);
  }
});

test('reverse scroll restores the previous palette without double changes', () => {
  const p = page();
  for (const [position,palette] of [[19430,'green'],[19429,'red'],[9430,'red'],[9429,'gold'],[-571,'green'],[-570,'gold']]) {
    p.scroll(position);
    assert.equal(p.root.dataset.palette,palette, `scroll ${position}`);
  }
});

test('recomputes the trigger for viewport changes', () => {
  const p = page();
  p.scroll(9500);
  assert.equal(p.root.dataset.palette, 'red');
  p.context.innerHeight = 800;
  p.listeners.resize();
  assert.equal(p.root.dataset.palette, 'gold');
  p.scroll(9630);
  assert.equal(p.root.dataset.palette, 'red');
});
