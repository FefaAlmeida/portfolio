/* Standalone demo. All project content and media are local. */
const projects = [
  {
    id: 'lector-hub', title: 'Lector Hub', status: 'completed', cover: '../lector_hub_logo.jpeg', color: '#460d14',
    subtitle: 'Gestão de acervos, empréstimos e uma comunidade para conectar leitores',
    github: 'https://github.com/FefaAlmeida/lectorHub',
    technologies: ['Next.js', 'Node.js', 'SQL', 'Chakra UI'],
    description: [
      'Como Desenvolvedora Full-Stack, com foco em Back-end, e Gestora do Projeto, atuei na construção de uma plataforma para gestão de acervos bibliográficos, conectando leitores e bibliotecários com controle de empréstimos e comunidade interativa.',
      'O Lector Hub reúne um painel administrativo para organizar o acervo e um portal para leitores reservarem e avaliarem obras.'
    ],
    images: [
      { src: '../lector_hub_logo.jpeg', alt: 'Identidade do Lector Hub: livro dourado sobre fundo vinho', color: '#460d14' },
      { src: 'lector-flow.svg', alt: 'Diagrama ilustrativo: o leitor explora o catálogo, solicita um livro e a biblioteca gerencia o empréstimo.', color: '#f2e9dc' }
    ],
    profiles: [
      { name: 'Os bibliotecários podem:', features: ['Cadastrar e organizar livros e categorias.', 'Aprovar ou recusar solicitações de empréstimo.', 'Controlar devoluções, prazos e bloqueios.', 'Gerenciar usuários e consultar o histórico da biblioteca.'] },
      { name: 'Os leitores podem:', features: ['Explorar o catálogo digital de livros.', 'Solicitar empréstimos e reservar livros.', 'Avaliar, dar notas e comentar sobre as obras.', 'Consultar o histórico de leitura e receber recomendações personalizadas.'] }
    ]
  },
  {
    id: 'snack-point', title: 'Snack Point', status: 'completed', cover: '../snack_point.jpeg', color: '#6f7b67',
    subtitle: 'Cardápio digital e pedidos personalizados para facilitar a rotina na cantina',
    github: 'https://github.com/FefaAlmeida/ProjetoCantina',
    technologies: ['Java', 'Android Studio', 'XML', 'SQLite'],
    description: [
      'Como Desenvolvedora Front-End e responsável pelas integrações Back-End, atuei no desenvolvimento de um aplicativo Android para reduzir filas na cantina do SENAI, simplificando a escolha, a personalização e a realização de pedidos.',
      'O Snack Point reúne consulta ao cardápio, filtros por categoria e montagem do carrinho, com persistência local em SQLite.'
    ],
    images: [
      { src: '../snack_point.jpeg', alt: 'Identidade visual do Snack Point', color: '#6f7b67' },
      { src: 'snack-flow.svg', alt: 'Diagrama ilustrativo: escolher no cardápio, personalizar os itens e enviar o pedido.', color: '#e9eee5' }
    ],
    profiles: [
      { name: 'O cliente pode:', features: ['Consultar o cardápio digital completo da cantina.', 'Filtrar produtos por categoria: salgados, doces, bebidas e pratos.', 'Personalizar ingredientes e incluir observações no pedido.', 'Gerenciar o carrinho com cálculo automático do valor total.', 'Enviar o pedido para agilizar o atendimento no balcão.', 'Manter os dados e o histórico do carrinho salvos localmente.'] }
    ]
  },
  {
    id: 'luminar', title: 'Luminar', status: 'completed', cover: '../luminar_logo.jpeg', color: '#fefefe',
    subtitle: 'Energia solar acessível, com controle da geração e da economia em um só lugar',
    github: 'https://github.com/FefaAlmeida/projetoIntegrador',
    technologies: ['Next.js', 'Node.js', 'SQL'],
    description: [
      'Como Desenvolvedora Fullstack, atuei na construção de uma plataforma criada para ampliar o acesso à energia solar, com parcelamento das placas e acompanhamento do desempenho dos equipamentos.',
      'O Luminar conecta a gestão do parque solar ao dia a dia do cliente, reunindo indicadores de geração, economia e manutenção.'
    ],
    video: 'luminar-demo.mp4',
    profiles: [
      { name: 'A equipe de gestão pode:', features: ['Acompanhar o parque solar por painéis e tabelas.', 'Consultar alertas de manutenção e diagnósticos das placas.', 'Gerenciar clientes, usuários e permissões.', 'Distribuir tarefas e acompanhar chamados.', 'Atender clientes e trocar mensagens pela central de atendimento.', 'Gerenciar pedidos de placas e controlar o estoque.'] },
      { name: 'Os clientes podem:', features: ['Acompanhar a geração de energia.', 'Analisar a economia na conta de luz.', 'Consultar indicadores de desempenho e eficiência.', 'Receber notificações sobre manutenção e outros alertas.', 'Abrir e acompanhar chamados de suporte.'] }
    ]
  },
  {
    id: 'wisen', title: 'Wisen', status: 'development', cover: '../wisen_logo.jpeg', color: '#dad6cf',
    subtitle: 'Notícias reais viram aprendizado personalizado para cada nível de conhecimento',
    github: 'https://github.com/FefaAlmeida/wisen',
    technologies: ['Next.js', 'Node.js', 'SQL', 'Grafo de Conhecimento'],
    description: [
      'Como Pesquisadora e Desenvolvedora Principal do meu TCC, atuei na construção de uma plataforma que utiliza notícias reais como ponto de partida para ensinar conceitos complexos, adaptando o conteúdo ao nível individual de cada leitor.',
      'O Wisen utiliza um Grafo de Conhecimento para cruzar o histórico do usuário e oferecer explicações sob medida, sem repetições desnecessárias. A mesma notícia gera explicações diferentes conforme as lacunas de aprendizado de cada pessoa.'
    ],
    images: [
      { src: '../wisen_logo.jpeg', alt: 'Identidade visual do Wisen', color: '#dad6cf' },
      { src: 'wisen-flow.svg', alt: 'Diagrama ilustrativo: notícias reais conectam conceitos ao histórico do leitor para oferecer aprendizado personalizado.', color: '#eee9e1' }
    ],
    profiles: [
      { name: 'O leitor pode:', features: ['Aprender conceitos a partir de notícias e acontecimentos reais.', 'Receber explicações adaptadas ao seu conhecimento prévio.', 'Aprofundar os conceitos que ainda precisa compreender.', 'Revisar conteúdos conforme suas lacunas de aprendizado.', 'Explorar relações entre conceitos, entidades e eventos no Grafo de Conhecimento.'] }
    ]
  }
];

