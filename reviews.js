(() => {
  gsap.registerPlugin(ScrollTrigger);

  /* ---------- build the star rows (set data-rating on a card to change it; default 5) ---------- */
  const STAR = '<svg viewBox="0 0 1000 1000" aria-hidden="true"><path d="M500 52l141 285 314 46-227 221 54 313-282-148-282 148 54-313L45 383l314-46z"/></svg>';
  document.querySelectorAll('.review-listing-item').forEach(card => {
    const rating = Number(card.dataset.rating || 5);
    card.querySelector('.stars').innerHTML = Array.from({ length: 5 }, (_, i) =>
      STAR.replace('<svg', i < rating ? '<svg' : '<svg class="off"')).join('');
  });

  /* ---------- scroll-scrubbed tilt ---------- */
  const section = document.getElementById('reviews');
  const items   = [...section.querySelectorAll('.review-item')];
  const odd     = items.filter((_, i) => i % 2 === 0).map(el => el.querySelector('.review-listing-item'));   // 1st, 3rd, 5th…
  const even    = items.filter((_, i) => i % 2 === 1).map(el => el.querySelector('.review-listing-item'));   // 2nd, 4th…
  const wide    = matchMedia('(min-width: 768px)');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // JS owns the transform from here on: sideways offset (x) + rotation share one matrix
  const X = 0;   /* cards centred, no left/right offset */
  function setOffsets(){
    gsap.set(odd,  { x: wide.matches ? -X : 0 });
    gsap.set(even, { x: wide.matches ?  X : 0 });
  }
  setOffsets();
  wide.addEventListener('change', setOffsets);

  if (!reduced){
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top 110%',
        end: 'bottom -10%',
        scrub: true
      }
    });
    tl.fromTo(odd,  { rotation: 0 }, { rotation: -6, ease: 'none' }, 0)
      .fromTo(even, { rotation: 0 }, { rotation:  6, ease: 'none' }, 0);
  }
})();
