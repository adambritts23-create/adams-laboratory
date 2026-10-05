/** Same selected/preview marker in Wet Lab and Calculation. SVG coordinates only. */
export default function SampleMarker({x,pinnedX,top,bottom,points=[]}) {
 return <g pointerEvents="none" aria-hidden="true">
  {Number.isFinite(pinnedX)&&<path d={`M${pinnedX} ${top}V${bottom}`} stroke="#b4c6cd" strokeDasharray="3 6"/>}
  {Number.isFinite(x)&&<><path d={`M${x} ${top}V${bottom}`} stroke="#f2cd83" strokeDasharray="4 4"/>{points.filter(p=>Number.isFinite(p.y)).map(p=><circle key={p.id} cx={x} cy={p.y} r="5" fill={p.color}/>)}</>}
 </g>
}
