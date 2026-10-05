import {componentPartitions} from './componentPartition.js'
import {sampleInventory} from './sampleInventory.js'
// Stable display colours, not predictions of chemical appearance.
export function solidDisplayColor(id) {
 // User-requested teaching colours for the named source hydroxide phases.
 if(id==='spana:2ac52a30213c9288:130902')return '#18583b'
 if(['spana:2ac52a30213c9288:131188','spana:2ac52a30213c9288:131294'].includes(id))return '#df7929'
 let hash=2166136261
 for(const c of String(id)){hash^=c.charCodeAt(0);hash=Math.imul(hash,16777619)}
 return `hsl(${((hash>>>0)*137.508)%360}, 58%, 62%)`
}
// Fixed illustrative scale. No density or packed-bed volume is inferred.
export const solidVolumeScaleMlPerMol=50
/** Display adapter only. Never solve, invent an accepted value, or retain old solids. */
export function wetLab3DState(state, capacity, preview=false, mode='acid-base') {
  const safe=v=>Number.isFinite(v)&&v>=0?v:0
  const q=state?.equilibrium?.inspection
  const accepted=!preview&&state?.status==='accepted-v0'&&q?.ok===true
  const solids=accepted?(q.solids??[]).filter(s=>Number.isFinite(s.amount)&&s.amount>0):[]
  const ids=new Set(q?.visual?.visibleSolidIds??[])
  const modelKg=state?.mixture?.modelSolventMassKg
  const hasAmountBasis=Number.isFinite(modelKg)&&modelKg>=0
  const visible=solids.filter(s=>ids.has(s.id)).map(s=>({...s,
    moles:hasAmountBasis?s.amount*modelKg:null,color:solidDisplayColor(s.id)}))
  const solidMoles=visible.reduce((sum,s)=>sum+(s.moles??0),0)
  const illustrativeSolidMl=solidMoles*solidVolumeScaleMlPerMol
  const capacityMl=Math.max(1,safe(capacity))
  const vesselCapacityMl=Math.max(500,Math.ceil((safe(state?.initialAnalyte?.volumeMl)+capacityMl)/100)*100)
  const volumeMl=safe(state?.totalVolumeMl)
  const pH=accepted&&Number.isFinite(state.pH)?state.pH:null
  const Eh=accepted&&Number.isFinite(state.equilibrium?.derived?.Eh)?state.equilibrium.derived.Eh:null
  const redox=mode!=='acid-base'
  return {id:state?.id??'setup',accepted,preview,capacityMl,vesselCapacityMl,volumeMl,
    remainingMl:Math.min(capacityMl,safe(state?.titrantRemainingMl)),
    addedMl:safe(state?.titrantVolumeAddedMl),pH,Eh,
    probeLabel:redox?'Eh / V vs SHE':'pH',probeValue:redox?Eh:pH,
    partitions:accepted?componentPartitions(q).filter(p=>p.ok).map(p=>({id:p.id,name:p.name,solidFraction:p.solidFraction,dissolvedFraction:p.dissolvedFraction})):[],
    inventory:accepted?sampleInventory(q,modelKg):null,totalSolidMoles:hasAmountBasis?solids.reduce((n,s)=>n+s.amount*modelKg,0):null,
    solids,visibleSolids:visible,hasAmountBasis,solidMoles,illustrativeSolidMl,
    // Compatibility field: linear amount scale, independent of dilution.
    sedimentFraction:volumeMl>0?illustrativeSolidMl/volumeMl:0,
    phaseMessage:accepted?(q.phaseMessage??(solids.length?'Solid present':'No solid present')):preview?'Setup preview — prepare an experiment.':'Equilibrium unavailable — no solids or probe value shown.'}
}

/** Select an exact cached sample, not an interpolated chemical state. */
export function nearestWetLabPoint(points, volume) {
  if(!points?.length||!Number.isFinite(Number(volume)))return null
  return points.reduce((best,p)=>Math.abs(p.x-volume)<Math.abs(best.x-volume)?p:best,points[0])
}
