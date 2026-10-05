import * as THREE from 'three'
import { mountFlyCamera } from './flyCamera.js'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { mountKFTeaching } from './teaching.js'
import { mountKFExperiment } from './experiment.js'
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js'

export function mountKFCell(root,{onModel}={}){
const $=id=>root.querySelector('#kf-'+id);

const teaching=mountKFTeaching(root);
const experiment=mountKFExperiment(root);
const stage=$('stage'),scene=new THREE.Scene(),model=new THREE.Group();scene.add(model);scene.background=new THREE.Color(0x142832);
// Keep refracted contents at full canvas resolution: downsampling blurs small grains and pins.
// Use native pixel density up to 2×; the single render loop avoids duplicate work.
const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setClearColor(0,0);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.transmissionResolutionScale=1;stage.append(renderer.domElement);$('loading').hidden=true;
const camera=new THREE.PerspectiveCamera(33,1,.1,100);let az=.12,el=.22,dist=19;
let fly=null;
const target=new THREE.Vector3(0,2.25,-.5);
// Reflections are local and procedural: no network-dependent HDR asset.
const studio=new RoomEnvironment(),pmrem=new THREE.PMREMGenerator(renderer);
const environment=pmrem.fromScene(studio,.035);scene.environment=environment.texture;scene.environmentIntensity=.85;studio.dispose();pmrem.dispose();
scene.add(new THREE.HemisphereLight(0xd8e9ff,0x26343b,.65));
const key=new THREE.DirectionalLight(0xfff2df,2.5);key.position.set(-3,7,5);key.castShadow=true;key.shadow.mapSize.set(1024,1024);Object.assign(key.shadow.camera,{left:-8,right:8,top:7,bottom:-7,near:.1,far:25});key.shadow.normalBias=.025;key.shadow.bias=-.0001;key.shadow.radius=3;scene.add(key);
const rim=new THREE.DirectionalLight(0xc4defd,1.4);rim.position.set(4,5,-3);scene.add(rim);
const groundGeometry=new THREE.PlaneGeometry(28,20),groundMaterial=new THREE.MeshStandardMaterial({color:0x09161b,roughness:.86});
const ground=new THREE.Mesh(groundGeometry,groundMaterial);ground.rotation.x=-Math.PI/2;ground.position.y=-.01;ground.receiveShadow=true;scene.add(ground);
const token=name=>{const el=document.createElement('span');el.style.color='var('+name+')';root.append(el);const color=getComputedStyle(el).color;el.remove();return new THREE.Color(color)};
const mats={};function material(name,color,extra={}){const m=new THREE.MeshStandardMaterial({color,roughness:.4,...extra});m.name=name;mats[name]=m;return m}
const glass=new THREE.MeshPhysicalMaterial({name:'Borosilicate glass',color:0xf1fcfa,metalness:0,roughness:.005,transmission:1,ior:1.47,thickness:.02,transparent:true,opacity:1,depthWrite:false,side:THREE.DoubleSide,envMapIntensity:.45});
mats.Glass=glass;
const edge=glass.clone();edge.name='Polished glass rim';edge.thickness=.075;edge.roughness=.005;
const pt=material('Platinum',0xc8cdd0,{metalness:1,roughness:.23});
const pale=material('PTFE / ceramic',0xe9e6db,{roughness:.36});
const cap=material('Electrode caps',0x24688a,{roughness:.32});
const baseMat=material('Stirrer housing',0x35434b,{metalness:.5,roughness:.31});
// The reagent uses a restrained transparent layer so nested glass does not hide it.
const amber=new THREE.MeshPhysicalMaterial({name:'KF reagent',color:0xd7b64b,transparent:true,opacity:.20,depthWrite:false,side:THREE.FrontSide,roughness:.12,metalness:0,ior:1.36,envMapIntensity:.45});
const red=material('Transfer fitting',0xb63b37,{roughness:.48});
const anodeMat=material('Red coded platinum anode',0xd32a2a,{metalness:.65,roughness:.28});
const cathodeMat=material('Blue coded platinum cathode',0x2169d5,{metalness:.65,roughness:.28});
const groups={};for(const id of ['vessel','liquid','generator','indicator','inlet','dryer','septum','stirrer']){const g=new THREE.Group();g.name=id;g.userData.part=id;groups[id]=g;model.add(g)}
function mesh(g,geo,mat,x=0,y=0,z=0){const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=!mat.transparent;m.receiveShadow=!mat.transparent;g.add(m);return m}
const cyl=(g,r,h,mat,x,y,z=0,open=false)=>mesh(g,new THREE.CylinderGeometry(r,r,h,48,1,open),mat,x,y,z);
function rod(g,a,b,r,mat){a=new THREE.Vector3(...a);b=new THREE.Vector3(...b);const m=cyl(g,r,a.distanceTo(b),mat,0,0);m.position.copy(a).add(b).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),b.sub(a).normalize());return m}
function ring(g,r,t,mat,x,y,z=0){const m=mesh(g,new THREE.TorusGeometry(r,t,8,64),mat,x,y,z);m.rotation.x=Math.PI/2;return m}
function tube(g,points,r,mat){const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));return mesh(g,new THREE.TubeGeometry(curve,40,r,10,false),mat)}
const shell=mesh(groups.vessel,new THREE.CylinderGeometry(1.22,1.22,2.5,64,1,true),glass,0,1.62);
cyl(groups.vessel,1.22,.07,glass,0,.37);ring(groups.vessel,1.22,.034,edge,0,.39);const vesselRim=ring(groups.vessel,1.22,.04,edge,0,2.87);
const lid=cyl(groups.vessel,1.2,.06,glass,0,2.89);
const liquid=cyl(groups.liquid,1.17,1.02,amber,0,.93);const surface=new THREE.Group();surface.position.y=1.44;groups.liquid.add(surface);
const meniscusMat=amber.clone();meniscusMat.opacity=.34;meniscusMat.roughness=.065;
const meniscusProfile=[new THREE.Vector2(0,0),new THREE.Vector2(1.10,0),new THREE.Vector2(1.145,.003),new THREE.Vector2(1.165,.012),new THREE.Vector2(1.175,.026)];
mesh(surface,new THREE.LatheGeometry(meniscusProfile,96),meniscusMat);liquid.renderOrder=2;surface.renderOrder=2;
const gen=groups.generator;gen.position.set(-.32,0,.10);
const generatorPick=mesh(gen,new THREE.CylinderGeometry(.34,.34,2.4,24),new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}),0,1.87);generatorPick.userData.pickGenerator=true;
cyl(gen,.32,2.38,glass,0,1.87,0,true);ring(gen,.32,.019,edge,0,.68);ring(gen,.32,.026,edge,0,3.06);
ring(gen,.24,.075,pale,0,3.12);ring(gen,.21,.047,pale,0,3.23);
for(const id of ['anode','cathode']){const g=new THREE.Group();g.name=id;g.userData.part=id;groups[id]=g;gen.add(g)}
const anode=groups.anode,cathode=groups.cathode;
// Flat, open platinum mesh at the foot of the glass tube. Red is schematic polarity coding.
ring(anode,.30,.012,anodeMat,0,.69);
for(let i=-7;i<=7;i++){const d=i*.038,l=Math.sqrt(.30*.30-d*d);rod(anode,[d,.69,-l],[d,.69,l],.007,anodeMat);rod(anode,[-l,.702,d],[l,.702,d],.007,anodeMat)}
rod(anode,[.285,.70,0],[.285,3.28,0],.019,anodeMat);
rod(cathode,[-.245,3.28,0],[-.245,1.01,0],.018,cathodeMat);
rod(cathode,[-.245,1.01,0],[-.11,.94,.035],.021,cathodeMat);
cyl(cathode,.059,.022,cathodeMat,-.095,.94,.035);
const diaphragm=new THREE.Group();diaphragm.name='Optional cathode compartment';cathode.add(diaphragm);
cyl(diaphragm,.115,.64,glass,-.16,1.17,0,true);cyl(diaphragm,.116,.07,pale,-.16,.85);ring(diaphragm,.116,.012,edge,-.16,1.49);cyl(diaphragm,.10,.35,amber,-.16,1.06);diaphragm.visible=false;
const ind=groups.indicator;ind.position.set(.60,0,.30);cyl(ind,.16,.22,pale,0,3.02);cyl(ind,.14,.26,cap,0,3.27);cyl(ind,.12,1.89,glass,0,1.97);
for(const x of [-.09,.09]){rod(ind,[x,3.13,.055],[x,.76,.055],.014,pt)}
const indicatorPick=mesh(ind,new THREE.CylinderGeometry(.19,.19,2.65,24),new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}),0,2.02);indicatorPick.userData.pickGenerator=true;
const transferMat=material('Brown transfer tubing',0x98603c,{roughness:.55});
const inlet=groups.inlet;rod(inlet,[-1.56,3.7,.05],[-.8,.60,.05],.027,glass);tube(inlet,[[-2.05,4.0,.05],[-1.74,3.9,.05],[-1.56,3.7,.05]],.044,transferMat);
// Raised glass sidearm surrounds the angled carrier-gas insertion needle.
const sidearmBase=new THREE.Vector3(-.94,1.94,.05),sidearmTop=new THREE.Vector3(-1.37,2.94,.05);
const sidearmAxis=sidearmTop.clone().sub(sidearmBase).normalize();
const sidearm=mesh(inlet,new THREE.LatheGeometry([...Array.from({length:41},(_,i)=>new THREE.Vector2(.24-(.24-.155)*Math.min(1,i/16),sidearmBase.distanceTo(sidearmTop)*i/40))],48),glass);
sidearm.position.copy(sidearmBase);
sidearm.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),sidearmAxis);
// Trim both intersecting surfaces to form one open, fused glass junction.
// This leaves no funnel wall or lower lip projecting into the vessel.
function clipSurface(geometry,keep){
  const g=geometry.index?geometry.toNonIndexed():geometry.clone(),a=g.attributes.position,vertices=[];
  const intersect=(a,b)=>{let lo=a.clone(),hi=b.clone(),positive=keep(lo)>=0;for(let j=0;j<24;j++){const m=lo.clone().add(hi).multiplyScalar(.5);if((keep(m)>=0)===positive)lo=m;else hi=m;}return lo.add(hi).multiplyScalar(.5);};
  for(let i=0;i<a.count;i+=3){const triangle=[0,1,2].map(j=>new THREE.Vector3().fromBufferAttribute(a,i+j));let polygon=[];
    for(let j=0;j<3;j++){const p=triangle[j],q=triangle[(j+1)%3],inside=keep(p)>=0,next=keep(q)>=0;if(inside)polygon.push(p);if(inside!==next)polygon.push(intersect(p,q));}
    for(let j=1;j<polygon.length-1;j++)for(const v of [polygon[0],polygon[j],polygon[j+1]])vertices.push(v.x,v.y,v.z);
  }
  g.dispose();const result=new THREE.BufferGeometry();result.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));result.computeVertexNormals();return result;
}
const neckLength=sidearmBase.distanceTo(sidearmTop);
function outsideNeck(p){const v=p.clone().sub(sidearmBase),t=v.dot(sidearmAxis);if(t<0||t>neckLength)return 1;const r=.24-.085*Math.min(1,t/(neckLength*.4));return v.addScaledVector(sidearmAxis,-t).length()-r;}
function vesselGeometry(cut){const profile=[[1.185,-1.25],[1.212,-1.238],[1.22,-1.21],[1.22,1.21],[1.217,1.243],[1.20,1.255],[1.182,1.243],[1.18,1.21],[1.18,-1.18],[1.17,-1.21]];const raw=new THREE.LatheGeometry(profile.map(p=>new THREE.Vector2(...p)),128,cut?Math.PI/2:0,cut?Math.PI:Math.PI*2);const result=clipSurface(raw,p=>outsideNeck(p.clone().add(new THREE.Vector3(0,1.62,0))));raw.dispose();return result;}
sidearm.updateMatrix();sidearm.geometry.applyMatrix4(sidearm.matrix);sidearm.position.set(0,0,0);sidearm.quaternion.identity();
const neckRaw=sidearm.geometry;sidearm.geometry=clipSurface(neckRaw,p=>Math.hypot(p.x,p.z)-1.22);neckRaw.dispose();
vesselRim.updateMatrix();vesselRim.geometry.applyMatrix4(vesselRim.matrix);vesselRim.position.set(0,0,0);vesselRim.rotation.set(0,0,0);
const rimRaw=vesselRim.geometry;vesselRim.geometry=clipSurface(rimRaw,outsideNeck);rimRaw.dispose();
const sidearmLip=mesh(inlet,new THREE.TorusGeometry(.155,.022,10,40),edge);
sidearmLip.position.copy(sidearmTop);sidearmLip.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),sidearmAxis);
const seal=mesh(inlet,new THREE.CylinderGeometry(.17,.17,.12,40),red);
seal.position.copy(sidearmTop).addScaledVector(sidearmAxis,.05);seal.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),sidearmAxis);
const dry=groups.dryer;gen.add(dry);dry.position.set(0,0,0);
cyl(dry,.118,1.65,glass,0,2.52,0,true);ring(dry,.118,.012,edge,0,1.695);ring(dry,.118,.018,edge,0,3.345);
cyl(dry,.116,.035,pale,0,1.70);ring(dry,.15,.037,pale,0,3.31);cyl(dry,.13,.075,pale,0,3.40);
// Shared, instanced grains provide variation without a draw call per particle.
function granules(parent,count,mat,place){
 const geometry=new THREE.IcosahedronGeometry(1,2);
 const position=geometry.attributes.position;
 for(let i=0;i<position.count;i++){const v=new THREE.Vector3().fromBufferAttribute(position,i);v.multiplyScalar(1+.06*Math.sin(v.x*21+v.y*17+v.z*13));position.setXYZ(i,v.x,v.y,v.z);}geometry.computeVertexNormals();
 const grains=new THREE.InstancedMesh(geometry,mat,count),dummy=new THREE.Object3D();
 for(let i=0;i<count;i++){place(dummy,i);dummy.rotation.set(i*1.31,i*2.17,i*.73);dummy.updateMatrix();grains.setMatrixAt(i,dummy.matrix);grains.setColorAt(i,new THREE.Color().setScalar(.72+.28*((i*37%101)/100)));}
 grains.castShadow=true;grains.receiveShadow=true;parent.add(grains);return grains;
}
const sieveMat=material('Matte mineral sieve',0xb7a889,{roughness:.94});
granules(dry,260,sieveMat,(o,i)=>{const layer=Math.floor(i/5),a=i*2.399,r=.070*Math.sqrt((i%5+.5)/5);o.position.set(r*Math.cos(a),1.744+layer*.030,r*Math.sin(a));const size=.021+(i%7)*.001;o.scale.set(size,size*.85,size*.95);});
const sept=groups.septum;sept.position.set(-.65,0,-.6);cyl(sept,.14,.2,glass,0,3.0);cyl(sept,.18,.12,pale,0,3.15);cyl(sept,.12,.025,red,0,3.224);
const stir=groups.stirrer;mesh(stir,new THREE.CylinderGeometry(1.47,1.51,.27,64),baseMat,0,.14);ring(stir,1.4,.02,pt,0,.285);
const bar=new THREE.Group();bar.name='PTFE magnetic stir bar';stir.add(bar);bar.position.set(0,.49,0);rod(bar,[-.32,0,0],[.32,0,0],.07,pale);for(const x of [-.32,.32])mesh(bar,new THREE.SphereGeometry(.07,16,10),pale,x,0,0);ring(bar,.078,.012,pale,0,0).rotation.z=Math.PI/2;
const knob=cyl(stir,.12,.11,cap,.67,.14,1.32);knob.rotation.x=Math.PI/2;
const argonBubbleMat=material('Argon bubbles',0xd9dfdb,{roughness:.3,transparent:true,opacity:.82});
// Hydrogen is shown by the cathode reaction animation; no duplicate bubble emitter.
const bubbles=[];for(let i=0;i<12;i++){const m=mesh(groups.inlet,new THREE.SphereGeometry(.021+(i%3)*.006,10,8),argonBubbleMat,-.8,.64+i*.055,.05);bubbles.push(m)}

