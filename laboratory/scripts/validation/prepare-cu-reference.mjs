import fs from 'node:fs'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
const hash=b=>createHash('sha256').update(b).digest('hex'),manifest=JSON.parse(fs.readFileSync('tests/fixtures/eq-diagr/references.json'))
const library=manifest.librarySources.map(r=>{const actual=hash(fs.readFileSync('.local/phase4-reference/library/src/'+r.path));assert.equal(actual,r.sha256);return {...r,actual}})
fs.writeFileSync('.local/cu-phase/official-library-verification.json',JSON.stringify({revision:manifest.sourceRevision,library},null,2))
const d=JSON.parse(fs.readFileSync('public/data/thermodynamic-default.json')),source=id=>d.species.find(s=>s.id==='spana:2ac52a30213c9288:'+id)
// Independent research mapping, explicitly reviewed source identities. Not imported by Adam.
// [offset, state, Cu atoms] in official reader order: free basis then 9 aqueous products then 4 solids.
const inventory=[[97858,2,1],[103398,1,1],[102305,2,1],[102484,1,1],[102572,2,1],[102662,2,1],[104107,2,2],[105296,2,3],[110864,1,1],[110948,2,1],[102394,2,1],[104641,1,2],[110778,2,1],[98874,0,1]]
// Derive matching thermodynamics independently from original source terms, not Adam's compiler output.
// Cu+ = Cu2+ + e-, original bridge logK 2.833, source 103398.
const bridge=source(103398);assert.equal(bridge.logK,2.833)
const transformed=inventory.slice(1).map(([id,state,count])=>{
 const s=source(id),coefficients=[0,0,0,0];let logK=s.logK
 for(const t of s.metadata.effectiveSourceReaction.components){switch(t.name){case 'Cu 2+':coefficients[0]+=t.coefficient;break;case 'Cu+':coefficients[0]+=t.coefficient;coefficients[2]+=t.coefficient;logK+=t.coefficient*bridge.logK;break;case 'H+':coefficients[1]+=t.coefficient;break;case 'e-':coefficients[2]+=t.coefficient;break;case 'H2O':coefficients[3]+=t.coefficient;break;default:throw Error('unmatched ligand '+t.name)}}
 assert.equal(coefficients[0],count);assert.equal(2*count-coefficients[2],state*count)
 return {id:s.id,name:s.name,phase:s.phase,state,count,sourceLogK:s.logK,logK,coefficients,sourceReaction:s.metadata.effectiveSourceReaction,sourceCitation:s.provenance.resolvedCitation}
})
fs.writeFileSync('.local/cu-phase/matched-cu.dat',['4, 9, 4, 0','Cu 2+','H+','e-','H2O',...transformed.map(r=>[r.name,r.logK,...r.coefficients].join(', '))].join('\n')+'\n')
// Same pe as Adam, using its unchanged physical conversion constant; the equilibrium solve is independent.
const factor=0.059159349684782335
const coordinates=[];for(let iy=0;iy<45;iy++)for(let ix=0;ix<57;ix++){const Eh=-1+iy*.05;coordinates.push([iy*57+ix,ix*.25,Eh,Eh/factor].join(','))}
fs.writeFileSync('.local/cu-phase/coordinates.csv',coordinates.join('\n')+'\n')
fs.writeFileSync('.local/cu-phase/independent-chemistry.json',JSON.stringify({total:0.0001,inventory,transformed},null,2))
console.log('Verified '+library.length+' pinned official sources; wrote independent Cu source transformation.')
