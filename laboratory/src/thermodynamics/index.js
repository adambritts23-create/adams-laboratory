import { demoSpecies, demoSource } from '../data/species.js'
import { elements } from '../data/elements.js'
import { createRepository } from './repository.js'

// Composition root: the only place that selects the application's data provider.
export const thermodynamicRepository = createRepository({ species: demoSpecies, elements, sources: [demoSource] })
