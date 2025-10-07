import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Check if we have the required environment variables
if (!supabaseUrl || !supabaseAnonKey || supabaseAnonKey === 'YOUR_ANON_KEY_HERE') {
  console.warn('Supabase Storage not configured. Please add NEXT_PUBLIC_SUPABASE_ANON_KEY to your environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper function to check if Supabase Storage is configured
export const isSupabaseStorageConfigured = () => {
  return supabaseAnonKey && supabaseAnonKey !== 'YOUR_ANON_KEY_HERE';
};