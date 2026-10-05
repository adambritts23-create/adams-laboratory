import {useCallback,useEffect,useRef,useState} from 'react';
import KFTitration from './KFTitration.jsx';
import WetLab from './WetLab.jsx';
import ISEExperiment from './ISEExperiment.jsx';
import {mountUpperFloor} from '../upperFloor/room.js';
import './UpperFloor.css';
export default function UpperFloor({active,onClose,repository,chemicalSystem,onSystem,systemPanel}){
 const host=useRef(null),room=useRef(null),source=useRef(null),iseSource=useRef(null);
 const [emptyVersions,setEmptyVersions]=useState({}),[iseRequest,setIseRequest]=useState(0);
 const [handling,setHandling]=useState({});
 const [station,setStation]=useState(null),[hint,setHint]=useState('Explore Adam’s Lab');
 const onBenchState=useCallback((mode,state)=>room.current?.setWet(mode==='acid-base'?'acid':'redox',state),[]);
 const onISEModel=useCallback(model=>{iseSource.current=model;room.current?.setISE(model);},[]);
 const onModel=useCallback(model=>{source.current=model;room.current?.setKF(model);},[]);
 useEffect(()=>{try{room.current=mountUpperFloor(host.current,{onOpen:setStation,onHint:setHint,onHandling:setHandling,onEmpty:id=>setEmptyVersions(v=>({...v,[id]:(v[id]??0)+1})),onISEScreen:()=>{setStation('ise');setIseRequest(v=>v+1)}});if(source.current)room.current.setKF(source.current);if(iseSource.current)room.current.setISE(iseSource.current);}catch(e){host.current.textContent='Unable to open the room: '+e.message;host.current.setAttribute('role','alert');}return()=>{room.current?.dispose();room.current=null;};},[]);
 useEffect(()=>{room.current?.setActive(active&&!station);},[active,station]);
 useEffect(()=>{if(!active)return;const key=e=>{if(document.fullscreenElement?.id==='kf-stage')return;if((e.code==='Escape'||e.code==='KeyE')&&station&&!/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)){e.preventDefault();setStation(null);}};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);},[active,station]);
 const wet=station==='acid'||station==='redox';
 return <section className="upper-floor" hidden={!active} aria-label="Explore Adam’s Lab">
 <header className="floor-header"><div><small>ADAM’S LABORATORY</small><strong>{station==='system'?'System · periodic table':station==='kf'?'Karl Fischer coulometry':station==='ise'?'Fluoride · ion-selective electrode':wet?'Wet-lab titrations':'Explore Adam’s Lab'}</strong></div><div>{station&&<button onClick={()=>setStation(null)}>← Return to room · E</button>}<button onClick={()=>{room.current?.release();if(document.fullscreenElement)document.exitFullscreen().catch(()=>{});onClose();}}>Exit laboratory</button></div></header>
 <div className="floor-room" hidden={!!station}><div ref={host} className="floor-canvas"/><div className="floor-wayfinding"><span>WORKSTATIONS</span><button onClick={()=>room.current?.visit('acid')}>01 Acid–base</button><button onClick={()=>room.current?.visit('kf')}>02 Karl Fischer</button><button onClick={()=>room.current?.visit('redox')}>03 Redox</button><button onClick={()=>room.current?.visit('system')}>04 System</button><button onClick={()=>room.current?.visit('filter')}>05 Filtration</button><button onClick={()=>room.current?.visit('ise')}>06 Fluoride ISE</button><button onClick={()=>room.current?.visit('apartment')}>Adam’s Home</button><button onClick={()=>room.current?.home()}>Entrance</button></div><div className="floor-sample-tools" aria-label="Beaker handling"><strong>{handling.carrying?handling.carrying+' · Amount precipitated: '+handling.amount:'Sample handling'}</strong><p role="status">{handling.message}</p><div>
 <button disabled={!handling.canPick} onClick={()=>room.current?.pickUp()}>Pick up beaker</button>
 {handling.canPickParked&&<button onClick={()=>room.current?.pickParked()}>Pick up dropped beaker</button>}
 <button disabled={!handling.canReturn} onClick={()=>room.current?.putDown()}>Drop off beaker</button>
 <button disabled={!handling.canFilter} onClick={()=>room.current?.filterSample()}>Separate precipitate</button>
 {handling.residue&&<button onClick={()=>room.current?.pickOutput('residue')}>Pick up residue</button>}
 {handling.filtrate&&<button onClick={()=>room.current?.pickOutput('filtrate')}>Pick up filtrate</button>}
 </div><details><summary>Sample options</summary><button onClick={()=>room.current?.resetHandling()}>Reset sample handling</button><small>Clears carried and dropped samples. Taking a sample leaves an empty beaker for a new experiment. Separation is ideal: all solids to residue, solution to filtrate.</small></details></div><div className="floor-crosshair">+</div><div className="floor-instructions"><strong>{hint}</strong><span>WASD / arrows: walk · drag: look · Shift: faster · E: use bench</span><div><button onClick={()=>room.current?.lock()}>Mouse look</button><button onClick={()=>host.current.parentElement.parentElement.requestFullscreen?.().catch(()=>{})}>Full screen</button><button onClick={()=>room.current?.interact()}>Use nearby bench</button></div></div></div>
 <div className="floor-station floor-system" hidden={station!=='system'}>{systemPanel}<button onClick={()=>setStation('acid')}>Continue to acid–base titration</button><button onClick={onSystem}>Full system settings</button></div>
 <div className="floor-station" hidden={station!=='kf'}><KFTitration onModel={onModel}/></div>
 <div className="floor-station" hidden={station!=='ise'}><ISEExperiment onModel={onISEModel} openReadings={iseRequest}/></div>
 <div className="floor-station" hidden={!wet}><WetLab emptyVersions={emptyVersions} onBenchState={onBenchState} active={active&&wet} repository={repository} chemicalSystem={chemicalSystem} initialExperiment={station==='redox'?'redox':station==='acid'?'acid-base':undefined} onSystem={onSystem}/></div>
 </section>;
}
