'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import SearchContent from './SearchContent';
import YTSearchContent from '@/components/YTSearchContent';
import { Song } from '@/types';
import { useSwipeTabs } from '@/hooks/useSwipeTabs';

interface SearchTabsProps {
  title: string;
  songs: Song[];
  hasMore: boolean;
  triggerYT?: boolean;
}

const TABS = ['library', 'youtube'] as const;
type Tab = typeof TABS[number];

const SearchTabs: React.FC<SearchTabsProps> = ({ title, songs, hasMore, triggerYT }) => {
  const [tab, setTab] = useState<Tab>('library');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (triggerYT && title.trim().length >= 2) {
      setTab('youtube');
      setSubmittedQuery(title.trim());
    }
  }, [triggerYT, title]);

  const onSwipeLeft = useCallback(() => {
    setTab('youtube');
    if (title.trim().length >= 2) setSubmittedQuery(title.trim());
  }, [title]);

  const onSwipeRight = useCallback(() => {
    setTab('library');
  }, []);

  useSwipeTabs(containerRef, { onSwipeLeft, onSwipeRight });

  return (
    <div ref={containerRef} className="flex flex-col h-full">
      {/* Tab bar */}
      <div className="flex gap-x-4 px-6 mb-8 mt-4 flex-shrink-0">
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
          onClick={() => {
            setTab('youtube');
            if (title.trim().length >= 2) setSubmittedQuery(title.trim());
          }}
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

        {/* Swipe hint — mobile only, fades after first render */}
        <span className="ml-auto text-[9px] text-neutral-700 font-mono uppercase tracking-widest self-center md:hidden">
          ← desliza →
        </span>
      </div>

      {/* Content */}
      <div className="flex-1">
        {tab === 'youtube' ? (
          <YTSearchContent query={submittedQuery} />
        ) : (
          <SearchContent songs={songs} hasMore={hasMore} query={title} />
        )}
      </div>
    </div>
  );
};

export default SearchTabs;