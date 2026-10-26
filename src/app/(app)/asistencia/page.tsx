"use client";

import { Check, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Boton, Campo, Encabezado, Entrada, Etiqueta, Selector, SinAcceso, Tabla, Tarjeta, td, th } from "@/components/ui";
import { fechaCorta } from "@/lib/formato";
import { acceso } from "@/lib/permisos";
import { useDatos, useSede } from "@/lib/store";

export default function Asistencia() {
  const { db, usuario, actualizar, hoy } = useDatos();
  const { eventos, miembros, ministerios, misMinisterios } = useSede();
  const permiso = acceso(usuario!.rol, "asistencia");

  // El coordinador solo pasa lista en los eventos de su ministerio
  const elegibles = useMemo(() => {
    const ids = new Set(misMinisterios.map((m) => m.id));
    return eventos
      .filter((e) => e.fecha <= hoy && !e.cancelado)
      .filter((e) => permiso !== "ministerio" || (e.ministerioId && ids.has(e.ministerioId)))
      .sort((a, b) => b.fecha.localeCompare(a.fecha));
  }, [eventos, hoy, permiso, misMinisterios]);

  const [eventoId, setEventoId] = useState(elegibles[0]?.id ?? "");
  const [busqueda, setBusqueda] = useState("");
  const [guardado, setGuardado] = useState(false);
  const evento = elegibles.find((e) => e.id === eventoId) ?? elegibles[0];

  // Lista de convocados: integrantes del ministerio o todos los miembros activos
  const convocados = useMemo(() => {
    if (!evento) return [];
    const min = ministerios.find((m) => m.id === evento.ministerioId);
    const base = min ? miembros.filter((m) => min.integrantes.includes(m.id)) : miembros.filter((m) => m.activo);
    return base.sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [evento, ministerios, miembros]);

  const [marcas, setMarcas] = useState<Record<string, boolean>>({});
  const [cargadoPara, setCargadoPara] = useState("");
  if (evento && cargadoPara !== evento.id) {
    const previas = Object.fromEntries(
      db.asistencias.filter((a) => a.eventoId === evento.id).map((a) => [a.miembroId, a.presente])
    );
    setMarcas(previas);
    setCargadoPara(evento.id);
    setGuardado(false);
  }

  const historial = useMemo(
    () =>
      elegibles.slice(0, 12).map((e) => {
        const regs = db.asistencias.filter((a) => a.eventoId === e.id);
        const presentes = regs.filter((a) => a.presente).length;
        return { evento: e, presentes, total: regs.length };
      }),
    [elegibles, db.asistencias]
  );

  if (!permiso) return <SinAcceso />;

  const presentes = convocados.filter((m) => marcas[m.id]).length;
  const visibles = convocados.filter((m) => m.nombre.toLowerCase().includes(busqueda.trim().toLowerCase()));

  const guardar = () => {
    if (!evento) return;
    actualizar((d) => ({
      ...d,
      asistencias: [
        ...d.asistencias.filter((a) => a.eventoId !== evento.id),
        ...convocados.map((m) => ({ eventoId: evento.id, miembroId: m.id, presente: !!marcas[m.id] })),
      ],
    }));
    setGuardado(true);
  };

  return (
    <>
      <Encabezado titulo="Control de asistencia" descripcion="Selecciona el evento y marca a los presentes" />
      <div className="grid gap-4 lg:grid-cols-5">
        <Tarjeta className="lg:col-span-3">
          <div className="grid gap-3 border-b border-slate-200 p-4 sm:grid-cols-2">
            <Campo etiqueta="Evento">
              <Selector value={evento?.id ?? ""} onChange={(e) => setEventoId(e.target.value)}>
                {elegibles.map((e) => (
                  <option key={e.id} value={e.id}>{fechaCorta(e.fecha)} · {e.titulo}</option>
                ))}
              </Selector>
            </Campo>
            <Campo etiqueta="Buscar">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Entrada className="pl-9" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Nombre" />
              </div>
            </Campo>
          </div>
          {evento ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                <span>
                  <strong>{presentes}</strong> presentes · <strong>{convocados.length - presentes}</strong> ausentes
                </span>
                <div className="flex gap-2">
                  <Boton variante="secundario" onClick={() => setMarcas(Object.fromEntries(convocados.map((m) => [m.id, true])))}>Todos presentes</Boton>
                  <Boton onClick={guardar}>Guardar asistencia</Boton>
                </div>
              </div>
              {guardado && <p className="mx-4 mb-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">Asistencia guardada.</p>}
              <ul className="max-h-[480px] divide-y divide-slate-100 overflow-y-auto">
                {visibles.map((m) => (
                  <li key={m.id} className="flex items-center justify-between px-4 py-2">
                    <span className="text-sm">{m.nombre}</span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setMarcas({ ...marcas, [m.id]: true })}
                        className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium ${marcas[m.id] ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"}`}
                      >
                        <Check size={14} /> Presente
                      </button>
                      <button
                        onClick={() => setMarcas({ ...marcas, [m.id]: false })}
                        className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium ${!marcas[m.id] ? "bg-red-500 text-white" : "bg-slate-100 text-slate-600"}`}
                      >
                        <X size={14} /> Ausente
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="p-6 text-sm text-slate-500">No hay eventos disponibles para pasar lista.</p>
          )}
        </Tarjeta>

        <Tarjeta className="lg:col-span-2">
          <h2 className="border-b border-slate-200 p-4 font-semibold">Historial reciente</h2>
          <Tabla>
            <thead>
              <tr><th className={th}>Evento</th><th className={th}>Presentes</th></tr>
            </thead>
            <tbody>
              {historial.map(({ evento: e, presentes: p, total }) => (
                <tr key={e.id} className="cursor-pointer hover:bg-slate-50" onClick={() => setEventoId(e.id)}>
                  <td className={td}>
                    <p className="font-medium text-slate-900">{e.titulo}</p>
                    <p className="text-xs text-slate-500">{fechaCorta(e.fecha)}</p>
                  </td>
                  <td className={td}>
                    {total ? <Etiqueta tono={p / total >= 0.7 ? "verde" : "ambar"}>{p} de {total}</Etiqueta> : <Etiqueta>Sin registro</Etiqueta>}
                  </td>
                </tr>
              ))}
            </tbody>
          </Tabla>
        </Tarjeta>
      </div>
    </>
  );
}
