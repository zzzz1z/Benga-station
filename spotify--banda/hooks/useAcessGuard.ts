'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function useAccessGuard() {
  const router = useRouter();

  useEffect(() => {
    const check = async () => {
      // Try cookie-based check first (web)
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/access/check`, {
          credentials: 'include',
        });
        const { granted } = await res.json();
        if (granted) return;
      } catch {}

      // Fallback: localStorage (Capacitor native)
      if (localStorage.getItem('access_granted') === '1') return;

      router.replace('/welcome');
    };

    check();
  }, [router]);
}