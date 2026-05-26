'use client';

import { useAccessGuard } from "@/hooks/useAcessGuard";


export default function AccessGuard() {
  useAccessGuard();
  return null;
}