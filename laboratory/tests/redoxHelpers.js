import fs from 'node:fs'
import { prepareChemicalSystem } from '../src/solver/models.js'
import { fixedElectronPolicy, solveFixedRedox, peToEh } from '../src/solver/redox.js'
import { multiSolidPolicy } from '../src/solver/assemblages.js'
const database = JSON.parse(fs.readFileSync(new URL('../public/data/thermodynamic-default.json',import.meta.url)))
export const basis = ['Mn 2+','H+','e-','H2O']
export const records = ['MnO4-','MnO2(s)','Mn(cr)'].map(name=>database.species.find(s=>s.name===name))
export function specification(withSolids=false) {
 return { redoxPolicy:fixedElectronPolicy, ...(withSolids?{solidPolicy:multiSolidPolicy}:{}),
 components:basis.map((name,i)=>({id:name,name,role:['ordinary','proton','electron','water'][i]})),
 products:records.slice(0,withSolids?3:1).map(r=>({id:r.id,name:r.name,phase:r.phase,logBeta:r.logK,
 coefficients:basis.map(name=>r.metadata.effectiveSourceReaction.components.find(c=>c.name===name)?.coefficient??0),sourceRecord:r.provenance})),
 basisStatus:'explicit-direct',temperatureC:25,pressureBar:1,unit:'mol/kg-H2O',
 sourceIdentity:{sourceRevision:database.sourceRevision,records:records.slice(0,withSolids?3:1).map(r=>({id:r.id,provenance:r.provenance}))} }
}
export async function prepare(withSolids=false) { const p=await prepareChemicalSystem(specification(withSolids));if(!p.ok)throw Error(JSON.stringify(p));return p.system }
export const point=(system,pH,pe)=>solveFixedRedox(system,{pH,Eh:peToEh(pe),totals:{'Mn 2+':.001}})
export function analytical(pH,pe,withSolids=false) {
 const ratio=10**(-122.5+8*pH+5*pe)
 const caps=withSolids?[{name:'MnO2(s)',log:41.56-4*pH-2*pe},{name:'Mn(cr)',log:39.96+2*pe}]:[]
 const aqueous=.001/(1+ratio), cap=caps.sort((a,b)=>a.log-b.log)[0]
 const free=cap?Math.min(aqueous,10**cap.log):aqueous
 return {free,permanganate:ratio*free,solid:cap&&free<aqueous?{name:cap.name,amount:.001-free*(1+ratio)}:null}
}
