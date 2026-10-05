import {useEffect,useRef,useState} from 'react'

import ElementSelector from './ElementSelector.jsx'

import {chemicalLabel} from '../chemistry/format.js'

import {setupRows} from '../calculations/wetLabSetup.js'

import {ionicCharge,balanceIonicPair} from '../calculations/wetLabIons.js'

function FormPicker({catalog,onPick,onClose,analytical=false}){

 const dialog=useRef(null),[focus,setFocus]=useState(null),[query,setQuery]=useState(''),[limit,setLimit]=useState(60)

 useEffect(()=>{dialog.current.showModal()},[])

 const forms=catalog?.browseForms??catalog?.forms??[]

 const normalized=value=>value.normalize('NFKC').toLowerCase().replace(/\s/g,'')

 const visible=forms.filter(c=>(!focus||c.associations.some(a=>a.element===focus))&&(!query||normalized(c.name).includes(normalized(query))||c.associations.some(a=>normalized(a.element).includes(normalized(query)))||(c.name==='MnO4-'&&/permangan|kmno4/i.test(query))))

 const supported=c=>analytical?!!catalog.analyticalEntries[c.id]:!!catalog.entries[c.id]&&catalog.forms.some(f=>f.id===c.id)

 return <dialog ref={dialog} className="wet-ion-picker" aria-label="Choose supplied ionic form" onCancel={onClose}>

  <div className="section-heading"><h2>Choose species</h2><button onClick={onClose} aria-label="Close ionic form picker">Close</button></div>

  <label>Search species<input type="search" value={query} placeholder="Formula, element or permanganate" onChange={e=>{setQuery(e.target.value);setFocus(null);setLimit(60)}}/></label>

  <ElementSelector components={forms} selected={focus?[focus]:[]} implicit={[]} focused={focus} onToggle={v=>{setFocus(v);setLimit(60)}}/>

  <button onClick={()=>setFocus(null)}>All elements</button><small>Forms represent dissolved species, not complete salts. Selecting MnO₄⁻ does not add K⁺.</small>

  <p>{visible.length} species · stock selection is separate from calculation support.</p>

  <div className="analytical-candidates">{visible.slice(0,limit).map(c=><button key={c.id} disabled={!supported(c)} onClick={()=>onPick(c.id)}><strong>{chemicalLabel(c.name)}</strong><small>{supported(c)?'Choose form · calculation checked on preparation':c.phase&&c.phase!=='aqueous'?`${c.phase} · not a dissolved stock input`:analytical?'Requires physical/redox preparation or additional input metadata':'Source metadata does not support this stock input'}</small></button>)}</div>

  {visible.length>limit&&<button onClick={()=>setLimit(limit+60)}>Show more species</button>}

 </dialog>

}

