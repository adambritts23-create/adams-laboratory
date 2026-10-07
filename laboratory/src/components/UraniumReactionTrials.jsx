import {useState} from 'react'
import {equation} from '../thermodynamics/databaseLibrary.js'
import {URANIUM_LITERATURE_ID,uraniumLiteratureRecords,updateUraniumTrials} from '../thermodynamics/uraniumLiterature.js'

export default function UraniumReactionTrials({layer,library,onChange}){
 const records=layer.data.species.filter(s=>s.sourceDatabase===URANIUM_LITERATURE_ID).sort((a,b)=>(a.sourceRecordId==='auc'?-1:b.sourceRecordId==='auc'?1:0))
 const [values,setValues]=useState(()=>Object.fromEntries(records.map(r=>[r.sourceRecordId,r.logK??''])))
 const [message,setMessage]=useState('')
 function apply(reset=false){try{
  const defaults=uraniumLiteratureRecords(records[0].metadata.literature.waterLogK,{},records[0].metadata.literature.substitutions),overrides={}
  if(!reset)for(const r of defaults){const v=String(values[r.sourceRecordId]??'').trim().replace(',','.');if(!v)continue;const k=Number(v);if(!Number.isFinite(k))throw Error('Enter a numeric formation log K.');if(k!==r.logK)overrides[r.sourceRecordId]=k}
  const next=updateUraniumTrials(library,layer.id,overrides)
  onChange(next)
  setValues(Object.fromEntries(next.layers.find(l=>l.id===layer.id).data.species.filter(s=>s.sourceDatabase===URANIUM_LITERATURE_ID).map(r=>[r.sourceRecordId,r.logK??''])))
  setMessage(reset?'Literature values restored; phases without constants disabled.':'Applied to Calculation and Wet Lab. Previous results must be recalculated.')
 }catch(e){setMessage(e.message)}}
 return <section className="uranium-trials">
  <h3>AUC, ADU and uranyl peroxide</h3>
  <p>Enter <strong>formation log₁₀ K</strong> for the displayed reaction. AUC has a provisional solubility-based estimate ready to test. ADU and metastudtite require a trial constant.</p>
  <details><summary>Experimental limitations and reaction conventions</summary>
   <p className="experimental-warning">Edited values are trial constants, not verified literature data. Blank fields restore the literature value, or leave an unknown constant disabled. Values use ideal activities at 25 °C; high-concentration solutions may differ substantially.</p>
   <p>ADU has variable composition. Its three entries are alternative trial models, not three verified pure phases. Fit one at a time. Constants use the displayed database basis: an NH₄⁺/HCO₃⁻ value cannot be copied unchanged to an NH₃/CO₃²⁻ reaction. These are formation log K values, not Ksp.</p>
  </details>
  {records.map(r=><div className="uranium-trial-row" key={r.id}>
   <label><strong>{r.displayName}</strong><input aria-label={`Trial formation log K: ${r.sourceRecordId}`} inputMode="decimal" value={values[r.sourceRecordId]??''} placeholder="Trial log K required" onChange={e=>setValues({...values,[r.sourceRecordId]:e.target.value})}/></label>
   <small>{equation(r)}</small><small>{r.metadata.editor.reason}</small>
   {r.sourceRecordId==='adu-nominal'&&Number.isFinite(r.logK)&&<p className="experimental-warning"><strong>Provisional — enabled for testing; review pending.</strong> Trial formation log K = {r.logK}. Applicability to nominal ADU and the reaction convention remain unverified. Agreement with an illustrative plot is not independent validation.</p>}
   <details><summary>Reference and conversion</summary><p>{r.citation}</p><p>{r.metadata.literature.conversion}</p></details>
  </div>)}
  <button onClick={()=>apply()}>Apply trial constants</button> <button onClick={()=>apply(true)}>Restore literature values</button>
  {message&&<p role="status">{message}</p>}
  <h3>UF₆ hydrolysis in water</h3>
  <p>UF₆ + 2 H₂O → UO₂F₂ + 4 HF. The analytical input assumes complete hydrolysis in excess water, with no gas loss or kinetic model.</p>
  <p>In Wet Lab, choose <strong>UF6 · hydrolysed feed (experimental)</strong> under uranium or fluorine. One mole supplies 1 mole of uranyl, 6 moles of total fluoride and 4 proton equivalents. HF and uranyl–fluoride species then equilibrate using the selected database.</p>
  <p>For Calculation, use those same analytical totals: UO₂²⁺ = c, F⁻ = 6c, H⁺ = 4c. Select total H⁺ to calculate pH, or an imposed pH for a buffered comparison. This is an inventory conversion, not a UF₆(aq) equilibrium constant. <a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC9056877/" target="_blank" rel="noreferrer">Hydrolysis reference</a></p>
 </section>
}
