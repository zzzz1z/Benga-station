'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function useAccessGuard() {
  const router = useRouter();

  useEffect(() => {
    const cookies = document.cookie.split(';').map(c => c.trim());
    const hasAccess = cookies.some(c => c.startsWith('access_granted='));
    if (!hasAccess) {
      router.replace('/welcome');
    }
  }, [router]);
}