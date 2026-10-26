"use client";

import { X } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";

// Componentes básicos de interfaz compartidos por todos los módulos.

const unir = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

export function Tarjeta({ className, ...p }: ComponentProps<"div">) {
  return (
    <div
      className={unir("rounded-xl border border-slate-200 bg-white shadow-sm", className)}
      {...p}
    />
  );
}

type Variante = "primario" | "secundario" | "peligro" | "fantasma";
const VARIANTES: Record<Variante, string> = {
  primario: "bg-indigo-600 text-white hover:bg-indigo-700",
  secundario: "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
  peligro: "border border-red-200 bg-white text-red-600 hover:bg-red-50",
  fantasma: "text-slate-600 hover:bg-slate-100",
};

export function Boton({
  variante = "primario",
  className,
  ...p
}: ComponentProps<"button"> & { variante?: Variante }) {
  return (
    <button
      className={unir(
        "inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50",
        VARIANTES[variante],
        className
      )}
      {...p}
    />
  );
}

const campo =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";

export function Entrada({ className, ...p }: ComponentProps<"input">) {
  return <input className={unir(campo, className)} {...p} />;
}

export function AreaTexto({ className, ...p }: ComponentProps<"textarea">) {
  return <textarea className={unir(campo, "min-h-24", className)} {...p} />;
}

export function Selector({ className, ...p }: ComponentProps<"select">) {
  return <select className={unir(campo, className)} {...p} />;
}

export function Campo({ etiqueta, children }: { etiqueta: string; children: ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-medium text-slate-600">{etiqueta}</span>
      {children}
    </label>
  );
}

type Tono = "gris" | "verde" | "rojo" | "ambar" | "indigo";
const TONOS: Record<Tono, string> = {
  gris: "bg-slate-100 text-slate-700",
  verde: "bg-emerald-50 text-emerald-700",
  rojo: "bg-red-50 text-red-700",
  ambar: "bg-amber-50 text-amber-700",
  indigo: "bg-indigo-50 text-indigo-700",
};

export function Etiqueta({ tono = "gris", children }: { tono?: Tono; children: ReactNode }) {
  return (
    <span className={unir("inline-flex rounded-full px-2 py-0.5 text-xs font-medium", TONOS[tono])}>
      {children}
    </span>
  );
}

export function Encabezado({
  titulo,
  descripcion,
  acciones,
}: {
  titulo: string;
  descripcion?: string;
  acciones?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">{titulo}</h1>
        {descripcion && <p className="mt-1 text-sm text-slate-500">{descripcion}</p>}
      </div>
      {acciones && <div className="flex flex-wrap gap-2">{acciones}</div>}
    </div>
  );
}

export function Modal({
  titulo,
  abierto,
  alCerrar,
  children,
  pie,
}: {
  titulo: string;
  abierto: boolean;
  alCerrar: () => void;
  children: ReactNode;
  pie?: ReactNode;
}) {
  if (!abierto) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" onClick={alCerrar}>
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <h2 className="font-semibold text-slate-900">{titulo}</h2>
          <button onClick={alCerrar} className="rounded p-1 text-slate-500 hover:bg-slate-100" aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>
        <div className="space-y-4 px-5 py-4">{children}</div>
        {pie && <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-3">{pie}</div>}
      </div>
    </div>
  );
}

export function Tabla({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">{children}</table>
    </div>
  );
}

export const th = "border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500";
export const td = "border-b border-slate-100 px-4 py-2.5 text-slate-700";

export function Vacio({ children }: { children: ReactNode }) {
  return <p className="px-4 py-10 text-center text-sm text-slate-500">{children}</p>;
}

export function SinAcceso() {
  return (
    <Tarjeta className="p-10 text-center">
      <p className="font-medium text-slate-800">No tienes acceso a este módulo</p>
      <p className="mt-1 text-sm text-slate-500">Tu rol no tiene permiso para ver esta información.</p>
    </Tarjeta>
  );
}

export function Indicador({
  titulo,
  valor,
  detalle,
  icono,
}: {
  titulo: string;
  valor: ReactNode;
  detalle?: string;
  icono: ReactNode;
}) {
  return (
    <Tarjeta className="p-5">
      <div className="flex items-start justify-between">
        <p className="text-sm text-slate-500">{titulo}</p>
        <span className="rounded-lg bg-indigo-50 p-2 text-indigo-600">{icono}</span>
      </div>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{valor}</p>
      {detalle && <p className="mt-1 text-xs text-slate-500">{detalle}</p>}
    </Tarjeta>
  );
}
