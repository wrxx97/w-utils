export type QueueItem<T, R> = {
  params: T;
  resolve: (result: R) => void;
  reject: (error: unknown) => void;
};

export type Options = {
  timeout?: number;
  interval?: number;
};

export function createAutoMergedRequest<T, R>(
  cb: (mergedParams: T[]) => Promise<R[]>,
  { timeout = 100, interval = 10 }: Options
) {
  let timeoutTimer: number | undefined = void 0;
  let intervalTimer: number | undefined = void 0;
  let queue: QueueItem<T, R>[] = [];

  function clearTimers() {
    timeoutTimer && clearTimeout(timeoutTimer);
    intervalTimer && clearTimeout(intervalTimer);
    timeoutTimer = void 0;
    intervalTimer = void 0;
  }

  async function startTimer() {
    clearTimers();
    const _queue = [...queue];
    queue = [];

    try {
      const results = await cb(_queue.map(({ params }) => params));
      _queue.forEach(({ params, resolve }, i) => {
        resolve(results[i]);
      });
    } catch (error) {
      _queue.forEach(({ reject }) => {
        reject(error);
      });
    }
  }

  function startByinterval() {
    intervalTimer && clearTimeout(intervalTimer);
    intervalTimer = setTimeout(() => {
      startTimer();
    }, interval);
  }

  function startByTimeout() {
    if (!timeoutTimer) {
      timeoutTimer = setTimeout(() => {
        startTimer();
      }, timeout);
    }
  }

  return (params: T) => {
    return new Promise((r, j) => {
      if (!timeoutTimer) {
        startByTimeout();
      }
      startByinterval();
      queue.push({
        params,
        resolve: r,
        reject: j,
      });
    });
  };
}
