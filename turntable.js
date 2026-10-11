'use strict';

// Keep the DeepSeek turntable's inertia while sharing the page's audio player.
window.createTurntable = function ({ audio, getTrack, toggle, onStateChange, announce }) {
  const stage = document.getElementById('hero-turntable');
  const vinyl = document.getElementById('turntable-vinyl');
  const arm = document.getElementById('turntable-arm');
  const playButton = document.getElementById('turntable-play');
  const muteButton = document.getElementById('turntable-mute');
  const resetButton = document.getElementById('turntable-reset');
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let rpm = 33;
  let angle = 0;
  let speed = 0;
  let playing = false;
  let visible = true;
  let frame = null;
  let lastTime = 0;
  let armTimer;
  let scrollProgress = 0;
  let scrollMotion = false;
  const targetSpeed = () => playing || scrollMotion ? (rpm === 33 ? 100 / 3 : 45) * 6 : 0;

  function tick(now) {
    frame = null;
    const dt = Math.min((now - lastTime) / 1000, .05);
    lastTime = now;
    const target = targetSpeed();
    speed += (target - speed) * Math.min((target > speed ? 1.6 : .85) * dt, 1);
    if (!target && speed < .1) speed = 0;
    angle = (angle + speed * dt) % 360;
    vinyl.style.transform = `rotate(${angle}deg)`;
    if (playing || scrollMotion || speed > 0) startAnimation();
  }

  function startAnimation() {
    if (frame !== null || !visible || scrollProgress >= .98 || document.hidden || motion.matches) return;
    if (!lastTime) lastTime = performance.now();
    frame = requestAnimationFrame(tick);
  }

  function stopAnimation() {
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null;
    lastTime = 0;
  }

  function sync({ playing: nextPlaying, track }) {
    const title = track?.title || '夜航';
    stage.classList.toggle('tt-is-playing', nextPlaying);
    document.getElementById('turntable-title').textContent = title;
    document.getElementById('turntable-hint-text').textContent = nextPlaying ? `正在播放「${title}」 · 向下滑动，听见回响` : (document.documentElement.classList.contains('scroll-audio-blocked') ? '点击开启声音，跟随音乐探索。' : '向下滑动，让唱针落下。');
    playButton.setAttribute('aria-pressed', String(nextPlaying));
    playButton.setAttribute('aria-label', nextPlaying ? `点击唱片机，暂停${title}的原创试听` : `点击唱片机，播放${title}的原创试听`);
    muteButton.setAttribute('aria-pressed', String(audio.muted));
    muteButton.setAttribute('aria-label', audio.muted ? '取消静音' : '静音');
    resetButton.disabled = !track;
    if (nextPlaying !== playing) {
      playing = nextPlaying;
      clearTimeout(armTimer);
      arm.style.removeProperty('transition');
      arm.style.removeProperty('transform');
      if (playing && !motion.matches && scrollProgress < .015) {
        armTimer = setTimeout(() => {
          if (!playing || motion.matches) return;
          arm.style.transition = 'transform 140s linear';
          arm.style.transform = 'rotate(16deg)';
        }, 1500);
      }
      startAnimation();
    }
    if (scrollProgress > .015) setScrollProgress(scrollProgress);
  }

  playButton.addEventListener('click', toggle);
  muteButton.addEventListener('click', () => { audio.muted = !audio.muted; onStateChange(); });
  resetButton.addEventListener('click', () => {
    if (!getTrack()) return;
    audio.currentTime = 0;
    angle = 0;
    vinyl.style.transform = 'rotate(0deg)';
    announce(`已回到${getTrack().title}的开头。`);
  });
  stage.querySelectorAll('[data-rpm]').forEach(button => button.addEventListener('click', () => {
    rpm = Number(button.dataset.rpm);
    audio.defaultPlaybackRate = rpm === 33 ? 1 : 1.35;
    audio.playbackRate = rpm === 33 ? 1 : 1.35;
    audio.preservesPitch = false;
    stage.querySelectorAll('[data-rpm]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    document.getElementById('turntable-rpm').textContent = rpm === 33 ? '33⅓ RPM' : '45 RPM';
    announce(rpm === 33 ? '已切换至正常转速。' : '已切换至 45 转，播放速度加快。');
    startAnimation();
  }));
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      stage.classList.toggle('tt-out-of-view', !visible);
      if (visible) startAnimation(); else stopAnimation();
    }).observe(stage);
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopAnimation(); else startAnimation(); });
  motion.addEventListener('change', () => {
    clearTimeout(armTimer);
    arm.style.removeProperty('transition');
    arm.style.removeProperty('transform');
    if (motion.matches) { speed = 0; stopAnimation(); } else startAnimation();
  });
  function setScrollProgress(progress) {
    scrollProgress = progress;
    scrollMotion = progress > .025 && progress < .98 && !motion.matches;
    stage.classList.toggle('tt-scroll-playing', scrollMotion);
    if (progress > .015 && !motion.matches) {
      clearTimeout(armTimer);
      const t = Math.min(1, Math.max(0, (progress - .015) / .145));
      const eased = t * t * (3 - 2 * t);
      arm.style.transition = 'none';
      arm.style.transform = `rotate(${-14 + 24 * eased + Math.max(0, progress - .16) * 4}deg)`;
    } else {
      arm.style.removeProperty('transition');
      arm.style.removeProperty('transform');
    }
    if (progress >= .98) stopAnimation(); else startAnimation();
  }
  return { sync, setScrollProgress };
};
