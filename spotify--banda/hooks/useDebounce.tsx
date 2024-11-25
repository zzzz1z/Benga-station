import{ useEffect, useState } from "react";



function useDebounce<T>(value: T, delay?: number) : T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value)

    useEffect (() => {

        const processedValue = typeof value === "string" ? (value.toLowerCase() as T) : value;

        const timer = setTimeout(() => {

            setDebouncedValue (processedValue)

        }, delay ?? 100);

        return () => {

            clearTimeout(timer);

        }

    }, [value, delay]);

    return debouncedValue;

}

export default useDebounce;