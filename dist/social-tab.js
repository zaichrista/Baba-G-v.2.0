(function(){
  if(document.querySelector('.social-tab'))return;
  var t=document.createElement('nav');
  t.className='social-tab';t.setAttribute('aria-label','Social links and email');
  t.innerHTML=
  '<a class="st-gold" href="#" target="_blank" rel="noopener" aria-label="Instagram"><svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".6" fill="currentColor"/></svg></a>'+
  '<a class="st-black" href="#" target="_blank" rel="noopener" aria-label="TikTok"><svg viewBox="0 0 24 24"><path d="M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5M14 3c.4 2.8 2.2 4.6 5 5"/></svg></a>'+
  '<a class="st-cream" href="mailto:info@babag.uk" aria-label="Email Baba G"><svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="m4 7 8 6 8-6"/></svg></a>';
  document.body.appendChild(t);
})();
