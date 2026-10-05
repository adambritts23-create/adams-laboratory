import {mapPoint} from './geometry.js'
// Does not alter bounds, series, selection, or solver data.
export function ehWaterReferenceSvg(annotation,view,b,light=false){
 if(annotation?.status!=='available')return ''
 const h=annotation.references.find(r=>r.name==='H2(g)'),o=annotation.references.find(r=>r.name==='O2(g)')
 if(!Number.isFinite(h?.Eh)||!Number.isFinite(o?.Eh))return ''
 const x=value=>mapPoint({x:value,value:view.yMin},view,b).x
 const left=Math.max(view.xMin,h.Eh),right=Math.min(view.xMax,o.Eh),color=light?'#345f68':'#a0d5de'
 let svg='<g data-water-references="thermodynamic-only" pointer-events="none">'
 if(right>left)svg+=`<rect data-water-window="nominal" x="${x(left)}" y="${b.top}" width="${x(right)-x(left)}" height="${b.bottom-b.top}" fill="${color}" opacity="0.07"/><text x="${(x(left)+x(right))/2}" y="${b.top+34}" text-anchor="middle" fill="${color}" font-size="11">Nominal water-stability window</text>`
 for(const [r,label] of [[h,'H₂ reference'],[o,'O₂ reference']]){
  if(r.Eh<view.xMin||r.Eh>view.xMax)continue
  const px=x(r.Eh),anchor=px>(b.left+b.right)/2?'end':'start',dx=anchor==='end'?-5:5
  svg+=`<path data-water-reference="${r.name}" d="M${px},${b.top}V${b.bottom}" stroke="${color}" stroke-width="1.4" stroke-dasharray="7 5"/><text x="${px+dx}" y="${b.top+16}" text-anchor="${anchor}" fill="${color}" font-size="12">${label}</text>`
 }
 return svg+'</g>'
}
