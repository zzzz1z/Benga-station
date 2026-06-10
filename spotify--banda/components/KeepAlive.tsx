'use client';

import { useEffect } from 'react';
import { App } from '@capacitor/app';
import { markDataStale } from '@/components/FloatingRefreshButton';

const STATE_KEY = 'benga_app_state';
const MAX_AGE_MS = 20 * 60 * 1000;
const IDLE_RELOAD_MS = 30 * 60 * 1000;

function saveAppState() {
  try {
    localStorage.setItem(STATE_KEY, JSON.stringify({
      savedAt: Date.now(),
      scrollY: window.scrollY,
    }));
    localStorage.setItem('benga_last_active', String(Date.now()));
  } catch {}
}

function restoreAppState() {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (!raw) return;
    const state = JSON.parse(raw);
    if (Date.now() - state.savedAt > MAX_AGE_MS) return;
    window.scrollTo(0, state.scrollY ?? 0);
  } catch {}
}

async function onResume() {
  const lastActive = parseInt(localStorage.getItem('benga_last_active') || '0');
  if (Date.now() - lastActive > IDLE_RELOAD_MS) {
    window.location.reload();
    return;
  }
  restoreAppState();
  fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/keepalive`).catch(() => {});
  markDataStale();
}

const KeepAlive = () => {
  useEffect(() => {
    restoreAppState();

    const stateSub = App.addListener('appStateChange', ({ isActive }) => {
      if (!isActive) saveAppState();
      else onResume();
    });

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') saveAppState();
      if (document.visibilityState === 'visible') onResume();
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