const icon = (name, classes = '') => name === 'github'
  ? '<i class="bi bi-github github-icon" aria-hidden="true"></i>'
  : `<svg class="icon ${classes}" aria-hidden="true"><use href="#i-${name}"/></svg>`;
const list = items => `<ul class="feature-list">${items.map(item => `<li>${item}</li>`).join('')}</ul>`;
const cardRoot = document.querySelector('#project-cards');
const dialogRoot = document.querySelector('#project-dialogs');
let activeDialog = null;
let returnFocus = null;
const slides = new Map();

for (const project of projects) {
  const inDevelopment = project.status === 'development';
  const statusLabel = inDevelopment ? 'Em desenvolvimento' : 'Concluído';
  cardRoot.insertAdjacentHTML('beforeend', `
    <button id="open-${project.id}" data-open="${project.id}" type="button" class="project-card rounded-2xl text-left" aria-label="Saiba mais sobre ${project.title} — ${statusLabel}">
      <div class="project-card-content overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--paper)]">
      <span class="project-status ${inDevelopment ? 'project-status-development' : 'project-status-completed'}">${statusLabel}</span>
      <div class="project-card-cover" style="background-color:${project.color}"><img src="${project.cover}" alt="" loading="eager"></div>
      <div class="p-5"><div class="flex items-center justify-between gap-3"><h2 class="editorial project-card-title">${project.title}</h2>${icon('arrow', 'project-card-heading-arrow text-[var(--accent)]')}</div><p class="project-card-subtitle">${project.subtitle}</p><span class="project-card-mobile-action" aria-hidden="true">Saiba mais${icon('arrow')}</span></div>
      </div>
      <span class="code-link project-card-action" aria-hidden="true"><span>Saiba mais</span>${icon('arrow', '!size-3.5')}</span>
    </button>`);

  const media = project.video
    ? `<div class="media-frame video-frame"><video muted loop playsinline disablepictureinpicture disableremoteplayback preload="metadata" poster="luminar-poster.svg" aria-label="Animação ilustrativa do Luminar, sem áudio"><source src="${project.video}" type="video/mp4"></video><div class="video-error" role="status" hidden><p>Não foi possível carregar o vídeo.</p><button type="button" class="code-link" data-retry>Carregar novamente</button></div><button type="button" class="fullscreen-button" aria-label="Tela cheia" title="Tela cheia">${icon('maximize')}</button></div>`
    : `<section class="media-frame" aria-label="Imagens de ${project.title}" aria-roledescription="carrossel">
        ${project.images.map((image, index) => `<div class="media-slide" data-index="${index}" role="group" aria-roledescription="slide" aria-label="${index + 1} de ${project.images.length}" style="background:${image.color}" ${index ? 'hidden' : ''}><img src="${image.src}" alt="${image.alt}" draggable="false"></div>`).join('')}
        <button type="button" class="gallery-arrow previous" disabled ${project.images.length < 2 ? 'hidden' : ''} data-direction="-1" aria-label="Imagem anterior">${icon('chevron', 'rotate-180')}</button>
        <button type="button" class="gallery-arrow next" ${project.images.length < 2 ? 'hidden' : ''} data-direction="1" aria-label="Próxima imagem">${icon('chevron')}</button>
        <span class="media-count" aria-live="polite" aria-atomic="true">1/${project.images.length}</span>
      </section>`;
  const features = `<div class="feature-profiles">${project.profiles.map((profile, index) => `<section class="feature-profile" aria-labelledby="profile-${project.id}-${index}"><h3 id="profile-${project.id}-${index}">${profile.name}</h3>${list(profile.features)}</section>`).join('')}</div>`;

  dialogRoot.insertAdjacentHTML('beforeend', `
    <dialog id="${project.id}" class="project-modal" aria-labelledby="title-${project.id}">
      <div class="modal-shell">
        <header class="modal-header"><h2 id="title-${project.id}" class="editorial modal-title" tabindex="-1" autofocus>${project.title}</h2><button type="button" class="icon-button" data-close aria-label="Fechar ${project.title}" title="Fechar (Esc)">${icon('x')}</button></header>
        <div class="modal-scroll">
          ${media}
          <div class="project-description">${project.description.map(paragraph => `<p>${paragraph}</p>`).join('')}</div>
          <div class="features">${features}</div>
          <div class="project-toolbar"><ul class="flex flex-wrap gap-1.5" aria-label="Tecnologias utilizadas">${project.technologies.map(tech => `<li class="tech-chip">${tech}</li>`).join('')}</ul><a class="code-link" href="${project.github}" target="_blank" rel="noopener noreferrer">${icon('github')}Ver código${icon('arrow', '!size-3.5')}<span class="sr-only"> no GitHub (abre em nova aba)</span></a></div>
        </div>
      </div>
    </dialog>`);

  const dialog = document.getElementById(project.id);
  const video = dialog.querySelector('video');
  let pointerOnBackdrop = false;
  function outside(event) {
    const rect = dialog.getBoundingClientRect();
    return event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom;
  }
  dialog.querySelector('[data-close]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('pointerdown', event => { pointerOnBackdrop = outside(event); });
  dialog.addEventListener('click', event => {
    if (pointerOnBackdrop && outside(event)) dialog.close();
    pointerOnBackdrop = false;
  });
  dialog.addEventListener('cancel', event => {
    if (document.fullscreenElement) {
      event.preventDefault();
      document.exitFullscreen().catch(() => {});
    }
  });
  dialog.addEventListener('close', () => {
    // A queued close event may arrive after another dialog has opened.
    if (dialog.open) return;
    video?.pause();
    if (activeDialog !== dialog) return;
    document.body.style.overflow = '';
    activeDialog = null;
    returnFocus?.focus({ preventScroll:true });
    if (location.hash === `#${project.id}`) history.replaceState(null, '', location.pathname + location.search);
  });

  if (video) {
    const frame = dialog.querySelector('.video-frame');
    const fullscreenButton = dialog.querySelector('.fullscreen-button');
    let expanded = false;
    const updateFullscreenButton = () => {
      const isFull = expanded || document.fullscreenElement === frame;
      const label = isFull ? 'Sair da tela cheia' : 'Tela cheia';
      fullscreenButton.setAttribute('aria-label', label);
      fullscreenButton.title = label;
      fullscreenButton.querySelector('use').setAttribute('href', isFull ? '#i-minimize' : '#i-maximize');
    };
    const setExpanded = value => {
      expanded = value;
      dialog.classList.toggle('video-expanded', value);
      dialog.querySelectorAll('.modal-header,.project-description,.project-toolbar,.features').forEach(element => { element.inert = value; });
      updateFullscreenButton();
      if (dialog.open) fullscreenButton.focus({ preventScroll:true });
    };
    const exitFullscreen = () => {
      if (document.fullscreenElement === frame) document.exitFullscreen().catch(() => {});
      if (expanded) setExpanded(false);
    };
    fullscreenButton.addEventListener('click', async () => {
      if (expanded || document.fullscreenElement === frame) return exitFullscreen();
      try {
        if (!frame.requestFullscreen) throw new Error('Fullscreen unavailable');
        await frame.requestFullscreen();
      } catch {
        if (dialog.open) setExpanded(true);
      }
    });
    document.addEventListener('fullscreenchange', updateFullscreenButton);
    document.addEventListener('keydown', event => {
      if (event.key !== 'Escape' || !dialog.open || (!expanded && document.fullscreenElement !== frame)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      exitFullscreen();
    }, true);
    dialog.addEventListener('close', () => { if (!dialog.open) exitFullscreen(); });
    const error = dialog.querySelector('.video-error');
    const showError = () => { error.hidden = false; };
    video.addEventListener('error', showError);
    video.querySelector('source').addEventListener('error', showError);
    dialog.querySelector('[data-retry]').addEventListener('click', () => {
      error.hidden = true;
      video.load();
      video.play().catch(() => {});
      fullscreenButton.focus();
    });
  } else {
    slides.set(project.id, 0);
    const select = direction => {
      const next = Math.max(0, Math.min(project.images.length - 1, slides.get(project.id) + direction));
      slides.set(project.id, next);
      dialog.querySelectorAll('.media-slide').forEach((slide, index) => { slide.hidden = next !== index; });
      dialog.querySelector('.media-count').textContent = `${next + 1}/${project.images.length}`;
      dialog.querySelector('.gallery-arrow.previous').disabled = next === 0;
      dialog.querySelector('.gallery-arrow.next').disabled = next === project.images.length - 1;
    };
    dialog.querySelectorAll('[data-direction]').forEach(button => button.addEventListener('click', () => select(Number(button.dataset.direction))));
    dialog.querySelector('.media-frame').addEventListener('keydown', event => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); select(event.key === 'ArrowRight' ? 1 : -1); }
    });
  }
}

