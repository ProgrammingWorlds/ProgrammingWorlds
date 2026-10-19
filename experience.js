/* Coordinated GSAP timelines, one drawing loop, layered pointer/scroll transforms. */
(function(){
'use strict';
const root=document.documentElement,M=window.PWMotion,q=s=>document.querySelector(s),qa=s=>[...document.querySelectorAll(s)];
const reduced=matchMedia('(prefers-reduced-motion: reduce)'),fine=matchMedia('(pointer:fine)'),hover=matchMedia('(hover:hover)');
const ids=['home','services','process','about','contact'],hero=q('#home'),service=q('#services'),approach=q('#process'),panels=qa('.service-panel'),steps=qa('.approach-step');
const world=window.createPWWorld?.(),state={deck:0,assembly:0},cursor=q('.cursor-fx'),cursorParts=[...cursor.children];
const pointer={x:0,y:0,nx:0,ny:0,visible:false},eased={x:0,y:0},trail=Array.from({length:4},()=>({x:0,y:0}));
let profile,paused=false,downgraded=false,frame=0,lastTime=0,lastDraw=0,slow=0,dirty=true,sections=[],reveals=[],width=innerWidth,height=innerHeight,pageHeight=1;
let pinMode='',deckTL=null,assemblyTL=null,active=0,currentScene='home',tilted=null,magnet=null,refreshing=false,measureQueued=false;
const styleCache=new WeakMap();
function write(el,key,value){if(!el)return;let cache=styleCache.get(el);if(!cache){cache={};styleCache.set(el,cache)}if(cache[key]!==value){el.style.setProperty(key,value);cache[key]=value;}}
function calm(){return paused||reduced.matches}
function schedule(){dirty=true;if(!frame&&!document.hidden)frame=requestAnimationFrame(tick)}
function chooseQuality(){profile=M.quality({reduced:calm(),saveData:!!navigator.connection?.saveData,memory:navigator.deviceMemory||8,cores:navigator.hardwareConcurrency||8,width:innerWidth});if(downgraded)profile={...profile,lite:true,continuous:false,dpr:1};world?.configure(profile,calm());root.dataset.quality=profile.lite?'lite':'full';if(!profile.continuous){resetPointer();eased.x=eased.y=0;}}
function destroyPins(){deckTL?.scrollTrigger?.kill(true);deckTL?.kill();assemblyTL?.scrollTrigger?.kill(true);assemblyTL?.kill();deckTL=assemblyTL=null;root.classList.remove('deck-pinned','approach-pinned');panels.forEach(p=>{p.inert=false;p.removeAttribute('aria-hidden')});}
function configurePins(){
 const enabled=!calm()&&!profile.lite&&width>1100&&height>=760&&!!window.gsap&&!!window.ScrollTrigger;
 const mode=enabled?'full':'static';if(mode===pinMode)return;pinMode=mode;destroyPins();state.deck=state.assembly=0;
 if(enabled){
  const gsap=window.gsap;gsap.registerPlugin(window.ScrollTrigger);root.classList.add('deck-pinned','approach-pinned');
  deckTL=gsap.timeline({scrollTrigger:{id:'pw-services',trigger:service,pin:'.services-pin',start:'top top',end:()=>'+='+Math.round(height*4),scrub:.6,anticipatePin:1,invalidateOnRefresh:true,onUpdate:schedule,onRefresh:queueMeasure}});
  deckTL.to(state,{deck:4,duration:4,ease:'none',onUpdate:schedule});
  assemblyTL=gsap.timeline({scrollTrigger:{id:'pw-approach',trigger:approach,pin:'.approach-pin',start:'top top',end:()=>'+='+Math.round(height*1.7),scrub:.65,anticipatePin:1,invalidateOnRefresh:true,onUpdate:schedule,onRefresh:queueMeasure}});
  assemblyTL.to(state,{assembly:1,duration:1,ease:'none',onUpdate:schedule});
 }
 write(q('.service-track'),'--deck-x','0px');schedule();
}
function queueMeasure(){if(measureQueued)return;measureQueued=true;requestAnimationFrame(()=>{measureQueued=false;measure();});}
function measure(){
 width=innerWidth;height=innerHeight;pageHeight=Math.max(1,root.scrollHeight-height);
 sections=ids.map(id=>{const el=q('#'+id);return {id,el,top:el.getBoundingClientRect().top+scrollY,height:el.offsetHeight};});
 reveals=qa('.cinema-reveal').map(el=>({el,top:el.getBoundingClientRect().top+scrollY,height:el.offsetHeight}));world?.measure();schedule();
}
function refresh(){if(refreshing)return;refreshing=true;chooseQuality();width=innerWidth;height=innerHeight;configurePins();measure();updateLabels();refreshing=false;}
function updateLabels(){
 const ar=root.lang==='ar';q('#motion-toggle').textContent=ar?(paused?'تشغيل التأثيرات':'إيقاف التأثيرات'):(paused?'Resume effects':'Pause effects');q('#motion-toggle').setAttribute('aria-pressed',String(paused));
 const labels=ar?['الرئيسية','الخدمات','أسلوبنا','من نحن','تواصل معنا']:['Home','Services','Approach','About','Contact'];qa('.chapter-rail a').forEach((a,i)=>a.setAttribute('aria-label',labels[i]));q('.chapter-rail').setAttribute('aria-label',ar?'أقسام الصفحة':'Page chapters');
}
function sceneAt(y){let selected=sections[0];for(const s of sections)if(s.top<=y+height*.4)selected=s;return selected;}
function progress(s,y){return M.clamp((y-s.top+height*.25)/Math.max(1,s.height-height*.45))}
function updateServices(y){
 const s=sections.find(s=>s.id==='services'),p=deckTL?state.deck:progress(s,y)*4;
 const index=Math.round(M.clamp(p,0,4));if(index!==active){active=index;updateServiceControls();}
 if(deckTL){
  write(q('.service-track'),'--deck-x',(-p*width).toFixed(2)+'px');write(service,'--service-progress',(p/4).toFixed(4));
  panels.forEach((panel,i)=>{
   const offset=i-p,near=Math.abs(offset),visible=near<.62;
   if(panel.inert===visible)panel.inert=!visible;
   if(panel.getAttribute('aria-hidden')!==String(!visible))panel.setAttribute('aria-hidden',String(!visible));
   write(panel,'--panel-turn',(offset*-19).toFixed(2)+'deg');write(panel,'--panel-z',(-Math.min(near,1)*170).toFixed(2)+'px');write(panel,'--panel-opacity',String(1-Math.min(near,1)*.6));write(panel,'--copy-x',(offset*35).toFixed(2)+'px');
  });
 }
 panels.forEach((panel,i)=>{const phase=calm()?0:deckTL?(i-p):M.clamp((panel.getBoundingClientRect().top-height*.2)/height,-1,1);write(panel,'--object-y',(phase*35).toFixed(2)+'px');write(panel,'--object-ry',(-12+phase*20+eased.x*12).toFixed(2)+'deg');write(panel,'--object-rx',(8-eased.y*9).toFixed(2)+'deg');});
}
function updateServiceControls(){q('#service-position').textContent=`0${active+1} / 05`;q('#service-prev').disabled=active===0;q('#service-next').disabled=active===4;qa('[data-service-jump]').forEach((b,i)=>{if(i===active)b.setAttribute('aria-current','true');else b.removeAttribute('aria-current')});}
function goService(index){index=M.clamp(index,0,4);active=index;updateServiceControls();if(deckTL){const st=deckTL.scrollTrigger;scrollTo({top:st.start+(st.end-st.start)*(index/4),behavior:calm()?'auto':'smooth'});}else panels[index].scrollIntoView({behavior:calm()?'auto':'smooth',block:'start'});}
q('#service-prev').addEventListener('click',()=>goService(active-1));q('#service-next').addEventListener('click',()=>goService(active+1));qa('[data-service-jump]').forEach(b=>b.addEventListener('click',()=>goService(Number(b.dataset.serviceJump))));
function renderScene(y,now){
 const s=sceneAt(y),p=progress(s,y);currentScene=s.id;
 qa('.header nav a,.chapter-rail a').forEach(a=>{const on=a.hash==='#'+s.id;a.classList.toggle('active',on);if(on)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current')});
 const hs=sections[0],hp=M.clamp(y/Math.max(1,hs.height)),power=calm()?0:profile.lite?.35:1;
 write(hero,'--background-y',(hp*150*power-eased.y*14).toFixed(2)+'px');write(hero,'--background-x',(-eased.x*18*power).toFixed(2)+'px');write(hero,'--background-scale',(1+hp*.16*power).toFixed(4));
 write(hero,'--logo-y',(-hp*140*power).toFixed(2)+'px');write(hero,'--logo-x',(hp*70*power*(root.dir==='rtl'?-1:1)).toFixed(2)+'px');write(hero,'--logo-scale',(1+hp*.18*power).toFixed(4));write(hero,'--logo-rz',(-hp*16*power).toFixed(2)+'deg');write(hero,'--text-y',(-hp*65*power).toFixed(2)+'px');write(hero,'--hero-copy-opacity',String(1-hp*.45*power));write(hero,'--pointer-rx',(-eased.y*12*power).toFixed(2)+'deg');write(hero,'--pointer-ry',(eased.x*20*power).toFixed(2)+'deg');
 updateServices(y);
 const as=sections.find(s=>s.id==='process'),ap=assemblyTL?state.assembly:progress(as,y),step=Math.min(2,Math.floor(ap*3));steps.forEach((el,i)=>el.classList.toggle('is-active',i===step));
 const labels=root.lang==='ar'?['01 / نفهم','02 / نصمم','03 / نبني']:['01 / UNDERSTAND','02 / DESIGN','03 / BUILD'];q('#assembly-label').textContent=labels[step];
 write(approach,'--assembly-progress',Math.max(.02,ap).toFixed(4));write(approach,'--assembly-spread',(Math.sin(ap*Math.PI)*65*power).toFixed(2)+'px');write(approach,'--assembly-turn',((ap-.5)*65*power).toFixed(2)+'deg');
 const about=sections.find(s=>s.id==='about'),abp=progress(about,y);write(about.el,'--story-y',((abp-.5)*-95*power).toFixed(2)+'px');write(about.el,'--story-turn',((abp-.5)*-50*power+eased.x*10).toFixed(2)+'deg');write(about.el,'--story-z',(Math.sin(abp*Math.PI)*70*power).toFixed(2)+'px');
 const co=sections.find(s=>s.id==='contact'),cp=progress(co,y);write(co.el,'--contact-scale',(1+cp*.14*power).toFixed(4));write(co.el,'--contact-y',((cp-.5)*95*power).toFixed(2)+'px');write(co.el,'--contact-copy-y',((1-cp)*40*power).toFixed(2)+'px');
 for(const r of reveals){const v=calm()?1:M.clamp((height*.94-(r.top-y))/Math.max(120,Math.min(250,r.height)));write(r.el,'--reveal-opacity',String(.25+.75*v));write(r.el,'--reveal-y',((1-v)*45*power).toFixed(2)+'px');write(r.el,'--reveal-rx',((1-v)*8*power).toFixed(2)+'deg');}
 if(now-lastDraw>=profile.interval){world?.update(s.id,s.id==='services'?(deckTL?state.deck/4:p):s.id==='process'?ap:p,eased,now,calm());lastDraw=now;}
}
function resetPointer(){pointer.nx=pointer.ny=0;pointer.visible=false;root.classList.remove('pointer-visible','cursor-hover','cursor-down');if(tilted)write(tilted,'--tilt-angle','0deg');if(magnet){write(magnet,'--magnet-x','0px');write(magnet,'--magnet-y','0px');}tilted=magnet=null;schedule();}
function pointerAllowed(){return !calm()&&fine.matches&&hover.matches&&profile.continuous;}
function renderPointer(dt){
 const allowed=pointerAllowed();const k=1-Math.exp(-dt*9);eased.x+=(pointer.nx-eased.x)*k;eased.y+=(pointer.ny-eased.y)*k;
 if(!allowed)return false;
 write(root,'--scene-light-x',((eased.x+.5)*100).toFixed(2)+'%');write(root,'--scene-light-y',((eased.y+.5)*100).toFixed(2)+'%');
 let moving=false;
 if(pointer.visible){
  write(cursorParts[0],'transform',`translate3d(${pointer.x}px,${pointer.y}px,0) translate(-50%,-50%)`);
  trail.forEach((pos,i)=>{const target=i?trail[i-1]:pointer;const rate=1-Math.exp(-dt*(i?14:12));pos.x+=(target.x-pos.x)*rate;pos.y+=(target.y-pos.y)*rate;if(Math.abs(pos.x-target.x)+Math.abs(pos.y-target.y)>.1)moving=true;write(cursorParts[i+1],'transform',`translate3d(${pos.x.toFixed(2)}px,${pos.y.toFixed(2)}px,0) translate(-50%,-50%)`);});
 }
 if(tilted?.isConnected){const r=tilted.getBoundingClientRect(),x=M.clamp((pointer.x-r.left)/Math.max(1,r.width)),y=M.clamp((pointer.y-r.top)/Math.max(1,r.height)),rx=(y-.5)*-9,ry=(x-.5)*13;write(tilted,'--tilt-axis',`${rx.toFixed(3)} ${ry.toFixed(3)} 0`);write(tilted,'--tilt-angle',Math.hypot(rx,ry).toFixed(2)+'deg');write(tilted,'--mx',x*100+'%');write(tilted,'--my',y*100+'%');}
 if(magnet?.isConnected){const r=magnet.getBoundingClientRect();write(magnet,'--magnet-x',M.clamp((pointer.x-r.left-r.width/2)*.16,-10,10).toFixed(2)+'px');write(magnet,'--magnet-y',M.clamp((pointer.y-r.top-r.height/2)*.16,-7,7).toFixed(2)+'px');}
 return moving||Math.abs(pointer.nx-eased.x)+Math.abs(pointer.ny-eased.y)>.001;
}
function tick(now){
 frame=0;if(document.hidden)return;const delta=lastTime?now-lastTime:16;lastTime=now;const dt=Math.min(.06,Math.max(.001,delta/1000));
 if(profile.continuous&&delta>85&&delta<500)slow++;else slow=Math.max(0,slow-1);if(slow>16&&!downgraded){downgraded=true;resetPointer();refresh();}
 const pointerMoving=renderPointer(dt),y=scrollY,visible=y<(sections.at(-1)?.top||0)+(sections.at(-1)?.height||0);
 if(dirty||pointerMoving||profile.continuous&&visible){write(q('.reading-progress'),'transform',`scaleX(${M.clamp(y/pageHeight)})`);q('.header').classList.toggle('scrolled',y>25);renderScene(y,now);dirty=false;}
 if((pointerMoving||profile.continuous&&visible)&&!frame){frame=requestAnimationFrame(tick);}
}
document.addEventListener('pointermove',e=>{if(!pointerAllowed()||e.pointerType==='touch')return;const first=!pointer.visible;pointer.x=e.clientX;pointer.y=e.clientY;pointer.nx=e.clientX/width-.5;pointer.ny=e.clientY/height-.5;pointer.visible=true;if(first)trail.forEach(p=>{p.x=pointer.x;p.y=pointer.y});root.classList.add('pointer-visible');const interactive=e.target.closest('button,a,input,textarea,select,summary');root.classList.toggle('cursor-hover',!!interactive);const card=e.target.closest('[data-pointer-card]'),button=e.target.closest('.button');if(card!==tilted){if(tilted)write(tilted,'--tilt-angle','0deg');tilted=card;}if(button!==magnet){if(magnet){write(magnet,'--magnet-x','0px');write(magnet,'--magnet-y','0px');}magnet=button;}schedule();},{passive:true});
document.addEventListener('pointerdown',e=>{if(e.pointerType!=='touch'&&pointerAllowed())root.classList.add('cursor-down')},{passive:true});document.addEventListener('pointerup',()=>root.classList.remove('cursor-down'),{passive:true});
root.addEventListener('pointerleave',resetPointer);addEventListener('blur',resetPointer);
q('#motion-toggle').addEventListener('click',()=>{paused=!paused;root.dataset.motion=paused?'paused':'active';resetPointer();window.PWBoot?.finish();refresh();window.ScrollTrigger?.refresh();});
reduced.addEventListener('change',()=>{resetPointer();window.PWBoot?.finish();refresh();window.ScrollTrigger?.refresh();});fine.addEventListener('change',resetPointer);hover.addEventListener('change',resetPointer);
addEventListener('scroll',schedule,{passive:true});addEventListener('resize',()=>{refresh();window.ScrollTrigger?.refresh();},{passive:true});
document.addEventListener('pw:content',refresh);document.addEventListener('pw:language',()=>{refresh();window.ScrollTrigger?.refresh();});
document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;resetPointer();}else{lastTime=0;schedule();}});
window.addEventListener('load',()=>{refresh();window.ScrollTrigger?.refresh();},{once:true});
if('ResizeObserver' in window)new ResizeObserver(queueMeasure).observe(document.body);
navigator.connection?.addEventListener?.('change',refresh);
qa('.story-copy h2,.story-copy>p,.story-principles,.contact-inner h2,.contact-inner>p').forEach(el=>el.classList.add('cinema-reveal'));
window.PWExperience={refresh,measure,profile:()=>({...profile}),navigateService:goService,getState:()=>({scene:currentScene,service:active,pinned:!!deckTL,paused})};
updateServiceControls();refresh();
})();
