import {feOxidationMetadata} from './feOxidationMetadata.js'
import {fePourbaixCandidate} from './fePourbaixContract.js'
import {prepareElementCandidate,elementGridDefinition} from './prepareElementCandidate.js'
export const prepareFeCandidate=repository=>prepareElementCandidate(repository,feOxidationMetadata)
export const feCandidateGridDefinition=(system,total=0.001)=>elementGridDefinition(system,fePourbaixCandidate,total)
