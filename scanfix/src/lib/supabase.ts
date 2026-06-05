import { createClient } from '@supabase/supabase-js';

// Vite injects these at build time
const supabaseUrl     = (import.meta as any).env?.VITE_SUPABASE_URL     || '';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = !!supabaseUrl && !!supabaseAnonKey;

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
      realtime: { params: { eventsPerSecond: 10 } },
    })
  : null;
