import {createSpecies} from '../../schema.js'
import {createRepository} from '../../repository.js'
import {composition,balance} from '../../databaseLibrary.js'
import {sourceCharge} from '../spana/names.js'
import {componentRole} from '../../../chemistry/components.js'
import {periodicTable} from '../../../data/periodicTable.js'
import {demoSpecies,demoSource} from '../../../data/species.js'

export const PSI_SHA256='da0f984daceb9d67b37508deced89510d37df6ce374938a55b215e677ae5e4ce'
export const PSI_ID='psi-nagra-2020-v2-1'
export const PSI_NAME='PSI/Nagra 2020 · v2-1 · inorganic'
export const PSI_ORGANIC_ID=PSI_ID+'-organic'
export const PSI_ORGANIC_NAME='PSI/Nagra 2020 · citrate, oxalate and EDTA'
const citation='Hummel W. & Thoenen T. (2023), The PSI Chemical Thermodynamic Database 2020, Nagra NTB 21-03; PHREEQC release v2-1 (2026-02-02).'
const canonical=name=>name.replace(/Cit|Edta|Oxa/g,alias=>({Cit:'(C6H5O7)',Edta:'(C10H12N2O8)',Oxa:'(C2O4)'})[alias]).replace(/([+-])(\d+)$/,(_,sign,n)=>Number(n)===1?sign:` ${n}${sign}`)
const organic=name=>/Cit|Edta|Isa|Oxa|CH4/.test(name)
function side(text){
 return text.trim().split(/\s+\+\s+/).map(term=>{
  const m=term.trim().match(/^(?:(\d+(?:\.\d+)?)\s+)?(\S+)$/)
  if(!m)throw Error('Unsupported reaction term: '+term)
  return {name:canonical(m[2]),coefficient:m[1]?Number(m[1]):1}
 })
}
export function formationFromPhreeqc(equation,rawLogK,phaseName=null){
 const halves=equation.split('=');if(halves.length!==2)throw Error('Expected one reaction equality')
 const left=side(halves[0]),right=side(halves[1]),product=phaseName?left[0]:right[0]
 const name=phaseName?(/\((g|s|cr|am|c|a|vit|ppt)\)$/.test(phaseName)?phaseName:`${phaseName}(s)`):product.name
 const terms=new Map(),add=(t,sign)=>terms.set(t.name,(terms.get(t.name)??0)+sign*t.coefficient/product.coefficient)
 if(phaseName){right.forEach(t=>add(t,1));left.slice(1).forEach(t=>add(t,-1))}
 else {left.forEach(t=>add(t,1));right.slice(1).forEach(t=>add(t,-1))}
 return {name,formula:product.name,components:[...terms].filter(([,n])=>n!==0).map(([name,coefficient])=>({name,coefficient})),logK:rawLogK*(phaseName?-1:1)/product.coefficient}
}
function expand(f,definitions,masters,used=new Map(),trail=[]){
 const terms=new Map();let logK=f.logK
 for(const t of f.components){
  if(masters.has(t.name)){terms.set(t.name,(terms.get(t.name)??0)+t.coefficient);continue}
  const b=definitions.get(t.name)
  if(!b||trail.includes(t.name))throw Error('Cannot resolve source basis: '+t.name)
  used.set(t.name,b)
  const sub=expand(formationFromPhreeqc(b.equation,b.logK),definitions,masters,used,[...trail,t.name])
  logK+=t.coefficient*sub.logK
  for(const c of sub.components)terms.set(c.name,(terms.get(c.name)??0)+t.coefficient*c.coefficient)
 }
 return {...f,logK,components:[...terms].filter(([,n])=>Math.abs(n)>1e-12).map(([name,coefficient])=>({name,coefficient}))}
}

