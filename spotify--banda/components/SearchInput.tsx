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
        <div className="flex items-center gap-x-2">
            <Input
                placeholder="O quê que queres ouvir?"
                value={value}
                onChange={(e) => setValue(e.target.value)}
            />
            <button
                onClick={() => {
                    const url = qs.stringifyUrl({
                        url: '/search',
                        query: { title: value, yt: '1' }
                    });
                    router.replace(url, { scroll: false });
                }}
                className="bg-red-500 hover:bg-red-600 transition text-white text-sm font-medium px-4 py-2 rounded-full flex-shrink-0"
            >
                Pesquisar
            </button>
        </div>
    );
};

export default SearchInput;