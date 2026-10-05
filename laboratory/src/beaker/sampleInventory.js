// CIAAW Abridged Standard Atomic Weights 2024, https://ciaaw.org/abridged-atomic-weights.htm
// Ordinary terrestrial composition; absent elements remain unavailable, never guessed.
const weights={H:1.0080,He:4.0026,Li:6.94,Be:9.0122,B:10.81,C:12.011,N:14.007,O:15.999,F:18.998,Ne:20.180,Na:22.990,Mg:24.305,Al:26.982,Si:28.085,P:30.974,S:32.06,Cl:35.45,Ar:39.95,K:39.098,Ca:40.078,Sc:44.956,Ti:47.867,V:50.942,Cr:51.996,Mn:54.938,Fe:55.845,Co:58.933,Ni:58.693,Cu:63.546,Zn:65.38,Ga:69.723,Ge:72.630,As:74.922,Se:78.971,Br:79.904,Kr:83.798,Rb:85.468,Sr:87.62,Y:88.906,Zr:91.222,Nb:92.906,Mo:95.95,Ru:101.07,Rh:102.91,Pd:106.42,Ag:107.87,Cd:112.41,In:114.82,Sn:118.71,Sb:121.76,Te:127.60,I:126.90,Xe:131.29,Cs:132.91,Ba:137.33,La:138.91,Ce:140.12,Pr:140.91,Nd:144.24,Sm:150.36,Eu:151.96,Gd:157.25,Tb:158.93,Dy:162.50,Ho:164.93,Er:167.26,Tm:168.93,Yb:173.05,Lu:174.97,Hf:178.49,Ta:180.95,W:183.84,Re:186.21,Os:190.23,Ir:192.22,Pt:195.08,Au:196.97,Hg:200.59,Tl:204.38,Pb:207.2,Bi:208.98,U:238.02891};
// Uranium: normal terrestrial composition, https://ciaaw.org/uranium.htm
export function formulaAtoms(name){
 let f=name.replace(/\s+\d*[+-]$/,'').replace(/[+-]$/,'');
 if(!/^[A-Za-z0-9()]+$/.test(f))return null;
 const tokens=f.match(/[A-Z][a-z]?|\d+|[()]/g);if(!tokens||tokens.join('')!==f)return null;
 let at=0;
 function group(){const out={};while(at<tokens.length&&tokens[at]!==')'){let part;const t=tokens[at++];if(t==='('){part=group();if(tokens[at++]!==')')throw 0;}else{if(!(t in weights))throw 0;part={[t]:1};}let n=/^\d+$/.test(tokens[at]??'')?Number(tokens[at++]):1;if(!(n>0))throw 0;for(const [e,v]of Object.entries(part))out[e]=(out[e]??0)+v*n;}return out;}
 try{const r=group();return at===tokens.length?r:null;}catch{return null;}
}
export function sampleInventory(state, kg) {
 if(!state?.ok || !Number.isFinite(kg) || kg<=0 || !state.system || !state.result)return null;
 const {system,result}=state;
 const bases=system.components.map(c=>c.name==='e-'?{}:formulaAtoms(c.name));
 const composition=id=>{
  const ci=system.components.findIndex(c=>c.id===id);if(ci>=0)return bases[ci];
  const p=system.products.find(p=>p.id===id);if(!p)return null;const atoms={};
  for(let i=0;i<p.coefficients.length;i++){const n=p.coefficients[i];if(!n)continue;if(!bases[i])return null;for(const [e,v]of Object.entries(bases[i]))atoms[e]=(atoms[e]??0)+v*n;}
  if(Object.values(atoms).some(v=>v< -1e-8||Math.abs(v-Math.round(v))>1e-7))return null;
  return Object.fromEntries(Object.entries(atoms).filter(([,v])=>v>1e-8).map(([e,v])=>[e,Math.round(v)]));
 };
 const row=(id,name,amount)=>{const atoms=composition(id);const mass=atoms?Object.entries(atoms).reduce((sum,[e,n])=>sum+weights[e]*n,0):null;return {id,name,moles:amount*kg,massG:mass===null?null:amount*kg*mass};};
 const solids=result.solids.filter(s=>s.amount>0).map(s=>row(s.id,s.name,s.amount));
 const solidIds=new Set(result.solids.map(s=>s.id));
 const aqueous=result.speciesIds.flatMap((id,i)=>id==='component:H2O'||solidIds.has(id)?[]:[row(id,system.components.find(c=>c.id===id)?.name??system.products.find(p=>p.id===id)?.name??id,result.concentrations[i])]);
 return {basisKgWater:kg,solids,aqueous,drySolidMassG:solids.every(s=>s.massG!==null)?solids.reduce((n,s)=>n+s.massG,0):null};
}
export function amountLabel(state){
 if(!state?.accepted || !state.hasAmountBasis)return 'Unavailable';
 const g=state.inventory?.drySolidMassG;
 if(Number.isFinite(g))return g===0?'0 mg':g>=1?g.toPrecision(3)+' g':g>=.001?(g*1000).toPrecision(3)+' mg':(g*1e6).toPrecision(3)+' µg';
 return ((state.totalSolidMoles??state.solidMoles)*1000).toPrecision(3)+' mmol';
}
/** Ideal physical separation of an immutable, accepted sample; no new equilibrium. */
export function separateSample(sample){
 if(!sample?.accepted || !sample.hasAmountBasis)throw new Error('An accepted sample with an amount basis is required.');
 const base=structuredClone(sample),inv=base.inventory;
 const residue={...base,volumeMl:0,probeValue:null,pH:null,Eh:null,kind:'Residue',partitions:(base.partitions??[]).filter(p=>p.solidFraction>0).map(p=>({...p,solidFraction:1,dissolvedFraction:0})),inventory:inv?{...inv,basisKgWater:0,aqueous:[]}:null};
 const filtrate={...base,kind:'Filtrate',partitions:(base.partitions??[]).filter(p=>p.dissolvedFraction>0).map(p=>({...p,solidFraction:0,dissolvedFraction:1})),solids:[],visibleSolids:[],solidMoles:0,totalSolidMoles:0,illustrativeSolidMl:0,inventory:inv?{...inv,solids:[],drySolidMassG:0}:null};
 return {residue,filtrate};
}

export function partitionLabel(state){const p=state?.partitions?.find(p=>p.solidFraction>0)??state?.partitions?.[0];return p?`${p.name}: ${(p.dissolvedFraction*100).toFixed(1)}% in solution · ${(p.solidFraction*100).toFixed(1)}% precipitated`:'';}
export function emptySample(state){return {...state,accepted:false,kind:'Empty beaker',volumeMl:0,remainingMl:0,addedMl:0,pH:null,Eh:null,probeValue:null,hasAmountBasis:false,inventory:null,partitions:[],solids:[],visibleSolids:[],solidMoles:0,totalSolidMoles:0,illustrativeSolidMl:0,curve:[]};}
