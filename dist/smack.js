(function(){
  const root = document.documentElement;
  const hero = document.querySelector('main > .hero');
  const g = hero && hero.querySelector('.gold-frame .g-mark');
  const reduced = matchMedia('(prefers-reduced-motion:reduce)');
  const done = () => root.classList.remove('g-smack-pending');
  if (!g || !g.animate || reduced.matches) { done(); return; }
  const frame = g.parentNode;
  const words = [frame.querySelector('.baba-mark'), frame.querySelector('.lg-mark')].filter(Boolean);
  let animations = [], timer;
  function reset(){
    clearTimeout(timer);
    animations.forEach(a => a.cancel());
    animations = [];
    hero.querySelectorAll('.smack-ring,.smack-flash').forEach(n => n.remove());
    words.forEach(n => n.style.opacity = '');
    done();
  }
  function animate(el, frames, options){
    const a = el.animate(frames, options);
    animations.push(a);
    return a;
  }
  function play(){
    reset();
    if (reduced.matches) return;
    // One clock owns the hit, lettering and shake; delayed callbacks cannot drift apart.
    animate(g, [
      {opacity:0,transform:'translateX(-50%) scale(9) rotate(-14deg)',offset:0,easing:'cubic-bezier(.75,0,1,.7)'},
      {opacity:1,transform:'translateX(-50%) scale(9) rotate(-14deg)',offset:.04,easing:'cubic-bezier(.75,0,1,.7)'},
      {opacity:1,transform:'translateX(-50%) scale(.82,.78) rotate(2deg)',offset:.52,easing:'ease-out'},
      {opacity:1,transform:'translateX(-50%) scale(1.1,1.12) rotate(-1deg)',offset:.72,easing:'ease-in-out'},
      {opacity:1,transform:'translateX(-50%) scale(.97) rotate(.5deg)',offset:.86},
      {opacity:1,transform:'translateX(-50%) scale(1) rotate(0)',offset:1}
    ], {duration:1000,fill:'backwards'});
    words.forEach((el,i) => animate(el, [{opacity:0,filter:'blur(8px)'},{opacity:1,filter:'blur(0)'}],
      {delay:600+i*140,duration:350,easing:'ease-out',fill:'backwards'}));
    Array.from(hero.children).forEach(el => animate(el,
      [{translate:'0 0'},{translate:'-14px 10px'},{translate:'12px -9px'},{translate:'-9px -6px'},{translate:'7px 6px'},{translate:'-3px 2px'},{translate:'0 0'}],
      {delay:520,duration:420,easing:'ease-out'}));
    const ring = document.createElement('div'); ring.className='smack-ring'; hero.appendChild(ring);
    animate(ring, [{opacity:.9,transform:'translate(-50%,-50%) scale(.2)',borderWidth:'14px'},
      {opacity:0,transform:'translate(-50%,-50%) scale(4)',borderWidth:'1px'}],
      {delay:520,duration:800,easing:'cubic-bezier(.1,.7,.2,1)'}).onfinish = () => ring.remove();
    const flash = document.createElement('div'); flash.className='smack-flash'; hero.appendChild(flash);
    animate(flash, [{opacity:.95},{opacity:0}], {delay:520,duration:420,easing:'ease-out'}).onfinish = () => flash.remove();
  }
  function schedule(){
    reset();
    if (reduced.matches) return;
    root.classList.add('g-smack-pending');
    timer = setTimeout(play, 150);
  }
  addEventListener('baba:page-ready', schedule);
  addEventListener('pagehide', reset);
  reduced.addEventListener('change', reset);
  // Standalone loading and scripts served from cache follow the same path.
  if (root.dataset.pageReady === 'true') schedule();
  // If the transition library fails to load, still reveal and animate the logo.
  addEventListener('load', () => {
    if (root.dataset.pageReady === 'true') return;
    if (!root.classList.contains('is-entering')) schedule();
    else timer = setTimeout(() => { if (root.dataset.pageReady !== 'true') schedule(); }, 4200);
  });
})();
