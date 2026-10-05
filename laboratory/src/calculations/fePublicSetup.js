import {feOxidationMetadata} from '../analysis/feOxidationMetadata.js'
import {fePourbaixCandidate} from '../analysis/fePourbaixContract.js'
export const feSourceIds=feOxidationMetadata.rows.map(r=>r.sourceSpeciesId)
const same=(a,b)=>Array.isArray(a)&&a.length===b.length&&new Set(a).size===b.length&&b.every(x=>a.includes(x))
export function publicFeSetupReason(session,preparation,{axes=false}={}) {
  if(!preparation?.ok || preparation.system?.id!==fePourbaixCandidate.systemId || preparation.model?.metadataSha256!==fePourbaixCandidate.metadataSha256) return 'The validated Fe source snapshot is required. Load the supported database and bounded Fe example.'
  const s=session.chemicalSystem,d=session.calculationDefinition
  if(!same(s.selectedComponents,feOxidationMetadata.basisIds)) return 'Fe v1 requires only the Fe²⁺ canonical basis, H⁺, electron and H₂O controls. Load bounded Fe Pourbaix v1.'
  if(!same(s.selectedSpecies,feSourceIds)||!same(s.enabledPhases,['aqueous','solid','liquid'])||!same(d.enabledPhases,['aqueous','solid','liquid'])||(s.excludedSpecies??[]).some(id=>id!==fePourbaixCandidate.excluded[0].id)) return 'Modified phase or carrier scope: Fe v1 requires the validated seven-solid set and all 19 Fe carriers.'
  if(d.temperature.value!==25||s.temperature!==25||d.pressure.value!==1||s.pressure!==1||d.activityModel!=='ideal'||d.ionicStrength.unit!=='mol/kg-H2O'||!['automatic','fixed'].includes(d.ionicStrength.mode)||(d.ionicStrength.mode==='fixed'&&d.ionicStrength.value!==0)) return 'Fe v1 supports only ideal activities at 25 °C and 1 bar declared.'
  const total=d.componentConditions.filter(c=>c.componentId===feOxidationMetadata.conservedComponent)
  if(total.length!==1||total[0].mode!=='T'||total[0].quantity!=='total'||total[0].unit!=='mol/kg-H2O'||total[0].value!==0.001) return 'Unsupported Fe total: v1 requires exactly 0.001 mol/kg H₂O. Other totals are not publicly validated.'
  if(d.mixedSolubility||d.solubilityComparison||d.gridMultiSolid) return 'This specialized configuration is outside bounded Fe v1.'
  if(axes){
    const expected=configurePublicFeDefinition(d)
    if(d.dimensions!==2||JSON.stringify(d.independentVariables)!==JSON.stringify(expected.independentVariables)||JSON.stringify(d.componentConditions)!==JSON.stringify(expected.componentConditions)) return 'Fe v1 requires pH 0–14 (57 points), Eh −1.0–1.2 V vs SHE (45 points), and fixed unit water activity.'
  }
  return null
}
export function configurePublicFeDefinition(definition) {
  const [Fe,H,e,water]=feOxidationMetadata.basisIds
  return {...structuredClone(definition),publicFePourbaix:'fe-v1',dimensions:2,
    output:{...definition.output,type:'log-concentration',speciesIds:feOxidationMetadata.rows.filter(r=>r.id!==Fe).map(r=>r.id)},
    componentConditions:[{componentId:Fe,mode:'T',quantity:'total',unit:'mol/kg-H2O',value:0.001},{componentId:water,mode:'LA',quantity:'log-activity',unit:'dimensionless',value:0}],
    independentVariables:[{componentId:H,mode:'LAV',quantity:'pH',unit:'dimensionless',range:{min:0,max:14},points:57},{componentId:e,mode:'LAV',quantity:'Eh',unit:'V-SHE',range:{min:-1,max:1.2},points:45}]}
}
