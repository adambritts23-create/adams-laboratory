// Fe compatibility surface; identity resolution and classification are element-independent.
import {feOxidationMetadata} from './feOxidationMetadata.js'
import {prepareRegisteredOxidation,isRegisteredOxidationModel,classifyRegisteredPoint} from './registeredElementOxidation.js'
export const prepareRegisteredFeOxidation=system=>prepareRegisteredOxidation(system,feOxidationMetadata)
export const isRegisteredFeModel=model=>isRegisteredOxidationModel(model)&&model.inner.reference.componentId===feOxidationMetadata.conservedComponent
export const classifyRegisteredFePoint=classifyRegisteredPoint
