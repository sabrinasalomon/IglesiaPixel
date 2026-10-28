"use client";

import { CalendarDays, ClipboardCheck, HandCoins, Users, UsersRound } from "lucide-react";
import Link from "next/link";
import { useCallback, useMemo } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Encabezado, Etiqueta, FichaFecha, Indicador, Tarjeta } from "@/components/ui";
import { fechaCorta, fechaLarga, mesCorto, mxn } from "@/lib/formato";
import { puedeVer, veFinanzas } from "@/lib/permisos";
import { useDatos } from "@/lib/store";
import type { Anuncio, Aportacion, Asistencia, Evento, Miembro, Ministerio } from "@/lib/types";
import { useCarga } from "@/lib/usar-carga";

interface DatosPanel {
  miembros: Miembro[];
  eventos: Evento[];
  ministerios: Ministerio[];
  asistencias: Asistencia[];
  aportaciones: Aportacion[];
  anuncios: Anuncio[];
}

const VACIO: DatosPanel = { miembros: [], eventos: [], ministerios: [], asistencias: [], aportaciones: [], anuncios: [] };

// Estilo común de las gráficas, alineado con la paleta de marca
const MARCA = "#3049d4";
const EJE = { fontSize: 12, fill: "#64748b" };
const CUADRICULA = "#eef0f5";
const GLOBO = {
  contentStyle: { borderRadius: 12, border: "1px solid #e2e8f0", boxShadow: "0 8px 24px -8px rgba(15,23,42,.18)", fontSize: 12 },
  cursor: { stroke: "#c0cffb", fill: "#eef3ff" },
};

