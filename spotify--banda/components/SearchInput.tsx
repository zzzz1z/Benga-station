'use client'

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
    const [results, setResults] = useState<string[]>([]); // State to store search results
    const [data, setData] = useState<{ title: string }[]>([]); // State for Supabase data
    const debouncedValue = useDebounce<string>(value, 500);
    const supabase = useSupabaseClient()

    // Fetch data from Supabase table on component mount
    useEffect(() => {
        const fetchData = async () => {
            const { data, error } = await supabase
                .from('Songs') // Replace 'songs' with your table name
                .select('title'); // Adjust the column name if needed

            if (error) {
                console.error('Error fetching data:', error);
            } else {
                setData(data || []);
            }
        };

        fetchData();
    }, []);

    useEffect(() => {
        if (debouncedValue && data.length > 0) {
            // Initialize Fuse.js with the fetched data
            const fuse = new Fuse(data, {
                keys: ['title'],
                threshold: 0.4,
                includeScore: true,
            });

            // Perform fuzzy search
            const searchResults = fuse.search(debouncedValue).map(result => result.item.title);
            setResults(searchResults);

            // Generate the query string for the first result (optional)
            const query = searchResults.length > 0 ? { title: searchResults[0] } : { title: debouncedValue };

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
