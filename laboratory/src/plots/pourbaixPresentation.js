export function oxidationStateLabel(element,state){
 const roman={0:'0',1:'I',2:'II',3:'III',4:'IV',5:'V',6:'VI',7:'VII',8:'VIII'}
 return `${element}(${roman[state]??state})`
}
// Visual descriptor only, driven by calculated discrete states; no chemical allocation.
export function pourbaixPresentation(result){
 const states=[...new Set(result.points.flatMap(c=>c.fractions.map(f=>f.oxidationState)))].sort((a,b)=>a-b),colors=['#465260','#237b9a','#ab7538','#7854aa','#478b74','#965769']
 const anchors={};for(const state of states){const points=result.points.filter(c=>c.predominant===state);if(points.length)anchors[state]=[points.reduce((n,p)=>n+p.pH,0)/points.length,points.reduce((n,p)=>n+p.Eh,0)/points.length]}
 return {element:result.label,styles:Object.fromEntries(states.map((s,i)=>[s,{label:oxidationStateLabel(result.label,s),color:colors[i%colors.length]}])),anchors}
}