// Panel principal: indicadores de la sede activa. Cada rol solo carga lo que
// puede ver; las cifras financieras son para administrador, pastor y tesorero.
export default function Panel() {
  const { db, usuario, repo, sedeId, hoy } = useDatos();
  const sede = db.sedes.find((s) => s.id === sedeId);
  const rol = usuario!.rol;
  const finanzas = veFinanzas(rol);
  const veAsistencia = puedeVer(rol, "asistencia");
  const mesActual = hoy.slice(0, 7);

  const cargar = useCallback(async (): Promise<DatosPanel> => {
    const nada = Promise.resolve([]);
    const [miembros, eventos, ministerios, asistencias, aportaciones, anuncios] = await Promise.all([
      repo.miembros.listar(sedeId),
      repo.eventos.listar(sedeId),
      puedeVer(rol, "ministerios") ? repo.ministerios.listar(sedeId) : nada,
      veAsistencia ? repo.asistencias.listar(sedeId) : nada,
      finanzas ? repo.aportaciones.listar(sedeId) : nada,
      repo.anuncios.listar(sedeId),
    ]);
    return { miembros, eventos, ministerios, asistencias, aportaciones, anuncios };
  }, [repo, sedeId, rol, veAsistencia, finanzas]);
  const { datos: d } = useCarga<DatosPanel>(cargar, VACIO);
  const { miembros, ministerios, anuncios } = d;

  const datos = useMemo(() => {
    const eventos = d.eventos.filter((e) => !e.cancelado);
    const presentes = d.asistencias.filter((a) => a.presente);
    const eventosDelMes = new Set(eventos.filter((e) => e.fecha.startsWith(mesActual)).map((e) => e.id));

    const proximos = eventos
      .filter((e) => e.fecha >= hoy)
      .sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora));

    // Asistencia a los últimos 8 cultos dominicales
    const cultos = eventos
      .filter((e) => e.tipo === "Culto dominical" && e.fecha < hoy)
      .sort((a, b) => a.fecha.localeCompare(b.fecha))
      .slice(-8)
      .map((e) => ({
        fecha: fechaCorta(e.fecha).replace(/ \d{4}$/, ""),
        asistentes: presentes.filter((a) => a.eventoId === e.id).length,
      }));

    // Ingresos de los últimos 6 meses (sin las aportaciones anuladas)
    const porMes = new Map<string, number>();
    d.aportaciones
      .filter((a) => !a.anulada)
      .forEach((a) => {
        const clave = a.fecha.slice(0, 7);
        porMes.set(clave, (porMes.get(clave) ?? 0) + a.monto);
      });
    const ingresos = [...porMes.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([mes, total]) => ({ mes: mesCorto(mes), total }));

    return {
      activos: miembros.filter((m) => m.activo).length,
      proximos,
      asistenciasMes: presentes.filter((a) => eventosDelMes.has(a.eventoId)).length,
      cultos,
      ingresos,
      ingresoMes: porMes.get(mesActual) ?? 0,
    };
  }, [d, miembros, hoy, mesActual]);

  const avisos = anuncios
    .filter((a) => a.fechaPublicacion <= hoy)
    .sort((a, b) => Number(b.importante) - Number(a.importante) || b.fechaPublicacion.localeCompare(a.fechaPublicacion))
    .slice(0, 3);

  return (
    <>
      <Encabezado titulo={`Hola, ${usuario!.nombre.split(" ")[0]}`} descripcion={`Resumen de ${sede?.nombre ?? ""} · ${fechaLarga(hoy)}`} />

      <div className={`grid gap-4 sm:grid-cols-2 ${finanzas && veAsistencia ? "xl:grid-cols-5" : "xl:grid-cols-4"}`}>
        <Indicador titulo="Miembros activos" valor={datos.activos} detalle={`de ${miembros.length} registrados`} icono={<Users size={18} />} tono="marca" />
        <Indicador titulo="Eventos próximos" valor={datos.proximos.length} detalle="programados desde hoy" icono={<CalendarDays size={18} />} tono="cielo" />
        {veAsistencia && (
          <Indicador titulo="Asistencias del mes" valor={datos.asistenciasMes} detalle="presencias registradas" icono={<ClipboardCheck size={18} />} tono="verde" />
        )}
        <Indicador titulo="Ministerios" valor={ministerios.length} detalle="grupos de trabajo" icono={<UsersRound size={18} />} tono="violeta" />
        {finanzas && (
          <Indicador titulo="Ingresos del mes" valor={mxn(datos.ingresoMes)} detalle="solo visible para roles autorizados" icono={<HandCoins size={18} />} tono="dorado" />
        )}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {veAsistencia ? (
          <Tarjeta className="p-5">
            <h2 className="font-semibold">Asistencia a cultos dominicales</h2>
            <p className="mb-4 text-xs text-slate-500">Personas presentes en los últimos 8 domingos</p>
            <div className="h-60">
              <ResponsiveContainer>
                <AreaChart data={datos.cultos} margin={{ left: -20, right: 8, top: 4 }}>
                  <defs>
                    <linearGradient id="relleno-asistencia" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={MARCA} stopOpacity={0.25} />
                      <stop offset="100%" stopColor={MARCA} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke={CUADRICULA} vertical={false} />
                  <XAxis dataKey="fecha" tick={EJE} axisLine={false} tickLine={false} />
                  <YAxis tick={EJE} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip {...GLOBO} />
                  <Area
                    type="monotone"
                    dataKey="asistentes"
                    name="Asistentes"
                    stroke={MARCA}
                    strokeWidth={2.5}
                    fill="url(#relleno-asistencia)"
                    dot={{ r: 3.5, fill: "#fff", strokeWidth: 2 }}
                    activeDot={{ r: 5 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Tarjeta>
        ) : (
          <Tarjeta className="p-5">
            <h2 className="mb-3 font-semibold">Avisos</h2>
            <ListaAvisos avisos={avisos} />
          </Tarjeta>
        )}

        {finanzas ? (
          <Tarjeta className="p-5">
            <h2 className="font-semibold">Ingresos por mes</h2>
            <p className="mb-4 text-xs text-slate-500">Aportaciones registradas en pesos (MXN)</p>
            <div className="h-60">
              <ResponsiveContainer>
                <BarChart data={datos.ingresos} margin={{ left: 0, right: 8, top: 4 }}>
                  <CartesianGrid stroke={CUADRICULA} vertical={false} />
                  <XAxis dataKey="mes" tick={EJE} axisLine={false} tickLine={false} />
                  <YAxis tick={EJE} axisLine={false} tickLine={false} tickFormatter={(v) => `$${Math.round(v / 1000)}k`} />
                  <Tooltip {...GLOBO} formatter={(v) => mxn(Number(v))} />
                  <Bar dataKey="total" name="Ingresos" fill={MARCA} radius={[6, 6, 0, 0]} maxBarSize={44} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Tarjeta>
        ) : (
          <Tarjeta className="p-5">
            <h2 className="mb-3 font-semibold">Avisos</h2>
            <ListaAvisos avisos={avisos} />
          </Tarjeta>
        )}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Tarjeta className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Próximos eventos</h2>
            <Link href="/eventos" className="text-sm font-semibold text-marca-600 hover:underline">Ver calendario</Link>
          </div>
          <ul className="divide-y divide-slate-100">
            {datos.proximos.length === 0 && <li className="py-2.5 text-sm text-slate-500">No hay eventos programados.</li>}
            {datos.proximos.slice(0, 5).map((e) => (
              <li key={e.id} className="flex items-center gap-3 py-3">
                <FichaFecha iso={e.fecha} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-800">{e.titulo}</p>
                  <p className="truncate text-xs text-slate-500">{fechaLarga(e.fecha)} · {e.hora} · {e.lugar}</p>
                </div>
                <span className="hidden sm:inline"><Etiqueta tono="marca">{e.tipo}</Etiqueta></span>
              </li>
            ))}
          </ul>
        </Tarjeta>
        {finanzas && veAsistencia && (
          <Tarjeta className="p-5">
            <h2 className="mb-3 font-semibold">Avisos</h2>
            <ListaAvisos avisos={avisos} />
          </Tarjeta>
        )}
      </div>
    </>
  );
}

function ListaAvisos({ avisos }: { avisos: Anuncio[] }) {
  return (
    <ul className="space-y-3">
      {avisos.length === 0 && <li className="text-sm text-slate-500">No hay avisos publicados.</li>}
      {avisos.map((a) => (
        <li
          key={a.id}
          className={`rounded-xl border p-3.5 ${a.importante ? "border-dorado-200 bg-dorado-50/50" : "border-slate-100 bg-slate-50/50"}`}
        >
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-slate-800">{a.titulo}</p>
            {a.importante && <Etiqueta tono="ambar">Importante</Etiqueta>}
          </div>
          <p className="mt-1 text-sm text-slate-600">{a.contenido}</p>
        </li>
      ))}
    </ul>
  );
}
