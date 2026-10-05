/** Sample analysis only. No equilibrium equations, interpolation or optimization. */
export const hasValue = p => p.pointStatus === 'converged' && Number.isFinite(p.value)
const coordinate = p => ({ index: p.index, x: p.x, ...(p.y !== undefined ? { y: p.y, ix: p.ix, iy: p.iy } : {}), value: p.value, linearValue: p.linearValue ?? null, linearUnit: p.linearUnit ?? null, status: 'calculated' })
export function adjacentPairs(length, shape) {
  const pairs = []
  for (let i = 0; i < length; i++) {
    if (shape) { if (i % shape[0] < shape[0] - 1) pairs.push([i,i+1]); if (i+shape[0]<length) pairs.push([i,i+shape[0]]) }
    else if (i+1<length) pairs.push([i,i+1])
  }
  return pairs
}
export function analyzeSamples(points, { shape = null, threshold = null } = {}) {
  if (shape && (shape.length !== 2 || shape.some(n=>!Number.isInteger(n)||n<1) || shape[0]*shape[1]!==points.length)) throw new Error('Analysis requires the exact sample lattice.')
  const valid = points.map(hasValue), pairs=adjacentPairs(points.length,shape), neighbors=points.map(()=>[])
  const thresholdValid=Number.isFinite(threshold), brackets=[], exactThresholdSamples=[]
  pairs.forEach(([a,b])=>{ if(valid[a]&&valid[b]) { neighbors[a].push(b);neighbors[b].push(a); if(thresholdValid && ((points[a].value<threshold&&points[b].value>threshold)||(points[b].value<threshold&&points[a].value>threshold))) brackets.push({from:coordinate(points[a]),to:coordinate(points[b])}) } })
  const visited=new Set(), regions=[]
  let min=null,max=null,minTies=0,maxTies=0
  for(let i=0;i<points.length;i++) if(valid[i]) {
    const p=points[i]
    if(min===null||p.value<min.value){min=coordinate(p);minTies=1}else if(p.value===min.value)minTies++
    if(max===null||p.value>max.value){max=coordinate(p);maxTies=1}else if(p.value===max.value)maxTies++
    if(thresholdValid&&p.value===threshold)exactThresholdSamples.push(coordinate(p))
    if(!visited.has(i)){const stack=[i],indices=[];visited.add(i);while(stack.length){const v=stack.pop();indices.push(points[v].index);for(const next of neighbors[v])if(!visited.has(next)){visited.add(next);stack.push(next)}}regions.push({id:regions.length,indices:indices.sort((a,b)=>a-b),count:indices.length})}
  }
  const validCount=valid.filter(Boolean).length
  return {status:validCount?'available':'unavailable',reason:validCount?null:'No accepted finite values for the selected output.',requested:points.length,validCount,valueCoverage:points.length?validCount/points.length:0,
    extrema:{minimum:min,maximum:max,minTies,maxTies,semantics:'sampled values only; first lattice index represents exact ties; no global optimization'},
    regions:{adjacency:shape?'four-neighbor sample lattice':'adjacent requested samples',count:regions.length,regions},
    threshold:{value:thresholdValid?threshold:null,status:thresholdValid?'evaluated':threshold===null?'not-requested':'invalid',semantics:'strict adjacent accepted-value brackets and exact sampled equalities; no interpolation',brackets,exactSamples:exactThresholdSamples}}
}