function openProject(id) {
  const dialog = document.getElementById(id);
  if (!dialog?.matches('dialog') || activeDialog?.open) return;
  returnFocus = document.querySelector(`[data-open="${id}"]`);
  activeDialog = dialog;
  document.body.style.overflow = 'hidden';
  if (slides.has(id)) {
    slides.set(id, 0);
    dialog.querySelectorAll('.media-slide').forEach((slide, index) => { slide.hidden = index !== 0; });
    dialog.querySelector('.media-count').textContent = `1/${dialog.querySelectorAll('.media-slide').length}`;
    dialog.querySelector('.gallery-arrow.previous').disabled = true;
    dialog.querySelector('.gallery-arrow.next').disabled = dialog.querySelectorAll('.media-slide').length < 2;
  }
  dialog.showModal();
  const video = dialog.querySelector('video');
  if (video) {
    video.muted = true;
    video.play().catch(() => {});
  }
  dialog.querySelector('.modal-scroll').scrollTop = 0;
  dialog.querySelector('.modal-title').focus({ preventScroll:true });
}
document.querySelectorAll('[data-open]').forEach(button => button.addEventListener('click', () => openProject(button.dataset.open)));
const themeButton = document.querySelector('#theme-toggle');
themeButton.addEventListener('click', () => {
  const dark = document.documentElement.classList.toggle('dark');
  themeButton.setAttribute('aria-label', dark ? 'Ativar tema claro' : 'Ativar tema escuro');
  themeButton.querySelector('span').textContent = dark ? 'Tema claro' : 'Tema escuro';
  themeButton.querySelector('use').setAttribute('href', dark ? '#i-sun' : '#i-moon');
});
const openFromHash = () => {
  const id = location.hash.slice(1);
  if (!projects.some(project => project.id === id)) return;
  if (activeDialog?.open && activeDialog.id !== id) activeDialog.close();
  openProject(id);
};
window.addEventListener('hashchange', openFromHash);
openFromHash();


