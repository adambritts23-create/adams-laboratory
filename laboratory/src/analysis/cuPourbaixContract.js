import {freeze} from '../solver/models.js'
// Validation-only evidence pin. No public capability follows from this object.
export const cuPourbaixCandidate=freeze({
 version:'cu-pourbaix-candidate-v1',publicEnabled:false,
 tieTolerance:1e-8,majorityRule:'strictly greater than 0.5; independent of predominance',
 metadataVersion:'cu-oxidation-state-metadata-v1',metadataSha256:'628819f67a3122f2ad020bacb71a718f56b9009415d02dfc5a665ae1d9a95b55',
 systemId:'fa745a9d951a38cac972a421932facd4634655ad14203aec20dd7feb9ed47a05',
 phaseScopeVersion:'cu-four-solids-v1',total:0.0001,unit:'mol/kg-H2O',temperatureC:25,pressureBar:1,pressureMeaning:'declared',activityModel:'ideal',
 totalRationale:'Dilute 0.1 mmol/kg Cu tests aqueous hydrolysis, Cu(I)/Cu(II) exchange and metal/oxide precipitation while the existing 2e-14 mol/kg balance floor is only 2e-10 of total, below one quarter of the 1e-8 tie tolerance. This is a test inventory, not a universal environmental concentration.',
 pH:{min:0,max:14,step:0.25,points:57},Eh:{min:-1,max:1.2,step:0.05,points:45,reference:'SHE'},
 includedSolids:[102394,104641,110778,98874].map(id=>'spana:2ac52a30213c9288:'+id),
 excluded:[],excludedScope:'Other ligand systems, alloys, nonstoichiometric phases and phases absent from the pinned source snapshot are not modeled. No compatible Cu-H-O phase in this snapshot was suppressed.',
 reservoirs:['fixed H+ activity','fixed electron activity','a(H2O)=1'],
 gasTreatment:'H2/O2 reference overlays only; no analytical gas inventory is solved.',
 phaseSuppression:'Modified thermodynamic scope; default validation claim invalidated. No kinetic claim.',
 otherTotals:'No support beyond the fixed independently compared total.'
})
