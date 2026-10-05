import { oxidationLabel } from '../chemistry/format.js'
export default function SpeciesDetails({ species, expanded=false }) {
  return <details className="species-details" open={expanded}>
    <summary>Inspect {species.displayName}</summary>
    <dl>
      <dt>Name / ID</dt><dd>{species.name} / {species.id}</dd>
      <dt>Composition</dt><dd>{species.elementalComposition === null ? 'Unknown — the source component links do not specify atom counts.' : Object.entries(species.elementalComposition).map(([s, n]) => `${s}: ${n}`).join(', ')}</dd>
      {species.elementalComposition === null && <><dt>Source element associations</dt><dd>{species.discoveryElements?.join(', ') || 'Unresolved'} (discovery only)</dd></>}
      <dt>Oxidation states</dt><dd>{oxidationLabel(species)}. Unlisted elements: unknown.</dd>
      <dt>Role / phase / charge</dt><dd>{species.role} / {species.phase} / {species.charge ?? 'unknown'}</dd>
      {species.metadata.effectiveSourceReaction?.components&&<><dt>Source reaction terms</dt><dd>{species.metadata.effectiveSourceReaction.components.map((c,i)=><span key={i}>{i?' + ':''}{c.coefficient} × {c.name}</span>)} → {species.name} (signed source coefficients)</dd></>}
      <dt>log K</dt><dd>{species.logK ?? 'Unavailable (null)'}</dd>
      {species.logK !== null && <><dt>Convention / reference temperature</dt><dd>{species.logKConvention} · {species.temperatureReference ?? 'unknown'} K. Pressure reference: {species.pressureReference ?? 'unknown'}.</dd></>}
      <dt>Source</dt><dd>{species.source ?? 'Unknown'} / {species.sourceRecordId ?? 'Unknown'}</dd>
      <dt>Citation</dt><dd>{species.citation ?? (species.provenance.kind === 'demo' ? 'None — demo identity fixture' : 'Unavailable')}</dd>
      <dt>Quality flags</dt><dd>{species.qualityFlags.join(', ') || 'None'}</dd>
      {species.metadata.sourceReferenceResolutions && <><dt>Reference codes and resolved citations</dt><dd>{species.metadata.sourceReferenceResolutions.map((r, i) => <p key={i}>{r.code}: {r.citation ?? `${r.status} — no citation inferred`}</p>)}</dd></>}
      <dt>Notes</dt><dd>{species.notes.map((note, i) => <p key={i}>{note}</p>)}</dd>
    </dl>
    <p className="hint">Full normalized record, including untouched source provenance:</p>
    <pre>{JSON.stringify(species, null, 2)}</pre>
  </details>
}
