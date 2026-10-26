"use client";

import { Building2, CalendarDays, ClipboardCheck, HandCoins, UserPlus, Users, UsersRound } from "lucide-react";
import Link from "next/link";
import { useCallback, useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Encabezado, Etiqueta, Indicador, Tarjeta } from "@/components/ui";
import { fechaCorta, fechaLarga, mesCorto, mxn } from "@/lib/formato";
import { puedeVer, veFinanzas } from "@/lib/permisos";
import { useDatos, useSede } from "@/lib/store";
import type { Asistencia, Evento, Horario, Miembro } from "@/lib/types";
import { useCarga } from "@/lib/usar-carga";

export default function Panel() {
  const { modo } = useDatos();
  return modo === "demo" ? <PanelDemo /> : <PanelBasico />;
}

interface DatosPanel {
  miembros: Miembro[];
  horarios: Horario[];
  eventos: Evento[];
  asistencias: Asistencia[];
}

// Panel con datos reales: miembros, horarios, eventos y asistencia de la sede.
// Las cifras financieras llegan en la Fase 3.
function PanelBasico() {
  const { usuario, repo, sedeId, db, hoy } = useDatos();
  const sede = db.sedes.find((s) => s.id === sedeId);
  const veAsistencia = puedeVer(usuario!.rol, "asistencia");
  const cargar = useCallback(async (): Promise<DatosPanel> => {
    const [miembros, horarios, eventos, asistencias] = await Promise.all([
      repo.miembros.listar(sedeId),
      repo.horarios.listar(sedeId),
      repo.eventos.listar(sedeId),
      veAsistencia ? repo.asistencias.listar(sedeId) : Promise.resolve([]),
    ]);
    return { miembros, horarios, eventos, asistencias };
  }, [repo, sedeId, veAsistencia]);
  const { datos } = useCarga<DatosPanel>(cargar, { miembros: [], horarios: [], eventos: [], asistencias: [] });
  const activos = datos.miembros.filter((m) => m.activo).length;
  const delMes = datos.miembros.filter((m) => m.fechaIngreso.startsWith(hoy.slice(0, 7))).length;
  const vigentes = datos.eventos.filter((e) => !e.cancelado);
  const eventosMes = vigentes.filter((e) => e.fecha.startsWith(hoy.slice(0, 7))).length;
  const proximos = vigentes
    .filter((e) => e.fecha >= hoy)
    .sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora))
    .slice(0, 6);
  // Último culto dominical con lista registrada
  const ultimoCulto = vigentes
    .filter((e) => e.tipo === "Culto dominical" && e.fecha <= hoy)
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
    .map((e) => ({ evento: e, regs: datos.asistencias.filter((a) => a.eventoId === e.id) }))
    .find((x) => x.regs.length > 0);

  return (
    <>
      <Encabezado titulo={`Hola, ${usuario!.nombre.split(" ")[0]}`} descripcion={`Resumen de ${sede?.nombre ?? ""} · ${fechaLarga(hoy)}`} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Indicador titulo="Miembros activos" valor={activos} detalle={`de ${datos.miembros.length} registrados`} icono={<Users size={18} />} />
        <Indicador titulo="Nuevos este mes" valor={delMes} detalle="por fecha de ingreso" icono={<UserPlus size={18} />} />
        <Indicador titulo="Eventos este mes" valor={eventosMes} detalle={proximos.length ? `próximo: ${fechaCorta(proximos[0].fecha)}` : "sin próximos"} icono={<CalendarDays size={18} />} />
        {veAsistencia ? (
          <Indicador
            titulo="Asistencia último culto"
            valor={ultimoCulto ? ultimoCulto.regs.filter((a) => a.presente).length : "—"}
            detalle={ultimoCulto ? `de ${ultimoCulto.regs.length} · ${fechaCorta(ultimoCulto.evento.fecha)}` : "sin registros"}
            icono={<ClipboardCheck size={18} />}
          />
        ) : (
          <Indicador titulo="Sedes" valor={db.sedes.length} detalle="en el sistema" icono={<Building2 size={18} />} />
        )}
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Tarjeta className="p-5">
          <h2 className="mb-3 font-semibold">Horarios de reunión</h2>
          <ul className="space-y-1 text-sm">
            {datos.horarios.map((h) => (
              <li key={h.id} className="flex justify-between"><span>{h.dia} · {h.tipo}</span><span className="text-slate-500">{h.hora}</span></li>
            ))}
            {datos.horarios.length === 0 && <li className="text-slate-500">Sin horarios registrados.</li>}
          </ul>
        </Tarjeta>
        <Tarjeta className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Próximos eventos</h2>
            <Link href="/eventos" className="text-sm text-indigo-600 hover:underline">Ver calendario</Link>
          </div>
          <ul className="space-y-2 text-sm">
            {proximos.map((e) => (
              <li key={e.id} className="flex justify-between gap-2">
                <span className="truncate">{e.titulo}</span>
                <span className="whitespace-nowrap text-slate-500">{fechaCorta(e.fecha)} · {e.hora}</span>
              </li>
            ))}
            {proximos.length === 0 && <li className="text-slate-500">No hay eventos programados.</li>}
          </ul>
        </Tarjeta>
      </div>
    </>
  );
}

