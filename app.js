'use strict';

const tracks = [
  { id: 'nightflight', title: '夜航', english: 'NIGHT FLIGHT', style: '电子', mood: 'electronic', description: '给城市夜晚的一点律动', keywords: '夜晚 城市 电子 律动 夜航', artwork: 'nightflight', audio: 'nightflight' },
  { id: 'coastline', title: '海岸线', english: 'COASTLINE', style: '氛围', mood: 'ambient', description: '让思绪，慢慢靠岸', keywords: '海边 海洋 安静 氛围 放松 海岸线', artwork: 'coastline', audio: 'coastline' },
  { id: 'daylight', title: '晴日', english: 'DAYLIGHT', style: '轻音乐', mood: 'light', description: '把阳光放进今天的歌单', keywords: '清晨 晴日 阳光 轻音乐 日常 开心', artwork: 'daylight', audio: 'daylight' },
  { id: 'echo', title: '回声', english: 'ECHOES', style: '轻音乐', mood: 'light', description: '留给自己，一段空白', keywords: '回声 轻音乐 平静 日常 独处', artwork: 'echo', audio: 'echo' },
  { id: 'violet', title: '紫色房间', english: 'VIOLET ROOM', style: '电子', mood: 'electronic', description: '从一段节奏开始出逃', keywords: '紫色房间 电子 律动 节奏 晚间', artwork: 'violet', audio: 'violet' },
  { id: 'orbit', title: '慢轨道', english: 'SLOW ORBIT', style: '氛围', mood: 'ambient', description: '世界很快，你可以慢一点', keywords: '慢轨道 安静 氛围 深夜 放松', artwork: 'orbit', audio: 'orbit' },
];

const audio = new Audio();
audio.preload = 'none';
audio.loop = true;
audio.volume = 0.55;
let currentTrack = null;
let playbackRequest = 0;
let turntable = null;
let resonance = null;

const miniPlayer = document.getElementById('mini-player');
const audioStatus = document.getElementById('audio-status');
const playerToggle = document.getElementById('player-toggle');
const playerTime = document.getElementById('player-time');
const playerProgress = document.getElementById('player-progress');

function syncPlaybackUI() {
  const playing = !!currentTrack && !audio.paused;
  document.getElementById('sound-switch').setAttribute('aria-pressed', String(playing && !audio.muted));
  document.getElementById('sound-label').textContent = playing ? (audio.muted ? '声音已静音' : '声音已开启') : '开启声音';
  document.getElementById('hero-play-label').textContent = playing ? '暂停试听' : '开启声音 · 向下探索';
  document.getElementById('hero-play').setAttribute('aria-label', playing ? '暂停原创音乐试听' : '播放原创音乐试听');
  turntable?.sync({ playing, track: currentTrack });
  resonance?.sync();
  miniPlayer.classList.toggle('is-paused', !playing);
  playerToggle.textContent = playing ? 'Ⅱ' : '▶';
  playerToggle.setAttribute('aria-label', playing ? '暂停试听' : '继续试听');
  document.querySelectorAll('[data-track]').forEach(button => {
    const active = playing && button.dataset.track === currentTrack?.id;
    const track = tracks.find(item => item.id === button.dataset.track);
    button.classList.toggle('is-playing', active);
    button.setAttribute('aria-pressed', String(active));
    button.setAttribute('aria-label', `${active ? '暂停' : '播放'}${track.title}的原创试听`);
    if (button.classList.contains('song-play')) button.textContent = active ? 'Ⅱ' : '▶';
    const icon = button.querySelector('.album-play');
    if (icon) icon.textContent = active ? 'Ⅱ' : '▶';
  });
}

function announceAudioError() {
  const message = '试听暂时无法播放，请稍后再试。';
  audioStatus.textContent = message;
  let toast = document.getElementById('audio-toast');
  if (!toast) {
    toast = document.createElement('p');
    toast.id = 'audio-toast';
    toast.className = 'audio-toast';
    toast.setAttribute('role', 'alert');
    document.body.append(toast);
  }
  toast.textContent = message;
  toast.hidden = false;
  window.clearTimeout(announceAudioError.timeout);
  announceAudioError.timeout = window.setTimeout(() => { toast.hidden = true; }, 5000);
}

async function playTrack(track, { fromScroll = false } = {}) {
  const request = ++playbackRequest;
  if (currentTrack?.id === track.id && !audio.paused) {
    audio.pause();
    syncPlaybackUI();
    return;
  }
  if (currentTrack?.id !== track.id) {
    audio.pause();
    currentTrack = track;
    audio.src = new URL(`./assets/audio/${track.audio}.wav`, document.baseURI).href;
    playerProgress.style.width = '0%';
    playerTime.textContent = '00:00';
  }
  document.getElementById('player-title').textContent = track.title;
  document.getElementById('player-art').src = `./assets/${track.artwork}.svg`;
  miniPlayer.hidden = false;
  document.body.classList.add('has-player');
  try {
    resonance?.activateAudio();
    await audio.play();
    if (request !== playbackRequest) return;
    document.documentElement.classList.remove('scroll-audio-blocked');
    audioStatus.textContent = `正在播放${track.title}，原创示例音乐。`;
    syncPlaybackUI();
  } catch (error) {
    if (request !== playbackRequest || error.name === 'AbortError') return;
    audio.pause();
    if (fromScroll && error.name === 'NotAllowedError') {
      document.documentElement.classList.add('scroll-audio-blocked');
      // Wheel scrolling cannot grant audio permission. Keep a usable play
      // control visible after the opening controls fade during the transition.
      miniPlayer.hidden = false;
      document.body.classList.add('has-player');
      syncPlaybackUI();
      document.getElementById('player-title').textContent = '点击播放，开启声音';
      playerToggle.setAttribute('aria-label', '开启声音并播放试听');
      audioStatus.textContent = '点击开启声音，即可跟随音乐探索。';
      return;
    }
    syncPlaybackUI();
    announceAudioError();
  }
}

