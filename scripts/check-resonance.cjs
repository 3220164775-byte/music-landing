const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');const path=require('node:path');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_BROWSER_EXECUTABLE});
 const page=await browser.newPage({viewport:{width:1440,height:1000}});const errors=[];page.on('pageerror',error=>errors.push(error.message));
 const output=path.resolve(__dirname,'../output');
 async function expand(p){await page.evaluate(p=>{const section=document.getElementById('resonance');const v=section.querySelector('.resonance-viewport');scrollTo({top:section.offsetTop+p*(section.offsetHeight-v.offsetHeight),behavior:'instant'});},p);await page.waitForFunction(p=>Math.abs(Number(document.getElementById('resonance').dataset.expansion)-p)<.003,p);}
 async function stats(){return page.locator('#resonance').evaluate(el=>{const cosmos=el.querySelector('#cosmic-field');return {count:Number(el.dataset.listeners),total:Number(el.dataset.totalListeners),size:Number(el.dataset.portraitSize),links:Number(el.dataset.connections),length:Number(el.dataset.initialConnectionLength),near:Number(cosmos.dataset.nearScale),far:Number(cosmos.dataset.farScale),nebula:getComputedStyle(el.querySelector('.cosmos-nebula')).transform};});}
 try{
  await page.goto(process.env.PREVIEW_URL||'http://127.0.0.1:8080/',{waitUntil:'networkidle'});
  assert.deepEqual(await page.locator('main section').evaluateAll(nodes=>nodes.map(n=>n.id)),['home','experience','world','resonance']);
  assert.equal(await page.locator('.cover-transition-card img').getAttribute('src'),'./assets/rotation-cover-reference.png','Second screen keeps the replacement cover');
  assert.ok(await page.evaluate(async()=>{const image=new Image();image.src='./assets/listeners-grid.jpg';await image.decode();return image.naturalWidth>=1000;}));
  assert.equal(await page.locator('#resonance').getAttribute('data-layout'),'radial');
  assert.ok(await page.evaluate(async()=>{const image=new Image();image.src='./assets/cosmos-nebula.jpg';await image.decode();return image.naturalWidth>=1000;}),'Cosmic background loads locally for static hosting');
  await expand(0);const first=await stats();assert.equal(first.count,4);assert.ok(first.length>first.size*2,'Opening connections leave a generous gap between portraits');
  assert.equal(first.near,1);assert.equal(first.far,1);
  await page.screenshot({path:path.join(output,'network-beginning.png')});
  await expand(.45);const middle=await stats();assert.ok(middle.count>30&&middle.count<first.total);assert.ok(middle.size<first.size);assert.ok(middle.length<first.length,'Connections shorten as people appear');
  assert.ok(middle.near<middle.far&&middle.far<1,'Nearby and distant stars retreat at different speeds');assert.notEqual(middle.nebula,first.nebula,'Distant nebula changes perspective while scrolling');
  await page.screenshot({path:path.join(output,'network-expanding.png')});
  await expand(1);const full=await stats();assert.equal(full.count,108);assert.equal(full.count,full.total);assert.ok(full.size<first.size*.3);assert.ok(full.length<middle.length*.5,'The original long connections contract throughout the scroll');assert.ok(full.links>=full.count-1,'Every added listener connects to someone already present');
  assert.ok(full.near<middle.near&&full.far<middle.far);assert.notEqual(full.nebula,middle.nebula);
  assert.ok(Math.abs(await page.locator('.resonance-viewport').evaluate(el=>el.getBoundingClientRect().top))<1,'The finale stays pinned throughout zoom');
  await page.screenshot({path:path.join(output,'network-desktop.png')});
  await expand(0);const reversed=await stats();assert.equal(reversed.count,4,'Reverse scrolling restores the intimate first group');assert.equal(reversed.length,first.length,'Reverse scrolling restores the long opening connections');
  assert.equal(reversed.near,first.near);assert.equal(reversed.nebula,first.nebula,'Reverse scrolling restores cosmic perspective');
  let previousLength=first.length;
  for(let step=1;step<=20;step++){await expand(step/20);const current=await stats();assert.ok(current.length<=previousLength+.02,'Connections contract smoothly without expanding again');previousLength=current.length;}
  await expand(.45);await page.locator('#resonance-play').click();
  await page.waitForFunction(()=>!audio.paused&&audio.currentTime>.4&&Number(document.getElementById('resonance').dataset.energy)>.01);
  assert.equal(await page.locator('#resonance').getAttribute('data-audio-state'),'playing');
  assert.equal(await page.locator('#mini-player').isVisible(),false,'Final-scene controls keep the top slogan clear during playback');
  const signal=await page.locator('#resonance').getAttribute('data-signal');await page.waitForTimeout(200);assert.notEqual(await page.locator('#resonance').getAttribute('data-signal'),signal);
  await page.locator('#resonance-play').click();assert.equal(await page.evaluate(()=>audio.paused),true);assert.equal(await page.locator('#resonance').getAttribute('data-signal'),'0.0000');
  await page.locator('#resonance-play').focus();await page.keyboard.press('Space');await page.waitForFunction(()=>!audio.paused);
  await page.evaluate(()=>{audio.muted=true;});await page.waitForFunction(()=>document.getElementById('resonance').dataset.audioState==='muted');assert.equal(await page.locator('#resonance').getAttribute('data-audio-state'),'muted');assert.equal(await page.locator('#resonance').getAttribute('data-signal'),'0.0000');
  await page.evaluate(()=>{audio.muted=false;});
  for(const viewport of [{width:375,height:667},{width:390,height:844},{width:768,height:900},{width:1024,height:600},{width:1920,height:1080}]){
   await page.setViewportSize(viewport);await expand(1);
   const geometry=await page.evaluate(()=>{const title=document.querySelector('.resonance-copy').getBoundingClientRect(),map=document.getElementById('listener-network').getBoundingClientRect(),controls=document.querySelector('.network-controls').getBoundingClientRect(),footer=document.querySelector('.resonance-footer').getBoundingClientRect();return {titleBottom:title.bottom,mapTop:map.top,mapBottom:map.bottom,controlsTop:controls.top,controlsBottom:controls.bottom,footerTop:footer.top,footerBottom:footer.bottom,mapHeight:map.height,overflow:document.documentElement.scrollWidth>innerWidth};});
   assert.equal(geometry.overflow,false,`No horizontal overflow at ${viewport.width}`);assert.ok(geometry.titleBottom<geometry.mapTop,`Small top title clears the map at ${viewport.width}: ${JSON.stringify(geometry)}`);assert.ok(geometry.mapBottom<=geometry.controlsTop,`Map clears controls at ${viewport.width}: ${JSON.stringify(geometry)}`);assert.ok(geometry.controlsBottom<geometry.footerTop);assert.ok(geometry.footerBottom<viewport.height+1);assert.ok(geometry.mapHeight>viewport.height*.45,'Network occupies more of the viewport');
   const result=await stats();assert.equal(result.count,result.total);assert.ok(result.count>=64&&result.count<=108,'Final network leaves more space on desktop and phone');
  }
  await page.setViewportSize({width:390,height:844});await expand(1);await page.screenshot({path:path.join(output,'network-mobile.png')});
  await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(200);await page.evaluate(()=>scrollTo({top:document.documentElement.scrollHeight,behavior:'instant'}));
  assert.equal(await page.locator('#resonance').getAttribute('data-expansion'),'1.0000');assert.equal(await page.locator('#resonance').getAttribute('data-signal'),'0.0000');assert.equal((await stats()).count,(await stats()).total);assert.equal(await page.evaluate(()=>audio.paused),false);
  assert.deepEqual(errors,[]);console.log('PASS: layered cosmic perspective and reversible nebula zoom, four scenes, supplied transition image preserved, 4→108 linked listeners (64 on phone), long opening connections progressively contract, smaller portraits, scroll zoom and reversal, pinned finale, audio signals, keyboard, mute/pause, desktop/mobile layouts, reduced motion.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
