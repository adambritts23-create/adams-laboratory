import {nonRedoxCoordinates} from './nonRedoxPhysical.js'
import {sourceComponentMetadata} from './sourceComponentMetadata.js'
import {freeze} from '../solver/models.js'

export const physicalPreparationVersion='source-physical-preparation-v1'
const preparations=new WeakMap()
/** Retain physical source carriers, including source products such as neutral bases.
 * Their signed basis coordinates are inspection data, never negative reagents.
 */
export async function preparePhysicalContributions(repository,preparation){
 const registry=await sourceComponentMetadata(repository)
 if(!registry.ok)return registry
 const coordinates=nonRedoxCoordinates(repository,preparation,registry)
 if(!coordinates.ok)return coordinates
 const amounts={},mass=preparation.solventCoordinate.modelSolventMassKg
 for(const row of coordinates.physicalPreparation.contributions){
  if(row.moles===0)continue
  const component=repository.getComponentById(row.sourceId)
  const id=component?.id??repository.getComponents().find(c=>c.name===row.name)?.id??row.sourceId
  amounts[id]=(amounts[id]??0)+row.moles/mass
 }
 const value=freeze({...coordinates,version:physicalPreparationVersion,amounts})
 preparations.set(value,repository)
 return value
}
export const isPhysicalPreparation=(value,repository)=>preparations.get(value)===repository
