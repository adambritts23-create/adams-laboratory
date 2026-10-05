import { displayNumber as formatNumber } from './formatNumber.js'
import { waterReferences } from '../analysis/waterReferences.js'
export const diagnosticModes=['assemblage','species','oxidation']
export function category(c,mode){
 if(c.status!=='accepted')return c.status
 if(mode==='assemblage')return c.activeSolids.length?c.activeSolids.map(s=>s.name).join(' + '):'Aqueous only'
 if(c.dissolvedCategory==='negligible-dissolved')return 'Negligible dissolved Mn'
 const ids=mode==='species'?c.speciesLeaders:c.oxidationLeaders
 if(ids.length>1)return 'Unresolved dissolved tie'
 return mode==='species'?c.aqueous.find(s=>s.id===ids[0])?.name??'Unsupported':`Mn oxidation state +${ids[0]}`
}
const palette=['#62b6ed','#f0be62','#72cc99','#d79deb','#ee8b83','#81d2d9','#b7bc64','#aaa1f5','#e4a56f','#aebfca','#ed99bb','#75bb89']
const escape=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;')
export function diagnosticSvg(snapshot,points,mode='assemblage',water=false,selected=null){
 const categories=[...new Set(points.map(p=>category(p.classification,mode)))].sort(),color=key=>key.includes('tie')?'#ffffff':palette[categories.indexOf(key)%palette.length]
 const px=x=>75+x*43,py=y=>555-(y+1.5)*136
 let svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 720" role="group" aria-label="Sampled diagnostic Mn Pourbaix map"><rect width="1080" height="720" fill="#101c25"/><g fill="#e5edf3" font-family="system-ui,sans-serif" font-size="14"><text x="40" y="30" font-size="22">Diagnostic Mn Pourbaix · ${escape(mode)} · sampled points</text><text x="40" y="58">Mn total 0.001 mol/kg-H₂O · 25 °C · ideal · declared 1 bar · Eh versus SHE</text><text x="40" y="81">195 stored samples; no interpolated boundaries. Click a point for its exact state.</text>`
 for(let x=0;x<=14;x+=2)svg+=`<path d="M${px(x)} 145V555" stroke="#34434e"/><text x="${px(x)}" y="579" text-anchor="middle">${x}</text>`
 for(const y of [-1.5,-1,-.5,0,.5,1,1.5])svg+=`<path d="M75 ${py(y)}H677" stroke="#34434e"/><text x="64" y="${py(y)+5}" text-anchor="end">${y}</text>`
 svg+='<text x="355" y="610">pH</text><text transform="translate(22 410) rotate(-90)">Eh [V vs SHE]</text>'
 if(water){const ends=[waterReferences(snapshot.inventory,0),waterReferences(snapshot.inventory,14)];for(let i=0;i<2;i++)svg+=`<path d="M75 ${py(ends[0][i].Eh)}L677 ${py(ends[1][i].Eh)}" stroke="#d8e1e7" stroke-dasharray="6 5" opacity="0.7"><title>${escape(ends[0][i].name+' analytical unit-fugacity reference; gases not solved')}</title></path>`}
 for(const p of points){const c=p.classification,key=category(c,mode),title=`Sample ${p.index}: pH ${formatNumber(p.pH,'pH')}, Eh ${formatNumber(p.Eh,'Eh')} V SHE; ${key}`
 svg+=`<g data-sample="${p.index}" role="button" tabindex="0" aria-label="${escape(title)}"><title>${escape(title)}</title>`
 svg+=c.status==='accepted'?`<circle cx="${px(p.pH)}" cy="${py(p.Eh)}" r="${p.index===selected?9:7}" fill="${color(key)}" stroke="${p.index===selected?'#fff':'#101c25'}" stroke-width="2"/>`:`<path d="M${px(p.pH)-5} ${py(p.Eh)-5}l10 10m-10 0l10-10" stroke="#ff7f8d" stroke-width="2"/>`
 svg+='</g>'}
 categories.forEach((key,i)=>{svg+=`<circle cx="732" cy="${145+i*30}" r="6" fill="${color(key)}"/><text x="748" y="${150+i*30}" font-size="13">${escape(key)} (${points.filter(p=>category(p.classification,mode)===key).length})</text>`})
 svg+='<text x="725" y="530" font-size="12">Color shows the selected interpretation.</text><text x="725" y="550" font-size="12">All solids and dissolved species remain</text><text x="725" y="570" font-size="12">available in point inspection / JSON.</text>'
 svg+=`<text x="40" y="644">${water?'Dashed lines: analytical H₂/O₂ references at unit normalized fugacity and unit water activity.':'Water reference overlays hidden; no gas phases included in the solve.'}</text><text x="40" y="667">${water?'25 °C, SHE. Source standard-pressure scalar unavailable; not a calculated gas equilibrium.':'Restricted audited bundled Mn–H–O candidates; not a complete real-water model.'}</text><text x="40" y="691">Ties indicate unresolved numerical comparison intervals, not refined thermodynamic boundaries.</text></g></svg>`
 return svg
}
