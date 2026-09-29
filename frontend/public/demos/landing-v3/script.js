const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const slugs = ['lector-hub', 'luminar', 'wisen', 'snack-point'];
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
const theme = $('#theme');
function syncTheme() {
  const dark = document.documentElement.classList.contains('dark');
  $('use', theme).setAttribute('href', dark ? '#sun' : '#moon');
  theme.setAttribute('aria-label', dark ? 'Ativar modo claro' : 'Ativar modo escuro');
  theme.setAttribute('aria-pressed', String(dark));
}
syncTheme();
theme.addEventListener('click', () => {
  document.documentElement.classList.toggle('dark');
  try { localStorage.setItem('fernanda-v3-theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light'); } catch {}
  syncTheme();
});
const menu = $('#mobile-menu');
const menuButton = $('#menu-toggle');
function setMenu(open) {
  menu.hidden = !open;
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  $('use', menuButton).setAttribute('href', open ? '#close' : '#menu');
}
menuButton.addEventListener('click', () => setMenu(menu.hidden));
$$('a', menu).forEach(link => link.addEventListener('click', () => setMenu(false)));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !menu.hidden) { setMenu(false); menuButton.focus(); }
});
matchMedia('(min-width:768px)').addEventListener('change', event => { if (event.matches) setMenu(false); });

const track = $('.work-track');
const cards = $$('.work-card');
function moveProject(direction) {
  const step = cards[0].getBoundingClientRect().width + 20;
  const end = Math.max(0, track.scrollWidth - track.clientWidth);
  const target = direction < 0 && track.scrollLeft <= 2 ? end
    : direction > 0 && track.scrollLeft >= end - 2 ? 0
    : Math.max(0, Math.min(end, track.scrollLeft + direction * step));
  track.scrollTo({ left: target, behavior: reduceMotion.matches ? 'instant' : 'smooth' });
}
$('.work-previous').addEventListener('click', () => moveProject(-1));
$('.work-next').addEventListener('click', () => moveProject(1));
track.addEventListener('keydown', event => {
  if (!matchMedia('(min-width:1024px)').matches || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
  event.preventDefault();
  const next = (cards.indexOf(document.activeElement) + (event.key === 'ArrowRight' ? 1 : -1) + cards.length) % cards.length;
  cards[next].focus({ preventScroll: true });
  cards[next].scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' });
});

const dialog = $('#project-dialog');
let activeProject = -1;
let opener = null;
let galleryCleanup = () => {};
let fullscreenFallback = false;
cards.forEach((card, index) => {
  card.setAttribute('aria-controls', 'project-dialog');
  card.addEventListener('click', () => {
    opener = card;
    location.hash = `projeto-${slugs[index]}`;
  });
});
function initializeGallery() {
  const viewport = $('[data-slot="carousel-content"]', dialog);
  if (!viewport) return;
  const galleryTrack = viewport.firstElementChild;
  const slides = $$('[data-slot="carousel-item"]', viewport);
  const previous = $('.work-gallery-previous', dialog);
  const next = $('.work-gallery-next', dialog);
  const count = $('.work-media-count', dialog);
  let selected = 0;
  function update() {
    galleryTrack.style.transform = `translateX(-${selected * 100}%)`;
    slides.forEach((slide, index) => {
      slide.style.transform = '';
      slide.setAttribute('aria-hidden', String(index !== selected));
    });
    count.textContent = `${selected + 1}/${slides.length}`;
    count.setAttribute('aria-label', `${selected + 1} de ${slides.length}`);
    if (previous) previous.disabled = selected === 0;
    if (next) next.disabled = selected === slides.length - 1;
  }
  function move(direction) { selected = Math.max(0, Math.min(slides.length - 1, selected + direction)); update(); }
  previous?.addEventListener('click', () => move(-1));
  next?.addEventListener('click', () => move(1));
  viewport.tabIndex = 0;
  const onKey = event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault(); move(event.key === 'ArrowRight' ? 1 : -1);
    }
  };
  dialog.addEventListener('keydown', onKey);
  galleryCleanup = () => dialog.removeEventListener('keydown', onKey);
  let startX = 0, startY = 0;
  viewport.addEventListener('touchstart', event => { startX = event.changedTouches[0].clientX; startY = event.changedTouches[0].clientY; }, { passive: true });
  viewport.addEventListener('touchend', event => {
    const dx = event.changedTouches[0].clientX - startX;
    const dy = event.changedTouches[0].clientY - startY;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) move(dx < 0 ? 1 : -1);
  }, { passive: true });
  update();
}
function openFromHash() {
  const index = slugs.findIndex(slug => location.hash === `#projeto-${slug}`);
  if (index < 0) { if (dialog.open) dialog.close(); return; }
  if (dialog.open && activeProject === index) return;
  galleryCleanup();
  $('video', dialog)?.pause();
  activeProject = index;
  dialog.innerHTML = originalDialogs[index];
  const title = $('.work-modal-title', dialog);
  dialog.setAttribute('aria-labelledby', title.id);
  $('.work-close', dialog).addEventListener('click', () => dialog.close());
  const video = $('video', dialog);
  if (video) {
    video.muted = true;
    // Honor reduced motion while keeping the original project presentation.
    if (reduceMotion.matches) { video.removeAttribute('autoplay'); video.controls = true; }
    else video.play().catch(() => { video.controls = true; });
    $('.project-fullscreen-button', dialog)?.addEventListener('click', async () => {
      try {
        if (fullscreenFallback) { dialog.classList.remove('video-expanded'); fullscreenFallback = false; }
        else if (document.fullscreenElement) await document.exitFullscreen();
        else await video.parentElement.requestFullscreen();
      } catch { fullscreenFallback = true; dialog.classList.add('video-expanded'); }
    });
  }
  initializeGallery();
  if (!dialog.open) dialog.showModal();
  cards.forEach((card, cardIndex) => card.setAttribute('aria-expanded', String(index === cardIndex)));
}
dialog.addEventListener('cancel', event => {
  if (fullscreenFallback) { event.preventDefault(); fullscreenFallback = false; dialog.classList.remove('video-expanded'); }
});
dialog.addEventListener('close', () => {
  galleryCleanup();
  $('video', dialog)?.pause();
  fullscreenFallback = false;
  dialog.classList.remove('video-expanded');
  if (location.hash.startsWith('#projeto-')) history.replaceState(null, '', `${location.pathname}${location.search}#projetos`);
  const target = opener || cards[activeProject];
  activeProject = -1;
  cards.forEach(card => card.setAttribute('aria-expanded', 'false'));
  if (target) { target.focus({ preventScroll: true }); }
  opener = null;
});
dialog.addEventListener('click', event => {
  if (event.target !== dialog) return;
  const rect = dialog.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
});
window.addEventListener('hashchange', openFromHash);
openFromHash();

