// Modelo de datos del sistema. En la Fase 1 estas mismas formas se convierten
// en tablas de Supabase (PostgreSQL); en el prototipo viven en memoria.

export type Rol =
  | "administrador"
  | "pastor"
  | "secretario"
  | "tesorero"
  | "coordinador"
  | "miembro";

export interface Sede {
  id: string;
  nombre: string;
  direccion: string;
  telefono: string;
  correo: string;
  activa: boolean;
}

export interface Usuario {
  id: string;
  nombre: string;
  correo: string;
  rol: Rol;
  sedeId: string | null;
  miembroId?: string;
  activo: boolean;
}

export interface Miembro {
  id: string;
  sedeId: string;
  nombre: string;
  telefono: string;
  correo: string;
  fechaIngreso: string; // AAAA-MM-DD
  activo: boolean;
}

export type TipoEvento =
  | "Culto dominical"
  | "Culto de oración"
  | "Estudio bíblico"
  | "Reunión de ministerio"
  | "Reunión administrativa"
  | "Actividad especial"
  | "Evangelismo";

export interface Evento {
  id: string;
  sedeId: string;
  ministerioId?: string;
  titulo: string;
  tipo: TipoEvento;
  fecha: string; // AAAA-MM-DD
  hora: string; // HH:MM
  lugar: string;
  descripcion: string;
  responsables: string[]; // ids de miembros
  cancelado: boolean;
}

export interface Asistencia {
  eventoId: string;
  miembroId: string;
  presente: boolean;
}

export interface Ministerio {
  id: string;
  sedeId: string;
  nombre: string;
  descripcion: string;
  coordinadorId?: string; // id de miembro
  integrantes: string[]; // ids de miembros
}

export type ConceptoAportacion =
  | "Diezmo"
  | "Ofrenda"
  | "Primicias"
  | "Donativo especial"
  | "Misiones"
  | "Construcción"
  | "Otro";

export type MetodoPago =
  | "Efectivo"
  | "Transferencia SPEI"
  | "Tarjeta"
  | "Depósito bancario"
  | "Cheque";

export interface Aportacion {
  id: string;
  sedeId: string;
  fecha: string;
  monto: number; // MXN
  concepto: ConceptoAportacion;
  metodo: MetodoPago;
  miembroId?: string; // vacío = anónima
  registradoPor: string; // id de usuario
  anulada?: boolean; // las aportaciones no se borran: se anulan
}

export interface Anuncio {
  id: string;
  sedeId: string | null; // null = todas las sedes
  titulo: string;
  contenido: string;
  fechaPublicacion: string;
  importante: boolean;
  autorId: string;
  autorNombre?: string;
}

export interface Horario {
  id: string;
  sedeId: string;
  dia: string;
  hora: string;
  tipo: string;
}

export interface ConfiguracionIglesia {
  nombre: string;
  lema: string;
  logoUrl?: string | null;
}
