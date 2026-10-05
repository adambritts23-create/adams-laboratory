import * as THREE from 'three';
// Optional presentation controller. No experiment state or simulation clock is touched.
export function mountFlyCamera({stage,canvas,camera,button,draw,onEnter}){
 let active=false,locked=false,disposed=false,savedNear=camera.near;
 const keys=new Set(),angles=new THREE.Euler(0,0,0,'YXZ'),forward=new THREE.Vector3(),right=new THREE.Vector3(),delta=new THREE.Vector3();
 const entry=document.createElement('button');entry.textContent='Full screen';entry.title='Full-screen fly mode · WASD and mouse';entry.className='kf-fly-entry';stage.querySelector('.kf-experiment-bar').prepend(entry);
 const hud=document.createElement('div');hud.className='kf-fly-hud';hud.hidden=true;
 const help=document.createElement('span');help.textContent='WASD move · Q/E down/up · Shift faster · drag to look (or enable mouse-look) · Esc exits';
 const look=document.createElement('button');look.textContent='Enable mouse-look';
 const exit=document.createElement('button');exit.textContent='Exit fly mode';hud.append(help,look,exit);stage.append(hud);
 function unlock(){if(document.pointerLockElement===canvas)document.exitPointerLock();}
 function stop(){if(!active)return;active=false;locked=false;keys.clear();unlock();hud.hidden=true;stage.classList.remove('kf-flying');camera.near=savedNear;camera.updateProjectionMatrix();button.disabled=false;entry.disabled=false;if(document.fullscreenElement===stage)document.exitFullscreen().catch(()=>{});draw();}
 async function start(){if(active||disposed)return;try{await stage.requestFullscreen();if(disposed){if(document.fullscreenElement===stage)await document.exitFullscreen();return;}onEnter();active=true;savedNear=camera.near;camera.near=.02;camera.updateProjectionMatrix();angles.setFromQuaternion(camera.quaternion,'YXZ');hud.hidden=false;stage.classList.add('kf-flying');button.disabled=true;entry.disabled=true;}catch{button.textContent='Full screen unavailable — try again';}}
 async function lock(){if(!active)return;try{await canvas.requestPointerLock();}catch{help.textContent='Mouse capture unavailable. Drag to look; WASD move; Q/E vertical; Esc exits.';}}
 let drag=null;
 const down=e=>{if(active&&document.pointerLockElement!==canvas)drag=[e.clientX,e.clientY];};
 const up=()=>{drag=null;};
 function mouse(e){if(!active)return;let dx,dy;if(document.pointerLockElement===canvas){dx=e.movementX;dy=e.movementY;}else if(drag){dx=e.clientX-drag[0];dy=e.clientY-drag[1];drag=[e.clientX,e.clientY];}else return;angles.y-=dx*.0025;angles.x=THREE.MathUtils.clamp(angles.x-dy*.0025,-Math.PI/2+.01,Math.PI/2-.01);camera.quaternion.setFromEuler(angles);}
 function key(e){if(!active||/INPUT|SELECT|TEXTAREA/.test(e.target.tagName))return;if(e.code==='Escape'){stop();return;}if(['KeyW','KeyA','KeyS','KeyD','KeyQ','KeyE','ShiftLeft','ShiftRight'].includes(e.code)){e.preventDefault();if(!keys.has(e.code)){keys.add(e.code);move(.035);}else keys.add(e.code);}}
 const release=e=>keys.delete(e.code),blur=()=>keys.clear();
 function move(dt){camera.getWorldDirection(forward);right.set(1,0,0).applyQuaternion(camera.quaternion);delta.set(0,0,0);if(keys.has('KeyW'))delta.add(forward);if(keys.has('KeyS'))delta.sub(forward);if(keys.has('KeyD'))delta.add(right);if(keys.has('KeyA'))delta.sub(right);if(keys.has('KeyE'))delta.y++;if(keys.has('KeyQ'))delta.y--;if(delta.lengthSq())camera.position.addScaledVector(delta.normalize(),dt*(keys.has('ShiftLeft')||keys.has('ShiftRight')?32:8));}
 function tick(dt){if(!active||disposed)return;move(Math.min(.05,dt));stage.dataset.flyPosition=camera.position.toArray().map(v=>v.toFixed(3)).join(',');}
 const fullscreen=()=>{if(active&&document.fullscreenElement!==stage)stop();};
 const pointerlock=()=>{if(document.pointerLockElement===canvas){locked=true;look.hidden=true;}else{look.hidden=false;if(locked)stop();}};
 const hidden=()=>{if(document.hidden){keys.clear();if(active)stop();}};
 entry.addEventListener('click',start);button.addEventListener('click',start);look.addEventListener('click',lock);exit.addEventListener('click',stop);
 canvas.addEventListener('pointerdown',down);window.addEventListener('pointerup',up);window.addEventListener('pointermove',mouse);window.addEventListener('keydown',key);window.addEventListener('keyup',release);window.addEventListener('blur',blur);document.addEventListener('fullscreenchange',fullscreen);document.addEventListener('pointerlockchange',pointerlock);document.addEventListener('visibilitychange',hidden);
 return {frame:tick,get active(){return active;},dispose(){disposed=true;stop();button.removeEventListener('click',start);canvas.removeEventListener('pointerdown',down);window.removeEventListener('pointerup',up);window.removeEventListener('pointermove',mouse);window.removeEventListener('keydown',key);window.removeEventListener('keyup',release);window.removeEventListener('blur',blur);document.removeEventListener('fullscreenchange',fullscreen);document.removeEventListener('pointerlockchange',pointerlock);document.removeEventListener('visibilitychange',hidden);entry.remove();hud.remove();}};
}
