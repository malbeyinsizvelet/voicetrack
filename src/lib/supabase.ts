// ============================================================
// SUPABASE CLIENT
// ============================================================

import { createClient } from '@supabase/supabase-js';

// Vite env tiplerini elle tanımla (tsconfig vite-env.d.ts olmadan)
declare global {
  interface ImportMeta {
    readonly env: Record<string, string | undefined>;
  }
}

const supabaseUrl  = (import.meta.env['VITE_SUPABASE_URL']  as string | undefined) ?? '';
const supabaseAnon = (import.meta.env['VITE_SUPABASE_ANON_KEY'] as string | undefined) ?? '';

if (!supabaseUrl || !supabaseAnon) {
  console.warn(
    '[Supabase] VITE_SUPABASE_URL veya VITE_SUPABASE_ANON_KEY eksik. ' +
    'Demo/mock modunda çalışılıyor.'
  );
}

export const supabase = createClient(
  supabaseUrl  || 'https://placeholder.supabase.co',
  supabaseAnon || 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

/** Supabase gerçekten yapılandırılmış mı? */
export function isSupabaseEnabled(): boolean {
  return Boolean(
    supabaseUrl &&
    supabaseAnon &&
    supabaseUrl !== 'https://placeholder.supabase.co'
  );
}
