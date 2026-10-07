import {createSpecies} from './schema.js'
import {composition,balance} from './databaseLibrary.js'

export const URANIUM_LITERATURE_ID='uranium-literature-2026-10'
export const SPANA_URANIUM_ID='spana-uranium-literature'
export const uraniumLiteratureName='Uranium · literature and experimental extension'
const meca='Meca et al. (2011), Dalton Transactions 40, 7976–7982. https://doi.org/10.1039/c0dt01672a'
const gimenez='Giménez et al. (2014), Applied Geochemistry 49, 42–45. https://doi.org/10.1016/j.apgeochem.2014.07.004'
const aucSolubility='Crouse & Hurst, ORNL CF-60-5-114 (1960), section 1.1.1, printed p. 7. https://doi.org/10.2172/4179323; https://digital.library.unt.edu/ark:/67531/metadc864673/m1/11/'
// Conditional estimate: mean dissolved U in four 2 M ammonium-salt mixtures.
// Approximate free NH4 by 4 M and dissolved U by uranyl tricarbonate; NOT a measured thermodynamic Ksp.
export const AUC_CONDITIONAL_LOG_KSP=Math.log10(((1.35+1.39+1.46+1.47)/4/238.02891)*4**4)
const auc='Mellah, Chegrouche & Barkat (2007), Hydrometallurgy 85, 163–171. https://doi.org/10.1016/j.hydromet.2006.08.011; Hung et al. (2024), Heliyon 10, e25930. https://doi.org/10.1016/j.heliyon.2024.e25930'
const adu='Optical vibrational spectroscopic signatures of ammonium diuranate process parameters (2025). https://pmc.ncbi.nlm.nih.gov/articles/PMC11872519/'
export const uraniumLiteratureScope='Literature/experimental extension, not official Spana or PSI/Nagra data. Ideal activities at 25 °C; 1 bar is the application reference assumption. Peroxide is conserved independently: decomposition, radiolysis, kinetic effects and peroxo-carbonate complexes are not modelled.'
const peroxideComponent={id:'component:H2O2',name:'H2O2',role:'basis-choice',associations:[{element:'H',description:'Hydrogen peroxide'},{element:'O',description:'Hydrogen peroxide'}],provenance:{sourceDatabase:URANIUM_LITERATURE_ID,reference:meca,scope:'Independent peroxide inventory; no redox conversion to water.'}}
export const supportedLiteratureComponent=c=>JSON.stringify(c)===JSON.stringify(peroxideComponent)