function PanelDemo() {
  const { db, usuario, hoy } = useDatos();
  const { sede, miembros, eventos, ministerios, aportaciones, anuncios } = useSede();
  const finanzas = veFinanzas(usuario!.rol);
  const mesActual = hoy.slice(0, 7);

  const datos = useMemo(() => {
    const idsEventos = new Set(eventos.map((e) => e.id));
    const asistenciasSede = db.asistencias.filter((a) => idsEventos.has(a.eventoId) && a.presente);
    const eventosDelMes = new Set(eventos.filter((e) => e.fecha.startsWith(mesActual)).map((e) => e.id));

    const proximos = eventos
      .filter((e) => e.fecha >= hoy && !e.cancelado)
      .sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora));

    // Asistencia a los últimos 8 cultos dominicales
    const cultos = eventos
      .filter((e) => e.tipo === "Culto dominical" && e.fecha < hoy)
      .sort((a, b) => a.fecha.localeCompare(b.fecha))
      .slice(-8)
      .map((e) => ({
        fecha: fechaCorta(e.fecha).replace(/ \d{4}$/, ""),
        asistentes: asistenciasSede.filter((a) => a.eventoId === e.id).length,
      }));

    // Ingresos de los últimos 6 meses
    const porMes = new Map<string, number>();
    aportaciones.forEach((a) => {
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
      asistenciasMes: asistenciasSede.filter((a) => eventosDelMes.has(a.eventoId)).length,
      cultos,
      ingresos,
      ingresoMes: porMes.get(mesActual) ?? 0,
    };
  }, [db.asistencias, eventos, miembros, aportaciones, hoy, mesActual]);

  const avisos = anuncios
    .filter((a) => a.fechaPublicacion <= hoy)
    .sort((a, b) => Number(b.importante) - Number(a.importante) || b.fechaPublicacion.localeCompare(a.fechaPublicacion))
    .slice(0, 3);

  return (
    <>
      <Encabezado titulo={`Hola, ${usuario!.nombre.split(" ")[0]}`} descripcion={`Resumen de ${sede.nombre} · ${fechaLarga(hoy)}`} />

      <div className={`grid gap-4 sm:grid-cols-2 ${finanzas ? "xl:grid-cols-5" : "xl:grid-cols-4"}`}>
        <Indicador titulo="Miembros activos" valor={datos.activos} detalle={`de ${miembros.length} registrados`} icono={<Users size={18} />} />
        <Indicador titulo="Eventos próximos" valor={datos.proximos.length} detalle="programados desde hoy" icono={<CalendarDays size={18} />} />
        <Indicador titulo="Asistencias del mes" valor={datos.asistenciasMes} detalle="presencias registradas" icono={<ClipboardCheck size={18} />} />
        <Indicador titulo="Ministerios" valor={ministerios.length} detalle="grupos de trabajo" icono={<UsersRound size={18} />} />
        {finanzas && (
          <Indicador titulo="Ingresos del mes" valor={mxn(datos.ingresoMes)} detalle="solo visible para roles autorizados" icono={<HandCoins size={18} />} />
        )}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Tarjeta className="p-5">
          <h2 className="font-semibold">Asistencia a cultos dominicales</h2>
          <p className="mb-4 text-xs text-slate-500">Personas presentes en los últimos 8 domingos</p>
          <div className="h-60">
            <ResponsiveContainer>
              <LineChart data={datos.cultos} margin={{ left: -20, right: 8 }}>
                <CartesianGrid stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="fecha" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="asistentes" name="Asistentes" stroke="#4f46e5" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Tarjeta>

        {finanzas ? (
          <Tarjeta className="p-5">
            <h2 className="font-semibold">Ingresos por mes</h2>
            <p className="mb-4 text-xs text-slate-500">Aportaciones registradas en pesos (MXN)</p>
            <div className="h-60">
              <ResponsiveContainer>
                <BarChart data={datos.ingresos} margin={{ left: 0, right: 8 }}>
                  <CartesianGrid stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${Math.round(v / 1000)}k`} />
                  <Tooltip formatter={(v) => mxn(Number(v))} />
                  <Bar dataKey="total" name="Ingresos" fill="#4f46e5" radius={[4, 4, 0, 0]} />
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

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Tarjeta className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Próximos eventos</h2>
            <Link href="/eventos" className="text-sm text-indigo-600 hover:underline">Ver calendario</Link>
          </div>
          <ul className="divide-y divide-slate-100">
            {datos.proximos.slice(0, 5).map((e) => (
              <li key={e.id} className="flex items-center justify-between py-2.5">
                <div>
                  <p className="text-sm font-medium">{e.titulo}</p>
                  <p className="text-xs text-slate-500">{fechaLarga(e.fecha)} · {e.hora} · {e.lugar}</p>
                </div>
                <Etiqueta tono="indigo">{e.tipo}</Etiqueta>
              </li>
            ))}
          </ul>
        </Tarjeta>
        {finanzas && (
          <Tarjeta className="p-5">
            <h2 className="mb-3 font-semibold">Avisos</h2>
            <ListaAvisos avisos={avisos} />
          </Tarjeta>
        )}
      </div>
    </>
  );
}

function ListaAvisos({ avisos }: { avisos: ReturnType<typeof useSede>["anuncios"] }) {
  return (
    <ul className="space-y-3">
      {avisos.map((a) => (
        <li key={a.id} className="rounded-lg border border-slate-100 p-3">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium">{a.titulo}</p>
            {a.importante && <Etiqueta tono="ambar">Importante</Etiqueta>}
          </div>
          <p className="mt-1 text-sm text-slate-600">{a.contenido}</p>
        </li>
      ))}
    </ul>
  );
}
