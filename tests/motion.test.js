import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

function intro({ reduced = false, ready = false } = {}) {
  const listeners = {}, timers = new Map(), animations = [], decorations = [];
  const classes = new Set(['g-smack-pending']);
  let id = 0;
  const element = () => ({ style: {}, remove() {}, animate(frames, options) {
    const a = { frames, options, cancelled: false, cancel() { this.cancelled = true; } };
    animations.push(a); return a;
  } });
  const baba = element(), grill = element(), g = element();
  g.parentNode = { querySelector: selector => selector === '.baba-mark' ? baba : grill };
  const hero = { children: [g.parentNode], querySelector: () => g,
    querySelectorAll: () => decorations, appendChild: n => decorations.push(n) };
  g.parentNode.animate = element().animate;
  const root = { dataset: ready ? { pageReady: 'true' } : {}, classList: {
    add: c => classes.add(c), remove: c => classes.delete(c), contains: c => classes.has(c),
  } };
  vm.runInNewContext(readFileSync(new URL('../smack.js', import.meta.url), 'utf8'), {
    document: { documentElement: root, querySelector: () => hero, createElement: element },
    matchMedia: () => ({ matches: reduced, addEventListener() {} }),
    addEventListener: (name, fn) => { listeners[name] = fn; },
    setTimeout: fn => { timers.set(++id, fn); return id; }, clearTimeout: id => timers.delete(id),
  });
  return { animations, classes, emit: name => listeners[name]?.(),
    flush() { const pending = [...timers.values()]; timers.clear(); pending.forEach(fn => fn()); } };
}

test('G waits for the curtain, then replays on every arrival with one shared impact time', () => {
  const p = intro();
  assert.equal(p.animations.length, 0);
  p.emit('baba:page-ready'); p.flush();
  assert.equal(p.animations.length, 6);
  assert.equal(p.animations[0].frames[2].offset * p.animations[0].options.duration, 520);
  assert.equal(p.animations[3].options.delay, 520);
  assert.equal(p.animations[4].options.delay, 520);
  assert.equal(p.animations[5].options.delay, 520);
  assert.equal(p.classes.has('g-smack-pending'), false);
  const first = [...p.animations];
  p.emit('pagehide');
  assert.ok(first.every(a => a.cancelled));
  p.emit('baba:page-ready'); p.flush();
  assert.equal(p.animations.length, 12);
});

test('cached readiness runs the intro and repeated arrival signals do not stack it', () => {
  const p = intro({ ready: true });
  p.emit('baba:page-ready'); p.emit('baba:page-ready'); p.flush();
  assert.equal(p.animations.length, 6);
});

test('reduced motion leaves the logo visible without impact effects', () => {
  const p = intro({ reduced: true });
  p.emit('baba:page-ready'); p.flush();
  assert.equal(p.animations.length, 0);
  assert.equal(p.classes.has('g-smack-pending'), false);
});

function promotions() {
  let trigger;
  const el = () => ({ style: { setProperty() {} }, querySelector: () => el(), getBoundingClientRect: () => ({ height: 600 }), setAttribute() {} });
  const section = el(), splashes = Array.from({ length: 6 }, el);
  const items = Array.from({ length: 7 }, (_, i) => ({ ...el(), offsetLeft: i * (400 + 128), classList: { contains: () => i === 6 } }));
  const track = { ...el(), querySelectorAll: () => items, addEventListener() {} };
  const sticky = { ...el(), querySelectorAll: () => splashes };
  const root = { ...el(), closest: () => section };
  const title = { querySelector: () => el() };
  let active = [];
  const gsap = {
    registerPlugin() {},
    set(targets, props) { (Array.isArray(targets) ? targets : [targets]).forEach(t => Object.assign(t, props)); },
    killTweensOf() { active = []; },
    fromTo(target, from, to) { Object.assign(target, from); active.push(() => { Object.assign(target, to); to.onComplete(); }); },
  };
  vm.runInNewContext(readFileSync(new URL('../daily-pleasures.js', import.meta.url), 'utf8'), {
    gsap, ScrollTrigger: { create: value => { trigger = value; }, refresh() {} },
    document: { getElementById: id => ({ promotions: root, sticky, track, 'curved-title': title })[id],
      querySelector: () => ({ addEventListener() {} }), documentElement: el() },
    matchMedia: query => ({ matches: query.includes('min-width'), addEventListener() {} }),
    getComputedStyle: () => ({ fontSize: '64', paddingTop: '128', paddingBottom: '128' }),
    innerWidth: 1440, innerHeight: 900, addEventListener() {}, setTimeout() {}, clearTimeout() {},
  });
  return { section, track, move: p => trigger.onUpdate({ progress: p }), refresh: p => trigger.onRefresh({ progress: p }),
    finish: () => active.forEach(fn => fn()), pending: () => active.length };
}

test('Daily Pleasures starts black and reaches the final card with all six gaps included', () => {
  const p = promotions();
  assert.equal(p.section.style.backgroundColor, '#1e1e1e');
  p.move(1);
  assert.equal(p.track.x, -6 * (400 + 128));
  p.finish();
  assert.equal(p.section.style.backgroundColor, 'var(--palette-cream)');
  p.move(0); p.finish();
  assert.equal(p.section.style.backgroundColor, '#1e1e1e');
  assert.equal(Math.abs(p.track.x), 0);
});

test('fast direction changes keep only the latest colour animation and refresh restores the current position', () => {
  const p = promotions();
  for (const value of [.2, .4, .7, .3, .9, 0]) p.move(value);
  assert.equal(p.pending(), 1);
  p.finish();
  assert.equal(p.section.style.backgroundColor, '#1e1e1e');
  p.refresh(.5);
  assert.equal(p.pending(), 0);
  assert.equal(p.track.x, -3 * (400 + 128));
});