/** Source equations retained verbatim in convention, with explicit basis conversion. */
export function uraniumLiteratureRecords(waterLogK,overrides={},substitutions=[]){
 if(!Number.isFinite(waterLogK))throw Error('A supported water dissociation constant is required.')
 const entries=[
  {key:'studtite',name:'UO2(O2)(H2O)4(s)',displayName:'Studtite · uranyl peroxide tetrahydrate',phase:'solid',charge:0,k:2.7,rawK:-2.7,uncertainty:.2,citation:gimenez,
   equation:'UO2(O2)(H2O)4(s) + 2 H+ = UO2 2+ + 4 H2O + H2O2',terms:[['UO2 2+',1],['H2O',4],['H2O2',1],['H+',-2]],conversion:'Reverse the reported dissolution reaction: log K formation = +2.7. The ±0.2 uncertainty is not propagated by the solver.'},
  {key:'mono-peroxo',name:'UO2(O2)(OH)2 2-',displayName:'Uranyl monoperoxo dihydroxo',phase:'aqueous',charge:-2,k:28.1+4*waterLogK,rawK:28.1,uncertainty:.1,citation:meca,
   equation:'UO2 2+ + H2O2 + 4 OH- = UO2(O2)(OH)2 2- + 2 H2O',terms:[['UO2 2+',1],['H2O2',1],['H2O',2],['H+',-4]],conversion:'Eq. (1), zero-ionic-strength log beta. Substitute 4 OH- using the selected database water dissociation constant.'},
  {key:'di-peroxo',name:'UO2(O2)2(OH)2 4-',displayName:'Uranyl diperoxo dihydroxo',phase:'aqueous',charge:-4,k:36.8+6*waterLogK,rawK:36.8,uncertainty:.2,citation:meca,
   equation:'UO2 2+ + 2 H2O2 + 6 OH- = UO2(O2)2(OH)2 4- + 4 H2O',terms:[['UO2 2+',1],['H2O2',2],['H2O',2],['H+',-6]],conversion:'Eq. (2), zero-ionic-strength log beta. Substitute 6 OH- using the selected database water dissociation constant.'},
  {key:'hydroperoxide',name:'HO2-',displayName:'Hydroperoxide ion',phase:'aqueous',charge:-1,k:-11.6,rawK:11.6,uncertainty:null,citation:meca,
   equation:'H2O2 = H+ + HO2-',terms:[['H2O2',1],['H+',-1]],conversion:'pKa = 11.6 stated in Materials and methods, p. 7977. Store log Ka = -pKa. Table 1 prints a reversed equation alongside the negative constant; the explicit pKa fixes the direction.'},
  {key:'auc',name:'(NH4)4UO2(CO3)3(s)',displayName:'Ammonium uranyl carbonate · AUC · provisional estimate',phase:'solid',charge:0,k:-AUC_CONDITIONAL_LOG_KSP,rawK:AUC_CONDITIONAL_LOG_KSP,uncertainty:null,citation:aucSolubility,estimated:true,
   equation:'(NH4)4UO2(CO3)3(s) = 4 NH4+ + UO2(CO3)3 4-',terms:[['NH4+',4],['UO2(CO3)3 4-',1]],conversion:'PROVISIONAL ESTIMATE, not a published log K: ORNL reports 1.35, 1.39, 1.46 and 1.47 g U/L in mixtures totalling 2 M ammonium carbonate + sulfate. Assume free NH4+ = 4 M, all dissolved U = UO2(CO3)3 4-, and activities equal molar concentrations. Ksp = (mean g U/L / 238.02891) × 4^4 ≈ 1.525; log Ksp ≈ +0.183. Reverse this reaction and add the selected database uranyl-tricarbonate formation constant. Acid/base partitioning, ion pairing, ionic-strength and molarity/molality corrections are omitted. Temperature is not specified in this table; applying at 25 °C is an assumption. Use for sensitivity tests only; not an independently validated thermodynamic constant.'},
  {key:'metastudtite',name:'UO2(O2)(H2O)2(s)',displayName:'Metastudtite · uranyl peroxide dihydrate · constant pending',phase:'solid',charge:0,k:null,rawK:null,uncertainty:null,citation:gimenez,
   equation:null,terms:[['UO2 2+',1],['H2O',2],['H2O2',1],['H+',-2]],conversion:'Distinct dihydrate phase. No verified dissolution constant obtained; enter a trial formation log K to test it. The studtite constant is not copied to this phase.'},
  {key:'adu-nominal',name:'(NH4)2U2O7(s)',displayName:'ADU · nominal diuranate · constant pending',phase:'solid',charge:0,k:null,rawK:null,uncertainty:null,citation:adu,
   equation:null,terms:[['NH4+',2],['UO2 2+',2],['H2O',3],['H+',-6]],conversion:'EXPERIMENTAL SURROGATE: ADU is generally a mixture and does not have this exact nominal composition. No verified log K. A fitted value describes this assumed stoichiometry only.'},
  {key:'adu-hydrate-2u',name:'(UO3)2NH3(H2O)3(s)',displayName:'ADU candidate · 2UO3·NH3·3H2O · constant pending',phase:'solid',charge:0,k:null,rawK:null,uncertainty:null,citation:adu,
   equation:null,terms:[['NH4+',1],['UO2 2+',2],['H2O',5],['H+',-5]],conversion:'EXPERIMENTAL COMPOSITION: one reported ammonium-uranate composition, not a universal ADU identity. Formula is cited; equilibrium constant is unknown. Compare candidate phases separately when fitting.'},
  {key:'adu-hydrate-1u',name:'UO3NH3H2O(s)',displayName:'ADU candidate · UO3·NH3·H2O · constant pending',phase:'solid',charge:0,k:null,rawK:null,uncertainty:null,citation:adu,
   equation:null,terms:[['NH4+',1],['UO2 2+',1],['H2O',2],['H+',-3]],conversion:'EXPERIMENTAL COMPOSITION: one reported ammonium-uranate composition, not a universal ADU identity. Formula is cited; equilibrium constant is unknown. Compare candidate phases separately when fitting.'},
 ]
 return entries.map(e=>{
  const trial=overrides[e.key]
  if(trial!==undefined&&(!Number.isFinite(trial)||Math.abs(trial)>1000))throw Error('Trial log K must be a finite number between -1000 and 1000.')
  let sourceK=e.k
  const mapped=new Map()
  for(const [name,n] of e.terms){const sub=substitutions.find(s=>s.name===name);if(sub){if(sourceK!==null)sourceK+=n*sub.logK;for(const t of sub.components)mapped.set(t.name,(mapped.get(t.name)??0)+n*t.coefficient)}else mapped.set(name,(mapped.get(name)??0)+n)}
  const k=trial??sourceK
  const terms=[...mapped].filter(([,n])=>n!==0).map(([name,coefficient])=>({name,coefficient})),formula=e.name.replace(/\(s\)$/,'')
  const check=balance(formula,e.charge,terms);if(check.atoms!=='balanced'||check.charge!=='balanced')throw Error('Unbalanced literature reaction: '+e.key)
  const id=`literature:uranium:${e.key}`,flags=k===null?['missing-equilibrium-constant']:trial!==undefined?['experimental-user-constant','not-validated']:e.estimated?['provisional-solubility-estimate','not-validated','ideal-approximation-only']:['literature-extension','ideal-approximation-only']
  const warning=trial!==undefined?'EXPERIMENTAL: user-supplied formation log K; not a verified literature value.':k===null?'Constant required: enter a trial value to enable calculations.':e.estimated?'PROVISIONAL: estimated from high-salt solubility data; not a measured thermodynamic log K.':'Literature value; verify predictions against measurements.'
  return createSpecies({id,name:e.name,displayName:trial!==undefined?e.displayName.replace(' · constant pending',' · experimental'):e.displayName,formula,phase:e.phase,charge:e.charge,elementalComposition:composition(formula),discoveryElements:Object.keys(composition(formula)),logK:k,
   logKConvention:k===null?null:'log10 formation constant for one named product from explicit signed source components',temperatureReference:k===null?null:298.15,pressureReference:k===null?null:1,
   source:uraniumLiteratureName,sourceDatabase:URANIUM_LITERATURE_ID,sourceRecordId:e.key,citation:e.citation,notes:[warning,e.conversion,uraniumLiteratureScope],qualityFlags:flags,
   metadata:{sourceFormat:'uranium-literature-v1',effectiveSourceReaction:{product:e.name,components:terms},editor:{supported:k!==null,reason:warning},literature:{waterLogK,substitutions,uncertainty:e.uncertainty,conversion:e.conversion,...(e.estimated?{estimatedConditionalLogKsp:AUC_CONDITIONAL_LOG_KSP,measurement:{dissolvedUraniumGramsPerL:[1.35,1.39,1.46,1.47],totalAmmoniumSaltsMolPerL:2},assumptions:{freeAmmoniumMolPerL:4,uraniumAsTricarbonate:true,idealConcentrations:true,temperatureC:25}}:{}),...(trial!==undefined?{trialFormationLogK:trial}:{})}},
   provenance:{kind:trial!==undefined||e.estimated?'user-defined':'imported',sourceDatabase:URANIUM_LITERATURE_ID,sourceRecordId:e.key,original:trial!==undefined?{speciesName:e.name,reaction:terms,logK:trial,citation:'User-supplied trial formation constant; not literature-verified.'}:{speciesName:e.name,reaction:e.equation,logK:e.rawK,citation:e.estimated?'Application-derived conditional estimate from '+e.citation:e.citation},originalLogK:trial??e.rawK,literatureOriginal:{reaction:e.equation,logK:e.estimated?null:e.rawK,citation:e.citation},importDate:'2026-10-05T00:00:00Z',importerVersion:'uranium-literature-1.0',comments:[warning,e.conversion,uraniumLiteratureScope],qualityFlags:flags}})
 })
}

