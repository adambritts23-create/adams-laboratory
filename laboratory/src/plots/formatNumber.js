/** Presentation only: never feed this string back into inputs or numerical exports. */
export function formatNumber(value) {
  if (!Number.isFinite(value)) return 'Unavailable'
  if (value === 0) return '0'
  const rounded = Number(value.toPrecision(10))
  return Math.abs(rounded) < 1e-4 || Math.abs(rounded) >= 1e6
    ? rounded.toExponential().replace('e+', 'e')
    : String(rounded)
}

/** Human-facing semantic display only. Exact values remain in results and JSON. */
export function displayNumber(value, quantity='general') {
 if(!Number.isFinite(value))return 'Unavailable'
 if(value===0)return '0'
 const decimals={pH:2,Eh:3,voltage:3,temperature:1,log:3,'log-activity':3,pe:3}
 const rounded=Object.hasOwn(decimals,quantity)?Number(value.toFixed(decimals[quantity])):Number(value.toPrecision(['amount','concentration','total'].includes(quantity)?3:quantity==='diagnostic'?6:4))
 return Math.abs(rounded)>0&&(Math.abs(rounded)<1e-4||Math.abs(rounded)>=1e6)?rounded.toExponential().replace('e+','e'):String(rounded)
}
/** A rounded-to-zero positive trace must never be displayed as physical zero. */
export function displayConcentration(result, index) {
 return result?.linearConcentrationStatus?.[index]==='positive-underflow'
  ? `10^(${displayNumber(result.logConcentrations[index],'log')})`
  : displayNumber(result?.concentrations?.[index],'concentration')
}
export function displayDissolvedAmount(result, index) {
 const value=result?.dissolvedComponentAmounts?.[index],log=result?.dissolvedComponentLogAmounts?.[index]
 return value===0&&Number.isFinite(log)?`10^(${displayNumber(log,'log')})`:value===0&&result?.numericalRepresentation?'≈0 (linear approximation)':displayNumber(value,'amount')
}
export function displayComponentTotal(result,index) {
 const value=result?.componentTotals?.[index]
 return value===0&&result?.numericalRepresentation
  ? result.solids.every(s=>s.amount===0)?displayDissolvedAmount(result,index):'≈0 (linear approximation)'
  : displayNumber(value,'amount')
}
export function displayWeightedConcentration(result,index,coefficient) {
 const value=(result?.concentrations?.[index]??NaN)*coefficient,log=result?.logConcentrations?.[index]
 return value===0&&coefficient!==0&&Number.isFinite(log)
  ? `${coefficient<0?'-':''}10^(${displayNumber(log+Math.log10(Math.abs(coefficient)),'log')})`
  : displayNumber(value,'amount')
}
export const concentrationLogOutput=output=>['log-concentration','saturated-log-solubility','log-solubility','log-total-dissolved'].includes(output?.type??output)
export function outputNumberType(output={}) {
 const type=output.type??output
 if(concentrationLogOutput(output)||type==='log-activity')return 'log'
 if(['concentration','total-dissolved','amount'].includes(type))return 'concentration'
 if(['total-fraction','fraction','aqueous-fraction'].includes(type))return 'fraction'
 if(type==='calculated-pH')return 'pH'
 return output.redoxQuantity==='Eh'?'Eh':'general'
}
/** View bounds only: all-below-floor data stay below the viewport, never become display-floor results. */
export function concentrationDisplayRange(min,max,output) {
 if(!concentrationLogOutput(output)||!Number.isFinite(min)||!Number.isFinite(max))return {min,max}
 const floor=(output?.type??output)==='log-concentration'?-9:-20
 const lower=Math.max(floor,min),upper=max>lower?max:lower+1
 return {min:lower,max:upper}
}
