/** Curated validation metadata only. Not imported by the public application.
 * Counts below are independent formula/ligand/valence assertions, never a parser.
 */
import fs from 'node:fs'
import assert from 'node:assert/strict'
import {createRepository} from '../../src/thermodynamics/repository.js'
import {automaticAuditSession} from './automaticSolidsAudit.js'
import {prepareCanonicalRedoxSession} from '../../src/solver/prepareCanonicalRedox.js'
import {prepareOxidationAllocation} from '../../src/analysis/oxidationInventory.js'
export const data=JSON.parse(fs.readFileSync(new URL('../../public/data/thermodynamic-default.json',import.meta.url)))
export const repository=createRepository(data)
const iupac='https://goldbook.iupac.org/terms/view/O04365'
const magnetite='https://www.ebi.ac.uk/chebi/CHEBI%3A50821'
// [name, conserved atom count, H count, O count, discrete allocation if mixed]
const fe=[['Fe 2+',1,0,0],['Fe 3+',1,0,0],['Fe(cr)',1,0,0],['Fe(OH)2',1,2,2],['Fe(OH)2(cr)',1,2,2],['Fe(OH)2+',1,2,2],['Fe(OH)3',1,3,3],['Fe(OH)3(am)',1,3,3],['Fe(OH)3(s)',1,3,3],['Fe(OH)3-',1,3,3],['Fe(OH)4-',1,4,4],['Fe(OH)4-2',1,4,4],['Fe2(OH)2+4',2,2,2],['Fe2O3(cr)',2,0,3],['Fe3O4(cr)',3,0,4,[{oxidationState:2,count:1},{oxidationState:3,count:2}]],['FeO4-2',1,0,4],['FeOH 2+',1,1,1],['FeOH+',1,1,1],['FeOOH(cr)',1,1,2]]
const cu=[['Cu 2+',1,0,0],['Cu+',1,0,0],['Cu(cr)',1,0,0],['Cu(OH)2',1,2,2],['Cu(OH)2(cr)',1,2,2],['Cu(OH)2-',1,2,2],['Cu(OH)3-',1,3,3],['Cu(OH)4-2',1,4,4],['Cu2(OH)2+2',2,2,2],['Cu2O(cr)',2,0,1],['Cu3(OH)4+2',3,4,4],['CuO(cr)',1,0,1],['CuOH',1,1,1],['CuOH+',1,1,1]]
const mn=[['Mn 2+',1,0,0],['Mn 3+',1,0,0],['Mn(cr)',1,0,0],['MnOH+',1,1,1],['MnO2(s)',1,0,2],['Mn3O4(s)',3,0,4,[{oxidationState:2,count:1},{oxidationState:3,count:2}]]]
export const fixtures={Fe:{basis:'Fe 2+',reference:2,table:fe},Cu:{basis:'Cu+',reference:2,table:cu},Mn:{basis:'Mn 2+',reference:2,table:mn}}
export async function oxidationFixture(key,{pairOnly=false}={}){
 const fixture=fixtures[key],session=automaticAuditSession(repository,[fixture.basis,'e-'])
 const table=pairOnly?fixture.table.slice(0,2):fixture.table
 const names=new Set(table.map(r=>r[0])),ids=data.species.filter(s=>names.has(s.name)).map(s=>s.id)
 const prepared=await prepareCanonicalRedoxSession(session,repository,{candidateSpeciesIds:ids})
 assert.ok(prepared.ok,JSON.stringify(prepared))
 const system=prepared.system,carriers={}
 for(const item of table){
  const [name,count,h,o,allocation]=item,source=data.species.find(s=>s.name===name)
  const row=[...system.components,...system.products].find(p=>p.name===name)
  if(!row)continue
  const coefficients=row.coefficients??[1,0,0,0]
  assert.deepEqual([coefficients[0],coefficients[1]+2*coefficients[3],coefficients[3]],[count,h,o],name)
  // Independent oxygen(-II), hydrogen(+I) assignment is curated for these
  // oxide/hydroxide or monatomic/elemental carriers, not guessed for arbitrary ligands.
  const sum=source.charge-h+2*o
  assert.equal(fixture.reference*count-coefficients[2],sum,name)
  if(allocation)assert.equal(allocation.reduce((s,a)=>s+a.oxidationState*a.count,0),sum)
  carriers[row.id]={electronLocalization:'conserved-component-only',homovalent:!allocation,allocation,
    provenance:{statement:allocation?'Curated discrete mixed-valence partition; no average-valence assignment.':'Curated monatomic/elemental or oxide/hydroxide carrier with redox-innocent H(+I)/O(-II); equivalent metal sites asserted for this validation scope.',references:[iupac,...(name==='Fe3O4(cr)'?[magnetite]:[])],sourceId:source.id,independentAtoms:{conserved:count,H:h,O:o},aggregateOxidationNumber:sum}}
 }
 const metadata={systemId:system.id,scope:'curated-validation-only',reference:{componentId:system.components[0].id,oxidationState:fixture.reference,provenance:{statement:'Independently identified monatomic reference ion in this curated validation fixture; absolute reference fixed before applying source electron transformations.',references:[iupac]}},carriers}
 const allowedNames=new Set([...prepared.canonical.inventory.sourceComponentIds.map(id=>repository.getComponentById(id).name),'H+','e-','H2O'])
 const model=prepareOxidationAllocation(system,metadata);assert.equal(model.status,'supported-validation',JSON.stringify(model))
 return {prepared,system,metadata,model,session,scope:{element:key,candidateNames:table.map(t=>t[0]),excludedCanonicalCandidates:data.species.filter(s=>s.phase==='solid'&&!names.has(s.name)&&s.metadata.effectiveSourceReaction?.components?.some(t=>prepared.canonical.inventory.sourceComponentIds.some(id=>repository.getComponentById(id).name===t.name))&&s.metadata.effectiveSourceReaction.components.every(t=>!t.coefficient||allowedNames.has(t.name))).map(s=>({id:s.id,name:s.name})),total:.001}}
}