const navigation = $$('.site-header nav a');
const sections = ['sobre', 'educacao', 'projetos', 'experiencias', 'premios'].map(id => document.getElementById(id));
let frame = 0;
function updateNavigation() {
  frame = 0;
  const active = sections.filter(section => section.getBoundingClientRect().top <= innerHeight * .3).at(-1);
  navigation.forEach(link => {
    if (active && link.hash === `#${active.id}`) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
}
window.addEventListener('scroll', () => { if (!frame) frame = requestAnimationFrame(updateNavigation); }, { passive: true });
window.addEventListener('resize', updateNavigation);
updateNavigation();

// Inline KPIs keep their final values in HTML and animate once when read.
// Screen readers always receive the final number, without intermediate updates.
const experienceCounts = $$('#experiencias [data-count]');
const runningCounts = new Map();
const finishedCounts = new WeakSet();
function finishCount(element) {
  cancelAnimationFrame(runningCounts.get(element));
  runningCounts.delete(element);
  element.textContent = element.dataset.count;
  element.style.minWidth = '';
  finishedCounts.add(element);
}
const countObserver = new IntersectionObserver(entries => {
  entries.forEach(({ target, isIntersecting }) => {
    if (!isIntersecting) return;
    countObserver.unobserve(target);
    if (finishedCounts.has(target) || reduceMotion.matches) {
      finishCount(target);
      return;
    }
    const value = Number(target.dataset.count);
    target.style.minWidth = `${target.getBoundingClientRect().width}px`;
    const start = performance.now();
    function tick(now) {
      const progress = Math.min((now - start) / 1200, 1);
      target.textContent = String(Math.floor(value * (1 - (1 - progress) ** 3)));
      if (progress < 1) runningCounts.set(target, requestAnimationFrame(tick));
      else finishCount(target);
    }
    target.textContent = '0';
    runningCounts.set(target, requestAnimationFrame(tick));
  });
}, { threshold: 1 });
experienceCounts.forEach(element => countObserver.observe(element));
reduceMotion.addEventListener('change', event => {
  if (!event.matches) return;
  countObserver.disconnect();
  experienceCounts.forEach(finishCount);
});

// Independent award carousel: projects retain their existing markup and behavior.
const awardsTrack = $('#awards-track');
const awardCards = $$('.award-card', awardsTrack);
function moveAward(direction) {
  const step = awardCards[0].getBoundingClientRect().width + 20;
  const end = Math.max(0, awardsTrack.scrollWidth - awardsTrack.clientWidth);
  const target = direction < 0 && awardsTrack.scrollLeft <= 2 ? end
    : direction > 0 && awardsTrack.scrollLeft >= end - 2 ? 0
    : Math.max(0, Math.min(end, awardsTrack.scrollLeft + direction * step));
  awardsTrack.scrollTo({ left: target, behavior: reduceMotion.matches ? 'instant' : 'smooth' });
}
$('.awards-previous').addEventListener('click', () => moveAward(-1));
$('.awards-next').addEventListener('click', () => moveAward(1));
awardsTrack.addEventListener('keydown', event => {
  if (!matchMedia('(min-width:1024px)').matches || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
  event.preventDefault();
  const current = awardCards.indexOf(document.activeElement);
  const next = (current + (event.key === 'ArrowRight' ? 1 : -1) + awardCards.length) % awardCards.length;
  awardCards[next].focus({ preventScroll: true });
  awardCards[next].scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' });
});
// A single clock drives the image change and its progress indicator.
(() => {
  const carousel = document.querySelector('.experience-matmov-media');
  if (!carousel) return;
  const slides = [...carousel.querySelectorAll('.matmov-slide')];
  const position = carousel.querySelector('.matmov-position');
  const pause = carousel.querySelector('[data-matmov="pause"]');
  const progress = carousel.querySelector('.matmov-progress-fill');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const duration = 5000;
  let current = 0;
  let paused = motion.matches;
  let visible = false;
  let elapsed = 0;
  let started = null;
  let frame;
  slides.forEach(slide => { slide.hidden = false; });
  function paintProgress() {
    progress.style.transform = `scaleX(${Math.min(elapsed / duration, 1)})`;
  }
  function show(index) {
    current = (index + slides.length) % slides.length;
    slides.forEach((slide, i) => {
      slide.classList.toggle('is-active', i === current);
      slide.setAttribute('aria-hidden', String(i !== current));
      slide.inert = i !== current;
    });
    position.textContent = `${current + 1} / ${slides.length}`;
    elapsed = 0;
    paintProgress();
  }
  function tick(now) {
    elapsed += now - started;
    started = now;
    if (elapsed >= duration) show(current + 1);
    paintProgress();
    frame = requestAnimationFrame(tick);
  }
  function schedule() {
    cancelAnimationFrame(frame);
    if (started !== null) elapsed = Math.min(duration, elapsed + performance.now() - started);
    started = null;
    paintProgress();
    if (visible && !paused && !document.hidden) {
      started = performance.now();
      frame = requestAnimationFrame(tick);
    }
  }
  function navigate(direction) {
    show(current + direction);
    if (started !== null) started = performance.now();
    schedule();
  }
  function updatePause() {
    pause.innerHTML = paused
      ? '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4v16l13-8z"/></svg>'
      : '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>';
    pause.setAttribute('aria-label', paused ? 'Iniciar troca automática' : 'Pausar troca automática');
    schedule();
  }
  carousel.querySelector('[data-matmov="previous"]').addEventListener('click', () => navigate(-1));
  carousel.querySelector('[data-matmov="next"]').addEventListener('click', () => navigate(1));
  pause.addEventListener('click', () => { paused = !paused; updatePause(); });
  carousel.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    navigate(event.key === 'ArrowRight' ? 1 : -1);
  });
  // Start on first appearance; hovering the image must not stall the bar.
  const visibilityObserver = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    schedule();
  });
  visibilityObserver.observe(carousel);
  document.addEventListener('visibilitychange', schedule);
  motion.addEventListener('change', () => { paused = motion.matches; updatePause(); });
  show(0);
  updatePause();
})();
