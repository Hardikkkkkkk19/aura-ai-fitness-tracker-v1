import { createClient } from '@supabase/supabase-js';

// Access Supabase environment variables from Vite
const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || '';

export const isRealSupabaseConfigured = 
  !!supabaseUrl && 
  !!supabaseAnonKey && 
  supabaseUrl !== 'https://placeholder-project.supabase.co' &&
  !supabaseUrl.includes('placeholder');

if (!isRealSupabaseConfigured) {
  console.warn("CRITICAL CONFIGURATION WARNING: Supabase environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY) are missing or set to placeholders. Aura AI will use a high-fidelity local sandbox fallback.");
}

// Initialize the Supabase client directly
export const supabase = createClient(
  supabaseUrl || 'https://placeholder-project.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key'
);
