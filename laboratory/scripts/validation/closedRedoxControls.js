// Permanent analytic controls; not imported into the application runtime.
const make=(id,charge,elements)=>({id,name:id,role:'ordinary',phase:'aqueous',charge,elements,sourceIdentity:{reference:'Deliberate synthetic closed-redox validation v2',id}})
export function closedControl(kind='original',alternate=false,history=0){
 const definition=kind==='unequal'?{counts:[2,3],logs:[Math.log10(2),Math.log10(3)],totals:[27,8],expected:[9,18,2,6],initial:[0,27,8,0],counter:24,pe:0}:kind==='three'?{counts:[1,1,1],logs:[0,Math.log10(3),Math.log10(9)],totals:[1,2,5],expected:[.5,.5,.5,1.5,.5,4.5],initial:[0,1,0,2,1.5,3.5],counter:1.5,pe:0}:{counts:[1,1],logs:[0,2],totals:[1,1],expected:[10/11,1/11,1/11,10/11],initial:[0,1,1,0],counter:1,pe:1}
 const families=definition.counts.map((_,i)=>String.fromCharCode(65+i)),species=[],reactions=[],amounts={},expected={}
 for(const [i,f] of families.entries()){
  species.push(make(f+'o',definition.counts[i],{[f]:1}),make(f+'r',0,{[f]:1}))
  for(const [j,suffix] of ['o','r'].entries()){
   const id=f+suffix,k=i*2+j;expected[id]=definition.expected[k]
   // First original control preserves the exact Step-1 half/half preparation.
   amounts[id]=history?(kind==='original'?.5:(definition.initial[k]+definition.expected[k])/2):definition.initial[k]
  }
  reactions.push({id:f+'-reduction',productId:f+'r',terms:[{id:f+'o',coefficient:1},{id:'E',coefficient:definition.counts[i]}],logK:definition.logs[i],phase:'aqueous',unit:{kind:'ideal-molal-standard'},provenance:{reference:'Synthetic finite half-reaction standard; independent analytic control'}})
 }
 species.push(make('X',-1,{X:1}),{id:'E',name:'e-',role:'electron',charge:-1,elements:{},sourceIdentity:{reference:'Explicit formal electron bookkeeping identity'}});amounts.X=definition.counter;expected.X=definition.counter
 const basisIds=alternate?[...families.map(f=>f+'r'),families[0]+'o','X']:[...families.map(f=>f+'o'),families[0]+'r','X']
 return {expected,definition,request:{mode:'closed-redox',species,reactions,basisIds,electronId:'E',temperatureC:25,pressureBar:1,activityModel:'ideal',unit:'mol/kg-H2O',preparation:{amounts,description:`${kind} history ${history}`,chargePolicy:'electroneutral'}}}
}
