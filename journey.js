'use strict';

window.createCoverStream = function ({ records }) {
  const stage = document.getElementById('cover-stream');
  const section = document.getElementById('experience');
  const toggle = document.getElementById('cover-motion-toggle');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let clock = 0;
  let last = 0;
  let frame = null;
  let manuallyPaused = false;
  let held = null;
  let pinned = null;
  let revealed = false;
  let inView = true;
  let lastTitle = '';
  const smooth = (a, b, v) => { const t = Math.max(0, Math.min(1, (v - a) / (b - a))); return t * t * (3 - 2 * t); };
  const placements = [
    { x: .12, y: .19, angle: -21, size: .96 },
    { x: .91, y: .18, angle: 16, size: .94 },
    { x: .16, y: .63, angle: 13, size: 1.07 },
    { x: .86, y: .64, angle: -17, size: 1.04 },
    { x: .35, y: .84, angle: -24, size: .79 },
    { x: .67, y: .82, angle: 12, size: .86 },
    { x: .02, y: .08, angle: 14, size: .58 },
    { x: .32, y: .13, angle: -14, size: .65 },
    { x: .62, y: .11, angle: 22, size: .63 },
    { x: .98, y: .12, angle: -20, size: .67 },
    { x: .025, y: .43, angle: -14, size: .66 },
    { x: .25, y: .36, angle: 22, size: .54 },
    { x: .76, y: .39, angle: -13, size: .57 },
    { x: .98, y: .44, angle: 15, size: .67 },
    { x: .02, y: .87, angle: 18, size: .67 },
    { x: .21, y: .89, angle: -13, size: .63 },
    { x: .52, y: .87, angle: 21, size: .54 },
    { x: .95, y: .85, angle: -22, size: .63 },
  ];
  const phonePlacements = [
    { x: .13, y: .19, angle: -20, size: .82 },
    { x: .91, y: .25, angle: 16, size: .83 },
    { x: .10, y: .61, angle: 13, size: .92 },
    { x: .93, y: .63, angle: -17, size: .94 },
    { x: .36, y: .80, angle: -24, size: .64 },
    { x: .72, y: .81, angle: 12, size: .68 },
    { x: .05, y: .06, angle: 16, size: .56 },
    { x: .36, y: .12, angle: -17, size: .49 },
    { x: .66, y: .10, angle: 15, size: .49 },
    { x: .97, y: .06, angle: -24, size: .55 },
    { x: .01, y: .37, angle: 22, size: .55 },
    { x: .04, y: .77, angle: -17, size: .59 },
    { x: .98, y: .41, angle: -21, size: .58 },
    { x: .98, y: .77, angle: 18, size: .57 },
    { x: .13, y: .88, angle: 21, size: .49 },
    { x: .44, y: .85, angle: -19, size: .47 },
    { x: .68, y: .89, angle: 23, size: .48 },
    { x: .94, y: .88, angle: -16, size: .49 },
  ];
  function settle(t) {
    // Gravity followed by two small rebounds at the scattered resting position.
    const a = 7.5625, b = 2.75;
    if (t < 1 / b) return a * t * t;
    if (t < 2 / b) return a * (t -= 1.5 / b) * t + .75;
    if (t < 2.5 / b) return a * (t -= 2.25 / b) * t + .9375;
    return a * (t -= 2.625 / b) * t + .984375;
  }
  const cards = records.map((track, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'cover-stream-card' + (track.displayArtwork ? ' is-reference-cover' : '');
    button.dataset.record = track.id;
    const artwork = track.displayArtwork || track.artwork;
    const description = track.displayArtwork ? `${track.displayTitle}，用户提供的旋转转场图片` : `${track.artist}《${track.album}》的原专辑封面`;
    button.setAttribute('aria-label', `${description}，停留查看`);
    button.innerHTML = `<span class="cover-card-face"><span class="cover-art"><img src="${artwork}" alt="${description}" width="600" height="600" referrerpolicy="no-referrer"><span class="cover-art-fallback" hidden>图片暂未加载</span></span></span>`;
    button.querySelector('img').addEventListener('error', () => {
      button.querySelector('img').style.visibility = 'hidden';
      button.querySelector('.cover-art-fallback').hidden = false;
    });
    const hold = () => { held = track.id; updateHold(); };
    button.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse') hold(); });
    button.addEventListener('pointerleave', () => { if (document.activeElement !== button) { held = null; updateHold(); } });
    button.addEventListener('focus', hold);
    button.addEventListener('blur', () => { held = null; updateHold(); });
    button.addEventListener('pointerup', event => { if (event.pointerType === 'touch') { pinned = track.id; updateHold(); } });
    button.addEventListener('click', () => { pinned = track.id; updateHold(); });
    stage.append(button);
    return { button, track, index };
  });
  function updateHold() {
    const id = held || pinned;
    stage.classList.toggle('is-held', !!id);
    cards.forEach(card => {
      card.button.classList.toggle('is-held', card.track.id === id);
      card.button.setAttribute('aria-pressed', String(card.track.id === id));
    });
    toggle.setAttribute('aria-pressed', String(manuallyPaused || !!pinned));
    toggle.textContent = manuallyPaused || pinned ? '▶ 继续飘落' : 'Ⅱ 暂停飘落';
    const track = records.find(item => item.id === id);
    document.getElementById('cover-stream-status').textContent = motion.matches ? '专辑与转场图片 · 点击停留查看' : (track ? `${track.displayArtist || track.artist} · ${pinned ? '点击继续飘落' : '移开继续'}` : (manuallyPaused ? '封面已停住 · 点击继续飘落' : '封面错落飘落 · 悬停即可停住'));
    render();
  }
  function render() {
    const width = stage.clientWidth, height = stage.clientHeight;
    const positions = width < 650 ? phonePlacements : placements;
    const footerTop = document.querySelector('.cover-footer').getBoundingClientRect().top - section.getBoundingClientRect().top;
    cards.forEach(card => {
      const position = positions[card.index];
      const t = motion.matches ? 1 : Math.min(1, Math.max(0, (clock - card.index * .17) / (1.9 + card.index * .03)));
      const drop = settle(t);
      const initialY = -card.button.clientHeight * position.size * .75;
      const drift = t === 1 && !motion.matches ? Math.sin(clock * .65 + card.index * 1.7) * 4 : 0;
      const x = width * position.x + Math.sin(card.index * 2.3) * (1 - t) * 70;
      const restingY = card.index > 3 ? Math.min(height * position.y, footerTop - card.button.clientHeight * position.size / 2 - 12) : height * position.y;
      const y = initialY + (restingY - initialY) * drop + drift;
      const angle = position.angle + (1 - t) * (card.index % 2 ? 42 : -36) + (t === 1 ? Math.sin(clock * .4 + card.index) * 1.2 : 0);
      const focused = card.track.id === (held || pinned);
      const opacity = smooth(0, .12, t) * (focused ? 1 : card.index > 5 ? .86 : .98);
      card.button.style.transform = `translate(-50%,-50%) translate(${x}px,${y}px) rotate(${angle}deg) scale(${position.size * (focused ? 1.035 : 1)})`;
      card.button.style.opacity = String(opacity);
      card.button.style.zIndex = String(focused ? 30 : card.index < 6 ? 12 + card.index % 3 : 2 + card.index % 4);
      card.button.style.pointerEvents = opacity < .3 && !motion.matches ? 'none' : 'auto';
      card.button.dataset.layer = t < 1 ? 'falling' : 'scattered';
    });
    const current = cards.find(card => card.track.id === (held || pinned)) || cards[Math.floor(clock / 5) % cards.length];
    if (current.track.id !== lastTitle) {
      document.getElementById('cover-current-title').textContent = current.track.displayTitle || current.track.title;
      document.getElementById('cover-index').textContent = `${String(current.index + 1).padStart(2, '0')} / ${String(records.length).padStart(2, '0')}`;
      lastTitle = current.track.id;
    }
    stage.dataset.clock = clock.toFixed(4);
    stage.dataset.paused = String(manuallyPaused || !!held || !!pinned || motion.matches);
  }
  function tick(now) {
    frame = null;
    const dt = last ? Math.min((now - last) / 1000, .05) : 0;
    last = now;
    if (!manuallyPaused && !held && !pinned) clock += dt;
    render();
    start();
  }
  function start() { if (frame === null && revealed && inView && !document.hidden && !motion.matches) frame = requestAnimationFrame(tick); }
  function stop() { if (frame !== null) cancelAnimationFrame(frame); frame = null; last = 0; }
  toggle.addEventListener('click', () => {
    if (pinned) { pinned = null; manuallyPaused = false; } else manuallyPaused = !manuallyPaused;
    updateHold();
  });
  new IntersectionObserver(entries => {
    inView = entries[0].isIntersecting;
    if (inView) start(); else stop();
  }).observe(section);
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else start(); });
  window.addEventListener('resize', render);
  motion.addEventListener('change', () => { if (motion.matches) stop(); else start(); updateHold(); });
  updateHold();
  return { setVisible(value) { revealed = value; if (value) start(); else stop(); } };
};

