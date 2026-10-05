import { displayNumber as formatNumber } from './formatNumber.js'
import { axisDisplayLabel, figureConditionLines } from './export.js'
import { scalarColor, colorRange } from './scalarMap.js'
/** Raster figure only; the original numerical grid is exported separately. */
export function surfacePng(image,surface,settings,currentRevision){
  const lines=figureConditionLines(surface.metadata),c=document.createElement('canvas');c.width=1400;c.height=950+lines.length*25
  const x=c.getContext('2d'),light=settings.theme==='light';x.fillStyle=light?'#fff':'#10191f';x.fillRect(0,0,c.width,c.height);x.fillStyle=light?'#17232c':'#edf4f5';x.font='20px system-ui'
  const [xa,ya]=surface.metadata.axes
  const heading=[`${currentRevision!==surface.metadata.revision?'OLD CONDITIONS — ':''}Sampled 3D response surface · revision ${surface.metadata.revision}`,`X: ${axisDisplayLabel(xa,surface.metadata.componentNames)}`,`Y: ${axisDisplayLabel(ya,surface.metadata.componentNames)}`,`Z: ${surface.series.descriptor?.label ?? surface.metadata.output.label} [${surface.metadata.output.unit}]`]
  heading.forEach((s,i)=>x.fillText(s,25,30+i*28))
  const scale=Math.min(1130/image.width,690/image.height);x.drawImage(image,20,150,image.width*scale,image.height*scale)
  const range=colorRange(surface,settings.colorRange),g=x.createLinearGradient(0,700,0,190);g.addColorStop(0,scalarColor(0,0,1));g.addColorStop(1,scalarColor(1,0,1));x.fillStyle=g;x.fillRect(1170,190,22,510);x.fillStyle=light?'#17232c':'#edf4f5';x.font='14px system-ui';x.fillText(formatNumber(range.max)??'Unavailable',1198,205);x.fillText(formatNumber(range.min)??'Unavailable',1198,700)
  x.font='16px system-ui';x.fillText('Surface: sampled polygons · red crosses: failed · dots: unrun · dashes: unavailable F',25,870);x.fillText(`Contours: ${settings.surfaceContours||settings.baseContours?'interpolated between valid samples':'off'}. No smoothing. Raster figure is not numerical data.`,25,897)
  lines.forEach((s,i)=>x.fillText(s,25,930+i*25));return c.toDataURL('image/png')
}
