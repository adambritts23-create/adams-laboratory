/** Capability failure must leave the existing scientific result available. */
export function initializeSurfaceRenderer(factory, host, callbacks, camera) {
  try {
    return factory(host, callbacks, camera)
  } catch (error) {
    callbacks.onFailure(error instanceof Error ? error.message : String(error))
    return null
  }
}
