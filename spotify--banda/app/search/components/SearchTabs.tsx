'use client';

import { useState, useEffect } from 'react';
import SearchContent from './SearchContent';
import YTSearchContent from '@/components/YTSearchContent';
import { Song } from '@/types';

interface SearchTabsProps {
  title: string;
  songs: Song[];
  triggerYT?: boolean;
}

const SearchTabs: React.FC<SearchTabsProps> = ({ title, songs, triggerYT }) => {
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
      <div className="flex gap-x-2 px-6 mb-4">
        <button
          onClick={() => setTab('library')}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
            tab === 'library'
              ? 'bg-white text-black'
              : 'bg-neutral-800 text-neutral-400 hover:text-white'
          }`}
        >
          Biblioteca
        </button>
        <button
          onClick={() => setTab('youtube')}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
            tab === 'youtube'
              ? 'bg-red-500 text-white'
              : 'bg-neutral-800 text-neutral-400 hover:text-white'
          }`}
        >
          YouTube
        </button>
      </div>

      {tab === 'youtube' ? (
        <YTSearchContent query={submittedQuery} />
      ) : (
        <SearchContent songs={songs} />
      )}
    </>
  );
};

export default SearchTabs;