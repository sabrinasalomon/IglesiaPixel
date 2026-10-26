import { invitarUsuario } from "@/app/(app)/usuarios/acciones";
import { supabaseNavegador } from "../supabase/cliente";
import type { Horario, Miembro, Usuario } from "../types";
import type { Repositorio } from "./tipos";

// Implementación sobre Supabase. Todas las consultas usan la sesión del
// usuario, así que las políticas RLS deciden qué filas puede leer o cambiar.

type FilaMiembro = {
  id: string;
  sede_id: string;
  nombre: string;
  telefono: string;
  correo: string;
  fecha_ingreso: string;
  activo: boolean;
};
type FilaUsuario = {
  id: string;
  nombre: string;
  correo: string;
  rol: Usuario["rol"];
  sede_id: string | null;
  miembro_id: string | null;
  activo: boolean;
};
type FilaHorario = { id: string; sede_id: string; dia: string; hora: string; tipo: string };

export const aMiembro = (f: FilaMiembro): Miembro => ({
  id: f.id,
  sedeId: f.sede_id,
  nombre: f.nombre,
  telefono: f.telefono,
  correo: f.correo,
  fechaIngreso: f.fecha_ingreso,
  activo: f.activo,
});

export const aUsuario = (f: FilaUsuario): Usuario => ({
  id: f.id,
  nombre: f.nombre,
  correo: f.correo,
  rol: f.rol,
  sedeId: f.sede_id,
  miembroId: f.miembro_id ?? undefined,
  activo: f.activo,
});

const aHorario = (f: FilaHorario): Horario => ({
  id: f.id,
  sedeId: f.sede_id,
  dia: f.dia,
  hora: f.hora.slice(0, 5),
  tipo: f.tipo,
});

const ORDEN_DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

// Convierte el error de Supabase en una excepción con mensaje en español
function revisar<T>(r: { data: T; error: { message: string; code?: string } | null }): T {
  if (r.error) {
    if (r.error.code === "42501") throw new Error("No tienes permiso para realizar esta acción.");
    throw new Error(r.error.message);
  }
  return r.data;
}

export function repositorioSupabase(): Repositorio {
  const db = supabaseNavegador();

  return {
    miembros: {
      async listar(sedeId) {
        const filas = revisar(await db.from("miembros").select("*").eq("sede_id", sedeId).order("nombre"));
        return (filas as FilaMiembro[]).map(aMiembro);
      },
      async crear(sedeId, d) {
        revisar(
          await db.from("miembros").insert({
            sede_id: sedeId,
            nombre: d.nombre,
            telefono: d.telefono,
            correo: d.correo,
            fecha_ingreso: d.fechaIngreso,
          })
        );
      },
      async editar(id, d) {
        revisar(
          await db
            .from("miembros")
            .update({ nombre: d.nombre, telefono: d.telefono, correo: d.correo, fecha_ingreso: d.fechaIngreso })
            .eq("id", id)
        );
      },
      async cambiarEstado(id, activo) {
        revisar(await db.from("miembros").update({ activo }).eq("id", id));
      },
    },

    sedes: {
      async crear(d) {
        revisar(await db.from("sedes").insert(d));
      },
      async editar(id, d) {
        revisar(await db.from("sedes").update(d).eq("id", id));
      },
    },

    usuarios: {
      async listar() {
        const filas = revisar(await db.from("usuarios").select("*").order("nombre"));
        return (filas as FilaUsuario[]).map(aUsuario);
      },
      async invitar(datos) {
        const r = await invitarUsuario(datos);
        if (r.error) throw new Error(r.error);
      },
      async editar(id, c) {
        const cambios: Record<string, unknown> = {};
        if (c.rol !== undefined) cambios.rol = c.rol;
        if (c.sedeId !== undefined) cambios.sede_id = c.sedeId;
        if (c.activo !== undefined) cambios.activo = c.activo;
        revisar(await db.from("usuarios").update(cambios).eq("id", id));
      },
    },

    configuracion: {
      async guardar(c) {
        revisar(
          await db
            .from("configuracion_iglesia")
            .update({ nombre: c.nombre, lema: c.lema, logo_url: c.logoUrl ?? null })
            .eq("id", 1)
        );
      },
      async subirLogo(archivo) {
        const extension = archivo.name.split(".").pop()?.toLowerCase() || "png";
        const ruta = `logo-${Date.now()}.${extension}`;
        const { error } = await db.storage.from("logos").upload(ruta, archivo, { contentType: archivo.type });
        if (error) throw new Error(error.message);
        return db.storage.from("logos").getPublicUrl(ruta).data.publicUrl;
      },
    },

    horarios: {
      async listar(sedeId) {
        const filas = revisar(await db.from("horarios").select("*").eq("sede_id", sedeId));
        return (filas as FilaHorario[])
          .map(aHorario)
          .sort((a, b) => ORDEN_DIAS.indexOf(a.dia) - ORDEN_DIAS.indexOf(b.dia) || a.hora.localeCompare(b.hora));
      },
      async crear(sedeId, d) {
        revisar(await db.from("horarios").insert({ sede_id: sedeId, ...d }));
      },
      async eliminar(id) {
        revisar(await db.from("horarios").delete().eq("id", id));
      },
    },
  };
}