// Background apparatus and teaching overlays are independently collapsible.
const background=new THREE.Group(),annotations=new THREE.Group(),electronOverlay=new THREE.Group(),gasOverlay=new THREE.Group();
model.add(background,annotations,electronOverlay,gasOverlay);
const labelTextures=[];
function label(text,x,y,z,color='#d9e8ea',width=2.2,parent=annotations){
  const c=document.createElement('canvas');c.width=text.startsWith('Pt')?128:640;c.height=96;
  const ctx=c.getContext('2d');ctx.fillStyle='#10232bee';ctx.fillRect(0,0,640,96);ctx.fillStyle=color;ctx.font='bold 32px sans-serif';ctx.textAlign='center';ctx.fillText(text,c.width/2,60);
  const texture=new THREE.CanvasTexture(c);labelTextures.push(texture);
  const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,depthTest:false}));sprite.position.set(x,y,z);sprite.scale.set(width,width*96/c.width,1);parent.add(sprite);return sprite;
}
const housing=material('Instrument housing',0x345451,{roughness:.55}),screenMat=material('Coulometer screen',0x163735,{emissive:0x4fba90,emissiveIntensity:.35});
// Separate stations: heated vial left, cell centre, coulometer right/rear.
const vialGroup=new THREE.Group(),coulometerGroup=new THREE.Group(),computerGroup=new THREE.Group();
for(const [g,name,action]of [[vialGroup,'vial','vial'],[coulometerGroup,'coulometer','instrument'],[computerGroup,'computer','computer']]){g.name=name;g.userData.action=action;background.add(g);}
const rubber=material('Support feet rubber',0x182024,{roughness:.88});
for(const x of [-4.53,-3.27])for(const z of [-1.65,-.75]){cyl(background,.075,.46,baseMat,x,.28,z);cyl(background,.095,.06,rubber,x,.02,z);}
mesh(background,new THREE.BoxGeometry(1.7,.22,1.3),housing,-3.9,.62,-1.2);
mesh(background,new THREE.BoxGeometry(1.5,.05,1.1),pt,-3.9,.76,-1.2);
cyl(vialGroup,.42,1.35,glass,-3.9,1.46,-1.2);
cyl(vialGroup,.42,.045,glass,-3.9,.805,-1.2);
ring(vialGroup,.42,.02,edge,-3.9,.83,-1.2);
cyl(vialGroup,.44,.15,cap,-3.9,2.18,-1.2);
cyl(vialGroup,.31,.035,pale,-3.9,2.27,-1.2);
const vialPick=cyl(vialGroup,.43,1.45,new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}),-3.9,1.49,-1.2);vialPick.userData.pickGenerator=true;
const powderMat=material('Prepared sample powder',0x64a84c,{roughness:.95});
const powder=new THREE.Group();powder.name='SamplePowder';vialGroup.add(powder);
granules(powder,420,powderMat,(o,i)=>{const a=i*2.399,r=.34*Math.sqrt((i+.5)/420),size=.017+(i%11)*.0012;o.position.set(-3.9+r*Math.cos(a),.837+.052*(1-r/.34)+(i%5)*.006,-1.2+r*Math.sin(a));o.scale.set(size,size*.7,size*1.1);});
// Long supply lumen and short return lumen pierce the same vial septum.
rod(background,[-3.98,2.85,-1.2],[-3.98,1.85,-1.2],.035,pt);
rod(background,[-3.80,2.65,-1.2],[-3.80,1.96,-1.2],.035,pt);
mesh(coulometerGroup,new THREE.BoxGeometry(1.55,.12,1.12),baseMat,3.7,.07,-1.8);
mesh(coulometerGroup,new THREE.BoxGeometry(.9,1.08,.65),housing,3.7,.66,-1.8);
mesh(coulometerGroup,new THREE.BoxGeometry(2.5,1.9,1),housing,3.7,2.15,-1.8);
const displayTexture=new THREE.CanvasTexture(experiment.canvas);displayTexture.colorSpace=THREE.SRGBColorSpace;displayTexture.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());labelTextures.push(displayTexture);
const displayMat=new THREE.MeshBasicMaterial({map:displayTexture});
const computerTexture=new THREE.CanvasTexture(experiment.computerCanvas);computerTexture.colorSpace=THREE.SRGBColorSpace;computerTexture.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());labelTextures.push(computerTexture);const computerMat=new THREE.MeshBasicMaterial({map:computerTexture});
mesh(coulometerGroup,new THREE.PlaneGeometry(2.24,1.4),displayMat,3.7,2.28,-1.285).name="CoulometerDisplay";
const startButton=mesh(coulometerGroup,new THREE.BoxGeometry(.65,.23,.08),material('Start button',0x47cc91,{emissive:0x246a45,emissiveIntensity:.3}),3.7,1.37,-1.25);startButton.userData.action='start';
startButton.name='StartButton';label('START',3.7,1.37,-1.19,'#ffffff',.58,coulometerGroup);
mesh(computerGroup,new THREE.BoxGeometry(3,2,.18),housing,6.4,3.2,-2.8);
mesh(computerGroup,new THREE.PlaneGeometry(2.8,1.75),computerMat,6.4,3.2,-2.69).name="ComputerDisplay";
rod(computerGroup,[6.4,.10,-2.8],[6.4,2.3,-2.8],.11,baseMat);
mesh(computerGroup,new THREE.BoxGeometry(1.35,.10,.85),baseMat,6.4,.04,-2.65);
tube(background,[[4.25,1.18,-1.8],[5,1,-2.3],[6.4,1.6,-2.8]],.025,baseMat);
for(const [x,mat] of [[3.1,anodeMat],[3.65,cathodeMat],[4.25,baseMat]])rod(background,[x,2.2,-2.25],[x,2.2,-2.48],.075,mat);
label('COULOMETER',3.7,3,-1.4,'#d2eee4',2.2);label('HEATER + SAMPLE VIAL',-3.9,.35,-.9,'#efc57b',2.6);
label('ANODE (+)',.8,.7,.6,'#ff8279',1.45);label('CATHODE (−)',-1.2,1.02,.4,'#75b9ff',1.6);
label('Indicator',1.25,3.2,.35,'#cbd8df',1.2);

