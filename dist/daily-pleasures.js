(() => {
  gsap.registerPlugin(ScrollTrigger);

  const root     = document.getElementById('promotions');
  const sticky   = document.getElementById('sticky');
  const track    = document.getElementById('track');
  const items    = [...track.querySelectorAll('.c-promotion')];
  const slides   = items.filter(i => !i.classList.contains('c-promotion--cta'));   // the six pleasures (the last item is the menu button)
  const medias   = slides.map(i => i.querySelector('.c-promotion_media'));
  const splashes = [...sticky.querySelectorAll('.c-promotions_backsplash')];
  const desktop  = matchMedia('(min-width: 1001px)');
  const reduced  = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1. curved title: draw a circle path for the text to sit on ---------- */
  const title = document.getElementById('curved-title');
  const textEl = title.querySelector('text');
  const pathEl = title.querySelector('#circlePath');
  function drawCircle(){
    const diameter = 736;                                  // viewBox size
    const radius   = diameter / 2;
    const fs       = parseFloat(getComputedStyle(textEl).fontSize) || 64;
    const r = radius - (fs * 1.5) / 2;                     // path radius, leaves room for the text height
    const cx = radius, cy = radius + r;
    // start at the bottom, sweep clockwise through the top → text centred at 50% lands on top
    pathEl.setAttribute('d', `M ${cx},${cy} a ${r},${r} 0 1,1 0,-${r*2} a ${r},${r} 0 1,1 0,${r*2}`);
  }

  /* ---------- 2. sizes ---------- */
  let trackWidth = 0, itemWidth = 0;
  function measure(){
    trackWidth = track.getBoundingClientRect().width;
    itemWidth  = items[0].getBoundingClientRect().width;
    const section = root.closest('.o-section');
    const cs = getComputedStyle(section);
    const pad = (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0);
    const h = Math.max(sticky.getBoundingClientRect().height + pad, innerHeight);
    document.documentElement.style.setProperty('--vw-diagonal', Math.sqrt(innerWidth**2 + h**2) + 'px');
    drawCircle();
  }
  let t; addEventListener('resize', () => { clearTimeout(t); t = setTimeout(() => { measure(); ScrollTrigger.refresh(); }, 300); });

  /* ---------- 3. colour circle: black > gold > cream > black > gold > cream ---------- */
  const COLOURS    = ['#1e1e1e', 'var(--palette-accent)', 'var(--palette-cream)', '#1e1e1e', 'var(--palette-accent)', 'var(--palette-cream)'];   // circle colour per slide
  const SPLASH_INK = ['var(--palette-paper)', '#1e1e1e', '#1e1e1e', 'var(--palette-paper)', '#1e1e1e', '#1e1e1e'];   // text colour on each circle
  const section = root.closest('.o-section');
  let index = 0, oldIndex = 0;                                // the section is black from the start: slide 1's colour
  section.style.backgroundColor = COLOURS[0];
  root.style.setProperty('--promo-ink', SPLASH_INK[0]);
  function showSplash(initial){
    gsap.set(splashes, { zIndex: -30 });
    if (!initial) gsap.set(splashes[oldIndex], { zIndex: -20 });
    gsap.set(splashes[index], { zIndex: -10 });
    root.style.setProperty('--promo-ink', SPLASH_INK[index]);
    const i = index;
    const done = () => { if (i === index) section.style.backgroundColor = COLOURS[i]; };   // the section itself takes the colour once the circle has landed
    if (reduced || initial){ gsap.set(splashes[index], { scale: 1, xPercent: -50, yPercent: -50 }); done(); return; }
    gsap.fromTo(splashes[index],
      { scale: 0, xPercent: -50, yPercent: -50 },
      { scale: 1, xPercent: -50, yPercent: -50, duration: .5, ease: 'power2.out', onComplete: done });
  }
  // gsap owns the transform now — drop the CSS fallback
  splashes.forEach(s => { s.style.transform = 'none'; gsap.set(s, { xPercent: -50, yPercent: -50, scale: 0 }); });

  function getIndex(p){                                       // progress 0‥1 → slide number
    return Math.min(splashes.length - 1, Math.round(p * (items.length - 1)));
  }

  /* ---------- 4. DESKTOP: scroll drives x + rotation ---------- */
  const xTo = gsap.quickTo(track, 'x', { duration: .1, ease: 'power3.out' });
  const rotTo = medias.map(m => gsap.quickTo(m, 'rotation', { duration: .2, ease: 'power3.out' }));

  ScrollTrigger.create({
    trigger: sticky,
    start: 'center center',
    endTrigger: root,
    end: 'bottom bottom',
    onUpdate: self => {
      if (!desktop.matches) return;
      const p = self.progress;
      xTo(-p * trackWidth + p * itemWidth);
      rotTo.forEach((to, i) => to((i % 2 === 0 ? -1 : 1) * p * 180 * (items.length - 1)));
      index = getIndex(p);
      if (index !== oldIndex){ showSplash(); oldIndex = index; }
    }
  });

  /* ---------- 5. MOBILE: scroll-snap carousel + buttons ---------- */
  const prev = document.querySelector('.-prev'), next = document.querySelector('.-next');
  function slideNow(){
    const c = track.getBoundingClientRect(); const mid = c.left + c.width / 2;
    let best = 0, d = Infinity;
    items.forEach((el, i) => { const r = el.getBoundingClientRect(); const dd = Math.abs(r.left + r.width / 2 - mid); if (dd < d){ d = dd; best = i; } });
    return best;
  }
  function goTo(i){ items[Math.max(0, Math.min(items.length - 1, i))].scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' }); }
  prev.addEventListener('click', () => goTo(slideNow() - 1));
  next.addEventListener('click', () => goTo(slideNow() + 1));
  let st;
  track.addEventListener('scroll', () => {
    if (desktop.matches) return;
    clearTimeout(st);
    st = setTimeout(() => { index = Math.min(splashes.length - 1, slideNow()); if (index !== oldIndex){ showSplash(); oldIndex = index; } }, 80);
  }, { passive: true });

  /* reset transforms when crossing the breakpoint */
  desktop.addEventListener('change', () => {
    gsap.set(track, { x: 0 }); medias.forEach(m => gsap.set(m, { rotation: 0 }));
    measure(); ScrollTrigger.refresh();
  });

  measure();
  showSplash(true);
  addEventListener('load', () => { measure(); ScrollTrigger.refresh(); });
})();
