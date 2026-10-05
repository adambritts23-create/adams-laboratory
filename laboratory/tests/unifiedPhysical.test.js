import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import {repo,common,contribution,requestFor,reference} from '../scripts/validation/nonRedoxPhysicalBenchmark.js'
import {compileEquilibriumNetwork,solveEquilibriumNetwork} from '../src/thermodynamics/equilibriumNetwork.js'
import {preparePhysicalContributions} from '../src/thermodynamics/physicalPreparation.js'
import {discoverGeneralClosed,prepareGeneralClosed} from '../src/thermodynamics/generalClosedReagents.js'
import {independentEu} from '../scripts/validation/openClosedIndependent.js'
import {prepareWetLabStocks} from '../src/calculations/wetLabSetup.js'
import {prepareWetLabScope,runTitration} from '../src/calculations/wetLabTitration.js'
import {createWetLabAnalysis} from '../src/calculations/wetLabAnalysis.js'
const H='component:H%2B',Cl='component:Cl-',Cr='component:Cr%203%2B',NaOH='spana:2ac52a30213c9288:224689'
const request=amounts=>({...common,boundary:'physical-preparation',preparation:{provenance:'Unified source-bound physical regression',solventCoordinate:{convention:'explicit-solvent-mass-kg',modelSolventMassKg:1},contributions:Object.entries(amounts).map(([id,m],i)=>contribution(String(i),id,m))}})
const solve=async q=>{const compiled=await compileEquilibriumNetwork(repo,q);assert.ok(compiled.ok,JSON.stringify(compiled.diagnostics));return {compiled,result:solveEquilibriumNetwork(compiled)}}
const chromium=JSON.parse(fs.readFileSync('docs/cr-reagent-independent-reference.json')).points
const crRequest=v=>({...request({[Cr]:.0005,[Cl]:.0015,[NaOH]:v*.0001}),phases:['aqueous','pure-solids'],preparation:{...request({[Cr]:.0005,[Cl]:.0015,[NaOH]:v*.0001}).preparation,solventCoordinate:{convention:'dilute-ideal-aqueous-volume-v0',volumeMl:50+v,modelSolventMassKg:(50+v)/1000}}})

