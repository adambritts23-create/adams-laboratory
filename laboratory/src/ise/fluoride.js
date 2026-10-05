// Port of the supplied two-standard-addition Python method (58 mL, +0.5 then +1.0 mL).
import {iseMethod} from './model.js'
export const fluorideMethod=Object.freeze({originalVolumeMl:8,uraniumPercent:87.5,slopeMin:-60.5,slopeMax:-54,tolerance:.001,maxIterations:200})
export function concentrations(initial,volumes=iseMethod.additionVolumesMl){
 const {initialVolumeMl:v,standardFluorideMgL:c}=iseMethod
 const [a,b]=volumes,total=a+b
 return [initial,(initial*v+c*a)/(v+a),(initial*v+c*total)/(v+total)]
}
export function slopes(initial,readings,volumes=iseMethod.additionVolumesMl){
 const f=concentrations(initial,volumes)
 return [(readings[1]-readings[0])/Math.log10(f[1]/f[0]),(readings[2]-readings[1])/Math.log10(f[2]/f[1])]
}
export function calculateFluoride(readings,massG,uraniumPercent=87.5,volumes=iseMethod.additionVolumesMl){
 if(volumes.length!==2||!volumes.every(v=>Number.isFinite(v)&&v>0)||58+volumes[0]+volumes[1]>100)throw new Error('Enter two positive addition volumes; final volume must fit the 100 mL beaker.')
 if(readings.length!==3||!readings.every(Number.isFinite))throw new Error('Enter three finite mV readings.')
 if(!Number.isFinite(massG)||massG<=0)throw new Error('Sample mass must be greater than zero.')
 if(!Number.isFinite(uraniumPercent)||uraniumPercent<=0||uraniumPercent>100)throw new Error('Uranium content must be greater than 0 and at most 100%.')
 if(!(readings[0]>readings[1]&&readings[1]>readings[2]))throw new Error('This method expects decreasing potential after each fluoride addition.')
 const difference=x=>{const [a,b]=slopes(x,readings,volumes);return a-b}
 // Positive concentrations below the standard: exclude the singularity at 1000 mg/L.
 let low=1e-9,previous=difference(low),high,bracket=false
 for(let i=1;i<3000;i++){
  const x=10**(-9+13*i/2999)
  if(x>=iseMethod.standardFluorideMgL)break
  const value=difference(x)
  if(Number.isFinite(value)&&Number.isFinite(previous)&&Math.sign(value)!==Math.sign(previous)){high=x;bracket=true;break}
  low=x;previous=value
 }
 if(!bracket)throw new Error('No positive solution found below the standard concentration. Check the mV readings.')
 let initial,s,converged=false
 for(let i=0;i<fluorideMethod.maxIterations;i++){
  initial=(low+high)/2;s=slopes(initial,readings,volumes)
  if(s.every(Number.isFinite)&&Math.abs(s[0]-s[1])<fluorideMethod.tolerance){converged=true;break}
  if(Math.sign(difference(low))!==Math.sign(s[0]-s[1]))high=initial;else low=initial
 }
 if(!converged)throw new Error('The calculation did not converge. Check the mV readings.')
 const mean=(s[0]+s[1])/2,f=concentrations(initial,volumes),xs=f.map(Math.log10),xm=xs.reduce((a,b)=>a+b)/3,ym=readings.reduce((a,b)=>a+b)/3
 const regressionSlope=xs.reduce((sum,x,i)=>sum+(x-xm)*(readings[i]-ym),0)/xs.reduce((sum,x)=>sum+(x-xm)**2,0)
 return {additionVolumesMl:[...volumes],initialMgL:initial,originalMgL:initial*58/8,sampleUgG:initial*58/massG,uraniumUgG:initial*58/massG*100/uraniumPercent,slopes:s,meanSlope:mean,slopePass:mean>=-60.5&&mean<=-54,concentrations:f,readings:[...readings],massG,uraniumPercent,regressionSlope,regressionIntercept:ym-regressionSlope*xm}
}
export function fluorideCSV(result,sampleId,timestamp){
 const rows=[['Parameter','Value','Unit'],['Date/time',timestamp,''],['Sample ID',sampleId,''],...result.readings.map((e,i)=>[['E0 before addition',`E1 after ${result.additionVolumesMl[0]} mL`,`E2 after further ${result.additionVolumesMl[1].toFixed(1)} mL`][i],e,'mV']),['Sample mass',result.massG,'g'],['Assumed uranium content',result.uraniumPercent,'%'],['F in 58 mL solution',result.initialMgL,'mg/L'],['F in original 8 mL solution',result.originalMgL,'mg/L'],['F per sample',result.sampleUgG,'µg F/g sample'],['F per uranium',result.uraniumUgG,'µg F/g U'],['S01',result.slopes[0],'mV/dec'],['S12',result.slopes[1],'mV/dec'],['Mean slope',result.meanSlope,'mV/dec'],['Electrode slope check',result.slopePass?'PASS':'OUTSIDE RANGE','']]
 return '\uFEFF'+rows.map(row=>row.map(value=>{let text=String(value);if(typeof value==='string'&&/^[=+@\-\t\r]/.test(text))text="'"+text;return '"'+text.replaceAll('"','""')+'"'}).join(';')).join('\r\n')
}
