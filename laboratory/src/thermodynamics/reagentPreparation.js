import {componentMetadata} from './componentMetadata.js'
import {freeze} from '../solver/models.js'

export const reagentPreparationVersion='reagent-preparation-v1'
const F='component:Fe%202%2B',C='component:Cl-',H='component:H%2B',P='component:H2O2',Eu='component:Eu%203%2B'
// Small identity catalogue. Recipes introduce inventories, never equilibrium species amounts.
export const reagentRecipes=freeze([
 {id:'ferrous-chloride',label:'FeCl₂ solution',formula:'FeCl2',elements:{Fe:1,Cl:2},components:{[F]:1,[C]:2},counterions:[C],provenance:'Explicit Fe(II) chloride stoichiometry, reviewed Fe/Cl source identities'},
 {id:'hydrochloric-acid',label:'HCl solution',formula:'HCl',elements:{H:1,Cl:1},components:{[H]:1,[C]:1},counterions:[C],provenance:'Explicit hydrogen chloride stoichiometry, reviewed H/Cl source identities'},
 {id:'hydrogen-peroxide',label:'H₂O₂ solution',formula:'H2O2',elements:{H:2,O:2},components:{[P]:1},counterions:[],provenance:'Reviewed Step-5 peroxide identity; no stabilizers or stock impurities represented'},
 {id:'europium-chloride',label:'EuCl₃ solution',formula:'EuCl3',elements:{Eu:1,Cl:3},components:{[Eu]:1,[C]:3},counterions:[C],provenance:'https://pubchem.ncbi.nlm.nih.gov/compound/24809 — europium(3+) trichloride'},
])
export function preparationCharge(amounts,metadata){
 const contributions=[]
 for(const [id,amount] of Object.entries(amounts)){
  const m=metadata[id]
  if(!m||!Number.isFinite(amount)||amount<0||['water','electron'].includes(m.role))return {ok:false,code:'invalid-reagent-inventory',message:'Supply finite nonnegative solute amounts with reviewed identities; no electron or solvent inventory.'}
  contributions.push({id,name:m.name,amount,charge:m.charge,equivalents:amount*m.charge})
 }
 const netCharge=contributions.reduce((n,c)=>n+c.equivalents,0)
 // Exactly the existing closed preparation arithmetic allowance, not a new tolerance.
 const limit=128*Number.EPSILON*Math.max(1,contributions.reduce((n,c)=>n+Math.abs(c.equivalents),0))
 const ok=Math.abs(netCharge)<=limit
 return {ok,code:ok?'electroneutral':'unbalanced-preparation',netCharge,unit:'mol charge equivalents/kg H2O',limit,contributions,missingCountercharge:-netCharge,message:ok?'Preparation is electroneutral.':`Net supplied charge ${netCharge.toExponential(8)} mol charge equivalents/kg H₂O. Supply ${(-netCharge).toExponential(8)} countercharge explicitly. Select a compatible counterion or use a defined neutral reagent recipe (for example FeCl₂ for Fe²⁺). None is added automatically.`}
}
const preparations=new WeakSet()
const fail=message=>({ok:false,diagnostics:[{code:'invalid-reagent-preparation',message}]})
export async function prepareReagent(repository,request){
 if(!request||Object.keys(request).some(k=>!['recipeId','molality','solventMassKg'].includes(k)))return fail('Specify a reviewed recipe, mol/kg H₂O and kg solvent. Volume/molarity requires an explicit density/conversion model and is not supported.')
 const recipe=reagentRecipes.find(r=>r.id===request.recipeId),mass=request.solventMassKg
 if(!recipe||!Number.isFinite(mass)||mass<=0||!Number.isFinite(request.molality)||request.molality<0)return fail('Unknown recipe or invalid molality/solvent mass.')
 const registry=await componentMetadata(repository),amounts=Object.fromEntries(Object.entries(recipe.components).map(([id,n])=>[id,n*request.molality]))
 const charge=preparationCharge(amounts,registry.entries)
 if(!charge.ok)return fail(charge.message)
 const atoms={};for(const [id,n] of Object.entries(recipe.components))for(const [e,k] of Object.entries(registry.entries[id].elements))atoms[e]=(atoms[e]??0)+n*k
 if(JSON.stringify(Object.entries(atoms).sort())!==JSON.stringify(Object.entries(recipe.elements).sort()))return fail('Recipe and source-bound elemental inventories disagree.')
 const value=freeze({ok:true,version:reagentPreparationVersion,metadataVersion:registry.version,recipe,solvent:'H2O',solventMassKg:mass,unit:'mol/kg-H2O',amounts,moles:Object.fromEntries(Object.entries(amounts).map(([id,n])=>[id,n*mass]))})
 preparations.add(value);return value
}
export function mixPreparations(parts){
 if(!Array.isArray(parts)||!parts.length||parts.some(p=>!preparations.has(p)))return fail('Mix only branded preparations; no assumed density, volume additivity or hidden counterions.')
 const solventMassKg=parts.reduce((n,p)=>n+p.solventMassKg,0),moles={}
 for(const p of parts)for(const [id,n] of Object.entries(p.moles))moles[id]=(moles[id]??0)+n
 if(!Number.isFinite(solventMassKg)||Object.values(moles).some(n=>!Number.isFinite(n)))return fail('Mixing overflow.')
 const value=freeze({ok:true,version:reagentPreparationVersion,solvent:'H2O',unit:'mol/kg-H2O',solventMassKg,moles,amounts:Object.fromEntries(Object.entries(moles).map(([id,n])=>[id,n/solventMassKg])),sources:parts.map(p=>p.recipe??p.sources)})
 preparations.add(value);return value
}
