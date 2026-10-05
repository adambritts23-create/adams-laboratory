import { displayNumber, outputNumberType } from './formatNumber.js'
import { nearestFloorSample, floorChemicalCoordinates } from './responseSurface.js'
import { axisDisplayLabel } from './export.js'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { surfaceCoordinates, surfaceContours, surfaceMarker } from './surface3d.js'
import { scalarColor, colorRange } from './scalarMap.js'

/** Three.js owns projection, picking and orbit controls. No chemistry imports or calls. */
export function createSurfaceRenderer(host,callbacks={},initialCamera=null){
  const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true})
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));renderer.localClippingEnabled=true
  const canvas=renderer.domElement;canvas.setAttribute('aria-label','Interactive 3D chemical response surface');canvas.tabIndex=0;host.appendChild(canvas)
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(42,1,0.01,1000),controls=new OrbitControls(camera,canvas)
  const defaults=()=>{camera.position.set(3.0,2.7,3.2);controls.target.set(0,.65,0);controls.update()}
  defaults();if(initialCamera?.position?.length===3&&initialCamera?.target?.length===3&&[...initialCamera.position,...initialCamera.target].every(Number.isFinite)){camera.position.fromArray(initialCamera.position);controls.target.fromArray(initialCamera.target);controls.update()}
  controls.enablePan=false;controls.enableZoom=false;controls.enableDamping=false;controls.minDistance=.15;controls.maxDistance=50
  let group=new THREE.Group(),data=null,options={},projection=null,selected=null,hitObjects=[],pin=0,frame=0,frames=0,totalFrameMs=0,lastFrameMs=0,disposed=false
  scene.add(group)
  function render(){if(disposed)return;const t=performance.now();renderer.render(scene,camera);lastFrameMs=performance.now()-t;totalFrameMs+=lastFrameMs;frames++;canvas.dataset.renderCount=String(frames)}
  function requestRender(){if(!frame)frame=requestAnimationFrame(()=>{frame=0;render()})}
  const cameraState=()=>({position:camera.position.toArray(),target:controls.target.toArray()})
  controls.addEventListener('change',requestRender);controls.addEventListener('end',()=>callbacks.onCamera?.(cameraState()))
  const resize=()=>{const w=host.clientWidth,h=host.clientHeight;if(w&&h){renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();requestRender()}}
  const observer=new ResizeObserver(resize);observer.observe(host);resize()
  const disposeGroup=()=>{group.traverse(o=>{o.geometry?.dispose();const materials=Array.isArray(o.material)?o.material:[o.material];materials.filter(Boolean).forEach(m=>{m.map?.dispose();m.dispose()})});scene.remove(group);group=new THREE.Group();scene.add(group);hitObjects=[]}
  function lines(vertices,color,clip=null){if(!vertices.length)return;const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices.flat(),3));const m=new THREE.LineBasicMaterial({color,clippingPlanes:clip});const o=new THREE.LineSegments(g,m);group.add(o);return o}
  function label(text,position,size=.12){const c=document.createElement('canvas');c.width=768;c.height=80;const context=c.getContext('2d');context.font='36px system-ui';context.fillStyle=options.theme==='light'?'#17232c':'#edf4f5';context.textAlign='center';context.fillText(text,384,52,750);const texture=new THREE.CanvasTexture(c),sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,depthTest:false}));sprite.scale.set(size*9.6,size,1);sprite.position.fromArray(position);group.add(sprite)}
  function update(surface,next={}){
    const start=performance.now();data=surface;options=next;disposeGroup();projection=surfaceCoordinates(surface,next)
    const {position,range,dimensions:[sx,sy,sz]}=projection,light=next.theme==='light',fg=light?'#17232c':'#d5e7ee'
    scene.background=new THREE.Color(light?'#f8fafb':'#10191f')
    const clip=[new THREE.Plane(new THREE.Vector3(0,1,0),0),new THREE.Plane(new THREE.Vector3(0,-1,0),sz)]
    const cr=colorRange(surface,next.colorRange),positions=surface.samples.flatMap(p=>p.valid?position(p):[0,0,0]),colors=surface.samples.flatMap(p=>new THREE.Color(p.valid?scalarColor(p.z,cr.min,cr.max):'#000').toArray())
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.setIndex(surface.triangles.flat())
    geometry.computeVertexNormals()
    const ambient=new THREE.AmbientLight(0xffffff,2),sun=new THREE.DirectionalLight(0xffffff,2);sun.position.set(2,5,3);group.add(ambient,sun)
    const mesh=new THREE.Mesh(geometry,new THREE.MeshLambertMaterial({vertexColors:true,side:THREE.DoubleSide,clippingPlanes:clip,polygonOffset:true,polygonOffsetFactor:1,polygonOffsetUnits:1}));mesh.visible=next.style!=='mesh'&&next.style!=='contours';mesh.userData.surface=true;group.add(mesh);hitObjects.push(mesh)
    if(next.style==='mesh'||next.style==='surface-mesh')lines(surface.edges.flatMap(([a,b])=>[position(surface.samples[a]),position(surface.samples[b])]),light?'#244550':'#adc3ce',clip)
    const valid=surface.samples.filter(p=>p.valid),pointsGeometry=new THREE.BufferGeometry();pointsGeometry.setAttribute('position',new THREE.Float32BufferAttribute(valid.flatMap(p=>position(p)),3));pointsGeometry.setAttribute('color',new THREE.Float32BufferAttribute(valid.flatMap(p=>new THREE.Color(scalarColor(p.z,cr.min,cr.max)).toArray()),3))
    const points=new THREE.Points(pointsGeometry,new THREE.PointsMaterial({size:3,sizeAttenuation:false,vertexColors:true,clippingPlanes:clip}));points.userData.indices=valid.map(p=>p.index);points.visible=next.samples!==false;group.add(points);hitObjects.push(points)
    // Neutral floor is a coordinate guide, never a filled response field.
    const floor=new THREE.Mesh(new THREE.PlaneGeometry(sx,sy),new THREE.MeshBasicMaterial({color:light?'#e9f0f3':'#192a35',side:THREE.DoubleSide}));floor.rotation.x=-Math.PI/2;floor.position.y=-.008;floor.userData.floor=true;group.add(floor);hitObjects.push(floor)
    // Base grid and axes are coordinate guides, not additional scientific samples.
    const base=[];for(let i=0;i<=5;i++){const x=-sx/2+sx*i/5,z=sy/2-sy*i/5;base.push([x,0,sy/2],[x,0,-sy/2],[-sx/2,0,z],[sx/2,0,z])}
    lines(base,light?'#bcc9ce':'#334c59');lines([[-sx/2,0,sy/2],[sx/2,0,sy/2],[-sx/2,0,sy/2],[-sx/2,0,-sy/2],[-sx/2,0,sy/2],[-sx/2,sz,sy/2]],fg)
    const [xa,ya]=surface.metadata.axes
    for(let i=0;i<=4;i++){const t=i/4;label(displayNumber(xa.start+(xa.end-xa.start)*t,xa.quantity),[-sx/2+sx*t,-.1,sy/2+.1],.17);label(displayNumber(ya.start+(ya.end-ya.start)*t,ya.quantity),[sx/2+.18,-.06,sy/2-sy*t],.17);label(displayNumber(range.min+(range.max-range.min)*t,outputNumberType(surface.metadata.output)),[-sx/2-.18,sz*t,sy/2+.03],.17)}
    label('X · '+axisDisplayLabel(xa,surface.metadata.componentNames),[0,-.29,sy/2+.18],.22);label('Y · '+axisDisplayLabel(ya,surface.metadata.componentNames),[sx/2+.7,-.12,0],.22);label('Z · '+surface.series.name+' ['+surface.metadata.output.unit+']',[0,sz+.28,sy/2],.22)
    if(next.footprints!==false){
      const failed=[],unrun=[],unavailable=[]
      for(const p of surface.samples)if(!p.valid){const [x,,z]=position(p,range.min),r=.012;if(p.state==='solver-failure')failed.push([x-r,.004,z-r],[x+r,.004,z+r],[x-r,.004,z+r],[x+r,.004,z-r]);else if(p.state==='derived-unavailable')unavailable.push([x-r,.004,z],[x+r,.004,z]);else unrun.push(x,.004,z)}
      lines(failed,'#d68a87');lines(unavailable,'#beaccd');const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(unrun,3));group.add(new THREE.Points(g,new THREE.PointsMaterial({color:'#a2adb5',size:3,sizeAttenuation:false})))
    }
    const levels=cr.min===null?[]:Array.from({length:5},(_,i)=>cr.min+(cr.max-cr.min)*(i+1)/6)
    if(next.surfaceContours||next.baseContours){const c=surfaceContours(surface,levels);if(next.surfaceContours)lines(c.flatMap(s=>[position(s.from,s.level).map((v,i)=>i===1?v+.002:v),position(s.to,s.level).map((v,i)=>i===1?v+.002:v)]),fg,clip);if(next.baseContours)lines(c.flatMap(s=>[position(s.from,range.min).map((v,i)=>i===1?.003:v),position(s.to,range.min).map((v,i)=>i===1?.003:v)]),light?'#49636f':'#9cb9c6')}
    for(const [key,enabled]of [['minimum',next.showMinimum],['maximum',next.showMaximum]]){const p=surfaceMarker(surface,key);if(enabled&&p&&p.z>=range.min&&p.z<=range.max){const o=new THREE.Mesh(new THREE.SphereGeometry(.035,12,8),new THREE.MeshBasicMaterial({color:key==='minimum'?'#fff':'#f1cf72'}));o.position.fromArray(position(p));o.userData.sampleIndex=p.index;group.add(o);hitObjects.push(o);label(key==='minimum'?'min sampled':'max sampled',o.position.toArray().map((v,i)=>i===1?v+.12:v),.1)}}
    if(next.guide&&surface.samples[next.guide.index]){const p=surface.samples[next.guide.index],a=position(p);if(next.guide.direction==='horizontal')lines([[-sx/2,0,a[2]],[sx/2,0,a[2]],[-sx/2,sz,a[2]],[sx/2,sz,a[2]],[-sx/2,0,a[2]],[-sx/2,sz,a[2]],[sx/2,0,a[2]],[sx/2,sz,a[2]]],'#b4bcd8');else lines([[a[0],0,-sy/2],[a[0],0,sy/2],[a[0],sz,-sy/2],[a[0],sz,sy/2],[a[0],0,-sy/2],[a[0],sz,-sy/2],[a[0],0,sy/2],[a[0],sz,sy/2]],'#b4bcd8')}
    selected=new THREE.Mesh(new THREE.SphereGeometry(.025,12,8),new THREE.MeshBasicMaterial({color:'#ffb268'}));group.add(selected);setPin(pin)
    canvas.dataset.displayMode=next.style??'surface';canvas.dataset.floorContours=String(!!next.baseContours);canvas.dataset.sampleOverlay=String(!!next.samples);
    canvas.dataset.triangles=String(surface.triangles.length);canvas.dataset.samples=String(surface.samples.length);canvas.dataset.gridId=surface.metadata.gridId;canvas.dataset.revision=String(surface.metadata.revision)
    render();callbacks.onTiming?.({sceneAndFirstRenderMs:performance.now()-start,triangles:surface.triangles.length,samples:surface.samples.length})
  }
  function setPin(index){pin=index;if(selected&&data){const p=data.samples[index];selected.visible=!!p?.valid&&p.z>=projection.range.min&&p.z<=projection.range.max;if(selected.visible)selected.position.fromArray(projection.position(p));requestRender()}}
  const raycaster=new THREE.Raycaster();raycaster.params.Points.threshold=.025
  function pick(e){if(!data)return null;const r=canvas.getBoundingClientRect(),mouse=new THREE.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);raycaster.setFromCamera(mouse,camera)
    for(const hit of raycaster.intersectObjects(hitObjects.filter(o=>o.visible))){if(hit.object.userData.floor){const p=floorChemicalCoordinates(data,projection.dimensions,hit.point.x,hit.point.z);return nearestFloorSample(data,p.x,p.y)}let candidates=[];if(hit.object.userData.sampleIndex!==undefined)candidates=[hit.object.userData.sampleIndex];else if(hit.object.userData.indices)candidates=[hit.object.userData.indices[hit.index]];else if(hit.face)candidates=[hit.face.a,hit.face.b,hit.face.c]
      let index=null,distance=Infinity;for(const i of candidates){const p=data.samples[i];if(!p?.valid||p.z<projection.range.min||p.z>projection.range.max)continue;const d=new THREE.Vector3(...projection.position(p)).distanceToSquared(hit.point);if(d<distance){index=i;distance=d}}if(index!==null)return {index,source:hit.object.userData.indices||hit.object.userData.sampleIndex!==undefined?'sample-vertex':'surface-interior',exactVertex:!!(hit.object.userData.indices||hit.object.userData.sampleIndex!==undefined),snapped:true}
    }return null
  }
  let down=null
  const move=e=>{if(!down){const hit=pick(e);callbacks.onHover?.(hit?.index??null,hit)}},start=e=>{down=[e.clientX,e.clientY]},end=e=>{if(down&&Math.hypot(e.clientX-down[0],e.clientY-down[1])<5){const hit=pick(e);if(hit!==null)callbacks.onPick?.(hit.index,hit)}down=null},leave=()=>callbacks.onHover?.(null),lost=e=>{e.preventDefault();callbacks.onFailure?.('WebGL context lost. The original grid and 2D fallback remain available.')}
  canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerdown',start);canvas.addEventListener('pointerup',end);canvas.addEventListener('pointerleave',leave);canvas.addEventListener('webglcontextlost',lost)
  return {update,setPin,reset(){defaults();callbacks.onCamera?.(cameraState());render()},zoom(factor){camera.position.sub(controls.target).multiplyScalar(factor).add(controls.target);controls.update();callbacks.onCamera?.(cameraState());render()},cameraState,stats:()=>({frames,lastFrameMs,meanFrameMs:frames?totalFrameMs/frames:0}),image(){render();return canvas},dispose(){disposed=true;cancelAnimationFrame(frame);observer.disconnect();controls.dispose();disposeGroup();canvas.removeEventListener('webglcontextlost',lost);renderer.forceContextLoss();renderer.dispose();canvas.remove()}}
}
