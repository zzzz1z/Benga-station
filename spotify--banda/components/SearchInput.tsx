'use client';

import useDebounce from "@/hooks/useDebounce";
import { useEffect, useState } from "react";
import qs from 'query-string';
import Input from "./Input";
import { useRouter } from "next/navigation";

const SearchInput = () => {
    const router = useRouter();
    const [value, setValue] = useState<string>('');
    const debouncedValue = useDebounce<string>(value, 500);

    useEffect(() => {
        const url = qs.stringifyUrl({
            url: '/search',
            query: { title: debouncedValue }
        });
        router.replace(url, {scroll: false});
    }, [debouncedValue, router]);

    return (
        <Input
            placeholder="O quê que queres ouvir?"
            value={value}
            onChange={(e) => setValue(e.target.value)}
        />
    );
};

export default SearchInput;