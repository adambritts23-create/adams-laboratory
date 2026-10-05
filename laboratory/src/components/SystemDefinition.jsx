import NumberField from './NumberField.jsx'
import RedoxControls from './RedoxControls.jsx'
import { activityModels } from '../thermodynamics/schema.js'
export default function SystemDefinition({ system, capabilities, phases, solvent, dispatch, calculate, feedback, calculationManaged = false }) {
  const setField = (field, value) => dispatch({ type: 'field', field, value })
  return <section className="card" aria-labelledby="definition-title">
    <h2 id="definition-title">3. System Definition</h2>
    <p className="notice">Solvent: {solvent.displayName} ({solvent.phase}). H/O have no analytical total inputs. The independent component basis is unresolved.</p>
    <form noValidate onSubmit={event => { event.preventDefault(); calculate() }}>
      <fieldset><legend>Analytical constraints</legend>
        <p className="hint">Element totals across selected solutes, in mol/L. These draft constraints are not a reaction basis or a claim of independent mass balances.</p>
        <div className="fields">{system.analyticalComponents.map(component => <NumberField key={component.id} label={`${component.element} analytical total (mol/L)`} min="0" value={component.total} onChange={value => dispatch({ type: 'total', id: component.id, value })} />)}</div>
        {!system.analyticalComponents.length && <p className="hint">Analytical totals require known elemental composition. Imported component links alone do not establish atom counts or analytical balances.</p>}
      </fieldset>
      {calculationManaged && <p className="notice">Define pH, pe/Eh, component totals, temperature and activity assumptions in the Calculation workspace of this same session. Analytical element drafts above remain separate and are not automatically converted into source-component balances.</p>}
      {!calculationManaged && <><fieldset><legend>pH and physical conditions</legend><div className="fields">
        <label>pH mode<select value={system.pHMode} onChange={e => setField('pHMode', e.target.value)}><option value="fixed">Fixed pH</option><option value="range">pH range</option></select></label>
        {system.pHMode === 'fixed' ? <NumberField label="Fixed pH" value={system.pHValue} onChange={v => setField('pHValue', v)} />
          : ['min', 'max'].map(key => <NumberField key={key} label={`pH ${key}`} value={system.pHRange[key]} onChange={v => setField('pHRange', { ...system.pHRange, [key]: v })} />)}
        <NumberField label="Temperature (°C)" value={system.temperature} onChange={v => setField('temperature', v)} />
        <NumberField label="Pressure (bar)" value={system.pressure} onChange={v => setField('pressure', v)} />
      </div></fieldset>
      <fieldset><legend>Ionic strength and activities</legend><div className="fields">
        <label>Ionic strength mode<select value={system.ionicStrengthMode} onChange={e => setField('ionicStrengthMode', e.target.value)}><option value="automatic">Automatic</option><option value="fixed">Fixed</option></select></label>
        {system.ionicStrengthMode === 'fixed' && <NumberField label="Fixed ionic strength (mol/L)" min="0" value={system.fixedIonicStrength} onChange={v => setField('fixedIonicStrength', v)} />}
        <label>Activity model · future<select value={system.activityModel ?? ''} onChange={e => setField('activityModel', e.target.value || null)}><option value="">Unspecified</option>{activityModels.map(model => <option key={model}>{model}</option>)}</select></label>
      </div><p className="hint">Automatic ionic strength will require iteration over solved species concentrations. No ionic strength or activity coefficients are calculated; all listed models are unimplemented.</p></fieldset>
      <RedoxControls system={system} enabled={capabilities.redox} setField={setField} /></>}
      <fieldset><legend>Enabled system phases</legend><div className="inline-options">{phases.map(phase => <label key={phase}><input type="checkbox" checked={system.enabledPhases.includes(phase)} disabled={phase === 'liquid'} onChange={() => dispatch({ type: 'togglePhase', phase })} /> {phase}</label>)}</div>
        <p className="hint">Disabling a phase removes its selected species. Liquid remains enabled for water.</p>
      </fieldset>
      <button className="calculate" type="submit" aria-describedby="solver-note">Check system draft</button>
      <p id="solver-note" className="hint">Checks draft inputs only. The Calculation workspace prepares and solves supported ideal points.</p>
      {feedback && <div className="notice" role="status"><p>{feedback.message}</p>{feedback.errors.length > 0 && <ul>{feedback.errors.map((error, i) => <li key={`${i}:${error}`}>{error}</li>)}</ul>}</div>}
      <details><summary>Inspect ChemicalSystem model</summary><pre>{JSON.stringify(system, null, 2)}</pre></details>
    </form>
  </section>
}
