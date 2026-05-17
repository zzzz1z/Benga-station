'use client';

import { useState, useEffect } from 'react';
import SearchContent from './SearchContent';
import YTSearchContent from '@/components/YTSearchContent';
import { Song } from '@/types';

interface SearchTabsProps {
  title: string;
  songs: Song[];
  hasMore: boolean;
  triggerYT?: boolean;
}

const SearchTabs: React.FC<SearchTabsProps> = ({ title, songs, hasMore, triggerYT }) => {
  const [tab, setTab] = useState<'library' | 'youtube'>('library');
  const [submittedQuery, setSubmittedQuery] = useState('');

  useEffect(() => {
    if (triggerYT && title.trim().length >= 2) {
      setTab('youtube');
      setSubmittedQuery(title.trim());
    }
  }, [triggerYT, title]);

  return (
    <>
      <div className="flex gap-x-4 px-6 mb-8 mt-4">
        <button
          onClick={() => setTab('library')}
          className={`
            relative px-6 py-2 text-xs font-black uppercase tracking-[0.2em] transition-all
            ${tab === 'library'
              ? 'text-white border-b-2 border-red-600'
              : 'text-neutral-500 hover:text-white border-b-2 border-transparent'
            }
          `}
        >
          [ Local_Files ]
        </button>
        <button
          onClick={() => setTab('youtube')}
          className={`
            relative px-6 py-2 text-xs font-black uppercase tracking-[0.2em] transition-all
            ${tab === 'youtube'
              ? 'text-red-500 border-b-2 border-red-500'
              : 'text-neutral-500 hover:text-white border-b-2 border-transparent'
            }
          `}
        >
          [ Global_YT ]
        </button>
      </div>

      {tab === 'youtube' ? (
        <YTSearchContent query={submittedQuery} />
      ) : (
        <SearchContent songs={songs} hasMore={hasMore} query={title} />
      )}
    </>
  );
};

export default SearchTabs;