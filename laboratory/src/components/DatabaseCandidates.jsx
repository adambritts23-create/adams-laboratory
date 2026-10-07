export default function DatabaseCandidates() {
 return <details className="card"><summary>Inorganic database expansion · sources under review</summary>
  <p>These sources are not installed. Their native files need conversion and validation before they can be selected above. New organic chemistry is outside this expansion.</p>
  <div className="db-table"><table><thead><tr><th>Source</th><th>Coverage / proposed use</th><th>Integration status</th></tr></thead><tbody>
   <tr><td><a href="https://www.psi.ch/it/les/database" target="_blank" rel="noreferrer">PSI/Nagra TDB 2020</a></td><td>Actinides, radionuclides and inorganic equilibria. First candidate for a dedicated actinide profile.</td><td>PHREEQC-format distribution available. Importer, reference-model validation and redistribution terms still to review.</td></tr>
   <tr><td><a href="https://water.usgs.gov/water-resources/software/PHREEQC/documentation/phreeqc3-html/phreeqc3-5.htm" target="_blank" rel="noreferrer">PHREEQC databases</a></td><td>LLNL for broad coverage; WATEQ4F and MINTEQ for aqueous inorganic chemistry. Keep each as a separate source.</td><td>Importer required. SIT and Pitzer datasets also require their corresponding activity models.</td></tr>
   <tr><td><a href="https://tdb.oecd-nea.org/jcms/pl_37223/electronic-database-of-the-tdb-project" target="_blank" rel="noreferrer">OECD NEA TDB</a></td><td>Critically reviewed thermodynamic data relevant to actinides and radioactive-waste chemistry.</td><td>Access and reuse review required. Selected data must retain their associated auxiliary data.</td></tr>
  </tbody></table></div>
  <p>Combining sources means choosing traceable alternatives, not averaging constants. Different reaction bases, reference states, activity models and temperature functions need compatibility checks beyond duplicate detection.</p>
 </details>
}
