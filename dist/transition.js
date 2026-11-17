/* PIECE 1 — PAGE TRANSITION (wired in from 1-crav-page-transition.html)
   The wave-curtain animation (leave / enter), label, timings and cycling tab title are the piece's own, unchanged.
   Only the demo "fetch + replace <main>" router was swapped for a real multi-page one:
     click internal link → LEAVE curtain rises → browser navigates → new page loads already covered → ENTER curtain lifts.
   Add data-transition-ignore to any link to skip the effect. */
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- CONFIG ---------- */
  const LABEL = 'Craving...';
  const TITLE_WORDS = ['Sizzling','Grilling','Flipping','Serving','Enjoy'];
  const SITE = 'Baba G';

  const layers = {
    red:    document.getElementById('layer-red'),
    orange: document.getElementById('layer-orange'),
    yellow: document.getElementById('layer-yellow'),
  };
  const labelWrap = document.getElementById('label');
  document.getElementById('label-text').textContent = LABEL;

  /* Build the wave path from the three numbers.
     fromTop = false → solid area hangs from the BOTTOM (leave: rising curtain)
     fromTop = true  → solid area hangs from the TOP    (enter: curtain lifting away) */
  const shape = (s, fromTop) =>
    `M -1 ${fromTop ? -1 : 101} L 101 ${fromTop ? -1 : 101} L 101 ${s.yRight} Q 50 ${s.yCenter} -1 ${s.yLeft} Z`;

  const state = () => ({ yLeft: 101, yRight: 101, yCenter: 101 });
  const bottomCollapsed = 'M -1 101 L 101 101 L 101 101 Q 50 101 -1 101 Z';
  const topFilled       = 'M -1 -1 L 101 -1 L 101 101 Q 50 101 -1 101 Z';


  const ENTER_KEY = 'baba-transition-entering';
  const routeKey = () => {
    const f = location.pathname.split('/').pop().replace(/\.html?$/, '');
    return (!f || f === 'index') ? 'home' : f;
  };

  /* ---------- LEAVE: curtain rises, label pops in ---------- */
  function leave(done){
    const tl = gsap.timeline({ onComplete: done });
    gsap.set(Object.values(layers), { attr: { d: bottomCollapsed } });

    // [layer, start delay]  — red first, then orange, then yellow on top
    [[layers.red, 0], [layers.orange, .1], [layers.yellow, .2]].forEach(([el, at]) => {
      const s = state();
      const paint = () => el.setAttribute('d', shape(s, false));
      // centre of the edge shoots up first (the bulge)…
      tl.to(s, { yCenter: -1, duration: .65, ease: 'power2.out', onUpdate: paint }, at)
      // …then the two sides catch up and flatten the edge
        .to(s, { yLeft: -1, yRight: -1, duration: .85, ease: 'power3.inOut', onUpdate: paint }, at);
    });

    tl.fromTo(labelWrap,
      { scale: .7, opacity: 0, y: 30 },
      { scale: 1, opacity: 1, y: 0, duration: .5, ease: 'back.out(2)',
        onComplete: () => { pulse = gsap.timeline({ repeat: -1 })
            .to('#label-text', { opacity: .3, duration: .4, yoyo: true, repeat: 1, ease: 'sine.inOut' }); } },
      '-=0.4');
  }
  let pulse;

  /* ---------- ENTER: curtain lifts away upward ---------- */
  function enter(done){
    const tl = gsap.timeline({ onComplete: done });
    gsap.set(Object.values(layers), { attr: { d: topFilled } });

    // yellow leaves first, red last (reverse of the leave order)
    [[layers.yellow, 0], [layers.orange, .1], [layers.red, .2]].forEach(([el, at]) => {
      const s = state();
      tl.to(s, { yLeft: -1, yRight: -1, duration: .75, ease: 'power2.inOut' }, at)
        .to(s, { yCenter: -1, duration: 1.05, ease: 'power4.inOut',
                 onUpdate: () => el.setAttribute('d', shape(s, true)) }, at);
    });

    tl.fromTo(labelWrap,
      { scale: 1, opacity: 1 },
      { scale: 1.3, opacity: 0, duration: .4, ease: 'power2.in',
        onStart: () => pulse && pulse.kill() }, 0);
  }


  /* ---------- real navigation (replaces the demo swapPage) ---------- */
  let busy = false;
  function isInternalPageLink(a){
    const u = new URL(a.href, location.href);
    if (!/^(https?:|file:)$/.test(u.protocol) || u.protocol !== location.protocol || u.host !== location.host) return null;
    const norm = p => p.replace(/\/index\.html?$/, '/').replace(/\/$/, '');
    if (norm(u.pathname) === norm(location.pathname) && u.search === location.search) return null;   // same page / #hash only
    return u;
  }
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    if (!a || busy || reduced) return;
    if (a.hasAttribute('data-transition-ignore') || a.target === '_blank' || a.download) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    const u = isInternalPageLink(a);
    if (!u) return;
    e.preventDefault();

    busy = true;
    stopTitle();
    leave(() => {
      try { sessionStorage.setItem(ENTER_KEY, '1'); } catch (_) {}
      location.href = u.href;
    });
  });

  /* ---------- arriving on a page: it loads covered, then the curtain lifts ---------- */
  function arrive(){
    let entering = false;
    try { entering = sessionStorage.getItem(ENTER_KEY) === '1'; sessionStorage.removeItem(ENTER_KEY); } catch (_) {}
    if (entering && !reduced){
      busy = true;
      enter(() => { document.documentElement.classList.remove('is-entering'); busy = false; startTitle(routeKey()); });
      document.documentElement.classList.remove('is-entering');   // paths are now filled by enter(); the cover class is no longer needed
    } else {
      document.documentElement.classList.remove('is-entering');
      startTitle(routeKey());
    }
  }
  // back/forward cache: a restored page may still show the covered state — reset it
  addEventListener('pageshow', (e) => {
    if (e.persisted){
      busy = false; if (pulse) pulse.kill();
      gsap.set(Object.values(layers), { attr: { d: bottomCollapsed } });
      gsap.set(labelWrap, { opacity: 0 });
      startTitle(routeKey());
    }
  });

  /* ---------- static tab title ---------- */
  const pretty = k => k === 'home' ? SITE : k.charAt(0).toUpperCase() + k.slice(1);
  function startTitle(key = 'home'){ document.title = pretty(key); }
  function stopTitle(){}
  startTitle();
  arrive();
})();
