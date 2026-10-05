import {createApartment,apartmentWalkable} from './apartment.js';
import {amountLabel,partitionLabel,emptySample,separateSample} from '../beaker/sampleInventory.js';
import * as T from 'three';
import {periodicTable} from '../data/periodicTable.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {createTitrationScene} from '../beaker/titrationScene.js';
// Coordinates follow game/scripts/room.gd: six benches, two rows, z = 6 / 0 / -6.
export const stations=[{id:'acid',name:'01 / Acid–base titration',x:-3.8,z:5.45,side:-1},{id:'kf',name:'02 / Karl Fischer',x:3.8,z:6.1,side:1},{id:'redox',name:'03 / Redox titration',x:-3.85,z:-.55,side:-1},{id:'system',name:'04 / System · preparation',x:3.8,z:-6,side:1},{id:'filter',name:'05 / Filtration',x:3.8,z:0,side:1},{id:'ise',name:'06 / Fluoride ISE',x:-3.8,z:-6,side:-1}];
export function mountUpperFloor(host,{onOpen,onHint,onHandling=()=>{},onEmpty=()=>{},onISEScreen=()=>{}}){
 const scene=new T.Scene();scene.background=new T.Color('#dfebe9');scene.fog=new T.Fog('#dfebe9',22,45);
 const camera=new T.PerspectiveCamera(65,1,.05,60);camera.position.set(0,1.65,9.4);
 const renderer=new T.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=.8;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.transmissionResolutionScale=1;host.append(renderer.domElement);
 const envScene=new RoomEnvironment(),pm=new T.PMREMGenerator(renderer),env=pm.fromScene(envScene,.04);envScene.dispose();pm.dispose();scene.environment=env.texture;scene.environmentIntensity=.4;
 scene.add(new T.HemisphereLight('#efffff','#78877d',.9));const sun=new T.DirectionalLight('#fff2de',1.8);sun.position.set(-3,8,5);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-10,right:10,top:15,bottom:-15,far:35});sun.shadow.normalBias=.035;scene.add(sun);
 const mat=(color,roughness=.5,metalness=0)=>new T.MeshStandardMaterial({color,roughness,metalness});
 const white=mat('#bac8bf',.85),teal=mat('#649e9d'),top=mat('#354b51',.72),steel=mat('#bac9c9',.25,.8),floor=mat('#9aaca6',.9);
 const own=new T.Group();scene.add(own);const obstacles=[];
 function box(w,h,d,x,y,z,m=white,parent=own){const o=new T.Mesh(new RoundedBoxGeometry(w,h,d,2,Math.min(w,h,d,.08)*.22),m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
 function text(value,w,h,x,y,z,angle=0){const c=document.createElement('canvas');c.width=1024;c.height=256;const ctx=c.getContext('2d');ctx.fillStyle='#f0f7f4';ctx.fillRect(0,0,1024,256);ctx.fillStyle='#24595e';ctx.font='600 56px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(value,512,128);const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;const o=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map:tex}));o.position.set(x,y,z);o.rotation.y=angle;own.add(o);return o;}
 box(12,.16,24,0,-.08,0,floor);box(.15,4.2,24,-6,2.1,0);box(.15,4.2,24,6,2.1,0);box(12,1.5,.15,0,.75,-12);box(12,.7,.15,0,3.85,-12);box(5.4,2,.15,0,2.5,-12);for(const x of [-5.65,5.65])box(.7,2,.15,x,2.5,-12);box(5.4,4.2,.15,-3.3,2.1,12);box(5.4,4.2,.15,3.3,2.1,12);box(1.2,2,.15,0,3.2,12);box(1.2,.16,.55,0,-.08,12.05,floor);
 // Quiet architectural details, no characters or game props.
 for(let z=-12;z<=12;z+=2)box(11.9,.003,.012,0,.003,z,mat('#a3bcba'));
 for(const x of [-2,2])box(.012,.003,24,x,.003,0,mat('#a3bcba'));
 for(const side of [-1,1])for(const z of [-6,0,6]){
 const x=side*4.35;box(2.5,1.02,4.4,x,.51,z);box(2.65,.13,4.5,x,1.09,z,top);obstacles.push({x,z,w:2.65,d:4.5});
 for(const dz of [-1.65,-.55,.55,1.65]){box(.03,.78,1.01,x-side*1.265,.56,z+dz);box(.055,.035,.28,x-side*1.30,.80,z+dz,steel);}
 box(.12,.06,4,side*4.6,3.45,z,new T.MeshStandardMaterial({color:'#ffffff',emissive:'#f1ffff',emissiveIntensity:2}));
 box(.75,.06,4.15,side*5.35,2.45,z,white);
 for(let i=0;i<6;i++){const bottle=new T.Mesh(new T.CylinderGeometry(.075,.085,.23,16),mat(i%2?'#bad7d3':'#bda783',.25));bottle.position.set(side*5.35,2.60,z-1.6+i*.6);own.add(bottle);box(.09,.06,.09,side*5.35,2.745,z-1.6+i*.6,teal);}
 }
 for(const s of stations)text(s.name,2.1,.45,s.side*3.005,.73,s.z,s.side<0?Math.PI/2:-Math.PI/2);

 text('ANALYTICAL LABORATORY',4,.7,0,3,-11.90);text('ADAM’S LAB',2.5,.5,0,2.28,-11.89);
 // Open window frames and a lightweight, three-dimensional garden.
 for(const x of [-4,4]){for(const dx of [-1.3,1.3])box(.085,2.08,.20,x+dx,2.5,-12,steel);for(const y of [1.5,3.5])box(2.68,.08,.20,x,y,-12,steel);box(.045,2,.12,x,2.5,-11.98,white);box(2.85,.10,.46,x,1.46,-11.85,white);}
 const grass=mat('#567a45',1),bark=mat('#66523b',1),leaf=[mat('#447148',.95),mat('#68874b',.95),mat('#355d40',.95)];
 box(35,.12,22,0,-.17,-23,grass);box(2,.025,20,0,-.09,-23,mat('#c7baa0',1));
 for(let i=0;i<18;i++){const x=-14+(i%9)*3.5,z=-17-Math.floor(i/9)*8;box(.22,2.8,.22,x,1.3,z,bark);for(let j=0;j<3;j++){const crown=new T.Mesh(new T.IcosahedronGeometry(1.2+j*.08,2),leaf[(i+j)%3]);crown.position.set(x+Math.sin(i+j)*.5,2.6+j*.55,z+Math.cos(i+j)*.4);crown.scale.set(1,.85,1);crown.castShadow=true;own.add(crown);}}
 for(let i=0;i<30;i++){const shrub=new T.Mesh(new T.IcosahedronGeometry(.45,1),leaf[i%3]);shrub.position.set(-12+i*.8,.35,-14.2);own.add(shrub);}
 for(let i=0;i<32;i++){const flower=new T.Mesh(new T.IcosahedronGeometry(.10,0),mat(i%2?'#c6add4':'#ebd695',.9));flower.position.set(-10+(i%16)*1.25,.65,-14-(i%3)*.2);own.add(flower);}
 const terminal=new T.Group();terminal.position.set(3.85,1.16,-6);terminal.rotation.y=-Math.PI/2;own.add(terminal);
 box(.6,.06,.40,0,.03,0,steel,terminal);box(.08,.35,.08,0,.20,-.07,steel,terminal);box(1.25,.78,.08,0,.70,-.08,top,terminal);
 const screenCanvas=document.createElement('canvas');screenCanvas.width=1024;screenCanvas.height=640;const cx=screenCanvas.getContext('2d');cx.fillStyle='#142f3b';cx.fillRect(0,0,1024,640);cx.fillStyle='#dcece7';cx.font='30px Arial';cx.fillText('SYSTEM / PERIODIC TABLE',32,42);
 for(const e of periodicTable){const x=25+(e.column-1)*54,y=65+(e.row-1)*49;cx.fillStyle=e.atomicNumber%3?'#356a70':'#607a69';cx.fillRect(x,y,48,43);cx.fillStyle='#eaf3eb';cx.font='20px Arial';cx.fillText(e.symbol,x+6,y+28);}
 const screenTexture=new T.CanvasTexture(screenCanvas);screenTexture.colorSpace=T.SRGBColorSpace;const display=new T.Mesh(new T.PlaneGeometry(1.17,.70),new T.MeshBasicMaterial({map:screenTexture}));display.position.set(0,.70,-.035);terminal.add(display);
 const apartment=createApartment(own,message=>onHint(message));text('ADAM’S HOME',1.5,.25,0,2.4,11.90,Math.PI);
 // Preparation and filtration fixtures stay at the game's right-hand benches.
 box(.65,.14,.55,3.85,1.23,-7.2,white);box(.30,.03,.30,3.85,1.32,-7.2,steel);
 for(let i=0;i<5;i++)box(.11,.26,.11,4.2,1.3,-6.5+i*.22,teal);
 const flask=new T.Mesh(new T.ConeGeometry(.19,.4,32),new T.MeshPhysicalMaterial({color:'#cdece8',transparent:true,opacity:.35,roughness:.1}));flask.position.set(4.3,1.38,0);own.add(flask);box(.4,.25,.4,4.85,1.28,0,teal);
 // Each wet bench owns its last committed display, independent of the other bench.
 const wetDisplays=new Map();
 for(const s of stations.filter(s=>s.id==='acid'||s.id==='redox')){
  const hiddenHost=document.createElement('div');hiddenHost.hidden=true;host.append(hiddenHost);
  const visual=new T.Group();visual.position.set(s.x,1.16,s.z);visual.rotation.y=Math.PI/2;own.add(visual);
  box(.60,.045,.35,.60,.03,-.20,steel,visual);box(.045,.27,.045,.60,.18,-.20,steel,visual);box(1.05,.66,.045,.60,.56,-.20,top,visual);
  const canvas=document.createElement('canvas');canvas.width=1000;canvas.height=600;const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
  const screen=new T.Mesh(new T.PlaneGeometry(.99,.59),new T.MeshBasicMaterial({map:texture}));screen.position.set(.60,.56,-.174);visual.add(screen);
  wetDisplays.set(s.id,{station:s,host:hiddenHost,visual,canvas,texture,api:null,capacity:null,vessel:null});
 }
 function setWet(id,state){const record=wetDisplays.get(id);if(!record)return;record.state=structuredClone(state);
  if(record.capacity!==state.capacityMl||record.vessel!==state.vesselCapacityMl){if(record.api){scene.remove(record.api.model);record.api.dispose();}record.api=createTitrationScene(record.host,{capacityMl:state.capacityMl,vesselCapacityMl:state.vesselCapacityMl,modelOnly:true});record.capacity=state.capacityMl;record.vessel=state.vesselCapacityMl;const model=record.api.model;model.scale.setScalar(2.3);model.position.set(record.station.x,1.16,record.station.z);model.rotation.y=Math.PI/2;scene.add(model);}
  record.api.update({...state,delivery:null,stopcockOpen:false});if(record.away)record.api.vesselParts.forEach(o=>o.visible=false);
  const ctx=record.canvas.getContext('2d');ctx.fillStyle='#102b35';ctx.fillRect(0,0,1000,600);ctx.fillStyle='#dbece7';ctx.font='600 38px Arial';ctx.fillText(id==='acid'?'ACID–BASE TITRATION':'REDOX TITRATION',35,60);ctx.font='27px Arial';ctx.fillText(state.accepted?'Last selected result':'Prepare experiment at this bench',35,110);
  ctx.fillStyle='#a9e8d3';ctx.font='600 40px Arial';ctx.fillText(state.probeLabel+': '+(state.probeValue===null?'—':state.probeValue.toFixed(3)),35,170);ctx.fillStyle='#dbece7';ctx.font='26px Arial';ctx.fillText('Beaker '+state.volumeMl.toFixed(1)+' mL  ·  Added '+state.addedMl.toFixed(1)+' mL',35,220);
  ctx.font='24px Arial';ctx.fillText('Amount precipitated: '+amountLabel(state),35,252);
  const curve=state.curve??[];
  if(curve.length>1){const xmax=Math.max(...curve.map(p=>p.x),1),min=Math.min(...curve.map(p=>p.y)),max=Math.max(...curve.map(p=>p.y)),span=Math.max(max-min,.01),x=v=>80+v/xmax*820,y=v=>510-(v-min)/span*235;ctx.strokeStyle='#6f969d';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(80,260);ctx.lineTo(80,510);ctx.lineTo(915,510);ctx.stroke();ctx.strokeStyle='#8ce3c5';ctx.lineWidth=4;ctx.beginPath();curve.forEach((p,i)=>i?ctx.lineTo(x(p.x),y(p.y)):ctx.moveTo(x(p.x),y(p.y)));ctx.stroke();ctx.strokeStyle='#efce80';ctx.beginPath();ctx.moveTo(x(state.addedMl),265);ctx.lineTo(x(state.addedMl),510);ctx.stroke();ctx.fillStyle='#dbece7';ctx.font='22px Arial';ctx.fillText('Added volume / mL',360,558);ctx.fillText('0',70,540);ctx.fillText(xmax.toFixed(1),865,540);ctx.fillText(max.toFixed(2),15,275);ctx.fillText(min.toFixed(2),15,510);}
  ctx.font='20px Arial';ctx.fillStyle='#a9e8d3';ctx.fillText(partitionLabel(state),35,589);record.texture.needsUpdate=true;
 }
 for(const id of wetDisplays.keys())setWet(id,{capacityMl:100,vesselCapacityMl:500,volumeMl:50,remainingMl:100,addedMl:0,visibleSolids:[],solidMoles:0,illustrativeSolidMl:0,accepted:false,probeValue:null,probeLabel:id==='acid'?'pH':'Eh / V',curve:[]});
 // Physical samples are snapshots. The calculation and its timeline stay untouched.
 const parked=new Map();
 let carried=null,outputs=null,handlingMessage='Prepare a titration, then pick up its beaker.',handlingKey='';
 function vessel(state){
  // Reuse a bench's geometry builder; a carried beaker needs no extra WebGL renderer.
  const record=[...wetDisplays.values()].find(r=>r.capacity===state.capacityMl&&r.vessel===state.vesselCapacityMl);
  let temporary=null;if(!record){temporary=document.createElement('div');temporary.hidden=true;host.append(temporary);}
  const source=record?.api??createTitrationScene(temporary,{capacityMl:state.capacityMl,vesselCapacityMl:state.vesselCapacityMl,modelOnly:true});source.update({...state,delivery:null,stopcockOpen:false});
  const model=new T.Group(),geometries=new Set(),materials=new Set(),textures=new Set();
  for(const part of source.vesselParts){const copy=part.clone();copy.traverse(o=>{
   if(o.geometry){o.geometry=o.geometry.clone();geometries.add(o.geometry);}
   if(o.material){o.material=o.material.clone();materials.add(o.material);
    if(o.material.map?.image instanceof HTMLCanvasElement){const old=o.material.map.image,c=document.createElement('canvas');c.width=old.width;c.height=old.height;c.getContext('2d').drawImage(old,0,0);o.material.map=new T.CanvasTexture(c);o.material.map.colorSpace=T.SRGBColorSpace;textures.add(o.material.map);}
   }
  });model.add(copy);}
  if(record)source.update(record.state);else{source.dispose();temporary.remove();}model.scale.setScalar(2.3);scene.add(model);
  return {state,api:{model,dispose(){model.traverse(o=>{if(o.isInstancedMesh)o.dispose();});for(const g of geometries)g.dispose();for(const m of materials)m.dispose();for(const t of textures)t.dispose();}}};
 }
 function removeVessel(v){if(!v)return;scene.remove(v.api.model);v.api.dispose();}
 function placeOutput(v,kind){v.api.model.position.set(3.8,1.075,kind==='residue'?-.42:.42);v.api.model.rotation.set(0,-Math.PI/2,0);}
 function handling(){
  const record=wetDisplays.get(near?.id),atFilter=near?.id==='filter';
  const status={carrying:carried?.state.kind??(carried?'Titration sample':null),
   canPick:!carried&&!!record?.state?.accepted&&record.state.hasAmountBasis,
   canPickParked:!carried&&parked.has(near?.id),
   canReturn:!!carried&&!!near&&!(carried.output&&atFilter?outputs?.[carried.output]:parked.has(near.id)),
   canFilter:!!carried&&!carried.output&&atFilter&&!Object.values(outputs??{}).some(Boolean),
   residue:atFilter&&!carried&&!!outputs?.residue,filtrate:atFilter&&!carried&&!!outputs?.filtrate,
   message:handlingMessage,amount:carried?[amountLabel(carried.state),partitionLabel(carried.state)].filter(Boolean).join(' · '):null};
  const key=JSON.stringify(status);if(key!==handlingKey){handlingKey=key;onHandling(status);}
 }
 function pickUp(){const record=wetDisplays.get(near?.id);if(carried||!record?.state?.accepted||!record.state.hasAmountBasis)return;
  carried={...vessel(structuredClone(record.state)),origin:near.id};
  setWet(near.id,emptySample(record.state));onEmpty(near.id);handlingMessage='Carrying titration sample. An empty beaker is ready at the station. Drop this sample at any bench, or take it to 05 Filtration.';handling();
 }
 function putDown(){if(!carried||!near)return;
  if(carried.output&&near.id==='filter'&&!outputs?.[carried.output]){outputs[carried.output]=carried;placeOutput(carried,carried.output);carried=null;}
  else if(!parked.has(near.id)){
   const model=carried.api.model;model.position.set(near.x,1.075,near.z+1.15);model.rotation.set(0,near.side<0?Math.PI/2:-Math.PI/2,0);
   parked.set(near.id,carried);carried=null;
  }else return;
  handlingMessage='Beaker dropped off at '+near.name+'. Its contents are preserved; pick it up again here.';handling();
 }
 function pickParked(){if(carried||!parked.has(near?.id))return;carried=parked.get(near.id);parked.delete(near.id);handlingMessage='Picked up the stored beaker with its original contents.';handling();}
 function filterSample(){if(!carried||carried.output||near?.id!=='filter'||Object.values(outputs??{}).some(Boolean))return;
  const separated=separateSample(carried.state);outputs={};
  for(const kind of ['residue','filtrate']){outputs[kind]={...vessel(separated[kind]),output:kind};placeOutput(outputs[kind],kind);}
  handlingMessage='Separated: residue '+amountLabel(separated.residue)+'; filtrate '+separated.filtrate.volumeMl.toFixed(1)+' mL. Ideal separation; no re-equilibration or retained liquid.';
  removeVessel(carried);carried=null;handling();
 }
 function pickOutput(kind){if(carried||near?.id!=='filter'||!outputs?.[kind])return;carried=outputs[kind];outputs[kind]=null;handlingMessage='Carrying '+carried.state.kind.toLowerCase()+'. Place it back at the filtration bench.';handling();}
 function resetHandling(){for(const v of parked.values())removeVessel(v);parked.clear();removeVessel(carried);carried=null;if(outputs)Object.values(outputs).forEach(removeVessel);outputs=null;
  for(const record of wetDisplays.values()){record.away=false;record.api.vesselParts.forEach(o=>o.visible=true);record.api.update(record.state);}
  handlingMessage='Sample handling reset to the selected titration results.';handling();
 }
 const kfAnchor=new T.Group();kfAnchor.position.set(3.8,1.17,6.1);kfAnchor.rotation.y=-Math.PI/2;kfAnchor.scale.setScalar(.17);scene.add(kfAnchor);let kf=null,pairs=[];
 function setKF(source){kfAnchor.clear();pairs=[];if(!source)return;kf=source.clone(true);kfAnchor.add(kf);pairs=[];function pair(a,b){pairs.push([a,b]);for(let i=0;i<a.children.length;i++)pair(a.children[i],b.children[i]);}pair(source,kf);}
 const iseAnchor=new T.Group();iseAnchor.position.set(-3.8,1.16,-6);iseAnchor.rotation.y=Math.PI/2;iseAnchor.scale.setScalar(4);scene.add(iseAnchor);let iseSource=null,isePairs=[];
 function setISE(source){iseAnchor.clear();isePairs=[];iseSource=source;if(!source)return;const clone=source.model.clone(true);iseAnchor.add(clone);function pair(a,b){b.visible=a.visible&&!a.userData.roomExclude;isePairs.push([a,b]);a.children.forEach((child,i)=>pair(child,b.children[i]));}pair(source.model,clone);}
 let active=true,disposed=false,last=0,drag=null,yaw=0,pitch=0,near=null,lastHint='',frame=0;const keys=new Set(),angles=new T.Euler(0,0,0,'YXZ');
 const valid=(x,z)=>((Math.abs(x)<5.65&&Math.abs(z)<11.6)||(apartment.loaded&&Math.abs(x)<.36&&z>=11.5&&z<12.5)||(apartment.loaded&&apartmentWalkable(x,z)))&&!obstacles.some(b=>Math.abs(x-b.x)<b.w/2+.25&&Math.abs(z-b.z)<b.d/2+.25);
 function release(){keys.clear();drag=null;if(document.pointerLockElement===renderer.domElement)document.exitPointerLock();}
 function interact(){if(!active||!near)return;release();if(near.id==='filter'){handlingMessage='Bring a titration beaker here, then separate precipitate and solution.';handling();return;}onOpen(near.id);}
 function visit(id){if(id==='apartment'){if(!apartment.loaded){onHint('Apartment is loading…');return;}camera.position.set(0,1.65,12.9);yaw=Math.PI;pitch=0;keys.clear();return;}const s=stations.find(s=>s.id===id);if(!s)return;camera.position.set(s.side*2.15,1.65,s.z);yaw=s.side<0?Math.PI/2:-Math.PI/2;pitch=-.13;keys.clear();}
 function home(){camera.position.set(0,1.65,9.4);yaw=0;pitch=0;keys.clear();}
 function key(e){if(!active||/INPUT|SELECT|TEXTAREA/.test(e.target.tagName))return;if(e.code==='KeyE'){e.preventDefault();interact();return;}if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','ShiftLeft','ShiftRight'].includes(e.code)){e.preventDefault();keys.add(e.code);}}
 const up=e=>keys.delete(e.code),blur=()=>release();
 let press=null;
 const down=e=>{if(active){drag=[e.clientX,e.clientY];press=[e.clientX,e.clientY];}},end=e=>{drag=null;if(active&&press&&Math.hypot(e.clientX-press[0],e.clientY-press[1])<5&&e.target===renderer.domElement){const rect=renderer.domElement.getBoundingClientRect(),ray=new T.Raycaster();ray.setFromCamera(new T.Vector2((e.clientX-rect.left)/rect.width*2-1,1-(e.clientY-rect.top)/rect.height*2),camera);if(ray.intersectObject(iseAnchor,true).some(hit=>hit.object.userData.apparatus==='Meter')){release();onISEScreen();}}press=null;};
 function move(e){if(!active)return;let dx,dy;if(document.pointerLockElement===renderer.domElement){dx=e.movementX;dy=e.movementY;}else if(drag){dx=e.clientX-drag[0];dy=e.clientY-drag[1];drag=[e.clientX,e.clientY];}else return;yaw-=dx*.0025;pitch=T.MathUtils.clamp(pitch-dy*.0025,-1.35,1.35);}
 async function lock(){try{await renderer.domElement.requestPointerLock();}catch{onHint('Mouse capture unavailable here — drag to look; WASD to walk');}}
 function resize(){const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
 const observer=new ResizeObserver(resize);observer.observe(host);
 function tick(t){if(disposed)return;frame=requestAnimationFrame(tick);const dt=Math.min(.05,(t-last)/1000);last=t;if(!active||document.hidden||renderer.getContext().isContextLost())return;
 const f=(keys.has('KeyW')||keys.has('ArrowUp')?1:0)-(keys.has('KeyS')||keys.has('ArrowDown')?1:0),r=(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0),speed=(keys.has('ShiftLeft')||keys.has('ShiftRight')?4:2)*dt/Math.max(1,Math.hypot(f,r));
 const dx=(-Math.sin(yaw)*f+Math.cos(yaw)*r)*speed,dz=(-Math.cos(yaw)*f-Math.sin(yaw)*r)*speed;if(valid(camera.position.x+dx,camera.position.z))camera.position.x+=dx;if(valid(camera.position.x,camera.position.z+dz))camera.position.z+=dz;
 angles.set(pitch,yaw,0);camera.quaternion.setFromEuler(angles);near=stations.find(s=>Math.hypot(camera.position.x-s.x,camera.position.z-s.z)<2.8);const hint=camera.position.z>12?'Adam’s Home':near?'E · '+near.name:'Explore Adam’s Lab';if(hint!==lastHint){lastHint=hint;onHint(hint);}
 if(carried){carried.api.model.position.set(.27,-.34,-.70).applyQuaternion(camera.quaternion).add(camera.position);carried.api.model.quaternion.copy(camera.quaternion);}handling();
 iseSource?.advance(dt);for(const [a,b]of isePairs){b.position.copy(a.position);b.quaternion.copy(a.quaternion);b.scale.copy(a.scale);b.visible=a.visible&&!a.userData.roomExclude;if(a.material)b.material=a.material;}
 for(const [a,b]of pairs){b.position.copy(a.position);b.quaternion.copy(a.quaternion);b.scale.copy(a.scale);b.visible=a.visible;if(a.isMesh){b.material=a.material;b.geometry=a.geometry;}}
 host.dataset.position=camera.position.toArray().map(v=>v.toFixed(2)).join(',');renderer.render(scene,camera);
 }
 const lost=e=>{e.preventDefault();onHint('Graphics interrupted — waiting for the browser to restore the scene');};renderer.domElement.addEventListener('webglcontextlost',lost);
 renderer.domElement.addEventListener('pointerdown',down);window.addEventListener('pointerup',end);window.addEventListener('pointermove',move);window.addEventListener('keydown',key);window.addEventListener('keyup',up);window.addEventListener('blur',blur);resize();frame=requestAnimationFrame(tick);
 return {setKF,setISE,setWet,pickUp,putDown,pickParked,filterSample,pickOutput,resetHandling,interact,visit,home,lock,release,setActive(value){active=value;release();resize();},dispose(){apartment.dispose();for(const v of parked.values())removeVessel(v);removeVessel(carried);if(outputs)Object.values(outputs).forEach(removeVessel);disposed=true;release();cancelAnimationFrame(frame);observer.disconnect();window.removeEventListener('pointerup',end);window.removeEventListener('pointermove',move);window.removeEventListener('keydown',key);window.removeEventListener('keyup',up);window.removeEventListener('blur',blur);renderer.domElement.removeEventListener('pointerdown',down);for(const record of wetDisplays.values()){scene.remove(record.api.model);record.api.dispose();record.host.remove();}const geometries=new Set(),materials=new Set();own.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)materials.add(o.material);});for(const g of geometries)g.dispose();for(const m of materials){m.map?.dispose();m.dispose();}env.dispose();renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();}};
}
