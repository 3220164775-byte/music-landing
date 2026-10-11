'use strict';

window.createGlobalConnections = function ({audio,getTrack}) {
  const section=document.getElementById('resonance');
  const viewport=section.querySelector('.resonance-viewport');
  const stage=document.getElementById('listener-network');
  const canvas=document.getElementById('connection-field'),ctx=canvas.getContext('2d');
  const cosmicCanvas=document.getElementById('cosmic-field'),cosmicCtx=cosmicCanvas.getContext('2d');
  const button=document.getElementById('resonance-play'),label=document.getElementById('resonance-play-label'),status=document.getElementById('resonance-state');
  const counter=document.getElementById('connection-count');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const portraits=new Image();portraits.src='./assets/listeners-grid.jpg';
  const cities=['TOKYO','LONDON','LAGOS','SÃO PAULO','SHANGHAI','PARIS','SEOUL','MUMBAI','NEW YORK','CAPE TOWN','LISBON','MEXICO CITY','SYDNEY','BERLIN','TAIPEI','ISTANBUL','NAIROBI','TORONTO','BANGKOK','OSLO','DUBAI','BUENOS AIRES','ROME','JAKARTA'];
  const initialListeners=4;
  let width=0,height=0,progress=0,nodes=[],links=[],total=108,extent=3.6,selected=null;
  let cosmicWidth=0,cosmicHeight=0,stars=[];
  let frame=0,visible=false,context=null,analyser=null,frequencies=null,energy=0,lastStatus='',hover=null;
  const clamp=n=>Math.min(1,Math.max(0,n));
  const ease=n=>{n=clamp(n);return n*n*(3-2*n);};
  const random=n=>{const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v);};
  function build(){
    const rect=stage.getBoundingClientRect();width=rect.width;height=rect.height;
    const mobile=width<650;total=mobile?64:108;extent=mobile?5:3.6;
    const ratio=Math.min(devicePixelRatio||1,1.75);canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);ctx.setTransform(ratio,0,0,ratio,0,0);
    cosmicWidth=viewport.clientWidth;cosmicHeight=viewport.clientHeight;
    cosmicCanvas.width=Math.round(cosmicWidth*ratio);cosmicCanvas.height=Math.round(cosmicHeight*ratio);cosmicCtx.setTransform(ratio,0,0,ratio,0,0);
    stars=Array.from({length:mobile?180:340},(_,id)=>({x:(random(id+510)-.5)*cosmicWidth*1.9,y:(random(id+920)-.5)*cosmicHeight*1.9,z:1.5+random(id+1300)*10.5,size:.45+random(id+1750)*1.25,alpha:.25+random(id+2200)*.6,tint:random(id+2700)}));
    nodes=[];links=[];
    const radiusX=width*extent*.45,radiusY=height*extent*.43;
    const baseSize=Math.sqrt(Math.PI*radiusX*radiusY/total)*.42;
    for(let id=0;id<total;id++){
      // A jittered sunflower distribution grows organically out from one origin.
      const radius=id===0?0:Math.sqrt(id/(total-1))*(.9+random(id+40)*.1);
      const angle=id*2.3999632297+(random(id+20)-.5)*.8;
      const x=Math.cos(angle)*radius*radiusX,y=Math.sin(angle)*radius*radiusY;
      nodes.push({id,x,y,distance:radius,size:baseSize*(.8+random(id+99)*.35),portrait:Math.floor(random(id+170)*16),city:cities[(id*7)%cities.length],threshold:0,rank:0});
    }
    // Separate close neighbours while keeping an irregular radial silhouette.
    for(let pass=0;pass<8;pass++)for(let i=0;i<nodes.length;i++)for(let j=i+1;j<nodes.length;j++){
      const a=nodes[i],b=nodes[j],dx=b.x-a.x,dy=b.y-a.y;
      const required=(a.size+b.size)*.7,distance=Math.hypot(dx,dy)||1;
      if(distance<required){const shift=(required-distance)*.26;const nx=dx/distance,ny=dy/distance;
        if(a.id!==0){a.x-=nx*shift;a.y-=ny*shift;}b.x+=nx*shift;b.y+=ny*shift;
      }
    }
    const ordered=[...nodes].sort((a,b)=>a.distance-b.distance);
    ordered.forEach((node,rank)=>{node.rank=rank;node.threshold=rank<initialListeners?0:.10+rank/(nodes.length-1)*.80;if(rank<initialListeners)node.portrait=[0,5,10,15][rank];});
    nodes.forEach(node=>{
      // Each new listener is attached to someone already revealed.
      if(node.rank===0)return;
      const earlier=nodes.filter(other=>other.rank<node.rank).sort((a,b)=>Math.hypot(a.x-node.x,a.y-node.y)-Math.hypot(b.x-node.x,b.y-node.y));
      links.push({a:earlier[0],b:node});
      if(node.id%4===0&&earlier[1])links.push({a:earlier[1],b:node});
    });
    section.dataset.totalListeners=String(nodes.length);section.dataset.layout="radial";update();
  }
  function arrival(node){return node.rank<initialListeners?1:ease((progress-node.threshold)/.085);}
  function camera(){return 1-(1-1/extent)*ease(progress);}
  function project(node,scale){
    let x=node.x*scale,y=node.y*scale;
    if(node.rank>0&&node.rank<initialListeners){
      // Begin with a few distant people; they converge as listeners fill the gaps.
      const openingScale=.28/Math.hypot(node.x/width,node.y/height),settle=ease(progress);
      const spacing=openingScale+(1/extent-openingScale)*settle;
      x=node.x*spacing;y=node.y*spacing;
    }
    return{x:width*.5+x,y:height*.5+y,size:node.size*scale};
  }
  function update(){
    const rect=section.getBoundingClientRect();const distance=section.offsetHeight-viewport.offsetHeight;
    progress=reduced.matches?1:clamp(-rect.top/Math.max(1,distance));
    section.dataset.expansion=progress.toFixed(4);section.style.setProperty('--network-progress',String(progress));
    const depth=ease(progress);
    section.style.setProperty('--cosmos-scale',String(1.24-depth*.24));
    section.style.setProperty('--cosmos-shift',`${-28+depth*28}px`);
    section.style.setProperty('--cosmos-turn',`${-1.4+depth*1.4}deg`);
    drawCosmos(depth);
    selected=null;draw();start();
  }
  function drawCosmos(depth){
    if(!cosmicWidth||!cosmicHeight)return;
    const travel=depth*6;
    cosmicCtx.clearRect(0,0,cosmicWidth,cosmicHeight);
    stars.forEach(star=>{
      // Near stars move and shrink faster than distant stars as the camera retreats.
      const perspective=star.z/(star.z+travel),x=cosmicWidth*.5+star.x*perspective,y=cosmicHeight*.47+star.y*perspective;
      if(x<0||x>cosmicWidth||y<0||y>cosmicHeight)return;
      const radius=Math.max(.3,star.size*perspective);
      cosmicCtx.globalAlpha=star.alpha;cosmicCtx.fillStyle=star.tint>.8?'#b5c0f5':star.tint<.2?'#88bcca':'#c9d2e3';
      cosmicCtx.beginPath();cosmicCtx.arc(x,y,radius,0,Math.PI*2);cosmicCtx.fill();
      if(star.size>1.4&&star.z<5){
        cosmicCtx.globalAlpha=star.alpha*.12;cosmicCtx.beginPath();cosmicCtx.arc(x,y,radius*3.5,0,Math.PI*2);cosmicCtx.fill();
      }
    });cosmicCtx.globalAlpha=1;
    cosmicCanvas.dataset.nearScale=(1.5/(1.5+travel)).toFixed(4);cosmicCanvas.dataset.farScale=(12/(12+travel)).toFixed(4);
    cosmicCanvas.dataset.depth=travel.toFixed(4);
  }
  function draw(){
    if(!width||!height)return;
    const audible=!audio.paused&&!audio.muted&&audio.volume>0&&!!getTrack();
    if(analyser&&audible){analyser.getByteFrequencyData(frequencies);energy+=((frequencies[1]+frequencies[2]+frequencies[3])/765-energy)*.25;}else energy=0;
    const scale=camera();const positions=nodes.map(node=>project(node,scale));
    ctx.clearRect(0,0,width,height);
    const related=new Set(selected===null?[]:[selected]);links.forEach(({a,b})=>{if(a.id===selected)related.add(b.id);if(b.id===selected)related.add(a.id);});
    let count=0,drawnLinks=0,initialLength=0,initialLinks=0;
    links.forEach(({a,b},index)=>{
      const opacity=Math.min(arrival(a),arrival(b));if(opacity<=.01)return;
      const from=positions[a.id],to=positions[b.id];
      const active=selected===a.id||selected===b.id;
      ctx.globalAlpha=opacity*(selected!==null&&!active ? .17 : 1);
      const dx=to.x-from.x,dy=to.y-from.y,length=Math.hypot(dx,dy)||1;
      if(a.rank<initialListeners&&b.rank<initialListeners){initialLength+=length;initialLinks++;}
      const bend=Math.min(length*.16,24)*(index%2?1:-1);
      const control={x:(from.x+to.x)/2-dy/length*bend,y:(from.y+to.y)/2+dx/length*bend};
      const curve=t=>({x:(1-t)*(1-t)*from.x+2*(1-t)*t*control.x+t*t*to.x,y:(1-t)*(1-t)*from.y+2*(1-t)*t*control.y+t*t*to.y});
      ctx.beginPath();ctx.moveTo(from.x,from.y);ctx.quadraticCurveTo(control.x,control.y,to.x,to.y);
      ctx.strokeStyle=active?'#c7b1e4':'#a699c369';ctx.lineWidth=active?1.2:.7;ctx.stroke();drawnLinks++;
      if(audible&&!reduced.matches&&(selected===null||active)){
        const p=curve((audio.currentTime/4+index*.137)%1);
        ctx.fillStyle='#b5e1e4';ctx.beginPath();ctx.arc(p.x,p.y,1+energy*1.3,0,Math.PI*2);ctx.fill();
      }
    });
    nodes.forEach(node=>{
      const opacity=arrival(node);if(opacity>.01)count++;if(opacity<=.01)return;
      const p=positions[node.id];if(p.x+p.size<0||p.x-p.size>width||p.y+p.size<0||p.y-p.size>height)return;
      ctx.globalAlpha=opacity*(selected!==null&&!related.has(node.id) ? .32 : 1);
      if(portraits.complete&&portraits.naturalWidth){const sw=portraits.naturalWidth/4,sh=portraits.naturalHeight/4;ctx.drawImage(portraits,node.portrait%4*sw,Math.floor(node.portrait/4)*sh,sw,sh,p.x-p.size/2,p.y-p.size*.56,p.size,p.size*1.12);}
      if(p.size>42){ctx.fillStyle='#aba2b8';ctx.font=`${Math.max(6,Math.min(9,p.size*.085))}px ui-monospace,monospace`;ctx.textAlign='center';ctx.fillText(node.city,p.x,p.y+p.size*.56+Math.max(9,p.size*.12));}
      if(node.id===selected){ctx.strokeStyle='#cab6df';ctx.lineWidth=1;ctx.strokeRect(p.x-p.size/2,p.y-p.size*.56,p.size,p.size*1.12);}
    });ctx.globalAlpha=1;
    counter.textContent=`${String(count).padStart(2,'0')} / ${nodes.length}`;
    section.dataset.listeners=String(count);section.dataset.connections=String(drawnLinks);section.dataset.portraitSize=(nodes[0]?.size*scale||0).toFixed(2);
    section.dataset.initialConnectionLength=(initialLength/Math.max(1,initialLinks)).toFixed(2);
    section.dataset.energy=energy.toFixed(4);section.dataset.signal=audible&&!reduced.matches?(audio.currentTime%4/4).toFixed(4):'0.0000';
    canvas.dataset.phase=audio.currentTime.toFixed(3);
  }
  function activateAudio(){
    if(!context){const AudioContext=window.AudioContext||window.webkitAudioContext;if(!AudioContext)return;try{context=new AudioContext();const source=context.createMediaElementSource(audio);analyser=context.createAnalyser();analyser.fftSize=256;analyser.smoothingTimeConstant=.35;source.connect(analyser);analyser.connect(context.destination);frequencies=new Uint8Array(analyser.frequencyBinCount);}catch(_){context=null;analyser=null;}}
    if(context?.state==='suspended')context.resume().catch(()=>{});
    return context;
  }
  function sync(){
    const playing=!audio.paused&&!!getTrack(),audible=playing&&!audio.muted&&audio.volume>0;
    section.classList.toggle('is-playing',audible);button.setAttribute('aria-pressed',String(playing));button.querySelector('.resonance-play-icon').textContent=playing?'Ⅱ':'▶';
    label.textContent=playing?'暂停音乐':getTrack()?'继续音乐 · 连接世界':'开启声音 · 连接世界';
    button.setAttribute('aria-label',playing?'暂停音乐与连接光点':'播放原创音乐，让光点沿人物连线传递');
    lastStatus=reduced.matches?'减少动态效果已开启 · 音乐仍可播放':audible?`「${getTrack().title}」正在连接我们 · 原创试听`:playing?'音乐已静音 · 连接静静保留':'听一段旋律，让我们相遇。';status.textContent=lastStatus;
    section.dataset.audioState=audible?'playing':playing?'muted':'paused';draw();start();
  }
  function tick(){frame=0;if(!visible||document.hidden||reduced.matches)return;draw();if(!audio.paused&&!audio.muted)frame=requestAnimationFrame(tick);}
  function start(){if(visible&&!document.hidden&&!reduced.matches&&!frame)frame=requestAnimationFrame(tick);}
  function stop(){cancelAnimationFrame(frame);frame=0;}
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;document.body.classList.toggle('resonance-player-mode',visible);if(visible){update();start();}else stop();},{threshold:.01}).observe(viewport);
  function point(event){const r=canvas.getBoundingClientRect();return{x:event.clientX-r.left,y:event.clientY-r.top};}
  function pick(event){const p=point(event),scale=camera();return nodes.find(node=>{if(arrival(node)<.6)return false;const n=project(node,scale);return Math.abs(p.x-n.x)<Math.max(n.size/2,8)&&Math.abs(p.y-n.y)<Math.max(n.size*.56,8);})?.id??null;}
  canvas.addEventListener('pointermove',event=>{if(event.pointerType!=='mouse')return;hover=pick(event);selected=hover;draw();canvas.style.cursor=selected===null?'default':'pointer';});
  canvas.addEventListener('pointerleave',()=>{hover=null;selected=null;draw();});
  canvas.addEventListener('click',event=>{selected=pick(event);draw();if(selected!==null)status.textContent=`${nodes[selected].city} · 同一首旋律，让不同城市的人相遇。`;});
  window.addEventListener('scroll',update,{passive:true});new ResizeObserver(build).observe(stage);
  document.addEventListener('visibilitychange',()=>document.hidden?stop():start());
  document.addEventListener('click',event=>{const link=event.target.closest('a[href="#resonance"]');if(!link)return;event.preventDefault();history.replaceState(null,'','#resonance');scrollTo({top:section.getBoundingClientRect().top+scrollY,behavior:reduced.matches?'instant':'smooth'});});
  reduced.addEventListener('change',()=>{stop();build();sync();});
  audio.addEventListener('play',()=>{activateAudio();sync();});audio.addEventListener('pause',sync);audio.addEventListener('volumechange',sync);portraits.addEventListener('load',draw);
  build();sync();return{activateAudio,sync};
};
