import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { supabase as defaultSupabase } from './lib/supabase';

/**
 * Supabase Client initialized via import.meta.env for Vite applications
 */
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || 'https://dljosvxgtbmvojwfkiod.supabase.co';
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsam9zdnhndGJtdm9qd2ZraW9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1OTQwNDYsImV4cCI6MjEwMzE3MDA0Nn0.Gd8uSZjut2OQCzwgSMbfcjicFGu0dzTOkb-7oex9UAI';

export const supabase: SupabaseClient | null =
  defaultSupabase ||
  (supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null);

export default supabase;
