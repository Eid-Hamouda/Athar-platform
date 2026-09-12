import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Fail loudly during development if the environment variables are missing
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Missing Supabase environment variables. Make sure your .env.local file is set up correctly.');
}

// Create and export the Supabase client
export const supabase = createClient(
  supabaseUrl || 'https://cgfdkqqlpgzninxbtubn.supabase.co', 
  supabaseAnonKey || 'sb_publishable_armYRRYrZCgXCwTdLsdFDg_0cZHy7lC'
);
