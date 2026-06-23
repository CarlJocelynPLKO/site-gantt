import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = normalizeSupabaseUrl(import.meta.env.VITE_SUPABASE_URL ?? "");
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? "";

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

let supabaseInstance: SupabaseClient | null = null;

function normalizeSupabaseUrl(url: string): string {
  return url.trim().replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
}

export function getSupabase(): SupabaseClient {
  if (!isSupabaseConfigured) {
    throw new Error(
      "Configuration Supabase incomplète. Renseignez VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY dans frontend/.env",
    );
  }

  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  }

  return supabaseInstance;
}
