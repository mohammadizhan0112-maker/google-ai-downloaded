import { createClient } from '@supabase/supabase-js';

// Check multiple possible locations for the URL and KEY
// We check process.env (mapped in vite.config.ts) and import.meta.env
const supabaseUrl = process.env.SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey || supabaseUrl === 'undefined' || supabaseKey === 'undefined') {
  console.error('CRITICAL: Supabase credentials not found. Please set SUPABASE_URL and SUPABASE_KEY in your environment variables or Secrets panel.');
}

export const supabase = createClient(
  supabaseUrl && supabaseUrl !== 'undefined' ? supabaseUrl : 'https://ctuxiruisupgfftvgbma.supabase.co',
  supabaseKey && supabaseKey !== 'undefined' ? supabaseKey : 'sb_publishable_KhdogkA3xa8q5o9ccCANIg_fMbQJCxT'
);