window.createMusicGlobe = function () {
  const artists = [
    { id: 'jay', name: '周杰伦', initials: 'JAY', country: '中国', code: 'CN', city: '台北', lat: 25.03, lon: 121.56, offset: [-35, 28], color: '#f5b99e', album: '七里香 / COMMON JASMINE ORANGE', songs: ['我的地盘', '七里香', '借口', '搁浅', '园游会', '止战之殇'] },
    { id: 'utada', name: '宇多田光', initials: 'HU', country: '日本', code: 'JP', city: '东京', lat: 35.68, lon: 139.69, offset: [26, 12], color: '#aecce9', album: 'FIRST LOVE', songs: ['Automatic', "Movin’ on without you", 'In My Room', 'First Love', 'time will tell', 'B&C'] },
    { id: 'bts', name: 'BTS', initials: 'BTS', country: '韩国', code: 'KR', city: '首尔', lat: 37.57, lon: 126.98, offset: [-18, -40], color: '#bba8f2', album: 'BE', songs: ['Life Goes On', 'Fly To My Room', 'Blue & Grey', 'Telepathy', 'Dis-ease', 'Dynamite'] },
    { id: 'adele', name: 'Adele', initials: 'A', country: '英国', code: 'GB', city: '伦敦', lat: 51.51, lon: -.13, offset: [-40, -27], color: '#e5c087', album: '30', songs: ['Easy On Me', 'My Little Love', 'Oh My God', 'Can I Get It', 'I Drink Wine', 'Love Is a Game'] },
    { id: 'daft', name: 'Daft Punk', initials: 'DP', country: '法国', code: 'FR', city: '巴黎', lat: 48.86, lon: 2.35, offset: [30, 23], color: '#b7c3d0', album: 'RANDOM ACCESS MEMORIES', songs: ['Give Life Back to Music', 'The Game of Love', 'Giorgio by Moroder', 'Within', 'Instant Crush', 'Get Lucky'] },
    { id: 'billie', name: 'Billie Eilish', initials: 'BE', country: '美国', code: 'US', city: '洛杉矶', lat: 34.05, lon: -118.24, offset: [-24, 14], color: '#a9d3b1', album: 'HIT ME HARD AND SOFT', songs: ['SKINNY', 'LUNCH', 'CHIHIRO', 'BIRDS OF A FEATHER', 'WILDFLOWER', 'THE GREATEST'] },
    { id: 'weeknd', name: 'The Weeknd', initials: 'TW', country: '加拿大', code: 'CA', city: '多伦多', lat: 43.65, lon: -79.38, offset: [30, -19], color: '#ec9a9b', album: 'AFTER HOURS', songs: ['Alone Again', 'Too Late', 'Hardest To Love', 'Scared To Live', 'Blinding Lights', 'Save Your Tears'] },
    { id: 'anitta', name: 'Anitta', initials: 'AN', country: '巴西', code: 'BR', city: '里约热内卢', lat: -22.91, lon: -43.17, offset: [18, 14], color: '#e6c56e', album: 'VERSIONS OF ME', songs: ['Envolver', 'Gata', 'Love You', 'Girl From Rio', "Boys Don’t Cry", 'Versions of Me'] },
    { id: 'tyla', name: 'Tyla', initials: 'T', country: '南非', code: 'ZA', city: '约翰内斯堡', lat: -26.2, lon: 28.04, offset: [0, 20], color: '#deb69a', album: 'TYLA', songs: ['Water', 'Truth or Dare', 'No.1', 'Jump', 'ART', 'Butterflies'] },
  ];
  const section = document.getElementById('world');
  const stage = document.getElementById('globe-stage');
  const canvas = document.getElementById('music-globe');
  const ctx = canvas.getContext('2d');
  const pins = document.getElementById('globe-pins');
  const regions = document.getElementById('world-regions');
  const panel = document.querySelector('.artist-panel');
  const songs = document.getElementById('world-song-list');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const radians = Math.PI / 180;
  const distance = 2.7;
  const horizon = 1 / distance;
  const lensFactor = Math.sqrt(distance * distance - 1);
  let yaw = 115 * radians;
  let pitch = 18 * radians;
  let targetYaw = yaw;
  let targetPitch = pitch;
  let tiltX = 0;
  let tiltY = 0;
  let width = 1, height = 1, radius = 1, centerX = 0, centerY = 0;
  let frame = null, last = 0, lastPaint = 0;
  let visible = false, dragging = null, hovering = false, pointerInside = false, pointerPosition = null;
  let selected = artists[0];
  const spherePoint = ([lon, lat]) => { const latitude = lat * radians, longitude = lon * radians; return [Math.cos(latitude) * Math.sin(longitude), Math.sin(latitude), Math.cos(latitude) * Math.cos(longitude)]; };
  const land = (window.worldLand?.points || []).map(spherePoint);
  const coastlines = (window.worldLand?.outlines || []).map(ring => ring.map(spherePoint));
  const graticules = [];
  for (let lat = -60; lat <= 60; lat += 30) graticules.push(Array.from({ length: 181 }, (_, i) => spherePoint([-180 + i * 2, lat])));
  for (let lon = -180; lon < 180; lon += 30) graticules.push(Array.from({ length: 91 }, (_, i) => spherePoint([lon, -90 + i * 2])));
  artists.forEach(artist => {
    artist.point = spherePoint([artist.lon, artist.lat]);
    const pin = document.createElement('button');
    pin.type = 'button'; pin.className = 'globe-pin'; pin.dataset.artist = artist.id;
    pin.style.setProperty('--artist-color', artist.color);
    pin.setAttribute('aria-label', `${artist.country}，${artist.name}，查看歌曲列表`);
    pin.innerHTML = `<span class="artist-avatar" aria-hidden="true">${artist.initials}</span><span class="artist-pin-name">${artist.name}</span><span class="artist-pin-country" aria-hidden="true">${artist.code}</span>`;
    const holdArtist = () => { hovering = true; stop(); targetYaw = yaw; targetPitch = pitch; select(artist); paint(); section.dataset.hoveredArtist = artist.id; };
    const releaseArtist = () => {
      hovering = !!pins.querySelector('.globe-pin:hover,.globe-pin:focus-visible');
      if (!hovering) { delete section.dataset.hoveredArtist; start(); }
    };
    pin.addEventListener('pointerenter', holdArtist);
    pin.addEventListener('pointerleave', releaseArtist);
    pin.addEventListener('focus', holdArtist);
    pin.addEventListener('blur', releaseArtist);
    pin.addEventListener('click', () => select(artist));
    pins.append(pin); artist.pin = pin;
    const region = document.createElement('button');
    region.type = 'button'; region.className = 'world-region'; region.dataset.artist = artist.id;
    region.textContent = artist.country; region.setAttribute('aria-label', `${artist.country}，${artist.name}`);
    region.addEventListener('click', () => { select(artist); aim(artist.lon, artist.lat); });
    regions.append(region); artist.region = region;
  });
  function select(artist) {
    selected = artist;
    section.dataset.artist = artist.id;
    artists.forEach(item => { item.pin.classList.toggle('is-selected', item === artist); item.pin.setAttribute('aria-pressed', String(item === artist)); item.region.setAttribute('aria-pressed', String(item === artist)); });
    if (songs.dataset.artist === artist.id) return;
    songs.dataset.artist = artist.id;
    panel.style.setProperty('--artist-color', artist.color);
    document.getElementById('world-artist-name').textContent = artist.name;
    document.getElementById('world-artist-region').textContent = `${artist.country} · ${artist.city}`;
    document.getElementById('world-artist-album').textContent = artist.album;
    document.getElementById('world-song-note').textContent = '曲目展示 · 完整音乐请在客户端收听';
    songs.replaceChildren();
    artist.songs.forEach((title, index) => {
      const row = document.createElement('button');
      row.type = 'button'; row.className = 'world-song'; row.setAttribute('aria-label', `查看${artist.name}的歌曲 ${title}`); row.setAttribute('aria-pressed', 'false');
      const number = document.createElement('span'); number.className = 'world-song-number'; number.textContent = String(index + 1).padStart(2, '0');
      const art = document.createElement('span'); art.className = 'world-song-art'; art.setAttribute('aria-hidden', 'true');
      const record = window.coverRecords?.find(record => record.id === artist.id);
      if (record) {
        const image = document.createElement('img'); image.src = record.artwork; image.alt = ''; image.referrerPolicy = 'no-referrer';
        art.append(image);
      }
      row.dataset.song = title;
      const name = document.createElement('span'); name.className = 'world-song-title'; name.textContent = title;
      const mark = document.createElement('span'); mark.className = 'world-song-mark'; mark.textContent = '↗'; mark.setAttribute('aria-hidden', 'true');
      row.append(number, art, name, mark);
      row.addEventListener('click', () => {
        songs.querySelectorAll('.world-song').forEach(item => { item.classList.toggle('is-selected', item === row); item.setAttribute('aria-pressed', String(item === row)); });
        document.getElementById('world-song-note').textContent = `已选「${title}」 · 前往客户端收听`;
      });
      songs.append(row);
    });
    curveSongs();
  }
  function curveSongs() {
    const size = songs.clientHeight;
    const orbit = size * .61;
    songs.querySelectorAll('.world-song').forEach((row, index) => {
      const theta = (index - 2.5) * 17 * radians;
      const y = Math.sin(theta) * orbit;
      // Masked containers flatten their children. Keep row centers on the
      // hit-test plane; tilt and foreshortening still describe the cylinder.
      const scale = 1000 / (1000 + (1 - Math.cos(theta)) * orbit);
      const x = Math.abs(index - 2.5) * 12;
      row.style.transform = `translate(${x}px,${y - row.clientHeight / 2}px) rotateX(${-theta / radians}deg) rotateY(-14deg) scale(${scale})`;
      row.style.opacity = String(.96 - Math.abs(index - 2.5) * .22);
    });
  }
  function aim(lon, lat) {
    const next = lon * radians;
    targetYaw = yaw + Math.atan2(Math.sin(next - yaw), Math.cos(next - yaw));
    targetPitch = lat * radians * .65;
    if (motion.matches) { yaw = targetYaw; pitch = targetPitch; paint(); } else start();
  }
  function dimensions() {
    width = stage.clientWidth; height = stage.clientHeight;
    const ratio = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    radius = Math.min(width * .43, height * .43); centerX = width * .5; centerY = height * .5;
    curveSongs(); paint();
  }
  function paint() {
    const sinY = Math.sin(yaw + tiltX), cosY = Math.cos(yaw + tiltX);
    const sinP = Math.sin(pitch + tiltY), cosP = Math.cos(pitch + tiltY);
    function project(point) {
      const x = point[0] * cosY - point[2] * sinY;
      const z0 = point[0] * sinY + point[2] * cosY;
      const y = point[1] * cosP - z0 * sinP;
      const z = point[1] * sinP + z0 * cosP;
      const scale = radius * lensFactor / (distance - z);
      return { x: centerX + x * scale, y: centerY - y * scale, z };
    }
    ctx.clearRect(0, 0, width, height);
    // Seeded stars keep the lens background stable while the sphere turns.
    ctx.fillStyle = '#aecde949';
    for (let i = 0; i < 48; i++) { const x = ((i * 137.51) % 997) / 997 * width; const y = ((i * 83.79) % 701) / 701 * height; ctx.fillRect(x, y, i % 5 === 0 ? 2 : 1, 1); }
    const glow = ctx.createRadialGradient(centerX, centerY, radius * .88, centerX, centerY, radius * 1.18);
    glow.addColorStop(0, '#9c58f22e'); glow.addColorStop(.58, '#54c8e919'); glow.addColorStop(1, '#9c58f200');
    ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(centerX, centerY, radius * 1.18, 0, Math.PI * 2); ctx.fill();
    const ocean = ctx.createRadialGradient(centerX - radius * .33, centerY - radius * .36, 0, centerX + radius * .1, centerY + radius * .15, radius * 1.1);
    ocean.addColorStop(0, '#453474'); ocean.addColorStop(.42, '#29234e'); ocean.addColorStop(.77, '#15172f'); ocean.addColorStop(1, '#070b1c');
    ctx.save(); ctx.beginPath(); ctx.arc(centerX, centerY, radius, 0, Math.PI * 2); ctx.clip(); ctx.fillStyle = ocean; ctx.fillRect(centerX - radius, centerY - radius, radius * 2, radius * 2);
    function drawLines(lines, color, lineWidth) {
      ctx.strokeStyle = color; ctx.lineWidth = lineWidth; ctx.beginPath();
      lines.forEach(line => { let connected = false; line.forEach(point => { const p = project(point); if (p.z <= horizon) { connected = false; return; } if (connected) ctx.lineTo(p.x, p.y); else ctx.moveTo(p.x, p.y); connected = true; }); });
      ctx.stroke();
    }
    drawLines(graticules, '#77afd02b', .7);
    drawLines(coastlines, '#b3d9dc4a', .8);
    for (const near of [false, true]) {
      ctx.beginPath();
      land.forEach(point => { const p = project(point); if (p.z <= horizon || (p.z > .7) !== near) return; const dot = Math.max(.65, radius / 235) * (near ? 1.12 : .85); ctx.moveTo(p.x + dot, p.y); ctx.arc(p.x, p.y, dot, 0, Math.PI * 2); });
      ctx.fillStyle = near ? '#b9e7e4ad' : '#af9ddd9e'; ctx.fill();
    }
    artists.forEach(artist => {
      const point = project(artist.point);
      const front = point.z > horizon + .035;
      artist.pin.hidden = !front;
      if (!front) return;
      const depth = (point.z - horizon) / (1 - horizon);
      const offsetScale = Math.min(1, radius / 240);
      const x = point.x + artist.offset[0] * offsetScale, y = point.y + artist.offset[1] * offsetScale;
      ctx.beginPath(); ctx.moveTo(point.x, point.y); ctx.lineTo(x, y); ctx.strokeStyle = artist === selected ? '#f4b9d1b3' : '#cee6f047'; ctx.lineWidth = 1; ctx.stroke();
      ctx.beginPath(); ctx.arc(point.x, point.y, artist === selected ? 3 : 2, 0, Math.PI * 2); ctx.fillStyle = artist.color; ctx.fill();
      artist.pin.style.left = `${x}px`; artist.pin.style.top = `${y}px`; artist.pin.style.opacity = String(.45 + depth * .55);
      artist.pin.style.setProperty('--pin-scale', String(.76 + depth * .24)); artist.pin.style.zIndex = String(Math.round(depth * 20) + 2);
    });
    const shade = ctx.createRadialGradient(centerX - radius * .4, centerY - radius * .3, radius * .1, centerX + radius * .12, centerY + radius * .15, radius * 1.05);
    shade.addColorStop(0, '#00000000'); shade.addColorStop(.55, '#00000000'); shade.addColorStop(1, '#010713a1'); ctx.fillStyle = shade; ctx.fillRect(0, 0, width, height); ctx.restore();
    ctx.beginPath(); ctx.arc(centerX, centerY, radius, 0, Math.PI * 2); ctx.strokeStyle = '#80cffd7a'; ctx.lineWidth = 1.3; ctx.stroke();
    ctx.save(); ctx.translate(centerX, centerY); ctx.rotate(-.35); ctx.scale(1, .32); ctx.beginPath(); ctx.arc(0, 0, radius * 1.17, 0, Math.PI * 2); ctx.strokeStyle = '#aacce52e'; ctx.lineWidth = 1; ctx.stroke(); ctx.restore();
    section.dataset.longitude = (yaw / radians).toFixed(2);
  }
  function tick(now) {
    frame = null;
    if (pins.querySelector('.globe-pin:hover,.globe-pin:focus-visible')) { hovering = true; stop(); return; }
    const dt = last ? Math.min((now - last) / 1000, .05) : 0; last = now;
    if (!hovering && !dragging) { if (!pointerInside) targetYaw += dt * .025; yaw += (targetYaw - yaw) * Math.min(1, dt * 9); pitch += (targetPitch - pitch) * Math.min(1, dt * 9); }
    if (now - lastPaint > 1000 / (width < 500 ? 24 : 30)) { paint(); lastPaint = now; }
    start();
  }
  function start() { if (frame === null && visible && !hovering && !document.hidden && !motion.matches) frame = requestAnimationFrame(tick); }
  function stop() { if (frame !== null) cancelAnimationFrame(frame); frame = null; last = 0; }
  canvas.addEventListener('pointerenter', event => {
    if (event.pointerType === 'mouse') { pointerInside = true; pointerPosition = { x: event.clientX, y: event.clientY }; start(); }
  });
  canvas.addEventListener('pointerdown', event => { dragging = { x: event.clientX, y: event.clientY, yaw, pitch }; hovering = false; canvas.setPointerCapture(event.pointerId); canvas.classList.add('is-dragging'); });
  canvas.addEventListener('pointermove', event => {
    if (dragging) { yaw = dragging.yaw - (event.clientX - dragging.x) * .007; pitch = Math.max(-1.1, Math.min(1.1, dragging.pitch + (event.clientY - dragging.y) * .004)); targetYaw = yaw; targetPitch = pitch; paint(); }
    else if (event.pointerType === 'mouse') {
      if (pointerPosition) {
        targetYaw -= (event.clientX - pointerPosition.x) * .008;
        targetPitch = Math.max(-1.1, Math.min(1.1, targetPitch + (event.clientY - pointerPosition.y) * .005));
      }
      pointerPosition = { x: event.clientX, y: event.clientY };
      tiltX = 0; tiltY = 0;
      if (motion.matches) { yaw = targetYaw; pitch = targetPitch; paint(); } else start();
    }
  });
  function release() { dragging = null; canvas.classList.remove('is-dragging'); }
  canvas.addEventListener('pointerup', release); canvas.addEventListener('pointercancel', release); canvas.addEventListener('lostpointercapture', release);
  canvas.addEventListener('pointerleave', () => { pointerInside = false; pointerPosition = null; if (!dragging) { tiltX = 0; tiltY = 0; if (motion.matches) paint(); } });
  canvas.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
    event.preventDefault();
    if (event.key === 'ArrowLeft') targetYaw -= .45; if (event.key === 'ArrowRight') targetYaw += .45;
    if (event.key === 'ArrowUp') targetPitch = Math.max(-1.1, targetPitch - .15); if (event.key === 'ArrowDown') targetPitch = Math.min(1.1, targetPitch + .15);
    if (motion.matches) { yaw = targetYaw; pitch = targetPitch; paint(); } else start();
  });
  document.getElementById('globe-left').addEventListener('click', () => aim((targetYaw - .7) / radians, targetPitch / radians / .65));
  document.getElementById('globe-right').addEventListener('click', () => aim((targetYaw + .7) / radians, targetPitch / radians / .65));
  new ResizeObserver(dimensions).observe(stage);
  new IntersectionObserver(entries => { visible = entries[0].isIntersecting; if (visible) { dimensions(); start(); } else stop(); }, { threshold: .08 }).observe(section);
  new IntersectionObserver(entries => {
    document.body.classList.toggle('world-player-mode', entries[0].isIntersecting);
  }, { rootMargin: '-35% 0px -35% 0px' }).observe(section);
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else start(); });
  motion.addEventListener('change', () => { if (motion.matches) stop(); else start(); paint(); });
  select(selected); dimensions();
  return { selectArtist(id) { const artist = artists.find(item => item.id === id); if (artist) { select(artist); aim(artist.lon, artist.lat); } } };
};

