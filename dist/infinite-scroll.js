/* PIECE 5 — INFINITE SCROLL, HERO = FOOTER (wired in from 5-infinite-scroll-hero-footer.html)
   • The site's existing hero is cloned (one source, so they can never drift apart) and is the very last block of the page.
   • Lenis runs with infinite:true exactly as in the piece: scrolling past the bottom wraps to the top (and past the top wraps
     to the bottom). Hero and footer are the same block, so the jump is invisible.

   SEAMLESS WRAP — why there is a little extra code compared with the piece:
   The piece's hero is exactly one viewport tall, so Lenis' default loop length (page height − viewport) equals the
   hero→footer distance. Here the hero is shorter than the viewport, so we (1) tell Lenis the true loop length and
   (2) append a clipped, inert copy of whatever sits right under the hero, filling the rest of the screen when the
   footer-hero is in view, so the last screen is pixel-identical to the first screen.
   Nothing else on the page is moved or restyled. */
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const main = document.querySelector('main');
  const hero = main && main.querySelector(':scope > .hero');
  const next = hero && hero.nextElementSibling;                   // the section visible under the hero
  if (!hero || !next || typeof Lenis === 'undefined') return;

  const strip = n => { n.querySelectorAll('[id]').forEach(e => e.removeAttribute('id')); n.removeAttribute('id'); };

  /* ---------- hero → footer copy ---------- */
  const copy = hero.cloneNode(true);
  copy.classList.add('hero-as-footer');
  copy.removeAttribute('aria-labelledby');
  copy.setAttribute('aria-label', 'Baba G');
  strip(copy);
  copy.querySelectorAll('h1').forEach(n => n.remove());            // one <h1> per page
  main.insertAdjacentElement('afterend', copy);

  /* ---------- filler: the first pixels of the next section, shown under the footer-hero ----------
     Re-copied after the other pieces have initialised (curved title, first colour circle…) and after a resize,
     so it always matches what the top of the page shows. */
  const filler = document.createElement('div');
  filler.className = 'hero-as-footer-filler';
  filler.setAttribute('aria-hidden', 'true');
  filler.inert = true;
  copy.insertAdjacentElement('afterend', filler);
  const buildFiller = () => {
    const nextCopy = next.cloneNode(true);
    strip(nextCopy);
    filler.replaceChildren(nextCopy);
  };
  buildFiller();

  const palettes = ['gold', 'red', 'green'];
  const paletteFor = lap => palettes[((lap % palettes.length) + palettes.length) % palettes.length];
  let currentPalette;
  const setPalette = index => {
    if (index === currentPalette) return;
    currentPalette = index;
    document.documentElement.dataset.palette = paletteFor(index);
  };
  setPalette(0);

  /* ============================ THE INFINITE SCROLL (as in the piece) ============================ */
  const lenis = new Lenis({
    duration: 1,
    smoothWheel: !reduced,
    infinite: true,                                   // ← wrap at both ends: the hero/footer swap is invisible
    anchors: true,                                    // keeps the site's smooth #anchor scrolling now that Lenis owns scrolling
    easing: x => x === 1 ? 1 : 1 - Math.pow(2, -10 * x),
  });

  /* loop length = distance from the hero to its copy (cached; recomputed on resize) */
  let loop = 0;
  let paletteLead = 0;
  const updatePalette = () => {
    // Same trigger as Tripletta: footer.top <= viewportHeight - footer.height / 2.
    // Both heroes inherit the new palette together; wrapping never changes it again.
    // Unbounded scroll keeps this stable over multiple laps and when scrolling back.
    if (loop > 0) setPalette(Math.floor((lenis.animatedScroll + paletteLead) / loop));
  };
  const measure = () => {
    const heroTop = hero.getBoundingClientRect().top + scrollY;
    const copyTop = copy.getBoundingClientRect().top + scrollY;
    loop = copyTop - heroTop;
    paletteLead = innerHeight - copy.offsetHeight * .5;
    filler.style.height = Math.max(0, innerHeight - copy.offsetHeight) + 'px';
    updatePalette();
  };
  Object.defineProperty(lenis.dimensions, 'limit', { get: () => ({ x: 0, y: loop }) });

  lenis.on('scroll', () => {
    updatePalette();
    ScrollTrigger.update();
  });
  gsap.ticker.add(t => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);

  let ft;   // the first colour circle takes 0.5s to grow in, so copy the section once things have settled
  const refresh = () => { measure(); lenis.resize(); ScrollTrigger.refresh(); clearTimeout(ft); ft = setTimeout(buildFiller, 900); };
  refresh();
  addEventListener('load', refresh);
  let rt; addEventListener('resize', () => { measure(); clearTimeout(rt); rt = setTimeout(refresh, 450); });
  document.fonts && document.fonts.ready.then(refresh);
})();
