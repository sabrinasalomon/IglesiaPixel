import type { ConfiguracionIglesia, Horario, Miembro, Rol, Sede, Usuario } from "../types";

// Operaciones de datos de los módulos de la Fase 1. Hay dos implementaciones:
// una sobre los datos de demostración y otra sobre Supabase.

export type DatosMiembro = Pick<Miembro, "nombre" | "telefono" | "correo" | "fechaIngreso">;
export type DatosSede = Pick<Sede, "nombre" | "direccion" | "telefono" | "correo">;
export type DatosHorario = Pick<Horario, "dia" | "hora" | "tipo">;
export interface DatosInvitacion {
  nombre: string;
  correo: string;
  rol: Rol;
  sedeId: string;
}
export type CambiosUsuario = Partial<Pick<Usuario, "rol" | "sedeId" | "activo">>;

export interface Repositorio {
  miembros: {
    listar(sedeId: string): Promise<Miembro[]>;
    crear(sedeId: string, datos: DatosMiembro): Promise<void>;
    editar(id: string, datos: DatosMiembro): Promise<void>;
    cambiarEstado(id: string, activo: boolean): Promise<void>;
  };
  sedes: {
    crear(datos: DatosSede): Promise<void>;
    editar(id: string, datos: DatosSede): Promise<void>;
  };
  usuarios: {
    listar(): Promise<Usuario[]>;
    invitar(datos: DatosInvitacion): Promise<void>;
    editar(id: string, cambios: CambiosUsuario): Promise<void>;
  };
  configuracion: {
    guardar(datos: ConfiguracionIglesia): Promise<void>;
    subirLogo(archivo: File): Promise<string>;
  };
  horarios: {
    listar(sedeId: string): Promise<Horario[]>;
    crear(sedeId: string, datos: DatosHorario): Promise<void>;
    eliminar(id: string): Promise<void>;
  };
}
