import { createSpecies } from '../thermodynamics/schema.js'

export const demoSource = { id: 'local-demo-v1', name: 'DEMO / NON-THERMODYNAMIC', citation: null, description: 'Manually authored identity fixtures; no equilibrium data.' }
const fixtures = [
  ['water', 'Water', 'H₂O', 'liquid', { H: 2, O: 1 }, 0, null],
  ['hydrogen-ion', 'Hydrogen ion', 'H⁺', 'aqueous', { H: 1 }, 1, null],
  ['hydroxide', 'Hydroxide', 'OH⁻', 'aqueous', { O: 1, H: 1 }, -1, null],
  ['carbonic-acid', 'Carbonic acid', 'H₂CO₃', 'aqueous', { H: 2, C: 1, O: 3 }, 0, null],
  ['bicarbonate', 'Bicarbonate', 'HCO₃⁻', 'aqueous', { H: 1, C: 1, O: 3 }, -1, null],
  ['carbonate', 'Carbonate', 'CO₃²⁻', 'aqueous', { C: 1, O: 3 }, -2, null],
  ['uranyl', 'Uranyl', 'UO₂²⁺', 'aqueous', { U: 1, O: 2 }, 2, { U: [{ value: 6, count: 1 }] }],
  ['uranyl-carbonate', 'Uranyl carbonate', 'UO₂CO₃', 'aqueous', { U: 1, C: 1, O: 5 }, 0, { U: [{ value: 6, count: 1 }] }],
  ['uranyl-dicarbonate', 'Uranyl dicarbonate', 'UO₂(CO₃)₂²⁻', 'aqueous', { U: 1, C: 2, O: 8 }, -2, { U: [{ value: 6, count: 1 }] }],
  ['uranyl-tricarbonate', 'Uranyl tricarbonate', 'UO₂(CO₃)₃⁴⁻', 'aqueous', { U: 1, C: 3, O: 11 }, -4, { U: [{ value: 6, count: 1 }] }],
  ['uranium-trioxide', 'Uranium trioxide', 'UO₃(s)', 'solid', { U: 1, O: 3 }, 0, { U: [{ value: 6, count: 1 }] }],
  ['carbon-dioxide-gas', 'Carbon dioxide', 'CO₂(g)', 'gas', { C: 1, O: 2 }, 0, null],
  ['iron-ii', 'Iron(II) ion', 'Fe²⁺', 'aqueous', { Fe: 1 }, 2, { Fe: [{ value: 2, count: 1 }] }],
  ['iron-iii', 'Iron(III) ion', 'Fe³⁺', 'aqueous', { Fe: 1 }, 3, { Fe: [{ value: 3, count: 1 }] }],
  ['chloride', 'Chloride', 'Cl⁻', 'aqueous', { Cl: 1 }, -1, null],
  ['fluoride', 'Fluoride', 'F⁻', 'aqueous', { F: 1 }, -1, null],
  ['calcium', 'Calcium ion', 'Ca²⁺', 'aqueous', { Ca: 1 }, 2, null],
  ['copper-ii', 'Copper(II) ion', 'Cu²⁺', 'aqueous', { Cu: 1 }, 2, { Cu: [{ value: 2, count: 1 }] }],
  ['ammonia', 'Ammonia', 'NH₃', 'aqueous', { N: 1, H: 3 }, 0, null],
  ['chromium-iii', 'Chromium(III) ion', 'Cr³⁺', 'aqueous', { Cr: 1 }, 3, { Cr: [{ value: 3, count: 1 }] }],
]
export const demoSpecies = fixtures.map(([id, name, formula, phase, elementalComposition, charge, oxidationStates]) => createSpecies({
  id, name, displayName: formula, formula, phase, elementalComposition, charge, oxidationStates,
  role: id === 'water' ? 'solvent' : 'solute', source: demoSource.name, sourceDatabase: demoSource.id, sourceRecordId: id,
  notes: ['Identity fixture only. Missing oxidation-state entries mean unknown; no values are inferred.'],
  qualityFlags: ['demo', 'non-thermodynamic'],
  provenance: { kind: 'demo', sourceDatabase: demoSource.id, sourceRecordId: id,
    original: { speciesName: name, reaction: null, logK: null, citation: null },
    importDate: null, importerVersion: null, comments: ['Authored locally; not imported from a thermodynamic source.'], qualityFlags: ['non-thermodynamic'] },
}))
