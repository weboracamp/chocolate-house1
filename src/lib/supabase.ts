import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Supabase configuration
const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

export let supabase: SupabaseClient | null = null;

if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  } catch (err) {
    console.warn('Failed to initialize Supabase client:', err);
  }
}

export const isSupabaseConfigured = (): boolean => {
  return Boolean(supabase);
};
