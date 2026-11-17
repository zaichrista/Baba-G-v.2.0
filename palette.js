(() => {
  // CSS masks retain the supplied vector outlines while inheriting each hero's accent.
  document.querySelectorAll('.gold-frame img.g-mark,.gold-frame img.lg-mark').forEach(img => {
    const mark = document.createElement('span');
    mark.className = img.className;
    mark.setAttribute('aria-hidden', 'true');
    img.replaceWith(mark);
  });
  // The supplied placeholder illustrations also inherit the page's pale surfaces.
  document.querySelectorAll('img.c-promotion_image[src^="data:image/svg+xml,"]').forEach(img => {
    const source = decodeURIComponent(img.getAttribute('src').split(',').slice(1).join(','));
    const svg = new DOMParser().parseFromString(source, 'image/svg+xml').documentElement;
    if (svg.localName !== 'svg') return;
    svg.setAttribute('class', img.className);
    svg.setAttribute('aria-hidden', 'true');
    img.replaceWith(svg);
  });
})();