export default function WetLabPreparation({name,value,recipes,onChange,stock,catalog}){

 const [menu,setMenu]=useState(false),[ionic,setIonic]=useState(false),[picker,setPicker]=useState(null),[error,setError]=useState(''),[componentPicker,setComponentPicker]=useState(null)

 const simplified=value.preparationContract==='simplified-redox'

 const analytical=value.preparationContract==='analytical-acid-base'

 const rows=setupRows(value),ions=rows.filter(r=>r.kind==='ionic')

 const change=(id,key,v)=>onChange('contributions',rows.map(r=>r.id===id?{...r,[key]:v}:r))

 let charge

 try{charge=ionicCharge(rows,catalog,value.volumeMl)}catch(e){charge={error:e.message}}

 function pick(sourceId){const row={id:picker==='new'?crypto.randomUUID():picker,kind:'ionic',sourceId,concentrationMolPerL:picker==='new'?.01:rows.find(r=>r.id===picker).concentrationMolPerL};onChange('contributions',picker==='new'?[...rows,row]:rows.map(r=>r.id===picker?row:r));setPicker(null)}

 return <fieldset className="wet-preparation"><legend>{name==='Sample'?'Sample solution':'Burette / titrant solution'}</legend>

  {simplified?<p className="wet-stock-definition">Simplified redox · automatic inert countercharge</p>:<label className="wet-stock-definition" title="Changing stock definition replaces its entries.">Stock definition<select aria-label={name+' stock definition'} value={analytical?'analytical-acid-base':'physical'} onChange={e=>onChange('definition',{preparationContract:e.target.value,volumeMl:value.volumeMl,contributions:[e.target.value==='analytical-acid-base'?{id:'component',kind:'component',sourceId:name==='Sample'?'component:H%2B':'spana:2ac52a30213c9288:250448',concentrationMolPerL:.1}:{id:'reagent',reagent:name==='Sample'?'HCl':'NaOH',concentrationMolPerL:.1}]})}><option value="analytical-acid-base">Analytical components</option><option value="physical">Physical reagents</option></select></label>}

  <label className="wet-volume">{name==='Sample'?'Final initial volume':'Loaded volume'}<input aria-label={name+' volume'} type="number" step="any" value={value.volumeMl} onChange={e=>onChange('volumeMl',e.target.value)}/> mL</label>

  {analytical&&<div className="wet-stock-ph"><label>Initial stock pH <input aria-label={name+' initial stock pH'} type="number" step="any" placeholder="Optional" value={value.initialPH??''} onChange={e=>onChange('initialPH',e.target.value)}/></label><small>{stock?.stockPreparation?`Prepared at pH ${stock.stockPreparation.requestedPH.toFixed(2)}`:String(value.initialPH??'').trim()?'Fixed-pH stock preparation required':'Calculated from analytical inventory'}</small><details><summary>Stock pH and analytical totals</summary><p>Totals include every protonation form, not just the named free ion. Stock preparation calculates speciation, then releases pH into conserved proton inventory. Mixing derives a new pH; it does not average stock pH. Only homogeneous prepared stocks are supported.</p>{stock?.stockPreparation&&<p>Accepted proton inventory: {stock.moles.protonEquivalent.toExponential(10)} mol. Specified countercharge remains unspecified.</p>}</details></div>}

  {rows.map((row,i)=><div className="wet-contribution" key={row.id}>

   {row.kind==='component'?<button className="wet-ion-name" aria-label={'Change '+name+' component '+(i+1)} onClick={()=>setComponentPicker(row.id)}>{chemicalLabel(catalog?.analyticalEntries[row.sourceId]?.name??row.sourceId)} · search</button>:row.kind==='ionic'?<button className="wet-ion-name" aria-label={'Change '+name+' species '+(i+1)} onClick={()=>setPicker(row.id)}>{chemicalLabel(catalog?.forms.find(c=>c.id===row.sourceId)?.name??row.sourceId)} · change</button>:<select aria-label={name+' reagent '+(i+1)} value={row.reagent} onChange={e=>change(row.id,'reagent',e.target.value)}>{recipes.map(r=><option key={r.id} value={r.id} disabled={!r.available}>{r.label}{r.available?'':' · unavailable'}</option>)}</select>}

   <label><input aria-label={name+' concentration '+(i+1)} type="number" step="any" min="0" value={row.kind==='ionic'&&row.concentrationMolPerL!==''?row.concentrationMolPerL*1000:row.concentrationMolPerL} onChange={e=>change(row.id,'concentrationMolPerL',row.kind==='ionic'?(e.target.value===''?'':Number(e.target.value)/1000):e.target.value)}/><span title={row.kind==='component'?'Analytical component':row.kind==='ionic'?'Supplied form':'Reviewed reagent'}>{row.kind==='ionic'?'mM':'mol/L'}</span></label>

   <button aria-label={'Remove '+name+' reagent '+(i+1)} onClick={()=>onChange('contributions',rows.filter(r=>r.id!==row.id))}>×</button>

  </div>)}

  {simplified?<button disabled={!catalog||rows.length>=16} onClick={()=>setPicker('new')}>+ Add species</button>:analytical?<button disabled={!catalog||rows.length>=16} onClick={()=>setComponentPicker('new')}>+ Add component</button>:<><button disabled={!catalog||rows.length>=16} onClick={()=>setPicker('new')}>+ Add species</button><button aria-expanded={menu} onClick={()=>setMenu(!menu)}>Reagent options</button></>}

  {!analytical&&!simplified&&menu&&<span className="wet-add-options"><button onClick={()=>{onChange('contributions',[...rows,{id:crypto.randomUUID(),reagent:recipes.find(r=>r.available)?.id??'NaOH',concentrationMolPerL:.02}]);setMenu(false)}}>Reviewed reagent</button><button onClick={()=>{setIonic(true);setMenu(false)}}>Ionic preparation</button></span>}

  {!analytical&&!simplified&&(ionic||ions.length>0)&&<div className="wet-ionic"><strong>Ionic preparation</strong><small>Dissolved supplied forms · no commercial salt or hydrate identity implied.</small><button disabled={!catalog||rows.length>=16} onClick={()=>setPicker('new')}>+ Add species</button>{ions.length===2&&<button onClick={()=>{try{onChange('contributions',balanceIonicPair(rows,catalog));setError('')}catch(e){setError(e.message)}}}>Auto-balance countercharge</button>}<p>Net supplied charge: {charge.error?charge.error:charge.charge.toExponential(6)+' mol charge equivalents'+(charge.balanced?' · balanced':' · unbalanced — preparation unavailable')}</p></div>}

  {(simplified||ions.length>0)&&<details><summary>Preparation details</summary>
  {simplified&&<p>Counterions: automatic, inert and fictitious. {charge.error??('Background charge: '+(-charge.charge).toExponential(6)+' mol equivalents.')} No manual charge balancing needed.</p>}

  {ions.length>0&&<small>Component metadata: {ions.every(r=>catalog?.entries[r.sourceId])?'available':'unavailable'} · Elemental metadata: {ions.every(r=>catalog?.entries[r.sourceId]?.elements)?'available':'unavailable for some forms; no elemental totals inferred'}</small>}

  </details>}
  {error&&<p role="alert">{error}</p>}{stock&&<details className="wet-stock-summary"><summary>Stock inventory · {stock.contributions.length} contribution{stock.contributions.length===1?'':'s'}</summary><small>{stock.contributions.length} contribution{stock.contributions.length===1?'':'s'} in one {stock.volumeMl} mL solution · {simplified?'fictitious inert countercharge':analytical?'analytical components; countercharge unspecified':'charge balanced'}</small></details>}

  {analytical&&stock&&<details><summary>Analytical charge / source provenance</summary><p>Not a complete physical solution. Net specified charge: {stock.chargeEquivalents.toExponential(6)} mol equivalents. No counterions inserted.</p>{stock.contributions.map(r=><p key={r.id}>{r.reagent}: {r.sourceId}</p>)}</details>}

  {!analytical&&picker&&<FormPicker catalog={catalog} onPick={pick} onClose={()=>setPicker(null)}/>}

  {analytical&&componentPicker&&catalog&&<FormPicker analytical catalog={catalog} onClose={()=>setComponentPicker(null)} onPick={sourceId=>{if(componentPicker==='new')onChange('contributions',[...rows,{id:crypto.randomUUID(),kind:'component',sourceId,concentrationMolPerL:.01}]);else change(componentPicker,'sourceId',sourceId);setComponentPicker(null)}}/>}

 </fieldset>

}

