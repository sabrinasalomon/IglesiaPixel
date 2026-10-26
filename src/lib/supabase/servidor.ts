import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./config";

// Cliente de servidor con la sesión del usuario que hace la petición
export async function supabaseServidor() {
  const almacen = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => almacen.getAll(),
      setAll: (lista) => {
        try {
          lista.forEach(({ name, value, options }) => almacen.set(name, value, options));
        } catch {
          // llamado desde un Server Component: el middleware renueva la sesión
        }
      },
    },
  });
}

// Cliente con la llave de servicio: ignora RLS. Solo para acciones de
// servidor que antes verificaron que quien llama es administrador.
export function supabaseAdmin() {
  const llave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!llave) return null;
  return createClient(SUPABASE_URL, llave, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
