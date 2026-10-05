/* Browser transport for the game's unchanged equilibrium engine. */
(() => {
  let next = 0;
  const jobs = new Map();
  window.AdamChemistry = {
    submit(kind, input) {
      const id = ++next;
      const job = { worker: null, result: '' };
      jobs.set(id, job);
      const finish = result => {
        job.result = JSON.stringify(result);
        job.worker?.terminate();
        clearTimeout(job.timer);
      };
      try {
        job.worker = new Worker(new URL('chemistry-worker.mjs', document.baseURI), { type: 'module' });
        job.worker.onmessage = event => finish(event.data);
        job.worker.onerror = event => finish({ ok: false, error: event.message || 'Chemistry worker failed to load.' });
        job.timer = setTimeout(() => finish({ ok: false, error: 'Calculation timed out. No substitute result.' }), 115000);
        job.worker.postMessage({ kind, input: JSON.parse(input) });
      } catch (error) { finish({ ok: false, error: error.message }); }
      return id;
    },
    poll(id) {
      const job = jobs.get(id);
      if (!job) return JSON.stringify({ ok: false, error: 'Calculation job no longer exists.' });
      if (!job.result) return '';
      jobs.delete(id);
      return job.result;
    },
    cancel(id) {
      const job = jobs.get(id);
      job?.worker?.terminate();
      clearTimeout(job?.timer);
      jobs.delete(id);
    }
  };
})();
