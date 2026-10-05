import { useId } from 'react'
import { sedimentSegments, liquidVisual, vesselSedimentHeight } from '../beaker/scene.js'
import { chemicalLabel } from '../chemistry/format.js'

export default function BeakerDrawing({ state, onInspect, volumeMl=null, capacityMl=null, polished=false, ...svgProps }) {
  const id = useId(), segments = sedimentSegments(state), liquid=liquidVisual(volumeMl,capacityMl)
  const bedHeight = vesselSedimentHeight(state,liquid), top = 315 - bedHeight
  const bed = `M83 ${top} Q108 ${top-5} 130 ${top-1} T173 ${top-3} T218 ${top-1} T261 ${top} V330 H83 Z`
  const activate = target => onInspect ? ({ role: 'button', tabIndex: 0, onClick: () => onInspect?.(target),
    onKeyDown: e => { if (['Enter', ' '].includes(e.key)) { e.preventDefault(); onInspect(target) } } }) : ({})
  return <svg viewBox="40 28 260 330" className={`beaker-drawing refined-beaker${polished?' polished-beaker':''}`} aria-label="Schematic equilibrium beaker" data-liquid-fraction={liquid.fraction} data-volume-ml={liquid.volumeMl??undefined} {...svgProps}>
    <title>{liquid.physical?`Solution volume ${liquid.volumeMl} mL; additive-volume fill. Sediment is illustrative, not physical volume.`:"Equilibrium schematic. Fixed liquid level; sediment amount mapping is illustrative, not physical volume. Uncalibrated marks."}</title>
    <defs>
      <linearGradient id={`${id}-sediment-shade`} x2="0" y2="1"><stop stopColor="#f2f4d8" stopOpacity=".42"/><stop offset=".4" stopColor="#72865c" stopOpacity=".04"/><stop offset="1" stopColor="#203523" stopOpacity=".6"/></linearGradient>
      <linearGradient id={`${id}-wall-shine`}><stop stopColor="#dceff1" stopOpacity=".04"/><stop offset=".08" stopColor="#fff" stopOpacity=".55"/><stop offset=".14" stopColor="#dceff1" stopOpacity=".05"/><stop offset=".72" stopColor="#dceff1" stopOpacity="0"/><stop offset=".93" stopColor="#fff" stopOpacity=".25"/><stop offset="1" stopColor="#dceff1" stopOpacity=".04"/></linearGradient>
      <linearGradient id={`${id}-glass`}><stop stopColor="var(--glass-highlight)" stopOpacity=".2"/><stop offset=".25" stopColor="var(--glass-highlight)" stopOpacity=".02"/><stop offset=".8" stopColor="var(--glass-highlight)" stopOpacity=".04"/><stop offset="1" stopColor="var(--glass-highlight)" stopOpacity=".18"/></linearGradient>
      <linearGradient id={`${id}-liquid`} x1="0%" y1="0%" x2="0%" y2="100%"><stop stopColor="var(--liquid-ink)" stopOpacity=".18"/><stop offset="1" stopColor="var(--liquid-ink)" stopOpacity=".58"/></linearGradient>
      <clipPath id={`${id}-inside`}><path d="M83 64H261V298Q261 317 242 317H103Q83 317 83 298Z"/></clipPath>
      <clipPath id={`${id}-bed`}><path d={bed}/></clipPath>
      {[0,1,2].map(pattern => <pattern key={pattern} id={`${id}-pattern-${pattern}`} width="12" height="12" patternUnits="userSpaceOnUse"><rect width="12" height="12" fill="var(--sediment-fill)"/>
        {polished?<>{Array.from({length:7},(_,i)=>{const x=(i*7+pattern*3)%12,y=(i*5+pattern)%12,r=.6+(i%3)*.35;return <g key={i}><ellipse cx={x} cy={y} rx={r*1.5} ry={r} fill="var(--sediment-mark)" opacity=".55"/><ellipse cx={x-.3} cy={y-.4} rx={r} ry={r*.45} fill="#f5f4d5" opacity=".6"/></g>})}</>:pattern===0?<><circle cx="3" cy="3" r="1.4" fill="var(--sediment-mark)"/><circle cx="9" cy="9" r="1" fill="var(--sediment-mark)"/></>:pattern===1?<path d="M-3 3L3-3M0 12L12 0M9 15L15 9" stroke="var(--sediment-mark)" strokeWidth="1.3"/>:<path d="M3 2v3m-1 3h5m3-6v3m-1 3h5" stroke="var(--sediment-mark)" strokeWidth="1.3"/>}</pattern>)}
    </defs>
    <ellipse cx="172" cy="332" rx="96" ry="9" fill="#000" opacity=".2"/>
    <path className="vessel-shell" fill={`url(#${id}-glass)`} d="M68 53L77 63V299Q77 327 103 327H242Q268 327 268 299V63L283 53"/>
    {(state.ok || liquid.physical) && <g clipPath={`url(#${id}-inside)`}>
      <path {...activate('liquid')} aria-label="Inspect liquid" className="refined-liquid" fill={`url(#${id}-liquid)`} d={`M83 ${liquid.top}Q172 ${liquid.top+10} 261 ${liquid.top}V319H83Z`}/>
      <ellipse className="liquid-surface" cx="172" cy={liquid.top} rx="89" ry="8"/>
      <path d={`M86 ${liquid.top+2}Q172 ${liquid.top+13} 258 ${liquid.top+2}`} stroke="var(--glass-highlight)" strokeOpacity=".45" fill="none"/>
      {segments.length>0 && <g className="sediment-bed" data-solid-count={segments.length} data-bed-height={bedHeight} data-solid-inventory={state.visual.inventory} clipPath={`url(#${id}-bed)`}>
        {segments.map(s => <g key={s.id} {...activate(s.id)} aria-label={`Inspect solid ${s.key}: ${chemicalLabel(s.name)}`} className="sediment-segment" data-solid-id={s.id} data-exact-amount={s.amount}>
          <title>{`${s.key}. ${s.name}: ${s.amount} mol/kg H₂O accepted solid. Pattern identifies phase; width is its share of visible solid molality, not morphology, volume or settling order.`}</title>
          <rect x={s.x} y={top-6} width={s.width} height={bedHeight+10} fill={`url(#${id}-pattern-${s.pattern})`}/>
          {polished&&<rect pointerEvents="none" x={s.x} y={top-6} width={s.width} height={bedHeight+10} fill={`url(#${id}-sediment-shade)`}/>}
          {s.key>1&&<path d={`M${s.x} ${top-6}V318`} className="sediment-divider"/>}
        </g>)}
      </g>}
      {segments.length>0&&<path className="sediment-edge" d={bed}/>}
    </g>}
    {polished&&<><path pointerEvents="none" d="M78 64V299Q78 327 103 327H242Q267 327 267 299V64" fill={`url(#${id}-wall-shine)`}/><ellipse pointerEvents="none" cx="172" cy="319" rx="87" ry="5" fill="none" stroke="#d9eef0" strokeOpacity=".45" strokeWidth="3"/></>}
    <path className="glass-rim" d="M63 52Q173 43 284 52L269 61M63 52L77 61M82 59Q172 65 260 59"/>
    <path d="M81 69V298Q81 321 104 321H241Q264 321 264 298V68" stroke="var(--glass-highlight)" opacity=".24" fill="none"/>
    <path d="M100 79V287M247 148V292" stroke="var(--glass-highlight)" strokeWidth="6" opacity=".12" strokeLinecap="round"/>
    <ellipse cx="172" cy="53" rx="104" ry="8" fill="none" stroke="var(--glass-highlight)" strokeOpacity=".5"/>
    <path className="glass-reflection" d="M90 78V296Q90 309 104 309M252 76V117"/>
    {[95,130,165,200,235,270].map((y,i)=><path key={y} className="glass-graduation" d={`M${i%2?240:233} ${y}H257`}/>)}
    <text x="172" y="349" textAnchor="middle">{liquid.physical ? `${volumeMl.toFixed(2)} mL · schematic` : state.ok ? 'Schematic · not to scale' : 'Equilibrium unavailable'}</text>
  </svg>
}
