/* Simulated DOM checks, not a browser layout or GPU test. Requires jsdom 26. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const vm=require('node:vm');const {JSDOM}=require('jsdom');const base=path.resolve(__dirname,'..');
function setup({reduced=false,width=1440,saveData=false,fine=true}={}){
 const dom=new JSDOM(fs.readFileSync(path.join(base,'index.html'),'utf8'),{url:'https://example.test/',runScripts:'outside-only',pretendToBeVisual:true});
 const w=dom.window,errors=[],media=new Map(),frames=new Map();let frameId=0;
 w.innerWidth=width;w.innerHeight=900;let scrollRequest=null;w.scrollTo=opts=>{scrollRequest=opts};
 w.requestAnimationFrame=fn=>{frames.set(++frameId,fn);return frameId};w.cancelAnimationFrame=id=>frames.delete(id);
 w.matchMedia=q=>{if(!media.has(q)){const m=new w.EventTarget();Object.assign(m,{matches:q.includes('reduced')?reduced:q.includes('pointer')||q.includes('hover')?fine:false,media:q,addListener(fn){this.addEventListener('change',fn)},removeListener(fn){this.removeEventListener('change',fn)}});media.set(q,m)}return media.get(q)};
 Object.defineProperty(w.navigator,'connection',{value:{saveData,addEventListener(){}}});
 Object.defineProperty(w.navigator,'hardwareConcurrency',{value:8});
 w.HTMLElement.prototype.scrollIntoView=function(){};
 w.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','')};
 w.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');this.dispatchEvent(new w.Event('close'))};
 w.HTMLCanvasElement.prototype.getContext=function(){return null};
 const tops={home:0,services:900,process:1800,about:2700,contact:3500};Object.defineProperty(w.HTMLElement.prototype,'offsetHeight',{get(){return tops[this.id]!==undefined?900:600}});
 Object.defineProperty(w.document.documentElement,'scrollHeight',{get:()=>14000});
 w.HTMLElement.prototype.getBoundingClientRect=function(){const section=this.closest('section');const top=(tops[this.id]??tops[section?.id]??0)-w.scrollY;return {x:0,y:top,top,left:0,right:width,bottom:top+900,width,height:900}};
 w.addEventListener('error',e=>errors.push(e.error||e.message));
 const load=f=>vm.runInContext(fs.readFileSync(path.join(base,f),'utf8'),dom.getInternalVMContext(),{filename:f});
 let time=100;const frame=()=>{time+=34;const list=[...frames.values()];frames.clear();list.forEach(fn=>fn(time));};
 return {dom,w,load,errors,media,frame,scrollRequest:()=>scrollRequest,setY:y=>{w.scrollY=y;w.dispatchEvent(new w.Event('scroll'))},close:()=>dom.window.close()};
}

function content(e,{vendors=false,mockGPU=false}={}){
 ['motion-core.js','site-content.js','script.js'].forEach(e.load);
 if(vendors){['vendor/gsap.min.js','vendor/ScrollTrigger.min.js','vendor/three.min.js'].forEach(e.load);if(mockGPU)e.w.THREE.WebGLRenderer=class{setClearColor(){}setPixelRatio(){}setSize(){}dispose(){}render(scene,camera){e.rendered={scene,camera}}};}
 ['world-engine.js','experience.js'].forEach(e.load);
}
test('Only client-facing sections remain, with five unique services and complete English/Arabic',()=>{
 const e=setup();content(e);const d=e.w.document;
 assert.deepEqual([...d.querySelectorAll('main>section')].map(s=>s.id),['home','services','process','about','contact']);
 assert.equal(d.querySelectorAll('.service-panel').length,5);assert.equal(d.querySelectorAll('#service-grid').length,1);
 assert.doesNotMatch(d.querySelector('main').textContent,/NEXT WORLDS|PLANNED EXPANSION|COMPANY PROFILE|roadmap|SaaS|ERP|GalleryGrid|Everything you need|Turning ideas|COURSES PLANNED|Ten perspectives/i);
 for(const el of d.querySelectorAll('[data-i]'))assert.ok(e.w.PWContent.arabic[el.dataset.i],el.dataset.i);
 for(let i=0;i<5;i++){d.querySelector(`[data-service="${i}"]`).click();assert.equal(d.querySelector('#detail-dialog').open,true);d.querySelector('#detail-inquiry').click();assert.equal(d.querySelector('#service-select').value,String(i));d.querySelector('#inquiry-dialog').close();}
 d.querySelector('#language').click();assert.equal(d.documentElement.dir,'rtl');assert.match(d.querySelector('#services').textContent,/قائمة أفضل/);assert.doesNotMatch(d.querySelector('main').textContent,/undefined/);
 d.querySelector('#language').click();assert.equal(d.documentElement.dir,'ltr');assert.match(d.querySelector('#services').textContent,/Choose your next world/);assert.deepEqual(e.errors,[]);e.close();
});
test('Mobile navigation, service inquiry, brief editing and privacy dialog work',()=>{
 const e=setup({width:390,fine:false});content(e);const d=e.w.document;
 d.querySelector('#menu-toggle').click();assert.equal(d.querySelector('#menu-toggle').getAttribute('aria-expanded'),'true');d.querySelector('#navigation a').click();assert.equal(d.querySelector('#menu-toggle').getAttribute('aria-expanded'),'false');
 d.querySelector('[data-service="3"]').click();d.querySelector('#detail-inquiry').click();d.querySelector('[name=name]').value='Test client';d.querySelector('[name=idea]').value='A bilingual restaurant menu';d.querySelector('#inquiry-form').dispatchEvent(new e.w.Event('submit',{bubbles:true,cancelable:true}));assert.match(d.querySelector('#brief-text').value,/Digital & NFC menus/);assert.equal(d.querySelector('#brief-result').hidden,false);d.querySelector('#edit-brief').click();assert.equal(d.querySelector('#inquiry-form').hidden,false);d.querySelector('#inquiry-dialog').close();
 d.querySelector('[data-legal]').click();assert.equal(d.querySelector('#detail-inquiry').hidden,true);assert.match(d.querySelector('#detail-copy').textContent,/not submitted/);assert.deepEqual(e.errors,[]);e.close();
});
test('Visible cursor follows the pointer, reacts on links, and stops for touch/reduced motion',()=>{
 const e=setup();content(e);const d=e.w.document;
 const move=new e.w.MouseEvent('pointermove',{bubbles:true,clientX:310,clientY:250});Object.defineProperty(move,'pointerType',{value:'mouse'});d.querySelector('.button').dispatchEvent(move);e.frame();
 assert.ok(d.documentElement.classList.contains('pointer-visible'));assert.ok(d.documentElement.classList.contains('cursor-hover'));assert.match(d.querySelector('.cursor-dot').style.transform,/310px,250px/);assert.ok(d.querySelector('.cursor-ring').style.transform);
 d.querySelector('#motion-toggle').click();e.frame();assert.equal(d.documentElement.dataset.motion,'paused');assert.equal(e.w.PWExperience.profile().continuous,false);assert.equal(d.documentElement.classList.contains('pointer-visible'),false);
 d.querySelector('#motion-toggle').click();const m=e.media.get('(prefers-reduced-motion: reduce)');m.matches=true;m.dispatchEvent(new e.w.Event('change'));e.frame();assert.equal(e.w.PWExperience.profile().animate,false);
 assert.deepEqual(e.errors,[]);e.close();
 const touch=setup({width:390,fine:false});content(touch);touch.w.document.dispatchEvent(new touch.w.MouseEvent('pointermove',{bubbles:true,clientX:50,clientY:70}));touch.frame();assert.equal(touch.w.document.documentElement.classList.contains('pointer-visible'),false);touch.close();
});
test('Bundled GSAP creates two scrubbed scenes, navigation stays reachable, and pause removes pins',()=>{
 const e=setup();content(e,{vendors:true,mockGPU:true});e.frame();const d=e.w.document,st=e.w.ScrollTrigger;
 assert.equal(st.getAll().length,2);assert.equal(e.w.PWExperience.getState().pinned,true);
 st.getById('pw-services').animation.progress(.5);e.frame();assert.equal(d.querySelector('#service-position').textContent,'03 / 05');assert.equal(d.querySelector('[data-panel="0"]').inert,true);assert.equal(d.querySelector('[data-panel="2"]').inert,false);assert.equal(d.querySelector('.service-track').style.getPropertyValue('--deck-x'),'-2880.00px');
 d.querySelector('#service-next').click();assert.equal(typeof e.scrollRequest().top,'number');
 d.querySelector('#motion-toggle').click();e.frame();assert.equal(st.getAll().length,0);assert.ok([...d.querySelectorAll('.service-panel')].every(p=>!p.inert&&!p.hasAttribute('aria-hidden')));
 d.querySelector('#motion-toggle').click();assert.equal(st.getAll().length,2);
 d.querySelector('#language').click();e.frame();assert.equal(d.documentElement.dir,'rtl');assert.deepEqual(e.errors,[]);e.w.gsap.ticker.sleep();e.close();
});
test('Three geometry separates and reassembles; contact camera passes through the portal (mock GPU)',()=>{
 const e=setup();['motion-core.js','vendor/three.min.js'].forEach(e.load);let rendered;
 e.w.THREE.WebGLRenderer=class{setClearColor(){}setPixelRatio(){}setSize(){}dispose(){}render(scene,camera){rendered={scene,camera}}};e.load('world-engine.js');const world=e.w.createPWWorld();world.configure(e.w.PWMotion.quality(),false);let time=0;
 function render(id,p){for(let i=0;i<80;i++)world.update(id,p,{x:0,y:0},time+=34,false);}
 render('process',0);let assembly=rendered.scene.getObjectByName('assembly');assert.equal(assembly.children.length,62);assert.ok(assembly.children[2].position.length()<1.6);
 render('process',.5);assert.ok(assembly.children[2].position.length()>2.7);render('process',1);assert.ok(assembly.children[2].position.length()<1.6);
 for(const item of assembly.children)assert.ok([...item.geometry.attributes.position.array].every(Number.isFinite));
 render('contact',0);assert.ok(rendered.camera.position.z>11);render('contact',1);assert.ok(rendered.camera.position.z<2.1);assert.equal(rendered.scene.getObjectByName('portal').visible,true);
 const event=new e.w.Event('webglcontextlost',{cancelable:true});e.w.document.querySelector('canvas').dispatchEvent(event);assert.equal(world.available(),false);world.destroy();assert.deepEqual(e.errors,[]);e.close();
});
test('Missing optional libraries, unavailable GPU and data saving retain the static site',()=>{
 const e=setup();content(e);e.frame();assert.equal(e.w.PWExperience.getState().pinned,false);assert.equal(e.w.document.documentElement.classList.contains('engine-webgl'),false);assert.deepEqual(e.errors,[]);e.close();
 const save=setup({saveData:true});content(save,{vendors:true,mockGPU:true});save.frame();assert.equal(save.w.PWExperience.getState().pinned,false);assert.equal(save.rendered,undefined);assert.deepEqual(save.errors,[]);save.w.gsap.ticker.sleep();save.close();
 const fail=setup();['motion-core.js','site-content.js','script.js','vendor/gsap.min.js','vendor/ScrollTrigger.min.js'].forEach(fail.load);fail.w.THREE={WebGLRenderer:class{constructor(){throw Error('No GPU')}}};['world-engine.js','experience.js'].forEach(fail.load);fail.frame();assert.equal(fail.w.document.documentElement.classList.contains('engine-webgl'),false);assert.equal(fail.w.document.querySelectorAll('.service-panel').length,5);assert.deepEqual(fail.errors,[]);fail.w.gsap.ticker.sleep();fail.close();
});
test('Page IDs, section links, scripts and local assets resolve',()=>{
 const e=setup();content(e);const d=e.w.document,ids=[...d.querySelectorAll('[id]')].map(el=>el.id);assert.equal(new Set(ids).size,ids.length);
 for(const el of d.querySelectorAll('[src],link[href],a[href]')){const v=el.getAttribute('src')||el.getAttribute('href');if(!v||/^https?:|^data:/.test(v))continue;if(v.startsWith('#'))assert.ok(d.querySelector(v),v);else assert.ok(fs.existsSync(path.join(base,v)),v);}
 assert.equal(d.querySelectorAll('script[src*="campaign"]').length,0);assert.deepEqual(e.errors,[]);e.close();
});
