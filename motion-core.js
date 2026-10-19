/* Small, deterministic motion helpers shared by the experience and its tests. */
(function(root){
'use strict';
const clamp=(n,min=0,max=1)=>Math.min(max,Math.max(min,Number.isFinite(n)?n:min));
const progress=(top,height,viewport)=>clamp((viewport-top)/(viewport+Math.max(1,height)));
function heroFrame(scroll,height,compact,reduced){
 const p=clamp(scroll/Math.max(height,1));
 if(reduced)return {p,backgroundY:0,backgroundScale:1,logoY:0,logoScale:1,logoRotation:0,textY:0};
 const factor=compact?.4:1;
 return {p,backgroundY:p*80*factor,backgroundScale:1+p*.055*factor,logoY:p*-48*factor,logoScale:1-p*.08*factor,logoRotation:p*-7*factor,textY:p*-22*factor};
}
function quality({reduced=false,saveData=false,memory=8,cores=8,width=1440}={}){
 const lite=saveData||memory<=4||cores<=4||width<700;
 return {lite,animate:!reduced,continuous:!reduced&&!lite,particles:reduced?0:lite?18:48,dpr:lite?1:1.5,interval:lite?50:32};
}
function logoBounds(width,height,rtl=false){
 const mobile=width<=600,tablet=width<=1000;
 const size=mobile?clamp(width*.43,144,194):tablet?clamp(width*.25,180,250):clamp(width*.225,230,330);
 const centerX=mobile?width*.5:width*(rtl?.255:.745);
 const centerY=height*(mobile?.665:tablet?.49:.455);
 return {size,left:centerX-size/2,right:centerX+size/2,top:centerY-size/2,bottom:centerY+size/2};
}
function shouldShowLoader({seen=false,reduced=false,saveData=false,hash='',navigation='navigate'}={}){
 return !seen&&!reduced&&!saveData&&!hash&&navigation!=='back_forward';
}
function worldFrame(progress,reduced=false){
 const p=clamp(progress),explode=reduced?0:Math.pow(Math.sin(Math.PI*p),2);
 const stops=[[0,11],[.18,8],[.5,16],[.82,8],[1,11]];
 let cameraZ=11;
 for(let i=1;i<stops.length;i++)if(p<=stops[i][0]){const a=stops[i-1],b=stops[i],u=clamp((p-a[0])/(b[0]-a[0])),ease=u*u*(3-2*u);cameraZ=a[1]+(b[1]-a[1])*ease;break;}
 return {explode,rx:reduced?-.25:-.25+p*.9,ry:reduced?.45:.45+p*Math.PI*1.65,rz:reduced?0:Math.sin(p*Math.PI)*.22,cameraX:reduced?0:Math.sin(p*Math.PI*2)*1.1,cameraZ:reduced?11:cameraZ};
}
function sceneFrame(id,progress=0){
 const p=clamp(progress),wave=Math.sin(Math.PI*p);
 const base={cameraZ:11,anchor:.48,explode:0,turn:p*1.4,tilt:-.15,scale:1,portal:0,opacity:.65};
 if(id==='home')return {...base,cameraZ:11-p*2,turn:p*2.3,scale:1.12,opacity:.55};
 if(id==='services')return {...base,cameraZ:12+wave,explode:.35+wave*.2,turn:2+p*4,scale:.85,opacity:.32};
 if(id==='process'){const w=worldFrame(p);return {...base,cameraZ:w.cameraZ,explode:w.explode,turn:3+p*Math.PI*2,tilt:w.rx,opacity:.9};}
 if(id==='about')return {...base,anchor:-.48,cameraZ:11.5,explode:.08,turn:5+p*2,scale:1.05,opacity:.44};
 if(id==='contact')return {...base,anchor:0,cameraZ:12-p*10,explode:0,turn:8,portal:1,opacity:.5};
 return {...base,opacity:0};
}
const api=Object.freeze({sceneFrame,worldFrame,clamp,progress,heroFrame,quality,logoBounds,shouldShowLoader});
if(typeof module==='object'&&module.exports)module.exports=api;else root.PWMotion=api;
})(typeof window==='object'?window:globalThis);
