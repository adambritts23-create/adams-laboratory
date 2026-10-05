import { isSupportedUserSpecies } from './userEquilibria.js'

/** Source eligibility only. Preparation still validates the basis and solver domain. */
export function isSupportedFormationSource(s, repository) {
  return s.provenance.kind === 'user-defined' ? isSupportedUserSpecies(s, repository)
    : Boolean(s.provenance.kind === 'imported' && s.provenance.dbSha256 && s.logK === s.provenance.originalLogK && s.temperatureReference === 298.15 && s.metadata.sourceFormat === 'spana-java-binary' && s.logKConvention?.startsWith('log10 formation constant for one named product'))
}
