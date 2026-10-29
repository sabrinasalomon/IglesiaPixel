"use client";

import { CalendarDays, Plus, UserMinus } from "lucide-react";
import { useCallback, useState } from "react";
import { AreaTexto, Avatar, Boton, Campo, Contador, Dibujo, Encabezado, Entrada, Etiqueta, Modal, Selector, SinAcceso, Tarjeta } from "@/components/ui";
import { fechaCorta } from "@/lib/formato";
import { acceso } from "@/lib/permisos";
import { useDatos } from "@/lib/store";
import type { Evento, Miembro, Ministerio } from "@/lib/types";
import { intentar, useCarga } from "@/lib/usar-carga";

export default function Ministerios() {
  const { usuario, repo, sedeId, hoy } = useDatos();
  const permiso = acceso(usuario!.rol, "ministerios");
  const cargar = useCallback(async () => {
    if (!permiso) return { ministerios: [], miembros: [], eventos: [] };
    const [ministerios, miembros, eventos] = await Promise.all([
      repo.ministerios.listar(sedeId),
      repo.miembros.listar(sedeId),
      repo.eventos.listar(sedeId),
    ]);
    return { ministerios, miembros, eventos };
  }, [repo, sedeId, permiso]);
  const { datos, cargando, error, recargar } = useCarga<{ ministerios: Ministerio[]; miembros: Miembro[]; eventos: Evento[] }>(
    cargar,
    { ministerios: [], miembros: [], eventos: [] }
  );
  const { ministerios, miembros, eventos } = datos;
  const misMinisterios = ministerios.filter((m) => usuario!.miembroId && m.coordinadorId === usuario!.miembroId);
  const [abiertoId, setAbiertoId] = useState<string | null>(null);
  const [nuevo, setNuevo] = useState<{ nombre: string; descripcion: string; coordinadorId: string } | null>(null);
  const [agregar, setAgregar] = useState("");
  const [errorAccion, setErrorAccion] = useState("");
  const [guardando, setGuardando] = useState(false);

  if (!permiso) return <SinAcceso />;

  const puedeCrear = permiso === "total" || permiso === "editar";
  const puedeEditar = (m: Ministerio) => puedeCrear || (permiso === "ministerio" && misMinisterios.some((x) => x.id === m.id));
  const nombre = (id?: string) => miembros.find((m) => m.id === id)?.nombre ?? "Sin asignar";
  const abierto = ministerios.find((m) => m.id === abiertoId);

  // Ejecuta un cambio, muestra el error si lo hubo y vuelve a cargar
  const ejecutar = async (accion: () => Promise<unknown>) => {
    setGuardando(true);
    const fallo = await intentar(accion);
    setGuardando(false);
    setErrorAccion(fallo);
    recargar();
    return !fallo;
  };

  const crear = async () => {
    if (!nuevo) return;
    if (!nuevo.nombre.trim()) return setErrorAccion("El nombre es obligatorio.");
    const datosNuevo = { nombre: nuevo.nombre.trim(), descripcion: nuevo.descripcion, coordinadorId: nuevo.coordinadorId || undefined };
    if (await ejecutar(() => repo.ministerios.crear(sedeId, datosNuevo))) setNuevo(null);
  };

  return (
    <>
      <Encabezado
        titulo="Ministerios"
        descripcion="Grupos de trabajo, sus coordinadores e integrantes"
        acciones={puedeCrear && <Boton variante="dorado" onClick={() => { setErrorAccion(""); setNuevo({ nombre: "", descripcion: "", coordinadorId: "" }); }}><Plus size={16} /> Nuevo ministerio</Boton>}
        dibujo={<Dibujo nombre="musicos" />}
        fondo="/pixel/fondo-ministerios.jpg"
      >
        <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
          {[
            ["Ministerios", ministerios.length],
            ["Personas sirviendo", new Set(ministerios.flatMap((m) => m.integrantes)).size],
            ["Actividades próximas", eventos.filter((e) => e.ministerioId && e.fecha >= hoy && !e.cancelado).length],
          ].map(([texto, valor]) => (
            <div key={texto}>
              <dt className="text-xs font-bold uppercase tracking-wider text-dorado-300">{texto}</dt>
              <dd className="font-titulo text-3xl font-semibold"><Contador valor={valor as number} /></dd>
            </div>
          ))}
        </dl>
      </Encabezado>
      {(error || (errorAccion && !abierto && !nuevo)) && (
        <p className="mb-4 bg-liston-50 px-3 py-2 text-sm text-liston-700">{error || errorAccion}</p>
      )}
      {!cargando && ministerios.length === 0 && (
        <Tarjeta className="p-8 text-center text-sm text-piedra-500">Esta sede todavía no tiene ministerios registrados.</Tarjeta>
      )}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {ministerios.map((m) => {
          const proximos = eventos.filter((e) => e.ministerioId === m.id && e.fecha >= hoy && !e.cancelado);
          const mio = misMinisterios.some((x) => x.id === m.id);
          return (
            <Tarjeta key={m.id} className="flex flex-col transition-transform hover:-translate-y-1">
              {/* Cabecera oscura con el nombre, como la tarjeta de un objeto en un juego */}
              <div className="flex items-start justify-between gap-2 border-b-2 border-piedra-900 bg-marca-900 px-5 py-3 text-white">
                <h2 className="font-titulo text-xl font-semibold leading-tight">{m.nombre}</h2>
                {mio && <span className="shrink-0 bg-dorado-300 px-2 py-0.5 text-xs font-bold text-piedra-950">Tu ministerio</span>}
              </div>
              <div className="flex flex-1 flex-col p-5">
                <p className="text-sm text-piedra-600">{m.descripcion}</p>
                <div className="mt-4 flex items-center gap-3 text-sm">
                  <Avatar nombre={nombre(m.coordinadorId)} />
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-piedra-500">Coordina</p>
                    <p className="font-semibold text-piedra-900">{nombre(m.coordinadorId)}</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {m.integrantes.slice(0, 5).map((id) => <Avatar key={id} nombre={nombre(id)} />)}
                  </div>
                  <span className="text-sm text-piedra-600">
                    {m.integrantes.length} {m.integrantes.length === 1 ? "integrante" : "integrantes"}
                  </span>
                </div>
                <div className="mt-4 flex items-center gap-2 border-2 border-piedra-200 bg-piedra-100 px-3 py-2 text-sm">
                  <CalendarDays size={16} className="shrink-0 text-piedra-500" />
                  {proximos[0] ? (
                    <span className="truncate"><strong>{fechaCorta(proximos[0].fecha)}</strong> · {proximos[0].titulo}</span>
                  ) : (
                    <span className="text-piedra-500">Sin actividades próximas</span>
                  )}
                </div>
                <div className="mt-auto pt-4">
                  <Boton variante="secundario" className="w-full" onClick={() => { setErrorAccion(""); setAbiertoId(m.id); }}>Ver integrantes</Boton>
                </div>
              </div>
            </Tarjeta>
          );
        })}
      </div>

      <Modal titulo={abierto?.nombre ?? ""} abierto={!!abierto} alCerrar={() => setAbiertoId(null)}>
        {abierto && (
          <>
            <Campo etiqueta="Coordinador">
              <Selector
                disabled={!puedeCrear || guardando}
                value={abierto.coordinadorId ?? ""}
                onChange={(e) => {
                  const coordinador = e.target.value || undefined;
                  ejecutar(() => repo.ministerios.cambiarCoordinador(abierto.id, coordinador));
                }}
              >
                <option value="">Sin asignar</option>
                {miembros.filter((x) => abierto.integrantes.includes(x.id)).map((x) => <option key={x.id} value={x.id}>{x.nombre}</option>)}
              </Selector>
            </Campo>
            {puedeEditar(abierto) && (
              <div className="flex gap-2">
                <Selector value={agregar} onChange={(e) => setAgregar(e.target.value)}>
                  <option value="">Vincular un miembro…</option>
                  {miembros.filter((x) => x.activo && !abierto.integrantes.includes(x.id)).map((x) => <option key={x.id} value={x.id}>{x.nombre}</option>)}
                </Selector>
                <Boton
                  disabled={!agregar || guardando}
                  onClick={async () => {
                    if (await ejecutar(() => repo.ministerios.agregarIntegrante(abierto.id, agregar))) setAgregar("");
                  }}
                >
                  Agregar
                </Boton>
              </div>
            )}
            <ul className="divide-y divide-piedra-200 border-2 border-piedra-300">
              {abierto.integrantes.map((id) => (
                <li key={id} className="flex items-center justify-between px-3 py-2 text-sm">
                  <span className="flex items-center gap-3">
                    <Avatar nombre={nombre(id)} />
                    {nombre(id)} {id === abierto.coordinadorId && <Etiqueta tono="marca">Coordinador</Etiqueta>}
                  </span>
                  {puedeEditar(abierto) && id !== abierto.coordinadorId && (
                    <button
                      className="text-piedra-400 hover:text-liston-600"
                      aria-label="Quitar del ministerio"
                      disabled={guardando}
                      onClick={() => ejecutar(() => repo.ministerios.quitarIntegrante(abierto.id, id))}
                    >
                      <UserMinus size={16} />
                    </button>
                  )}
                </li>
              ))}
            </ul>
            {errorAccion && <p className="text-sm text-liston-600">{errorAccion}</p>}
            <div>
              <h3 className="mb-2 font-titulo text-base font-semibold">Actividades programadas</h3>
              <ul className="space-y-1 text-sm text-piedra-600">
                {eventos
                  .filter((e) => e.ministerioId === abierto.id && e.fecha >= hoy && !e.cancelado)
                  .map((e) => <li key={e.id}>{fechaCorta(e.fecha)} · {e.hora} · {e.titulo}</li>)}
              </ul>
            </div>
          </>
        )}
      </Modal>

      <Modal
        titulo="Nuevo ministerio"
        abierto={!!nuevo}
        alCerrar={() => setNuevo(null)}
        pie={<><Boton variante="secundario" onClick={() => setNuevo(null)}>Cancelar</Boton><Boton disabled={guardando} onClick={crear}>Crear</Boton></>}
      >
        {nuevo && (
          <>
            <Campo etiqueta="Nombre"><Entrada value={nuevo.nombre} onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })} /></Campo>
            <Campo etiqueta="Descripción"><AreaTexto value={nuevo.descripcion} onChange={(e) => setNuevo({ ...nuevo, descripcion: e.target.value })} /></Campo>
            <Campo etiqueta="Coordinador">
              <Selector value={nuevo.coordinadorId} onChange={(e) => setNuevo({ ...nuevo, coordinadorId: e.target.value })}>
                <option value="">Sin asignar</option>
                {miembros.filter((x) => x.activo).map((x) => <option key={x.id} value={x.id}>{x.nombre}</option>)}
              </Selector>
            </Campo>
            {errorAccion && <p className="text-sm text-liston-600">{errorAccion}</p>}
          </>
        )}
      </Modal>
    </>
  );
}
