// Independent scalar reduction; deliberately no production solver imports.
export function independentProtonRedox(){
 const T=.001,A=.001,K=10**.27,kh=10**-2.26,kw=10**-14.0015
 const at=h=>{const r=Math.sqrt(K/(1+kh/h)),x=T*r/(1+r),v3=(T-x)/(1+kh/h),vh=kh*v3/h;return {h,x,v3,vh,oh:kw/h,residual:h-kw/h-vh-A}}
 let lo=A,hi=A+T+kw/A
 for(let i=0;i<100;i++){const mid=(lo+hi)/2;if(at(mid).residual>0)hi=mid;else lo=mid}
 const s=at((lo+hi)/2),peV=-5.83+Math.log10(s.v3/s.x),peEu=-6.1+Math.log10(s.x/(T-s.x))
 const exactFaraday=6.02214076e23*1.602176634e-19
 return {exactFaraday,exactEh:peV*8.31446261815324*298.15*Math.LN10/exactFaraday,T,A,K,kh,kw,...s,eu3:s.x,eu2:T-s.x,chloride:5*T+A,pH:-Math.log10(s.h),peV,peEu,Eh:peV*8.31446261815324*298.15*Math.LN10/96485.33212}
}
