'use client'

import useDebounce from "@/hooks/useDebounce";
import { useEffect, useState } from "react";
import qs from 'query-string';
import Input from "@/components/Input";
import { useRouter } from "next/navigation";

const SearchInputPlaylist = () => {

    const router = useRouter();
    const [value, setValue] = useState<string>('');
    const debouncedValue = useDebounce<string>(value, 500)


    useEffect(()=>{

        const query = {
            title: debouncedValue,
        }

        const url = qs.stringifyUrl({
            url: '/playlists',
            query: query
        })

        router.push(url);
    }, [debouncedValue, router]);

  return (
    <Input
     placeholder="adicione músicas a sua playlist"
     value={value}
     onChange={(e) => setValue(e.target.value)}
     />
  )
}

export default SearchInputPlaylist