export function supportedLiteratureRecord(s,repository){
 if(s.metadata?.sourceFormat!=='uranium-literature-v1'||!Number.isFinite(s.logK))return false
 let context;try{context=literatureBasis({species:repository.getSpecies(),components:repository.getComponents()})}catch{return false}
 const trial=s.metadata.literature?.trialFormationLogK
 if(trial!==undefined&&(!Number.isFinite(trial)||Math.abs(trial)>1000))return false
 const expected=uraniumLiteratureRecords(context.waterLogK,trial!==undefined?{[s.sourceRecordId]:trial}:{},context.substitutions).find(r=>r.id===s.id)
 return !!expected&&JSON.stringify(s)===JSON.stringify(expected)
}

export function withUraniumLiterature(doc){
 const context=literatureBasis(doc.data)
 if(doc.data.sources.some(s=>s.id===URANIUM_LITERATURE_ID))return doc
 const additions=uraniumLiteratureRecords(context.waterLogK,{},context.substitutions).filter(r=>!doc.data.species.some(s=>s.name===r.name&&s.phase===r.phase))
 return {...doc,report:{...doc.report,literatureReactions:additions.filter(s=>s.logK!==null).length,referenceOnly:additions.filter(s=>s.logK===null).length},data:{...doc.data,
  species:[...doc.data.species,...additions],
  components:doc.data.components.some(c=>c.name==='H2O2')?doc.data.components:[...doc.data.components,structuredClone(peroxideComponent)],
  sources:[...doc.data.sources,{id:URANIUM_LITERATURE_ID,name:uraniumLiteratureName,citation:[gimenez,meca,auc,adu].join('\n'),scope:uraniumLiteratureScope}]}}
}

