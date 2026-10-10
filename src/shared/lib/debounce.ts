export function debounce<Args extends unknown[]>(
  fn: (...args: Args) => void,
  waitMs: number,
): ((...args: Args) => void) & { flush: () => void; cancel: () => void } {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let pending: Args | null = null;

  const invoke = (): void => {
    if (pending) {
      const args = pending;
      pending = null;
      timer = null;
      fn(...args);
    }
  };

  const debounced = (...args: Args): void => {
    pending = args;
    if (timer) clearTimeout(timer);
    timer = setTimeout(invoke, waitMs);
  };

  debounced.flush = (): void => {
    if (timer) {
      clearTimeout(timer);
      invoke();
    }
  };

  debounced.cancel = (): void => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
      pending = null;
    }
  };

  return debounced;
}
