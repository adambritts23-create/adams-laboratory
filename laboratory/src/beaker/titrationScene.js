import {amountLabel,partitionLabel} from './sampleInventory.js';
import * as T from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { apparatusSelection } from './apparatusSelection.js';
export function createTitrationScene(host,{capacityMl=50,vesselCapacityMl=500,onSelect,modelOnly=false}={}){
const scene=new T.Scene();scene.background=new T.Color('#102029');
const camera=new T.PerspectiveCamera(34,1,.0001,10);
const renderer=modelOnly?{domElement:document.createElement('canvas'),setSize(){},dispose(){}}:new T.WebGLRenderer({antialias:true});host.append(renderer.domElement);
let pm=null,environment=null;
if(!modelOnly){renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;pm=new T.PMREMGenerator(renderer);const room=new RoomEnvironment();environment=pm.fromScene(room,.04);scene.environment=environment.texture;room.dispose();}
const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(-.015,.285,0);camera.position.set(.48,.40,.88);controls.update();
controls.enableDamping=true;controls.dampingFactor=.12;controls.zoomToCursor=true;
controls.screenSpacePanning=true;controls.minDistance=.008;controls.maxDistance=2.5;
controls.rotateSpeed=.65;controls.zoomSpeed=.7;controls.panSpeed=.8;
const model=new T.Group();model.name='Wet_lab_titration_setup';scene.add(model);
const material=(c,m=0,r=.4)=>new T.MeshStandardMaterial({color:c,metalness:m,roughness:r});
const chrome=material('#aab5bc',.93,.22),black=material('#27363b',.65,.35),blue=material('#176799',.1,.28),ceramic=material('#ecece6',.05,.25),rubber=material('#1b2528'),ink=material('#b6cbc9');
const glass=new T.MeshPhysicalMaterial({color:'#f0faf7',transmission:1,thickness:.0016,ior:1.47,roughness:.025,metalness:0,transparent:true,opacity:1,envMapIntensity:.6,side:T.DoubleSide,depthWrite:false});
const liquidMat=new T.MeshPhysicalMaterial({color:'#8bc1c4',transparent:true,opacity:.22,roughness:.13,metalness:0,ior:1.333,envMapIntensity:.35,side:T.DoubleSide,depthWrite:false});
let component='Stand';
function mesh(geo,mat,p,parent=model){const o=new T.Mesh(geo,mat);o.position.set(...p);o.castShadow=!mat.transparent;o.receiveShadow=!mat.transparent;o.userData.apparatus=component;parent.add(o);return o}
function cyl(r,h,mat,p,rt=r){return mesh(new T.CylinderGeometry(rt,r,h,64),mat,p)}
function box(w,h,d,mat,p){return mesh(new RoundedBoxGeometry(w,h,d,2,Math.min(w,h,d)*.12),mat,p)}
function tube(points,r,mat,parent=model){return mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),32,r,8,false),mat,[0,0,0],parent)}
function ring(r,y,x=0,z=0,th=.001,mat=glass){const o=mesh(new T.TorusGeometry(r,th,12,80),mat,[x,y,z]);o.rotation.x=Math.PI/2;return o}
function label(text,p,w=.06,h=.014,color='#bdd2cf',bg=null){const c=document.createElement('canvas');c.width=512;c.height=128;const ctx=c.getContext('2d');if(bg){ctx.fillStyle=bg;ctx.fillRect(0,0,512,128)}ctx.fillStyle=color;ctx.font='500 64px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,256,64);const tex=new T.CanvasTexture(c);const mat=new T.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false,side:T.DoubleSide});return mesh(new T.PlaneGeometry(w,h),mat,p)}
// Base, upright and adjustable twin clamp. Dimensions are metres.
box(.17,.012,.13,black,[-.079,.013,-.03]);for(const x of [-.14,-.02])for(const z of [-.075,.02])cyl(.009,.009,rubber,[x,.004,z]);
cyl(.0045,.57,chrome,[-.115,.299,-.028]);cyl(.009,.015,chrome,[-.115,.026,-.028]);
for(const y of [.35,.51]){box(.024,.025,.026,black,[-.115,y,-.028]);const arm=cyl(.004,.108,chrome,[-.061,y,-.028]);arm.rotation.z=Math.PI/2;box(.025,.023,.027,black,[-.012,y,-.028]);tube([[-.019,y,-.021],[-.014,y,.010],[0,y,.014],[.014,y,.008]],.0025,chrome);const knob=cyl(.009,.008,blue,[-.135,y,-.028]);knob.rotation.z=Math.PI/2;}
component='Burette';
// Calibrated burette: levels follow the loaded capacity; dimensions remain illustrative.
const columnHeight=.32,bore=.0071,bottom=.223,top=bottom+columnHeight;
mesh(new T.LatheGeometry([[bore,0],[bore+.0013,0],[bore+.0013,columnHeight+.01],[bore,columnHeight+.01],[bore,0]].map(p=>new T.Vector2(...p)),96),glass,[0,bottom-.005,0]);ring(bore+.002,top+.005,0,0,.0009);ring(bore+.002,bottom,0,0,.0006);
const titrant=cyl(bore,columnHeight,liquidMat,[0,bottom+columnHeight/2,0]);titrant.name='Burette_titrant';const buretteMeniscus=ring(bore-.0002,top,0,0,.00035,liquidMat);
for(let i=0;i<=100;i++){const y=top-i*columnHeight/100;box(i%10===0?.008:.004,.00045,.00035,ink,[.001,y,bore+.0024]);if(i%20===0)label(String(Number((i*capacityMl/100).toPrecision(4))),[.016,y,.001],.016,.007);}
label(capacityMl+' mL',[.020,top+.015,0],.037,.009);
// Inner rim and narrow highlights give the wider tube visible wall thickness.
const tubeEdge=new T.MeshPhysicalMaterial({color:'#daf7f4',transparent:true,opacity:.32,roughness:.07,metalness:.2,depthWrite:false});
ring(bore,top+.005,0,0,.0005,tubeEdge);
for(const a of [-1.0,1.05])tube([[Math.sin(a)*(bore+.002),bottom+.007,Math.cos(a)*(bore+.002)],[Math.sin(a)*(bore+.002),top-.008,Math.cos(a)*(bore+.002)]],.00023,tubeEdge);
cyl(.0038,.017,glass,[0,bottom-.007,0],bore+.002);
label('20 °C',[.022,top-.025,.002],.021,.005);

component='Stopcock';
const valve=cyl(.007,.028,ceramic,[0,.21,0]);valve.rotation.z=Math.PI/2;
const handle=cyl(.009,.006,blue,[.019,.21,0]);handle.rotation.z=Math.PI/2;const lever=box(.004,.035,.004,blue,[.023,.21,0]);
for(const x of [-.012,.012]){const collar=cyl(.0078,.002,ceramic,[x,.21,0]);collar.rotation.z=Math.PI/2;}
for(let i=0;i<18;i++){const a=i*Math.PI/9;box(.006,.0007,.0007,blue,[.019,.21+Math.sin(a)*.009,Math.cos(a)*.009]);}
component='Burette tip';
cyl(.0025,.040,glass,[0,.18,0],.0035);cyl(.0008,.007,glass,[0,.1565,0],.0025);
component='Stirrer';
// Charcoal stirrer with a dark plate, ventilation slots and inset display.
const darkPlate=material('#17282d',.32,.34),housing=material('#223740',.35,.42);
box(.125,.021,.122,housing,[0,.016,0]);box(.121,.009,.119,black,[0,.006,0]);box(.116,.004,.114,darkPlate,[0,.029,0]);
for(let i=0;i<10;i++)box(.0005,.002,.006,rubber,[.0628,.015,-.037+i*.007]);
for(const x of [-.05,.05])for(const z of [-.047,.047])cyl(.0018,.0004,chrome,[x,.0313,z]);
box(.050,.011,.001,rubber,[-.018,.016,.0615]);label('STIR',[-.018,.016,.0622],.028,.006,'#94efd7');const dial=cyl(.008,.006,black,[.037,.016,.064]);dial.rotation.x=Math.PI/2;
tube([[.037,.020,.0675],[.037,.023,.0675]],.0006,ink);
component='Beaker';
// Larger 500 mL beaker: rolled lip, thick heel and inner wall.
const R=.045,base=.037,H=.095;
const wallPoints=[[R-.002,0],[R,.001],[R+.0012,.003],[R+.0012,H-.004],[R+.002,H-.001],[R+.001,H],[R,H],[R-.0002,H-.003],[R-.0002,.003],[R-.002,.002]].map(p=>new T.Vector2(...p));
mesh(new T.LatheGeometry(wallPoints,128),glass,[0,base,0]);cyl(R-.001,.002,glass,[0,base+.001,0]);
const edgeGlass=glass.clone();edgeGlass.thickness=.002;edgeGlass.roughness=.05;
ring(R+.001,base+H,0,0,.0011,edgeGlass);ring(R-.0005,base+.002,0,0,.0007,edgeGlass);
tube([[-.040,base+H,.019],[-.055,base+H+.001,.011],[-.044,base+H,-.006]],.0012,edgeGlass);
// Marks follow the front glass surface rather than floating beside it.
for(let tick=1;tick<=20;tick++){const ml=tick*vesselCapacityMl/20,y=base+(ml/vesselCapacityMl)*.08;const pts=[];for(let j=0;j<=8;j++){const a=.16+j/8*(tick%4===0?.24:.12);pts.push([(R+.0015)*Math.sin(a),y,(R+.0015)*Math.cos(a)])}tube(pts,.00024,ink);if(tick%4===0){const a=.51;const l=label(String(ml),[(R+.002)*Math.sin(a),y,(R+.002)*Math.cos(a)],.018,.0065);l.rotation.y=a;}}
label(vesselCapacityMl+' mL',[-.014,base+.086,.044],.022,.006);

// Fine reflection streaks emphasize the curvature without whitening the liquid.
const glint=new T.MeshBasicMaterial({color:'#d5f1f3',transparent:true,opacity:.20,depthWrite:false});
for(const a of [-1.05,1.20])tube([[Math.sin(a)*(R+.0015),base+.008,Math.cos(a)*(R+.0015)],[Math.sin(a)*(R+.0015),base+.055,Math.cos(a)*(R+.0015)],[Math.sin(a)*(R+.0015),base+.082,Math.cos(a)*(R+.0015)]],.00032,glint);
const liquid=cyl(R,.01,liquidMat,[0,base+.005,0]);liquid.name='Sample_liquid_volume';
const meniscus=ring(R-.0004,base+.02,0,0,.0005,liquidMat);
component='Stirrer';
const stir=mesh(new T.CapsuleGeometry(.0025,.022,6,16),ceramic,[0,base+.004,0]);stir.rotation.z=Math.PI/2;stir.name='Magnetic_stir_bar';
// Generic combination pH-style electrode: glass shaft, reference core, junction and bulb.
component='Probe';
const probeStart=model.children.length,px=.023,pz=-.012;
const probeGlass=new T.MeshPhysicalMaterial({color:'#bddbba',transparent:true,opacity:.28,roughness:.07,depthWrite:false});
cyl(.0038,.113,probeGlass,[px,.107,pz]);cyl(.0014,.094,material('#7a8b80'),[px,.111,pz]);
cyl(.0045,.022,blue,[px,.176,pz]);cyl(.005,.006,rubber,[px,.162,pz]);cyl(.003,.009,rubber,[px,.191,pz]);
const bulb=mesh(new T.SphereGeometry(.0042,32,20),probeGlass,[px,.047,pz]);bulb.name='pH_sensing_bulb';
cyl(.0037,.0017,ceramic,[px,.055,pz]);
label('pH',[px,.174,pz+.0047],.008,.005);
// Holder supports the probe above the lip; cable returns to a generic meter.
tube([[-.115,.18,-.028],[-.08,.18,-.04],[px,.18,-.04],[px,.18,pz-.006]],.0023,chrome);
ring(.0051,.168,px,pz,.0012,black);
// Cable exits towards the external instrument; no duplicate meter or bottle.
tube([[px,.195,pz],[px+.012,.215,-.019],[.075,.19,-.065],[.10,.045,-.11],[.16,.0,-.12]],.0016,rubber);
const probeParts=model.children.slice(probeStart);for(const o of probeParts)o.userData.component='pH-style probe assembly';
component='';
const bench=box(.46,.014,.28,material('#30444a',.35,.24),[0,-.012,0]);bench.name='Bench';
scene.add(new T.HemisphereLight('#dceff4','#31423c',.8));const light=new T.DirectionalLight('#fff0d6',2.1);light.position.set(-1,2,2);light.castShadow=true;light.shadow.mapSize.set(2048,2048);Object.assign(light.shadow.camera,{left:-.35,right:.35,top:.6,bottom:-.2,near:.1,far:5});light.shadow.bias=-.00015;light.shadow.normalBias=.001;scene.add(light);const rim=new T.DirectionalLight('#b0dfe3',1.1);rim.position.set(1,1,-1);scene.add(rim);
// Fine grains share one instanced draw call. Quantity uses a fixed molar display
// scale; the surface is schematic, not a simulated crystal or measured packed bed.
const grainGeometry=new T.IcosahedronGeometry(1,1),grainMaterial=material('#ffffff',0,.94);
const grains=new T.InstancedMesh(grainGeometry,grainMaterial,1536);grains.name='Amount_scaled_solid_phases';
grains.setColorAt(0,new T.Color('#ffffff'));
grains.instanceMatrix.setUsage(T.DynamicDrawUsage);grains.count=0;grains.frustumCulled=false;grains.castShadow=true;grains.receiveShadow=true;model.add(grains);
const amountCanvas=document.createElement('canvas');amountCanvas.width=1024;amountCanvas.height=240;
const amountTexture=new T.CanvasTexture(amountCanvas);amountTexture.colorSpace=T.SRGBColorSpace;
const amountTag=mesh(new T.PlaneGeometry(.105,.024),new T.MeshBasicMaterial({map:amountTexture,transparent:true,depthWrite:false,side:T.DoubleSide}),[0,base+.066,R+.006]);amountTag.userData.apparatus='Beaker';
let amountText='';
const vesselParts=model.children.filter(o=>o.userData.apparatus==='Beaker'||o===grains);
// Delivery is visualized only from explicit accepted-dose events, never graph navigation.
const flowMaterial=new T.MeshPhysicalMaterial({color:'#b1e7eb',roughness:.08,metalness:.05,transparent:true,opacity:.72,envMapIntensity:.7});
const drops=Array.from({length:5},()=>{const d=mesh(new T.SphereGeometry(.0013,16,12),flowMaterial,[0,.153,0]);d.visible=false;return d});
const stream=cyl(.0007,1,flowMaterial,[0,0,0]);stream.visible=false;
const ripple=ring(.005,base,0,0,.0002,flowMaterial);ripple.visible=false;
let previousDelivery=null,hasState=false,flowTime=0,flowAmount=0;
const dummy=new T.Object3D(),grainColor=new T.Color();
// CC0 Poly Haven roughness gives the dark worktop subtle surface variation.
const surface=new T.TextureLoader().load(import.meta.env.BASE_URL+'materials/brushed_concrete_rough_1k.jpg',()=>{if(disposed){surface.dispose();return}dirty=true;request()});
surface.wrapS=surface.wrapT=T.RepeatWrapping;surface.repeat.set(2,2);
bench.material.roughnessMap=surface;bench.material.bumpMap=surface;bench.material.bumpScale=.00012;bench.material.roughness=.65;

let motion=!window.matchMedia('(prefers-reduced-motion: reduce)').matches,visible=true,disposed=false,frame=0,last=0,clock=0,dirty=true;
let liquidHeight=0;
const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
function update(value){
 if(!value||disposed)return;

 const text='Amount precipitated: '+amountLabel(value)+partitionLabel(value);
 if(text!==amountText){amountText=text;const c=amountCanvas.getContext('2d');c.clearRect(0,0,1024,240);c.fillStyle='#102b35ee';c.fillRect(0,0,1024,240);c.fillStyle='#eff8ed';c.font='500 48px Arial';c.textAlign='center';c.fillText('Amount precipitated',512,66);c.font='600 60px Arial';c.fillText(amountLabel(value),512,142);c.font='500 30px Arial';c.fillText(partitionLabel(value),512,210,1000);amountTexture.needsUpdate=true;}
 const event=value.delivery;
 if(event&&event.id!==previousDelivery){previousDelivery=event.id;if(hasState&&event.stateId===value.id&&value.accepted&&event.to>event.from){flowTime=1;flowAmount=event.to-event.from;}}
 if(event&&event.stateId!==value.id)flowTime=0;
 hasState=true;
 lever.rotation.x=value.stopcockOpen?0:Math.PI/2;
 liquidHeight=Math.max(0,Math.min(.08,value.volumeMl/vesselCapacityMl*.08));
 liquid.visible=liquidHeight>0;meniscus.visible=liquidHeight>0;
 liquid.scale.y=Math.max(.00001,liquidHeight/.01);liquid.position.y=base+liquidHeight/2;meniscus.position.y=base+liquidHeight;
 const height=columnHeight*Math.max(0,Math.min(1,value.remainingMl/capacityMl));
 titrant.visible=height>0;titrant.scale.y=Math.max(.00001,height/columnHeight);titrant.position.y=bottom+height/2;buretteMeniscus.position.y=bottom+height;buretteMeniscus.visible=height>0;
 // The mesh volume is linear in absolute moles. No minimum-sized pile and
 // no normalization to the current dose: diluting unchanged solids keeps size.
 const phases=value.visibleSolids.filter(p=>p.moles>0),total=value.solidMoles;
 const requestedMl=value.illustrativeSolidMl*(value.solidMagnification??10);
 const drawnMl=Math.min(requestedMl,vesselCapacityMl*.30);
 const bedVolume=drawnMl/vesselCapacityMl*Math.PI*R*R*.08;
 const volumeRatio=requestedMl>0?drawnMl/requestedMl:0;
 let index=0;
 for(const phase of phases){
  const share=phase.moles/total,count=Math.max(1,Math.ceil(Math.min(1500,drawnMl*120)*share));
  // Grains occupy 58% of the porous envelope. Cube-root radius means total
  // rendered grain volume follows amount even for sub-pixel trace deposits.
  const phaseVolume=phase.moles*50*(value.solidMagnification??10)*volumeRatio/vesselCapacityMl*Math.PI*R*R*.08;
  const radius=Math.cbrt(phaseVolume*.58/count/(4*Math.PI/3));
  const footprint=Math.min(R*.90,Math.max(radius*2,Math.cbrt(bedVolume)*2.2));
  const depth=bedVolume/(Math.PI*footprint*footprint);
  grainColor.set(value.solidColorMode==='white'?'#eeeae2':phase.color);
  for(let j=0;j<count&&index<1536;j++,index++){
   const a=index*2.39996323,r=footprint*Math.sqrt(((index*.754877666)%1));
   const y=base+.002+radius+depth*((index*.569840291)%1)*(1.3-.6*r/footprint);
   dummy.position.set(r*Math.cos(a),y,r*Math.sin(a));dummy.rotation.set(index*.7,index*.9,index*1.3);dummy.scale.set(radius,radius*.8,radius);dummy.updateMatrix();
   grains.setMatrixAt(index,dummy.matrix);grains.setColorAt(index,grainColor);
  }
 }
 grains.count=value.accepted?index:0;grains.instanceMatrix.needsUpdate=true;if(grains.instanceColor)grains.instanceColor.needsUpdate=true;
 dirty=true;request();
}
let cameraMove=null;
const focusViews={Beaker:[[0,.085,0],.27],Burette:[[0,.385,0],.62],Stopcock:[[.01,.205,0],.12],'Burette tip':[[0,.124,0],.18],Probe:[[.023,.09,-.012],.19],Stirrer:[[0,.025,0],.30],Stand:[[-.06,.285,-.02],.95]};
function approach(target,position){cameraMove={from:camera.position.clone(),fromTarget:controls.target.clone(),position,target,elapsed:0};if(reduced.matches){camera.position.copy(position);controls.target.copy(target);cameraMove=null;controls.update();}dirty=true;request();}
function focusObject(name){const spec=focusViews[name];if(!spec)return;const target=new T.Vector3(...spec[0]);const direction=camera.position.clone().sub(controls.target).normalize();if(direction.lengthSq()<.01)direction.set(.35,.2,1).normalize();approach(target,target.clone().addScaledVector(direction,spec[1]));}
function view(kind){if(kind==='all')approach(new T.Vector3(-.015,.285,0),new T.Vector3(.48,.40,.88));else focusObject('Beaker');}
const cancelApproach=()=>{cameraMove=null;};controls.addEventListener('start',cancelApproach);
function request(){if(!modelOnly&&!frame&&!disposed&&visible&&!document.hidden)frame=requestAnimationFrame(draw)}
function draw(t){frame=0;if(disposed||!visible||document.hidden)return;const dt=Math.min(.05,(t-last)/1000);last=t;
 if(cameraMove){cameraMove.elapsed+=dt;const u=Math.min(1,cameraMove.elapsed/1.8),ease=u*u*(3-2*u);camera.position.lerpVectors(cameraMove.from,cameraMove.position,ease);controls.target.lerpVectors(cameraMove.fromTarget,cameraMove.target,ease);if(u===1)cameraMove=null;dirty=true;}
 const cameraChanged=controls.update();
 // Prevent orbiting below the worktop without limiting close inspection above it.
 if(camera.position.y<.001){camera.position.y=.001;camera.lookAt(controls.target);dirty=true;}
 host.dataset.cameraDistance=camera.position.distanceTo(controls.target).toFixed(4);
 const animate=motion&&!reduced.matches;
 if(animate){clock+=dt;stir.rotation.y=clock*7;}
 if(!animate)flowTime=0;
 const flowing=animate&&flowTime>0;flowTime=Math.max(0,flowTime-dt);
 const surfaceY=base+liquidHeight,fall=.153-surfaceY;
 stream.visible=flowing&&flowAmount>=.5;
 if(stream.visible){stream.scale.y=fall;stream.position.y=surfaceY+fall/2;}
 drops.forEach((drop,i)=>{drop.visible=flowing&&flowAmount<.5;if(drop.visible){const phase=(clock*2.8+i/5)%1;drop.position.y=.153-fall*phase*phase;drop.scale.set(1,1+phase*.7,1);}});
 ripple.visible=flowing&&liquidHeight>0;if(ripple.visible){const phase=(clock*3)%1;ripple.position.y=surfaceY+.0004;ripple.scale.setScalar(.4+phase*1.4);}
 // Blend optics with camera distance, without changing any chemistry state.
 const distance=camera.position.distanceTo(new T.Vector3(0,base+.05,0));
 const focus=1-T.MathUtils.smoothstep(distance,.10,.32);
 glass.opacity=1-focus*.87;edgeGlass.opacity=1-focus*.78;liquidMat.opacity=.22-focus*.13;
 glint.opacity=.12*(1-focus);ceramic.color.setRGB(.72-focus*.1,.74-focus*.1,.71-focus*.1);
 selection.refresh(false);
 if(dirty||motion){renderer.render(scene,camera);dirty=false;}
 if((motion&&!reduced.matches)||cameraMove||cameraChanged)request();
}
function resize(){const w=host.clientWidth,h=host.clientHeight;if(w<1||h<1)return;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();dirty=true;request()}
const observer=new ResizeObserver(resize);observer.observe(host);
const intersection=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible){dirty=true;request()}else{cancelAnimationFrame(frame);frame=0;}});intersection.observe(host);
const changed=()=>{dirty=true;request()};controls.addEventListener('change',changed);
const visibility=()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0}else changed()};document.addEventListener('visibilitychange',visibility);
// Enlarged targets are invisible and never enter the optical/chemistry scene.
const proxies=[],hitMaterial=new T.MeshBasicMaterial();
function hitArea(name,position,size,cylinder=false){const geometry=cylinder?new T.CylinderGeometry(size[0],size[0],size[1],24):new T.BoxGeometry(...size);const target=new T.Mesh(geometry,hitMaterial);target.position.set(...position);target.userData.apparatus=name;target.updateMatrixWorld();proxies.push(target);}
hitArea('Beaker',[0,base+H/2,0],[R+.003,H+.006],true);
hitArea('Burette',[0,.385,0],[.014,.337],true);
hitArea('Stopcock',[.008,.21,0],[.055,.025,.024]);
hitArea('Burette tip',[0,.173,0],[.007,.047],true);
hitArea('Probe',[px,.116,pz],[.009,.153],true);
hitArea('Stirrer',[0,.018,0],[.13,.037,.126]);
hitArea('Stand',[-.115,.3,-.028],[.010,.57],true);
for(const y of [.35,.51])hitArea('Stand',[-.06,y,-.023],[.14,.033,.042]);
const selection=apparatusSelection({canvas:renderer.domElement,camera,objects:model.children.filter(o=>o.userData.apparatus),proxies,onSelect,onFocus:focusObject,invalidate:()=>{dirty=true;request()}});
resize();request();
return {model,vesselParts,update,view,focus:focusObject,select:selection.select,setMotion(value){motion=value;dirty=true;request()},dispose(){for(const p of proxies)p.geometry.dispose();hitMaterial.dispose();controls.removeEventListener('start',cancelApproach);selection.dispose();disposed=true;cancelAnimationFrame(frame);observer.disconnect();intersection.disconnect();document.removeEventListener('visibilitychange',visibility);controls.dispose();
 const geometries=new Set(),materials=new Set(),textures=new Set();[scene,model].forEach(root=>root.traverse(o=>{if(o.geometry)geometries.add(o.geometry);for(const m of (Array.isArray(o.material)?o.material:[o.material]))if(m)materials.add(m)}));
 for(const m of materials){for(const v of Object.values(m))if(v?.isTexture)textures.add(v);m.dispose()}for(const g of geometries)g.dispose();for(const tex of textures)tex.dispose();environment?.dispose();pm?.dispose();renderer.dispose();renderer.domElement.remove();
}};
}