const flows=[];
function route(points,mat,parent,flowColor,drawLine=true,straight=false){
  const vectors=points.map(p=>new THREE.Vector3(...p));
  const curve=straight?new THREE.CurvePath():new THREE.CatmullRomCurve3(vectors);
  if(straight)for(let i=1;i<vectors.length;i++)curve.add(new THREE.LineCurve3(vectors[i-1],vectors[i]));
  if(drawLine)mesh(background,new THREE.TubeGeometry(curve,90,.022,8,false),mat);
  const markers=[];
  for(let i=0;i<(drawLine?3:2);i++){
    const marker=mesh(parent,new THREE.ConeGeometry(.055,.15,10),new THREE.MeshBasicMaterial({color:flowColor}));markers.push(marker);
  }
  flows.push({curve,markers,electron:parent===electronOverlay});
}
// Markers follow the original internal conductors exactly; no second wire.
route([[-.035,.70,.1],[-.035,3.28,.1]],anodeMat,electronOverlay,0xffb4ac,false,true);
route([[-.035,3.28,.1],[.3,3.9,-.2],[2.2,3.7,-2.6],[3.1,2.7,-2.6],[3.1,2.2,-2.48]],anodeMat,electronOverlay,0xffb4ac);
route([[3.65,2.2,-2.48],[3.65,2.9,-2.8],[1.9,4.2,-2.8],[-.8,4,-.2],[-.565,3.28,.1]],cathodeMat,electronOverlay,0x9cd5ff);
route([[-.565,3.28,.1],[-.565,1.01,.1],[-.43,.94,.135]],cathodeMat,electronOverlay,0x9cd5ff,false,true);
tube(background,[[.6,3.43,.3],[1.2,3.75,-.3],[4.7,3.5,-2.8],[4.25,2.7,-2.8],[4.25,2.2,-2.48]],.023,baseMat);
const argonGroup=new THREE.Group();argonGroup.name='argon';argonGroup.userData.part='argon';background.add(argonGroup);
const cylinderMat=material('Argon cylinder',0x49676e,{metalness:.55,roughness:.32});
cyl(argonGroup,.405,.135,rubber,-6.1,.0575,-1.2);
cyl(argonGroup,.40,2.25,cylinderMat,-6.1,1.25,-1.2);mesh(argonGroup,new THREE.SphereGeometry(.40,32,16),cylinderMat,-6.1,2.36,-1.2);cyl(argonGroup,.18,.35,pt,-6.1,2.73,-1.2);
rod(argonGroup,[-6.1,2.9,-1.2],[-5.55,2.9,-1.2],.075,pt);ring(argonGroup,.16,.035,anodeMat,-6.1,2.94,-1.2);
for(const x of [-6.25,-5.80]){const g=cyl(argonGroup,.17,.08,pt,x,3.15,-1.05);g.rotation.x=Math.PI/2;const face=cyl(argonGroup,.145,.085,pale,x,3.15,-1.045);face.rotation.x=Math.PI/2;rod(argonGroup,[x,3.15,-.99],[x+.07,3.23,-.99],.009,baseMat);}
rod(argonGroup,[-5.55,2.9,-1.2],[-5.3,3,-1.2],.045,transferMat);label('Ar',-6.1,1.5,-.77,'#ffffff',.65,argonGroup);
const gasMat=transferMat;
route([[-5.3,3,-1.2],[-4.4,3,-1.2],[-3.98,2.85,-1.2]],gasMat,gasOverlay,0xffe78d);
route([[-3.98,2.85,-1.2],[-3.98,1.85,-1.2]],gasMat,gasOverlay,0xffe78d,false,true);
route([[-3.80,1.96,-1.2],[-3.80,2.65,-1.2]],gasMat,gasOverlay,0xffe78d,false,true);
route([[-3.80,2.65,-1.2],[-3.3,3.9,-1.2],[-2.05,4,.05]],gasMat,gasOverlay,0xffe78d);
// Route inside the existing glass transfer needle, without an offset duplicate.
route([[-2.05,4,.05],[-1.74,3.9,.05],[-1.56,3.7,.05],[-.8,.60,.05]],gasMat,gasOverlay,0xffe78d,false,true);
label('Dry Ar ↓ long needle',-4.1,3.5,-1,'#ffe78d',2.5);
label('Ar + water vapour → cell',-2.6,4.35,0,'#ffe78d',2.8);
function flowFrame(){
  for(const {curve,markers,electron} of flows)markers.forEach((m,i)=>{const t=((electron?electronPhase:phase*.045)+i/markers.length)%1;m.position.copy(curve.getPointAt(t));m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),curve.getTangentAt(t));});
}
function additions(){
  const assembled=+$('explode').value===0;
  background.visible=$('background').checked;
  annotations.visible=$('labels').checked&&assembled;
  electronOverlay.visible=$('electrons').checked&&assembled;
  gasOverlay.visible=$('gas').checked&&assembled&&experiment.run.status==='running';
  // The extra leads are drawn in assembly coordinates; hide while exploded.
  draw();
}
let focusedElectrode=null;
function focusElectrode(part){
  focusedElectrode=part;
  target.set(part==='indicator'?.6:-.32,part==='indicator'?.90:1.07,part==='indicator'?.355:.1);
  dist=part==='indicator'?2.5:3.6;az=0;el=.10;
  $('view-status').textContent=part==='indicator'?'Indicator · Pt+ left / Pt− right · square reaction path · schematic':'Generator · red anode (+), blue cathode (−)';
  draw();
}
function fullSetup(){focusedElectrode=null;$('background').checked=true;$('explode').value=0;$('part').value='all';apply();additions();target.set(.6,2.25,-.5);dist=21;az=.12;el=.22;$('view-status').textContent='Click an electrode to zoom; click the vial or an instrument to interact.';draw();}
function openReactions(){const p=$('part').value;if(p==='indicator')focusElectrode('indicator');else if(['generator','anode','cathode','dryer'].includes(p))focusElectrode('generator');}

