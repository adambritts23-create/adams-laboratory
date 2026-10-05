import { peToEh } from '../solver/redox.js'
export function waterReferences(inventory,pH,temperatureC=25){
 if(!Number.isFinite(pH)||temperatureC!==25)throw Error('Water reference overlays are validated only at 25 °C.')
 return inventory.water.map(r=>{
 const nH=r.coefficients.find(c=>c.name==='H+')?.coefficient,nE=r.coefficients.find(c=>c.name==='e-')?.coefficient
 if(!Number.isFinite(nH)||!Number.isFinite(nE)||nE===0||r.temperatureK!==298.15)throw Error('Incomplete water reference reaction.')
 const pe=(r.logBeta-nH*pH)/nE
 return {name:r.name,pH,pe,Eh:peToEh(pe,temperatureC),referenceElectrode:'SHE',temperatureC,
 assumptions:'Unit normalized gas fugacity f/f°=1 and a(H2O)=1; source reference-pressure scalar unavailable. Analytical reference only; gases not included in the equilibrium solve.',sourceId:r.id,logBeta:r.logBeta,logGasActivity:0,equation:'log(a_gas)=logBeta - nu_H*pH - nu_e*pe = 0'}
 })
}
