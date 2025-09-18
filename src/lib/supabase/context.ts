import { createContext, useContext } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { createSupabaseQueries, SupabaseQueries } from './queries';

export type SupabaseContextType = {
  user: User | null;
  loading: boolean;
  queries: SupabaseQueries;
};

export const SupabaseContext = createContext<SupabaseContextType>({
  user: null,
  loading: true,
  queries: createSupabaseQueries(supabase),
});

export function useSupabase() {
  const context = useContext(SupabaseContext);
  if (!context) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context;
}