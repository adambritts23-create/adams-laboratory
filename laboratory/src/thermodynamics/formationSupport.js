import { isSupportedUserSpecies } from './userEquilibria.js'
import {supportedPsiRecord} from './importers/psinagra/index.js'
import {supportedLiteratureRecord} from './uraniumLiterature.js'
import {supportedCombinedRecord} from './spanaPreferred.js'

/** Source eligibility only. Preparation still validates the basis and solver domain. */
export function isSupportedFormationSource(s, repository) {
  if(s.metadata?.sourceFormat==='spana-preferred-psi-v1')return supportedCombinedRecord(s,repository)
  if(s.metadata?.sourceFormat==='uranium-literature-v1')return supportedLiteratureRecord(s,repository)
  if(s.metadata?.sourceFormat==='psinagra-phreeqc-v1')return supportedPsiRecord(s)
  return s.provenance.kind === 'user-defined' ? isSupportedUserSpecies(s, repository)
    : Boolean(s.provenance.kind === 'imported' && s.provenance.dbSha256 && s.logK === s.provenance.originalLogK && s.temperatureReference === 298.15 && s.metadata.sourceFormat === 'spana-java-binary' && s.logKConvention?.startsWith('log10 formation constant for one named product'))
}
