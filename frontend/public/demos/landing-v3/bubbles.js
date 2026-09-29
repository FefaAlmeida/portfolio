// Keep most bubbles in the shared gutters and section spacing.
(() => {
  const randomBetween = (min, max) => min + Math.random() * (max - min);
  const sections = [...document.querySelectorAll('main > section')];
  const fields = sections.map(section => {
    const field = document.createElement('div');
    field.className = 'bubble-field';
    field.setAttribute('aria-hidden', 'true');
    const zones = [
      ['left', 8, .25, .38], ['right', 8, .25, .38],
      ['top', 5, .18, .28], ['bottom', 5, .18, .28],
      ['content', 4, .07, .12],
    ];
    for (const [name, count, minOpacity, maxOpacity] of zones) {
      const zone = document.createElement('div');
      zone.className = `bubble-zone bubble-zone-${name}`;
      for (let i = 0; i < count; i++) {
        const duration = randomBetween(18, 36);
        const rise = document.createElement('span');
        rise.className = 'bubble-rise';
        rise.style.left = `${randomBetween(10, 85).toFixed(1)}%`;
        rise.style.setProperty('--bubble-delay', `${-randomBetween(0, duration).toFixed(1)}s`);
        rise.style.setProperty('--bubble-duration', `${duration.toFixed(1)}s`);
        rise.style.setProperty('--bubble-opacity', randomBetween(minOpacity, maxOpacity).toFixed(2));
        rise.style.setProperty('--bubble-sway', `${randomBetween(5, 14).toFixed(0)}px`);
        rise.style.setProperty('--bubble-sway-duration', `${randomBetween(3.5, 8).toFixed(1)}s`);
        const sway = document.createElement('span');
        sway.className = 'bubble-sway';
        const bubble = document.createElement('span');
        bubble.className = 'bubble';
        sway.append(bubble);
        rise.append(sway);
        zone.append(rise);
      }
      field.append(zone);
    }
    section.prepend(field);
    return field;
  });
  function updateBounds() {
    const viewport = document.documentElement.clientWidth;
    sections.forEach((section, index) => {
      const rect = section.getBoundingClientRect();
      const container = section.querySelector('.landing-container, .shell') || section;
      const content = container.getBoundingClientRect();
      const style = getComputedStyle(container);
      const sectionStyle = getComputedStyle(section);
      const field = fields[index];
      field.style.left = `${-rect.left}px`;
      field.style.width = `${viewport}px`;
      field.style.setProperty('--bubble-left', `${content.left + parseFloat(style.paddingLeft)}px`);
      field.style.setProperty('--bubble-right', `${viewport - content.right + parseFloat(style.paddingRight)}px`);
      field.style.setProperty('--bubble-top', `${Math.min(56, parseFloat(sectionStyle.paddingTop))}px`);
      field.style.setProperty('--bubble-bottom', `${Math.min(56, parseFloat(sectionStyle.paddingBottom))}px`);
    });
  }
  updateBounds();
  addEventListener('resize', updateBounds, { passive: true });
})();
