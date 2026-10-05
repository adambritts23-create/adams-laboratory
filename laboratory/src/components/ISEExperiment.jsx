import {useEffect,useRef,useState} from 'react'
import {createISEScene} from '../ise/scene.js'
import {additionSeconds,iseFrame,iseMethod} from '../ise/model.js'
import './ISEExperiment.css'
import ISECalculation from './ISECalculation.jsx'
import {calculateFluoride} from '../ise/fluoride.js'
export default function ISEExperiment({onModel,openReadings=0}){
 const [inputOpen,setInputOpen]=useState(false)
 useEffect(()=>{if(openReadings)queueMicrotask(()=>setInputOpen(true))},[openReadings])
 const [prepared,setPrepared]=useState(false)
 const [assay,setAssay]=useState(()=>({...calculateFluoride(iseMethod.readingsMv,2),sampleId:'Example'}))
 const [readings,setReadings]=useState(iseMethod.readingsMv)
 const volumes=assay.additionVolumesMl
 const totals=[0,volumes[0],volumes[0]+volumes[1]]
 const host=useRef(null),scene=useRef(null),shell=useRef(null),time=useRef(0)
 const [stage,setStage]=useState(0),[running,setRunning]=useState(false),[paused,setPaused]=useState(false),[chemistry,setChemistry]=useState(true),[labels,setLabels]=useState(false),[frame,setFrame]=useState(()=>iseFrame()),[error,setError]=useState(''),[selected,setSelected]=useState('')
 useEffect(()=>{let instance,alive=true;try{instance=createISEScene(host.current,{onSelect:name=>{setSelected(name);if(name==='Meter')setInputOpen(true)}});scene.current=instance;onModel?.(instance)}catch(e){queueMicrotask(()=>{if(alive)setError(e.message)})}return()=>{alive=false;onModel?.(null);instance?.dispose();scene.current=null}},[onModel])
 useEffect(()=>{scene.current?.update(frame,{chemistry,labels,motion:!paused,assay,prepared})},[frame,chemistry,labels,paused,assay,prepared])
 useEffect(()=>{
  if(!running||paused)return
  let raf,previous=0,lastUI=0
  function tick(now){const dt=previous?Math.min(.1,(now-previous)/1000):0;previous=now;if(!document.hidden)time.current+=dt
   const value=iseFrame(stage,time.current,readings,volumes);scene.current?.update(value,{chemistry,labels,motion:true,assay,prepared})
   if(now-lastUI>80){setFrame(value);lastUI=now}
   if(time.current>=additionSeconds){const next=stage+1;setStage(next);setFrame(iseFrame(next,null,readings,volumes));setRunning(false);return}
   raf=requestAnimationFrame(tick)
  }
  raf=requestAnimationFrame(tick);return()=>cancelAnimationFrame(raf)
 },[running,paused,stage,chemistry,labels,readings,assay,prepared,volumes])
 function addition(){if(!prepared||running||stage===2)return;time.current=0;setPaused(false);setRunning(true);setFrame(iseFrame(stage,0,readings,volumes))}
 function invalidate(){setPrepared(false);setRunning(false);setPaused(false)}
 function useReadings(record){setInputOpen(false);setPrepared(true);const values=record.result.readings;setAssay({...record.result,sampleId:record.sampleId});setReadings(values);setRunning(false);setPaused(false);setStage(0);time.current=0;setFrame(iseFrame(0,null,values,record.result.additionVolumesMl))}
 function reset(){setRunning(false);setPaused(false);setStage(0);time.current=0;setFrame(iseFrame(0,null,readings,volumes))}
 async function fullscreen(){try{if(document.fullscreenElement)await document.exitFullscreen();else await shell.current.requestFullscreen()}catch{setError('Full screen is unavailable in this browser. The scene remains fully interactive.')}}
 return <section className="ise-workspace" aria-label="Fluoride ion selective electrode experiment">
  <header className="ise-heading"><div><h2>Fluoride · standard addition</h2><p>One sample. Two additions. A combination electrode.</p></div><span>Method pH ≈ 5.3 · {prepared?assay.massG.toFixed(3)+' g UO₂ sample':'Enter sample weight in Sample & readings'}</span></header>
  <div ref={shell} className="ise-model-shell">
   <div className="ise-toolbar"><button onClick={()=>setInputOpen(true)}>Sample &amp; readings</button><button className="ise-primary" disabled={!prepared||running||stage===2} onClick={addition}>{!prepared?'Prepare sample first':running?'Addition in progress…':stage===2?'Both additions complete':`Add standard ${stage+1} · ${stage===0?`${volumes[0]} mL`:`2 × ${volumes[1]/2} mL`}`}</button><button onClick={()=>setPaused(v=>!v)}>{paused?'Resume animation':'Pause animation'}</button><button onClick={reset}>Restart</button><button onClick={()=>scene.current?.view('all')}>Full setup</button><button onClick={()=>scene.current?.view('chemistry')}>Inspect solution</button><button onClick={()=>scene.current?.view('meter')}>Zoom instrument</button><button onClick={fullscreen}>Full screen</button><label><input type="checkbox" checked={chemistry} onChange={e=>setChemistry(e.target.checked)}/>Ions</label><label><input type="checkbox" checked={labels} onChange={e=>setLabels(e.target.checked)}/>Labels</label></div>
   <div className="ise-input-overlay" hidden={!inputOpen} role="dialog" aria-label="Sample and electrode readings"><button className="ise-input-close" onClick={()=>setInputOpen(false)} aria-label="Close sample panel">Close ×</button><ISECalculation onUseReadings={useReadings} onInvalidate={invalidate}/></div>
   <div ref={host} className="ise-canvas" tabIndex={0} aria-label="Interactive ISE apparatus: drag to orbit, right drag to pan, wheel or pinch to zoom, click beaker to focus"/>
   <div className="ise-live"><strong>{prepared?frame.potentialMv.toFixed(1):"—"} <small>mV</small></strong><span>{frame.volumeMl.toFixed(2)} mL</span><span>Added F⁻: {frame.addedFluorideMg.toFixed(3)} mg</span><span role="status">{prepared?frame.status:'Enter readings and prepare the experiment'}{paused?' · paused':''}</span></div>
   <ol className="ise-stages" aria-label="Measurement sequence">{readings.map((mv,i)=><li key={i} aria-current={stage===i?'step':undefined} className={stage===i?'current':stage>i?'complete':''}><span>{i===0?'Initial solution':`Addition ${i}`}</span><strong>{prepared?mv.toFixed(1):"—"} mV</strong><small>{(58+totals[i]).toFixed(1)} mL{i>0?` · +${(totals[i]).toFixed(1)} mg F⁻ total`:''}</small></li>)}</ol>
  </div>
  {error&&<p role="alert">{error}</p>}
  <p className="ise-caption">Drag to orbit · right-drag to pan · scroll/pinch to zoom · click the beaker or double-click equipment to focus. {selected&&`Selected: ${selected}.`} Hover highlights clear when you move away.</p>
  <div className="ise-notes"><section><h3>What the electrode sees</h3><p>Fluoride activity at the sensing surface changes the potential. F⁻ is not consumed by the measurement. The electrode body stays opaque.</p><div className="ise-key"><span style={{color:'#f52236'}}>● F⁻</span><span style={{color:'#43e75c'}}>● UO₂²⁺</span><span style={{color:'#89c6f4'}}>● Na⁺</span><span style={{color:'#bdadf1'}}>● CDTA</span><span style={{color:'#9cded5'}}>● Ac⁻ / HAc</span><span style={{color:'#adc5d4'}}>● NO₃⁻</span></div><small>Teaching particles: sparse and illustrative, not a calculated speciation or ion-count model. CDTA represents the ligand pool; its protonation and metal complexes are not resolved.</small></section>
  <details><summary>Method and readings</summary><p>Prepared solution: 2 g UO₂ powder with 8 mL of nitric acid mixture (1 part concentrated HNO₃ : 2 parts water), then 50 mL acetate/CDTA buffer. Initial volume ≈58 mL; method pH ≈5.3.</p><p>Buffer recipe supplied: 1 kg sodium acetate and 20 g CDTA diluted to 5 L. The 50 mL aliquot contains 10 g sodium acetate and 0.200 g CDTA. The animation begins after preparation.</p><p>By default, the first addition is 0.5 mL; the second is 2 × 0.5 mL (1.0 mL). At 1000 mg/L fluoride these supply 0.500 mg and 1.000 mg F⁻ respectively; the final volume is 59.5 mL. Potentials 56.5, 27.5 and 6.6 mV are replayed from the supplied slide; settling is animated. They are not a fitted Nernst response. The Sample & readings panel inside the scene solves initial fluoride from the three potentials using your supplied standard-addition method. Prepare animation validates and uses the entered potentials and method settings. The animation does not calculate activity coefficients or matrix speciation.</p><p>pH is the supplied method value, not recalculated from the recipe. Dissolution and matrix speciation are outside this first visual model.</p><a href="https://www.thermofisher.com/TFS-Assets/LSG/manuals/D15872~.pdf" target="_blank" rel="noreferrer">Orion fluoride ISE guide</a></details></div>
 </section>
}
