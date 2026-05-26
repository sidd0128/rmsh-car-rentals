import { debounce } from 'lodash';
import { useEffect, useMemo, useState } from 'react';

/**
 * Returns a lodash-debounced copy of `value` (default 300ms wait).
 */
export const useDebouncedValue = <T,>(value: T, wait = 300): T => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  const debouncedSetter = useMemo(
    () => debounce((next: T) => setDebouncedValue(next), wait),
    [wait],
  );

  useEffect(() => {
    debouncedSetter(value);
    return () => {
      debouncedSetter.cancel();
    };
  }, [value, debouncedSetter]);

  return debouncedValue;
};
