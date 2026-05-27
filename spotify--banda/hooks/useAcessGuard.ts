'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function useAccessGuard() {
  const router = useRouter();

  useEffect(() => {
    const hasAccess = localStorage.getItem('access_granted') === '1';
    if (!hasAccess) {
      router.replace('/welcome');
    }
  }, [router]);
}