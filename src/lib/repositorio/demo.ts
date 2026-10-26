import type { BaseDatos } from "../datos-ejemplo";
import { nuevoId } from "../ids";
import type { Repositorio } from "./tipos";

// Implementación sobre los datos de demostración en memoria
export function repositorioDemo(
  leer: () => BaseDatos,
  actualizar: (cambio: (db: BaseDatos) => BaseDatos) => void
): Repositorio {
  const listo = () => Promise.resolve();

  return {
    miembros: {
      listar: async (sedeId) => leer().miembros.filter((m) => m.sedeId === sedeId).sort((a, b) => a.nombre.localeCompare(b.nombre)),
      crear: (sedeId, d) => {
        actualizar((db) => ({ ...db, miembros: [...db.miembros, { id: nuevoId("m"), sedeId, activo: true, ...d }] }));
        return listo();
      },
      editar: (id, d) => {
        actualizar((db) => ({ ...db, miembros: db.miembros.map((m) => (m.id === id ? { ...m, ...d } : m)) }));
        return listo();
      },
      cambiarEstado: (id, activo) => {
        actualizar((db) => ({ ...db, miembros: db.miembros.map((m) => (m.id === id ? { ...m, activo } : m)) }));
        return listo();
      },
    },
    sedes: {
      crear: (d) => {
        actualizar((db) => ({ ...db, sedes: [...db.sedes, { id: nuevoId("s"), activa: true, ...d }] }));
        return listo();
      },
      editar: (id, d) => {
        actualizar((db) => ({ ...db, sedes: db.sedes.map((s) => (s.id === id ? { ...s, ...d } : s)) }));
        return listo();
      },
    },
    usuarios: {
      listar: async () => leer().usuarios,
      invitar: ({ nombre, correo, rol, sedeId }) => {
        actualizar((db) => ({
          ...db,
          usuarios: [...db.usuarios, { id: nuevoId("u"), nombre, correo, rol, sedeId, activo: true }],
        }));
        return listo();
      },
      editar: (id, c) => {
        actualizar((db) => ({ ...db, usuarios: db.usuarios.map((u) => (u.id === id ? { ...u, ...c } : u)) }));
        return listo();
      },
    },
    configuracion: {
      guardar: (c) => {
        actualizar((db) => ({ ...db, configuracion: c }));
        return listo();
      },
      // En demostración el logo se guarda como dirección temporal del navegador
      subirLogo: async (archivo) => URL.createObjectURL(archivo),
    },
    horarios: {
      listar: async (sedeId) => leer().horarios.filter((h) => h.sedeId === sedeId),
      crear: (sedeId, d) => {
        actualizar((db) => ({ ...db, horarios: [...db.horarios, { id: nuevoId("h"), sedeId, ...d }] }));
        return listo();
      },
      eliminar: (id) => {
        actualizar((db) => ({ ...db, horarios: db.horarios.filter((h) => h.id !== id) }));
        return listo();
      },
    },
  };
}
