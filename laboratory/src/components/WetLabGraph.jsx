import usePlotGestures from './usePlotGestures.js'
import SampleMarker from './SampleMarker.jsx'
import {chemicalLabel} from '../chemistry/format.js'
import {nearestWetLabPoint} from '../calculations/wetLabAnalysis.js'
const colors=['#7be4c6','#a89aff','#69c8ff','#ffae62','#f38ac4','#d4df72']
export default function WetLabGraph({view,state,committed,capacity,focus,onFocus,onSelect,onPreview,onLeave}){
 const x=v=>58+v/capacity*555
 const numbers=view.series.flatMap(s=>s.points.map(p=>p.value).filter(Number.isFinite))
 const fractions=['total-fraction','aqueous-fraction'].includes(view.type)
 const ehLow=numbers.length?Math.min(...numbers):0,ehHigh=numbers.length?Math.max(...numbers):1,ehPad=Math.max(.025,(ehHigh-ehLow)*.08)
 const low=view.type==='redox-titration'?ehLow-ehPad:fractions?0:Math.min(view.type==='titration'?0:-1,...numbers.map(Math.floor)),high=view.type==='redox-titration'?ehHigh+ehPad:fractions?1:Math.max(view.type==='titration'?14:0,...numbers.map(Math.ceil))
 const y=v=>310-(v-low)/(high-low)*270
 const index=view.points.findIndex(p=>p.state===state),selected=view.points.findIndex(p=>p.state===committed)
 const nearest=e=>{const r=e.currentTarget.getBoundingClientRect();return nearestWetLabPoint(view.points,((e.clientX-r.left)/r.width*660-58)/555*capacity,{acceptedOnly:true})}
 const label=view.type==='redox-titration'?'Eh / V vs SHE':view.type==='titration'?'pH':view.type==='log-activity'?'Aqueous log₁₀ activity':view.type==='log-concentration'?(view.series.some(s=>s.phase==='solid')?'Carrier log₁₀ mol/kg model H₂O':'Aqueous log₁₀ mol/kg model H₂O'):view.type==='total-fraction'?'Fraction of total component':'Fraction of dissolved component'
 const component=view.componentId==='component:B(OH)3'?'boron':view.componentId==='component:CH3COO-'?'acetate':chemicalLabel(view.components.find(c=>c.id===view.componentId)?.name??'component')
 const rows=view.series.map(s=>({...s,color:colors[s.colorIndex%colors.length],sample:s.points[index]})).sort((a,b)=>(b.sample?.value??-Infinity)-(a.sample?.value??-Infinity))
 const gestures=usePlotGestures({sample:e=>view.points.indexOf(nearest(e)),preview:i=>i===null?onLeave():view.points[i]&&onPreview(view.points[i]),pin:i=>onSelect(view.points[i]),count:view.points.length,pinned:selected})
 return <><svg className="wet-curve" viewBox="0 0 660 360" role="group" aria-label="Wet Lab graph; select calculated samples" {...gestures}>
 {Array.from({length:6},(_,i)=>low+(high-low)*i/5).map(v=><g key={v}><path d={`M58 ${y(v)}H613`} stroke="#29414a"/><text x="45" y={y(v)+4} textAnchor="end">{Number(v.toFixed(2))}</text></g>)}
 {[0,.25,.5,.75,1].map(f=><g key={f}><path d={`M${x(capacity*f)} 35V310`} stroke="#29414a"/><text x={x(capacity*f)} y="332" textAnchor="middle">{Number((capacity*f).toPrecision(5))}</text></g>)}
 <text x="20" y="22">{label}</text><text x="335" y="355" textAnchor="middle">{committed.titrant.reagent} added / mL</text>
 {view.series.map(s=>{let path='',open=false;for(const p of s.points){if(!Number.isFinite(p.value)){open=false;continue}path+=`${open?'L':'M'}${x(p.x)} ${y(p.value)} `;open=true}return <path key={s.id} d={path} fill="none" stroke={colors[s.colorIndex%colors.length]} strokeWidth={focus===s.id?3.5:2} opacity={!focus||focus===s.id?1:.2} pointerEvents="none"/>})}
 <SampleMarker x={x(state.titrantVolumeAddedMl)} pinnedX={x(committed.titrantVolumeAddedMl)} top={35} bottom={310} points={view.series.filter(s=>Number.isFinite(s.points[index]?.value)&&(!focus||focus===s.id)).map(s=>({id:s.id,y:y(s.points[index].value),color:colors[s.colorIndex%colors.length]}))}/>
 </svg>
 {!view.available&&<p role="status">{view.reason}</p>}
 {view.type!=='titration'&&<div className="wet-legend" aria-label="Species at displayed state">{rows.map(s=><button key={s.id} aria-pressed={focus===s.id} onClick={()=>onFocus(s.id)}><span style={{color:s.color}}>━</span> <span className="wet-formula">{chemicalLabel(s.name)}</span>{(fractions||view.series.some(s=>s.phase==='solid'))&&<small>{s.phase==='solid'?'solid':'aqueous'}</small>}<small>{Number.isFinite(s.sample?.value)?fractions?`${(s.sample.value*100).toPrecision(5)}% of ${view.type==='total-fraction'?'total':'dissolved'} ${component}`:s.sample.value.toPrecision(6):`Unavailable · ${s.sample?.reason??'no accepted value'}`}</small></button>)}<button onClick={()=>onFocus(null)}>Clear focus</button></div>}
 </>
}

