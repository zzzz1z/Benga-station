'use client';

import { useEffect } from 'react';
import { App } from '@capacitor/app';

const STATE_KEY = 'benga_app_state';
const MAX_AGE_MS = 20 * 60 * 1000; // 20 min

function saveAppState() {
  try {
    const state = {
      savedAt: Date.now(),
      scrollY: window.scrollY,
      // add whatever app state matters: current track, queue, etc.
    };
    localStorage.setItem(STATE_KEY, JSON.stringify(state));
  } catch {}
}

function restoreAppState() {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (!raw) return;
    const state = JSON.parse(raw);
    if (Date.now() - state.savedAt > MAX_AGE_MS) return;
    // restore what you saved — e.g. scroll position, current track
    window.scrollTo(0, state.scrollY ?? 0);
  } catch {}
}

const KeepAlive = () => {
  useEffect(() => {
    // Restore state on mount (covers backgrounded-then-killed case)
    restoreAppState();

    // Capacitor lifecycle events
    const stateSub = App.addListener('appStateChange', ({ isActive }) => {
      if (!isActive) {
        // Going to background — save everything
        saveAppState();
      } else {
        // Returning from background — restore + refetch
        restoreAppState();
fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/keepalive`).catch(() => {});
      }
    });

    // Fallback: also ping on visibility change (covers WebView-level suspension)
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') saveAppState();
      if (document.visibilityState === 'visible') {
        restoreAppState();
fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/keepalive`).catch(() => {});
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      stateSub.then(s => s.remove());
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return null;
};

export default KeepAlive;