test('unified physical route retains independent acetate/borate values and has no derived Eh',async()=>{
 for(const v of [0,5,10,20,100]){const {compiled,result}=await solve({...requestFor(v),boundary:'physical-preparation'}),expected=reference.benchmark.find(p=>p.volumeMl===v);assert.ok(result.ok);assert.equal(compiled.boundary,'closed-physical-nonredox');assert.ok(Math.abs(result.derived.pH-expected.pH)<1e-9);assert.equal(result.notDetermined.Eh.status,'not-determined');for(const [i,id] of result.accepted.speciesIds.entries()){const carrier=[...compiled.preparedSystemInput.system.components,...compiled.preparedSystemInput.system.products].find(c=>c.id===id);if(carrier.role==='water')continue;assert.ok(Math.abs(result.accepted.concentrations[i]-expected.amounts[carrier.name])<1e-10)}}
})
test('positive physical source base projects to signed proton equivalents without negative reagents',async()=>{
 const q=crRequest(10),p=await preparePhysicalContributions(repo,q.preparation);assert.equal(p.amounts[NaOH],.001/.06);assert.equal(p.solverCoordinates.componentMoles[H],-.001);assert.equal(p.physicalPreparation.contributions.at(-1).componentMoles['component:H2O'],.001);assert.ok(Object.values(p.amounts).every(n=>n>=0));
 const {compiled,result}=await solve(q);assert.ok(result.ok);assert.equal(compiled.boundary,'closed-physical');assert.ok(compiled.preparedSystemInput.prepared.preparation.physicalPreparation)
})
test('unified physical redox preserves exact reviewed Fe peroxide source scope and reference',async()=>{
 for(const e of JSON.parse(fs.readFileSync('docs/closed-redox-step5-independent-points.json'))){const q={...request({'component:Fe%202%2B':1e-6,'component:H2O2':e.peroxideSupplied,[H]:.01,[Cl]:.010002}),reviewedScope:true};const {compiled,result}=await solve(q);assert.equal(compiled.boundary,'closed-physical');assert.ok(result.ok,JSON.stringify(result.diagnostics));assert.ok(Math.abs(result.accepted.inspection.pH-e.pH)<1e-9);assert.ok(Math.abs(result.accepted.inspection.pe-e.pe)<1e-9);for(const c of result.accepted.inspection.carriers)if(e.amounts[c.id]!==undefined)assert.ok(Math.abs(c.amount-e.amounts[c.id])<1e-10)}
})
test('non Fe Cr europium control uses the same physical contract and independent source reference',async()=>{
 const {result}=await solve(request({'component:Eu%203%2B':1e-6,[H]:.01,[Cl]:.010003})),expected=independentEu();assert.ok(result.ok);assert.ok(Math.abs(result.accepted.inspection.pH-expected.pH)<1e-10);assert.ok(Math.abs(result.accepted.inspection.pe-expected.pe)<1e-10)
})
test('all twelve independent Cr doses reproduce pH pe aqueous carriers solid inventory and closure',async()=>{
 for(const p of chromium){const {result:r}=await solve(crRequest(p.volumeMl));assert.ok(r.ok,JSON.stringify(r.diagnostics));const actual=r.accepted.inspection;assert.ok(Math.abs(actual.pH-p.reference.pH)<1e-8);assert.ok(Math.abs(actual.pe-p.reference.pe)<1e-8);for(const c of p.reference.carriers){const got=actual.carriers.find(a=>a.name===c.name);assert.ok(got,c.name);assert.ok(Math.abs(got.amount-c.amount)<1e-10,c.name)}for(const c of p.reference.phases.filter(c=>c.phase==='solid'&&c.amount>0)){const got=actual.acceptedSolids.find(s=>s.name===c.name);assert.ok(got);assert.ok(Math.abs(got.amount-c.amount)<1e-10)}assert.ok(r.accepted.closed.inspection.inventories.every(i=>i.ok));assert.ok(Math.abs(actual.elements.Cr.solidBound-p.solidCr)<1e-10)}
})
test('unknown metadata physical negatives conflicting constraints forged and stale preparations refuse',async()=>{
 for(const q of [{...crRequest(5),revision:-1},{...crRequest(5),sourceFingerprint:'changed'},{...crRequest(5),constraints:[]},request({[Cr]:-1}),request({'component:e-':1})])assert.equal((await compileEquilibriumNetwork(repo,q)).ok,false)
 const p=await preparePhysicalContributions(repo,crRequest(5).preparation),a=await discoverGeneralClosed(repo,p.selectedIds);assert.equal((await prepareGeneralClosed(repo,{amounts:p.amounts},a,{...p})).ok,false)
 const {compiled:c}=await solve(crRequest(5));assert.equal(solveEquilibriumNetwork({...c}).ok,false)
 const {compiled:d}=await solve({...crRequest(5),revision:1});assert.notEqual(c.preparedSystemInput.prepared.input.id,d.preparedSystemInput.prepared.input.id)
})
test('gas and required excluded solids remain refusals after automatic routing',async()=>{
 const {result:r}=await solve(request({'component:H2O2':.01}));assert.equal(r.ok,false);assert.equal(r.diagnostics[0].code,'gas-inventory-headspace-required')
 const {result:s}=await solve({...crRequest(10),phases:['aqueous']});assert.equal(s.ok,false);assert.ok(s.diagnostics[0].code.includes('phase'))
})
test('ordinary reviewed chromium recipe feeds Wet Lab and elemental plots using exact accepted objects',async()=>{
 const stocks=prepareWetLabStocks({sample:{reagent:'CrCl3',volumeMl:50,concentrationMolPerL:.01},titrant:{reagent:'NaOH',volumeMl:100,concentrationMolPerL:.1}},3),context=await prepareWetLabScope(repo,stocks,{enabledPhases:['aqueous','solid']},3)
 const series=await runTitration(context,{analyteStock:stocks.sample,analyteVolumeMl:50,titrantStock:stocks.titrant,revision:3,additionVolumesMl:[0,7,10,20,100]})
 assert.ok(series.states.every(s=>s.status==='accepted-v0'));assert.ok(series.states[2].equilibrium.inspection.visual.bedHeight>0)
 const points=series.curve,analysis=createWetLabAnalysis({snapshot:()=>({points}),validate:p=>p.state})
 for(const type of ['total-fraction','aqueous-fraction']){const view=analysis.view(type,'element:Cr');assert.ok(view.available);for(let i=0;i<points.length;i++){assert.ok(Math.abs(view.series.reduce((n,s)=>n+(s.points[i].value??0),0)-1)<1e-8);assert.ok(view.series.every(s=>s.points[i].result===points[i].state.equilibrium.result))}}
 assert.ok(analysis.view('log-concentration').series.some(s=>s.phase==='solid'))
 assert.equal(analysis.inspect(points[2]),series.states[2]);assert.ok(Number.isFinite(series.states[2].equilibrium.derived.Eh))
})
