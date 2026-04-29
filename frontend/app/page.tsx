'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // DEMO MODE: Skip login and go directly to chatbot
    console.log('[Demo] Bypassing auth, redirecting to AI assistant...');
    router.push('/ai-assistant');
  }, [router]);

  return null;
}
