import { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { createSupabaseQueries } from './queries';
import { SupabaseContext } from './context';

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const queries = createSupabaseQueries(supabase);

  useEffect(() => {
    // Get current session
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);

      // Listen for auth changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
      });

      return () => {
        subscription.unsubscribe();
      };
    })();
  }, []);

  return (
    <SupabaseContext.Provider value={{ user, loading, queries }}>
      {children}
    </SupabaseContext.Provider>
  );
}