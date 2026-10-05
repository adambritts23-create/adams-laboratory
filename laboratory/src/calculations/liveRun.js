/** Debounce/control only. The supplied executor uses the existing sweep engine. */
export function createLiveRun(execute, delay = 350) {
  let timer = null, controller = null, generation = 0
  function cancel() { generation++; clearTimeout(timer); timer = null; controller?.abort(); controller = null }
  function schedule(snapshot, immediate = false) {
    cancel()
    const own = generation
    timer = setTimeout(() => {
      timer = null; controller = new AbortController()
      void execute(snapshot, { signal: controller.signal, isCurrent: () => own === generation })
    }, immediate ? 0 : delay)
  }
  // User stop preserves an active run's partial result; scientific invalidation uses cancel.
  function stop() { if (timer !== null) cancel(); else controller?.abort() }
  return { schedule, cancel, stop }
}
