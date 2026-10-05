import VesselAtmosphere from './VesselAtmosphere.jsx'
import {useId,useState} from 'react'
import BeakerDrawing from './BeakerDrawing.jsx'
import {chemicalLabel} from '../chemistry/format.js'

/** A view of one exact accepted dose. No equilibrium or reconstructed state. */
export default function WetLabVessel({state,capacity,onNavigate,preview=false}){
 const id=useId(),[inspect,setInspect]=useState(null),remaining=state.titrantRemainingMl,fill=180*remaining/capacity
 const q=state.equilibrium.inspection??{ok:false},solid=q.solids?.find(s=>s.id===inspect)
 return <section className="wet-vessel-scene equilibrium-vessel-theme" data-state-id={state.id} aria-label="Experiment vessel" tabIndex={preview?-1:0} onKeyDown={e=>{if(onNavigate&&e.target===e.currentTarget&&['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();onNavigate(e.key)}}}>
  <div className="wet-vessel-caption"><strong>Burette → beaker</strong><span>{remaining.toFixed(2)} mL remaining · {state.totalVolumeMl.toFixed(2)} mL in beaker</span></div>
  <svg className="wet-experiment-vessel" viewBox="0 0 560 620" aria-label="Illustrative burette above equilibrium beaker">
   <defs><linearGradient id={id}><stop stopColor="#ccebf2" stopOpacity=".5"/><stop offset=".2" stopColor="#ccebf2" stopOpacity=".03"/><stop offset=".75" stopColor="#ccebf2" stopOpacity=".1"/><stop offset="1" stopColor="#ccebf2" stopOpacity=".5"/></linearGradient></defs>
   <VesselAtmosphere/>
   <ellipse cx="290" cy="585" rx="190" ry="18" fill="#000" opacity=".35"/>
   <path d="M110 565V35M72 569H172M110 90H275" fill="none" stroke="#819398" strokeWidth="8" strokeLinecap="round"/>
   <path d="M115 37V560" stroke="#dae9e8" strokeOpacity=".5"/>
   <rect x="265" y={228-fill} width="28" height={fill} fill="#83c3cf" opacity=".48"/>
   <path d="M261 36V229Q261 243 275 251V280H283V251Q297 243 297 229V36" fill={`url(#${id})`} stroke="#bdd9df" strokeWidth="2"/>
   {Array.from({length:10},(_,i)=><path key={i} d={`M${i%2?288:280} ${48+i*18}H297`} stroke="#d5e5e7" strokeWidth="1.5"/>)}
   <rect x="253" y="248" width="51" height="12" rx="4" fill="#b8d6d4"/><path d="M306 240V269" stroke="#69adbd" strokeWidth="8" strokeLinecap="round"/>
   <text x="316" y="82">Titrant</text><text x="316" y="102">{remaining.toFixed(2)} mL</text>
   <BeakerDrawing state={q} onInspect={setInspect} volumeMl={state.totalVolumeMl} capacityMl={state.initialAnalyte.volumeMl+capacity} x="115" y="290" width="330" height="300" style={{width:330,height:300}}/>
  </svg>
  <div className="wet-vessel-footer"><strong>{preview?'Setup preview · no equilibrium calculated':`${state.titrantVolumeAddedMl.toFixed(2)} mL delivered · pH ${state.pH===null?'unavailable':state.pH.toFixed(5)}`}</strong><span>{q.ok?q.phaseMessage:'No accepted equilibrium — no precipitate rendered.'}</span>
   {solid&&<p>{chemicalLabel(solid.name)} · {solid.amount.toExponential(10)} mol/kg model H₂O · {(solid.amount*state.mixture.modelSolventMassKg).toExponential(10)} mol in beaker</p>}
   {inspect==='liquid'&&q.ok&&<p>Liquid · {state.totalVolumeMl.toFixed(2)} mL · accepted pH {q.pH}. Detailed species and balances remain in selected equilibrium inspection.</p>}
  </div>
  <details><summary>About this illustration</summary><p>Illustrative vessel appearance. Liquid and precipitate rendering represent accepted equilibrium inventory, not physical color, crystal morphology, density or settling kinetics.</p><p>The hood, bottles and warning sign are decorative atmosphere, not a hazard classification of the selected solution. Sediment uses the shared bounded inventory mapping, capped at 24% of displayed liquid depth. No kinetic animation. Use ← / →, Home / End on the scene to select calculated doses.</p></details>
 </section>
}
