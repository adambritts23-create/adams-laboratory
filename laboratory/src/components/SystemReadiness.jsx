import { useEffect, useState } from 'react'
import { prepareSessionStructure } from '../solver/prepareSession.js'

export default function SystemReadiness({ session, repository, onContinue }) {
  const [review, setReview] = useState(null)
  useEffect(() => {
    let current = true
    prepareSessionStructure(session, repository).then(result => { if (current) setReview({ revision: session.revision, result }) })
      .catch(error => { if (current) setReview({ revision: session.revision, result: { ok: false, diagnostics: [{ code: 'preparation-error', message: error.message }] } }) })
    return () => { current = false }
  }, [session, repository])
  const result = review?.revision === session.revision ? review.result : null
  const empty = !session.chemicalSystem.selectedComponents.some(id => repository.getComponentById(id)?.role !== 'solvent')
  return <section className="system-handoff"><button className="calculate" disabled={empty||!result?.ok} onClick={onContinue}>Continue to calculation</button>
    <div role="status">{empty ? 'Select a non-solvent component to configure a calculation.' : !result ? 'Checking selected structure…' : result.ok ? 'Structure supported. Set numeric conditions in Calculation; a successful equilibrium is not yet established.' : result.diagnostics.map(d => <p key={`${d.code}:${d.message}`}>{d.message}</p>)}</div>
  </section>
}
