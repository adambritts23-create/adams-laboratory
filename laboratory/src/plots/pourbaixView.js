import {isPourbaixResult,pourbaixSample} from '../calculations/boundedPourbaix.js'
export const pourbaixPlotBox={width:900,height:660,left:68,right:868,top:38,bottom:596}
const escape=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;')
export function pourbaixSampleIndex(contract,pH,Eh){const x=contract.pH,y=contract.Eh;return Math.max(0,Math.min(y.points-1,Math.round((Eh-y.min)/y.step)))*x.points+Math.max(0,Math.min(x.points-1,Math.round((pH-x.min)/x.step)))}
export function pourbaixKeyboardIndex(contract,index,key){const nx=contract.pH.points,ny=contract.Eh.points,ix=index%nx,iy=Math.floor(index/nx);return key==='ArrowRight'?iy*nx+Math.min(nx-1,ix+1):key==='ArrowLeft'?iy*nx+Math.max(0,ix-1):key==='ArrowUp'?Math.min(ny-1,iy+1)*nx+ix:key==='ArrowDown'?Math.max(0,iy-1)*nx+ix:key==='Home'?0:key==='End'?nx*ny-1:null}
export function pourbaixRepresentatives(result,view){
 if(!isPourbaixResult(result))return {}
 const {pH:x,Eh:y}=result.contract
 return Object.fromEntries(Object.entries(view.styles).map(([state])=>{
 const target=view.anchors[state]??[(x.min+x.max)/2,(y.min+y.max)/2]
 const candidates=result.points.map((p,index)=>({...p,index})).filter(p=>p.status==='classified'&&p.predominant===Number(state))
 const distance=p=>((p.pH-target[0])/(x.max-x.min))**2+((p.Eh-target[1])/(y.max-y.min))**2
 candidates.sort((a,b)=>distance(a)-distance(b))
 return [state,candidates[0]]
 }))
}
export function pourbaixSvg(result,index,currentRevision,view){
 if(!isPourbaixResult(result)||result.grid.revision!==currentRevision)return ''
 const {pH:X,Eh:Y}=result.contract,x=pH=>68+(pH-X.min)/(X.max-X.min)*800,y=Eh=>596-(Eh-Y.min)/(Y.max-Y.min)*558
 const rectangles=result.points.map((p,i)=>{
 const c=pourbaixSample(result,i,currentRevision);if(!c)return ''
 const left=x(Math.max(X.min,p.pH-X.step/2)),right=x(Math.min(X.max,p.pH+X.step/2)),top=y(Math.min(Y.max,p.Eh+Y.step/2)),bottom=y(Math.max(Y.min,p.Eh-Y.step/2))
 return `<rect data-sample="${i}" data-state="${c.predominant??'tie'}" x="${left}" y="${top}" width="${right-left+0.05}" height="${bottom-top+0.05}" fill="${escape(view.styles[c.predominant]?.color??'url(#os-tie)')}"/>`
 }).join('')
 const refs=[result.points[0].waterReferences,result.points[X.points-1].waterReferences]
 const lines=[0,1].map(i=>`<path d="M68 ${y(refs[0][i].Eh)} L868 ${y(refs[1][i].Eh)}" stroke="#e5f1fa" stroke-width="2" stroke-dasharray="8 6" fill="none"/><text x="${x(X.min+(X.max-X.min)*9/14)}" y="${y(refs[0][i].Eh+(refs[1][i].Eh-refs[0][i].Eh)*9/14)-8}" fill="#fff" font-family="Arial,sans-serif" font-size="15" paint-order="stroke" stroke="#18252e" stroke-width="2">${i?'O₂':'H₂'} reference</text>`).join('')
 const regions=`<path d="M68 38 H868 V${y(refs[1][1].Eh)} L68 ${y(refs[0][1].Eh)} Z M68 596 H868 V${y(refs[1][0].Eh)} L68 ${y(refs[0][0].Eh)} Z" fill="url(#os-water)"/>`
 const labels=Object.values(pourbaixRepresentatives(result,view)).filter(Boolean).map(p=>`<text x="${x(p.pH)}" y="${y(p.Eh)}" text-anchor="middle" font-size="23" font-weight="700" paint-order="stroke" stroke="#15202b" stroke-width="3" fill="#fff">${escape(view.styles[p.predominant].label)}</text>`).join('')
 const selected=pourbaixSample(result,index,currentRevision)
 const xticks=Array.from({length:8},(_,i)=>X.min+(X.max-X.min)*i/7),yticks=view.yTicks??Array.from({length:6},(_,i)=>Y.min+(Y.max-Y.min)*i/5)
 const ticks=[...xticks.map(v=>`<text x="${x(v)}" y="625" text-anchor="middle">${Number(v.toPrecision(3))}</text>`),...yticks.map(v=>`<text x="57" y="${y(v)+5}" text-anchor="end">${Number(v.toPrecision(3))}</text>`)].join('')
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 660" role="img" aria-label="${escape(view.element)} oxidation-state predominance; pH ${X.min} to ${X.max}, Eh ${Y.min} to ${Y.max} volts versus SHE"><title>${escape(view.element)} oxidation-state predominance</title><desc>Sampled cells. Hatching above O2 and below H2 indicates location outside the conventional water reference window. Colors are oxidation-state identities, not physical appearance.</desc><defs><clipPath id="os-frame"><rect x="68" y="38" width="800" height="558"/></clipPath><pattern id="os-water" width="12" height="12" patternUnits="userSpaceOnUse"><path d="M0 12 L12 0" stroke="white" stroke-opacity="0.13"/></pattern><pattern id="os-tie" width="8" height="8" patternUnits="userSpaceOnUse"><rect width="8" height="8" fill="#283746"/><path d="M0 0 L8 8" stroke="#eee"/></pattern></defs><rect width="900" height="660" fill="#101d26"/><g clip-path="url(#os-frame)">${rectangles}${regions}${lines}${labels}${selected?`<circle cx="${x(selected.pH)}" cy="${y(selected.Eh)}" r="6" fill="none" stroke="#fff" stroke-width="2.5"/>`:''}</g><g fill="#e1ebf2" font-family="Arial,sans-serif" font-size="16">${ticks}<text x="468" y="650" text-anchor="middle">pH</text><text transform="translate(20 317) rotate(-90)" text-anchor="middle">Eh (V vs SHE)</text><text x="84" y="24" font-size="14">Dashed: H₂ / O₂ references · hatching: outside water window</text></g><rect x="68" y="38" width="800" height="558" fill="none" stroke="#bbcbd5"/></svg>`
}
