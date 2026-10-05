// Independent strong-electrolyte reference. Never imported by production.
// Solve H - Kw/H = (nHCl - nNaOH)/V using a cancellation-safe quadratic root.
export function strongAcidBaseReference(volumeMl,logKw){
 const acidMoles=.1000*.05000,baseMoles=.1000*(volumeMl/1000),volumeL=(50+volumeMl)/1000
 const excess=(acidMoles-baseMoles)/volumeL,kw=10**logKw
 const root=Math.hypot(excess,2*Math.sqrt(kw))
 const h=excess>=0?(excess+root)/2:2*kw/(root-excess)
 return {pH:-Math.log10(h),h,oh:kw/h,acidMoles,baseMoles,excess,volumeMl:volumeL*1000,regime:volumeMl<50?'acid':volumeMl>50?'base':'equivalence'}
}
export const benchmarkAdditions=[0,10,25,40,45,49,49.5,49.9,49.99,50,50.01,50.1,50.5,51,55,60,75,100]
