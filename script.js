const menu = document.querySelector('.menu-toggle');
const navigation = document.querySelector('.navlinks');
menu?.addEventListener('click', () => {
  const open = navigation.classList.toggle('open');
  menu.setAttribute('aria-expanded', String(open));
  menu.setAttribute('aria-label', open ? 'Zavrieť menu' : 'Otvoriť menu');
});
navigation?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
  navigation.classList.remove('open');
  menu?.setAttribute('aria-expanded', 'false');
}));
const year = document.querySelector('#year');
if (year) year.textContent = String(new Date().getFullYear());
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const reveals = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window && !reducedMotion) {
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); }
  }), { threshold: 0.08, rootMargin: '0px 0px -20px 0px' });
  reveals.forEach(element => observer.observe(element));
} else reveals.forEach(element => element.classList.add('is-visible'));
const email = document.querySelector('[data-copy-email]');
const tooltip = document.querySelector('#email-tooltip-text');
if (email && tooltip) {
  const reset = () => { tooltip.textContent = 'Kliknite pre skopírovanie'; };
  email.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(email.dataset.copyEmail); tooltip.textContent = 'Adresa je skopírovaná'; }
    catch { tooltip.textContent = 'Kopírovanie sa nepodarilo'; }
  });
  email.addEventListener('mouseleave', reset);
  email.addEventListener('blur', reset);
}

// Animate the four process steps in order as the timeline enters the viewport.
const timeline = document.querySelector('.timeline');
if (timeline) {
  const steps = [...timeline.querySelectorAll('li')];
  const activate = () => {
    steps.forEach((step, index) => {
      if (reducedMotion) step.classList.add('step-active');
      else window.setTimeout(() => step.classList.add('step-active'), index * 420);
    });
    if (reducedMotion) timeline.classList.add('timeline-active');
    else window.setTimeout(() => timeline.classList.add('timeline-active'), 120);
  };
  if ('IntersectionObserver' in window && !reducedMotion) {
    const timelineObserver = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { activate(); timelineObserver.disconnect(); }
    }, { threshold: 0.22 });
    timelineObserver.observe(timeline);
  } else activate();
}
