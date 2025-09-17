import { useCallback } from 'react';

export function useSessionRepair() {
  const repairSession = useCallback(async () => {
    try {
      console.log('Attempting to repair corrupted session...');
      
      const response = await fetch('/api/auth/repair-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (data.success) {
        console.log('Session repaired successfully:', data.user.email);
        // Dispatch event to refresh the page or update auth state
        window.dispatchEvent(new CustomEvent('sessionRepaired', { detail: data.user }));
        return true;
      } else {
        console.log('Session repair failed:', data.error);
        return false;
      }
    } catch (error) {
      console.error('Session repair error:', error);
      return false;
    }
  }, []);

  return { repairSession };
}

