'use client';

import { createContext, useContext, useRef, useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface PageTransitionContextValue {
  navigate: (href: string) => void;
  goBack: () => void;
  goForward: () => void;
  startLoading: () => void;
  stopLoading: () => void;
}

const PageTransitionContext = createContext<PageTransitionContextValue>({
  navigate: () => {},
  goBack: () => {},
  goForward: () => {},
  startLoading: () => {},
  stopLoading: () => {},
});

export const usePageTransition = () => useContext(PageTransitionContext);

// ─── Glitch overlay (nav flash) ───────────────────────────────────────────────
const GlitchOverlay = ({ active }: { active: boolean }) => {
  if (!active) return null;
  return (
    <div
      className="fixed inset-0 z-[9999] pointer-events-none overflow-hidden"
      style={{ animation: 'glitch-container 0.22s ease-out forwards' }}
    >
      <div className="absolute inset-0"
        style={{ background: 'rgba(239,68,68,0.12)', animation: 'glitch-flash 0.22s ease-out forwards' }} />

      <div className="absolute inset-0"
        style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(239,68,68,0.07) 2px, rgba(239,68,68,0.07) 4px)',
          animation: 'glitch-scanlines 0.22s ease-out forwards',
        }} />

      <div className="absolute left-0 right-0"
        style={{ height: '2px', top: '23%', background: 'rgba(239,68,68,0.9)', animation: 'glitch-line1 0.22s ease-out forwards', boxShadow: '0 0 6px rgba(239,68,68,0.8)' }} />

      <div className="absolute left-0 right-0"
        style={{ height: '1px', top: '67%', background: 'rgba(239,68,68,0.6)', animation: 'glitch-line2 0.22s ease-out forwards', boxShadow: '0 0 4px rgba(239,68,68,0.5)' }} />

      <div className="absolute top-0 left-0 right-0"
        style={{ height: '2px', background: 'linear-gradient(90deg, transparent, rgba(239,68,68,1), transparent)', animation: 'glitch-beam 0.22s ease-out forwards', boxShadow: '0 0 10px rgba(239,68,68,1)' }} />


    </div>
  );
};

// ─── Loading overlay (subtle scanline pulse) ──────────────────────────────────
const LoadingOverlay = ({ active }: { active: boolean }) => (
  <div
    className="fixed inset-0 z-[9998] pointer-events-none overflow-hidden"
    style={{
      opacity: active ? 1 : 0,
      transition: active ? 'opacity 0.1s ease-in' : 'opacity 0.35s ease-out',
    }}
  >
    <div
      className="absolute inset-0"
      style={{
        background: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(239,68,68,0.022) 3px, rgba(239,68,68,0.022) 4px)',
        animation: active ? 'loading-scanlines 3s linear infinite' : 'none',
      }}
    />
    <div className="absolute top-0 left-0 right-0" style={{ height: '2px', overflow: 'hidden' }}>
      <div
        style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '100%',
          background: 'linear-gradient(90deg, transparent 0%, rgba(239,68,68,0.8) 40%, rgba(239,68,68,1) 50%, rgba(239,68,68,0.8) 60%, transparent 100%)',
          animation: active ? 'loading-beam 1.4s ease-in-out infinite' : 'none',
          boxShadow: '0 0 8px rgba(239,68,68,0.9)',
        }}
      />
    </div>
    <div
      className="absolute bottom-0 left-0 right-0"
      style={{
        height: '1px',
        background: 'linear-gradient(90deg, transparent, rgba(239,68,68,0.3), transparent)',
        animation: active ? 'loading-bottom 2.4s ease-in-out infinite' : 'none',
      }}
    />
    {active && (
      <div
        className="absolute left-0 right-0"
        style={{
          height: '1px', top: '35%',
          background: 'rgba(239,68,68,0.5)',
          animation: 'loading-tick 2.2s ease-in-out infinite',
          boxShadow: '0 0 4px rgba(239,68,68,0.4)',
        }}
      />
    )}

  </div>
);

// ─── Provider ─────────────────────────────────────────────────────────────────
export const PageTransitionProvider = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const [glitchActive, setGlitchActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const pendingNav = useRef<{ type: 'push' | 'back' | 'forward'; href?: string } | null>(null);
  const loadingDepth = useRef(0);

const triggerGlitch = useCallback((nav: typeof pendingNav.current) => {
  if (nav?.type === 'push' && nav.href) router.push(nav.href);
  else if (nav?.type === 'back') router.back();
  else if (nav?.type === 'forward') router.forward();
  setGlitchActive(true);
}, [router]);
  useEffect(() => {
    if (!glitchActive) return;
    const clearTimer = setTimeout(() => setGlitchActive(false), 240);
    return () => clearTimeout(clearTimer);
  }, [glitchActive]);

  const navigate  = useCallback((href: string) => triggerGlitch({ type: 'push', href }), [triggerGlitch]);
  const goBack    = useCallback(() => triggerGlitch({ type: 'back' }),    [triggerGlitch]);
  const goForward = useCallback(() => triggerGlitch({ type: 'forward' }), [triggerGlitch]);

  const startLoading = useCallback(() => {
    loadingDepth.current += 1;
    setIsLoading(true);
  }, []);

  const stopLoading = useCallback(() => {
    loadingDepth.current = Math.max(0, loadingDepth.current - 1);
    if (loadingDepth.current === 0) setIsLoading(false);
  }, []);

useEffect(() => {
    ['/search', '/playlists', '/liked', '/account'].forEach(href => router.prefetch(href));
}, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handleError = (e: ErrorEvent) => {
      if (e.message?.includes('Loading chunk') || e.message?.includes('Failed to fetch dynamically imported module')) {
        window.location.reload();
      }
    };
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  return (
    <PageTransitionContext.Provider value={{ navigate, goBack, goForward, startLoading, stopLoading }}>
      <GlitchOverlay active={glitchActive} />
      <LoadingOverlay active={isLoading} />
      {children}
    </PageTransitionContext.Provider>
  );
};