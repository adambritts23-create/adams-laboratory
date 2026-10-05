import fs from 'node:fs'
import assert from 'node:assert/strict'
import { audit,prepare,analytical,gridDefinition,classify,coordinates,classificationCriterion } from './validation/mnAudit.js'
import { createGridDefinition,runGrid } from '../src/calculations/grid.js'
import { solveFixedRedox,peToEh } from '../src/solver/redox.js'
const system=await prepare(),request=await createGridDefinition(system,gridDefinition(system),0)
assert.ok(request.ok)
const grid=await runGrid(system,request.grid)
const stats={...grid.counts,ambiguous:0,assemblages:{},maximumLogFreeError:0,maximumBalanceResidual:0,maximumMassActionResidual:0,maximumActiveSaturationResidual:0,failedAttemptCodes:{}}
const samples=grid.outcomes.map(o=>{
 const coord=coordinates(o),classification=classify(system,o)
 let comparison=null
 if(o.result.ok){
 const expected=analytical(coord.pH,coord.pe),logFreeError=Math.abs(Math.log10(expected.free)-o.result.logActivities[0])
 assert.ok(logFreeError<1e-8)
 const active=o.result.solids.filter(s=>s.amount>0)
 assert.deepEqual(active.map(s=>s.id),expected.solid?[expected.solid.id]:[])
 const key=active.map(s=>s.name).join(' + ')||'aqueous only';stats.assemblages[key]=(stats.assemblages[key]??0)+1
 stats.maximumLogFreeError=Math.max(stats.maximumLogFreeError,logFreeError)
 stats.maximumBalanceResidual=Math.max(stats.maximumBalanceResidual,Math.abs(o.result.residuals.componentBalance[0]))
 stats.maximumMassActionResidual=Math.max(stats.maximumMassActionResidual,...o.result.residuals.massActionLog.map(Math.abs))
 stats.maximumActiveSaturationResidual=Math.max(stats.maximumActiveSaturationResidual,...active.map(s=>Math.abs(s.logSaturation)))
 comparison={expected,logFreeError}
 }else{if(classification.status==='ambiguous')stats.ambiguous++
 for(const a of o.result.attempts??[])if(a.code)stats.failedAttemptCodes[a.code]=(stats.failedAttemptCodes[a.code]??0)+1}
 return {index:o.index,coordinates:coord,classification,comparison}
})
const coexistence=await solveFixedRedox(system,{pH:9,Eh:peToEh(5.025),totals:{'Mn 2+':.001}})
assert.equal(coexistence.diagnostics[0].code,'ambiguous-solid-assemblage')
const evidence={kind:'internal-restricted-Mn-H-O-sampled-validation',scope:'Bundled audited Mn-H-O candidates only; not a complete real-water Pourbaix model.',classificationCriterion,stats,audit,system,grid,samples,coexistence}
fs.writeFileSync('docs/mn-grid-validation.json',JSON.stringify(evidence,null,2)+'\n')
const colors={'aqueous only':'#8b9da9','Mn(cr)':'#536dfe','Mn(OH)2(am)':'#008577','Mn3O4(s)':'#bf7b00','Mn2O3(cr)':'#a43cb5','MnO2(s)':'#cc4934'}
const escape=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')
let svg='<svg xmlns="http://www.w3.org/2000/svg" width="1150" height="760" style="width:100%;height:auto;max-width:1150px" viewBox="0 0 1150 760"><rect width="1150" height="760" fill="#f7fafc"/><g font-family="Arial,sans-serif" fill="#172b3a">'
svg+='<text x="55" y="38" font-size="23">Mn–H–O · internal sampled equilibrium validation</text><text x="55" y="66" font-size="15">Total Mn = 0.001 mol/kg-H₂O · 25 °C · ideal · declared 1 bar · fixed pH / Eh</text><text x="55" y="91" font-size="14">166 accepted / 195 requested · 29 failures remain unavailable · no interpolated boundaries</text>'
const px=x=>90+x*46,py=y=>620-(y+1.5)*153
for(let pH=0;pH<=14;pH+=2)svg+=`<path d="M ${px(pH)} 150 V 620" stroke="#dde5eb"/><text x="${px(pH)}" y="650" text-anchor="middle">${pH}</text>`
for(const Eh of [-1.5,-1,-.5,0,.5,1,1.5])svg+=`<path d="M 90 ${py(Eh)} H 734" stroke="#dde5eb"/><text x="75" y="${py(Eh)+5}" text-anchor="end">${Eh}</text>`
svg+='<text x="400" y="682" font-size="18">pH</text><text transform="translate(27 445) rotate(-90)" font-size="18">Eh (V versus SHE)</text>'
for(const o of grid.outcomes){const x=px(o.x),y=py(o.y);if(!o.result.ok){svg+=`<path d="M ${x-5} ${y-5} l 10 10 m -10 0 l 10 -10" stroke="#a51428" stroke-width="2"><title>${escape(`pH ${Number(o.x.toPrecision(6))}; Eh ${Number(o.y.toPrecision(6))}; ${o.diagnostics.map(d=>d.code).join(', ')}`)}</title></path>`;continue}
 const key=o.result.solids.filter(s=>s.amount>0).map(s=>s.name).join(' + ')||'aqueous only'
 svg+=`<circle cx="${x}" cy="${y}" r="7" fill="${colors[key]}"><title>${escape(`pH ${Number(o.x.toPrecision(6))}; Eh ${Number(o.y.toPrecision(6))}; ${key}; aqueous mixture retained in JSON`)}</title></circle>`}
svg+='<text x="800" y="164" font-size="18">Accepted assemblage</text>'
Object.entries(colors).forEach(([name,color],i)=>{svg+=`<circle cx="810" cy="${200+i*37}" r="7" fill="${color}"/><text x="831" y="${205+i*37}" font-size="15">${escape(name)} (${stats.assemblages[name]??0})</text>`})
svg+='<text x="800" y="451" fill="#a51428">× Failed sample (29)</text><text x="800" y="490">Dots show sampled solids,</text><text x="800" y="514">not exclusive species regions.</text><text x="800" y="549">All aqueous distributions and</text><text x="800" y="573">solid amounts remain in JSON.</text><text x="55" y="721" font-size="14">No water-stability lines. Restricted database domain. Separate coexistence probe is explicitly ambiguous.</text></g></svg>'
fs.writeFileSync('docs/mn-validation-map.svg',svg+'\n')
console.log(JSON.stringify(stats,null,2))
