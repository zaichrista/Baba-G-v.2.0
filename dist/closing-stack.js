/* measures the height of the pinned lower block (Find us + Opening hours) and exposes it as --closing-h */
(() => {
  const stage = document.querySelector('.closing-stage');
  const stack = stage && stage.querySelector('.closing-stack');
  if (!stack) return;
  const set = () => {
    stage.style.setProperty('--closing-h', stack.offsetHeight + 'px');
    window.ScrollTrigger && ScrollTrigger.refresh();
  };
  set();
  if ('ResizeObserver' in window) new ResizeObserver(() => set()).observe(stack);
  addEventListener('load', set);
  document.fonts && document.fonts.ready.then(set);
})();
