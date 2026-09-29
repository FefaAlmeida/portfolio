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
