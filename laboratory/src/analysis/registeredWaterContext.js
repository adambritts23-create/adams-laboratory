import {identity,freeze} from '../solver/models.js'
import {waterReferences} from './waterReferences.js'
const models=new WeakSet()
const bindings=[
  ['spana:2ac52a30213c9288:151531','5b95f9c7ca9323341c273014db655cf395e635a5a24e7231f5e65ced943e2f40'],
  ['spana:2ac52a30213c9288:250070','3390193fac3e9aefec096dd990c2a9cdc9f13c756ea2e832048b5580dfef5831']
]
export async function prepareWaterContext(repository) {
  const water=[]
  for(const [id,hash] of bindings){
    const r=repository.getSpeciesById(id)
    if(!r || r.temperatureReference!==298.15 || await identity({id:r.id,logK:r.logK,reaction:r.metadata?.effectiveSourceReaction,provenance:r.provenance})!==hash) return freeze({status:'unavailable',reason:'water-reference-source-mismatch'})
    water.push({id:r.id,name:r.name,coefficients:r.metadata.effectiveSourceReaction.components,logBeta:r.logK,temperatureK:r.temperatureReference})
  }
  const model=freeze({water});models.add(model);return model
}
export function waterContext(model,pH,Eh) {
  if(!models.has(model)) return freeze({status:'unavailable',reason:'unvalidated-water-references'})
  const references=waterReferences(model,pH),H2=references[0].Eh,O2=references[1].Eh
  return freeze({status:'available',waterWindow:Eh>O2?'above-O2-reference':Eh<H2?'below-H2-reference':'inside-water-reference-window',waterReferences:references})
}
