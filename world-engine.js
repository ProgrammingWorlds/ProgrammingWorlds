/* One persistent WebGL world; the experience controller owns timing and scroll. */
(function(){
'use strict';
window.createPWWorld=function(){
 const canvas=document.querySelector('#world-canvas'),root=document.documentElement,T=window.THREE,M=window.PWMotion;
 let renderer=null,scene,camera,assembly,core,wire,orbits,portal,stars,keyLight,failed=false,disposed=false,lastTime=0;
 const parts=[],geometries=[],materials=[];let quality='';
 const pose={cameraZ:11,anchor:.48,explode:0,turn:0,tilt:-.15,scale:1,portal:0,opacity:.6};
 function geometry(g){geometries.push(g);return g}function material(m){materials.push(m);return m}
 function init(){
  if(renderer||failed||!T)return;
  try{
   renderer=new T.WebGLRenderer({canvas,alpha:true,antialias:false,powerPreference:'low-power'});renderer.setClearColor(0x030610,0);renderer.outputColorSpace=T.SRGBColorSpace;
   scene=new T.Scene();scene.fog=new T.FogExp2(0x030610,.026);camera=new T.PerspectiveCamera(43,1,.1,90);
   scene.add(new T.AmbientLight(0x667be2,1.7));keyLight=new T.PointLight(0x5ff0ff,85,35,2);keyLight.position.set(3,4,6);scene.add(keyLight);
   const rim=new T.PointLight(0xd04fff,110,35,2);rim.position.set(-4,-2,3);scene.add(rim);
   assembly=new T.Group();assembly.name='assembly';scene.add(assembly);
   core=new T.Mesh(geometry(new T.IcosahedronGeometry(1.12,2)),material(new T.MeshStandardMaterial({color:0x101b39,metalness:.87,roughness:.26,emissive:0x17326c,emissiveIntensity:.28,flatShading:true})));assembly.add(core);
   wire=new T.Mesh(geometry(new T.IcosahedronGeometry(1.15,1)),material(new T.MeshBasicMaterial({color:0x4edbff,wireframe:true,transparent:true,opacity:.3})));assembly.add(wire);
   const piece=geometry(new T.BoxGeometry(.19,.43,.13));const colors=[0x56ddec,0x438cf0,0x9360ed];
   const shardMaterials=colors.map(color=>material(new T.MeshStandardMaterial({color,metalness:.68,roughness:.25,emissive:color,emissiveIntensity:.23})));
   for(let i=0;i<60;i++){
    const y=1-2*(i+.5)/60,r=Math.sqrt(1-y*y),angle=i*2.399963;
    const home=new T.Vector3(Math.cos(angle)*r,y,Math.sin(angle)*r).multiplyScalar(1.48);
    const direction=home.clone().normalize().multiplyScalar(1.4+(i%7)*.17);
    const mesh=new T.Mesh(piece,shardMaterials[i%3]);mesh.position.copy(home);mesh.lookAt(home.clone().multiplyScalar(2));assembly.add(mesh);parts.push({mesh,home,direction,baseRotation:mesh.rotation.clone(),i});
   }
   orbits=new T.Group();orbits.name='orbits';scene.add(orbits);
   const torus=geometry(new T.TorusGeometry(2.13,.009,5,128));
   for(let i=0;i<3;i++){const ring=new T.Mesh(torus,material(new T.MeshBasicMaterial({color:i%2?0xb77bff:0x6deeff,transparent:true,opacity:.5-i*.08})));ring.rotation.set(.5+i*.7,.25+i*.6,-.35+i*.3);ring.scale.setScalar(1+i*.23);orbits.add(ring);}
   portal=new T.Group();portal.name='portal';scene.add(portal);
   const arch=geometry(new T.TorusGeometry(3.4,.022,5,120));
   for(let i=0;i<7;i++){const ring=new T.Mesh(arch,material(new T.MeshBasicMaterial({color:i%2?0xa669ff:0x4fe4fa,transparent:true,opacity:.18})));ring.position.z=9-i*4;ring.rotation.z=i*.15;portal.add(ring);}
   const positions=new Float32Array(320*3);
   for(let i=0;i<320;i++){const a=i*2.399963;positions[i*3]=Math.cos(a)*(2+i%31*.65);positions[i*3+1]=Math.sin(a)*(2+i%23*.5);positions[i*3+2]=14-(i%43)*1.1;}
   const starGeo=geometry(new T.BufferGeometry());starGeo.setAttribute('position',new T.BufferAttribute(positions,3));stars=new T.Points(starGeo,material(new T.PointsMaterial({size:.025,color:0x8dbbff,transparent:true,opacity:.75,sizeAttenuation:true})));scene.add(stars);
   root.classList.add('engine-webgl');measure();
  }catch{failed=true;release();}
 }
 function release(){renderer?.dispose();renderer=null;geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());geometries.length=materials.length=parts.length=0;root.classList.remove('engine-webgl');}
 function measure(){if(renderer){renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/Math.max(1,innerHeight);camera.updateProjectionMatrix();}}
 function configure(profile,calm){
  if(calm||navigator.connection?.saveData){canvas.style.visibility='hidden';root.classList.remove('engine-webgl');return;}
  canvas.style.visibility='visible';init();if(renderer)root.classList.add('engine-webgl');const mode=profile.lite?'lite':'full';
  if(renderer&&mode!==quality){quality=mode;renderer.setPixelRatio(Math.min(devicePixelRatio||1,profile.lite?1:1.5));measure();}
 }
 function update(id,p,pointer,now,calm){
  if(disposed||!renderer||calm||navigator.connection?.saveData)return false;
  const target=M.sceneFrame(id,p),dt=Math.min(.08,Math.max(.001,(now-lastTime)/1000||.016));lastTime=now;
  const k=1-Math.exp(-dt*7);Object.keys(pose).forEach(key=>pose[key]+=(target[key]-pose[key])*k);
  const rtl=root.dir==='rtl'?-1:1,compact=innerWidth<701;
  const x=compact?0:pose.anchor*rtl*pose.cameraZ*Math.tan(43*Math.PI/360)*camera.aspect;
  const idle=Math.sin(now*.00035)*.035;
  assembly.position.set(x,compact?1.25:0,0);assembly.scale.setScalar(compact?.7:pose.scale);assembly.rotation.set(pose.tilt-pointer.y*.18,pose.turn+pointer.x*.35+idle,Math.sin(pose.turn*.4)*.12);
  parts.forEach(({mesh,home,direction,baseRotation,i})=>{mesh.position.copy(home).addScaledVector(direction,pose.explode);mesh.rotation.set(baseRotation.x+pose.explode*.8*(i%2?1:-1),baseRotation.y+pose.explode*.7,baseRotation.z+pose.explode*.3);});
  core.scale.setScalar(Math.max(.3,1-pose.explode*.45));wire.rotation.y=-pose.turn*.5;wire.scale.setScalar(1+pose.explode*.15);
  assembly.visible=pose.portal<.8;orbits.visible=pose.portal<.9;orbits.position.copy(assembly.position);orbits.rotation.set(.2+pointer.y*.15,pose.turn*.15+pointer.x*.15,pose.turn*.1);orbits.scale.setScalar((compact?.7:1)*(1+pose.explode*.35));
  portal.visible=pose.portal>.01;portal.rotation.z=pointer.x*.08;portal.children.forEach((ring,i)=>ring.material.opacity=pose.portal*(.13+i*.005));
  camera.position.set(pointer.x*.75,pointer.y*-.45,pose.cameraZ);camera.lookAt(0,0,0);keyLight.position.set(x+3+pointer.x*4,4-pointer.y*3,6);
  stars.rotation.set(pointer.y*.02,pointer.x*.02,pose.turn*.025);root.style.setProperty('--cosmos-opacity',String(compact?.28:pose.opacity));
  try{renderer.render(scene,camera)}catch{failed=true;release();}return !!renderer;
 }
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();failed=true;release();});
 canvas.addEventListener('webglcontextrestored',()=>{failed=false;quality='';window.PWExperience?.refresh();});
 return {configure,measure,update,available:()=>!!renderer,destroy(){disposed=true;release();}};
};
})();
