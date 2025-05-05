import { useEffect, useState } from "react";

function useDebounce<T>(value: T, delay: number = 100): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const [isMounted, setIsMounted] = useState(false); // Track if the component is mounted

  useEffect(() => {
    // Set isMounted to true after the component has mounted
    setIsMounted(true);
  }, []);

  useEffect(() => {
    // If the component hasn't mounted yet, don't debounce
    if (!isMounted) return;

    const processedValue = typeof value === "string" ? (value.toLowerCase() as T) : value;

    const timer = setTimeout(() => {
      setDebouncedValue(processedValue);
    }, delay);

    return () => {
      clearTimeout(timer); // Clear timeout on cleanup
    };
  }, [value, delay, isMounted]);

  return debouncedValue;
}

export default useDebounce;
