self.onmessage = async ({ data }) => {
  try {
    let result;
    if (data.kind === 'wet') {
      const { calculate } = await import('./science/bridge.mjs');
      result = await calculate(data.input.setup, data.input.dose ?? 0);
    } else if (data.kind === 'conditions') {
      const { calculateConditions } = await import('./science/calculation_bridge.mjs');
      result = await calculateConditions(data.input);
    } else throw new Error('Unknown calculation type.');
    self.postMessage(result);
  } catch (error) { self.postMessage({ ok: false, error: error.message }); }
};
