/** Decorative backdrop shared by both equilibrium vessel presentations. */
export default function VesselAtmosphere(){return (
   <g aria-hidden="true" className="wet-lab-atmosphere">
    <path d="M24 575V24H536V575M24 130H536M24 445H536" fill="none" stroke="#91a3a4" strokeOpacity=".12" strokeWidth="12"/>
    {Array.from({length:12},(_,i)=><path key={i} d={`M${65+i*36} 36v32`} stroke="#637272" strokeWidth="4" opacity=".15"/>)}
    <rect x="400" y="159" width="106" height="94" rx="4" fill="#88783f" opacity=".13" stroke="#c4b060"/>
    <text x="453" y="181" textAnchor="middle" style={{fontSize:10,fill:'#b4a66c',opacity:.4}}>CAUTION</text>
    <text x="453" y="226" textAnchor="middle" style={{fontSize:42,fill:'#b4a66c',opacity:.32}}>☢</text>
    <path d="M47 398v-60h22v60q17 9 17 28v95H31v-95q0-19 16-28M468 406v-53h24v53q17 9 17 30v94h-58v-94q0-21 17-30" fill="#486865" fillOpacity=".14" stroke="#a1b4ac" strokeOpacity=".18"/>
    <path d="M28 545H532M35 554H525" stroke="#a5a999" strokeOpacity=".14" strokeWidth="3"/>
   </g>
)}