const previousProjects = document.querySelector('#projects-previous');
const nextProjects = document.querySelector('#projects-next');
const projectsPosition = document.querySelector('#projects-position');
const desktopProjects = window.matchMedia('(min-width:1024px)');
const reducedMotion = window.matchMedia('(prefers-reduced-motion:reduce)');
function updateProjectNavigation() {
  const step = cardRoot.firstElementChild.getBoundingClientRect().width + 20;
  const first = Math.round(cardRoot.scrollLeft / step);
  previousProjects.disabled = cardRoot.scrollLeft <= 1;
  nextProjects.disabled = cardRoot.scrollLeft >= cardRoot.scrollWidth - cardRoot.clientWidth - 1;
  projectsPosition.textContent = `${first + 1}–${Math.min(first + 3, projects.length)} de ${projects.length}`;
}
function moveProjects(direction) {
  if (!desktopProjects.matches) return;
  const step = cardRoot.firstElementChild.getBoundingClientRect().width + 20;
  cardRoot.scrollBy({ left:direction * step, behavior:reducedMotion.matches ? 'instant' : 'smooth' });
}
previousProjects.addEventListener('click', () => moveProjects(-1));
nextProjects.addEventListener('click', () => moveProjects(1));
cardRoot.addEventListener('scroll', updateProjectNavigation, { passive:true });
cardRoot.addEventListener('keydown', event => {
  if (!desktopProjects.matches || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
  event.preventDefault();
  const cards = [...cardRoot.children];
  const current = cards.indexOf(document.activeElement);
  const next = Math.max(0, Math.min(cards.length - 1, current + (event.key === 'ArrowRight' ? 1 : -1)));
  cards[next].focus({ preventScroll:true });
  cards[next].scrollIntoView({ behavior:reducedMotion.matches ? 'instant' : 'smooth', block:'nearest', inline:'nearest' });
});
new ResizeObserver(() => {
  if (!desktopProjects.matches) cardRoot.scrollLeft = 0;
  updateProjectNavigation();
}).observe(cardRoot);
updateProjectNavigation();

const magneticPointer = window.matchMedia('(min-width:641px) and (hover:hover) and (pointer:fine)');
for (const card of cardRoot.children) {
  const action = card.querySelector('.project-card-action');
  let currentX = 0, currentY = 0, targetX = 0, targetY = 0;
  let frame = 0, lastTime = 0;
  const paintMagnet = () => {
    action.style.setProperty('--magnet-x', `${currentX.toFixed(3)}px`);
    action.style.setProperty('--magnet-y', `${currentY.toFixed(3)}px`);
  };
  const animateMagnet = time => {
    // Time-based damping keeps the same soft response at any refresh rate.
    const elapsed = Math.min(64, time - lastTime);
    lastTime = time;
    const blend = 1 - Math.exp(-elapsed / 115);
    currentX += (targetX - currentX) * blend;
    currentY += (targetY - currentY) * blend;
    if (Math.hypot(targetX - currentX, targetY - currentY) < .02) {
      currentX = targetX;
      currentY = targetY;
      frame = 0;
    } else {
      frame = requestAnimationFrame(animateMagnet);
    }
    paintMagnet();
  };
  const moveMagnet = (x, y) => {
    targetX = x;
    targetY = y;
    if (!frame) {
      lastTime = performance.now();
      frame = requestAnimationFrame(animateMagnet);
    }
  };
  const resetMagnet = () => {
    if (reducedMotion.matches || !magneticPointer.matches) {
      cancelAnimationFrame(frame);
      frame = 0;
      currentX = currentY = targetX = targetY = 0;
      paintMagnet();
    } else {
      moveMagnet(0, 0);
    }
  };
  card.addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse' || !magneticPointer.matches || reducedMotion.matches || card.matches(':focus-visible')) {
      resetMagnet();
      return;
    }
    const bounds = card.getBoundingClientRect();
    const x = event.clientX - bounds.left - bounds.width / 2;
    const y = event.clientY - bounds.top - bounds.height / 2;
    // Keep a generous, stationary target around the centered button.
    const safeX = action.offsetWidth / 2 + 24;
    const safeY = action.offsetHeight / 2 + 24;
    const distance = Math.hypot(x / safeX, y / safeY);
    const proximity = Math.min(1, Math.max(0, (distance - 1) / 1.2));
    const strength = proximity * proximity * (3 - 2 * proximity);
    const offset = (value, size) => Math.max(-12, Math.min(12, value / (size / 2) * 12)) * strength;
    moveMagnet(offset(x, bounds.width), offset(y, bounds.height));
  });
  card.addEventListener('pointerleave', resetMagnet);
  card.addEventListener('pointercancel', resetMagnet);
  card.addEventListener('focus', resetMagnet);
  card.addEventListener('click', resetMagnet);
  magneticPointer.addEventListener('change', resetMagnet);
  reducedMotion.addEventListener('change', resetMagnet);
}
