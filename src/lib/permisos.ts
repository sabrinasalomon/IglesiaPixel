import type { Rol } from "./types";

// Matriz de permisos aprobada en la propuesta. En la Fase 1 se aplica también
// en el servidor (políticas RLS de Supabase), no solo en la interfaz.

export type Modulo =
  | "sedes"
  | "usuarios"
  | "miembros"
  | "asistencia"
  | "eventos"
  | "ministerios"
  | "donaciones"
  | "comunicados"
  | "reportes"
  | "configuracion";

// total: crear, editar y desactivar · editar: crear y editar · ver: solo lectura
// ministerio: solo lo de su ministerio · perfil: solo su propio registro
export type Acceso = "total" | "editar" | "ver" | "ministerio" | "perfil";

const MATRIZ: Record<Modulo, Partial<Record<Rol, Acceso>>> = {
  sedes: { administrador: "total" },
  usuarios: { administrador: "total", pastor: "ver" },
  miembros: {
    administrador: "total",
    pastor: "total",
    secretario: "total",
    tesorero: "ver",
    coordinador: "ver",
    miembro: "perfil",
  },
  asistencia: {
    administrador: "total",
    pastor: "total",
    secretario: "total",
    coordinador: "ministerio",
  },
  eventos: {
    administrador: "total",
    pastor: "total",
    secretario: "total",
    tesorero: "ver",
    coordinador: "ministerio",
    miembro: "ver",
  },
  ministerios: {
    administrador: "total",
    pastor: "total",
    secretario: "editar",
    tesorero: "ver",
    coordinador: "ministerio",
  },
  donaciones: { administrador: "total", pastor: "ver", tesorero: "total" },
  comunicados: {
    administrador: "total",
    pastor: "total",
    secretario: "total",
    coordinador: "ver",
    miembro: "ver",
  },
  reportes: {
    administrador: "total",
    pastor: "total",
    secretario: "ver",
    tesorero: "ver",
    coordinador: "ministerio",
  },
  configuracion: { administrador: "total", pastor: "ver" },
};

export const acceso = (rol: Rol, modulo: Modulo): Acceso | undefined =>
  MATRIZ[modulo][rol];

export const puedeVer = (rol: Rol, modulo: Modulo) => !!acceso(rol, modulo);

export const puedeEditar = (rol: Rol, modulo: Modulo) => {
  const a = acceso(rol, modulo);
  return a === "total" || a === "editar" || a === "ministerio";
};

export const veFinanzas = (rol: Rol) =>
  rol === "administrador" || rol === "pastor" || rol === "tesorero";

// Qué reportes puede generar cada rol
export const reportesPermitidos = (rol: Rol) => {
  switch (rol) {
    case "administrador":
    case "pastor":
      return ["miembros", "asistencia", "ministerios", "ingresos"];
    case "secretario":
      return ["miembros", "asistencia", "ministerios"];
    case "tesorero":
      return ["ingresos"];
    case "coordinador":
      return ["asistencia", "ministerios"];
    default:
      return [];
  }
};
