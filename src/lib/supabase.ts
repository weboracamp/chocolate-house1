import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase Client Initialization
 * 
 * Configured via Vite environment variables:
 * - VITE_SUPABASE_URL
 * - VITE_SUPABASE_ANON_KEY
 * 
 * If environment variables are missing at runtime, defaults to the provisioned Chocolate House Supabase instance.
 */
const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://hrgvjuqytuxewqwbibtw.supabase.co';
const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhyZ3ZqdXF5dHV4ZXdxd2JpYnR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkyMTg4MTQsImV4cCI6MjEwNDc5NDgxNH0.JJ_iogKTqpWmNIC655U-l6FIUoT_YxMX7zdYZkwfpTY';

export let supabase: SupabaseClient | null = null;

if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  } catch (err) {
    console.warn('Failed to initialize Supabase client:', err);
  }
}

export const isSupabaseConfigured = (): boolean => {
  return Boolean(supabase);
};
