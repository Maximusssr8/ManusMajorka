import { useEffect, useState } from 'react';

/**
 * useDebouncedValue — delays propagation of a rapidly-changing value.
 *
 * Standard pattern used for search inputs so `useProducts({ search })` and
 * similar data hooks don't fire a network request on every keystroke.
 *
 * @param value   The input value to debounce.
 * @param delay   Milliseconds to wait after the last change before updating. Default: 300.
 */
export function useDebouncedValue<T>(value: T, delay: number = 300): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const handle = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handle);
  }, [value, delay]);

  return debounced;
}

export default useDebouncedValue;
