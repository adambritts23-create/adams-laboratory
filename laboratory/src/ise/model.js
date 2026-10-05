// Presentation replay and exact added-volume bookkeeping, independent of KF/equilibrium solvers.
export const iseMethod = Object.freeze({initialVolumeMl:58,additionVolumesMl:Object.freeze([.5,1]),standardFluorideMgL:1000,sampleMassG:2,pH:5.3,readingsMv:Object.freeze([56.5,27.5,6.6])})
export const additionSeconds=4.5
export function iseFrame(stage=0,elapsedSeconds=null,readings=iseMethod.readingsMv,volumes=iseMethod.additionVolumesMl){
 const elapsed=elapsedSeconds===null?null:elapsedSeconds*9/additionSeconds
 const from=Math.max(0,Math.min(2,stage)),active=elapsed!==null&&from<2
 const progress=active?Math.max(0,Math.min(1,elapsed/9)):0
 const delivered=active?(from===0?Math.max(0,Math.min(1,(elapsed-1)/3)):(Math.max(0,Math.min(1,(elapsed-1)/1.35))+Math.max(0,Math.min(1,(elapsed-2.65)/1.35)))/2):0
 const response=active?Math.max(0,Math.min(1,(elapsed-2)/7)):0
 const smooth=response*response*(3-2*response)
 const addedBefore=from===2?volumes[0]+volumes[1]:from===1?volumes[0]:0
 const addedMl=addedBefore+(active?delivered*volumes[from]:0)
 return {additionVolumesMl:volumes,readingsMv:readings,stage:from,active,progress,delivered,flowing:active&&elapsed>=1&&elapsed<4&&(from===0||elapsed<2.35||elapsed>2.65),
  volumeMl:iseMethod.initialVolumeMl+addedMl,
  addedFluorideMg:addedMl*iseMethod.standardFluorideMgL/1000,
  potentialMv:readings[from]+(active?(readings[from+1]-readings[from])*smooth:0),
  fluorideVisualCount:3+Math.round(addedMl*4),
  status:active?(elapsed<1?'Positioning pipette':elapsed<4?(from===0?`Adding ${volumes[0]} mL standard`:`Adding 2 × ${volumes[1]/2} mL standard`):'Mixing · response settling'):from===0?'Initial measurement':`Standard addition ${from} complete`}
}
