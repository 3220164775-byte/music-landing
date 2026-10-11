'use strict';

// A radial surface-normal field refracts the actual first-screen content.
// Alternating crest/trough shading adds water relief without a luminous halo.
window.createWaterSurface = function (viewport) {
  const canvas = document.getElementById('intro-water-surface');
  const ctx = canvas.getContext('2d');
  const map = document.createElement('canvas');
  const mapCtx = map.getContext('2d');
  const mapImage = document.getElementById('water-displacement-image');
  const displacement = document.getElementById('water-displacement');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let width = 1, height = 1, field, pixels;
  let progress = 0, clock = 0, frame = null, last = 0, lastPaint = 0;
  let active = false;
  function resize() {
    width = viewport.clientWidth; height = viewport.clientHeight;
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    map.width = 144; map.height = Math.max(80, Math.min(216, Math.round(144 * height / width)));
    pixels = mapCtx.createImageData(map.width, map.height);
    field = Array.from({ length: map.width * map.height }, (_, i) => {
      const px = (i % map.width + .5) / map.width * width;
      const py = (Math.floor(i / map.width) + .5) / map.height * height;
      const dx = px - width * .46;
      const dy = py - height * .54;
      const r = Math.hypot(dx, dy / .94) || 1;
      const edge = Math.max(0, Math.min(1, Math.min(px, width - px, py, height - py) / 65));
      return [r, dx / r, dy / r, edge * edge * (3 - 2 * edge)];
    });
    paint();
  }
  function paint() {
    ctx.clearRect(0, 0, width, height);
    const reach = Math.hypot(width * .54, height * .54);
    const crestWidth = 32 + progress * 34;
    const waves = Array.from({ length: 4 }, (_, i) => {
      const age = (clock + i * 1.3) % 5.2;
      const r = (age / 5.2 + progress * .66) * reach * 1.30;
      const strength = Math.sin(Math.PI * age / 5.2) * Math.min(1, r / 60);
      return { r, strength };
    });
    for (const wave of waves) {
      if (wave.r < 20 || wave.strength < .02) continue;
      ctx.save(); ctx.translate(width * .46, height * .54); ctx.scale(1, .94);
      // Slightly uneven crests and paired shadow troughs read as moving water.
      // There are no glow/shadow halos around the wave edges.
      const inner = Math.max(0, wave.r - crestWidth * 1.3);
      const outer = wave.r + crestWidth * 1.3;
      const band = ctx.createRadialGradient(0, 0, inner, 0, 0, outer);
      for (const [stop, color] of [
        [0, 'rgba(0,9,12,0)'],
        [.18, `rgba(0,9,12,${wave.strength * .20})`],
        [.34, `rgba(0,6,9,${wave.strength * .40})`],
        [.48, `rgba(200,215,214,${wave.strength * .24})`],
        [.64, `rgba(0,6,9,${wave.strength * .36})`],
        [.84, `rgba(172,196,195,${wave.strength * .09})`],
        [1, 'rgba(0,9,12,0)'],
      ]) band.addColorStop(stop, color);
      ctx.beginPath();
      for (let j = 0; j <= 160; j++) {
        const angle = j / 160 * Math.PI * 2;
        const r = wave.r + Math.sin(angle * 3 + clock * .6) * 3.8 + Math.sin(angle * 7 - clock * .3) * 1.8;
        const x = Math.cos(angle) * r, y = Math.sin(angle) * r;
        if (j === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = band; ctx.lineWidth = crestWidth * 2.6; ctx.stroke();
      ctx.restore();
    }
    for (let i = 0; i < field.length; i++) {
      const [r, nx, ny, edge] = field[i];
      let slope = 0;
      for (const wave of waves) {
        const d = (r - wave.r) / crestWidth;
        if (Math.abs(d) < 3.5) slope += d * Math.exp(-d * d / 2) * wave.strength;
      }
      slope *= edge;
      const offset = i * 4;
      pixels.data[offset] = Math.max(0, Math.min(255, 128 + slope * nx * 115));
      pixels.data[offset + 1] = Math.max(0, Math.min(255, 128 + slope * ny * 115));
      pixels.data[offset + 2] = 128; pixels.data[offset + 3] = 255;
    }
    mapCtx.putImageData(pixels, 0, 0);
    mapImage.setAttribute('href', map.toDataURL());
    const strength = active ? (18 + progress * 55) : 0;
    displacement.setAttribute('scale', strength.toFixed(2));
    canvas.dataset.refraction = strength.toFixed(2);
    canvas.dataset.phase = clock.toFixed(3);
  }
  function tick(now) {
    frame = null;
    const dt = last ? Math.min((now - last) / 1000, .05) : 0; last = now;
    clock += dt;
    if (now - lastPaint > (width < 700 ? 85 : 55)) { paint(); lastPaint = now; }
    start();
  }
  function start() { if (frame === null && active && !motion.matches && !document.hidden) frame = requestAnimationFrame(tick); }
  function stop() { if (frame !== null) cancelAnimationFrame(frame); frame = null; last = 0; }
  new ResizeObserver(resize).observe(viewport);
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else start(); });
  resize();
  return { setProgress(value) {
    progress = value; active = !motion.matches && value > .025 && value < .94;
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
    const blur = ease(.08, .75, progress);
    const reveal = ease(.52, .96, progress);
    const clear = ease(.58, .94, progress);
    const chrome = 1 - ease(.06, .28, progress);
    const radius = Math.hypot(viewport.clientWidth * .5, viewport.clientHeight * .54) + 80;
    sequence.style.setProperty('--intro-progress', progress.toFixed(4));
    sequence.style.setProperty('--hero-scale', (1 + ease(.08, .76, progress) * .22).toFixed(4));
    sequence.style.setProperty('--hero-blur', `${(blur * 38).toFixed(2)}px`);
    sequence.style.setProperty('--hero-opacity', (1 - ease(.58, .92, progress)).toFixed(4));
    sequence.style.setProperty('--water-scale', (1 + ease(.08, .8, progress) * 4.5).toFixed(4));
    sequence.style.setProperty('--water-opacity', (ease(.025, .16, progress) * (1 - ease(.68, .98, progress)) * .9).toFixed(4));
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
    onProgress?.(motion.matches ? 1 : progress);
  }

  function queueUpdate() { if (frame === null) frame = requestAnimationFrame(update); }
  function trySound() {
    if (attemptedSound || motion.matches || scrollY < start || scrollY > start + distance) return;
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
