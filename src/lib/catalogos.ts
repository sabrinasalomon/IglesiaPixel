import type { ConceptoAportacion, MetodoPago, Rol, TipoEvento } from "./types";

export const CONCEPTOS: ConceptoAportacion[] = [
  "Diezmo",
  "Ofrenda",
  "Primicias",
  "Donativo especial",
  "Misiones",
  "Construcción",
  "Otro",
];

export const METODOS: MetodoPago[] = [
  "Efectivo",
  "Transferencia SPEI",
  "Tarjeta",
  "Depósito bancario",
  "Cheque",
];

export const TIPOS_EVENTO: TipoEvento[] = [
  "Culto dominical",
  "Culto de oración",
  "Estudio bíblico",
  "Reunión de ministerio",
  "Reunión administrativa",
  "Actividad especial",
  "Evangelismo",
];

export const ROLES: { id: Rol; nombre: string }[] = [
  { id: "administrador", nombre: "Administrador" },
  { id: "pastor", nombre: "Pastor" },
  { id: "secretario", nombre: "Secretario" },
  { id: "tesorero", nombre: "Tesorero" },
  { id: "coordinador", nombre: "Coordinador" },
  { id: "miembro", nombre: "Miembro" },
];

export const nombreRol = (rol: Rol) =>
  ROLES.find((r) => r.id === rol)?.nombre ?? rol;
