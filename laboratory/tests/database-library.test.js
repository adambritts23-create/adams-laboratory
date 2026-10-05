import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import {repositoryFromSnapshot} from '../src/thermodynamics/snapshot.js'
import {emptyLibrary,composition,balance,createEditedRecord,savePersonalRecord,compileLibrary,resolveLibrary,exportLibrary,importLibrary,resetToSpana,addDatabase,setLayerEnabled,reactionSignature,draftFromRecord} from '../src/thermodynamics/databaseLibrary.js'
import {isSupportedUserSpecies} from '../src/thermodynamics/userEquilibria.js'
const snapshot=JSON.parse(fs.readFileSync(new URL('../public/data/thermodynamic-default.json',import.meta.url)))
const base=repositoryFromSnapshot(snapshot)
const original=base.getSpecies().find(s=>s.name==='HCO3-')
const draft=()=>({...draftFromRecord(original),logK:10.4})
function added(){const record=createEditedRecord(draft(),base,'user:carbonate-test');return {record,library:savePersonalRecord(base,emptyLibrary(),record)}}
test('formula parser handles nesting, ions and unknown aliases without guessing',()=>{
 assert.deepEqual(composition('Ca(OH)2'),{Ca:1,O:2,H:2});assert.deepEqual(composition('CO3 2-'),{C:1,O:3});assert.deepEqual(composition('NH4+'),{N:1,H:4});assert.deepEqual(composition('e-'),{});assert.equal(composition('EDTA 4-'),null);assert.equal(composition('Quartz'),null)
})
test('atom and charge checks independently reject unbalanced data',()=>{
 assert.deepEqual(balance('HCO3-',-1,[{name:'H+',coefficient:1},{name:'CO3 2-',coefficient:1}]).atoms,'balanced')
 assert.equal(balance('HCO3-',-1,[{name:'H+',coefficient:2},{name:'CO3 2-',coefficient:1}]).charge,'unbalanced')
 assert.equal(balance('EDTA 4-',-4,[{name:'EDTA 4-',coefficient:1}]).atoms,'unknown')
 assert.throws(()=>createEditedRecord({...draft(),terms:[{name:'H+',coefficient:2},{name:'CO3 2-',coefficient:1}]},base,'user:bad'),/unbalanced/)
 assert.throws(()=>createEditedRecord({...draft(),logK:''},base,'user:bad'),/required/)
})
test('new records start disabled; enabled equivalent overrides original without mutating it',()=>{
 const {record,library}=added();assert.equal(record.metadata.editor.supported,true)
 assert.equal(compileLibrary(base,library).repository.getSpeciesById(record.id),null)
 const enabled=setLayerEnabled(library,'personal',true),compiled=compileLibrary(base,enabled)
 assert.equal(compiled.repository.getSpeciesById(original.id),null);assert.equal(compiled.repository.getSpeciesById(record.id).logK,10.4)
 assert.equal(base.getSpeciesById(original.id).logK,10.327)
 assert.equal(isSupportedUserSpecies(compiled.repository.getSpeciesById(record.id),compiled.repository),true)
 const old=compileLibrary(base,{...enabled,preferNew:false});assert.equal(old.repository.getSpeciesById(original.id).logK,10.327)
 const c=compiled.conflicts.find(c=>c.rows.some(r=>r.record.id===record.id));assert.equal(c.kind,'Different constants')
 const chosen=compileLibrary(base,{...enabled,choices:{[c.identity]:`base|${original.id}`}});assert.equal(chosen.repository.getSpeciesById(record.id),null)
})
test('source library round trip retains data and disabled state, reset restores original',()=>{
 const {library}=added();const restored=importLibrary(exportLibrary(base,library))
 assert.deepEqual(restored.library,library);assert.equal(restored.base.getSpeciesIdentities().length,4445)
 const reset=resetToSpana(base,setLayerEnabled(library,'personal',true));assert.equal(reset.layers.length,0);assert.equal(compileLibrary(base,reset).repository.getSpeciesById(original.id).logK,10.327)
})
test('an identical imported Spana snapshot retains original reaction bases and deduplicates safely',()=>{
 let library=addDatabase(base,emptyLibrary(),snapshot,'Spana copy','copy')
 assert.equal(compileLibrary(base,library).repository.getSpeciesIdentities().length,4445)
 library=setLayerEnabled(library,'copy',true)
 const result=compileLibrary(base,library);assert.equal(result.conflicts.filter(c=>!c.winner).length,0)
 assert.equal(result.repository.getSpeciesIdentities().length,4445)
})
test('unsupported temperature and unknown composition remain review-only even if enabled',()=>{
 const record=createEditedRecord({...draft(),temperature:310},base,'user:temperature')
 assert.equal(record.metadata.editor.supported,false)
 const library=setLayerEnabled(savePersonalRecord(base,emptyLibrary(),record),'personal',true)
 assert.equal(compileLibrary(base,library).repository.getSpeciesById(record.id),null)
})
test('different reference conditions require explicit selection, never automatic replacement',()=>{
 const data=structuredClone(snapshot);const record=data.species.find(s=>s.id===original.id);record.temperatureReference=303.15
 let library=setLayerEnabled(addDatabase(base,emptyLibrary(),data,'Other temperature','other'),'other',true)
 const result=resolveLibrary(base,library),conflict=result.conflicts.find(c=>c.rows.some(r=>r.record.id===original.id))
 assert.equal(conflict.winner,null)
 library={...library,choices:{[conflict.identity]:`base|${original.id}`}}
 assert.equal(compileLibrary(base,library).repository.getSpeciesById(original.id).temperatureReference,298.15)
})
test('reaction comparison normalizes reversal without changing stored constants',()=>{
 const a={name:'AB',phase:'aqueous',logK:2,temperatureReference:298.15,pressureReference:null,logKConvention:'log10 formation constant',metadata:{effectiveSourceReaction:{components:[{name:'A',coefficient:1},{name:'B',coefficient:1}]}}}
 const b={...a,name:'A',logK:-2,metadata:{effectiveSourceReaction:{components:[{name:'AB',coefficient:1},{name:'B',coefficient:-1}]}}}
 assert.deepEqual(reactionSignature(a),reactionSignature(b));assert.equal(a.logK,2)
})
