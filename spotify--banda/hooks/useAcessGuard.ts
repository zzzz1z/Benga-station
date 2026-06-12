'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function useAccessGuard() {
  const router = useRouter();

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/access/check`, {
      credentials: 'include',
    })
      .then(res => res.json())
      .then(({ granted }) => {
        if (!granted) router.replace('/welcome');
      })
      .catch(() => router.replace('/welcome'));
  }, [router]);
}