import {KFRun,KF_VIALS,UG_PER_MA_MIN} from './simulation.js';
export function mountKFExperiment(root){
 const host=document.createElement('div');host.className='kf-experiment-overlay';
 host.innerHTML=`<div class="kf-experiment-bar"><button id="kf-vials-open">Vials</button><button id="kf-run-start">Start Titration</button><button id="kf-results-open">Computer</button><label>Time <select id="kf-time-scale"><option value="1">1×</option><option value="10" selected>10×</option><option value="30">30×</option><option value="60">60×</option></select></label><span id="kf-run-values"></span></div>
 <section class="kf-model-panel" id="kf-vial-panel" hidden><button class="kf-panel-close" data-close="vial-panel">×</button><h3>Prepared vials</h3><label>Sample <select id="kf-vial-choice"></select></label><label>Argon / mL min⁻¹ <input id="kf-flow-rate" type="number" value="50" min="40" max="60"></label><label>Release constant / min⁻¹ <input id="kf-release-rate" type="number" value="1.05" min="0.1" max="5" step="0.05"></label><button id="kf-insert-vial">Insert selected vial</button><p id="kf-vial-note"></p><p>Water releases gradually from the heated sample into 10 mL of perfectly mixed gas. Sample colours are illustrative.</p></section>
 <section class="kf-model-panel kf-model-computer" id="kf-computer-panel" hidden><button class="kf-panel-close" data-close="computer-panel">×</button><h3>Computer · titration record</h3><canvas id="kf-run-chart" width="1024" height="640" aria-label="Red water in micrograms on left axis; yellow titration rate in micrograms per minute on right axis; time in minutes"></canvas><p id="kf-run-result"></p><button id="kf-run-stop" disabled>Abort run</button><button id="kf-use-blank" disabled>Use measured blank</button><p id="kf-blank-value"></p><aside class="kf-history"><h3>Batches & past results</h3><label>Batch <input id="kf-batch" value="Batch 001" maxlength="40"></label><button id="kf-new-batch">New batch</button><div id="kf-run-history"></div></aside><details><summary>Model assumptions</summary><p>dS/dt = −kS; dH/dt = kS − QH/V. S: retained water; H: gas-phase water; V=10 mL. At 50 mL/min the gas residence time is 12 s, while sample release takes minutes.</p><p>Cell: dW/dt = QH/V + 3 − r. Faraday's law: r = I M(H₂O)/(2F); 400 mA ≈ 2241 µg/min. Effective mean current, approximate controller and mV response; rapid KF reaction assumed. No detailed electrode kinetics or excess-iodine inventory. Colour/glow are scenario identifiers.</p><p>Resting drift 3 µg/min. Red water is charge-derived minus baseline drift; yellow is total water-equivalent titration rate, with its own axis. Stop after ≥5 min and rate &lt;4 µg/min, indicator &lt;51 mV for 20 s. Timeout: 30 min. Every vial adds an 80 µg blank; ppm = blank-corrected µg / g. Blank uses nominal 1 g. Presets are illustrative, not certified materials.</p><a href="https://www.metrohm.com/content/dam/metrohm/shared/application-files/AB-137.pdf" target="_blank" rel="noreferrer">Metrohm AB-137</a></details></section>
 <div id="kf-run-status" class="kf-model-status" role="status"></div>`;
 const stage=root.querySelector('#kf-stage');stage.setAttribute('role','group');stage.setAttribute('aria-label','Interactive KF experiment');stage.append(host);const $=id=>host.querySelector('#kf-'+id);
 for(const [i,v]of KF_VIALS.entries()){const o=document.createElement('option');o.value=i;o.textContent=`${v.id} · ${v.name} · ${v.mass} g`;$('vial-choice').append(o);}
 let blank=80,run=new KFRun(),revision=0,drawTimer=0,lastCompleted=null;
 let records=[];try{records=JSON.parse(localStorage.getItem('kf-results-v1')||'[]');if(!Array.isArray(records))records=[];}catch{}
 let batch='Batch 001';$('new-batch').onclick=()=>{$('batch').value='Batch '+String(new Set(records.map(r=>r.batch)).size+1).padStart(3,'0');};
 function history(){const el=$('run-history');el.replaceChildren();for(const r of records.slice().reverse()){const row=document.createElement('p');row.textContent=`${r.batch} · ${r.id} · ${r.mass} g · ${r.result} · ${r.time} min`;el.append(row);}}history();
 const chart=$('run-chart'),instrument=document.createElement('canvas'),computer=document.createElement('canvas');for(const c of [instrument,computer]){c.width=1024;c.height=640;}
 function open(id){$('vial-panel').hidden=id!=='vial-panel';$('computer-panel').hidden=id!=='computer-panel';}
 for(const b of host.querySelectorAll('[data-close]'))b.onclick=()=>open(null);
 $('vials-open').onclick=()=>open('vial-panel');$('results-open').onclick=()=>open('computer-panel');
 $('vial-choice').onchange=()=>{const v=KF_VIALS[+$('vial-choice').value];$('release-rate').value=v.k;$('vial-note').textContent=`${v.mass} g · expected ${v.ppm} ppm + vial blank`;};
 function settings(){const flow=Number($('flow-rate').value),k=Number($('release-rate').value);if(!(flow>=40&&flow<=60&&k>=.1&&k<=5)){ $('vial-note').textContent='Use flow 40–60 mL/min and release constant 0.1–5 min⁻¹.';open('vial-panel');return null;}return {flow,k};}
 function insert(){if(run.status==='running')return;const config=settings();if(!config)return;run=new KFRun({...KF_VIALS[+$('vial-choice').value],k:config.k},config.flow,blank);lastCompleted=null;open(null);paint();}
 function start(){if(run.status!=='ready')return;batch=$('batch').value.trim()||'Unbatched';run.start();paint();}
 $('insert-vial').onclick=insert;$('run-start').onclick=start;$('run-stop').onclick=()=>{run.status='aborted';run.rate=run.baseline;run.current=run.baseline/UG_PER_MA_MIN;run.voltage=50;paint();};
 $('use-blank').onclick=()=>{if(run.status==='complete'&&run.vial.blank){blank=run.gross;paint();}};
 function line(c,points,x,y,w,h,xmax,ymax,key,color){c.strokeStyle=color;c.lineWidth=5;c.beginPath();points.forEach((p,i)=>{const px=x+w*p.t/xmax,py=y+h-h*p[key]/ymax;i?c.lineTo(px,py):c.moveTo(px,py);});c.stroke();}
 function render(canvas){
  const c=canvas.getContext('2d');c.fillStyle='#091d25';c.fillRect(0,0,1024,640);c.font='bold 28px sans-serif';c.fillStyle='#d5eee9';c.fillText(run.vial.id,32,43);
  c.font='22px sans-serif';c.fillText(`${run.vial.mass.toFixed(3)} g · ${run.status.toUpperCase()} · ${run.t.toFixed(2)} min`,32,78);
  c.fillStyle='#ff635d';c.fillText(`Water ${run.gross.toFixed(1)} µg`,32,119);c.fillStyle='#eed057';c.fillText(`Rate ${run.rate.toFixed(1)} µg/min`,375,119);c.fillStyle='#c2e7ef';c.fillText(`${run.voltage.toFixed(0)} mV · ${run.current.toFixed(2)} mA`,710,119);
  const x=105,y=181,w=800,h=300,xmax=Math.max(6,Math.ceil(run.t)),watermax=Math.max(100,Math.ceil(run.total/100)*100),ratemax=Math.max(100,Math.ceil(Math.max(...run.history.map(p=>p.rate))/100)*100);
  c.font='18px sans-serif';for(let i=0;i<=4;i++){const yy=y+h-i*h/4;c.strokeStyle='#29464e';c.beginPath();c.moveTo(x,yy);c.lineTo(x+w,yy);c.stroke();c.textAlign='right';c.fillStyle='#ff8078';c.fillText((watermax*i/4).toFixed(0),x-12,yy+6);c.textAlign='left';c.fillStyle='#eed057';c.fillText((ratemax*i/4).toFixed(0),x+w+12,yy+6);}
  c.textAlign='center';c.fillStyle='#b6cdd2';for(let i=0;i<=6;i++)c.fillText((xmax*i/6).toFixed(1),x+w*i/6,y+h+28);c.fillText('Time / min',x+w/2,y+h+58);
  c.textAlign='left';c.fillStyle='#ff8078';c.fillText('Water / µg',x,y-22);c.textAlign='right';c.fillStyle='#eed057';c.fillText('Rate / µg min⁻¹',x+w,y-22);
  line(c,run.history,x,y,w,h,xmax,watermax,'water','#ff5049');line(c,run.history,x,y,w,h,xmax,ratemax,'rate','#eed057');
  c.textAlign='left';c.fillStyle='#d5eee9';c.font='22px sans-serif';c.fillText(run.vial.blank?`Blank water: ${run.gross.toFixed(1)} µg`:`Corrected: ${run.corrected.toFixed(1)} µg · ${run.ppm.toFixed(0)} ppm`,32,584);
  c.font='17px sans-serif';c.fillStyle='#9db8c0';c.fillText(`Blank ${blank.toFixed(1)} µg · resting drift 3 µg/min · ${run.status==='complete'?'Final simulated result':'Provisional'} · independent axes`,32,620);
 }
 function renderInstrument(){
  const c=instrument.getContext('2d');c.fillStyle='#122e22';c.fillRect(0,0,1024,640);c.fillStyle='#b5ebbb';c.font='bold 38px sans-serif';c.fillText('KF COULOMETER',40,65);c.font='26px sans-serif';c.fillText(run.vial.id+' · '+run.status.toUpperCase(),40,115);
  c.font='bold 64px sans-serif';c.fillStyle='#fff0b5';c.fillText(run.vial.blank?run.gross.toFixed(1)+' µg blank':run.ppm.toFixed(1)+' ppm',40,220);
  c.font='30px sans-serif';c.fillText(run.corrected.toFixed(2)+' µg water · '+run.vial.mass+' g',40,278);
  c.fillStyle='#efce62';c.fillText('ACTIVE DRIFT / RATE',40,365);c.font='bold 50px sans-serif';c.fillText(run.rate.toFixed(2)+' µg/min',40,425);
  c.fillStyle='#a8e9df';c.font='30px sans-serif';c.fillText('INDICATOR',610,365);c.font='bold 50px sans-serif';c.fillText(run.voltage.toFixed(1)+' mV',610,425);
  c.font='25px sans-serif';c.fillStyle='#b5ebbb';c.fillText('Generator '+run.current.toFixed(2)+' mA · '+run.t.toFixed(2)+' min',40,530);c.fillText(run.status==='complete'?'RESULT SAVED · CONDITIONING':'SIMULATED · '+(run.status==='running'?'PROVISIONAL RESULT':'READY'),40,595);
 }
 function paint(){
  const running=run.status==='running';$('run-start').disabled=run.status!=='ready';$('run-stop').disabled=!running;
  for(const id of ['insert-vial','vial-choice','flow-rate','release-rate','batch','new-batch'])$(id).disabled=running;
  $('use-blank').disabled=!(run.status==='complete'&&run.vial.blank);
  $('run-status').textContent=`${run.vial.id} · ${run.vial.mass} g · ${run.status==='ready'?'Ready · conditioning at 3 µg/min':run.status==='complete'?'Complete · conditioning':run.status==='running'?'Titrating':run.status+' · incomplete result'}`;
  $('run-values').textContent=`${run.t.toFixed(2)} min · ${run.voltage.toFixed(0)} mV · ${run.rate.toFixed(1)} µg/min`;
  $('run-result').textContent=run.vial.blank?`Blank: ${run.gross.toFixed(2)} µg (${run.status}).`:`${run.corrected.toFixed(2)} µg after blank correction ÷ ${run.vial.mass} g = ${run.ppm.toFixed(1)} ppm (${run.status==='complete'?'final simulated result':'provisional'}).`;
  $('blank-value').textContent=`Blank correction: ${blank.toFixed(2)} µg per vial.`;
  if(run.status==='complete'&&lastCompleted!==run){lastCompleted=run;records.push({batch,id:run.vial.id,mass:run.vial.mass,result:run.vial.blank?run.gross.toFixed(2)+' µg blank':run.ppm.toFixed(1)+' ppm',time:run.t.toFixed(2)});records=records.slice(-200);try{localStorage.setItem('kf-results-v1',JSON.stringify(records));}catch{}history();}
  render(chart);render(computer);renderInstrument();revision++;

 }
 paint();return {get run(){return run;},get revision(){return revision;},canvas:instrument,computerCanvas:computer,closePanels(){open(null);},start,openComputer(){open('computer-panel');},openVials(){open('vial-panel');},frame(dt){run.step(dt*Number($('time-scale').value)/60);drawTimer+=dt;if(drawTimer>.15){drawTimer=0;paint();}},dispose(){host.remove();}};
}
