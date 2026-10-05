/** Independent reference: nested monotone scalar balances, no production solver/preparation imports. */
export function acetateReference({acetateTotal:C,protonTotal:B,sodiumTotal:N=0,logAcidFormation,logSodiumFormation,logNaOHFormation,logWater}){
 const b=10**logAcidFormation,k=10**logSodiumFormation,kw=10**logWater,kn=10**logNaOHFormation
 function inventory(logH){const h=10**logH,q=1+b*h;let lo=0,hi=C
  for(let i=0;i<100;i++){const a=(lo+hi)/2,n=N/(1+k*a+kn/h);if(a*q+k*n*a>C)hi=a;else lo=a}
  const a=(lo+hi)/2,n=N/(1+k*a+kn/h),ha=b*h*a,pair=k*n*a,oh=kw/h,naoh=kn*n/h
  return {h,oh,a,ha,n,pair,naoh,balance:h-oh+ha-naoh-B,pH:-logH}
 }
 let lo=-30,hi=5
 for(let i=0;i<150;i++){const mid=(lo+hi)/2;if(inventory(mid).balance>0)hi=mid;else lo=mid}
 return inventory((lo+hi)/2)
}
export const acetateDoses=[0,10,25,40,45,49,49.9,49.99,50,50.01,50.1,51,55,75,100]

