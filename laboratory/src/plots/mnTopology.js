import {regionSvg} from './mnRegions.js'
const escape=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;')
export function topologySvg(snapshot,regions,topology,points,showSamples,showBoundaries,water,selected){
 let svg=regionSvg(snapshot,{...regions,boundaries:[]},points,showSamples,water,selected)
 svg=svg.replace('No junctions inferred. Exact states and boundary provenance are preserved in numerical export.','Local branches certified; unresolved junctions remain explicit. No new global region fill.')
 svg=svg.replace('+ Refined crossing enclosure',showBoundaries?'Solid lines: certified local branches':'Certified interiors; topology incomplete')
 if(!showBoundaries)return svg
 const px=h=>75+43*h,py=e=>555-136*(e+1.5)
 let overlay=''
 for(const s of topology.segments.filter(s=>s.status==='certified')){
 const samples=[{t:0,...s.endpoints[0]},...s.samples.map(r=>({t:r.t,pH:(r.left.pH+r.right.pH)/2,Eh:(r.left.Eh+r.right.Eh)/2})),{t:1,...s.endpoints[1]}].sort((a,b)=>a.t-b.t)
 const d=samples.map((p,i)=>`${i?'L':'M'}${px(p.pH)} ${py(p.Eh)}`).join(' ')
 overlay+=`<g data-segment="${escape(s.id)}" role="button" tabindex="0" aria-label="Inspect ${escape(s.id)}"><title>${escape(s.id)}: certified within exported coordinate bounds</title><path d="${d}" fill="none" stroke="#07111b" stroke-width="2.4"/><path d="${d}" fill="none" stroke="transparent" stroke-width="9"/></g>`
 }
 for(const j of topology.junctions.filter(j=>j.status==='unresolved')){
 const [a,b,c,d]=j.uncertainty,x=px(a),y=py(d)
 overlay+=`<g data-junction="${escape(j.id)}" role="button" tabindex="0" aria-label="Inspect unresolved ${escape(j.id)}"><title>${escape(j.reason)}</title><rect x="${x}" y="${y}" width="${43*(b-a)}" height="${136*(d-c)}" fill="none" stroke="#ffdd86" stroke-dasharray="2 2"/><circle cx="${px((a+b)/2)}" cy="${py((c+d)/2)}" r="4" fill="#101c25" stroke="#ffdd86"/></g>`
 }
 overlay+='<text x="720" y="505" font-size="12" fill="#ffdd86">○ Unresolved junction candidate</text>'
 return svg.replace('</g></svg>',overlay+'</g></svg>')
}
