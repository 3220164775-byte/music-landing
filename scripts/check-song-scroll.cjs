const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const path = require('node:path');

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_BROWSER_EXECUTABLE, args: ['--autoplay-policy=user-gesture-required'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  async function openWorld(target) {
    await target.goto(process.env.PREVIEW_URL || 'http://127.0.0.1:8080/', { waitUntil: 'networkidle' });
    await target.evaluate(() => scrollTo({ top: document.getElementById('world').getBoundingClientRect().top + scrollY, behavior: 'instant' }));
    await target.waitForTimeout(150);
  }
  try {
    await openWorld(page);
    const list = page.locator('#world-song-list');
    assert.ok(await list.evaluate(e => e.scrollHeight > e.clientHeight + 100), 'The song list has its own scroll range');
    await page.locator('#song-gear-toggle').click();
    await page.waitForFunction(() => document.getElementById('world-song-list').dataset.gearState === 'ready');
    assert.equal(await page.evaluate(() => audio.paused), true, 'Gear feedback does not start unrelated music');
    const before = await list.evaluate(e => ({ scroll: e.scrollTop, row: e.querySelector('.world-song').style.transform, page: scrollY }));
    const r = await list.boundingBox();
    await page.mouse.move(r.x + r.width * .5, r.y + r.height * .5);
    await page.mouse.wheel(0, 120);
    await page.waitForFunction(top => document.getElementById('world-song-list').scrollTop > top + 50, before.scroll);
    await page.waitForFunction(() => Number(document.getElementById('world-song-list').dataset.gearTicks) > 0);
    assert.notEqual(await list.evaluate(e => e.querySelector('.world-song').style.transform), before.row, 'Songs move around the curved list');
    assert.equal(await page.evaluate(() => scrollY), before.page, 'Wheel scrolling the list does not move the page');
    const ticks = await list.getAttribute('data-gear-ticks');
    await page.waitForTimeout(250);
    assert.equal(await list.getAttribute('data-gear-ticks'), ticks, 'The ratchet stops when the list stops');
    await page.screenshot({ path: path.resolve('output/gears19-world.png') });
    await page.evaluate(() => { audio.muted = true; });
    await page.mouse.wheel(0, -90);
    await page.waitForTimeout(200);
    assert.equal(await list.getAttribute('data-gear-ticks'), ticks, 'Global mute silences gear feedback');
    await page.evaluate(() => { audio.muted = false; });
    await page.locator('#song-gear-toggle').click();
    await page.mouse.move(r.x + r.width * .5, r.y + r.height * .5);
    await page.mouse.wheel(0, -60);
    await page.waitForTimeout(200);
    assert.equal(await list.getAttribute('data-gear-ticks'), ticks, 'The separate gear switch silences feedback');
    await list.focus();
    await page.keyboard.press('Home');
    await page.waitForFunction(() => document.getElementById('world-song-list').scrollTop < 1);
    await page.keyboard.press('End');
    await page.waitForFunction(() => Number(document.getElementById('world-song-list').dataset.position) > 4.9);
    await page.locator('.world-region[data-artist="adele"]').click();
    assert.ok(Math.abs(Number(await list.getAttribute('data-position')) - 2.5) < .03, 'Changing artists resets the list to its centered view');
    assert.equal(await list.getAttribute('data-gear-ticks'), ticks, 'Programmatic reset makes no gear sound');
    const phone = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const mobile = await phone.newPage(); mobile.on('pageerror', error => errors.push(error.message));
    await openWorld(mobile);
    await mobile.locator('#song-gear-toggle').tap();
    await mobile.waitForFunction(() => document.getElementById('world-song-list').dataset.gearState === 'ready');
    const box = await mobile.locator('#world-song-list').boundingBox();
    const initial = await mobile.evaluate(() => ({ page: scrollY, top: document.getElementById('world-song-list').scrollTop }));
    const cdp = await phone.newCDPSession(mobile);
    const x = box.x + box.width * .65, y = box.y + box.height * .75;
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
    for (let step = 1; step <= 8; step++) {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y - step * 8 }] });
      await mobile.waitForTimeout(18);
    }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await mobile.waitForTimeout(250);
    assert.ok(await mobile.locator('#world-song-list').evaluate((e, top) => e.scrollTop > top + 20, initial.top), 'Touch swipe scrolls the song list');
    assert.equal(await mobile.evaluate(() => scrollY), initial.page, 'Touch list scrolling does not move the page');
    assert.ok(Number(await mobile.locator('#world-song-list').getAttribute('data-gear-ticks')) > 0, 'Touch scrolling also triggers teeth clicks');
    await mobile.screenshot({ path: path.resolve('output/gears19-mobile.png') });
    await phone.close();
    assert.deepEqual(errors, []);
    console.log('PASS: independent curved list scrolling, keyboard, touch, gear sound on movement, no idle sound, mute/off, silent artist reset, no browser errors.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
