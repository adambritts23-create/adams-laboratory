import fs from 'node:fs'
import crypto from 'node:crypto'
import assert from 'node:assert/strict'
import {createRepository} from '../../src/thermodynamics/repository.js'
import {repositoryReactionCatalog} from '../../src/thermodynamics/compatibility.js'
export const artifact=JSON.parse(fs.readFileSync('public/data/thermodynamic-default.json'))
export const repo=createRepository(artifact)
const components=repo.getComponents(),byName=new Map(components.map(c=>[c.name,c]))
export const ids={F2:'component:Fe%202%2B',F3:'component:Fe%203%2B',P:'component:H2O2',H:'component:H%2B',W:'component:H2O',Cl:'component:Cl-',e:'component:e-'}
export const initial={Fe:.000001,acid:.01,peroxide:.00000025,chloride:.010002}
// Explicit counterion-redox exclusion; never presented as complete HCl chemistry.
export const counterionRedoxExcluded=new Set([82236,82394,82497,82605,82715,159101,159212].map(n=>`spana:2ac52a30213c9288:${n}`))
// Audit-only graph walk: starts from actual reagent IDs and solvent; e is internal.
export function discover(){
 const reached=new Set([ids.F2,ids.P,ids.H,ids.Cl,ids.W].map(id=>repo.getComponentById(id).name)),rows=repositoryReactionCatalog(repo),electron=components.find(c=>c.role==='electron');reached.add(electron.name)
 let changed=true;while(changed){changed=false;for(const r of rows){const terms=r.metadata?.effectiveSourceReaction?.components;if(r.phase!=='aqueous'||counterionRedoxExcluded.has(r.id)||!terms?.every(t=>!t.coefficient||reached.has(t.name)))continue;if(byName.has(r.name)&&!reached.has(r.name)){reached.add(r.name);changed=true}}}
 return {reached:[...reached],rows:rows.filter(r=>r.phase==='aqueous'&&!counterionRedoxExcluded.has(r.id)&&r.metadata?.effectiveSourceReaction?.components?.every(t=>!t.coefficient||reached.has(t.name))),excluded:rows.filter(r=>r.metadata?.effectiveSourceReaction?.components?.every(t=>!t.coefficient||reached.has(t.name))&&(r.phase!=='aqueous'||counterionRedoxExcluded.has(r.id)))}
}
export const discovery=discover()
// Explicit source-ID composition assignments for this conditional audit only.
const assignments={130813:[0,{Fe:1,O:2,H:2}],131002:[1,{Fe:1,O:2,H:2}],131099:[0,{Fe:1,O:3,H:3}],131406:[-1,{Fe:1,O:3,H:3}],131496:[-1,{Fe:1,O:4,H:4}],131586:[-2,{Fe:1,O:4,H:4}],133463:[4,{Fe:2,O:2,H:2}],135482:[1,{Fe:1,Cl:1}],135557:[2,{Fe:1,Cl:1}],135630:[1,{Fe:1,Cl:2}],135711:[0,{Fe:1,Cl:3}],135791:[-1,{Fe:1,Cl:4}],138672:[-2,{Fe:1,O:4}],138873:[2,{Fe:1,O:1,H:1}],138969:[1,{Fe:1,O:1,H:1}],151381:[0,{H:2}],159033:[0,{H:1,Cl:1}],175307:[-1,{H:1,O:2}],249989:[0,{O:2}],250161:[0,{O:3}],250448:[-1,{O:1,H:1}]}
const base={[ids.F2]:[2,{Fe:1}],[ids.F3]:[3,{Fe:1}],[ids.P]:[0,{H:2,O:2}],[ids.H]:[1,{H:1}],[ids.W]:[0,{H:2,O:1}],[ids.Cl]:[-1,{Cl:1}],[ids.e]:[-1,{}]}
export function physicalId(name){return byName.get(name)?.id??discovery.rows.find(r=>r.name===name)?.id}
export function request({peroxide=initial.peroxide,basis='reagents',history=0,reverse=false}={}){
 const species=Object.entries(base).map(([id,[charge,elements]])=>{const c=repo.getComponentById(id);return {id,name:c.name,charge,elements,phase:id===ids.W?'liquid':'aqueous',role:id===ids.W?'water':id===ids.H?'proton':id===ids.e?'electron':'ordinary',sourceIdentity:{id,reference:'Explicit imported chemical identity; static audit atom/charge assignment',record:c.provenance}}})
 for(const r of discovery.rows){if(species.some(s=>s.id===physicalId(r.name)))continue;const [charge,elements]=assignments[Number(r.id.split(':').at(-1))]??[];assert.ok(elements,`Missing static composition ${r.name}`);assert.equal(charge,r.charge);species.push({id:physicalId(r.name),name:r.name,charge,elements,phase:'aqueous',role:'ordinary',sourceIdentity:{id:r.id,reference:r.citation,record:r.provenance}})}
 const reactions=discovery.rows.map(r=>({id:r.id,productId:physicalId(r.name),terms:r.metadata.effectiveSourceReaction.components.map(t=>({id:physicalId(t.name),coefficient:t.coefficient})),logK:r.logK,phase:r.phase,unit:{kind:'ideal-molal-standard'},provenance:{reference:r.citation,record:r.provenance}}))
 const amounts={[ids.F2]:initial.Fe,[ids.P]:peroxide,[ids.H]:initial.acid,[ids.Cl]:initial.chloride}
 if(history){const x=Math.min(peroxide,initial.Fe/2)/2;amounts[ids.F2]-=2*x;amounts[ids.P]-=x;amounts[ids.H]-=2*x;amounts[ids.F3]=2*x}
 return {mode:'closed-redox',temperatureC:25,pressureBar:1,activityModel:'ideal',unit:'mol/kg-H2O',species,reactions:reverse?[...reactions].reverse():reactions,basisIds:[basis==='reagents'?ids.F2:ids.F3,ids.P,ids.H,ids.Cl,ids.W],electronId:ids.e,solvent:{kind:'fixed-water-activity',speciesId:ids.W,logActivity:0},preparation:{amounts,chargePolicy:'electroneutral',description:'Conditional acidic Fe(II)/peroxide addition; internal electron, counterion redox explicitly excluded; audit prototype'}}
}
export function saveAudit(){
 fs.writeFileSync('docs/closed-redox-step5-sources.json',JSON.stringify({initial,discovery,inputReagents:[ids.F2,ids.P,ids.H,ids.Cl],electronSelected:false,request:request(),note:'Audit prototype only; not production automatic discovery or validated equilibrium'},null,2))
 const paths=[];function walk(p){for(const d of fs.readdirSync(p,{withFileTypes:true})){const f=p+'/'+d.name;if(d.isDirectory())walk(f);else paths.push(f)}}walk('src');walk('public');if(!fs.existsSync('docs/closed-redox-step5-before-hashes.json'))fs.writeFileSync('docs/closed-redox-step5-before-hashes.json',JSON.stringify(Object.fromEntries(paths.map(p=>[p,crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex')])),null,2))
}
