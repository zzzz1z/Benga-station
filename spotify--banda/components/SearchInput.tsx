'use client';

import useDebounce from "@/hooks/useDebounce";
import { useEffect, useState } from "react";
import qs from 'query-string';
import Input from "./Input";
import { useRouter } from "next/navigation";
import Fuse from "fuse.js";
import { useSupabaseClient } from "@supabase/auth-helpers-react";

const SearchInput = () => {
    const router = useRouter();
    const [value, setValue] = useState<string>('');
    const [data, setData] = useState<{ title: string; author: string }[]>([]); // Include author in the data
    const debouncedValue = useDebounce<string>(value, 500);
    const supabase = useSupabaseClient();

    // Fetch data from Supabase table on component mount
    useEffect(() => {
        const fetchData = async () => {
            const { data, error } = await supabase
                .from('Songs') // Replace 'Songs' with your table name
                .select('title, author'); // Fetch title and author

            if (error) {
                console.error('Error fetching data:', error);
            } else {
                setData(data ?? []);
            }
        };

        fetchData();
    }, [supabase]);

    useEffect(() => {
        if (debouncedValue && data.length > 0) {
            // Initialize Fuse.js with title and author keys
            const fuse = new Fuse(data, {
                keys: ['title', 'author'], // Search both title and author
                threshold: 0.4,
                includeScore: true,
            });

            // Perform fuzzy search
            const searchResults = fuse.search(debouncedValue).map(result => result.item);

            // Generate the query string based on the first match (optional)
            const query =
                searchResults.length > 0
                    ? { title: searchResults[0].title, author: searchResults[0].author }
                    : { title: debouncedValue };

            const url = qs.stringifyUrl({
                url: '/search',
                query: query
            });

            router.push(url);
        }
    }, [debouncedValue, data, router]);

    return (
        <div>
            <Input
                placeholder="O quê que queres ouvir?"
                value={value}
                onChange={(e) => setValue(e.target.value)}
            />
        </div>
    );
};

export default SearchInput;