document.addEventListener('click', event => {
  const button = event.target.closest('[data-track]');
  if (button) playTrack(tracks.find(track => track.id === button.dataset.track));
});
document.getElementById('hero-play').addEventListener('click', () => playTrack(currentTrack || tracks[0]));
document.getElementById('resonance-play').addEventListener('click', () => playTrack(currentTrack || tracks[0]));
document.getElementById('sound-switch').addEventListener('click', () => {
  if (audio.muted) {
    audio.muted = false;
    if (currentTrack && !audio.paused) return;
  }
  playTrack(currentTrack || tracks[0]);
});
playerToggle.addEventListener('click', () => { if (currentTrack) playTrack(currentTrack); });
document.getElementById('player-close').addEventListener('click', () => {
  ++playbackRequest;
  audio.pause();
  miniPlayer.hidden = true;
  currentTrack = null;
  audio.removeAttribute('src');
  audio.load();
  document.body.classList.remove('has-player');
  syncPlaybackUI();
  audioStatus.textContent = '已关闭试听。';
});
audio.addEventListener('play', syncPlaybackUI);
audio.addEventListener('pause', syncPlaybackUI);
audio.addEventListener('volumechange', syncPlaybackUI);
audio.addEventListener('error', () => { if (currentTrack) announceAudioError(); });
audio.addEventListener('timeupdate', () => {
  const seconds = Math.floor(audio.currentTime || 0);
  playerTime.textContent = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  const progress = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.currentTime / audio.duration : 0;
  playerProgress.style.width = `${progress * 100}%`;
});

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
if ('IntersectionObserver' in window && !reduceMotion.matches) {
  document.documentElement.classList.add('js-reveal');
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    }
  }), { threshold: 0.08 });
  document.querySelectorAll('.reveal').forEach(element => observer.observe(element));
}

const hero = document.querySelector('.hero');
const trail = document.getElementById('cursor-trail');
let lastPoint = null;
let lastTrailTime = 0;
let trailIndex = 0;
hero.addEventListener('pointermove', event => {
  if (event.pointerType !== 'mouse' || reduceMotion.matches) return;
  const now = performance.now();
  const distance = lastPoint ? Math.hypot(event.clientX - lastPoint.x, event.clientY - lastPoint.y) : 100;
  if (distance < 85 || now - lastTrailTime < 130) return;
  if (event.target.closest('a,button')) return;
  const bounds = hero.getBoundingClientRect();
  const image = document.createElement('img');
  image.className = 'cursor-cover';
  image.src = `./assets/${tracks[trailIndex++ % tracks.length].artwork}.svg`;
  image.alt = '';
  image.style.left = `${event.clientX - bounds.left}px`;
  image.style.top = `${event.clientY - bounds.top}px`;
  image.style.setProperty('--tilt', `${(trailIndex % 2 ? -1 : 1) * (7 + trailIndex % 12)}deg`);
  trail.append(image);
  if (trail.childElementCount > 7) trail.firstElementChild.remove();
  image.addEventListener('animationend', () => image.remove(), { once: true });
  window.setTimeout(() => image.remove(), 1100);
  lastPoint = { x: event.clientX, y: event.clientY };
  lastTrailTime = now;
});
hero.addEventListener('pointerleave', () => { lastPoint = null; });
reduceMotion.addEventListener('change', event => {
  if (event.matches) {
    document.documentElement.classList.remove('js-reveal');
    trail.replaceChildren();
  }
});

turntable = window.createTurntable({
  audio,
  getTrack: () => currentTrack,
  toggle: () => playTrack(currentTrack || tracks[0]),
  onStateChange: syncPlaybackUI,
  announce: message => { audioStatus.textContent = message; },
});

resonance = window.createGlobalConnections({ audio, getTrack: () => currentTrack });
const coverStream = window.createCoverStream({ records: window.coverRecords });
const musicGlobe = window.createMusicGlobe({ audio, getAudioContext: () => resonance.activateAudio() });
window.createIntroSequence({
  turntable,
  onProgress: progress => coverStream.setVisible(progress >= .54),
  startAudio: () => {
    if (!audio.paused) return;
    return playTrack(currentTrack || tracks[0], { fromScroll: true });
  },
});
window.createAlbumTransition({ globe: musicGlobe });
