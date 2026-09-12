import { supabase, isSupabaseConfigured } from './lib/supabase';
export type { SupabaseClient } from '@supabase/supabase-js';

export { supabase, isSupabaseConfigured };
export default supabase;

