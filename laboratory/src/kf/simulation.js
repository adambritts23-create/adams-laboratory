export const UG_PER_MA_MIN = 18.01528 * 1e6 * 60 / (2 * 96485.33212 * 1000);
export const KF_VIALS = [
 {id:'GREEN-001',name:'Green powder',mass:.6,ppm:1000,k:1.05,color:0x64a84c,glow:false},
 {id:'GLOW-002',name:'Green glowing · 2000 ppm',mass:.6,ppm:2000,k:.95,color:0x88de42,glow:true},
 {id:'GLOW-003',name:'Green glowing · 3000 ppm',mass:.6,ppm:3000,k:1.05,color:0x88de42,glow:true},
 {id:'YELLOWCAKE-001',name:'Yellowcake · yellow → orange',mass:.02,ppm:50000,k:.90,color:0xe5c632,orange:true},
 {id:'BLANK-001',name:'Empty vial · blank',mass:1,ppm:0,k:1.6,color:0xffffff,blank:true}
];
export class KFRun {
 constructor(vial=KF_VIALS[0],flow=50,blank=80){
  if(!(flow>0)||!(vial.mass>0))throw new Error('Positive flow and sample mass required');
  this.vial={...vial};this.flow=flow;this.blank=blank;this.baseline=3;this.status='ready';this.t=0;
  this.total=vial.mass*vial.ppm+80;this.solid=this.total;this.gas=0;this.deficit=0;
  this.rate=3;this.current=3/UG_PER_MA_MIN;this.voltage=50;this.chargeWater=0;this.delivered=0;this.hold=0;
  this.history=[this.point()];this.lastPoint=0;
 }
 start(){if(this.status==='ready')this.status='running';}
 get gross(){return Math.max(0,this.chargeWater-this.baseline*this.t);}
 get corrected(){return this.vial.blank?this.gross:Math.max(0,this.gross-this.blank);}
 get ppm(){return this.corrected/this.vial.mass;}
 point(){return {t:this.t,water:this.gross,rate:this.rate,mV:this.voltage};}
 step(minutes){
  if(this.status!=='running')return;
  let remaining=minutes;
  while(remaining>1e-10&&this.status==='running'){
   const dt=Math.min(remaining,.001);remaining-=dt;
   // Exact nonnegative release/flush substeps; all inventories are micrograms.
   const released=this.solid*(1-Math.exp(-this.vial.k*dt));this.solid-=released;this.gas+=released;
   const transported=this.gas*(1-Math.exp(-this.flow/10*dt));this.gas-=transported;this.delivered+=transported;
   this.deficit+=transported+this.baseline*dt;
   this.voltage=50+60*Math.tanh(this.deficit/12);
   const command=Math.min(400*UG_PER_MA_MIN,this.baseline+.8*(this.voltage-50)**2);
   this.rate+=(command-this.rate)*(1-Math.exp(-dt/.025));
   // Rapid KF reaction: generation is limited by available water in this first-pass model.
   const reacted=Math.min(this.deficit,this.rate*dt);this.deficit-=reacted;
   this.chargeWater+=reacted;this.current=reacted/dt/UG_PER_MA_MIN;this.t+=dt;
   if(this.t>=5&&this.rate<this.baseline+1&&this.voltage<51)this.hold+=dt;else this.hold=0;
   if(this.hold>=.333){this.status='complete';this.rate=this.baseline;this.current=this.baseline/UG_PER_MA_MIN;this.voltage=50;}
   if(this.t>=30&&this.status==='running')this.status='timeout';
   if(this.t-this.lastPoint>=.025||this.status!=='running'){this.history.push(this.point());this.lastPoint=this.t;}
  }
 }
}
