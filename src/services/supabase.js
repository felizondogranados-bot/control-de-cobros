import { createClient } from '@supabase/supabase-js';

/**
 * Supabase Client Initialization
 * 
 * - Loads credentials from Vite environment variables.
 * - Rest of the application imports this centralized instance.
 */
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing. ' +
    'Please create a .env file and set these values.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
