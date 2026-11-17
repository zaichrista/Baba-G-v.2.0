(function(){
  var root=document.documentElement;
  function done(){root.classList.remove('g-smack-pending')}
  var g=document.querySelector('.gold-frame .g-mark');
  var hero=document.querySelector('.hero');
  var reduced=window.matchMedia&&matchMedia('(prefers-reduced-motion:reduce)').matches;
  if(!g||!hero||reduced||!g.animate||!root.classList.contains('g-smack-pending')){done();return}
  var frame=g.parentNode,baba=frame.querySelector('.baba-mark'),lg=frame.querySelector('.lg-mark');
  var IMPACT=520,DUR=1000;
  var delay=root.classList.contains('is-entering')?1500:300;

  setTimeout(function(){
    // G: huge and invisible, slams down, squashes, rebounds
    var ease='cubic-bezier(.75,0,1,.7)';
    g.style.opacity='';
    var a=g.animate([
      {opacity:0,transform:'translateX(-50%) scale(9) rotate(-14deg)',easing:ease,offset:0},
      {opacity:1,transform:'translateX(-50%) scale(9) rotate(-14deg)',easing:ease,offset:.04},
      {opacity:1,transform:'translateX(-50%) scale(.82,.78) rotate(2deg)',easing:'ease-out',offset:IMPACT/DUR},
      {transform:'translateX(-50%) scale(1.1,1.12) rotate(-1deg)',easing:'ease-in-out',offset:.72},
      {transform:'translateX(-50%) scale(.97) rotate(.5deg)',offset:.86},
      {opacity:1,transform:'translateX(-50%) scale(1) rotate(0)',offset:1}
    ],{duration:DUR,fill:'backwards'});
    root.classList.remove('g-smack-pending');
    // BABA + LEBANESE GRILL stay hidden until the hit, then punch in
    [baba,lg].forEach(function(el,i){
      if(!el)return;
      el.style.opacity='0';
      setTimeout(function(){
        el.style.opacity='';
        el.animate([{opacity:0,filter:'blur(8px)'},{opacity:1,filter:'blur(0)'}],{duration:350,easing:'ease-out'});
      },IMPACT+80+i*140);
    });
    setTimeout(impact,IMPACT);
    a.onfinish=function(){};
  },delay);

  function impact(){
    // screen shake: move the hero's contents (not the hero) so no edges peek through,
    // using the independent `translate` property so each child's own transform is untouched
    var kids=[].slice.call(hero.children).filter(function(k){return !k.classList.contains('smack-ring')&&!k.classList.contains('smack-flash')});
    kids.forEach(function(k){
      k.animate([
        {translate:'0 0'},{translate:'-14px 10px'},{translate:'12px -9px'},
        {translate:'-9px -6px'},{translate:'7px 6px'},{translate:'-3px 2px'},{translate:'0 0'}
      ],{duration:420,easing:'ease-out'});
    });
    // shockwave
    var ring=document.createElement('div');ring.className='smack-ring';frame.parentNode.appendChild(ring);
    ring.animate([{opacity:.9,transform:'translate(-50%,-50%) scale(.2)',borderWidth:'14px'},{opacity:0,transform:'translate(-50%,-50%) scale(4)',borderWidth:'1px'}],{duration:800,easing:'cubic-bezier(.1,.7,.2,1)'}).onfinish=function(){ring.remove()};
    // flash
    var f=document.createElement('div');f.className='smack-flash';hero.appendChild(f);
    f.animate([{opacity:.95},{opacity:0}],{duration:420,easing:'ease-out'}).onfinish=function(){f.remove()};
  }
})();