function literatureBasis(data){
 const source=s=>['spana-java-binary','psinagra-phreeqc-v1'].includes(s.metadata?.sourceFormat)
 const water=data.species.find(s=>s.name==='OH-'&&source(s))
 if(!water)throw Error('A Spana or PSI/Nagra source is required.')
 const names=new Set(data.components.map(c=>c.name)),substitutions=[]
 for(const name of ['NH4+','HCO3-','UO2(CO3)3 4-'])if(!names.has(name)){
  const s=data.species.find(s=>s.name===name&&source(s)),terms=s?.metadata.effectiveSourceReaction?.components
  if(!s||!terms?.every(t=>names.has(t.name)))throw Error('Cannot translate uranium reactions into this source basis.')
  substitutions.push({name,logK:s.logK,components:terms})
 }
 return {waterLogK:water.logK,substitutions}
}

/** Explicit trial values replace only this extension, never official source records. */
export function updateUraniumTrials(library,layerId,values){
 const layer=library.layers.find(l=>l.id===layerId)
 if(!layer)throw Error('Load the database first.')
 const context=literatureBasis(layer.data)
 const existing=new Set(layer.data.species.filter(s=>s.sourceDatabase===URANIUM_LITERATURE_ID).map(s=>s.id))
 const records=uraniumLiteratureRecords(context.waterLogK,values,context.substitutions).filter(r=>existing.has(r.id)),keys=records.map(r=>`${layerId}|${r.id}`)
 return {...library,layers:library.layers.map(l=>l.id!==layerId?l:{...l,data:{...l.data,species:[...l.data.species.filter(s=>s.sourceDatabase!==URANIUM_LITERATURE_ID),...records]}}),disabled:[...library.disabled.filter(k=>!keys.includes(k)),...records.filter(r=>r.logK===null).map(r=>`${layerId}|${r.id}`)]}
}
