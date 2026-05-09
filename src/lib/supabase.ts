import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Remove trailing slash to prevent double-slash URLs (e.g. https://xxx.supabase.co//rest/v1/...)
const supabaseUrl  = (import.meta.env.VITE_SUPABASE_URL  as string | undefined)?.replace(/\/+$/, '');
const supabaseKey  = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseDisponivel = Boolean(supabaseUrl && supabaseKey);

if (!supabaseDisponivel) {
  console.warn('⚠️ VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY não definidas — Supabase desabilitado');
}

export const supabase: SupabaseClient = supabaseDisponivel
  ? createClient(supabaseUrl!, supabaseKey!)
  : (null as unknown as SupabaseClient);
