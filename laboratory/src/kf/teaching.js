// Small, synchronized teaching diagrams: no numerical titration model.
export function mountKFTeaching(root){
  const host=document.createElement('div');
  host.innerHTML=`
  <details id="kf-solution-pane" open><summary>In the reagent · iodine consumes water</summary>
    <p>Methyl sulfite → methyl sulfate. B = RN; the alcohol group is CH₃. One I₂ reacts per H₂O.</p>
    <svg class="kf-teaching" viewBox="0 0 800 320" role="img" aria-label="Iodine descends from the generator, reacts with water and methyl sulfite, and yields methyl sulfate, protonated base and iodide">
      <text x="400" y="26" text-anchor="middle">From the generator anode</text>
      <path d="M400 40 V105" stroke="#8ba5ae" stroke-width="2" stroke-dasharray="4 6"/>
      <g id="kf-sol-iodine"><circle cx="390" cy="65" r="12" fill="#a63e26"/><circle cx="410" cy="65" r="12" fill="#a63e26"/><text x="432" y="71">I₂</text></g>
      <g id="kf-sol-input"><rect x="60" y="125" width="680" height="78" rx="18" fill="#19353d"/>
        <text x="90" y="169" fill="#80d5ac">CH₃OSO₂⁻</text><text x="260" y="169">+</text><text x="300" y="169" fill="#a9dcf5">H₂O</text><text x="390" y="169">+</text><text x="440" y="169" fill="#9dc9ed">2 B</text><text x="520" y="169">+</text><text x="575" y="169" fill="#de7958">I₂</text>
      </g>
      <g id="kf-sol-output"><rect x="60" y="125" width="680" height="78" rx="18" fill="#193d38"/>
        <text x="88" y="169" fill="#80d5ac">CH₃OSO₃⁻</text><text x="275" y="169">+</text><text x="322" y="169" fill="#9dc9ed">2 BH⁺</text><text x="482" y="169">+</text><text x="535" y="169" fill="#f15c4b">2 I⁻</text>
      </g>
      <text id="kf-sol-step" x="400" y="253" text-anchor="middle"></text>
      <text x="400" y="293" text-anchor="middle" class="kf-svg-note">Schematic stoichiometry · no free electrons travel through the reagent</text>
    </svg>
    <p class="text-small">CH₃OSO₂⁻ + H₂O + I₂ + 2 B → CH₃OSO₃⁻ + 2 BH⁺ + 2 I⁻. The spectator BH⁺ counterion from your salt notation is omitted on both sides. Motion is illustrative, not a measured molecular path.</p>
  </details>
`;
  root.querySelector('#kf-reaction-controls').after(host);
  const q=id=>host.querySelector('#kf-'+id);
  function frame(t){
    if(q('solution-pane').open){
      const arrival=Math.min(1,Math.max(0,(t-3)/1.1));
      q('sol-iodine').setAttribute('transform',`translate(${arrival*195} ${arrival*95})`);
      q('sol-iodine').style.opacity=t>=3&&t<4.2?'1':'0';
      q('sol-input').style.opacity=t<4.5?'1':'0';
      q('sol-output').style.opacity=t>=4.5?'1':'0';
      q('sol-step').textContent=t<3?'Water and methyl sulfite await generated iodine.':t<4.5?'Generated I₂ moves into the reagent and is consumed.':'Water is consumed; methyl sulfate and iodide remain.';
    }
  }
  return {frame};
}
