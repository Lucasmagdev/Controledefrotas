import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  console.warn(
    'Supabase nao configurado. O app vai abrir, mas as funcoes que dependem de banco/fotos vao falhar ate voce preencher as variaveis de ambiente.'
  );
}

const clientUrl = supabaseUrl || 'https://placeholder.supabase.co';
const clientKey = supabaseAnonKey || 'placeholder-anon-key';

console.log('🔗 Conectando ao Supabase:', clientUrl.split('.')[0] + '...');

export const supabase = createClient<Database>(clientUrl, clientKey);
