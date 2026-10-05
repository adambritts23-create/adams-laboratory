import * as T from 'three'
import {OrbitControls} from 'three/addons/controls/OrbitControls.js'
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js'
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js'
import {apparatusSelection} from '../beaker/apparatusSelection.js'
import {iseFrame} from './model.js'

export function createISEScene(host,{onSelect=()=>{}}={}){
 const scene=new T.Scene();scene.background=new T.Color('#142832')
 const renderer=new T.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=.95;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;host.append(renderer.domElement)
 const camera=new T.PerspectiveCamera(35,1,.002,20),controls=new OrbitControls(camera,renderer.domElement)
 controls.enableDamping=true;controls.dampingFactor=.12;controls.zoomToCursor=true;controls.screenSpacePanning=true;controls.minDistance=.025;controls.maxDistance=2;controls.zoomSpeed=1.4;controls.panSpeed=.9
 const pm=new T.PMREMGenerator(renderer),room=new RoomEnvironment(),environment=pm.fromScene(room,.035);scene.environment=environment.texture;room.dispose();pm.dispose()
 scene.add(new T.HemisphereLight('#dceaff','#25313b',.7))
 const key=new T.DirectionalLight('#fff3db',2.5);key.position.set(-.4,.8,.6);key.castShadow=true;key.shadow.mapSize.set(1024,1024);Object.assign(key.shadow.camera,{left:-.65,right:.65,top:.65,bottom:-.65,near:.01,far:3});key.shadow.normalBias=.002;scene.add(key)
 const rim=new T.DirectionalLight('#bbdfff',1.2);rim.position.set(.5,.5,-.5);scene.add(rim)
 const model=new T.Group();scene.add(model)
 const apparatus=new T.Group();model.add(apparatus)
 const standard=(color,metalness=0,roughness=.4)=>new T.MeshStandardMaterial({color,metalness,roughness})
 const graphite=standard('#23333a',.35,.38),chrome=standard('#adbfc7',.9,.23),ptfe=standard('#cfd4ca',0,.4),blue=standard('#1c6277',.15,.35),rubber=standard('#171e21',0,.65)
 const glass=new T.MeshPhysicalMaterial({color:'#e7f0ed',transmission:1,thickness:.0013,ior:1.47,roughness:.015,transparent:true,depthWrite:false,side:T.DoubleSide,envMapIntensity:.55})
 const solution=new T.MeshPhysicalMaterial({color:'#d8ca70',transparent:true,opacity:.26,roughness:.18,ior:1.333,depthWrite:false,side:T.DoubleSide})
 let name='Beaker'
 function mesh(geometry,material,position,parent=apparatus){const o=new T.Mesh(geometry,material);o.position.set(...position);o.castShadow=!material.transparent;o.receiveShadow=!material.transparent;o.userData.apparatus=name;parent.add(o);return o}
 const box=(w,h,d,mat,p,parent)=>mesh(new RoundedBoxGeometry(w,h,d,3,Math.min(w,h,d)*.15),mat,p,parent)
 const cyl=(r,h,mat,p,parent,rt=r)=>mesh(new T.CylinderGeometry(rt,r,h,64),mat,p,parent)
 function tube(points,r,mat,parent){return mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),40,r,10,false),mat,[0,0,0],parent)}
 function ring(r,y,mat,th=.0007,x=0,z=0){const o=mesh(new T.TorusGeometry(r,th,10,80),mat,[x,y,z]);o.rotation.x=Math.PI/2;return o}
 function textSprite(text,w=.027,color='#eff7f5',background='#16313b'){
  const c=document.createElement('canvas');c.width=512;c.height=128;const ctx=c.getContext('2d');ctx.fillStyle=background;ctx.fillRect(0,0,c.width,c.height);ctx.fillStyle=color;ctx.font='600 66px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,256,66)
  const texture=new T.CanvasTexture(c);texture.colorSpace=T.SRGBColorSpace
  const sprite=new T.Sprite(new T.SpriteMaterial({map:texture,transparent:true,depthWrite:false,depthTest:false,toneMapped:false}));sprite.scale.set(w,w/4,1);sprite.renderOrder=20;return sprite
 }
 name=''
 box(1.1,.022,.58,standard('#4a5b60',.05,.65),[.12,-.014,-.02]).userData.roomExclude=true;
 name='Stirrer'
 box(.146,.025,.14,graphite,[0,.018,0]);box(.135,.004,.13,standard('#566269',.55,.3),[0,.032,0])
 for(const x of [-.055,.055])for(const z of [-.05,.05])cyl(.008,.006,rubber,[x,.003,z])
 const dial=cyl(.010,.007,blue,[.046,.017,.073]);dial.rotation.x=Math.PI/2
 const stirLabel=textSprite('STIR  ON',.065,'#b6e7d4','#182d35');stirLabel.position.set(-.020,.017,.074);apparatus.add(stirLabel)
 for(let i=0;i<9;i++)box(.0006,.003,.006,rubber,[.073,.016,-.04+i*.009])
 name='Beaker'
 const radius=.037,base=.039,height=.078
 mesh(new T.LatheGeometry([[radius-.001,0],[radius,.001],[radius+.001,.003],[radius+.001,height-.002],[radius+.002,height],[radius,height+.001],[radius-.0003,height-.002],[radius-.0003,.003],[radius-.001,0]].map(p=>new T.Vector2(...p)),96),glass,[0,base,0]);cyl(radius-.001,.002,glass,[0,base+.001,0]);ring(radius+.001,base+height,glass);ring(radius,base+.002,glass,.0008)
 tube([[-.031,base+height,.019],[-.047,base+height+.001,.012],[-.036,base+height,-.001]],.0009,glass)
 const liquid=cyl(radius-.0007,1,solution,[0,base,0]);const meniscus=ring(radius-.0009,base+.04,solution,.0006)
 const bar=new T.Group();bar.position.set(0,base+.004,0);apparatus.add(bar);const stir=mesh(new T.CapsuleGeometry(.0028,.023,6,16),ptfe,[0,0,0],bar);stir.rotation.z=Math.PI/2
 name='Probe'
 const px=-.009,pz=-.008,tipY=base+.016
 // Opaque combination fluoride electrode: external body, sensing face and junction only.
 cyl(.006,.135,graphite,[px,tipY+.0675,pz]);cyl(.007,.022,blue,[px,tipY+.146,pz]);cyl(.005,.008,rubber,[px,tipY+.161,pz]);cyl(.0062,.005,ptfe,[px,tipY+.006,pz]);cyl(.0048,.0015,standard('#b5bbbd',.15,.32),[px,tipY,pz]);
 const electrodeLabel=textSprite('F⁻ ISE',.032);electrodeLabel.position.set(px+.015,tipY+.12,pz+.003);apparatus.add(electrodeLabel)
 name='Stand'
 box(.08,.010,.07,graphite,[-.10,.006,-.07]);cyl(.003,.22,chrome,[-.10,.12,-.07]);box(.019,.016,.017,graphite,[-.10,.186,-.07]);tube([[-.10,.186,-.07],[-.04,.186,-.055],[px,.186,pz]],.0025,chrome);cyl(.009,.012,graphite,[px,.186,pz]);
 name='Meter'
 const mx=.20,my=.10,mz=-.045
 box(.18,.11,.025,graphite,[mx,my,mz]);box(.16,.093,.003,blue,[mx,my,mz+.014]);cyl(.009,.046,chrome,[mx,.033,mz]);box(.12,.010,.08,graphite,[mx,.006,mz])
 const screen=document.createElement('canvas');screen.width=1024;screen.height=560;const ctx=screen.getContext('2d'),screenTexture=new T.CanvasTexture(screen);screenTexture.colorSpace=T.SRGBColorSpace
 mesh(new T.PlaneGeometry(.15,.082),new T.MeshBasicMaterial({map:screenTexture,toneMapped:false}),[mx,my,mz+.017])
 tube([[px,tipY+.165,pz],[px,.25,-.07],[.13,.25,-.10],[mx+.04,.13,mz-.025]],.002,rubber)
 name='Standard'
 cyl(.017,.05,glass,[-.175,.035,.015]);cyl(.018,.016,blue,[-.175,.069,.015]);cyl(.016,.025,solution,[-.175,.022,.015]);const standardLabel=textSprite('1000 ppm F⁻',.054);standardLabel.position.set(-.175,.036,.034);apparatus.add(standardLabel)
 name='Pipette'
 const pipette=new T.Group();apparatus.add(pipette);pipette.position.set(.020,.22,.012)
 cyl(.008,.065,ptfe,[0,.034,0],pipette);cyl(.0087,.012,blue,[0,.070,0],pipette);cyl(.0035,.015,chrome,[0,.082,0],pipette);cyl(.007,.006,blue,[0,.092,0],pipette);cyl(.001,.045,ptfe,[0,-.022,0],pipette,.005)
 const doseLabel=textSprite('Standard',.035);doseLabel.position.set(.016,.045,0);pipette.add(doseLabel)
 const dropMat=new T.MeshBasicMaterial({color:'#b5f3ea',transparent:true,opacity:.85,toneMapped:false}),drops=[]
 name=''
 for(let i=0;i<3;i++)drops.push(mesh(new T.SphereGeometry(.0015,12,8),dropMat,[0,0,0],model))
 const ionGroup=new T.Group();model.add(ionGroup);const ionObjects=[],ionMaterials=[]
 // Local, inexpensive glow confined to the illustrative uranyl ion.
 const glowCanvas=document.createElement('canvas');glowCanvas.width=64;glowCanvas.height=64
 const glowContext=glowCanvas.getContext('2d'),gradient=glowContext.createRadialGradient(32,32,0,32,32,32)
 gradient.addColorStop(0,'rgba(80,255,95,0.38)');gradient.addColorStop(.35,'rgba(45,240,75,0.18)');gradient.addColorStop(1,'rgba(20,210,55,0)')
 glowContext.fillStyle=gradient;glowContext.fillRect(0,0,64,64)
 const glowTexture=new T.CanvasTexture(glowCanvas);glowTexture.colorSpace=T.SRGBColorSpace
 function ion(label,color,index,kind='sphere'){
  const group=new T.Group();ionGroup.add(group);const mat=index<9||kind==='uranyl'?new T.MeshBasicMaterial({color,toneMapped:false}):new T.MeshStandardMaterial({color,emissive:color,emissiveIntensity:.08,roughness:.65,toneMapped:false});ionMaterials.push(mat)
  const bead=new T.Mesh(new T.SphereGeometry(kind==='uranyl'?.0023:index<9?.0020:.0014,16,12),mat);group.add(bead)
  if(kind==='uranyl'){const oxygen=new T.MeshBasicMaterial({color:'#49c95d',toneMapped:false});ionMaterials.push(oxygen);for(const sign of [-1,1]){const o=new T.Mesh(new T.SphereGeometry(.0015,12,8),oxygen);o.position.x=sign*.0036;group.add(o)}}
  if(kind==='uranyl'){const halo=new T.Sprite(new T.SpriteMaterial({map:glowTexture,transparent:true,depthWrite:false,toneMapped:false}));halo.scale.set(.016,.016,1);group.add(halo)}
  const text=textSprite(label,kind==='uranyl'?.026:.021,color);text.position.y=.005;group.add(text)
  ionObjects.push({group,text,index,label});return group
 }
 for(let i=0;i<9;i++)ion('F⁻','#f52236',i)
 ion('UO₂²⁺','#43e75c',9,'uranyl');ion('Na⁺','#89c6f4',10);ion('Ac⁻ / HAc','#9cded5',11);ion('CDTA','#bdadf1',12);ion('NO₃⁻','#adc5d4',13)
 let current=iseFrame(),options={chemistry:true,labels:false,motion:true},disposed=false,raf=0,last=0,clock=0,screenKey='',approach=null,visible=true
 function view(which){if(which==='meter'){focus('Meter');return}const target=which==='chemistry'?new T.Vector3(0,.078,0):new T.Vector3(.055,.11,0);const position=which==='chemistry'?new T.Vector3(.075,.114,.15):new T.Vector3(.275,.255,.50);approach={elapsed:0,from:camera.position.clone(),targetFrom:controls.target.clone(),position,target}}
 camera.position.set(.275,.255,.50);controls.target.set(.055,.11,0);controls.update()
 function focus(name){if(['Beaker','Probe','Stirrer'].includes(name))view('chemistry');else if(name==='Meter')approach={elapsed:0,from:camera.position.clone(),targetFrom:controls.target.clone(),position:new T.Vector3(.23,.14,.23),target:new T.Vector3(mx,my,mz)};else view('all')}
 const selection=apparatusSelection({canvas:renderer.domElement,camera,objects:apparatus.children.filter(o=>o.isMesh),onSelect,onFocus:focus,invalidate:request})
 function drawScreen(){const key=[current.potentialMv.toFixed(1),current.volumeMl.toFixed(2),current.stage,current.active,options.prepared,options.assay?.sampleId,options.assay?.sampleUgG,...current.readingsMv].join(':');if(key===screenKey)return;screenKey=key
  if(!options.prepared){ctx.fillStyle='#102731';ctx.fillRect(0,0,1024,560);ctx.fillStyle='#dcece7';ctx.font='600 44px Arial';ctx.fillText('FLUORIDE ISE',55,100);ctx.font='32px Arial';ctx.fillText('Enter three mV readings and sample weight',55,230);ctx.fillText('Then select Prepare animation',55,295);screenTexture.needsUpdate=true;return}
  if(current.stage===2&&!current.active&&options.assay){drawResultScreen(options.assay);return}
  ctx.fillStyle='#09221f';ctx.fillRect(0,0,1024,560);ctx.fillStyle='#badbcc';ctx.font='600 36px Arial';ctx.fillText('FLUORIDE  /  COMBINATION ISE',40,57);ctx.font='26px Arial';ctx.fillStyle='#a8c4bc';ctx.fillText('STANDARD ADDITION · PRESENTATION REPLAY',40,101);ctx.fillStyle='#eef3bc';ctx.font='100px Arial';ctx.fillText(current.potentialMv.toFixed(1),42,238);ctx.font='40px Arial';ctx.fillText('mV',320,238);ctx.fillStyle='#bbdfd9';ctx.font='32px Arial';ctx.fillText(current.volumeMl.toFixed(2)+' mL',42,310);ctx.fillText('pH ≈ 5.3',420,310)
  ctx.strokeStyle='#3d625c';ctx.beginPath();ctx.moveTo(45,457);ctx.lineTo(955,457);ctx.stroke();for(let i=0;i<3;i++){const x=70+i*425,y=420;ctx.fillStyle=i<=current.stage?'#ace4ce':'#54716a';ctx.beginPath();ctx.arc(x,y,7,0,Math.PI*2);ctx.fill();ctx.font='24px Arial';ctx.fillText(i===0?'Initial':i===1?'+'+current.additionVolumesMl[0]+' mL':'+'+current.additionVolumesMl[1]+' mL',x-25,497)}ctx.fillStyle='#96b6ab';ctx.font='22px Arial';ctx.fillText('Supplied example readings · not a sample assay',42,540);screenTexture.needsUpdate=true
 }
 function drawResultScreen(result){
  ctx.fillStyle='#edf2f1';ctx.fillRect(0,0,1024,560)
  ctx.fillStyle='#173640';ctx.fillRect(0,0,1024,76);ctx.fillStyle='#f1f7f5';ctx.font='600 30px Arial';ctx.textAlign='left';ctx.fillText('FLUORIDE  /  RESULTS',28,47);ctx.textAlign='right';ctx.font='24px Arial';ctx.fillText(result.sampleId||'Sample',990,47,440);ctx.textAlign='left'
  ctx.fillStyle='#dce8e5';ctx.fillRect(22,96,318,438)
  ctx.fillStyle='#36535a';ctx.font='22px Arial';ctx.fillText('INITIAL ANALYSIS SOLUTION',38,132);ctx.fillStyle='#123a42';ctx.font='600 43px Arial';ctx.fillText(result.initialMgL.toFixed(1),38,184);ctx.font='26px Arial';ctx.fillText('mg/L F⁻  ·  58 mL',38,220)
  ctx.strokeStyle='#b6cac5';ctx.beginPath();ctx.moveTo(38,242);ctx.lineTo(323,242);ctx.stroke()
  ctx.font='20px Arial';ctx.fillStyle='#36535a';ctx.fillText('Original 8 mL solution',38,276);ctx.fillStyle='#173640';ctx.font='600 29px Arial';ctx.fillText(result.originalMgL.toFixed(1)+' mg/L',38,313)
  ctx.font='20px Arial';ctx.fillStyle='#36535a';ctx.fillText('Per sample mass',38,362);ctx.fillStyle='#173640';ctx.font='600 27px Arial';ctx.fillText(result.sampleUgG.toFixed(1)+' µg F/g',38,397)
  ctx.font='20px Arial';ctx.fillStyle='#36535a';ctx.fillText('Per uranium mass',38,446);ctx.fillStyle='#173640';ctx.font='600 27px Arial';ctx.fillText(result.uraniumUgG.toFixed(1)+' µg F/g U',38,481)
  ctx.font='20px Arial';ctx.fillStyle='#36535a';ctx.fillText(result.massG+' g sample · '+result.uraniumPercent+'% U',38,519)
  ctx.fillStyle='#173640';ctx.font='600 25px Arial';ctx.fillText('STANDARD-ADDITION RESPONSE',370,125)
  const logs=result.concentrations.map(Math.log10),lo=Math.min(...logs),hi=Math.max(...logs),bottom=Math.min(...result.readings)-5,top=Math.max(...result.readings)+5
  const x=v=>435+(v-lo)/(hi-lo)*480,y=v=>411-(v-bottom)/(top-bottom)*237
  ctx.font='18px Arial';ctx.lineWidth=1
  for(let i=0;i<=4;i++){const t=i/4,v=lo+t*(hi-lo),e=bottom+t*(top-bottom);ctx.strokeStyle='#ccd5d7';ctx.beginPath();ctx.moveTo(420,y(e));ctx.lineTo(963,y(e));ctx.stroke();ctx.fillStyle='#243943';ctx.textAlign='right';ctx.fillText(e.toFixed(0),408,y(e)+6);ctx.textAlign='center';ctx.fillText(v.toFixed(2),x(v),438)}
  ctx.strokeStyle='#334952';ctx.beginPath();ctx.moveTo(420,158);ctx.lineTo(420,411);ctx.lineTo(963,411);ctx.stroke()
  ctx.strokeStyle='#267995';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x(lo),y(result.regressionSlope*lo+result.regressionIntercept));ctx.lineTo(x(hi),y(result.regressionSlope*hi+result.regressionIntercept));ctx.stroke()
  result.readings.forEach((e,i)=>{ctx.fillStyle='#df233a';ctx.beginPath();ctx.arc(x(logs[i]),y(e),6,0,Math.PI*2);ctx.fill();ctx.fillStyle='#243943';ctx.textAlign=i===2?'right':'left';ctx.fillText(['Initial','+'+result.additionVolumesMl[0]+' mL','+'+(result.additionVolumesMl[0]+result.additionVolumesMl[1])+' mL total'][i],x(logs[i])+(i===2?-10:10),y(e)-12)})
  ctx.textAlign='center';ctx.fillText('log(F), F in mg/L',690,468);ctx.save();ctx.translate(375,290);ctx.rotate(-Math.PI/2);ctx.fillText('E (mV)',0,0);ctx.restore()
  ctx.fillStyle=result.slopePass?'#d2e5dc':'#efe0c4';ctx.fillRect(365,484,627,62);ctx.fillStyle='#173640';ctx.font='600 25px Arial';ctx.textAlign='left';ctx.fillText('Electrode slope: '+result.meanSlope.toFixed(1)+' mV/decade',380,512);ctx.font='18px Arial';ctx.fillText((result.slopePass?'Within method range':'Outside method range')+'  ·  −60.5 to −54.0 mV/decade',380,536);screenTexture.needsUpdate=true
 }
 function request(){if(!raf&&!disposed&&visible&&!document.hidden)raf=requestAnimationFrame(tick)}
 function tick(now){raf=0;if(disposed)return;const dt=last?Math.min(.05,(now-last)/1000):0;last=now;updateVisuals(dt);renderer.render(scene,camera);request()}
 function updateVisuals(dt){if(options.motion)clock+=dt
  if(approach){approach.elapsed+=dt;const t=Math.min(1,approach.elapsed/1.2),s=t*t*(3-2*t);camera.position.lerpVectors(approach.from,approach.position,s);controls.target.lerpVectors(approach.targetFrom,approach.target,s);if(t===1)approach=null}
  controls.update();const liquidHeight=.068*current.volumeMl/100,surfaceY=base+liquidHeight;liquid.scale.y=liquidHeight;liquid.position.y=base+liquidHeight/2;meniscus.position.y=surfaceY;bar.rotation.y=clock*4.4
  const transfer=current.active;pipette.visible=transfer;pipette.position.y=.215;for(let i=0;i<drops.length;i++){const o=drops[i];o.visible=current.flowing;const f=(clock*1.8+i/3)%1;o.position.set(.020,.170-(.170-surfaceY)*f*f,.012);o.scale.y=1+f*.5}
  ionGroup.visible=options.chemistry
  for(const item of ionObjects){const {group,text,index}=item;group.visible=index>=9||index<current.fluorideVisualCount;text.visible=options.labels&&(index===0||index>=9)
   const a=index*2.399+clock*.16,r=.014+(index%3)*.005;group.position.set(Math.cos(a)*r,base+.011+(index%4)*.008+Math.sin(clock*.65+index)*.0015,Math.sin(a)*r)
   if(index===0){const t=(clock*.09)%1;group.position.set(px+Math.sin(t*Math.PI*2)*.015,tipY-.002+Math.sin(t*Math.PI*2)*.005,pz+.008+Math.abs(Math.cos(t*Math.PI*2))*.012)}
  }
  const near=1-T.MathUtils.smoothstep(camera.position.distanceTo(new T.Vector3(0,.08,0)),.07,.25);glass.opacity=1-near*.85;solution.opacity=.26-near*.12
  electrodeLabel.visible=options.labels;doseLabel.visible=options.labels;selection.refresh(false);drawScreen()
 }
 const observer=new ResizeObserver(()=>{const w=host.clientWidth,h=host.clientHeight;if(w&&h){renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();request()}});observer.observe(host)
 const intersection=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible){last=0;request()}else{cancelAnimationFrame(raf);raf=0}});intersection.observe(host)
 const visibility=()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0}else{last=0;request()}};document.addEventListener('visibilitychange',visibility)
 const cancel=()=>{approach=null};controls.addEventListener('start',cancel)
 request()
 return {model,advance(dt){if(!visible)updateVisuals(dt)},update(value,settings){current=value;options=settings;request()},view,dispose(){disposed=true;cancelAnimationFrame(raf);observer.disconnect();intersection.disconnect();document.removeEventListener('visibilitychange',visibility);selection.dispose();controls.removeEventListener('start',cancel);controls.dispose();const geometries=new Set(),materials=new Set(),textures=new Set();scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material])if(m)materials.add(m)});for(const m of [...materials,...ionMaterials]){for(const v of Object.values(m))if(v?.isTexture)textures.add(v);m.dispose()}for(const g of geometries)g.dispose();for(const t of textures)t.dispose();environment.dispose();renderer.dispose();renderer.domElement.remove()}}
}
