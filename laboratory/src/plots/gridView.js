import { displayNumber as formatNumber } from './formatNumber.js'
import { gridDiagnostics } from '../analysis/gridDiagnostics.js'
import { scalarColor, colorRange, scalarContours, gridCellStatus, calculatedDomainEdges } from './scalarMap.js'
import { axisDisplayLabel, figureConditionLines, seriesColor } from './export.js'
import { seriesLabel } from './presentation.js'
import { nearestIndex } from './geometry.js'
export const gridBox=Object.freeze({width:1200,height:500,left:90,right:1000,top:35,bottom:370})
const escape=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;')
export function gridBounds(metadata){const [x,y]=metadata.axes;return {xMin:x.start,xMax:x.end,yMin:y.start,yMax:y.end}}
export function navigateGrid(v,factor=1,dx=0,dy=0){const cx=(v.xMin+v.xMax)/2+dx,cy=(v.yMin+v.yMax)/2+dy;const n={xMin:cx-(v.xMax-v.xMin)*factor/2,xMax:cx+(v.xMax-v.xMin)*factor/2,yMin:cy-(v.yMax-v.yMin)*factor/2,yMax:cy+(v.yMax-v.yMin)*factor/2};return Object.values(n).every(Number.isFinite)&&n.xMin!==n.xMax&&n.yMin!==n.yMax?n:v}
export function exactGridIndex(model,x,y){const xs=model.points.slice(0,model.metadata.shape[0]).map(p=>p.x),ys=model.points.filter(p=>p.index%model.metadata.shape[0]===0).map(p=>p.y);return nearestIndex(ys,y)*xs.length+nearestIndex(xs,x)}
export function gridModel(derived,seriesId,classification=null){
  if(!derived?.ok||!derived.metadata.axes)return null
  const series=seriesId?derived.series.find(s=>s.id===seriesId):derived.series[0]
  if(!series)return null
  const points=classification?.ok?classification.points:series.points
  let min=Infinity,max=-Infinity
  for(const p of points)if(Number.isFinite(p.value)){min=Math.min(min,p.value);max=Math.max(max,p.value)}
  return {kind:classification?.ok?'inventory-classification':'scalar-grid',series:{id:series.id,name:series.name,kind:series.kind,provenance:series.provenance,descriptor:series.descriptor},points,metadata:{...derived.metadata,output:{...derived.metadata.output,descriptor:series.descriptor,label:series.descriptor?.label??derived.metadata.output.label}},classification:classification?.ok?classification:null,min:min===Infinity?null:min,max:max===-Infinity?null:max}
}
export function gridSvg(model,view,theme='dark',currentRevision=model.metadata.revision,pin=null,b=gridBox,settings={}){
  const light=theme==='light',bg=light?'#fff':'#11191e',fg=light?'#17232c':'#e5edf3',border=light?'#b5c6d0':'#38505d'
  const lines=figureConditionLines(model.metadata),height=b.height+lines.length*21
  const range=colorRange(model,settings.colorRange),levels=settings.contours&&range.min!==null?Array.from({length:5},(_,i)=>range.min+(range.max-range.min)*(i+1)/6):[]
  const px=x=>b.left+(x-view.xMin)/(view.xMax-view.xMin)*(b.right-b.left),py=y=>b.bottom-(y-view.yMin)/(view.yMax-view.yMin)*(b.bottom-b.top)
  const [xa,ya]=model.metadata.axes,dx=(xa.end-xa.start)/(xa.points-1),dy=(ya.end-ya.start)/(ya.points-1)
  const metadata={...model.metadata,selectedSeries:model.series,colorRange:range,contours:{enabled:!!settings.contours,levels,method:"piecewise-linear triangles; missing quads masked; visualization only"},view,currentRevision,stale:currentRevision!==model.metadata.revision,calculatedDomainBoundary:!!settings.showDomainBoundary,sampledAnalysis:model.analysis??null,classificationPolicy:model.classification?.policy??null,imageIsCompleteReproducibilityPackage:false}
  let svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${b.width} ${height}" role="img" aria-label="Calculated equilibrium grid"><metadata>${escape(JSON.stringify(metadata))}</metadata><rect width="100%" height="100%" fill="${bg}"/><defs><linearGradient id="scalar-color" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="${scalarColor(0,0,1)}"/><stop offset="1" stop-color="${scalarColor(1,0,1)}"/></linearGradient><clipPath id="grid-clip"><rect x="${b.left}" y="${b.top}" width="${b.right-b.left}" height="${b.bottom-b.top}"/></clipPath><pattern id="unrun-grid" width="10" height="10" patternUnits="userSpaceOnUse"><circle cx="5" cy="5" r="1.5" fill="${border}"/></pattern><pattern id="unavailable-grid" width="8" height="8" patternUnits="userSpaceOnUse"><path d="M0,4H8" stroke="${border}"/></pattern><pattern id="missing-grid" width="8" height="8" patternUnits="userSpaceOnUse"><path d="M0,0L8,8M8,0L0,8" stroke="${border}" stroke-width="1"/></pattern></defs><g clip-path="url(#grid-clip)">`
  for(const p of model.points){
    let fill='url(#missing-grid)'
    if(model.classification){if(p.winner)fill=seriesColor(p.winner,theme,model.classification.candidates.findIndex(c=>c.id===p.winner));else if(p.status==='tie')fill=light?'#888':'#aaa'}
    else if(Number.isFinite(p.value))fill=scalarColor(p.value,range.min,range.max)
    else if(['cancelled','not-run','stale-invalidated'].includes(gridCellStatus(p)))fill='url(#unrun-grid)'
    else if(gridCellStatus(p)==='derived-unavailable')fill='url(#unavailable-grid)'
    svg+=`<rect data-cell-index="${p.index}" data-cell-status="${gridCellStatus(p)}" x="${Math.min(px(p.x-dx/2),px(p.x+dx/2))}" y="${Math.min(py(p.y-dy/2),py(p.y+dy/2))}" width="${Math.abs(px(p.x+dx/2)-px(p.x-dx/2))}" height="${Math.abs(py(p.y+dy/2)-py(p.y-dy/2))}" fill="${fill}"/>`
  }
  if(settings.showDomainBoundary)for(const line of calculatedDomainEdges(model))svg+=`<path data-domain-boundary="sample-availability" d="M${px(line.from.x)},${py(line.from.y)}L${px(line.to.x)},${py(line.to.y)}" stroke="${fg}" stroke-width="2" stroke-dasharray="3 3" fill="none"/>`
  for(const line of scalarContours(model,levels))svg+=`<path d="M${px(line.from.x)},${py(line.from.y)}L${px(line.to.x)},${py(line.to.y)}" stroke="${fg}" stroke-width="1" fill="none"/>`
  for(const [key,enabled] of [['minimum',settings.showMinimum],['maximum',settings.showMaximum]]){const p=model.analysis?.extrema[key];if(enabled&&p)svg+=`<circle data-extremum="${key}" cx="${px(p.x)}" cy="${py(p.y)}" r="7" fill="${key==='minimum'?'#fff':'#f4ce70'}" stroke="#111" stroke-width="2"><title>${escape(`${key} sampled: ${p.value}; X=${p.x}; Y=${p.y}; index=${p.index}; calculated subset only`)}</title></circle><text x="${px(p.x)+9}" y="${py(p.y)-8}" fill="${fg}" font-size="14">${key==='minimum'?'min':'max'}</text>`}
  if(pin!==null&&model.points[pin]){const p=model.points[pin];svg+=`<path d="M${px(p.x)},${b.top}V${b.bottom}M${b.left},${py(p.y)}H${b.right}" stroke="${fg}" stroke-dasharray="4 4" fill="none"/>`}
  svg+=`</g><g font-family="system-ui,sans-serif" font-size="17" fill="${fg}">`
  for(let i=0;i<=5;i++){const x=view.xMin+(view.xMax-view.xMin)*i/5,y=view.yMin+(view.yMax-view.yMin)*i/5;svg+=`<text x="${px(x)}" y="${b.bottom+25}" text-anchor="middle">${escape(formatNumber(x,model.metadata.axes[0].quantity))}</text><text x="80" y="${py(y)+5}" text-anchor="end">${escape(formatNumber(y,model.metadata.axes[1].quantity))}</text>`}
  const axisLabel=a=>axisDisplayLabel(a,model.metadata.componentNames)
  svg+=`<text x="${b.left}" y="23">${escape(metadata.stale?'OLD conditions — result stale':model.metadata.runStatus==='completed'?'Calculated grid':'Calculated grid with missing points')}</text><text x="${(b.left+b.right)/2}" y="${b.bottom+55}" text-anchor="middle">${escape(axisLabel(xa))}</text><text transform="translate(22,${(b.top+b.bottom)/2}) rotate(-90)" text-anchor="middle">${escape(axisLabel(ya))}</text>`
  svg+=`<text x="${b.left}" y="${b.bottom+82}">${escape(model.classification?'Experimental inventory dominance — not a validated Pourbaix diagram':`${seriesLabel(model.series,model.metadata.output.type)} · ${model.metadata.output.label} [${model.metadata.output.unit}]`)}</text>`
  if(!model.classification)svg+=`<rect x="1020" y="55" width="18" height="200" fill="url(#scalar-color)"/><text x="1045" y="64" font-size="14">${range.max===null?'Unavailable':escape(formatNumber(range.max))}</text><text x="1045" y="255" font-size="14">${range.min===null?'Unavailable':escape(formatNumber(range.min))}</text><text x="1020" y="283" font-size="14">F · ${escape(model.metadata.output.type)}</text><rect x="1005" y="288" width="12" height="12" fill="url(#missing-grid)"/><text x="1020" y="302" font-size="14">× Failed · — F unavailable</text><text x="1020" y="320" font-size="13">Dots: unrun/cancelled</text>`
  if(levels.length)svg+=`<text x="1020" y="345" font-size="14">Contours: interpolated</text>`
  levels.forEach((v,i)=>{svg+=`<text x="1020" y="${363+i*14}" font-size="14">${escape(formatNumber(v))}</text>`})
  if(settings.showDomainBoundary)svg+=`<text x="1020" y="435" font-size="13">Dashed: sampled domain</text><text x="1020" y="451" font-size="13">Not a phase boundary</text>`
  lines.forEach((line,i)=>{svg+=`<text x="${b.left}" y="${b.bottom+110+i*21}" font-size="16">${escape(line.replace(': T total',': total').replace(': LA log-activity',': log activity').replace(': LA pH',': pH').replace(': LA pe',': pe').replace(': LA Eh',': Eh'))}</text>`})
  return svg+'</g></svg>'
}
export function gridPackage(system,grid,derived,viewModel){
  if(!derived.ok||system.id!==grid.systemId||grid.gridId!==derived.metadata.gridId||grid.revision!==derived.metadata.revision)throw new Error('Mismatched grid export identities.')
  const selected = derived.series.find(s=>s.id===viewModel.selectedSeries?.id)??derived.series[0]
  const diagnostics = selected ? gridDiagnostics(grid,selected) : null
  const sampledOutput = selected && { speciesId:selected.id, quantity:{...derived.metadata.output,descriptor:selected.descriptor}, shape:grid.shape, order:grid.order, cells:selected.points.map(p=>({ ...p, ...diagnostics.cells[p.index], state:gridCellStatus(p), transformed:grid.outcomes[p.index].transformed, activeSolids:grid.outcomes[p.index].result?.solids??null })) }
  return JSON.stringify({kind:'adams-scientific-grid-export',schemaVersion:1,system,grid,derived,sampledOutput,gridDiagnostics:diagnostics,scientificSummary:viewModel.scientificSummary??null,view:viewModel,warning:'Exported results are not trusted on reimport. Cells are exact samples; optional contours interpolate visualization only. Inspect statuses and source provenance.'},null,2)
}
