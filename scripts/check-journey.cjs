const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_BROWSER_EXECUTABLE });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const output = path.resolve(__dirname, '../output'); fs.mkdirSync(output, { recursive: true });
  const errors = [], failed = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) failed.push(`${response.status()} ${response.url()}`); });
  async function cardsScreen() {
    await page.evaluate(() => { const section = document.querySelector('.intro-sequence'); scrollTo({ top: section.offsetHeight - section.querySelector('.intro-viewport').offsetHeight, behavior: 'instant' }); });
    await page.waitForFunction(() => document.getElementById('experience').inert === false);
  }
  async function worldScreen() {
    await page.evaluate(() => scrollTo({ top: document.getElementById('world').getBoundingClientRect().top + scrollY, behavior: 'instant' }));
    await page.waitForTimeout(100);
  }
  try {
    await page.goto(process.env.PREVIEW_URL || 'http://127.0.0.1:8080/', { waitUntil: 'networkidle' });
    assert.equal(await page.locator('.cover-stream-card').count(), 18);
    assert.equal(await page.locator('.cover-card-meta').count(), 0, 'Covers have no card metadata or decorative buttons');
    assert.equal(await page.locator('.cover-card-face').first().evaluate(element => getComputedStyle(element).padding), '0px', 'Original square artwork has no card frame');
    assert.equal(await page.locator('.globe-pin').count(), 9);
    assert.ok(await page.evaluate(() => worldLand.points.length > 8000));
    await page.waitForFunction(() => [...document.querySelectorAll('.cover-card-face img')].every(image => image.complete && image.naturalWidth >= 500));
    assert.equal(await page.locator('.cover-card-face img').first().getAttribute('src'), './assets/rotation-cover-reference.png');
    assert.equal(await page.locator('.cover-transition-card img').getAttribute('src'), './assets/rotation-cover-reference.png', 'The rotating transition uses the supplied image');
    assert.equal(await page.locator('.cover-transition-card img').evaluate(element => getComputedStyle(element).objectFit), 'contain', 'The entire reference image remains visible');
    await page.locator('#hero-play').click();
    await page.waitForFunction(() => !audio.paused);
    await cardsScreen();
    await page.mouse.move(1, 999);
    const fallingCard = page.locator('.cover-stream-card[data-record="adele"]');
    const fallStarted = Date.now();
    const above = await fallingCard.boundingBox();
    await page.waitForTimeout(1600);
    const below = await fallingCard.boundingBox();
    assert.ok(below.y - above.y > 120, 'A cover falls downward into the scattered layout');
    await page.waitForFunction(() => [...document.querySelectorAll('.cover-stream-card')].every(card => card.dataset.layer === 'scattered'));
    assert.ok(Date.now() - fallStarted < 3000, 'All covers arrive promptly instead of waiting through a long stagger');
    const layout = await page.locator('.cover-stream-card').evaluateAll(nodes => nodes.map(node => { const r = node.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; }));
    assert.ok(Math.max(...layout.map(r => r.x)) - Math.min(...layout.map(r => r.x)) > 900, 'Album covers scatter across both sides of the central heading');
    const clock = await page.locator('#cover-stream').getAttribute('data-clock');
    await page.waitForTimeout(350);
    assert.notEqual(await page.locator('#cover-stream').getAttribute('data-clock'), clock);
    // Native hover picks the card actually under the pointer, including overlap.
    const cardPoint = await page.evaluate(() => {
      const buttons = [...document.querySelectorAll('.cover-stream-card')].filter(button => Number(button.style.opacity) > .65);
      for (const button of buttons) {
        const r = button.getBoundingClientRect();
        for (const fraction of [.5, .3, .8]) {
          const x = Math.max(10, Math.min(innerWidth - 10, r.left + r.width * fraction));
          const y = Math.max(10, Math.min(innerHeight - 140, r.top + r.height * .5));
          const hit = document.elementFromPoint(x, y)?.closest('.cover-stream-card');
          if (hit) return { x, y, id: hit.dataset.record };
        }
      }
      return null;
    });
    assert.ok(cardPoint, 'A visible card can receive hover');
    await page.mouse.move(cardPoint.x, cardPoint.y);
    await page.waitForFunction(() => document.getElementById('cover-stream').dataset.paused === 'true');
    const frozen = await page.locator('#cover-stream').getAttribute('data-clock');
    await page.waitForTimeout(300);
    assert.equal(await page.locator('#cover-stream').getAttribute('data-clock'), frozen);
    assert.equal(await page.locator('.cover-stream-card.is-held').getAttribute('data-record'), cardPoint.id);
    await page.screenshot({ path: path.join(output, 'covers-hover.png') });
    await page.mouse.click(cardPoint.x, cardPoint.y);
    assert.equal(await page.locator(`.cover-stream-card[data-record="${cardPoint.id}"]`).getAttribute('aria-pressed'), 'true');
    assert.equal(await page.evaluate(() => currentTrack.id), 'nightflight', 'Real covers do not play an unrelated demo under real song titles');
    assert.equal(await page.locator('#cover-motion-toggle').evaluate(element => {
      const r = element.getBoundingClientRect();
      return document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2) === element;
    }), true, 'Listening controls leave the cover pause button accessible');
    await worldScreen();
    await page.waitForFunction(() => document.body.classList.contains('world-player-mode'));
    assert.equal(await page.locator('.world-region[data-artist="jay"]').evaluate(element => {
      const r = element.getBoundingClientRect();
      return document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2) === element;
    }), true, 'Listening controls leave country selection accessible');
    await page.locator('#player-close').click();
    await cardsScreen();
    await page.mouse.move(1, 999);
    // First release the clicked record, then use the independent pause control.
    await page.locator('#cover-motion-toggle').click();
    await page.locator('#cover-motion-toggle').click();
    const manual = await page.locator('#cover-stream').getAttribute('data-clock');
    await page.waitForTimeout(200);
    assert.equal(await page.locator('#cover-stream').getAttribute('data-clock'), manual);
    await page.screenshot({ path: path.join(output, 'covers-desktop.png') });
    await page.locator('#cover-motion-toggle').click();
    await page.mouse.move(1, 999);
    async function transition(progress) {
      await page.evaluate(progress => {
        const sequence = document.getElementById('intro-sequence');
        const start = sequence.offsetHeight - innerHeight;
        const end = document.getElementById('world').getBoundingClientRect().top + scrollY;
        scrollTo({ top: start + (end - start) * progress, behavior: 'instant' });
      }, progress);
      await page.waitForFunction(progress => Math.abs(Number(document.getElementById('world').dataset.morphProgress) - progress) < .002, progress);
    }
    await transition(.12);
    const beginning = await page.locator('.cover-transition-card').boundingBox();
    await transition(.44);
    const enlarged = await page.locator('.cover-transition-card').boundingBox();
    assert.ok(enlarged.width > beginning.width * 1.5, 'Cover enlarges and rotates between scenes');
    await page.screenshot({ path: path.join(output, 'cover-to-song-middle.png') });
    await transition(.49);
    const fullCover = await page.locator('.cover-transition-card').boundingBox();
    assert.ok(fullCover.x < 0 && fullCover.y < 0 && fullCover.x + fullCover.width > 1440 && fullCover.y + fullCover.height > 1000, 'Enlarged album covers the entire viewport');
    await page.screenshot({ path: path.join(output, 'cover-full-screen.png') });
    await transition(.98);
    const landed = await page.locator('.cover-transition-card').boundingBox();
    const destination = await page.locator('.world-song[data-song="七里香"] .world-song-art').boundingBox();
    assert.ok(Math.abs(landed.x + landed.width / 2 - destination.x - destination.width / 2) < 5);
    assert.ok(Math.abs(landed.y + landed.height / 2 - destination.y - destination.height / 2) < 5);
    assert.ok(landed.width < 40, 'Cover shrinks into the corresponding song thumbnail');
    await transition(0);
    assert.equal(await page.locator('.cover-stream-card[data-record="jay"]').evaluate(element => getComputedStyle(element).visibility), 'visible', 'Reversing scroll restores the source cover');
    await worldScreen();
    assert.equal(await page.locator('.cover-transition-card').evaluate(element => getComputedStyle(element).visibility), 'hidden');
    assert.equal(await page.locator('.world-song').count(), 6);
    assert.equal(await page.locator('#world-artist-name').textContent(), '周杰伦');
    assert.equal(await page.locator('.world-song[data-song="七里香"] img').getAttribute('src'), './assets/rotation-cover-reference.png', 'The supplied image remains in the song row after the transition ends');
    assert.equal(await page.locator('.world-song[data-song="七里香"] img').evaluate(image => getComputedStyle(image).objectFit), 'contain', 'The landed thumbnail preserves the entire reference image');
    await page.screenshot({ path: path.join(output, 'world-desktop.png') });
    const globeBounds = await page.locator('#music-globe').boundingBox();
    await page.mouse.move(globeBounds.x + globeBounds.width * .2, globeBounds.y + globeBounds.height * .8);
    await page.waitForTimeout(200);
    const beforeHoverMove = Number(await page.locator('#world').getAttribute('data-longitude'));
    await page.mouse.move(globeBounds.x + globeBounds.width * .6, globeBounds.y + globeBounds.height * .8, { steps: 10 });
    await page.waitForTimeout(350);
    assert.ok(Math.abs(Number(await page.locator('#world').getAttribute('data-longitude')) - beforeHoverMove) > 35, 'Mouse movement rotates the globe without pressing any button');
    for (const id of ['jay', 'utada', 'adele', 'daft', 'billie', 'weeknd', 'anitta', 'tyla', 'bts']) {
      await page.locator(`.world-region[data-artist="${id}"]`).click();
      await page.waitForTimeout(1200);
      assert.equal(await page.locator('#world').getAttribute('data-artist'), id);
      assert.equal(await page.locator(`.globe-pin[data-artist="${id}"]`).isVisible(), true, `Selected artist ${id} faces the lens`);
      assert.equal(await page.locator('.world-song').count(), 6);
      await page.waitForFunction(() => [...document.querySelectorAll('.world-song-art img')].every(image => image.complete && image.naturalWidth > 0));
      assert.equal(await page.locator('.world-song-art img').evaluateAll(images => new Set(images.map(image => image.src)).size), 6, `${id} shows six different display artworks`);
    }
    await page.evaluate(() => {
      window.hoverTrace = [];
      for (const element of document.querySelectorAll('.globe-pin,#music-globe')) {
        for (const type of ['pointerenter','pointerleave','pointermove','focus','blur']) element.addEventListener(type, event => {
          const r=element.getBoundingClientRect();
          window.hoverTrace.push({ type, id: element.dataset.artist || element.id, x: event.clientX, y: event.clientY, box:{x:r.x,y:r.y,w:r.width,h:r.height}, scroll:scrollY, worldTop:document.getElementById('world').getBoundingClientRect().top, yaw: document.getElementById('world').dataset.longitude, hover: document.querySelector('.globe-pin:hover')?.dataset.artist, marker: document.getElementById('world').dataset.hoveredArtist });
        });
      }
    });
    await page.locator('.globe-pin[data-artist="bts"]').hover();
    await page.waitForFunction(() => document.querySelector('.globe-pin[data-artist="bts"]').matches(':hover') && document.getElementById('world').dataset.hoveredArtist === 'bts');
    const longitude = await page.locator('#world').getAttribute('data-longitude');
    await page.waitForTimeout(250);
    const afterHover = await page.locator('#world').getAttribute('data-longitude');
    if (afterHover !== longitude) console.log('Hover event trace', await page.evaluate(() => window.hoverTrace));
    assert.equal(afterHover, longitude, 'Hover pauses the earth');
    assert.equal(await page.locator('#world-artist-name').textContent(), 'BTS');
    assert.equal(await page.locator('.globe-pin[data-artist="bts"] .artist-pin-name').evaluate(element => getComputedStyle(element).opacity), '1');
    await page.locator('.world-song').nth(2).click();
    assert.equal(await page.locator('.world-song').nth(2).getAttribute('aria-pressed'), 'true');
    assert.ok((await page.locator('#world-song-note').textContent()).includes('Blue & Grey'));
    const beforeDrag = Number(await page.locator('#world').getAttribute('data-longitude'));
    const bounds = await page.locator('#music-globe').boundingBox();
    await page.mouse.move(bounds.x + bounds.width * .5, bounds.y + bounds.height * .75);
    await page.mouse.down(); await page.mouse.move(bounds.x + bounds.width * .5 + 140, bounds.y + bounds.height * .65, { steps: 8 }); await page.mouse.up();
    assert.ok(Math.abs(Number(await page.locator('#world').getAttribute('data-longitude')) - beforeDrag) > 35, 'Dragging rotates the globe in 3D');
    await page.locator('#music-globe').focus();
    const beforeKey = Number(await page.locator('#world').getAttribute('data-longitude'));
    await page.keyboard.press('ArrowRight'); await page.waitForTimeout(800);
    assert.ok(Math.abs(Number(await page.locator('#world').getAttribute('data-longitude')) - beforeKey) > 15);
    for (const viewport of [{ width: 375, height: 667 }, { width: 390, height: 844 }, { width: 768, height: 900 }, { width: 1024, height: 600 }, { width: 1920, height: 1080 }]) {
      await page.setViewportSize(viewport); await cardsScreen(); await page.waitForTimeout(100);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `No horizontal overflow at ${viewport.width}`);
      const image = await page.locator('.cover-card-face img').first().evaluate(element => ({ w: element.offsetWidth, h: element.offsetHeight }));
      assert.ok(Math.abs(image.w - image.h) < 2, 'Cover art remains square');
      await worldScreen();
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Globe fits at ${viewport.width}`);
      assert.ok(await page.locator('#music-globe').evaluate(element => element.width > 0 && element.height > 0));
    }
    await page.setViewportSize({ width: 390, height: 844 }); await cardsScreen();
    await page.screenshot({ path: path.join(output, 'covers-mobile.png') });
    await worldScreen(); await page.locator('.world-region[data-artist="adele"]').click(); await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(output, 'world-mobile.png') });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    // The media-query change is dispatched asynchronously by the browser.
    await page.waitForTimeout(150);
    const still = await page.locator('#world').getAttribute('data-longitude'); await page.waitForTimeout(200);
    assert.equal(await page.locator('#world').getAttribute('data-longitude'), still);
    await page.locator('.world-region[data-artist="billie"]').click();
    assert.equal(await page.locator('#world-artist-name').textContent(), 'Billie Eilish');
    assert.equal(await page.locator('.globe-pin[data-artist="billie"]').isVisible(), true);
    assert.equal(await page.locator('#cover-stream').evaluate(element => getComputedStyle(element).display), 'grid');
    assert.deepEqual(errors, []); assert.deepEqual(failed, []);
    console.log('PASS: real album art, downward scattered layout, hover/freeze/resume, cover-to-song scroll morph and reversal, no-click globe rotation, 9 artists, keyboard, mobile, reduced motion, no errors.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