const offsets={generator:[-.6,.7,0],anode:[.40,0,0],cathode:[-.40,0,0],indicator:[.7,.85,.1],dryer:[0,1.5,0],septum:[-.3,.7,-.4],inlet:[-.5,.2,0],vessel:[0,0,0],liquid:[0,0,0],stirrer:[0,0,0]};
for(const g of Object.values(groups))g.userData.home=g.position.clone();
const details={all:'Schematisk modell för metodillustration — ej måttriktig. ',generator:'Generatorelektrod: Pt-anodnät och katod. ',indicator:'Indikatorelektrod: två separata Pt-spetsar för ändpunktsindikering.',inlet:'Gasledning från ugnen genom en upphöjd, vinklad glashals med tätning; nålens utlopp ligger under reagensytan. Bubblor visas schematiskt.',anode:'Anod (+): rött, plant platinanät vid glasrörets botten. Jodid oxideras till jod.',cathode:'Katod (−): mindre blå elektrod ovanför anodnätet. Reduktion och H₂-bildning.',dryer:'Insättbart torkrör av glas med molekylsikt, inuti generatorelektroden.',septum:'Septumport för provtillsats.',stirrer:'PTFE-belagd magnetstav på kärlets botten, driven av magnetomröraren under cellen.',vessel:'Glaskärl med separata anslutningar. Genomskärningen öppnar den främre halvan.',liquid:'Reagensnivå och färg är illustrativa; ingen koncentration eller vattenhalt beräknas.'};
let closeScene=new THREE.Group(),closePlaying=true,closePhase=0;
const reactionResources=[],actors={},overviewActors={};
const reactionOverlay=new THREE.Group();model.add(reactionOverlay);
const indicatorPolarity=new THREE.Group();model.add(indicatorPolarity);
label('Pt+',.51,.88,.43,'#f4faf8',.17,indicatorPolarity);label('Pt−',.69,.88,.43,'#f4faf8',.17,indicatorPolarity);indicatorPolarity.visible=false;
function reactionParticle(name,text,color,r=.055){
  const group=new THREE.Group();closeScene.add(group);
  const geo=new THREE.SphereGeometry(r,20,12),mat=new THREE.MeshStandardMaterial({color,roughness:.35});
  reactionResources.push(geo,mat);group.add(new THREE.Mesh(geo,mat));
  const c=document.createElement('canvas');c.width=192;c.height=96;
  const ctx=c.getContext('2d');ctx.font='bold 54px sans-serif';ctx.textAlign='center';ctx.fillStyle='#f4faf8';ctx.shadowColor='#071419';ctx.shadowBlur=0;ctx.fillStyle='#071820e8';ctx.beginPath();ctx.roundRect(10,8,172,80,16);ctx.fill();ctx.fillStyle='#ffffff';ctx.fillText(text,96,67);
  const tex=new THREE.CanvasTexture(c),sm=new THREE.SpriteMaterial({map:tex,depthTest:false});reactionResources.push(tex,sm);
  const caption=new THREE.Sprite(sm);caption.scale.set(.18,.09,1);caption.position.y=r+.05;group.add(caption);
  actors[name]=group;return group;
}
function initializeReactions(){
    for(let i=0;i<2;i++){
      const generatorIon=reactionParticle('iodide'+i,'I −',0xe34235);generatorIon.children.filter(c=>c.isSprite).forEach(c=>{c.scale.set(.24,.12,1);c.position.x=(i-.5)*.12;});
      reactionParticle('proton'+i,'BH⁺',0x79b7d1,.042);
      reactionParticle('base'+i,'B',0x9ed2a5,.04);
      reactionParticle('anodeE'+i,'e⁻',0xffdfa1,.022);
      reactionParticle('cathodeE'+i,'e⁻',0xffdfa1,.022);
    }
    const iodine=reactionParticle('iodine','I₂',0xa63e26,.047);
    const iodineGeo=new THREE.SphereGeometry(.047,20,12);reactionResources.push(iodineGeo);
    const partner=new THREE.Mesh(iodineGeo,iodine.children[0].material);partner.position.x=.074;iodine.add(partner);
    const hydrogen=reactionParticle('hydrogen','H₂',0x79bb8d,.029);
    const hGeo=new THREE.SphereGeometry(.029,16,10);reactionResources.push(hGeo);
    const hPartner=new THREE.Mesh(hGeo,hydrogen.children[0].material);hPartner.position.x=.043;hydrogen.add(hPartner);
    for(let i=0;i<2;i++){
      reactionParticle('indIn'+i,'I −',0xe34235,.018);
      reactionParticle('indOut'+i,'I −',0xe34235,.018);
      const mol=reactionParticle('indI2'+i,'I₂',0xa63e26,.018);
      const geo=new THREE.SphereGeometry(.018,16,10);reactionResources.push(geo);
      const atom=new THREE.Mesh(geo,mol.children[0].material);atom.position.x=.029;mol.add(atom);
      mol.children.filter(c=>c.isSprite).forEach(c=>c.scale.set(.10,.05,1));
      for(const name of ['indIn'+i,'indOut'+i])actors[name].children.filter(c=>c.isSprite).forEach(c=>c.scale.set(.18,.09,1));
    }
    for(const [name,actor] of Object.entries(actors)){
      const copy=actor.clone(true);copy.traverse(o=>{o.raycast=()=>{};});reactionOverlay.add(copy);overviewActors[name]=copy;
    }
  closePhase=0;renderCloseup(0);
}
function renderCloseup(dt){

  if(closePlaying)closePhase=(closePhase+dt)%7;
  teaching.frame(closePhase);
  const u=closePhase,approach=Math.min(1,u/2),release=Math.max(0,Math.min(1,(u-3)/3));
  const mode=$('reaction-mode').value,showAnode=mode!=='cathode',showCathode=mode!=='anode';
  for(let i=0;i<2;i++){
    const ion=actors['iodide'+i];ion.visible=showAnode&&u<2.5;
    ion.position.set(-.40+i*.10-(1-approach)*(.35+i*.10),.73-(1-approach)*(.10+i*.10),.28);
    const proton=actors['proton'+i];proton.visible=showCathode&&u<2.5;
    proton.position.set(-.43-(1-approach)*(.28+i*.17),.98+(1-approach)*(.16+i*.13),.24);
    const base=actors['base'+i];base.visible=showCathode&&u>=3;
    base.position.set(-.43-release*(.22+i*.14),.98+release*(.13+i*.12),.24);
    const ae=actors['anodeE'+i];ae.visible=showAnode&&u>=2&&u<4.5;
    ae.position.set(-.035,.72+Math.max(0,(u-2)*.35-i*.09),.13);
    const ce=actors['cathodeE'+i];ce.visible=showCathode&&u<2.5;
    const down=Math.min(1,(u+i*.22)/2);
    ce.position.set(-.565+Math.max(0,down-.85)/.15*.135,1.60-down*.66,.135);
  }
  actors.iodine.visible=showAnode&&u>=3;actors.iodine.position.set(-.40-release*.35,.73-release*.18,.28);
  actors.hydrogen.visible=showCathode&&u>=3;actors.hydrogen.position.set(-.415,.98+release*.48,.22);
  $('reaction-step').textContent=u<2?'I⁻ approaches the red mesh; BH⁺ and electrons approach the blue cathode.':u<3?'Electron transfer at the electrode surfaces.':'I₂ moves down into the reagent (see the solution-reaction pane); B and H₂ form at the cathode, and H₂ rises.';
  indicatorPolarity.visible=false;
  const q=u/7;
  // The same two iodine atoms complete the entire loop, without swapping particles.
  const oxidized=q>=.25&&q<.5;
  let ix,iy;
  if(q<.25){ix=.51;iy=.53+q*4*.23;}
  else if(q<.5){ix=.51+(q-.25)*4*.18;iy=.76;}
  else if(q<.75){ix=.69;iy=.76-(q-.5)*4*.23;}
  else {ix=.69-(q-.75)*4*.18;iy=.53;}
  for(let i=0;i<2;i++){
    const atom=actors['indIn'+i];atom.visible=true;
    atom.position.set(ix+(i-.5)*(oxidized?.029:.085),iy,.40);
    atom.children[0].material.color.setHex(oxidized?0xa63e26:0xe34235);
    atom.children.filter(c=>c.isSprite).forEach(c=>{c.visible=!oxidized;c.position.x=(i-.5)*.045;});
    actors['indOut'+i].visible=false;
    const molecule=actors['indI2'+i];molecule.visible=oxidized&&i===0;
    molecule.children.filter(c=>c.isMesh).forEach(c=>c.visible=false);
    molecule.position.set(ix,iy,.40);
  }
  $('indicator-status').textContent=`Simulated indicator ${experiment.run.voltage.toFixed(1)} mV · generator ${experiment.run.current.toFixed(2)} mA · teaching particles are not quantitative.`;
  reactionOverlay.visible=$('surface-reactions').checked&&+$('explode').value===0;
  for(const [name,actor] of Object.entries(actors)){
    const copy=overviewActors[name];copy.position.copy(actor.position);copy.visible=actor.visible;actor.children.forEach((child,i)=>{copy.children[i].visible=child.visible;copy.children[i].position.copy(child.position);});
  }
}
$('inspect-generator').onclick=()=>focusElectrode('generator');
$('inspect-indicator').onclick=()=>focusElectrode('indicator');
$('full-setup').onclick=fullSetup;
$('surface-reactions').onchange=()=>{renderCloseup(0);draw();};
$('reaction-mode').onchange=()=>renderCloseup(0);
$('reaction-play').onclick=()=>{closePlaying=!closePlaying;$('reaction-play').textContent=closePlaying?'Pause reactions':'Play reactions';};
let playing=true,phase=0,electronPhase=0,last=null;
function save(){}
function apply(){setElectrodeHover(null);diaphragm.visible=$('dia').checked;const cut=$('cut').checked;shell.geometry.dispose();shell.geometry=vesselGeometry(cut);lid.visible=!cut;
const ex=+$('explode').value/100;for(const [id,g]of Object.entries(groups)){g.position.copy(g.userData.home).addScaledVector(new THREE.Vector3(...offsets[id]),ex)}
const h=2.44*+$('level').value/100;liquid.scale.y=h/1.02;liquid.position.y=.41+h/2;surface.position.y=.41+h;
$('explode-value').textContent=$('explode').value+'%';$('level-value').textContent=$('level').value+'%';$('speed-value').textContent=$('speed').value+'×';
const part=$('part').value;
$('detail').textContent=details[part]+(['all','generator'].includes(part)?(diaphragm.visible?'Med diafragma: separat katodrum och porös avskiljare.':'Utan diafragma: gemensam reagenslösning.'):'');draw()}
// Presentation only: a continuous camera-proximity blend; no simulation state is written.
function chemistryFocus(){
  const centre=new THREE.Vector3(0,1.55,0);
  const near=1-THREE.MathUtils.smoothstep(camera.position.distanceTo(centre),2.2,6.5);
  const aimed=1-THREE.MathUtils.smoothstep(target.distanceTo(centre),1.8,3.2);
  const amount=near*aimed;
  glass.opacity=1-.78*amount;edge.opacity=1-.60*amount;
  glass.envMapIntensity=.45*(1-.75*amount);edge.envMapIntensity=.45*(1-.75*amount);
  amber.opacity=.20-.10*amount;meniscusMat.opacity=.34-.18*amount;
  amber.color.setHex(0xd7b64b).lerp(new THREE.Color(0xb8b49b),amount*.65);meniscusMat.color.copy(amber.color);
  pale.color.setHex(0xe9e6db).lerp(new THREE.Color(0xb6b9b5),amount*.65);
  renderer.toneMappingExposure=1.05-.15*amount;
  reactionOverlay.traverse(o=>{
    if(o.isMesh){
      o.renderOrder=amount>.05?10:0;o.material.transparent=true;o.material.depthWrite=false;
      o.material.depthTest=amount<.2;
      if(o.material.emissive){o.material.emissive.copy(o.material.color);o.material.emissiveIntensity=amount*.9;}
    }
    if(o.isSprite){
      o.renderOrder=20;o.material.toneMapped=false;
      if(!o.userData.focusScale)o.userData.focusScale=o.scale.clone();
      o.scale.copy(o.userData.focusScale).multiplyScalar(1+.25*amount);
    }
  });
  for(const flow of flows)for(const arrow of flow.markers){arrow.renderOrder=amount>.05?11:0;arrow.material.depthTest=amount<.2;arrow.material.transparent=true;arrow.material.depthWrite=false;}
  stage.dataset.chemistryFocus=amount.toFixed(3);
}
// Input events update state; the shared animation loop renders once per frame.
function draw(){}
function renderFrame(){if(!stage.getClientRects().length)return;if(!fly?.active){const ex=+$('explode').value/100,d=dist+ex*1.4,t=target.clone();t.y+=ex*.35;camera.position.set(t.x+d*Math.cos(el)*Math.sin(az),t.y+d*Math.sin(el),t.z+d*Math.cos(el)*Math.cos(az));camera.lookAt(t);}chemistryFocus();renderer.render(scene,camera)}
const resize=new ResizeObserver(()=>{const w=stage.clientWidth,h=stage.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();draw()});resize.observe(stage);
for(const id of ['dia','cut','part','explode','level','speed'])$(id).addEventListener('input',()=>{apply();additions();if(id==='part')openReactions();save()});
for(const id of ['background','labels','electrons','gas'])$(id).addEventListener('input',additions);
// Panel collapse is independent of apparatus visibility and camera state.
$('additions').addEventListener('toggle',()=>draw());
function animate(t){
  const dt=last===null?0:Math.min(.1,Math.max(0,(t-last)/1000));last=t;
  if(document.hidden)return;
  fly?.frame(dt);
  experiment.frame(dt);
  const run=experiment.run;
  if(displayTexture.userData?.revision!==experiment.revision){displayTexture.needsUpdate=true;computerTexture.needsUpdate=true;displayTexture.userData={revision:experiment.revision};}
  const progress=1-run.solid/run.total;
  powder.visible=!run.vial.blank;
  powderMat.color.setHex(run.vial.color);
  if(run.vial.orange)powderMat.color.lerp(new THREE.Color(0xd56620),progress);
  powderMat.emissive.copy(powderMat.color);powderMat.emissiveIntensity=run.vial.glow?.18:0;
  gasOverlay.visible=$('gas').checked&&+$('explode').value===0&&run.status==='running';
  renderCloseup(dt);
  if(!playing){renderFrame();return;}
  phase+=dt*+$('speed').value*4;
  // Visual rate compression preserves a legible idle-to-peak change without changing the solver.
  const electronRate=Math.min(.5,.012+.11*Math.sqrt(Math.max(0,run.rate-run.baseline)/100));
  electronPhase=(electronPhase+dt*+$('speed').value*electronRate)%1;
  bar.rotation.y=phase;flowFrame();
  for(let i=0;i<bubbles.length;i++){
    const p=(phase*.16+i/12)%1;
    bubbles[i].position.set(-.8+.035*Math.sin(i+phase),.64+p*(liquid.position.y+liquid.scale.y*.51-.66),.05+.025*Math.cos(i+phase));
    bubbles[i].visible=$('explode').value<40&&run.status==='running';
  }
  $('motion').textContent='Running · '+(phase/4).toFixed(1)+' animation s';
  renderFrame();
}
$('play').onclick=()=>{playing=!playing;last=null;$('play').textContent=playing?'Pause animation':'Start animation';$('play').setAttribute('aria-pressed',String(playing));$('motion').textContent=playing?'Running':'Paused';};
renderer.setAnimationLoop(animate);
$('front').onclick=()=>{az=0;el=.03;dist=$('background').checked?21:10.3;draw();save()};$('angle').onclick=()=>{az=.48;el=.30;dist=$('background').checked?21:10.3;draw();save()};
// Clone only hovered materials, preserving original colours and selection highlights.
let hoveredElectrode=null;
const hoverMaterials=[];
function setElectrodeHover(group){
  if(group===hoveredElectrode)return;
  for(const {object,original,highlight} of hoverMaterials){object.material=original;highlight.dispose();}
  hoverMaterials.length=0;hoveredElectrode=group;
  if(group)group.traverse(object=>{
    if(!object.isMesh||object.userData.pickGenerator||!object.material.emissive)return;
    const original=object.material,highlight=original.clone();
    highlight.emissive.copy(original.color);highlight.emissiveIntensity=Math.max(original.emissiveIntensity||0,.42);
    if(original.transparent)highlight.opacity=Math.min(.65,original.opacity+.12);
    object.material=highlight;hoverMaterials.push({object,original,highlight});
  });
  renderer.domElement.style.cursor=group?'pointer':'grab';
  stage.dataset.hoveredElectrode=group?.name||'';
  draw();
}
function hoverElectrode(event){
  const rect=renderer.domElement.getBoundingClientRect(),ray=new THREE.Raycaster();
  ray.setFromCamera(new THREE.Vector2((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1),camera);
  const interactive=[gen,ind,vialGroup,coulometerGroup,computerGroup,argonGroup];
  const hit=ray.intersectObjects(interactive,true).find(h=>{
    if(!h.object.isMesh||(!h.object.userData.pickGenerator&&(h.object.material.transmission>0||h.object.material.opacity<=.3)))return false;
    let p=h.object;while(p&&p!==model){if(!p.visible)return false;p=p.parent;}return true;
  });
  let group=null;if(hit){let p=hit.object;while(p&&p!==model){if(interactive.includes(p)){group=p;break;}p=p.parent;}}
  setElectrodeHover(group);
}
renderer.domElement.addEventListener('pointerleave',()=>setElectrodeHover(null));
let clickTimer=null,drag=null;renderer.domElement.addEventListener('pointerdown',e=>{if(fly?.active)return;setElectrodeHover(null);drag={x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY};renderer.domElement.setPointerCapture(e.pointerId)});
renderer.domElement.addEventListener('pointermove',e=>{if(fly?.active)return;if(!drag){hoverElectrode(e);return;}az-=(e.clientX-drag.x)*.009;el=Math.max(-.35,Math.min(1.3,el+(e.clientY-drag.y)*.008));drag.x=e.clientX;drag.y=e.clientY;draw()});
renderer.domElement.addEventListener('pointerup',e=>{
 if(fly?.active)return;
 if(!drag)return;
 if(Math.hypot(e.clientX-drag.startX,e.clientY-drag.startY)<5){
  const rect=renderer.domElement.getBoundingClientRect(),ray=new THREE.Raycaster();
  ray.setFromCamera(new THREE.Vector2((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1),camera);
  const hit=ray.intersectObject(model,true).find(h=>{if(!h.object.isMesh||(!h.object.userData.pickGenerator&&(h.object.material.transmission>0||h.object.material.opacity<=.3)))return false;let o=h.object;while(o&&o!==model){if(!o.visible)return false;o=o.parent;}return true;});
  if(hit){let o=hit.object;while(o&&!o.userData.part&&!o.userData.action)o=o.parent;
   clearTimeout(clickTimer);clickTimer=setTimeout(()=>{
   if(o?.userData.action==='start')experiment.start();
   else if(o?.userData.action==='instrument'){experiment.closePanels();focusedElectrode=null;target.set(3.7,2.28,-1.285);dist=5;az=0;el=0;draw();}
   else if(o?.userData.action==='vial')experiment.openVials();
   else if(o?.userData.action==='computer')experiment.openComputer();
   else if(o?.userData.part&&o.userData.part!=='argon'){$('part').value=o.userData.part;apply();openReactions();}
   },240);
  }
 }
 drag=null;save();
});
renderer.domElement.addEventListener('dblclick',e=>{
 if(fly?.active)return;
 clearTimeout(clickTimer);
 const rect=renderer.domElement.getBoundingClientRect(),ray=new THREE.Raycaster();ray.setFromCamera(new THREE.Vector2((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1),camera);
 const hit=ray.intersectObject(model,true).find(h=>{let o=h.object;while(o){if(!o.visible)return false;o=o.parent;}return h.object.isMesh&&(h.object.userData.pickGenerator||(!h.object.material.transmission&&h.object.material.opacity>.3));});if(!hit)return;
 let o=hit.object;while(o.parent&&o.parent!==model&&!o.userData.part&&!o.userData.action)o=o.parent;
 experiment.closePanels();const box=new THREE.Box3().setFromObject(o);box.getCenter(target);dist=Math.max(2.5,box.getSize(new THREE.Vector3()).length()*2);dist=Math.min(16,dist);focusedElectrode=null;draw();
});
renderer.domElement.addEventListener('pointercancel',()=>{drag=null});renderer.domElement.addEventListener('wheel',e=>{if(fly?.active)return;e.preventDefault();dist=Math.max(1.5,Math.min(22,dist*Math.exp(THREE.MathUtils.clamp(e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?stage.clientHeight:1),-240,240)*.003)));draw();save()},{passive:false});
$('export').disabled=false;$('export').onclick=async()=>{const b=$('export');b.disabled=true;try{const data=await new GLTFExporter().parseAsync(model,{binary:true,onlyVisible:true});const reader=new FileReader();reader.onload=()=>{const a=$('file');a.href=reader.result;a.hidden=false;a.textContent='Spara 3D-modellen ('+Math.round(data.byteLength/1024)+' kB)';a.click()};reader.readAsDataURL(new Blob([data],{type:'model/gltf-binary'}));}catch(e){$('detail').textContent='Export misslyckades: '+e.message}finally{b.disabled=false}};
fly=mountFlyCamera({stage,canvas:renderer.domElement,camera,button:$('fly'),draw,onEnter:()=>{clearTimeout(clickTimer);drag=null;setElectrodeHover(null);experiment.closePanels();}});
apply();flowFrame();additions();initializeReactions();fullSetup();target.set(0,2.15,-.25);dist=16;draw();onModel?.(model);
const visibility=()=>{last=null;};
document.addEventListener('visibilitychange',visibility);
return ()=>{
  fly.dispose();clearTimeout(clickTimer);setElectrodeHover(null);playing=false;renderer.setAnimationLoop(null);resize.disconnect();
  experiment.dispose();
  for(const resource of reactionResources)resource.dispose();

  document.removeEventListener('visibilitychange',visibility);
  const geometries=new Set(),materials=new Set();
  model.traverse(o=>{if(o.isSprite)materials.add(o.material);if(o.isMesh){geometries.add(o.geometry);materials.add(o.material);if(o.userData.original)materials.add(o.userData.original)}});
  for(const geometry of geometries)geometry.dispose();
  for(const material of materials)material.dispose();
  for(const texture of labelTextures)texture.dispose();
  environment.dispose();groundGeometry.dispose();groundMaterial.dispose();renderer.dispose();renderer.domElement.remove();
};
}