/** Pinned official file; optional citrate/oxalate/EDTA expansion, no inferred constants or SIT evaluation. */
export async function importPsiNagra(bytes,{includeOrganic=false}={}){
 const excluded=name=>includeOrganic?/Isa|CH4/.test(name):organic(name)
 const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(n=>n.toString(16).padStart(2,'0')).join('')
 if(hash!==PSI_SHA256)throw Error('This importer supports the official psinagra2020_v2-1.dat core file only. The file checksum does not match.')
 const text=new TextDecoder().decode(bytes),lines=text.split(/\r?\n/),blocks=[],masters=new Set(),sit=[]
 let section='',pending=null,phaseName=null
 const flush=()=>{if(pending)blocks.push(pending);pending=null}
 lines.forEach((raw,i)=>{
  const line=raw.split('#')[0].trim()
  if(['SOLUTION_MASTER_SPECIES','SIT','SOLUTION_SPECIES','PHASES'].includes(line)){flush();section=line;return}
  if(!line){if(pending)pending.raw.push(raw);return}
  if(section==='SOLUTION_MASTER_SPECIES'){const fields=line.split(/\s+/);if(fields[1]&&!excluded(fields[1]))masters.add(canonical(fields[1]));return}
  if(section==='SIT'){sit.push(raw);return}
  if(!['SOLUTION_SPECIES','PHASES'].includes(section))return
  if(line.includes('=')){flush();pending={line:i+1,equation:line,phaseName:section==='PHASES'?phaseName:null,raw:[raw],logK:null};return}
  if(section==='PHASES'&&!line.startsWith('-')){flush();phaseName=line;return}
  if(pending){pending.raw.push(raw);const k=line.match(/^-log_k\s+([-+\d.eE]+)/i);if(k)pending.logK=Number(k[1])}
 });flush()
 const report={sourceFile:'psinagra2020_v2-1.dat',sha256:hash,totalReactions:blocks.length,imported:0,identities:0,excludedOrganic:0,rejected:[],sitRows:sit.length,scope:'25 °C, 1 bar, ideal activities only. SIT and temperature expressions retained but not evaluated.'}
 const species=[demoSpecies.find(s=>s.id==='water')],names=new Set(masters),definitions=new Map()
 for(const b of blocks.filter(b=>!b.phaseName&&!excluded(b.equation))){try{const f=formationFromPhreeqc(b.equation,b.logK);definitions.set(f.name,b)}catch{/* Recorded below. */}}
 for(const b of blocks){
  if(excluded(b.equation)||excluded(b.phaseName??'')){report.excludedOrganic++;continue}
  try{
   if(!Number.isFinite(b.logK))throw Error('Missing finite log K')
   let f=formationFromPhreeqc(b.equation,b.logK,b.phaseName);const charge=b.phaseName?0:sourceCharge(f.name)
   if(!b.phaseName&&f.components.length===1&&f.components[0].name===f.name&&f.components[0].coefficient===1&&f.logK===0){names.add(f.name);report.identities++;continue}
   const used=new Map();f=expand(f,definitions,masters,used)
   const checked=balance(f.formula,charge,f.components)
   if(checked.atoms!=='balanced'||checked.charge!=='balanced')throw Error('Unsupported formula or unbalanced atoms/charge')
   f.components.forEach(t=>names.add(t.name))
   const id=`psinagra:v2-1:${b.line}`,phase=b.phaseName?(/\(g\)$/.test(b.phaseName)?'gas':'solid'):'aqueous'
   const original={speciesName:b.phaseName??f.name,reaction:b.equation,logK:b.logK,citation,lines:b.raw}
   species.push(createSpecies({id,name:f.name,displayName:f.name,formula:f.formula,phase,charge,elementalComposition:composition(f.formula),discoveryElements:Object.keys(composition(f.formula)),logK:f.logK,logKConvention:'log10 formation constant for one named product from explicit signed source components',temperatureReference:298.15,pressureReference:1,activityModelCompatibility:['SIT'],source:PSI_NAME,sourceDatabase:PSI_ID,sourceRecordId:`line:${b.line}`,citation,notes:[report.scope],qualityFlags:['ideal-approximation-only'],metadata:{sourceFormat:'psinagra-phreeqc-v1',effectiveSourceReaction:{product:f.name,components:f.components},psi:{phaseName:b.phaseName,balance:checked,masters:[...masters],expansion:[...used].map(([name,b])=>({name,equation:b.equation,logK:b.logK}))}},provenance:{kind:'imported',sourceDatabase:PSI_ID,sourceRecordId:`line:${b.line}`,dbSha256:hash,original,originalLogK:b.logK,importDate:'2026-02-02T00:00:00Z',importerVersion:'psinagra-inorganic-1.0.0',comments:[report.scope],qualityFlags:['ideal-approximation-only']}}))
   report.imported++
  }catch(e){report.rejected.push({line:b.line,reaction:b.equation,reason:e.message})}
 }
 const components=[...names].filter(n=>composition(n)!==null).sort().map(name=>({id:`component:${encodeURIComponent(name)}`,name,role:componentRole(name),associations:Object.keys(composition(name)).map(element=>({element,description:name})),provenance:{sourceDatabase:PSI_ID,dbSha256:hash}}))
 const data={species,components,elements:periodicTable,sources:[demoSource,{id:PSI_ID,name:PSI_NAME,citation,url:'https://www.psi.ch/en/les/database',sha256:hash,scope:report.scope,sitParameters:sit}]}
 createRepository(data)
 return {kind:'adams-reaction-database',version:1,data,report}
}

export function supportedPsiRecord(s){
 if(s.metadata?.sourceFormat!=='psinagra-phreeqc-v1'||s.provenance?.dbSha256!==PSI_SHA256||s.temperatureReference!==298.15||s.pressureReference!==1)return false
 try{
  const raw=formationFromPhreeqc(s.provenance.original.reaction,s.provenance.original.logK,s.metadata.psi.phaseName)
  const f=expand(raw,new Map(s.metadata.psi.expansion.map(b=>[b.name,b])),new Set(s.metadata.psi.masters))
  const checked=balance(f.formula,s.charge,f.components)
  return f.name===s.name&&f.logK===s.logK&&JSON.stringify(f.components)===JSON.stringify(s.metadata.effectiveSourceReaction.components)&&checked.atoms==='balanced'&&checked.charge==='balanced'
 }catch{return false}
}

