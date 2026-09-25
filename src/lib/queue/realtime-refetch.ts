type RefetchFn = (requestId: number) => void | Promise<void>;

/**
 * Debounce + sequência para refetch de Realtime.
 * Ignora respostas atrasadas e evita rajadas de RPC no mesmo evento.
 */
export function createRealtimeRefetch(delayMs = 200) {
  let timer: number | undefined;
  let seq = 0;
  let disposed = false;

  function nextId() {
    seq += 1;
    return seq;
  }

  function isLatest(requestId: number) {
    return !disposed && requestId === seq;
  }

  function run(fn: RefetchFn) {
    const requestId = nextId();
    void Promise.resolve(fn(requestId));
  }

  function schedule(fn: RefetchFn) {
    if (disposed) return;
    window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      run(fn);
    }, delayMs);
  }

  function dispose() {
    disposed = true;
    window.clearTimeout(timer);
  }

  return { schedule, run, isLatest, dispose };
}
