"use client";

import { Inbox, Lock, X } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { aFecha, MESES } from "@/lib/formato";

// Componentes básicos de interfaz compartidos por todos los módulos.

const unir = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

export function Tarjeta({ className, ...p }: ComponentProps<"div">) {
  return (
    <div
      className={unir(
        "rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_2px_8px_-2px_rgba(15,23,42,0.06)]",
        className
      )}
      {...p}
    />
  );
}

type Variante = "primario" | "secundario" | "peligro" | "fantasma";
const VARIANTES: Record<Variante, string> = {
  primario:
    "bg-marca-600 text-white shadow-sm shadow-marca-900/20 ring-1 ring-inset ring-white/10 hover:bg-marca-700",
  secundario: "border border-slate-200 bg-white text-slate-700 shadow-sm shadow-slate-900/5 hover:border-slate-300 hover:bg-slate-50",
  peligro: "border border-red-200 bg-white text-red-600 hover:border-red-300 hover:bg-red-50",
  fantasma: "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
};

export function Boton({
  variante = "primario",
  className,
  ...p
}: ComponentProps<"button"> & { variante?: Variante }) {
  return (
    <button
      className={unir(
        "inline-flex items-center justify-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-semibold transition active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:active:translate-y-0",
        VARIANTES[variante],
        className
      )}
      {...p}
    />
  );
}

const campo =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm shadow-slate-900/[0.03] outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-marca-500 focus:ring-4 focus:ring-marca-500/15 disabled:bg-slate-50 disabled:text-slate-500";

export function Entrada({ className, ...p }: ComponentProps<"input">) {
  return <input className={unir(campo, className)} {...p} />;
}

export function AreaTexto({ className, ...p }: ComponentProps<"textarea">) {
  return <textarea className={unir(campo, "min-h-24", className)} {...p} />;
}

export function Selector({ className, ...p }: ComponentProps<"select">) {
  return <select className={unir(campo, "cursor-pointer", className)} {...p} />;
}

export function Campo({ etiqueta, children }: { etiqueta: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-semibold text-slate-600">{etiqueta}</span>
      {children}
    </label>
  );
}

type Tono = "gris" | "verde" | "rojo" | "ambar" | "marca" | "dorado" | "cielo" | "violeta";
const TONOS: Record<Tono, string> = {
  gris: "bg-slate-100 text-slate-700 ring-slate-500/15",
  verde: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  rojo: "bg-red-50 text-red-700 ring-red-600/15",
  ambar: "bg-amber-50 text-amber-800 ring-amber-600/20",
  marca: "bg-marca-50 text-marca-700 ring-marca-600/15",
  dorado: "bg-dorado-50 text-dorado-700 ring-dorado-600/20",
  cielo: "bg-sky-50 text-sky-700 ring-sky-600/15",
  violeta: "bg-violet-50 text-violet-700 ring-violet-600/15",
};

export function Etiqueta({ tono = "gris", children }: { tono?: Tono; children: ReactNode }) {
  return (
    <span
      className={unir(
        "inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset",
        TONOS[tono]
      )}
    >
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
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-titulo text-3xl font-semibold tracking-tight text-slate-900">{titulo}</h1>
        {descripcion && <p className="mt-1.5 text-sm text-slate-500">{descripcion}</p>}
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
    <div
      className="fixed inset-0 z-50 flex animate-aparecer items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
      onClick={alCerrar}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        className="max-h-[90vh] w-full max-w-lg animate-emerger overflow-y-auto rounded-2xl bg-white shadow-2xl ring-1 ring-slate-900/5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="font-titulo text-lg font-semibold text-slate-900">{titulo}</h2>
          <button
            onClick={alCerrar}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>
        <div className="space-y-4 px-6 py-5">{children}</div>
        {pie && <div className="flex justify-end gap-2 rounded-b-2xl border-t border-slate-100 bg-slate-50/70 px-6 py-3.5">{pie}</div>}
      </div>
    </div>
  );
}

export function Tabla({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm [&_tbody_tr]:transition-colors [&_tbody_tr:hover]:bg-marca-50/40 [&_tbody_tr:last-child_td]:border-b-0">
        {children}
      </table>
    </div>
  );
}

export const th = "border-b border-slate-200 bg-slate-50/80 px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500";
export const td = "border-b border-slate-100 px-4 py-3 text-slate-700";

export function Vacio({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-4 py-12 text-center">
      <span className="mb-3 rounded-2xl bg-slate-100 p-3 text-slate-400">
        <Inbox size={22} />
      </span>
      <p className="text-sm text-slate-500">{children}</p>
    </div>
  );
}

export function SinAcceso() {
  return (
    <Tarjeta className="flex flex-col items-center p-12 text-center">
      <span className="mb-4 rounded-2xl bg-dorado-50 p-3 text-dorado-600 ring-1 ring-inset ring-dorado-600/15">
        <Lock size={22} />
      </span>
      <p className="font-titulo text-lg font-semibold text-slate-900">No tienes acceso a este módulo</p>
      <p className="mt-1 text-sm text-slate-500">Tu rol no tiene permiso para ver esta información.</p>
    </Tarjeta>
  );
}

export function Indicador({
  titulo,
  valor,
  detalle,
  icono,
  tono = "marca",
}: {
  titulo: string;
  valor: ReactNode;
  detalle?: string;
  icono: ReactNode;
  tono?: Tono;
}) {
  return (
    <Tarjeta className="p-5 transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">{titulo}</p>
        <span className={unir("shrink-0 rounded-xl p-2 ring-1 ring-inset", TONOS[tono])}>{icono}</span>
      </div>
      <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900 tabular-nums">{valor}</p>
      {detalle && <p className="mt-1 text-xs text-slate-500">{detalle}</p>}
    </Tarjeta>
  );
}

// Ficha de calendario con el día y el mes de una fecha AAAA-MM-DD
export function FichaFecha({ iso }: { iso: string }) {
  const f = aFecha(iso);
  return (
    <span className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl bg-marca-50 leading-none text-marca-700 ring-1 ring-inset ring-marca-600/10">
      <span className="text-[10px] font-bold uppercase">{MESES[f.getMonth()].slice(0, 3)}</span>
      <span className="mt-0.5 text-base font-bold">{f.getDate()}</span>
    </span>
  );
}
