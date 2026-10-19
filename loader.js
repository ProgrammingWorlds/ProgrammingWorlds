/* Runs in the head before first paint. Never waits for noncritical content. */
(function(){
'use strict';
const root=document.documentElement;
let seen=false;
try{seen=sessionStorage.getItem('pw-entered-v2')==='1'}catch{}
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const nav=performance.getEntriesByType('navigation')[0]?.type||'navigate';
const show=window.PWMotion.shouldShowLoader({seen,reduced:reduced.matches,saveData:!!navigator.connection?.saveData,hash:location.hash,navigation:nav});
const began=performance.now();
let settled=false,timer=0,cleanupTimer=0;
function finish(){
 if(settled)return;settled=true;clearTimeout(timer);
 if(performance.now()-began<150){delete root.dataset.boot;document.getElementById('site-loader')?.remove()}else root.dataset.boot='complete';
 try{sessionStorage.setItem('pw-entered-v2','1')}catch{}
 const cleanup=()=>{delete root.dataset.boot;document.getElementById('site-loader')?.remove()};
 cleanupTimer=setTimeout(cleanup,reduced.matches?0:420);
 document.removeEventListener('keydown',finish);document.removeEventListener('pointerdown',finish);
}
window.PWBoot={finish,get active(){return show&&!settled}};
if(!show){settled=true;return}
root.dataset.boot='pending';
// Hard escape hatch also works when the main scripts or an image fail.
timer=setTimeout(finish,1800);
document.addEventListener('keydown',finish,{once:true});document.addEventListener('pointerdown',finish,{once:true});
window.addEventListener('pageshow',event=>{if(event.persisted)finish()});
reduced.addEventListener('change',event=>{if(event.matches)finish()});
document.addEventListener('DOMContentLoaded',()=>{
 if(settled)return;
 const images=[...document.querySelectorAll('.hero-background,.hero-logo')];
 const ready=images.map(image=>{
  if(image.complete)return typeof image.decode==='function'?image.decode().catch(()=>{}):Promise.resolve();
  return new Promise(resolve=>{image.addEventListener('load',resolve,{once:true});image.addEventListener('error',resolve,{once:true})});
 });
 Promise.allSettled(ready).then(finish);
},{once:true});
})();
