"use client";

import { FileSpreadsheet, FileText } from "lucide-react";
import { useMemo, useState } from "react";
import { Boton, Campo, Encabezado, Entrada, SinAcceso, Tabla, Tarjeta, td, th } from "@/components/ui";
import { iso } from "@/lib/datos-ejemplo";
import { aFecha, fechaCorta, mesCorto, mxn } from "@/lib/formato";
import { reportesPermitidos } from "@/lib/permisos";
import { useDatos, useSede } from "@/lib/store";

const NOMBRES: Record<string, string> = {
  miembros: "Miembros",
  asistencia: "Asistencia por evento",
  ministerios: "Participación por ministerio",
  ingresos: "Ingresos por periodo",
};

type Fila = (string | number)[];

// Exportación a Excel como CSV (Excel lo abre directamente). En la Fase 3 se
// genera .xlsx y PDF en el servidor; aquí el PDF usa la impresión del navegador.
function descargarCsv(nombre: string, columnas: string[], filas: Fila[]) {
  const celda = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const csv = [columnas, ...filas].map((f) => f.map(celda).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `${nombre}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Reportes() {
  const { db, usuario, hoy } = useDatos();
  const { sede, miembros, eventos, ministerios, aportaciones, misMinisterios } = useSede();
  const permitidos = reportesPermitidos(usuario!.rol);
  const [tipo, setTipo] = useState(permitidos[0]);
  const hace3Meses = useMemo(() => {
    const d = aFecha(hoy);
    d.setMonth(d.getMonth() - 3);
    return `${iso(d).slice(0, 7)}-01`;
  }, [hoy]);
  const [desde, setDesde] = useState(hace3Meses);
  const [hasta, setHasta] = useState(hoy);

  const soloMios = usuario!.rol === "coordinador";
  const minsVisibles = soloMios ? misMinisterios : ministerios;

  const reporte = useMemo((): { columnas: string[]; filas: Fila[]; formato?: (i: number, v: string | number) => string } => {
    const enPeriodo = (f: string) => f >= desde && f <= hasta;
    switch (tipo) {
      case "miembros":
        return {
          columnas: ["Nombre", "Teléfono", "Correo", "Fecha de ingreso", "Estado", "Ministerios"],
          filas: [...miembros]
            .sort((a, b) => a.nombre.localeCompare(b.nombre))
            .map((m) => [
              m.nombre, m.telefono, m.correo, fechaCorta(m.fechaIngreso), m.activo ? "Activo" : "Inactivo",
              ministerios.filter((x) => x.integrantes.includes(m.id)).map((x) => x.nombre).join(", "),
            ]),
        };
      case "asistencia": {
        const ids = new Set(minsVisibles.map((m) => m.id));
        return {
          columnas: ["Fecha", "Evento", "Presentes", "Ausentes", "% asistencia"],
          filas: eventos
            .filter((e) => enPeriodo(e.fecha) && e.fecha <= hoy && !e.cancelado)
            .filter((e) => !soloMios || (e.ministerioId && ids.has(e.ministerioId)))
            .sort((a, b) => b.fecha.localeCompare(a.fecha))
            .map((e) => {
              const regs = db.asistencias.filter((a) => a.eventoId === e.id);
              const p = regs.filter((a) => a.presente).length;
              return [fechaCorta(e.fecha), e.titulo, p, regs.length - p, regs.length ? `${Math.round((p / regs.length) * 100)}%` : "—"];
            }),
        };
      }
      case "ministerios":
        return {
          columnas: ["Ministerio", "Coordinador", "Integrantes", "Actividades en el periodo", "Asistencia promedio"],
          filas: minsVisibles.map((m) => {
            const acts = eventos.filter((e) => e.ministerioId === m.id && enPeriodo(e.fecha) && !e.cancelado);
            const regs = db.asistencias.filter((a) => acts.some((e) => e.id === a.eventoId));
            const prom = regs.length ? `${Math.round((regs.filter((a) => a.presente).length / regs.length) * 100)}%` : "—";
            return [m.nombre, miembros.find((x) => x.id === m.coordinadorId)?.nombre ?? "Sin asignar", m.integrantes.length, acts.length, prom];
          }),
        };
      case "ingresos": {
        const t = new Map<string, Record<string, number>>();
        aportaciones.filter((a) => enPeriodo(a.fecha)).forEach((a) => {
          const k = a.fecha.slice(0, 7);
          const r = t.get(k) ?? { Diezmo: 0, Ofrenda: 0, Otros: 0, n: 0 };
          const c = a.concepto === "Diezmo" || a.concepto === "Ofrenda" ? a.concepto : "Otros";
          r[c] += a.monto;
          r.n++;
          t.set(k, r);
        });
        return {
          columnas: ["Mes", "Diezmos (MXN)", "Ofrendas (MXN)", "Otros (MXN)", "Total (MXN)", "Aportaciones"],
          filas: [...t.entries()]
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([mes, r]) => [mesCorto(mes), r.Diezmo, r.Ofrenda, r.Otros, r.Diezmo + r.Ofrenda + r.Otros, r.n]),
          formato: (i, v) => (i >= 1 && i <= 4 ? mxn(Number(v)) : String(v)),
        };
      }
      default:
        return { columnas: [], filas: [] };
    }
  }, [tipo, desde, hasta, miembros, ministerios, minsVisibles, eventos, aportaciones, db.asistencias, hoy, soloMios]);

  if (!permitidos.length) return <SinAcceso />;
  const usaPeriodo = tipo !== "miembros";

  return (
    <>
      <div className="print:hidden">
        <Encabezado
          titulo="Reportes"
          descripcion={`Información de ${sede.nombre}`}
          acciones={
            <>
              <Boton variante="secundario" onClick={() => descargarCsv(`${tipo}-${sede.nombre}`, reporte.columnas, reporte.filas)}>
                <FileSpreadsheet size={16} /> Exportar a Excel
              </Boton>
              <Boton variante="secundario" onClick={() => window.print()}>
                <FileText size={16} /> Exportar a PDF
              </Boton>
            </>
          }
        />
        <div className="mb-4 flex flex-wrap gap-2">
          {permitidos.map((p) => (
            <button
              key={p}
              onClick={() => setTipo(p)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium ${tipo === p ? "bg-indigo-600 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"}`}
            >
              {NOMBRES[p]}
            </button>
          ))}
        </div>
      </div>

      <Tarjeta>
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-200 p-4">
          <div>
            <h2 className="font-semibold">{NOMBRES[tipo]}</h2>
            <p className="text-xs text-slate-500">
              {db.configuracion.nombre} · {sede.nombre}
              {usaPeriodo && ` · del ${fechaCorta(desde)} al ${fechaCorta(hasta)}`}
            </p>
          </div>
          {usaPeriodo && (
            <div className="flex gap-2 print:hidden">
              <Campo etiqueta="Desde"><Entrada type="date" value={desde} onChange={(e) => setDesde(e.target.value)} /></Campo>
              <Campo etiqueta="Hasta"><Entrada type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} /></Campo>
            </div>
          )}
        </div>
        <Tabla>
          <thead>
            <tr>{reporte.columnas.map((c) => <th key={c} className={th}>{c}</th>)}</tr>
          </thead>
          <tbody>
            {reporte.filas.map((f, i) => (
              <tr key={i}>
                {f.map((v, j) => <td key={j} className={`${td} ${j > 0 && j < 4 ? "whitespace-nowrap" : ""}`}>{reporte.formato ? reporte.formato(j, v) : v}</td>)}
              </tr>
            ))}
          </tbody>
        </Tabla>
        <p className="p-4 text-xs text-slate-500">{reporte.filas.length} registros</p>
      </Tarjeta>
    </>
  );
}
