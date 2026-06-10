'use client';

import useDebounce from "@/hooks/useDebounce";
import { useEffect, useState } from "react";
import qs from 'query-string';
import Input from "./Input";
import { useRouter } from "next/navigation";
import { HiSearch } from "react-icons/hi";

const SearchInput = () => {
    const router = useRouter();
    const [value, setValue] = useState<string>('');
    const debouncedValue = useDebounce<string>(value, 500);

    useEffect(() => {
        const url = qs.stringifyUrl({
            url: '/search',
            query: { title: debouncedValue }
        });
        router.replace(url, { scroll: false });
    }, [debouncedValue, router]);

    return (
        <div className="flex items-center gap-x-2 w-full max-w-2xl relative">
            <div className="relative w-full">
                <Input
                    className="bg-neutral-900 border-red-900/40 focus:border-red-600 rounded-none font-mono placeholder:text-neutral-600 text-red-500 uppercase tracking-tight"
                    placeholder="DIGITE_A_PROCURA..."
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-red-900/30 pointer-events-none">
                    <HiSearch size={20} />
                </div>
            </div>
            <button
                onClick={() => {
                    const url = qs.stringifyUrl({
                        url: '/search',
                        query: { title: value, yt: '1' }
                    });
                    router.replace(url, { scroll: false });
                }}
                className="bg-transparent border border-red-600 text-red-600  text-xs font-black uppercase px-6 py-[14px] rounded-none flex-shrink-0 tracking-[0.2em] shadow-[0_0_10px_rgba(239,68,68,0.1)]"
            >
                EXECUTE
            </button>
        </div>
    );
};

export default SearchInput;