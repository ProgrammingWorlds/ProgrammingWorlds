'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const M=require('../motion-core.js');
const loader=fs.readFileSync(require.resolve('../loader.js'),'utf8');
const flush=async()=>{for(let i=0;i<5;i++)await Promise.resolve()};
function boot(options={}){
 let now=0,nextId=1,removed=0,writes=0;const timers=new Map(),root={dataset:{}},node={remove(){removed++}};
 const document=new EventTarget();document.documentElement=root;document.getElementById=()=>node;
 const window=new EventTarget();window.PWMotion=M;
 const media=new EventTarget();media.matches=!!options.reduced;
 const images=(options.images||[]).map(config=>Object.assign(new EventTarget(),config));
 document.querySelectorAll=()=>images;
 const storage=new Map(options.seen?[['pw-entered-v2','1']]:[]);
 const env={document,window,matchMedia:()=>media,performance:{now:()=>now,getEntriesByType:()=>[{type:options.navigation||'navigate'}]},navigator:{connection:{saveData:!!options.saveData}},location:{hash:options.hash||''},sessionStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>{writes++;storage.set(k,v)}},setTimeout:(fn,ms)=>{const id=nextId++;timers.set(id,{fn,at:now+ms});return id},clearTimeout:id=>timers.delete(id),Promise};
 vm.runInNewContext(loader,env);
 function advance(ms){const end=now+ms;while(true){const due=[...timers].filter(([,t])=>t.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];if(!due)break;now=due[1].at;timers.delete(due[0]);due[1].fn()}now=end}
 return {root,images,window,media,advance,ready:()=>document.dispatchEvent(new Event('DOMContentLoaded')),key:()=>document.dispatchEvent(new Event('keydown')),get removed(){return removed},get writes(){return writes},get timers(){return timers.size}};
}
test('Computed logo bounds remain square and inside phone/tablet/desktop hero sizes',()=>{
 for(const [width,height] of [[320,910],[360,910],[390,910],[600,910],[768,790],[1000,790],[1280,820],[1440,900],[1920,1080]])for(const rtl of [false,true]){
  const b=M.logoBounds(width,height,rtl);assert.ok(Math.abs((b.right-b.left)-(b.bottom-b.top))<1e-8);assert.ok(b.left>=0&&b.right<=width);assert.ok(b.top>=74&&b.bottom+50<height-80);
 }
});
test('Scroll transforms remain bounded during elastic overscroll',()=>{for(const s of [-500,0,100,800,5000]){const f=M.heroFrame(s,800,false,false);assert.ok(f.logoScale>=.92&&f.logoScale<=1);assert.ok(f.logoY>=-48&&f.logoY<=0);assert.ok(f.backgroundY>=0&&f.backgroundY<=80)}});
test('Reduced motion produces no scene movement',()=>{const f=M.heroFrame(500,800,false,true);assert.deepEqual([f.backgroundY,f.backgroundScale,f.logoY,f.logoScale,f.logoRotation,f.textY],[0,1,0,1,0,0]);assert.equal(M.quality({reduced:true}).particles,0)});
test('Mobile, memory-constrained, low-core and data-saving profiles disable continuous rendering',()=>{for(const args of [{width:390},{memory:2},{cores:2},{saveData:true}]){const q=M.quality(args);assert.equal(q.continuous,false);assert.equal(q.dpr,1);assert.equal(q.particles,18)}});
test('Full profile caps pixel ratio and particle count',()=>{const q=M.quality({width:1440});assert.equal(q.dpr,1.5);assert.equal(q.particles,48);assert.equal(q.continuous,true)});
for(const [label,option] of [['return visit',{seen:true}],['reduced motion',{reduced:true}],['data saver',{saveData:true}],['deep link',{hash:'#services'}],['back-forward cache',{navigation:'back_forward'}]])test('Loader skips '+label,()=>{const b=boot(option);assert.equal(b.window.PWBoot.active,false);assert.equal(b.root.dataset.boot,undefined);assert.equal(b.timers,0)});
test('Loader releases promptly on cached assets without a flash',async()=>{const b=boot({images:[{complete:true,decode:()=>Promise.resolve()}]});assert.equal(b.root.dataset.boot,'pending');b.ready();await flush();assert.equal(b.window.PWBoot.active,false);assert.equal(b.root.dataset.boot,undefined);assert.equal(b.writes,1)});
test('Loader waits only for critical image readiness and then fades',async()=>{const b=boot({images:[{complete:false},{complete:false}]});b.ready();b.advance(350);b.images[0].dispatchEvent(new Event('load'));await flush();assert.equal(b.window.PWBoot.active,true);b.images[1].dispatchEvent(new Event('load'));await flush();assert.equal(b.root.dataset.boot,'complete');b.advance(420);assert.equal(b.root.dataset.boot,undefined);assert.ok(b.removed>0)});
test('Image failure releases the loader',async()=>{const b=boot({images:[{complete:false}]});b.ready();b.advance(200);b.images[0].dispatchEvent(new Event('error'));await flush();assert.equal(b.window.PWBoot.active,false)});
test('Decode rejection does not trap the loader',async()=>{const b=boot({images:[{complete:true,decode:()=>Promise.reject(new Error('decode failure'))}]});b.ready();await flush();assert.equal(b.window.PWBoot.active,false)});
test('Loader has an 1800ms hard ceiling even if main JS and image requests stall',()=>{const b=boot({images:[{complete:false}]});b.advance(1799);assert.equal(b.window.PWBoot.active,true);b.advance(1);assert.equal(b.window.PWBoot.active,false);b.advance(420);assert.equal(b.root.dataset.boot,undefined)});
test('Keyboard interaction dismisses loading and finish is idempotent',()=>{const b=boot();b.advance(200);b.key();b.window.PWBoot.finish();b.window.PWBoot.finish();assert.equal(b.writes,1);assert.equal(b.window.PWBoot.active,false)});
test('Switching reduced motion on immediately releases a running loader',()=>{const b=boot();b.media.matches=true;const event=new Event('change');event.matches=true;b.media.dispatchEvent(event);assert.equal(b.window.PWBoot.active,false)});
test('3D assembly separates at the midpoint and reassembles at both ends with a bounded camera',()=>{
 assert.equal(M.worldFrame(0).explode,0);assert.ok(M.worldFrame(1).explode<1e-10);assert.equal(M.worldFrame(.5).explode,1);
 for(let i=-20;i<120;i++){const f=M.worldFrame(i/100);assert.ok(f.cameraZ>=8&&f.cameraZ<=16);assert.ok(f.explode>=0&&f.explode<=1);assert.ok(Object.values(f).every(Number.isFinite));}
 assert.deepEqual(M.worldFrame(.1,true),M.worldFrame(.9,true));
});

test('Every page scene has finite camera targets and the final camera crosses portal depth',()=>{
 for(const id of ['home','services','process','about','contact'])for(const p of [-1,0,.25,.5,.75,1,2])assert.ok(Object.values(M.sceneFrame(id,p)).every(Number.isFinite));
 assert.ok(M.sceneFrame('contact',0).cameraZ>9);assert.ok(M.sceneFrame('contact',1).cameraZ<4);
 assert.equal(M.sceneFrame('services',.5).portal,0);assert.equal(M.sceneFrame('contact',.5).portal,1);
});
