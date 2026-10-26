"use server";

import { headers } from "next/headers";
import type { DatosInvitacion } from "@/lib/repositorio/tipos";
import { supabaseAdmin, supabaseServidor } from "@/lib/supabase/servidor";

// Crear cuentas requiere la llave de servicio de Supabase, que nunca llega al
// navegador. Antes de usarla se comprueba que quien llama es administrador.
export async function invitarUsuario(datos: DatosInvitacion): Promise<{ error?: string }> {
  const supabase = await supabaseServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Tu sesión expiró. Vuelve a iniciar sesión." };

  const { data: perfil } = await supabase.from("usuarios").select("rol, activo").eq("id", user.id).single();
  if (perfil?.rol !== "administrador" || !perfil.activo) {
    return { error: "Solo un administrador puede crear usuarios." };
  }

  const admin = supabaseAdmin();
  if (!admin) {
    return { error: "Falta configurar SUPABASE_SERVICE_ROLE_KEY en el servidor para enviar invitaciones." };
  }

  const correo = datos.correo.trim().toLowerCase();
  const origen = (await headers()).get("origin") ?? "";
  const { data, error } = await admin.auth.admin.inviteUserByEmail(correo, {
    data: { nombre: datos.nombre },
    redirectTo: `${origen}/restablecer`,
  });
  if (error) {
    return { error: error.message.includes("already") ? "Ya existe una cuenta con ese correo." : error.message };
  }

  // El trigger creó el perfil inactivo; aquí se le asignan rol y sede
  const { error: errorPerfil } = await admin
    .from("usuarios")
    .update({ nombre: datos.nombre, rol: datos.rol, sede_id: datos.sedeId, activo: true })
    .eq("id", data.user.id);
  if (errorPerfil) return { error: errorPerfil.message };
  return {};
}
