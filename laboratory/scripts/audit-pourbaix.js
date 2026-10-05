/** Read-only scientific audit: no production adapter, classification or solver changes. */
import fs from 'node:fs'
import { createHash } from 'node:crypto'
import { createRepository } from '../src/thermodynamics/repository.js'
import { automaticAuditSession } from './validation/automaticSolidsAudit.js'
import { prepareSessionStructure } from '../src/solver/prepareSession.js'
import { discoverReactionSet } from '../src/thermodynamics/compatibility.js'
import { peToEh } from '../src/solver/redox.js'
const data=JSON.parse(fs.readFileSync('public/data/thermodynamic-default.json')),repo=createRepository(data)
const cases=[]
for(const pair of [['Fe 2+','Fe 3+'],['Cu+','Cu 2+'],['Mn 2+','Mn 3+']]){
  const s=automaticAuditSession(repo,[...pair,'e-']),p=await prepareSessionStructure(s,repo)
  const direct=automaticAuditSession(repo,[pair[0],'e-'])
  const discovery=discoverReactionSet(repo,direct.chemicalSystem)
  const allowed=new Set([...pair,'H+','H2O','e-'])
  const rows=data.species.filter(r=>r.metadata.effectiveSourceReaction?.components.some(t=>pair.includes(t.name))&&r.metadata.effectiveSourceReaction.components.every(t=>allowed.has(t.name)))
  cases.push({pair,dualBasisPreparation:{ok:p.ok,diagnostics:p.diagnostics},automaticSolids:discovery.automaticSolids,
    candidateAudit:rows.map(r=>({id:r.id,name:r.name,phase:r.phase,logK:r.logK,terms:r.metadata.effectiveSourceReaction.components,
      directBasisCompatible:discovery.rows.find(k=>k.species.id===r.id)?.compatible,source:r.provenance.sourceRecordId}))})
}
const protectedFiles=JSON.parse(fs.readFileSync('.local/pourbaix-protected.json'))
const changed=Object.entries(protectedFiles).filter(([p,h])=>createHash('sha256').update(fs.readFileSync(p)).digest('hex')!==h).map(([p])=>p)
console.log(JSON.stringify({decision:'STOP: general production basis transformation and validated session redox policy absent; Pourbaix remains pending',
  conversion:{voltsPerPeAt25C:peToEh(1),reference:'SHE',logElectronActivity:'-pe'},cases,
  waterReferences:data.species.filter(s=>['H2(g)','O2(g)'].includes(s.name)).map(s=>({name:s.name,logK:s.logK,terms:s.metadata.effectiveSourceReaction.components})),
  protectedFiles:{count:Object.keys(protectedFiles).length,changed},productionChanges:[],deployed:false},null,2))
