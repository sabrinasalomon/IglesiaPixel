"use client";

import { FileSpreadsheet, FileText } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { Boton, Campo, Contador, Dibujo, Encabezado, Entrada, Pestanas, SinAcceso, Tabla, Tarjeta, Vacio, td, th } from "@/components/ui";
import { iso } from "@/lib/datos-ejemplo";
import { aFecha, fechaCorta, mesCorto, mxn } from "@/lib/formato";
import { reportesPermitidos } from "@/lib/permisos";
import { exportarExcel, exportarPdf, type Reporte, type Valor } from "@/lib/exportar";
import { useDatos } from "@/lib/store";
import type { Aportacion, Asistencia, Evento, Miembro, Ministerio } from "@/lib/types";
import { intentar, useCarga } from "@/lib/usar-carga";

const NOMBRES: Record<string, string> = {
  miembros: "Miembros",
  asistencia: "Asistencia por evento",
  ministerios: "Participación por ministerio",
  ingresos: "Ingresos por periodo",
};

interface Datos {
  miembros: Miembro[];
  eventos: Evento[];
  ministerios: Ministerio[];
  asistencias: Asistencia[];
  aportaciones: Aportacion[];
}

export default function Reportes() {
  const { db, usuario, repo, sedeId, hoy } = useDatos();
  const sede = db.sedes.find((s) => s.id === sedeId);
  const permitidos = reportesPermitidos(usuario!.rol);
  // Cada rol carga solo lo que necesitan sus reportes
  const rol = usuario!.rol;
  const cargar = useCallback(async (): Promise<Datos> => {
    const usa = (r: string) => reportesPermitidos(rol).includes(r);
    const nada = Promise.resolve([]);
    const [miembros, eventos, ministerios, asistencias, aportaciones] = await Promise.all([
      usa("miembros") || usa("ministerios") ? repo.miembros.listar(sedeId) : nada,
      usa("asistencia") || usa("ministerios") ? repo.eventos.listar(sedeId) : nada,
      usa("miembros") || usa("ministerios") || usa("asistencia") ? repo.ministerios.listar(sedeId) : nada,
      usa("asistencia") || usa("ministerios") ? repo.asistencias.listar(sedeId) : nada,
      usa("ingresos") ? repo.aportaciones.listar(sedeId) : nada,
    ]);
    return { miembros, eventos, ministerios, asistencias, aportaciones };
  }, [repo, sedeId, rol]);
  const { datos, cargando, error } = useCarga<Datos>(cargar, { miembros: [], eventos: [], ministerios: [], asistencias: [], aportaciones: [] });
  const { miembros, eventos, ministerios, asistencias, aportaciones } = datos;
  const [exportando, setExportando] = useState(false);
  const [errorExportar, setErrorExportar] = useState("");
  const [tipo, setTipo] = useState(permitidos[0]);
  const hace3Meses = useMemo(() => {
    const d = aFecha(hoy);
    d.setMonth(d.getMonth() - 3);
    return `${iso(d).slice(0, 7)}-01`;
  }, [hoy]);
  const [desde, setDesde] = useState(hace3Meses);
  const [hasta, setHasta] = useState(hoy);

  const soloMios = usuario!.rol === "coordinador";
  const minsVisibles = useMemo(
    () => (soloMios ? ministerios.filter((m) => usuario!.miembroId && m.coordinadorId === usuario!.miembroId) : ministerios),
    [soloMios, ministerios, usuario]
  );

  const reporte = useMemo((): { columnas: string[]; filas: Valor[][]; moneda?: number[] } => {
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
              const regs = asistencias.filter((a) => a.eventoId === e.id);
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
            const regs = asistencias.filter((a) => acts.some((e) => e.id === a.eventoId));
            const prom = regs.length ? `${Math.round((regs.filter((a) => a.presente).length / regs.length) * 100)}%` : "—";
            return [m.nombre, miembros.find((x) => x.id === m.coordinadorId)?.nombre ?? "Sin asignar", m.integrantes.length, acts.length, prom];
          }),
        };
      case "ingresos": {
        const t = new Map<string, Record<string, number>>();
        aportaciones.filter((a) => enPeriodo(a.fecha) && !a.anulada).forEach((a) => {
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
          moneda: [1, 2, 3, 4],
        };
      }
      default:
        return { columnas: [], filas: [] };
    }
  }, [tipo, desde, hasta, miembros, ministerios, minsVisibles, eventos, aportaciones, asistencias, hoy, soloMios]);

  if (!permitidos.length) return <SinAcceso />;
  const usaPeriodo = tipo !== "miembros";
  const completo: Reporte = {
    titulo: NOMBRES[tipo],
    subtitulo: `${db.configuracion.nombre} · ${sede?.nombre ?? ""}${usaPeriodo ? ` · del ${fechaCorta(desde)} al ${fechaCorta(hasta)}` : ""}`,
    ...reporte,
  };
  const exportar = async (formato: "excel" | "pdf") => {
    setExportando(true);
    setErrorExportar(await intentar(() => (formato === "excel" ? exportarExcel(completo) : exportarPdf(completo))));
    setExportando(false);
  };
  // Columnas con números o porcentajes van alineadas a la derecha
  const numerica = (j: number) => j > 0 && reporte.filas.some((f) => typeof f[j] === "number" || /%$/.test(String(f[j])));
  const mostrar = (i: number, v: Valor) => (reporte.moneda?.includes(i) ? mxn(Number(v)) : v);

  return (
    <>
      <div className="print:hidden">
        <Encabezado
          titulo="Reportes"
          descripcion={`Información de ${sede?.nombre ?? ""}`}
          acciones={
            <>
              <Boton disabled={exportando || cargando} onClick={() => exportar("excel")}>
                <FileSpreadsheet size={16} /> Exportar a Excel
              </Boton>
              <Boton disabled={exportando || cargando} onClick={() => exportar("pdf")}>
                <FileText size={16} /> Exportar a PDF
              </Boton>
            </>
          }
          dibujo={<Dibujo nombre="libro" />}
          fondo="/pixel/fondo-reportes.jpg"
        >
          <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
            {[
              ["Reportes disponibles", permitidos.length],
              ["Registros", reporte.filas.length],
            ].map(([texto, valor]) => (
              <div key={texto}>
                <dt className="text-xs font-bold uppercase tracking-wider text-dorado-300">{texto}</dt>
                <dd className="font-titulo text-3xl font-semibold"><Contador valor={valor as number} /></dd>
              </div>
            ))}
          </dl>
        </Encabezado>
        {(error || errorExportar) && <p className="mb-4 bg-liston-50 px-3 py-2 text-sm text-liston-700">{error || errorExportar}</p>}
        <div className="mb-4">
          <Pestanas valor={tipo} alCambiar={setTipo} opciones={permitidos.map((p) => ({ valor: p, texto: NOMBRES[p] }))} />
        </div>
      </div>

      <Tarjeta>
        <div className="flex flex-wrap items-end justify-between gap-3 border-b-2 border-piedra-200 p-4">
          <div>
            <h2 className="font-titulo text-xl font-semibold">{NOMBRES[tipo]}</h2>
            <p className="text-xs text-piedra-500">{completo.subtitulo}</p>
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
            <tr>{reporte.columnas.map((c, j) => <th key={c} className={`${th} ${numerica(j) ? "text-right!" : ""}`}>{c}</th>)}</tr>
          </thead>
          <tbody>
            {reporte.filas.map((f, i) => (
              <tr key={i}>
                {f.map((v, j) => (
                  <td key={j} className={`${td} ${j > 0 && j < 4 ? "whitespace-nowrap" : ""} ${numerica(j) ? "text-right tabular-nums" : ""}`}>
                    {reporte.columnas[j] === "% asistencia" && v !== "—" ? <Porcentaje texto={String(v)} /> : mostrar(j, v)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          {tipo === "ingresos" && reporte.filas.length > 0 && (
            <tfoot>
              <tr className="border-t-2 border-piedra-800 bg-piedra-100 font-titulo font-semibold">
                {reporte.columnas.map((c, j) => (
                  <td key={c} className={`${td} ${j ? "text-right tabular-nums" : ""}`}>
                    {j ? mostrar(j, reporte.filas.reduce((suma, f) => suma + Number(f[j]), 0)) : "Total"}
                  </td>
                ))}
              </tr>
            </tfoot>
          )}
        </Tabla>
        {cargando ? <Vacio>Cargando…</Vacio> : <p className="p-4 text-xs text-piedra-500">{reporte.filas.length} registros</p>}
      </Tarjeta>
    </>
  );
}

// Porcentaje con una barrita de bloques, como en asistencia
function Porcentaje({ texto }: { texto: string }) {
  const llenos = Math.round(parseInt(texto) / 10);
  return (
    <span className="inline-flex items-center gap-2">
      <span className="grid h-3 w-20 grid-cols-10 gap-px border-2 border-piedra-900 bg-piedra-200 p-px" aria-hidden>
        {Array.from({ length: 10 }, (_, i) => <span key={i} className={i < llenos ? "bg-olivo-600" : "bg-piedra-50"} />)}
      </span>
      {texto}
    </span>
  );
}
