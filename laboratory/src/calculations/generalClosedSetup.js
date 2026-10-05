export function configureGeneralClosed(definition,components){
 const next=structuredClone(definition)
 for(const key of ['predominanceArea','closedReagents','imposedEh','pourbaix','publicFePourbaix','mixedSolubility','gridMultiSolid','solubilityComparison'])delete next[key]
 next.generalClosed={ordinaryDefinition:structuredClone(definition.closedReagents?.ordinaryDefinition??definition.generalClosed?.ordinaryDefinition??definition),amounts:Object.fromEntries(components.filter(c=>!['solvent','electron'].includes(c.role)).map(c=>[c.id,definition.componentConditions.find(r=>r.componentId===c.id&&r.mode==='T')?.value??0]))}
 return next
}
