import {createRepository} from './repository.js'
import {repositoryData,termsOf} from './databaseLibrary.js'
import {supportedPsiRecord} from './importers/psinagra/index.js'

export const COMBINED_ID='spana-preferred-psi'
export const COMBINED_NAME='Combined · Spana preferred'
const format='spana-preferred-psi-v1'
const aliases={'(C6H5O7)':'cit','(C10H12N2O8)':'EDTA','(C2O4)':'ox','As(OH)3':'H3AsO3'}
const rename=name=>Object.entries(aliases).reduce((s,[a,b])=>s.replaceAll(a,b),name)
const key=name=>rename(name).replaceAll(/\s/g,'')
const indexes=new WeakMap()
function index(repository){
 if(!indexes.has(repository)){
  const components=repository.getComponents(),byComponent=new Map(components.map(c=>[key(c.name),c])),core=new Map(),names=new Set(components.map(c=>c.name))
  for(const s of repository.getSpecies())if(s.metadata?.sourceFormat==='spana-java-binary'&&s.phase==='aqueous'&&Number.isFinite(s.logK)&&termsOf(s).length&&termsOf(s).every(t=>names.has(t.name))){const k=key(s.name);core.set(k,[...(core.get(k)??[]),s])}
  indexes.set(repository,{byComponent,core})
 }
 return indexes.get(repository)
}

function converted(original,repository){
 const {byComponent,core}=index(repository)
 const totals={},conversions=[];let logK=original.logK
 for(const t of termsOf(original)){
  const component=byComponent.get(key(t.name))
  if(component){totals[component.name]=(totals[component.name]??0)+t.coefficient;continue}
  const candidates=core.get(key(t.name))??[]
  // Multiple source equations with different constants require review, not an arbitrary conversion.
  const auxiliary=candidates[0]
  if(!auxiliary||candidates.some(s=>s.logK!==auxiliary.logK||JSON.stringify(termsOf(s))!==JSON.stringify(termsOf(auxiliary))))throw Error(`No unambiguous Spana basis conversion for ${t.name}`)
  for(const v of termsOf(auxiliary))totals[v.name]=(totals[v.name]??0)+t.coefficient*v.coefficient
  logK+=t.coefficient*auxiliary.logK
  conversions.push({component:t.name,sourceId:auxiliary.id,coefficient:t.coefficient,logK:auxiliary.logK})
 }
 const terms=Object.entries(totals).filter(([,n])=>Math.abs(n)>1e-12).sort(([a],[b])=>a.localeCompare(b)).map(([name,coefficient])=>({name,coefficient}))
 return {name:rename(original.name),logK,terms,conversions}
}

export function supportedCombinedRecord(record,repository){
 try{
  if(record.metadata?.sourceFormat!==format||!supportedPsiRecord(record.metadata.combined.original))return false
  const original=record.metadata.combined.original,c=converted(original,repository)
  return record.phase===original.phase&&record.charge===original.charge&&record.name===c.name&&record.logK===c.logK&&record.temperatureReference===298.15&&JSON.stringify(termsOf(record))===JSON.stringify(c.terms)&&JSON.stringify(record.metadata.combined.conversions)===JSON.stringify(c.conversions)
 }catch{return false}
}

/** Keep the complete primary source unchanged. Only supplementary reactions expressible
 * in its existing coordinates are admitted; unsupported coordinates are reported. */
export function combineSpanaPreferred(spana,psi){
 const primary=createRepository(spana),report={preferred:0,added:0,omitted:[]}
 if(!spana.species.some(s=>s.metadata?.sourceFormat==='spana-java-binary'))throw Error('A Spana collection is required as the primary database.')
 const occupied=new Set(spana.species.map(s=>`${key(s.name)}|${s.phase}`))
 for(const c of spana.components)occupied.add(`${key(c.name)}|aqueous`)
 const species=[...spana.species]
 for(const original of psi.species){
  if(original.role==='solvent')continue
  if(occupied.has(`${key(original.name)}|${original.phase}`)){report.preferred++;continue}
  if(!supportedPsiRecord(original)){report.omitted.push({name:original.name,reason:'Not an eligible PSI/Nagra equilibrium record'});continue}
  try{
   const c=converted(original,primary)
   species.push({...original,id:`combined:${original.id}`,name:c.name,displayName:c.name,formula:c.name,logK:c.logK,componentStoichiometry:Object.fromEntries(c.terms.map(t=>[t.name,t.coefficient])),temperatureModel:null,
    notes:[...original.notes,'Combined collection: Spana basis and overlapping reactions take precedence. Supplementary PSI/Nagra constants rebased at 25 °C; ideal approximation.'],
    metadata:{...original.metadata,sourceFormat:format,effectiveSourceReaction:{product:c.name,components:c.terms},combined:{original,conversions:c.conversions}},
    qualityFlags:[...original.qualityFlags,'mixed-source-provisional']})
   occupied.add(`${key(original.name)}|${original.phase}`);report.added++
  }catch(e){report.omitted.push({name:original.name,reason:e.message})}
 }
 const sources=[...spana.sources,...psi.sources.filter(s=>!spana.sources.some(p=>p.id===s.id))]
 return {kind:'adams-reaction-database',version:1,data:repositoryData(createRepository({...spana,species,sources})),report}
}
