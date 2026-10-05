import {displayNumber} from '../plots/formatNumber.js'
import { useState } from 'react'
import { componentMolarMass, convertMassInput } from '../calculations/massConcentration.js'

/** Pending conversion is explicit; only Apply changes the scientific total. */
export default function MassInput({ component, condition, onChange }) {
  const original = condition.massInput?.original
  const [atoms, setAtoms] = useState(JSON.stringify(original?.composition?.atoms ?? component.elementalComposition ?? {}))
  const [source, setSource] = useState(original?.composition?.source ?? '')
  const [value, setValue] = useState(original?.value ?? ''), [water, setWater] = useState(original?.basis?.kgWaterPerL ?? '')
  const [basisSource, setBasisSource] = useState(original?.basis?.source ?? ''), [constant, setConstant] = useState(original?.basis?.constantAcrossConditions ?? false)
  let composition
  try { composition = { atoms: JSON.parse(atoms), source } } catch { composition = null }
  const mass = componentMolarMass(composition)
  const conversion = convertMassInput({ componentId: component.id, componentName: component.name, value: value === '' ? null : Number(value), unit: 'g/L', composition,
    basis: { kind: 'solvent-mass-per-solution-volume', kgWaterPerL: water === '' ? null : Number(water), source: basisSource, constantAcrossConditions: constant } })
  return <details className="mass-input"><summary>Mass concentration · g/L</summary>
    <p>User-declared composition (unverified). Define the composition of this component, not a dosing salt. No composition is inferred from its name. Source associations are not atom counts.</p>
    <label>Component atom counts (JSON)<input value={atoms} onChange={e => setAtoms(e.target.value)} placeholder={'{"C":1,"O":3}'}/></label>
    <label>Composition source<input value={source} onChange={e => setSource(e.target.value)}/></label>
    <p>{mass.ok ? `Molar mass: ${displayNumber(mass.value)} g/mol · conventional CIAAW weights` : mass.message}</p>
    <label>Mass concentration (g/L)<input type="number" step="any" min="0" value={value} onChange={e => setValue(e.target.value)}/></label>
    <label>kg H₂O per L solution<input type="number" step="any" min="0" value={water} onChange={e => setWater(e.target.value)}/></label>
    <label>Solvent-basis source<input value={basisSource} onChange={e => setBasisSource(e.target.value)}/></label>
    <label><input type="checkbox" checked={constant} onChange={e => setConstant(e.target.checked)}/>This supplied basis is valid and constant across all current calculation conditions.</label>
    <p>{conversion.molarity && `${conversion.molarity.value} mol/L solution. `}{conversion.ok ? `${conversion.value} mol/kg H₂O · defined conversion` : conversion.message}</p>
    <button disabled={!conversion.ok} onClick={() => onChange({ ...condition, value: conversion.value, massInput: conversion })}>Apply g/L total</button>
    {condition.massInput && <p>Applied {condition.massInput.original.value} g/L. Original entry, composition, molar mass and conversion basis retained in calculation/export.</p>}
    <small>Supported atom weights: H, C, N, O, Na, Cl, Ca, Fe, Cu. Other elements, isotope-specific masses, salt-to-component dosing and g/L axes are unavailable. No dilute approximation.</small>
  </details>
}
