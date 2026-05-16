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
      style={{ animation: 'glitch-container 0.35s ease-out forwards' }}
    >
      <div className="absolute inset-0"
        style={{ background: 'rgba(239,68,68,0.15)', animation: 'glitch-flash 0.35s ease-out forwards' }} />

      <div className="absolute inset-0"
        style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(239,68,68,0.08) 2px, rgba(239,68,68,0.08) 4px)',
          animation: 'glitch-scanlines 0.35s ease-out forwards',
        }} />

      <div className="absolute left-0 right-0"
        style={{ height: '3px', top: '23%', background: 'rgba(239,68,68,0.9)', animation: 'glitch-line1 0.35s ease-out forwards', boxShadow: '0 0 8px rgba(239,68,68,0.8)' }} />

      <div className="absolute left-0 right-0"
        style={{ height: '2px', top: '67%', background: 'rgba(239,68,68,0.7)', animation: 'glitch-line2 0.35s ease-out forwards', boxShadow: '0 0 6px rgba(239,68,68,0.6)' }} />

      <div className="absolute left-0 right-0"
        style={{ height: '40px', top: '40%', background: 'rgba(239,68,68,0.06)', animation: 'glitch-block 0.35s ease-out forwards', mixBlendMode: 'screen' }} />

      <div className="absolute top-0 left-0 right-0"
        style={{ height: '2px', background: 'linear-gradient(90deg, transparent, rgba(239,68,68,1), transparent)', animation: 'glitch-beam 0.35s ease-out forwards', boxShadow: '0 0 12px rgba(239,68,68,1)' }} />

      <style>{`
        @keyframes glitch-container {
          0%   { opacity: 1; }
          80%  { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes glitch-flash {
          0%   { opacity: 0; }
          10%  { opacity: 1; }
          30%  { opacity: 0.3; }
          50%  { opacity: 0.8; }
          70%  { opacity: 0.1; }
          100% { opacity: 0; }
        }
        @keyframes glitch-scanlines {
          0%   { opacity: 0; transform: translateY(0); }
          20%  { opacity: 1; }
          60%  { opacity: 0.6; transform: translateY(-4px); }
          100% { opacity: 0; transform: translateY(-8px); }
        }
        @keyframes glitch-line1 {
          0%   { opacity: 0; transform: translateX(0) scaleX(1); }
          15%  { opacity: 1; transform: translateX(-20px) scaleX(1.1); }
          35%  { opacity: 0.8; transform: translateX(30px) scaleX(0.9); }
          55%  { opacity: 1; transform: translateX(-10px) scaleX(1); }
          100% { opacity: 0; transform: translateX(0); }
        }
        @keyframes glitch-line2 {
          0%   { opacity: 0; transform: translateX(0); }
          20%  { opacity: 0.9; transform: translateX(40px); }
          40%  { opacity: 0.5; transform: translateX(-15px); }
          60%  { opacity: 1; transform: translateX(10px); }
          100% { opacity: 0; transform: translateX(0); }
        }
        @keyframes glitch-block {
          0%   { opacity: 0; transform: translateX(0) skewX(0deg); }
          20%  { opacity: 1; transform: translateX(-8px) skewX(-2deg); }
          40%  { opacity: 0.6; transform: translateX(12px) skewX(1deg); }
          60%  { opacity: 0.8; transform: translateX(-4px) skewX(0deg); }
          100% { opacity: 0; transform: translateX(0); }
        }
        @keyframes glitch-beam {
          0%   { opacity: 0; transform: scaleX(0); }
          20%  { opacity: 1; transform: scaleX(1); }
          60%  { opacity: 0.7; }
          100% { opacity: 0; transform: scaleX(1); }
        }
      `}</style>
    </div>
  );
};

// ─── Loading overlay (subtle scanline pulse, stays until stopLoading) ─────────
const LoadingOverlay = ({ active }: { active: boolean }) => (
  <div
    className="fixed inset-0 z-[9998] pointer-events-none overflow-hidden"
    style={{
      opacity: active ? 1 : 0,
      transition: active ? 'opacity 0.15s ease-in' : 'opacity 0.4s ease-out',
    }}
  >
    {/* Faint scanlines */}
    <div
      className="absolute inset-0"
      style={{
        background: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(239,68,68,0.025) 3px, rgba(239,68,68,0.025) 4px)',
        animation: active ? 'loading-scanlines 3s linear infinite' : 'none',
      }}
    />

    {/* Top progress beam — sweeps left-to-right indefinitely */}
    <div
      className="absolute top-0 left-0 right-0"
      style={{ height: '2px', overflow: 'hidden' }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '100%',
          background: 'linear-gradient(90deg, transparent 0%, rgba(239,68,68,0.8) 40%, rgba(239,68,68,1) 50%, rgba(239,68,68,0.8) 60%, transparent 100%)',
          animation: active ? 'loading-beam 1.6s ease-in-out infinite' : 'none',
          boxShadow: '0 0 8px rgba(239,68,68,0.9)',
        }}
      />
    </div>

    {/* Bottom edge glow */}
    <div
      className="absolute bottom-0 left-0 right-0"
      style={{
        height: '1px',
        background: 'linear-gradient(90deg, transparent, rgba(239,68,68,0.3), transparent)',
        animation: active ? 'loading-bottom 2.4s ease-in-out infinite' : 'none',
      }}
    />

    {/* Occasional horizontal glitch tick — fires every ~2s */}
    {active && (
      <div
        className="absolute left-0 right-0"
        style={{
          height: '1px',
          top: '35%',
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
  const loadingDepth = useRef(0); // tracks nested startLoading calls

  const triggerGlitch = useCallback((nav: typeof pendingNav.current) => {
    if (glitchActive) return;
    pendingNav.current = nav;
    setGlitchActive(true);
  }, [glitchActive]);

  useEffect(() => {
    if (!glitchActive) return;
    const navTimer = setTimeout(() => {
      const nav = pendingNav.current;
      if (!nav) return;
      if (nav.type === 'push' && nav.href) router.push(nav.href);
      else if (nav.type === 'back') router.back();
      else if (nav.type === 'forward') router.forward();
      pendingNav.current = null;
    }, 120);
    const clearTimer = setTimeout(() => setGlitchActive(false), 380);
    return () => { clearTimeout(navTimer); clearTimeout(clearTimer); };
  }, [glitchActive, router]);

  const navigate    = useCallback((href: string) => triggerGlitch({ type: 'push', href }), [triggerGlitch]);
  const goBack      = useCallback(() => triggerGlitch({ type: 'back' }),    [triggerGlitch]);
  const goForward   = useCallback(() => triggerGlitch({ type: 'forward' }), [triggerGlitch]);

  // Loading API — supports nested calls (multiple components loading simultaneously)
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