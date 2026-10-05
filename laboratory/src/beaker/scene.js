/** Amount-proportional pattern areas; formula-unit molality, not physical phase volume. */
export function sedimentSegments(state) {
 if(!state?.ok)return []
 const solids=state.solids.filter(s=>s.amount>0&&state.visual?.visibleSolidIds?.includes(s.id))
 const total=solids.reduce((n,s)=>n+s.amount,0);let offset=0
 return solids.map((solid,index)=>{const fraction=solid.amount/total,x=83+178*offset;offset+=fraction;return {...solid,key:index+1,pattern:index%3,fraction,x,width:178*fraction}})
}
/** Same additive-volume fill convention for all Wet Lab views. Calculation has no physical volume. */
export function liquidVisual(volumeMl=null,capacityMl=null){
 const physical=Number.isFinite(volumeMl)&&volumeMl>=0&&Number.isFinite(capacityMl)&&capacityMl>0
 const fraction=physical?Math.max(0,Math.min(1,volumeMl/capacityMl)):.76
 return {fraction,top:315-240*fraction,physical,volumeMl:physical?volumeMl:null,capacityMl:physical?capacityMl:null}
}
/** The existing molality mapping remains bounded; a shallow liquid fill must not
 * look entirely solid. This cap is illustrative, not a solid volume fraction. */
export function vesselSedimentHeight(state,liquid){
 return state?.ok?Math.min(state.visual.bedHeight,Math.max(0,315-liquid.top)*.24):0
}
