"use client";

import { Check, Search, X } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { Avatar, Boton, Campo, Contador, Dibujo, Encabezado, Entrada, Selector, SinAcceso, Tabla, Tarjeta, Vacio, td, th } from "@/components/ui";
import { fechaCorta } from "@/lib/formato";
import { acceso } from "@/lib/permisos";
import { useDatos } from "@/lib/store";
import type { Asistencia as RegistroAsistencia, Evento, Miembro, Ministerio } from "@/lib/types";
import { intentar, useCarga } from "@/lib/usar-carga";

interface Datos {
  eventos: Evento[];
  ministerios: Ministerio[];
  miembros: Miembro[];
  asistencias: RegistroAsistencia[];
}

export default function Asistencia() {
  const { usuario, repo, sedeId, hoy } = useDatos();
  const permiso = acceso(usuario!.rol, "asistencia");
  const cargar = useCallback(async (): Promise<Datos> => {
    if (!permiso) return { eventos: [], ministerios: [], miembros: [], asistencias: [] };
    const [eventos, ministerios, miembros, asistencias] = await Promise.all([
      repo.eventos.listar(sedeId),
      repo.ministerios.listar(sedeId),
      repo.miembros.listar(sedeId),
      repo.asistencias.listar(sedeId),
    ]);
    return { eventos, ministerios, miembros, asistencias };
  }, [repo, sedeId, permiso]);
  const { datos, cargando, error, recargar } = useCarga<Datos>(cargar, { eventos: [], ministerios: [], miembros: [], asistencias: [] });
  const { eventos, ministerios, miembros, asistencias } = datos;
  const misMinisterios = useMemo(
    () => ministerios.filter((m) => usuario!.miembroId && m.coordinadorId === usuario!.miembroId),
    [ministerios, usuario]
  );

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
  const [guardando, setGuardando] = useState(false);
  const [errorGuardar, setErrorGuardar] = useState("");
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
      asistencias.filter((a) => a.eventoId === evento.id).map((a) => [a.miembroId, a.presente])
    );
    setMarcas(previas);
    setCargadoPara(evento.id);
    setGuardado(false);
    setErrorGuardar("");
  }

  const historial = useMemo(
    () =>
      elegibles.slice(0, 12).map((e) => {
        const regs = asistencias.filter((a) => a.eventoId === e.id);
        const presentes = regs.filter((a) => a.presente).length;
        return { evento: e, presentes, total: regs.length };
      }),
    [elegibles, asistencias]
  );

  if (!permiso) return <SinAcceso />;

  const presentes = convocados.filter((m) => marcas[m.id]).length;
  const visibles = convocados.filter((m) => m.nombre.toLowerCase().includes(busqueda.trim().toLowerCase()));

  const guardar = async () => {
    if (!evento) return;
    setGuardando(true);
    const fallo = await intentar(() =>
      repo.asistencias.guardar(
        evento.id,
        convocados.map((m) => ({ eventoId: evento.id, miembroId: m.id, presente: !!marcas[m.id] }))
      )
    );
    setGuardando(false);
    setErrorGuardar(fallo);
    setGuardado(!fallo);
    recargar();
  };

  return (
    <>
      <Encabezado
        titulo="Control de asistencia"
        descripcion="Selecciona el evento y marca a los presentes"
        dibujo={<Dibujo nombre="bancas" />}
        fondo="/pixel/fondo-asistencia.jpg"
      >
        {evento && (
          <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
            <div>
              <dt className="text-xs font-bold uppercase tracking-wider text-dorado-300">Presentes</dt>
              <dd className="font-titulo text-3xl font-semibold"><Contador valor={presentes} /></dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase tracking-wider text-dorado-300">Convocados</dt>
              <dd className="font-titulo text-3xl font-semibold"><Contador valor={convocados.length} /></dd>
            </div>
            <div className="max-w-56">
              <dt className="text-xs font-bold uppercase tracking-wider text-dorado-300">Lista de</dt>
              <dd className="mt-1 truncate font-bold">{evento.titulo}</dd>
              <dd className="text-sm text-piedra-100">{fechaCorta(evento.fecha)}, {evento.hora}</dd>
            </div>
          </dl>
        )}
      </Encabezado>
      {error && <p className="mb-4 bg-liston-50 px-3 py-2 text-sm text-liston-700">{error}</p>}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <Tarjeta className="lg:col-span-3">
          <div className="grid gap-3 border-b border-piedra-200 p-4 sm:grid-cols-2">
            <Campo etiqueta="Evento">
              <Selector value={evento?.id ?? ""} onChange={(e) => setEventoId(e.target.value)}>
                {elegibles.map((e) => (
                  <option key={e.id} value={e.id}>{fechaCorta(e.fecha)} · {e.titulo}</option>
                ))}
              </Selector>
            </Campo>
            <Campo etiqueta="Buscar">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-piedra-400" />
                <Entrada className="pl-9" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Nombre" />
              </div>
            </Campo>
          </div>
          {evento ? (
            <>
              <div className="space-y-3 border-b-2 border-piedra-200 px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span>
                    <strong>{presentes}</strong> presentes · <strong>{convocados.length - presentes}</strong> ausentes
                  </span>
                  <div className="flex gap-2">
                    <Boton variante="secundario" onClick={() => setMarcas(Object.fromEntries(convocados.map((m) => [m.id, true])))}>Todos presentes</Boton>
                    <Boton disabled={guardando} onClick={guardar}>Guardar asistencia</Boton>
                  </div>
                </div>
                <Barra valor={presentes} total={convocados.length} />
              </div>
              {guardado && <p className="mx-4 mt-3 flex items-center gap-2 border-2 border-olivo-600 bg-olivo-50 px-3 py-2 text-sm font-semibold text-olivo-700"><Check size={16} /> Asistencia guardada.</p>}
              {errorGuardar && <p className="mx-4 mt-3 bg-liston-50 px-3 py-2 text-sm text-liston-700">{errorGuardar}</p>}
              <ul className="max-h-[480px] divide-y divide-piedra-200 overflow-y-auto">
                {visibles.map((m) => (
                  <li key={m.id} className={`flex items-center justify-between gap-3 px-4 py-2 transition-colors ${marcas[m.id] ? "bg-olivo-50/60" : ""}`}>
                    <span className="flex items-center gap-3 text-sm font-semibold text-piedra-900"><Avatar nombre={m.nombre} />{m.nombre}</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setMarcas({ ...marcas, [m.id]: true })}
                        aria-pressed={!!marcas[m.id]}
                        className={`${marca} ${marcas[m.id] ? "translate-x-[2px] translate-y-[2px] bg-olivo-600 text-white" : "bg-piedra-50 text-piedra-700 shadow-[2px_2px_0_0_var(--color-piedra-900)] hover:bg-olivo-50"}`}
                      >
                        <Check size={14} /> Presente
                      </button>
                      <button
                        onClick={() => setMarcas({ ...marcas, [m.id]: false })}
                        aria-pressed={!marcas[m.id]}
                        className={`${marca} ${!marcas[m.id] ? "translate-x-[2px] translate-y-[2px] bg-piedra-600 text-white" : "bg-piedra-50 text-piedra-700 shadow-[2px_2px_0_0_var(--color-piedra-900)] hover:bg-piedra-100"}`}
                      >
                        <X size={14} /> Ausente
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          ) : cargando ? (
            <Vacio>Cargando…</Vacio>
          ) : (
            <p className="p-6 text-sm text-piedra-500">No hay eventos disponibles para pasar lista.</p>
          )}
        </Tarjeta>

        <Tarjeta className="lg:col-span-2">
          <h2 className="border-b-2 border-piedra-200 p-4 font-titulo text-xl font-semibold">Historial reciente</h2>
          <Tabla>
            <thead>
              <tr><th className={th}>Evento</th><th className={th}>Presentes</th></tr>
            </thead>
            <tbody>
              {historial.map(({ evento: e, presentes: p, total }) => (
                <tr key={e.id} className={`cursor-pointer ${e.id === evento?.id ? "bg-dorado-100" : ""}`} onClick={() => setEventoId(e.id)}>
                  <td className={td}>
                    <p className="font-medium text-piedra-900">{e.titulo}</p>
                    <p className="text-xs text-piedra-500">{fechaCorta(e.fecha)}</p>
                  </td>
                  <td className={td}>
                    {total ? (
                      <div className="w-28 space-y-1">
                        <p className="text-xs font-bold text-piedra-700">{p} de {total}</p>
                        <Barra valor={p} total={total} chica />
                      </div>
                    ) : (
                      <span className="text-xs text-piedra-500">Sin registro</span>
                    )}
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

const marca = "flex items-center gap-1 border-2 border-piedra-900 px-2.5 py-1 text-xs font-bold transition-[background-color,transform,box-shadow] duration-75";

// Barra de avance en bloques, como la vida de un personaje de videojuego
function Barra({ valor, total, chica = false }: { valor: number; total: number; chica?: boolean }) {
  const bloques = chica ? 10 : 20;
  const llenos = total ? Math.round((valor / total) * bloques) : 0;
  return (
    <div
      role="meter"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={valor}
      aria-label="Asistencia"
      className={`grid gap-0.5 border-2 border-piedra-900 bg-piedra-200 p-0.5 ${chica ? "h-3" : "h-5"}`}
      style={{ gridTemplateColumns: `repeat(${bloques}, 1fr)` }}
    >
      {Array.from({ length: bloques }, (_, i) => (
        <span key={i} className={`transition-colors duration-300 ${i < llenos ? "animate-bloque bg-olivo-600" : "bg-piedra-50"}`} style={{ transitionDelay: `${i * 15}ms`, animationDelay: `${150 + i * 45}ms` }} />
      ))}
    </div>
  );
}
