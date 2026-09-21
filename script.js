const menu=document.querySelector('.menu-toggle');const nav=document.querySelector('.navlinks');menu?.addEventListener('click',()=>{const open=nav.classList.toggle('open');menu.setAttribute('aria-expanded',String(open));menu.setAttribute('aria-label',open?'Zavrieť navigáciu':'Otvoriť navigáciu')});nav?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{nav.classList.remove('open');menu?.setAttribute('aria-expanded','false')}));document.getElementById('year').textContent=new Date().getFullYear();


// Progressive enhancement: no observer or reduced motion = all content visible.
(() => {
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (motionPreference.matches || !('IntersectionObserver' in window)) return;

  const targets = document.querySelectorAll('.motion-stagger, .motion-timeline');
  if (!targets.length) return;

  // Only hide items shortly before observation starts, avoiding no-JS blank content.
  document.documentElement.classList.add('motion-enabled');
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target); // play only once
    }
  }, { threshold: 0.12, rootMargin: '0px 0px 40px 0px' });

  targets.forEach((target) => observer.observe(target));
  motionPreference.addEventListener?.('change', (event) => {
    if (!event.matches) return;
    observer.disconnect();
    document.documentElement.classList.remove('motion-enabled');
    targets.forEach((target) => target.classList.add('is-visible'));
  });
})();

// Copy the displayed address; feedback is shown in the same tooltip.
(() => {
  const button = document.querySelector('[data-copy-email]');
  const tooltip = document.getElementById('email-tooltip-text');
  if (!button || !tooltip) return;
  const initialText = 'Kliknite pre skopírovanie';
  const reset = () => { tooltip.textContent = initialText; };
  button.addEventListener('click', async () => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard API unavailable');
      await navigator.clipboard.writeText(button.dataset.copyEmail);
      tooltip.textContent = 'Adresa je skopírovaná';
    } catch (error) {
      tooltip.textContent = 'Kopírovanie sa nepodarilo';
    }
  });
  button.addEventListener('mouseleave', reset);
  button.addEventListener('blur', reset);
})();
