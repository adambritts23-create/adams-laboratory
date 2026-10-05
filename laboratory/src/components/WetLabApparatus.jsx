import {amountLabel,partitionLabel} from '../beaker/sampleInventory.js'
import {useEffect,useRef,useState} from 'react'

import {wetLab3DState} from '../beaker/wetLab3DState.js'

import WetLabVessel from './WetLabVessel.jsx'

import './WetLabApparatus.css'



export default function WetLabApparatus({state,capacity,preview=false,mode,active=true,onNavigate,delivery,experiment,canDispense=false,onDispense}){

 const host=useRef(null),scene=useRef(null),latest=useRef(null)

 const [failure,setFailure]=useState(false),[motion,setMotion]=useState(()=>!window.matchMedia('(prefers-reduced-motion: reduce)').matches)

 const [solidColorMode,setSolidColorMode]=useState('phases'),[solidMagnification,setSolidMagnification]=useState(10)

 const [selected,setSelected]=useState(''),[open,setOpen]=useState(false),[dose,setDose]=useState(.1)

 const live=useRef({}),pending=useRef(false)

 useEffect(()=>{live.current={onDispense,canDispense,open,dose}})

 const [context,setContext]=useState({experiment,active})

 if(context.experiment!==experiment||context.active!==active){setContext({experiment,active});if(open)setOpen(false)}

 useEffect(()=>{if(!open||!active)return;let cancelled=false;const tick=async()=>{const v=live.current;if(cancelled||!v.open||pending.current||!v.canDispense)return;pending.current=true;try{if(!await v.onDispense(v.dose))setOpen(false)}finally{pending.current=false}};const timer=setInterval(tick,1200);return()=>{cancelled=true;clearInterval(timer)}},[open,active])

 if(open&&!(state?.titrantRemainingMl>0))setOpen(false)

 const display={...wetLab3DState(state,capacity,preview,mode),solidColorMode,solidMagnification,delivery,stopcockOpen:open}

 useEffect(()=>{latest.current={...display,motion};scene.current?.update(display)})

 useEffect(()=>{

  if(!active)return

  let cancelled=false,instance

  import('../beaker/titrationScene.js').then(({createTitrationScene})=>{

   if(cancelled)return

   try{instance=createTitrationScene(host.current,{capacityMl:display.capacityMl,vesselCapacityMl:display.vesselCapacityMl,onSelect:setSelected});scene.current=instance;instance.update(latest.current);instance.setMotion(latest.current.motion);instance.view('close')}catch{setFailure(true)}

  }).catch(()=>{if(!cancelled)setFailure(true)})

  return()=>{cancelled=true;instance?.dispose();scene.current=null}

 // Geometry is recalibrated only when the configured vessel capacities change.

 },[active,display.capacityMl,display.vesselCapacityMl])

 useEffect(()=>{scene.current?.setMotion(motion)})

 if(failure)return <><p role="status">3D view unavailable on this device. Showing the schematic.</p><WetLabVessel {...{state,capacity,preview,onNavigate}}/></>

 return <section className="wet-3d" data-state-id={display.id} data-volume-ml={display.volumeMl} data-solid-count={display.visibleSolids.length} aria-label="3D titration apparatus">

  <div ref={host} className="wet-3d-canvas" tabIndex={0} aria-label="Rotate and zoom titration apparatus; arrow keys select calculated doses" onKeyDown={e=>{if(e.key==='f'&&selected){e.preventDefault();scene.current?.focus(selected);return}if(e.key==='Escape'){scene.current?.view('all');return}if(onNavigate&&e.target===e.currentTarget&&['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();onNavigate(e.key)}}}/>

  <div className="wet-3d-readout"><span>Amount precipitated <strong>{amountLabel(display)}</strong></span><span>Beaker <strong>{display.volumeMl.toFixed(2)} mL</strong></span><span>Burette <strong>{display.remainingMl.toFixed(2)} mL</strong></span><span>{display.probeLabel} <strong>{display.probeValue===null?'—':display.probeValue.toFixed(5)}</strong></span></div>

  {display.partitions?.length>0&&<div className="wet-3d-phase" aria-label="Component phase percentages">{display.partitions.map(p=><p key={p.id}>{partitionLabel({partitions:[p]})}</p>)}</div>}
  <p className="wet-3d-phase" role="status">{display.phaseMessage}</p>

  {display.solids.length>0&&<ul className="wet-3d-solids">{display.solids.map(s=>{const visible=display.visibleSolids.find(p=>p.id===s.id);return <li key={s.id}><span className="wet-solid-swatch" style={{background:solidColorMode==='white'?'#eeeae2':visible?.color??'#89999d'}}/>{s.name}: {visible?.moles!=null?`${(visible.moles*1000).toPrecision(4)} mmol`:`${s.amount.toExponential(4)} mol/kg model H₂O`}{!visible?' · below drawing threshold':''}</li>})}</ul>}

  {display.solids.length>0&&!display.hasAmountBasis&&<p className="wet-3d-phase">Solid amount basis unavailable; no quantity geometry drawn.</p>}

  {display.illustrativeSolidMl*solidMagnification>display.vesselCapacityMl*.30&&<p className="wet-3d-phase">Solid display capped to fit the beaker. Lower the visual scale to compare amounts.</p>}

  <details><summary>About the 3D view</summary><p>Drag to rotate; scroll to zoom. Probe values and solid inventory belong to the exact selected calculation. Rewinding restores that calculation, without reaction history. Glassware scales represent {display.vesselCapacityMl} mL beaker and {display.capacityMl} mL burette capacities. Liquid height tracks additive volume; geometry is illustrative. Solid amounts are mol/kg model H₂O × the mixture’s model solvent mass. At 1×, one mole occupies 50 mL of illustrative drawing space; 10× and 50× magnify this space. This fixed scale preserves amount ratios until the displayed 30% vessel-capacity cap. It is not a density or packed sediment prediction. Phase colours are identifiers, not measured colours. White is also illustrative. Grain count and total grain volume track amount. Readout includes all positive solid amounts, including amounts below the drawing threshold. Dry mass is derived from source stoichiometry and conventional atomic weights where supported; otherwise mmol is shown. This is not a wet filter-cake mass. Grains stay on the bottom. The stopcock requests one calculated dose at a time; rejected doses produce no flow. Drops and streams illustrate accepted delivery, not measured droplet sizes. Rewind and graph previews do not dispense. Closing stops new dose requests; a dose already submitted completes. Close-up views subdue glass and liquid for chemistry readability. Texture: Poly Haven Brushed Concrete, CC0. Hidden views stop rendering.</p></details>

  <details className="wet-apparatus-options"><summary>View and apparatus controls</summary>

  <div className="wet-3d-toolbar"><strong>Titration bench</strong><button onClick={()=>scene.current?.view('close')}>Beaker</button><button onClick={()=>scene.current?.view('all')}>Entire setup</button><label><input type="checkbox" checked={motion} onChange={e=>setMotion(e.target.checked)}/>Animate motion</label></div>

  <div className="wet-3d-material-controls"><label>Solid colours <select value={solidColorMode} onChange={e=>setSolidColorMode(e.target.value)}><option value="phases">Different phases</option><option value="white">White</option></select></label><label>Solid visual scale <select value={solidMagnification} onChange={e=>setSolidMagnification(Number(e.target.value))}><option value={1}>1×</option><option value={10}>10×</option><option value={50}>50×</option></select></label><small>Illustrative amount scale · colours identify phases</small></div>

  <div className="wet-3d-toolbar"><label>Selected apparatus <select aria-label="Selected apparatus" value={selected} onChange={e=>{setSelected(e.target.value);scene.current?.select(e.target.value)}}><option value="">None</option>{['Burette','Stopcock','Burette tip','Beaker','Stirrer','Probe','Stand'].map(name=><option key={name}>{name}</option>)}</select></label><button disabled={!selected} onClick={()=>scene.current?.focus(selected)}>Focus selected</button><button aria-pressed={open} disabled={!experiment||(!open&&!canDispense)} onClick={()=>setOpen(v=>!v)}>{open?'Close stopcock':'Open stopcock'}</button><label>Delivery <select value={dose} onChange={e=>setDose(Number(e.target.value))}><option value={.1}>Drops · 0.1 mL / dose</option><option value={1}>Stream · 1 mL / dose</option></select></label><small>{open?'Dispensing accepted doses':'Stopcock closed'} · {selected||'Hover or click apparatus'}</small></div>

  <p className="wet-3d-phase">Click to select · double-click to focus · drag to orbit · right-drag to pan · scroll/pinch to zoom toward the pointer</p>

  </details>

 </section>

}

