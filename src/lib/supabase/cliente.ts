import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./config";

let cliente: SupabaseClient | null = null;

// Cliente del navegador: usa la sesión del usuario, así que RLS aplica sus permisos
export function supabaseNavegador() {
  cliente ??= createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return cliente;
}
