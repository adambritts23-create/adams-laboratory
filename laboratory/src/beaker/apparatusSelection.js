import * as T from 'three';
// Picking volumes are separate from rendering. Transparent vessels must not hide
// an immersed instrument's hit target, while empty vessel space selects the vessel.
export function apparatusSelection({canvas,camera,objects,proxies=[],onSelect=()=>{},onFocus=()=>{},invalidate}){
 const ray=new T.Raycaster(),mouse=new T.Vector2(),records=[];let hover='',selected='',down=null;
 for(const object of objects){if(!object.userData.apparatus||!object.material||object.material.map)continue;const original=object.material,highlight=original.clone();records.push({object,original,highlight});}
 function refresh(notify=true){for(const r of records){const strength=r.object.userData.apparatus===hover?.025:0;if(strength){r.highlight.copy(r.original);if(r.highlight.emissive){r.highlight.emissive.set('#63d9c1');r.highlight.emissiveIntensity=strength;}r.object.material=r.highlight}else r.object.material=r.original;}canvas.style.cursor=down?'grabbing':hover?'pointer':'grab';canvas.dataset.hoveredApparatus=hover;canvas.dataset.selectedApparatus=selected;if(notify)invalidate();}
 function hit(e){const b=canvas.getBoundingClientRect();mouse.set((e.clientX-b.left)/b.width*2-1,-(e.clientY-b.top)/b.height*2+1);camera.updateMatrixWorld();ray.setFromCamera(mouse,camera);
  const physical=ray.intersectObjects(objects,false).filter(h=>h.object.visible&&h.object.userData.apparatus&&!h.object.material.map);
  const areas=ray.intersectObjects(proxies,false);
  // Small controls take priority over enclosing glass, but not an opaque foreground part.
  const first=physical[0],small=areas.find(h=>['Probe','Stopcock','Burette tip'].includes(h.object.userData.apparatus));
  if(small&&(!first||['Beaker','Burette','Probe','Stopcock','Burette tip'].includes(first.object.userData.apparatus)||small.distance<first.distance))return small.object.userData.apparatus;
  if(first)return first.object.userData.apparatus;
  return areas[0]?.object.userData.apparatus??'';
 }
 const move=e=>{if(down){if(Math.hypot(e.clientX-down.x,e.clientY-down.y)>5)down.dragged=true;return;}const next=hit(e);if(next!==hover){hover=next;refresh()}},leave=()=>{hover='';refresh()},press=e=>{if(e.button!==0)return;down={x:e.clientX,y:e.clientY,dragged:false};canvas.parentElement.focus({preventScroll:true});},release=e=>{if(down&&!down.dragged&&e.button===0&&Math.hypot(e.clientX-down.x,e.clientY-down.y)<6){const name=hit(e);select(name);if(name==='Beaker')onFocus(name);}down=null;refresh();},cancel=()=>{down=null;hover='';refresh()},double=e=>{if(e.button!==0)return;const name=hit(e);if(name){e.preventDefault();select(name);onFocus(name)}};
 function select(name){selected=name;onSelect(name);refresh();}
 const events=[['pointermove',move],['pointerleave',leave],['pointerdown',press],['pointerup',release],['pointercancel',cancel],['dblclick',double]];
 for(const [event,fn] of events)canvas.addEventListener(event,fn);
 return {select,refresh,dispose(){for(const [event,fn] of events)canvas.removeEventListener(event,fn);for(const r of records){r.object.material=r.original;r.highlight.dispose();}}};
}
