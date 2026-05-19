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

      <style>{`
        @keyframes glitch-container {
          0%   { opacity: 1; }
          70%  { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes glitch-flash {
          0%   { opacity: 0; }
          8%   { opacity: 1; }
          40%  { opacity: 0.2; }
          60%  { opacity: 0.6; }
          100% { opacity: 0; }
        }
        @keyframes glitch-scanlines {
          0%   { opacity: 0; transform: translateY(0); }
          15%  { opacity: 1; }
          100% { opacity: 0; transform: translateY(-6px); }
        }
        @keyframes glitch-line1 {
          0%   { opacity: 0; transform: translateX(0); }
          10%  { opacity: 1; transform: translateX(-14px); }
          30%  { opacity: 0.7; transform: translateX(20px); }
          60%  { opacity: 0.5; transform: translateX(-6px); }
          100% { opacity: 0; transform: translateX(0); }
        }
        @keyframes glitch-line2 {
          0%   { opacity: 0; transform: translateX(0); }
          15%  { opacity: 0.8; transform: translateX(28px); }
          50%  { opacity: 0.4; transform: translateX(-10px); }
          100% { opacity: 0; transform: translateX(0); }
        }
        @keyframes glitch-beam {
          0%   { opacity: 0; transform: scaleX(0); transform-origin: left; }
          15%  { opacity: 1; transform: scaleX(1); }
          70%  { opacity: 0.6; }
          100% { opacity: 0; }
        }
      `}</style>
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
    <style>{`
      @keyframes loading-scanlines {
        0%   { transform: translateY(0); }
        100% { transform: translateY(4px); }
      }
      @keyframes loading-beam {
        0%   { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
      }
      @keyframes loading-bottom {
        0%, 100% { opacity: 0.2; }
        50%       { opacity: 0.6; }
      }
      @keyframes loading-tick {
        0%, 85%, 100% { opacity: 0; transform: translateX(0); }
        87%            { opacity: 1; transform: translateX(-12px); }
        90%            { opacity: 0.6; transform: translateX(8px); }
        93%            { opacity: 0; transform: translateX(0); }
      }
    `}</style>
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
    if (glitchActive) return;
    pendingNav.current = nav;

    // Navigate immediately — glitch plays on top, doesn't block routing
    if (nav?.type === 'push' && nav.href) router.push(nav.href);
    else if (nav?.type === 'back') router.back();
    else if (nav?.type === 'forward') router.forward();
    pendingNav.current = null;

    setGlitchActive(true);
  }, [glitchActive, router]);

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

  return (
    <PageTransitionContext.Provider value={{ navigate, goBack, goForward, startLoading, stopLoading }}>
      <GlitchOverlay active={glitchActive} />
      <LoadingOverlay active={isLoading} />
      {children}
    </PageTransitionContext.Provider>
  );
};