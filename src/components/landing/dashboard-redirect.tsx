'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function DashboardRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Add a small delay to prevent race conditions with logout
    const timer = setTimeout(async () => {
      try {
        const res = await fetch('/api/me', { credentials: 'include' });
        if (res.ok) {
          const responseText = await res.text();
          let data;
          try {
            data = JSON.parse(responseText);
          } catch (parseError) {
            console.error('Failed to parse /api/me response:', parseError, responseText);
            return;
          }
          if (data?.user) router.replace('/dashboard');
        }
      } catch (error) {
        console.error('Error checking user session:', error);
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, [router]);

  return null;
}