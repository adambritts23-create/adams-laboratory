import {waterReferences} from '../analysis/waterReferences.js'
const escape=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;')
const palette=['#5ba5cf','#ceaa57','#5fa77c','#ad80c4','#c97b75','#69adb2','#989e55','#8a83c1','#bd8c67']
export function regionSvg(snapshot,view,points,showSamples,water,selected){
 const px=x=>75+43*x,py=y=>555-136*(y+1.5),states=[...new Map(view.tiles.map(t=>[t.key,t.name])).entries()].sort(),color=k=>palette[states.findIndex(s=>s[0]===k)%palette.length]
 let s='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 720" role="group" aria-label="Partially refined Mn regions"><rect width="1080" height="720" fill="#101c25"/><g font-family="system-ui,sans-serif" fill="#e5edf3" font-size="14"><text x="40" y="30" font-size="22">Mn accepted assemblage / aqueous form · partial refinement</text><text x="40" y="58">0.001 mol/kg-H₂O · 25 °C · ideal · declared 1 bar · Eh versus SHE</text><text x="40" y="81">Gray = unresolved enclosure. Click selects the nearest ORIGINAL stored sample.</text><rect x="75" y="147" width="602" height="408" fill="#4b5260"/>'
 for(const t of view.tiles){const [a,b,c,d]=t.box;s+=`<rect x="${px(a)}" y="${py(d)}" width="${43*(b-a)}" height="${136*(d-c)}" fill="${color(t.key)}" shape-rendering="crispEdges"/>`}
 for(const b of view.boundaries){if(b.status!=='coordinate-bracketed')continue;const h=(b.left.pH+b.right.pH)/2,e=(b.left.Eh+b.right.Eh)/2;s+=`<path d="M${px(h)-3} ${py(e)}h6m-3 -3v6" stroke="#111" stroke-width="1.3"><title>${escape(b.id)}: refined crossing bracket; not a connected boundary</title></path>`}
 if(water)for(const [i,w] of waterReferences(snapshot.inventory,0).entries()){const end=waterReferences(snapshot.inventory,14)[i];s+=`<path d="M75 ${py(w.Eh)}L677 ${py(end.Eh)}" stroke="white" stroke-dasharray="7 5"><title>Analytical water reference; gas equilibrium not solved</title></path>`}
 for(let h=0;h<=14;h+=2)s+=`<text x="${px(h)}" y="579" text-anchor="middle">${h}</text>`
 for(const e of [-1.5,-1,-.5,0,.5,1,1.5])s+=`<text x="65" y="${py(e)+5}" text-anchor="end">${e}</text>`
 s+='<text x="355" y="610" font-size="20">pH</text><text transform="translate(23 410) rotate(-90)" font-size="18">Eh [V vs SHE]</text>'
 for(const p of points)if(showSamples||p.index===selected)s+=`<circle data-sample="${p.index}" role="button" tabindex="0" aria-label="Stored sample ${p.index}" cx="${px(p.pH)}" cy="${py(p.Eh)}" r="${p.index===selected?6:2.5}" fill="white" stroke="#14212a"/>`
 states.forEach(([key,name],i)=>{s+=`<rect x="720" y="${130+i*27}" width="12" height="12" fill="${color(key)}"/><text x="744" y="${141+i*27}">${escape(name)}</text>`
 const largest=view.tiles.filter(t=>t.key===key).sort((a,b)=>(b.box[1]-b.box[0])*(b.box[3]-b.box[2])-(a.box[1]-a.box[0])*(a.box[3]-a.box[2]))[0]
 if(largest.box[1]-largest.box[0]>1.5)s+=`<text x="${px((largest.box[0]+largest.box[1])/2)}" y="${py((largest.box[2]+largest.box[3])/2)}" text-anchor="middle" fill="#101820" font-size="12">${escape(name)}</text>`
 })
 s+='<text x="720" y="450">+ Refined crossing enclosure</text><text x="720" y="478">Gray: no region assignment</text><text x="40" y="641">Region edges beside gray strips are enclosure limits, NOT thermodynamic boundaries.</text><text x="40" y="666">Water dashes, if shown: f/f° = 1, a(H₂O) = 1; source pressure scalar unavailable.</text><text x="40" y="691">No junctions inferred. Exact states and boundary provenance are preserved in numerical export.</text></g></svg>'
 return s
}