window.createAlbumTransition = function ({ globe }) {
  const sequence = document.getElementById('intro-sequence');
  const viewport = sequence.querySelector('.intro-viewport');
  const world = document.getElementById('world');
  const source = document.querySelector('.cover-stream-card[data-record="jay"]');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const clone = document.createElement('div');
  clone.className = 'cover-transition-card' + (source.classList.contains('is-reference-cover') ? ' is-reference-cover' : '');
  clone.setAttribute('aria-hidden', 'true');
  clone.innerHTML = source.innerHTML;
  document.body.append(clone);
  const clamp = v => Math.max(0, Math.min(1, v));
  const ease = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
  const mix = (a, b, v) => a + (b - a) * v;
  let start = 0, end = 1, origin = null, frame = null, engaged = false;
  function measure() {
    start = sequence.getBoundingClientRect().top + scrollY + sequence.offsetHeight - viewport.offsetHeight;
    end = world.getBoundingClientRect().top + scrollY;
    origin = null;
  }
  function capture() {
    const rect = source.getBoundingClientRect();
    const matrix = new DOMMatrix(getComputedStyle(source).transform);
    const scale = Math.hypot(matrix.a, matrix.b);
    origin = {
      x: rect.x + rect.width / 2,
      y: rect.y + rect.height / 2 + Math.max(0, scrollY - start),
      width: source.clientWidth * scale,
      angle: Math.atan2(matrix.b, matrix.a) * 180 / Math.PI,
    };
  }
  function update() {
    frame = null;
    const progress = motion.matches ? 1 : clamp((scrollY - start) / Math.max(1, end - start));
    const active = !motion.matches && progress > .001 && progress < .999;
    if (active && !engaged) {
      globe.selectArtist('jay');
      const row = world.querySelector('.world-song[data-song="七里香"]');
      row?.click();
      capture();
    }
    if (active && !origin) capture();
    source.classList.toggle('is-morph-source', active);
    world.classList.toggle('is-arriving', active);
    clone.style.visibility = active ? 'visible' : 'hidden';
    world.dataset.morphProgress = progress.toFixed(4);
    world.style.setProperty('--world-arrival-opacity', String(.2 + ease(.10, .82, progress) * .8));
    world.style.setProperty('--world-arrival-blur', `${((1 - ease(.14, .88, progress)) * 12).toFixed(2)}px`);
    if (motion.matches) { world.style.removeProperty('--world-arrival-opacity'); world.style.removeProperty('--world-arrival-blur'); }
    if (active) {
      const target = world.querySelector('.world-song[data-song="七里香"] .world-song-art');
      if (target) {
        const rect = target.getBoundingClientRect();
        const toCenter = ease(0, .44, progress), toSong = ease(.54, 1, progress);
        // A rotated square must cover both viewport axes before it becomes a song.
        const middleWidth = Math.max(innerWidth, innerHeight) * 1.35;
        const middleX = innerWidth * .50, middleY = innerHeight * .50;
        const x = progress < .44 ? mix(origin.x, middleX, toCenter) : mix(middleX, rect.x + rect.width / 2, toSong);
        const y = progress < .44 ? mix(origin.y, middleY, toCenter) : mix(middleY, rect.y + rect.height / 2, toSong);
        const width = progress < .44 ? mix(origin.width, middleWidth, toCenter) : mix(middleWidth, rect.width, toSong);
        const angle = progress < .44 ? mix(origin.angle, 190, toCenter) : mix(190, 360, toSong);
        clone.style.width = `${width}px`;
        clone.style.transform = `translate(${x}px,${y}px) translate(-50%,-50%) rotate(${angle}deg)`;
        clone.style.opacity = String(1 - ease(.94, 1, progress));
        clone.style.setProperty('--morph-padding', '0px');
        clone.style.setProperty('--morph-radius', `${toSong * 3}px`);
        target.style.opacity = String(ease(.94, 1, progress));
      }
    } else {
      world.querySelectorAll('.world-song-art').forEach(art => art.style.removeProperty('opacity'));
      origin = null;
    }
    engaged = active;
  }
  function queue() { if (frame === null) frame = requestAnimationFrame(update); }
  window.addEventListener('scroll', queue, { passive: true });
  window.addEventListener('resize', () => { measure(); queue(); }, { passive: true });
  motion.addEventListener('change', () => { measure(); update(); });
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href="#world"]');
    if (!link) return;
    event.preventDefault();
    history.replaceState(null, '', '#world');
    scrollTo({ top: world.getBoundingClientRect().top + scrollY, behavior: motion.matches ? 'instant' : 'smooth' });
  });
  measure(); update();
};
