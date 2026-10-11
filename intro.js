'use strict';

// A quiet water surface becomes concentric waves after the needle lands.
// Before contact, visible waves and refraction share a field; after contact only water moves.
window.createWaterSurface = function (viewport) {
  const canvas = document.getElementById('intro-water-surface');
  const ctx = canvas.getContext('2d');
  const map = document.createElement('canvas');
  const mapCtx = map.getContext('2d');
  const light = document.createElement('canvas');
  const lightCtx = light.getContext('2d');
  let lightPixels;
  const mapImage = document.getElementById('water-displacement-image');
  const reflectionMapImage = document.getElementById('water-reflection-displacement-image');
  const displacement = document.getElementById('water-displacement');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let width = 1, height = 1, field, pixels;
  let centerX = 0, centerY = 0;
  let progress = 0, clock = 0, frame = null, last = 0, lastPaint = 0;
  let active = false, inView = true;
  let playingSince = null, contactSince = null;
  const smooth = t => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };
  function resize() {
    width = viewport.clientWidth; height = viewport.clientHeight;
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    map.width = 144; map.height = Math.max(80, Math.min(216, Math.round(144 * height / width)));
    pixels = mapCtx.createImageData(map.width, map.height);
    const lightScale = Math.min(.3, 420 / width, 420 / height);
    light.width = Math.max(1, Math.round(width * lightScale));
    light.height = Math.max(1, Math.round(height * lightScale));
    lightPixels = lightCtx.createImageData(light.width, light.height);
    field = Array.from({ length: map.width * map.height }, (_, i) => {
      const px = (i % map.width + .5) / map.width * width;
      const py = (Math.floor(i / map.width) + .5) / map.height * height;
      const edge = Math.max(0, Math.min(1, Math.min(px, width - px, py, height - py) / 65));
      return edge * edge * (3 - 2 * edge);
    });
    paint();
  }
  function surfaceAt(x, y) {
    const span = Math.max(240, width * .32);
    const b = x / span * Math.PI * 2 + clock * .24;
    const a = (y + x * .22) / span * Math.PI * 2 - clock * .38 + Math.sin(b) * .12;
    // One prevailing, gently bent wave front avoids looping, linked contours.
    return {
      height: Math.sin(a) * .9 + Math.sin(b) * .035,
      x: Math.cos(a) * (.22 + Math.cos(b) * .12) * .9 + Math.cos(b) * .035,
      y: Math.cos(a) * .9,
    };
  }
  function paintQuietSurface(opacity) {
    if (opacity <= 0) return;
    for (let y = 0; y < light.height; y++) {
      for (let x = 0; x < light.width; x++) {
        // The visible crests and the refracted machine sample the SAME water field.
        const surface = surfaceAt(x / light.width * width, y / light.height * height);
        const px = x / light.width * width;
        const py = y / light.height * height;
        const patch = .35 + .65 * (.5 + .5 * Math.sin(px / 240 + py / 490 - clock * .16)) ** 2;
        const highlight = Math.max(0, (surface.y - .5) / .4) ** 4 * patch;
        const shadow = Math.max(0, -surface.y) * .4;
        const isLight = highlight >= shadow;
        const offset = (y * light.width + x) * 4;
        lightPixels.data[offset] = isLight ? 248 : 54;
        lightPixels.data[offset + 1] = isLight ? 248 : 54;
        lightPixels.data[offset + 2] = isLight ? 248 : 54;
        lightPixels.data[offset + 3] = (isLight ? highlight * 94 : shadow * 64) * opacity;
      }
    }
    lightCtx.putImageData(lightPixels, 0, 0);
    ctx.drawImage(light, 0, 0, width, height);
  }
  function paintCircularSurface(waves) {
    if (!waves.length) return;
    for (let y = 0; y < light.height; y++) {
      for (let x = 0; x < light.width; x++) {
        const dx = x / light.width * width - centerX;
        const dy = y / light.height * height - centerY;
        const radius = Math.hypot(dx, dy);
        const angle = Math.atan2(dy, dx);
        const direction = Math.cos(angle) * .4 - Math.sin(angle) * .72;
        const patch = .12 + .88 * (.5 + .5 * Math.cos(angle - clock * .07)) ** 2;
        let reflection = 0;
        for (const wave of waves) {
          const uneven = Math.min(3, wave.r * .005) * Math.sin(angle * 2 + clock * .08);
          const d = (radius - wave.r - uneven) / wave.width;
          if (Math.abs(d) > 3) continue;
          const envelope = Math.exp(-d * d * .5);
          // A wave reflects light by its slope and lighting direction, not a uniform ring.
          const slope = -d * envelope;
          reflection += slope * direction * patch * wave.strength;
        }
        const isLight = reflection >= 0;
        const offset = (y * light.width + x) * 4;
        lightPixels.data[offset] = isLight ? 248 : 54;
        lightPixels.data[offset + 1] = isLight ? 248 : 54;
        lightPixels.data[offset + 2] = isLight ? 248 : 54;
        lightPixels.data[offset + 3] = Math.min(80, Math.abs(reflection) * (isLight ? 320 : 180));
      }
    }
    lightCtx.putImageData(lightPixels, 0, 0);
    ctx.drawImage(light, 0, 0, width, height);
  }
  function paint() {
    ctx.clearRect(0, 0, width, height);
    const viewportRect = viewport.getBoundingClientRect();
    const spindle = document.querySelector('#hero-turntable .tt-spindle').getBoundingClientRect();
    centerX = spindle.x + spindle.width / 2 - viewportRect.x;
    centerY = spindle.y + spindle.height / 2 - viewportRect.y;
    const playing = document.getElementById('hero-turntable').classList.contains('tt-is-playing');
    if (playing && playingSince === null) playingSince = clock;
    if (!playing) playingSince = null;
    const contact = progress >= .105 || (playingSince !== null && clock - playingSince >= 1.25);
    if (contact && contactSince === null) contactSince = clock;
    if (!contact) contactSince = null;
    const elapsed = contact ? clock - contactSince : 0;
    const energy = contact ? .55 + smooth((progress - .105) / .2) * .45 : 0;
    const reach = Math.hypot(Math.max(centerX, width - centerX), Math.max(centerY, height - centerY));
    const waves = contact ? Array.from({ length: 4 }, (_, i) => {
      if (elapsed < i * 2.1) return null;
      const age = (elapsed - i * 2.1) % 8.4;
      const r = (age / 8.4 + Math.max(0, progress - .105) * .7) * reach * 1.35;
      const strength = Math.sin(Math.PI * Math.min(1, (age + .6) / 8.4)) * Math.min(1, r / 100) * energy;
      return { r, strength: strength * Math.exp(-r / (reach * .9)), width: 5 + r * .013 };
    }).filter(Boolean) : [];
    paintQuietSurface(contact ? 1 - smooth(elapsed / .4) : 1);
    paintCircularSurface(waves);
    {
      for (let i = 0; i < field.length; i++) {
        const edge = field[i];
        const px = (i % map.width + .5) / map.width * width;
        const py = (Math.floor(i / map.width) + .5) / map.height * height;
        let surface;
        if (contact) {
          const dx = px - centerX, dy = py - centerY;
          const radius = Math.hypot(dx, dy);
          let slope = 0;
          for (const wave of waves) {
            const d = (radius - wave.r) / wave.width;
            if (Math.abs(d) < 3) slope += -d * Math.exp(-d * d * .5) * wave.strength * 3;
          }
          surface = { x: dx / Math.max(1, radius) * slope, y: dy / Math.max(1, radius) * slope };
        } else surface = surfaceAt(px, py);
        const offset = i * 4;
        pixels.data[offset] = Math.max(0, Math.min(255, 128 + surface.x * edge * 85));
        pixels.data[offset + 1] = Math.max(0, Math.min(255, 128 + surface.y * edge * 85));
        pixels.data[offset + 2] = 128; pixels.data[offset + 3] = 255;
      }
      mapCtx.putImageData(pixels, 0, 0);
      const texture = map.toDataURL();
      if (!contact) mapImage.setAttribute('href', texture);
      reflectionMapImage.setAttribute('href', texture);
    }
    // Once the needle lands, circular waves affect the water only, never the deck.
    const strength = motion.matches || progress >= .94 || contact ? 0 : 28;
    displacement.setAttribute('scale', strength.toFixed(2));
    canvas.dataset.refraction = strength.toFixed(2);
    canvas.dataset.phase = clock.toFixed(3);
    canvas.dataset.energy = energy.toFixed(3);
    canvas.dataset.state = contact ? 'spreading' : 'quiet';
    canvas.dataset.waveRadius = (waves[0]?.r || 0).toFixed(2);
    canvas.dataset.waveCount = String(waves.length);
  }
  function tick(now) {
    frame = null;
    const dt = last ? Math.min((now - last) / 1000, .05) : 0; last = now;
    clock += dt;
    if (now - lastPaint > (width < 700 ? 85 : 55)) { paint(); lastPaint = now; }
    start();
  }
  function start() { if (frame === null && active && inView && !motion.matches && !document.hidden) frame = requestAnimationFrame(tick); }
  function stop() { if (frame !== null) cancelAnimationFrame(frame); frame = null; last = 0; }
  new ResizeObserver(resize).observe(viewport);
  new IntersectionObserver(entries => { inView = entries[0].isIntersecting; if (inView) start(); else stop(); }).observe(viewport);
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else start(); });
  resize();
  return { setProgress(value) {
    progress = value; active = !motion.matches && value < .94;
    if (active) start(); else { stop(); displacement.setAttribute('scale', '0'); }
    paint();
  } };
};

