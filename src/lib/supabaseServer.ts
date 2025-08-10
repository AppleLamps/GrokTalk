import { createClient, SupabaseClient } from '@supabase/supabase-js';

const getEnv = (key: string): string | undefined => {
  return process.env[key] || undefined;
};

const SUPABASE_URL =
  getEnv('POSTGRES_SUPABASE_URL') ||
  getEnv('NEXT_PUBLIC_SUPABASE_URL') ||
  '';

const SUPABASE_ANON_KEY =
  getEnv('POSTGRES_NEXT_PUBLIC_SUPABASE_ANON_KEY') ||
  getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY') ||
  '';

const SUPABASE_SERVICE_ROLE_KEY =
  getEnv('POSTGRES_SUPABASE_SERVICE_ROLE_KEY') ||
  getEnv('SUPABASE_SERVICE_ROLE_KEY') ||
  '';

let supabaseAdminClient: SupabaseClient | null = null;
let supabaseAnonClient: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (!supabaseAdminClient) {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase admin configuration missing (URL or SERVICE_ROLE_KEY)');
    }
    supabaseAdminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return supabaseAdminClient;
}

export function getSupabaseAnon(): SupabaseClient {
  if (!supabaseAnonClient) {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error('Supabase anon configuration missing (URL or ANON_KEY)');
    }
    supabaseAnonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return supabaseAnonClient;
}

export async function getUserFromAuthHeader(authHeader?: string) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.substring(7);
  const supabase = getSupabaseAnon();
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user;
}


