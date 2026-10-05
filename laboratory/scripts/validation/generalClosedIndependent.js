// Independent raw-law expectation, evaluated before the generalized production path.
import fs from 'node:fs';
const dose=1e-6,kw=10**-14.0015,ka=10**-11.65;
function state(u){const H2=10**(-3.083+2*u),H2O2=10**(-59.61-2*u),O2=10**(-85.988-4*u),O3=10**(-155.14-6*u),H=Math.sqrt(kw+ka*H2O2),OH=kw/H,HO2=ka*H2O2/H;return {u,H,H2,H2O2,HO2,OH,O2,O3,residual:H2O2+HO2+2*O2+3*O3-H2-dose,pH:-Math.log10(H),pe:Math.log10(H)-u};}
let lo=-30,hi=0;for(let i=0;i<180;i++){const mid=(lo+hi)/2;if(state(mid).residual>0)lo=mid;else hi=mid;}
const expected=state((lo+hi)/2);
fs.writeFileSync('docs/general-closed-independent.json',JSON.stringify({method:'Raw source mass-action laws; charge eliminates proton; bisection of H-2O inventory. No production compiler or solver imported.',dose,expected},null,2));console.log(expected);