window.createIntroSequence = function ({ turntable, startAudio, onProgress }) {
  const root = document.documentElement;
  const sequence = document.getElementById('intro-sequence');
  const viewport = sequence.querySelector('.intro-viewport');
  const hero = document.getElementById('home');
  const experience = document.getElementById('experience');
  const header = document.querySelector('.site-header');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const water = window.createWaterSurface(viewport);
  const clamp = value => Math.min(1, Math.max(0, value));
  const ease = (from, to, value) => {
    const t = clamp((value - from) / (to - from));
    return t * t * (3 - 2 * t);
  };
  let frame = null;
  let attemptedSound = false;
  let requestedSound = false;
  let touchStart = null;
  let progress = 0;
  let start = 0;
  let distance = 0;
  root.classList.add('story-ready');

  function measure() {
    start = sequence.getBoundingClientRect().top + scrollY;
    distance = sequence.offsetHeight - viewport.offsetHeight;
  }

  function update() {
    frame = null;
    progress = motion.matches ? 0 : clamp((scrollY - start) / Math.max(1, distance));
    const blur = ease(.16, .8, progress);
    const reveal = ease(.52, .96, progress);
    const clear = ease(.58, .94, progress);
    const chrome = 1 - ease(.06, .28, progress);
    const radius = Math.hypot(viewport.clientWidth * .5, viewport.clientHeight * .54) + 80;
    sequence.style.setProperty('--intro-progress', progress.toFixed(4));
    sequence.style.setProperty('--hero-scale', (1 + ease(.08, .76, progress) * .22).toFixed(4));
    sequence.style.setProperty('--hero-blur', `${(blur * 38).toFixed(2)}px`);
    sequence.style.setProperty('--hero-opacity', (1 - ease(.58, .92, progress)).toFixed(4));
    sequence.style.setProperty('--water-scale', (1 + ease(.08, .8, progress) * 4.5).toFixed(4));
    sequence.style.setProperty('--water-opacity', ((.96 + ease(.08, .26, progress) * .04) * (1 - ease(.68, .98, progress))).toFixed(4));
    sequence.style.setProperty('--submersion-opacity', (1 - ease(.56, .9, progress)).toFixed(4));
    sequence.style.setProperty('--water-blur', `${(ease(.18, .64, progress) * 17).toFixed(2)}px`);
    sequence.style.setProperty('--haze-opacity', blur.toFixed(4));
    sequence.style.setProperty('--reveal-radius', `${(reveal * radius).toFixed(2)}px`);
    sequence.style.setProperty('--experience-opacity', ease(.5, .6, progress).toFixed(4));
    sequence.style.setProperty('--experience-blur', `${((1 - clear) * 28).toFixed(2)}px`);
    sequence.style.setProperty('--experience-scale', (1 + (1 - clear) * .06).toFixed(4));
    root.style.setProperty('--intro-chrome-opacity', chrome.toFixed(4));
    root.style.setProperty('--intro-chrome-offset', `${((1 - chrome) * -30).toFixed(2)}px`);
    sequence.dataset.progress = progress.toFixed(4);
    sequence.classList.toggle('is-complete', progress >= .98);
    document.body.classList.toggle('intro-player-mode', !motion.matches && scrollY >= start && scrollY <= start + distance);
    sequence.classList.toggle('intro-in-motion', !motion.matches && progress > .025 && progress < .98 && !document.hidden);
    hero.inert = !motion.matches && progress > .5;
    hero.setAttribute('aria-hidden', String(hero.inert));
    experience.inert = !motion.matches && progress < .88;
    experience.setAttribute('aria-hidden', String(!motion.matches && progress < .54));
    header.inert = !motion.matches && progress > .28;
    header.setAttribute('aria-hidden', String(header.inert));
    turntable.setScrollProgress(progress);
    water.setProgress(progress);
    if (requestedSound && progress >= .105) trySound();
    onProgress?.(motion.matches ? 1 : progress);
  }

  function queueUpdate() { if (frame === null) frame = requestAnimationFrame(update); }
  function trySound() {
    if (attemptedSound || motion.matches || scrollY < start || scrollY > start + distance) return;
    requestedSound = true;
    if (progress < .105) return;
    attemptedSound = true;
    startAudio();
  }
  window.addEventListener('scroll', queueUpdate, { passive: true });
  window.addEventListener('resize', () => { measure(); queueUpdate(); }, { passive: true });
  window.addEventListener('wheel', event => { if (event.deltaY > 0) trySound(); }, { passive: true });
  document.addEventListener('touchstart', event => { touchStart = event.touches[0]?.clientY ?? null; }, { passive: true });
  document.addEventListener('touchend', event => {
    if (touchStart !== null && touchStart - (event.changedTouches[0]?.clientY ?? touchStart) > 12) trySound();
    touchStart = null;
  }, { passive: true });
  document.addEventListener('keydown', event => {
    if (['ArrowDown', 'PageDown', ' '].includes(event.key) && !event.target.closest('button,input,a')) trySound();
  });
  document.addEventListener('visibilitychange', queueUpdate);
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href="#home"],a[href="#experience"]');
    if (!link || motion.matches) return;
    event.preventDefault();
    measure();
    const next = link.hash === '#experience';
    if (link.classList.contains('scroll-cue')) trySound();
    history.replaceState(null, '', link.hash);
    window.scrollTo({ top: next ? start + distance : start, behavior: 'smooth' });
  });
  motion.addEventListener('change', () => { measure(); update(); });
  measure();
  update();
  if (location.hash === '#experience' && !motion.matches) window.scrollTo({ top: start + distance, behavior: 'instant' });
};
